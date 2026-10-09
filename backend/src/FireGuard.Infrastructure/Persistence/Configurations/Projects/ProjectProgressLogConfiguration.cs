using FireGuard.Domain.Entities.Projects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Projects
{
    public class ProjectProgressLogConfiguration : IEntityTypeConfiguration<ProjectProgressLog>
    {
        public void Configure(EntityTypeBuilder<ProjectProgressLog> builder)
        {
            builder.ToTable("ProjectProgressLogs");

            builder.HasKey(pl => pl.Id);

            builder.Property(pl => pl.Notes)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(pl => pl.ImageUrl)
                .HasMaxLength(500);

            builder.HasOne(pl => pl.Project)
                .WithMany(p => p.ProgressLogs)
                .HasForeignKey(pl => pl.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
