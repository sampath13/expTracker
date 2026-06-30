using ExpTracker.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExpTracker.Infrastructure.Data.Configurations;

public class ConsentAuditLogConfiguration : IEntityTypeConfiguration<ConsentAuditLog>
{
    public void Configure(EntityTypeBuilder<ConsentAuditLog> builder)
    {
        builder.ToTable("consent_audit_logs");

        builder.HasKey(ca => ca.Id);

        builder.HasOne(ca => ca.User)
            .WithMany()
            .HasForeignKey(ca => ca.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
