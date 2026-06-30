namespace ExpTracker.Infrastructure.Data.Entities;

public class BillItem
{
    public Guid Id { get; set; }

    public Guid BillId { get; set; }

    public string RawText { get; set; } = string.Empty;

    public string? MatchedName { get; set; }

    public decimal Qty { get; set; }

    public string? Unit { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal Total { get; set; }

    public decimal? Confidence { get; set; }

    public Guid? CanonicalProductId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Bill Bill { get; set; } = null!;
}
