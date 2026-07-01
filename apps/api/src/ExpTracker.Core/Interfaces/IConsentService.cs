using ExpTracker.Core.Models;
using ExpTracker.Core.Models.Dtos;

namespace ExpTracker.Core.Interfaces;

public interface IConsentService
{
    Task<Result<ConsentResponse>> GetConsentAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<Result<ConsentResponse>> UpdateConsentAsync(Guid userId, UpdateConsentRequest request, CancellationToken cancellationToken = default);
}