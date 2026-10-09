using FireGuard.Domain.Entities.Inventory;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Inventory
{
    public class StockIssueConfiguration : IEntityTypeConfiguration<StockIssue>
    {
        public void Configure(EntityTypeBuilder<StockIssue> builder)
        {
            builder.ToTable("StockIssues");

            builder.HasKey(i => i.Id);

            builder.Property(i => i.IssueNumber)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(i => i.IssueType)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(i => i.Status)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(i => i.Notes)
                .HasMaxLength(500);

            builder.HasIndex(i => i.IssueNumber).IsUnique();

            builder.HasOne(i => i.Warehouse)
                .WithMany()
                .HasForeignKey(i => i.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(i => i.Customer)
                .WithMany()
                .HasForeignKey(i => i.CustomerId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
