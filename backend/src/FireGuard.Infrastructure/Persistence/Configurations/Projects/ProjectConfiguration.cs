using FireGuard.Domain.Entities.Projects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Projects
{
    public class ProjectConfiguration : IEntityTypeConfiguration<Project>
    {
        public void Configure(EntityTypeBuilder<Project> builder)
        {
            builder.ToTable("Projects");

            builder.HasKey(p => p.Id);

            builder.Property(p => p.Name)
                .IsRequired()
                .HasMaxLength(150);

            builder.Property(p => p.Status)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(p => p.TeamMembersJson)
                .HasColumnType("text");

            builder.Property(p => p.AcceptanceRecordUrl)
                .HasMaxLength(500);

            builder.Property(p => p.Notes)
                .HasMaxLength(500);

            builder.HasOne(p => p.Contract)
                .WithMany()
                .HasForeignKey(p => p.ContractId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(p => p.Customer)
                .WithMany()
                .HasForeignKey(p => p.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
