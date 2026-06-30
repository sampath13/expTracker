using ExpTracker.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace ExpTracker.Infrastructure.Data;

public static class SeedData
{
    public static async Task SeedAsync(
        PersonalBillsDbContext personalBillsContext,
        ComparisonPoolDbContext comparisonPoolContext,
        CancellationToken cancellationToken = default)
    {
        await SeedCategoriesAsync(comparisonPoolContext, cancellationToken);
        await SeedRetailChainsAsync(comparisonPoolContext, cancellationToken);

        await comparisonPoolContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task SeedCategoriesAsync(
        ComparisonPoolDbContext context,
        CancellationToken cancellationToken)
    {
        if (await context.Categories.AnyAsync(cancellationToken))
            return;

        var categories = new List<Category>
        {
            new() { Id = Guid.NewGuid(), Name = "Rice", KeywordPrefixes = new() { "rice", "basmati", "jasmine" }, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), Name = "Cooking Oil", KeywordPrefixes = new() { "oil", "ghee" }, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), Name = "Eggs", KeywordPrefixes = new() { "egg", "eggs" }, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), Name = "Milk", KeywordPrefixes = new() { "milk", "dairy" }, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), Name = "Bread", KeywordPrefixes = new() { "bread", "bun", "loaf" }, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), Name = "Chicken", KeywordPrefixes = new() { "chicken" }, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), Name = "Vegetables", KeywordPrefixes = new() { "vegetable", "veggie", "leafy", "spinach", "cabbage", "carrot", "potato", "onion", "tomato", "garlic" }, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), Name = "Fruits", KeywordPrefixes = new() { "fruit", "apple", "banana", "orange", "grape" }, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), Name = "Noodles", KeywordPrefixes = new() { "noodle", "pasta", "spaghetti", "macaroni", "vermicelli" }, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), Name = "Detergent", KeywordPrefixes = new() { "detergent", "soap", "washing", "tide", "surf" }, CreatedAt = DateTime.UtcNow },
        };

        context.Categories.AddRange(categories);
    }

    private static async Task SeedRetailChainsAsync(
        ComparisonPoolDbContext context,
        CancellationToken cancellationToken)
    {
        if (await context.RetailChains.AnyAsync(cancellationToken))
            return;

        var chains = new List<RetailChain>
        {
            new() { Id = Guid.NewGuid(), Name = "FairPrice", Slug = "fairprice", CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), Name = "Giant", Slug = "giant", CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), Name = "Sheng Siong", Slug = "sheng-siong", CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), Name = "Cold Storage", Slug = "cold-storage", CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), Name = "Prime Supermarket", Slug = "prime-supermarket", CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), Name = "Mustafa", Slug = "mustafa", CreatedAt = DateTime.UtcNow },
        };

        context.RetailChains.AddRange(chains);
    }
}
