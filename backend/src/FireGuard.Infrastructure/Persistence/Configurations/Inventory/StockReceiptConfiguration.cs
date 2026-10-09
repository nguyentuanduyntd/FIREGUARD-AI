using FireGuard.Domain.Entities.Inventory;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Inventory
{
    public class StockReceiptConfiguration : IEntityTypeConfiguration<StockReceipt>
    {
        public void Configure(EntityTypeBuilder<StockReceipt> builder)
        {
            builder.ToTable("StockReceipts");

            builder.HasKey(r => r.Id);

            builder.Property(r => r.ReceiptNumber)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(r => r.ReceiptType)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(r => r.Status)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(r => r.Notes)
                .HasMaxLength(500);

            builder.HasIndex(r => r.ReceiptNumber).IsUnique();

            builder.HasOne(r => r.Warehouse)
                .WithMany()
                .HasForeignKey(r => r.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(r => r.Supplier)
                .WithMany()
                .HasForeignKey(r => r.SupplierId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
