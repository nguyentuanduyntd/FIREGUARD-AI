using FireGuard.Domain.Entities.Inventory;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Inventory
{
    public class StockIssueItemConfiguration : IEntityTypeConfiguration<StockIssueItem>
    {
        public void Configure(EntityTypeBuilder<StockIssueItem> builder)
        {
            builder.ToTable("StockIssueItems");

            builder.HasKey(ii => ii.Id);

            builder.Property(ii => ii.UnitPrice)
                .HasPrecision(18, 2);

            builder.Property(ii => ii.SerialNumbers)
                .HasColumnType("text");

            builder.HasOne(ii => ii.Issue)
                .WithMany(i => i.Items)
                .HasForeignKey(ii => ii.IssueId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(ii => ii.Model)
                .WithMany()
                .HasForeignKey(ii => ii.ModelId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
