using ExpTracker.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExpTracker.Infrastructure.Data.Configurations;

public class BillItemConfiguration : IEntityTypeConfiguration<BillItem>
{
    public void Configure(EntityTypeBuilder<BillItem> builder)
    {
        builder.ToTable("bill_items");

        builder.HasKey(bi => bi.Id);

        builder.Property(bi => bi.Qty)
            .HasColumnType("decimal(10,3)")
            .IsRequired();

        builder.Property(bi => bi.UnitPrice)
            .HasColumnType("decimal(10,2)")
            .IsRequired();

        builder.Property(bi => bi.Total)
            .HasColumnType("decimal(10,2)")
            .IsRequired();

        builder.Property(bi => bi.Confidence)
            .HasColumnType("decimal(3,2)");

        builder.HasOne(bi => bi.Bill)
            .WithMany(b => b.Items)
            .HasForeignKey(bi => bi.BillId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
