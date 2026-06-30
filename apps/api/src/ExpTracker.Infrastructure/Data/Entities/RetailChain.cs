namespace ExpTracker.Infrastructure.Data.Entities;

public class RetailChain
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Outlet> Outlets { get; set; } = new List<Outlet>();
}
