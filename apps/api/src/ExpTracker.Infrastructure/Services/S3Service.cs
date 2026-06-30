using ExpTracker.Core.Interfaces;

namespace ExpTracker.Infrastructure.Services;

public class S3Service : IS3Service
{
    public Task<string> GeneratePresignedUploadUrlAsync(string objectKey, int expiryMinutes, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }
}
