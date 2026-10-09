using FireGuard.Domain.Entities.Sales;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Sales
{
    public class QuotationConfiguration : IEntityTypeConfiguration<Quotation>
    {
        public void Configure(EntityTypeBuilder<Quotation> builder)
        {
            builder.ToTable("Quotations");

            builder.HasKey(q => q.Id);

            builder.Property(q => q.QuotationNumber)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(q => q.Status)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(q => q.SubTotal)
                .HasPrecision(18, 2);

            builder.Property(q => q.DiscountAmount)
                .HasPrecision(18, 2);

            builder.Property(q => q.VatRate)
                .HasPrecision(5, 2);

            builder.Property(q => q.VatAmount)
                .HasPrecision(18, 2);

            builder.Property(q => q.TotalAmount)
                .HasPrecision(18, 2);

            builder.Property(q => q.Notes)
                .HasMaxLength(500);

            builder.HasIndex(q => new { q.QuotationNumber, q.Version }).IsUnique();

            builder.HasOne(q => q.Customer)
                .WithMany()
                .HasForeignKey(q => q.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(q => q.ParentQuotation)
                .WithMany()
                .HasForeignKey(q => q.ParentQuotationId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
