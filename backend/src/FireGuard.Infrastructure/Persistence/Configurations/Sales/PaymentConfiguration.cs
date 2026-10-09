using FireGuard.Domain.Entities.Sales;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Sales
{
    public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
    {
        public void Configure(EntityTypeBuilder<Payment> builder)
        {
            builder.ToTable("Payments");

            builder.HasKey(p => p.Id);

            builder.Property(p => p.PaymentNumber)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(p => p.PaymentMethod)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(p => p.ReferenceNumber)
                .HasMaxLength(100);

            builder.Property(p => p.Amount)
                .HasPrecision(18, 2);

            builder.Property(p => p.AttachmentUrl)
                .HasMaxLength(500);

            builder.HasIndex(p => p.PaymentNumber).IsUnique();

            builder.HasOne(p => p.Invoice)
                .WithMany()
                .HasForeignKey(p => p.InvoiceId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(p => p.Contract)
                .WithMany()
                .HasForeignKey(p => p.ContractId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
