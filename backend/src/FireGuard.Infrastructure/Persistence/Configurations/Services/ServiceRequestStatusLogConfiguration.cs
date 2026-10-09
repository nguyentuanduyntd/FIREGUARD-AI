using FireGuard.Domain.Entities.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Services
{
    public class ServiceRequestStatusLogConfiguration : IEntityTypeConfiguration<ServiceRequestStatusLog>
    {
        public void Configure(EntityTypeBuilder<ServiceRequestStatusLog> builder)
        {
            builder.ToTable("ServiceRequestStatusLogs");

            builder.HasKey(sl => sl.Id);

            builder.Property(sl => sl.FromStatus)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(sl => sl.ToStatus)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(sl => sl.Notes)
                .HasMaxLength(250);

            builder.Property(sl => sl.ChangedBy)
                .IsRequired()
                .HasMaxLength(100);

            builder.HasOne(sl => sl.ServiceRequest)
                .WithMany(s => s.StatusLogs)
                .HasForeignKey(sl => sl.ServiceRequestId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
