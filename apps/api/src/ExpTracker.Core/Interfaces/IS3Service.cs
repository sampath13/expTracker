namespace ExpTracker.Core.Interfaces;

public interface IS3Service
{
    Task<string> GeneratePresignedUploadUrlAsync(string objectKey, int expiryMinutes, CancellationToken cancellationToken = default);
}
