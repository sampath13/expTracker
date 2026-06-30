namespace ExpTracker.Core.Interfaces;

public interface ITokenService
{
    Task<string> GenerateAccessTokenAsync(Guid userId, string email, CancellationToken cancellationToken = default);
}
