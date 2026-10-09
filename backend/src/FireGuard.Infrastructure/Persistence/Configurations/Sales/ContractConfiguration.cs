using FireGuard.Domain.Entities.Sales;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Sales
{
    public class ContractConfiguration : IEntityTypeConfiguration<Contract>
    {
        public void Configure(EntityTypeBuilder<Contract> builder)
        {
            builder.ToTable("Contracts");

            builder.HasKey(c => c.Id);

            builder.Property(c => c.ContractNumber)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(c => c.Status)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(c => c.TotalValue)
                .HasPrecision(18, 2);

            builder.Property(c => c.AttachmentUrl)
                .HasMaxLength(500);

            builder.Property(c => c.Notes)
                .HasMaxLength(500);

            builder.HasIndex(c => c.ContractNumber).IsUnique();

            builder.HasOne(c => c.Customer)
                .WithMany()
                .HasForeignKey(c => c.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
