using FireGuard.Domain.Entities.Sales;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Sales
{
    public class SalesOrderConfiguration : IEntityTypeConfiguration<SalesOrder>
    {
        public void Configure(EntityTypeBuilder<SalesOrder> builder)
        {
            builder.ToTable("SalesOrders");

            builder.HasKey(so => so.Id);

            builder.Property(so => so.OrderNumber)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(so => so.Status)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(so => so.TotalAmount)
                .HasPrecision(18, 2);

            builder.Property(so => so.Notes)
                .HasMaxLength(500);

            builder.HasIndex(so => so.OrderNumber).IsUnique();

            builder.HasOne(so => so.Customer)
                .WithMany()
                .HasForeignKey(so => so.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
