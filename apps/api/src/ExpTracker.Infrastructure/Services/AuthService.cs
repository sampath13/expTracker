using System.Security.Cryptography;
using System.Text;
using ExpTracker.Core.Interfaces;
using ExpTracker.Core.Models;
using ExpTracker.Core.Models.Dtos;
using ExpTracker.Core.Models.Entities;
using ExpTracker.Infrastructure.Data;
using ExpTracker.Infrastructure.Data.Entities;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace ExpTracker.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly PersonalBillsDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;

    public AuthService(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        PersonalBillsDbContext context,
        ITokenService tokenService,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _context = context;
        _tokenService = tokenService;
        _configuration = configuration;
    }

    public async Task<Result> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
        {
            return Result.Failure(Error.Conflict("Email is already registered"));
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            UserName = request.Email,
            Email = request.Email,
            Mobile = request.Mobile,
            CommunityContribution = request.CommunityContribution,
            Tier = "free",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);

        if (!createResult.Succeeded)
        {
            var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
            return Result.Failure(Error.Validation(errors));
        }

        return Result.Success();
    }

    public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return Result.Failure<AuthResponse>(Error.Unauthorized("Invalid email or password"));
        }

        var signInResult = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        if (!signInResult.Succeeded)
        {
            return Result.Failure<AuthResponse>(Error.Unauthorized("Invalid email or password"));
        }

        return Result.Success(await IssueTokensAsync(user, cancellationToken));
    }

    public async Task<Result<AuthResponse>> GoogleLoginAsync(GoogleLoginRequest request, CancellationToken cancellationToken = default)
    {
        var clientId = _configuration["GoogleAuth:ClientId"];
        if (string.IsNullOrEmpty(clientId))
        {
            return Result.Failure<AuthResponse>(Error.Validation("Google authentication is not configured"));
        }

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken,
                new GoogleJsonWebSignature.ValidationSettings { Audience = new[] { clientId } });
        }
        catch
        {
            return Result.Failure<AuthResponse>(Error.Unauthorized("Invalid Google ID token"));
        }

        var googleId = payload.Subject;
        var email = payload.Email;

        if (string.IsNullOrEmpty(email))
        {
            return Result.Failure<AuthResponse>(Error.Validation("Google account must have an email address"));
        }

        var user = await _userManager.FindByLoginAsync("Google", googleId)
                    ?? await _userManager.FindByEmailAsync(email);

        if (user is not null)
        {
            if (string.IsNullOrEmpty(user.GoogleId))
            {
                user.GoogleId = googleId;
                user.UserName ??= email;
                var updateResult = await _userManager.UpdateAsync(user);
                if (!updateResult.Succeeded)
                {
                    return Result.Failure<AuthResponse>(Error.Validation("Failed to link Google account"));
                }
            }
        }
        else
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                UserName = email,
                Email = email,
                GoogleId = googleId,
                Mobile = null,
                CommunityContribution = true,
                Tier = "free",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            var createResult = await _userManager.CreateAsync(user);
            if (!createResult.Succeeded)
            {
                var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
                return Result.Failure<AuthResponse>(Error.Validation(errors));
            }
        }

        var response = await IssueTokensAsync(user, cancellationToken);
        var requiresMobile = string.IsNullOrEmpty(user.Mobile);

        return Result.Success(response with { RequiresMobile = requiresMobile });
    }

    public async Task<Result<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var tokenHash = HashRefreshToken(request.RefreshToken);

        var storedToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash, cancellationToken);

        if (storedToken is null)
        {
            return Result.Failure<AuthResponse>(Error.Unauthorized("Invalid refresh token"));
        }

        if (storedToken.RevokedAt is not null)
        {
            return Result.Failure<AuthResponse>(Error.Unauthorized("Refresh token has been revoked"));
        }

        if (storedToken.ExpiresAt <= DateTime.UtcNow)
        {
            return Result.Failure<AuthResponse>(Error.Unauthorized("Refresh token has expired"));
        }

        storedToken.RevokedAt = DateTime.UtcNow;

        var response = await IssueTokensAsync(storedToken.User, cancellationToken);

        return Result.Success(response);
    }

    private async Task<AuthResponse> IssueTokensAsync(User user, CancellationToken cancellationToken)
    {
        var accessToken = await _tokenService.GenerateAccessTokenAsync(user.Id, user.Email!, cancellationToken);

        var refreshTokenValue = GenerateRefreshTokenValue();
        var tokenHash = HashRefreshToken(refreshTokenValue);
        var expiryDays = int.Parse(_configuration["Jwt:RefreshTokenExpiryDays"] ?? "30");

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(expiryDays),
            CreatedAt = DateTime.UtcNow,
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new AuthResponse(
            AccessToken: accessToken,
            RefreshToken: refreshTokenValue,
            User: new UserResponse(
                Id: user.Id,
                Email: user.Email!,
                Mobile: user.Mobile,
                Tier: user.Tier,
                CommunityContribution: user.CommunityContribution));
    }

    private static string GenerateRefreshTokenValue()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    private static string HashRefreshToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }
}