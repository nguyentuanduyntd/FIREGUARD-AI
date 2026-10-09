using FireGuard.Domain.Entities.Sales;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Sales
{
    public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
    {
        public void Configure(EntityTypeBuilder<Invoice> builder)
        {
            builder.ToTable("Invoices");

            builder.HasKey(i => i.Id);

            builder.Property(i => i.InvoiceNumber)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(i => i.Status)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(i => i.TaxCode)
                .HasMaxLength(50);

            builder.Property(i => i.SubTotal)
                .HasPrecision(18, 2);

            builder.Property(i => i.VatRate)
                .HasPrecision(5, 2);

            builder.Property(i => i.VatAmount)
                .HasPrecision(18, 2);

            builder.Property(i => i.TotalAmount)
                .HasPrecision(18, 2);

            builder.Property(i => i.AmountPaid)
                .HasPrecision(18, 2)
                .HasDefaultValue(0);

            builder.Property(i => i.DebtRemaining)
                .HasPrecision(18, 2);

            builder.Property(i => i.Notes)
                .HasMaxLength(500);

            builder.HasIndex(i => i.InvoiceNumber).IsUnique();

            builder.HasOne(i => i.Customer)
                .WithMany()
                .HasForeignKey(i => i.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(i => i.SalesOrder)
                .WithMany()
                .HasForeignKey(i => i.SalesOrderId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(i => i.Contract)
                .WithMany()
                .HasForeignKey(i => i.ContractId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
