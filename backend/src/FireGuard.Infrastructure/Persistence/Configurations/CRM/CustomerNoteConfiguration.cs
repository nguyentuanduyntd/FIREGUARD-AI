using FireGuard.Domain.Entities.CRM;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.CRM
{
    public class CustomerNoteConfiguration : IEntityTypeConfiguration<CustomerNote>
    {
        public void Configure(EntityTypeBuilder<CustomerNote> builder)
        {
            builder.ToTable("CustomerNotes");

            builder.HasKey(n => n.Id);

            builder.Property(n => n.Content)
                .IsRequired()
                .HasColumnType("text");

            builder.Property(n => n.NoteType)
                .IsRequired()
                .HasMaxLength(50);
        }
    }
}
