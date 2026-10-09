using FireGuard.Domain.Entities.CRM;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.CRM
{
    public class SurveyRequestConfiguration : IEntityTypeConfiguration<SurveyRequest>
    {
        public void Configure(EntityTypeBuilder<SurveyRequest> builder)
        {
            builder.ToTable("SurveyRequests");

            builder.HasKey(s => s.Id);

            builder.Property(s => s.RequestNumber)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(s => s.Status)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(s => s.BuildingType)
                .HasMaxLength(100);

            builder.Property(s => s.BuildingMaterial)
                .HasMaxLength(150);

            builder.Property(s => s.RiskLevel)
                .HasMaxLength(50);

            builder.Property(s => s.ExistingPcccSystem)
                .HasMaxLength(500);

            builder.Property(s => s.CustomerRequirements)
                .HasMaxLength(500);

            builder.Property(s => s.ResultNotes)
                .HasColumnType("text");

            builder.Property(s => s.CheckedInLatitude)
                .HasPrecision(11, 8);

            builder.Property(s => s.CheckedInLongitude)
                .HasPrecision(11, 8);

            builder.HasIndex(s => s.RequestNumber).IsUnique();

            builder.HasOne(s => s.Customer)
                .WithMany()
                .HasForeignKey(s => s.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(s => s.Address)
                .WithMany()
                .HasForeignKey(s => s.AddressId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
