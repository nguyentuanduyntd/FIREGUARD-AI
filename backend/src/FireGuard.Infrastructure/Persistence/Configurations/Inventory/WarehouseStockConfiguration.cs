using FireGuard.Domain.Entities.Inventory;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Inventory
{
    public class WarehouseStockConfiguration : IEntityTypeConfiguration<WarehouseStock>
    {
        public void Configure(EntityTypeBuilder<WarehouseStock> builder)
        {
            builder.ToTable("WarehouseStocks");

            builder.HasKey(ws => ws.Id);

            builder.HasIndex(ws => new { ws.WarehouseId, ws.ModelId }).IsUnique();

            builder.Property(ws => ws.Quantity)
                .IsRequired();

            // Optimistic concurrency token (RowVersion)
            builder.Property(ws => ws.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();

            builder.HasOne(ws => ws.Warehouse)
                .WithMany(w => w.Stocks)
                .HasForeignKey(ws => ws.WarehouseId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(ws => ws.Model)
                .WithMany()
                .HasForeignKey(ws => ws.ModelId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
