namespace ExpTracker.Infrastructure.Data.Entities;

public class Category
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public List<string> KeywordPrefixes { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Product> Products { get; set; } = new List<Product>();
}
