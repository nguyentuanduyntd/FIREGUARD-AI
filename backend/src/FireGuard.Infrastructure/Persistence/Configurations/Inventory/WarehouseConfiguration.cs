using FireGuard.Domain.Entities.Inventory;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Inventory
{
    public class WarehouseConfiguration : IEntityTypeConfiguration<Warehouse>
    {
        public void Configure(EntityTypeBuilder<Warehouse> builder)
        {
            builder.ToTable("Warehouses");

            builder.HasKey(w => w.Id);

            builder.Property(w => w.Name)
                .IsRequired()
                .HasMaxLength(150);

            builder.Property(w => w.Address)
                .IsRequired()
                .HasMaxLength(250);

            builder.Property(w => w.ContactPerson)
                .HasMaxLength(100);

            builder.Property(w => w.ContactPhone)
                .HasMaxLength(20);
        }
    }
}
