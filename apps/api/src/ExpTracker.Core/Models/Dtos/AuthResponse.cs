namespace ExpTracker.Core.Models.Dtos;

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    UserResponse User,
    bool RequiresMobile = false);

public record UserResponse(
    Guid Id,
    string Email,
    string? Mobile,
    string Tier,
    bool CommunityContribution);