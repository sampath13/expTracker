namespace ExpTracker.Core.Interfaces;

public interface IPriceLookupService
{
    Task<decimal> GetLowestPriceAsync(string productName, CancellationToken cancellationToken = default);
}
