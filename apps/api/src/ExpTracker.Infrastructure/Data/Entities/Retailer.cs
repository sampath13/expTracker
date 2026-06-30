namespace ExpTracker.Infrastructure.Data.Entities;

public class Retailer
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public Guid? ChainId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
