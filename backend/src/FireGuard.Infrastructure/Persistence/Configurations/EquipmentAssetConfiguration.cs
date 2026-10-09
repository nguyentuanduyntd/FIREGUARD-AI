using FireGuard.Domain.Entities.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations
{
    public class EquipmentAssetConfiguration : IEntityTypeConfiguration<EquipmentAsset>
    {
        public void Configure(EntityTypeBuilder<EquipmentAsset> builder)
        {
            builder.ToTable("EquipmentAssets");

            builder.HasKey(x => x.Id);
            builder.Property(x => x.Id).HasMaxLength(36);

            builder.Property(x => x.ModelId).HasMaxLength(36).IsRequired();

            builder.Property(x => x.SerialNumber).HasMaxLength(150).IsRequired();
            builder.HasIndex(x => x.SerialNumber).IsUnique();

            builder.Property(x => x.Status)
                .HasConversion<string>()
                .HasMaxLength(50)
                .IsRequired();

            builder.Property(x => x.PurchasePrice).HasPrecision(18, 2);
            builder.Property(x => x.WarrantyPeriodMonths).IsRequired();

            builder.HasOne(x => x.Model)
                .WithMany(x => x.EquipmentAssets)
                .HasForeignKey(x => x.ModelId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Property(x => x.CreatedBy).HasMaxLength(100).IsRequired();
            builder.Property(x => x.LastModifiedBy).HasMaxLength(100);
            builder.Property(x => x.DeletedBy).HasMaxLength(100);
        }
    }
}
