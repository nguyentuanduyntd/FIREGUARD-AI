using FireGuard.Domain.Entities.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Services
{
    public class ServiceRequestConfiguration : IEntityTypeConfiguration<ServiceRequest>
    {
        public void Configure(EntityTypeBuilder<ServiceRequest> builder)
        {
            builder.ToTable("ServiceRequests");

            builder.HasKey(s => s.Id);

            builder.Property(s => s.RequestNumber)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(s => s.Status)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(s => s.RequestType)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(s => s.Urgency)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(s => s.QRCodeValue)
                .HasMaxLength(150);

            builder.Property(s => s.Description)
                .IsRequired()
                .HasMaxLength(500);

            // Optimistic concurrency token
            builder.Property(s => s.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken();

            builder.HasIndex(s => s.RequestNumber).IsUnique();

            builder.HasOne(s => s.Customer)
                .WithMany()
                .HasForeignKey(s => s.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(s => s.Address)
                .WithMany()
                .HasForeignKey(s => s.AddressId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(s => s.EquipmentAsset)
                .WithMany()
                .HasForeignKey(s => s.EquipmentAssetId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
