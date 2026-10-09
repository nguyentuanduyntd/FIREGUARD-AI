using FireGuard.Domain.Entities.Sales;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Sales
{
    public class SalesOrderItemConfiguration : IEntityTypeConfiguration<SalesOrderItem>
    {
        public void Configure(EntityTypeBuilder<SalesOrderItem> builder)
        {
            builder.ToTable("SalesOrderItems");

            builder.HasKey(soi => soi.Id);

            builder.Property(soi => soi.UnitPrice)
                .HasPrecision(18, 2);

            builder.Property(soi => soi.TotalPrice)
                .HasPrecision(18, 2);

            builder.HasOne(soi => soi.Order)
                .WithMany(o => o.Items)
                .HasForeignKey(soi => soi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(soi => soi.Model)
                .WithMany()
                .HasForeignKey(soi => soi.ModelId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
