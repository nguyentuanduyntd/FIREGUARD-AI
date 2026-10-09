using FireGuard.Domain.Entities.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations
{
    public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
    {
        public void Configure(EntityTypeBuilder<AuditLog> builder)
        {
            builder.ToTable("AuditLogs");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Action).HasMaxLength(100).IsRequired();
            builder.Property(x => x.Module).HasMaxLength(100).IsRequired();
            builder.Property(x => x.Operator).HasMaxLength(100);
            builder.Property(x => x.IpAddress).HasMaxLength(50);
            builder.Property(x => x.EntityName).HasMaxLength(100);
            builder.Property(x => x.EntityId).HasMaxLength(100);
            builder.Property(x => x.BeforeValues).HasColumnType("TEXT");
            builder.Property(x => x.AfterValues).HasColumnType("TEXT");
        }
    }
}
