using FireGuard.Domain.Entities.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations
{
    public class EquipmentQRCodeConfiguration : IEntityTypeConfiguration<EquipmentQRCode>
    {
        public void Configure(EntityTypeBuilder<EquipmentQRCode> builder)
        {
            builder.ToTable("EquipmentQRCodes");

            builder.HasKey(x => x.Id);
            builder.Property(x => x.Id).HasMaxLength(36);

            builder.Property(x => x.AssetId).HasMaxLength(36).IsRequired();
            builder.Property(x => x.QRCodePayload).HasMaxLength(500).IsRequired();
            builder.HasIndex(x => x.QRCodePayload).IsUnique();

            builder.HasOne(x => x.Asset)
                .WithOne(x => x.QRCode)
                .HasForeignKey<EquipmentQRCode>(x => x.AssetId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Property(x => x.CreatedBy).HasMaxLength(100).IsRequired();
        }
    }
}
