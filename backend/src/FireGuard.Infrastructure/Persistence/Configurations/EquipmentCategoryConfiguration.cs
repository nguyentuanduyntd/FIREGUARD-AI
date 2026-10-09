using FireGuard.Domain.Entities.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations
{
    public class EquipmentCategoryConfiguration : IEntityTypeConfiguration<EquipmentCategory>
    {
        public void Configure(EntityTypeBuilder<EquipmentCategory> builder)
        {
            builder.ToTable("EquipmentCategories");

            builder.HasKey(x => x.Id);
            builder.Property(x => x.Id).HasMaxLength(36);

            builder.Property(x => x.Name).HasMaxLength(150).IsRequired();
            builder.Property(x => x.Description).HasMaxLength(500);

            builder.Property(x => x.CreatedBy).HasMaxLength(100).IsRequired();
        }
    }
}
