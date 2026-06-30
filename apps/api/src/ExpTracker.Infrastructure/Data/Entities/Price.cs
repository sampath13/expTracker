namespace ExpTracker.Infrastructure.Data.Entities;

public class Price
{
    public Guid Id { get; set; }

    public Guid ProductId { get; set; }

    public Guid ChainId { get; set; }

    public Guid? OutletId { get; set; }

    public decimal UnitPrice { get; set; }

    public string Unit { get; set; } = string.Empty;

    public string ObservedMonth { get; set; } = string.Empty;

    public string Source { get; set; } = "user_scan";

    public int ReceiptCount { get; set; } = 1;

    public DateTime LastObserved { get; set; } = DateTime.UtcNow;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Product Product { get; set; } = null!;

    public RetailChain Chain { get; set; } = null!;

    public Outlet? Outlet { get; set; }
}
