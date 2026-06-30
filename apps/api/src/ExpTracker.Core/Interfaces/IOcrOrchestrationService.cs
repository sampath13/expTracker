namespace ExpTracker.Core.Interfaces;

public interface IOcrOrchestrationService
{
    Task<string> ProcessReceiptAsync(string objectKey, CancellationToken cancellationToken = default);
}
