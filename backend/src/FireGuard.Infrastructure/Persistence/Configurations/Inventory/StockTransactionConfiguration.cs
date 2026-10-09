using FireGuard.Domain.Entities.Inventory;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Inventory
{
    public class StockTransactionConfiguration : IEntityTypeConfiguration<StockTransaction>
    {
        public void Configure(EntityTypeBuilder<StockTransaction> builder)
        {
            builder.ToTable("StockTransactions");

            builder.HasKey(t => t.Id);

            builder.Property(t => t.ReferenceNumber)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(t => t.TransactionType)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(t => t.Notes)
                .HasMaxLength(250);

            builder.HasOne(t => t.Warehouse)
                .WithMany()
                .HasForeignKey(t => t.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(t => t.Model)
                .WithMany()
                .HasForeignKey(t => t.ModelId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
