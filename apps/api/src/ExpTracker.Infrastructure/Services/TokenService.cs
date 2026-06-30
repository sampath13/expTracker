using ExpTracker.Core.Interfaces;

namespace ExpTracker.Infrastructure.Services;

public class TokenService : ITokenService
{
    public Task<string> GenerateAccessTokenAsync(Guid userId, string email, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }
}
