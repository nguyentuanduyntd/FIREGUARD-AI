using FireGuard.Domain.Entities.IAM;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations
{
    public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
    {
        public void Configure(EntityTypeBuilder<RefreshToken> builder)
        {
            builder.ToTable("RefreshTokens");

            builder.HasKey(x => x.Id);
            builder.Property(x => x.Id).HasMaxLength(36);

            builder.Property(x => x.UserId).HasMaxLength(36).IsRequired();
            builder.Property(x => x.TokenHash).HasMaxLength(500).IsRequired();
            builder.Property(x => x.ReplacedByToken).HasMaxLength(500);

            builder.HasOne(x => x.User)
                .WithMany(x => x.RefreshTokens)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Property(x => x.CreatedBy).HasMaxLength(100).IsRequired();
        }
    }
}
