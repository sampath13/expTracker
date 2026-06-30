using ExpTracker.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExpTracker.Infrastructure.Data.Configurations;

public class OutletConfiguration : IEntityTypeConfiguration<Outlet>
{
    public void Configure(EntityTypeBuilder<Outlet> builder)
    {
        builder.ToTable("outlets");

        builder.HasKey(o => o.Id);

        builder.HasIndex(o => o.ChainId);

        builder.HasOne(o => o.Chain)
            .WithMany(rc => rc.Outlets)
            .HasForeignKey(o => o.ChainId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
