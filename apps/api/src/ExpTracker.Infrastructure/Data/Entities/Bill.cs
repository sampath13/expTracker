using ExpTracker.Core.Models.Entities;

namespace ExpTracker.Infrastructure.Data.Entities;

public class Bill
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid? RetailerId { get; set; }

    public string? OutletName { get; set; }

    public decimal Total { get; set; }

    public decimal Gst { get; set; }

    public DateTime ConfirmedAt { get; set; } = DateTime.UtcNow;

    public bool IsDeleted { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public User User { get; set; } = null!;

    public Retailer? Retailer { get; set; }

    public ICollection<BillItem> Items { get; set; } = new List<BillItem>();
}
