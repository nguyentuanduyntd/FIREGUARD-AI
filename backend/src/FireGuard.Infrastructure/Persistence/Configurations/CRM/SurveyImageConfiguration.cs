using FireGuard.Domain.Entities.CRM;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.CRM
{
    public class SurveyImageConfiguration : IEntityTypeConfiguration<SurveyImage>
    {
        public void Configure(EntityTypeBuilder<SurveyImage> builder)
        {
            builder.ToTable("SurveyImages");

            builder.HasKey(si => si.Id);

            builder.Property(si => si.ImageUrl)
                .IsRequired()
                .HasMaxLength(500);

            builder.HasOne(si => si.SurveyRequest)
                .WithMany(s => s.Images)
                .HasForeignKey(si => si.SurveyRequestId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
