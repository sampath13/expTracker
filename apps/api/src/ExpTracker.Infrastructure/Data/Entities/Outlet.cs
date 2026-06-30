namespace ExpTracker.Infrastructure.Data.Entities;

public class Outlet
{
    public Guid Id { get; set; }

    public Guid ChainId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Address { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public RetailChain Chain { get; set; } = null!;
}
