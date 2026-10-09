using FireGuard.Domain.Entities.Inventory;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Inventory
{
    public class StockReceiptItemConfiguration : IEntityTypeConfiguration<StockReceiptItem>
    {
        public void Configure(EntityTypeBuilder<StockReceiptItem> builder)
        {
            builder.ToTable("StockReceiptItems");

            builder.HasKey(ri => ri.Id);

            builder.Property(ri => ri.UnitPrice)
                .HasPrecision(18, 2);

            builder.Property(ri => ri.SerialNumbers)
                .HasColumnType("text");

            builder.HasOne(ri => ri.Receipt)
                .WithMany(r => r.Items)
                .HasForeignKey(ri => ri.ReceiptId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(ri => ri.Model)
                .WithMany()
                .HasForeignKey(ri => ri.ModelId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
