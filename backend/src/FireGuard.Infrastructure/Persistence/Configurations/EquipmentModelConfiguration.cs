using FireGuard.Domain.Entities.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations
{
    public class EquipmentModelConfiguration : IEntityTypeConfiguration<EquipmentModel>
    {
        public void Configure(EntityTypeBuilder<EquipmentModel> builder)
        {
            builder.ToTable("EquipmentModels");

            builder.HasKey(x => x.Id);
            builder.Property(x => x.Id).HasMaxLength(36);

            builder.Property(x => x.CategoryId).HasMaxLength(36).IsRequired();
            builder.Property(x => x.ModelCode).HasMaxLength(100).IsRequired();
            builder.HasIndex(x => x.ModelCode).IsUnique();

            builder.Property(x => x.Name).HasMaxLength(250).IsRequired();
            builder.Property(x => x.Specifications).HasColumnType("TEXT");

            builder.HasOne(x => x.Category)
                .WithMany(x => x.EquipmentModels)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Property(x => x.CreatedBy).HasMaxLength(100).IsRequired();
        }
    }
}
