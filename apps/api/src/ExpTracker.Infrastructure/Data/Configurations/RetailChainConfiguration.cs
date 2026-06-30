using ExpTracker.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExpTracker.Infrastructure.Data.Configurations;

public class RetailChainConfiguration : IEntityTypeConfiguration<RetailChain>
{
    public void Configure(EntityTypeBuilder<RetailChain> builder)
    {
        builder.ToTable("retail_chains");

        builder.HasKey(rc => rc.Id);

        builder.HasIndex(rc => rc.Slug)
            .IsUnique();
    }
}
