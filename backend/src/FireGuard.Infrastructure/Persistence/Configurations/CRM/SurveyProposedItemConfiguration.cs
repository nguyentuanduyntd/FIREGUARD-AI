using FireGuard.Domain.Entities.CRM;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.CRM
{
    public class SurveyProposedItemConfiguration : IEntityTypeConfiguration<SurveyProposedItem>
    {
        public void Configure(EntityTypeBuilder<SurveyProposedItem> builder)
        {
            builder.ToTable("SurveyProposedItems");

            builder.HasKey(pi => pi.Id);

            builder.Property(pi => pi.Notes)
                .HasMaxLength(250);

            builder.HasOne(pi => pi.SurveyRequest)
                .WithMany(s => s.ProposedItems)
                .HasForeignKey(pi => pi.SurveyRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(pi => pi.Model)
                .WithMany()
                .HasForeignKey(pi => pi.ModelId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
