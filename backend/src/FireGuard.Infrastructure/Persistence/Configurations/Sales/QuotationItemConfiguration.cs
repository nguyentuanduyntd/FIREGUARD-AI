using FireGuard.Domain.Entities.Sales;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Sales
{
    public class QuotationItemConfiguration : IEntityTypeConfiguration<QuotationItem>
    {
        public void Configure(EntityTypeBuilder<QuotationItem> builder)
        {
            builder.ToTable("QuotationItems");

            builder.HasKey(qi => qi.Id);

            builder.Property(qi => qi.ItemType)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(qi => qi.Name)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(qi => qi.UnitPrice)
                .HasPrecision(18, 2);

            builder.Property(qi => qi.TotalPrice)
                .HasPrecision(18, 2);

            builder.HasOne(qi => qi.Quotation)
                .WithMany(q => q.Items)
                .HasForeignKey(qi => qi.QuotationId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(qi => qi.Model)
                .WithMany()
                .HasForeignKey(qi => qi.ModelId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
