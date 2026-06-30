using ExpTracker.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExpTracker.Infrastructure.Data.Configurations;

public class PriceConfiguration : IEntityTypeConfiguration<Price>
{
    public void Configure(EntityTypeBuilder<Price> builder)
    {
        builder.ToTable("prices");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.UnitPrice)
            .HasColumnType("decimal(10,2)")
            .IsRequired();

        builder.HasIndex(p => new { p.ProductId, p.ChainId, p.ObservedMonth });

        builder.HasOne(p => p.Product)
            .WithMany(pr => pr.Prices)
            .HasForeignKey(p => p.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Chain)
            .WithMany()
            .HasForeignKey(p => p.ChainId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Outlet)
            .WithMany()
            .HasForeignKey(p => p.OutletId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
