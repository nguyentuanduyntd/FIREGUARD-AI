using FireGuard.Domain.Entities.IAM;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.ToTable("Users");

            builder.HasKey(x => x.Id);
            builder.Property(x => x.Id).HasMaxLength(36);

            builder.Property(x => x.Username).HasMaxLength(100).IsRequired();
            builder.HasIndex(x => x.Username).IsUnique();

            builder.Property(x => x.Email).HasMaxLength(150).IsRequired();
            builder.HasIndex(x => x.Email).IsUnique();

            builder.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
            builder.Property(x => x.FullName).HasMaxLength(150).IsRequired();
            builder.Property(x => x.PhoneNumber).HasMaxLength(20);

            builder.Property(x => x.CreatedBy).HasMaxLength(100).IsRequired();
            builder.Property(x => x.LastModifiedBy).HasMaxLength(100);
            builder.Property(x => x.DeletedBy).HasMaxLength(100);
        }
    }
}
