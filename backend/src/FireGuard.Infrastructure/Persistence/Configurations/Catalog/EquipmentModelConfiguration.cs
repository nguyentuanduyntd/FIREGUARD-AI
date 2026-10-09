using FireGuard.Domain.Entities.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Catalog
{
    public class EquipmentModelConfiguration : IEntityTypeConfiguration<EquipmentModel>
    {
        public void Configure(EntityTypeBuilder<EquipmentModel> builder)
        {
            builder.ToTable("EquipmentModels");

            builder.HasKey(m => m.Id);

            builder.Property(m => m.ModelCode)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(m => m.Name)
                .IsRequired()
                .HasMaxLength(150);

            builder.Property(m => m.Description)
                .HasMaxLength(500);

            builder.Property(m => m.PurchasePrice)
                .HasPrecision(18, 2);

            builder.Property(m => m.SellingPrice)
                .HasPrecision(18, 2);

            builder.Property(m => m.ImageUrl)
                .HasMaxLength(500);

            builder.Property(m => m.Specifications)
                .HasColumnType("text");

            builder.HasIndex(m => m.ModelCode).IsUnique();

            // Relations
            builder.HasOne(m => m.Category)
                .WithMany(c => c.EquipmentModels)
                .HasForeignKey(m => m.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(m => m.Brand)
                .WithMany(b => b.EquipmentModels)
                .HasForeignKey(m => m.BrandId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(m => m.Unit)
                .WithMany(u => u.EquipmentModels)
                .HasForeignKey(m => m.UnitId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(m => m.Supplier)
                .WithMany(s => s.EquipmentModels)
                .HasForeignKey(m => m.SupplierId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
