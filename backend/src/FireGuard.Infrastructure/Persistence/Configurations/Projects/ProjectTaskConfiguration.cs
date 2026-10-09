using FireGuard.Domain.Entities.Projects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Projects
{
    public class ProjectTaskConfiguration : IEntityTypeConfiguration<ProjectTask>
    {
        public void Configure(EntityTypeBuilder<ProjectTask> builder)
        {
            builder.ToTable("ProjectTasks");

            builder.HasKey(pt => pt.Id);

            builder.Property(pt => pt.TaskName)
                .IsRequired()
                .HasMaxLength(150);

            builder.Property(pt => pt.Description)
                .HasMaxLength(500);

            builder.Property(pt => pt.Status)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50);

            builder.HasOne(pt => pt.Project)
                .WithMany(p => p.Tasks)
                .HasForeignKey(pt => pt.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
