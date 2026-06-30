using ExpTracker.Core.Models.Entities;
using ExpTracker.Infrastructure.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ExpTracker.Infrastructure.Data;

public class PersonalBillsDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
{
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<Bill> Bills => Set<Bill>();

    public DbSet<BillItem> BillItems => Set<BillItem>();

    public DbSet<Retailer> Retailers => Set<Retailer>();

    public DbSet<ConsentAuditLog> ConsentAuditLogs => Set<ConsentAuditLog>();

    public PersonalBillsDbContext(DbContextOptions<PersonalBillsDbContext> options)
        : base(options) { }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(PersonalBillsDbContext).Assembly);
    }
}
