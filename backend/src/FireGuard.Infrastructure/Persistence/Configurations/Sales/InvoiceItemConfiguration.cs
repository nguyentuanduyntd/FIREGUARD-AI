using FireGuard.Domain.Entities.Sales;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Sales
{
    public class InvoiceItemConfiguration : IEntityTypeConfiguration<InvoiceItem>
    {
        public void Configure(EntityTypeBuilder<InvoiceItem> builder)
        {
            builder.ToTable("InvoiceItems");

            builder.HasKey(ii => ii.Id);

            builder.Property(ii => ii.Description)
                .IsRequired()
                .HasMaxLength(250);

            builder.Property(ii => ii.UnitPrice)
                .HasPrecision(18, 2);

            builder.Property(ii => ii.TotalPrice)
                .HasPrecision(18, 2);

            builder.HasOne(ii => ii.Invoice)
                .WithMany(i => i.Items)
                .HasForeignKey(ii => ii.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
