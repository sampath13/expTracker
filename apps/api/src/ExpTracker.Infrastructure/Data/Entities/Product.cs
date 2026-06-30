namespace ExpTracker.Infrastructure.Data.Entities;

public class Product
{
    public Guid Id { get; set; }

    public string CanonicalName { get; set; } = string.Empty;

    public Guid CategoryId { get; set; }

    public string? TypicalUnit { get; set; }

    public List<string> Aliases { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public Category Category { get; set; } = null!;

    public ICollection<Price> Prices { get; set; } = new List<Price>();
}
