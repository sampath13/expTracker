using ExpTracker.Core.Models.Entities;
using ExpTracker.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExpTracker.Infrastructure.Data.Configurations;

public class BillConfiguration : IEntityTypeConfiguration<Bill>
{
    public void Configure(EntityTypeBuilder<Bill> builder)
    {
        builder.ToTable("bills");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.Total)
            .HasColumnType("decimal(10,2)")
            .IsRequired();

        builder.Property(b => b.Gst)
            .HasColumnType("decimal(10,2)")
            .IsRequired();

        builder.Property(b => b.IsDeleted)
            .HasDefaultValue(false);

        builder.HasIndex(b => new { b.UserId, b.ConfirmedAt });

        builder.HasOne(b => b.User)
            .WithMany()
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.Retailer)
            .WithMany()
            .HasForeignKey(b => b.RetailerId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
