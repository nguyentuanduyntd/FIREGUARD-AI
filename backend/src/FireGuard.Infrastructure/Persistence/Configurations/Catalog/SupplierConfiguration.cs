using FireGuard.Domain.Entities.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Catalog
{
    public class SupplierConfiguration : IEntityTypeConfiguration<Supplier>
    {
        public void Configure(EntityTypeBuilder<Supplier> builder)
        {
            builder.ToTable("Suppliers");

            builder.HasKey(s => s.Id);

            builder.Property(s => s.Name)
                .IsRequired()
                .HasMaxLength(150);

            builder.Property(s => s.TaxCode)
                .HasMaxLength(50);

            builder.Property(s => s.Email)
                .HasMaxLength(100);

            builder.Property(s => s.Phone)
                .HasMaxLength(20);

            builder.Property(s => s.Address)
                .HasMaxLength(250);
        }
    }
}
