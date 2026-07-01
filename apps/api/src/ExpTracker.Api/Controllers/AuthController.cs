using ExpTracker.Core.Interfaces;
using ExpTracker.Core.Models.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace ExpTracker.Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.RegisterAsync(request, cancellationToken);

        if (result.IsSuccess)
        {
            return Ok(new { message = "Registration successful" });
        }

        return result.Error!.Code switch
        {
            "Conflict" => Conflict(new { error = result.Error.Description }),
            "Validation" => BadRequest(new { error = result.Error.Description }),
            _ => StatusCode(500, new { error = "An unexpected error occurred" }),
        };
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(request, cancellationToken);

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return result.Error!.Code switch
        {
            "Unauthorized" => Unauthorized(new { error = result.Error.Description }),
            _ => StatusCode(500, new { error = "An unexpected error occurred" }),
        };
    }

    [HttpPost("google")]
    public async Task<ActionResult<AuthResponse>> GoogleLogin(GoogleLoginRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.GoogleLoginAsync(request, cancellationToken);

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return result.Error!.Code switch
        {
            "Unauthorized" => Unauthorized(new { error = result.Error.Description }),
            "Validation" => BadRequest(new { error = result.Error.Description }),
            _ => StatusCode(500, new { error = "An unexpected error occurred" }),
        };
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> RefreshToken(RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.RefreshTokenAsync(request, cancellationToken);

        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return result.Error!.Code switch
        {
            "Unauthorized" => Unauthorized(new { error = result.Error.Description }),
            _ => StatusCode(500, new { error = "An unexpected error occurred" }),
        };
    }
}