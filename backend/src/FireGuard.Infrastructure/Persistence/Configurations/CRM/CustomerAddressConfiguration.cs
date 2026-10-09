using FireGuard.Domain.Entities.CRM;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.CRM
{
    public class CustomerAddressConfiguration : IEntityTypeConfiguration<CustomerAddress>
    {
        public void Configure(EntityTypeBuilder<CustomerAddress> builder)
        {
            builder.ToTable("CustomerAddresses");

            builder.HasKey(a => a.Id);

            builder.Property(a => a.AddressLine)
                .IsRequired()
                .HasMaxLength(250);

            builder.Property(a => a.Ward)
                .HasMaxLength(100);

            builder.Property(a => a.District)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(a => a.City)
                .IsRequired()
                .HasMaxLength(100);

            // High precision coordinates for GIS maps
            builder.Property(a => a.Latitude)
                .HasPrecision(11, 8);

            builder.Property(a => a.Longitude)
                .HasPrecision(11, 8);
        }
    }
}
