using ExpTracker.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace ExpTracker.Infrastructure.Data;

public class ComparisonPoolDbContext : DbContext
{
    public DbSet<Category> Categories => Set<Category>();

    public DbSet<Product> Products => Set<Product>();

    public DbSet<RetailChain> RetailChains => Set<RetailChain>();

    public DbSet<Outlet> Outlets => Set<Outlet>();

    public DbSet<Price> Prices => Set<Price>();

    public ComparisonPoolDbContext(DbContextOptions<ComparisonPoolDbContext> options)
        : base(options) { }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.ApplyConfigurationsFromAssembly(typeof(ComparisonPoolDbContext).Assembly);
    }
}
