using FireGuard.Domain.Entities.IAM;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations
{
    public class UserDeviceConfiguration : IEntityTypeConfiguration<UserDevice>
    {
        public void Configure(EntityTypeBuilder<UserDevice> builder)
        {
            builder.ToTable("UserDevices");

            builder.HasKey(x => x.Id);
            builder.Property(x => x.Id).HasMaxLength(36);

            builder.Property(x => x.UserId).HasMaxLength(36).IsRequired();
            builder.Property(x => x.DeviceName).HasMaxLength(150).IsRequired();
            builder.Property(x => x.OSVersion).HasMaxLength(50);
            builder.Property(x => x.PushToken).HasMaxLength(500);

            builder.HasOne(x => x.User)
                .WithMany(x => x.UserDevices)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Property(x => x.CreatedBy).HasMaxLength(100).IsRequired();
        }
    }
}
