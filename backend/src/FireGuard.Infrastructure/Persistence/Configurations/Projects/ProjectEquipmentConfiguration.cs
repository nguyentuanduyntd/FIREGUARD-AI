using FireGuard.Domain.Entities.Projects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Projects
{
    public class ProjectEquipmentConfiguration : IEntityTypeConfiguration<ProjectEquipment>
    {
        public void Configure(EntityTypeBuilder<ProjectEquipment> builder)
        {
            builder.ToTable("ProjectEquipments");

            builder.HasKey(pe => pe.Id);

            builder.Property(pe => pe.LocationName)
                .HasMaxLength(150);

            builder.HasOne(pe => pe.Project)
                .WithMany(p => p.Installations)
                .HasForeignKey(pe => pe.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(pe => pe.Model)
                .WithMany()
                .HasForeignKey(pe => pe.ModelId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(pe => pe.EquipmentAsset)
                .WithMany()
                .HasForeignKey(pe => pe.EquipmentAssetId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
