using FireGuard.Domain.Entities.Sales;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.Sales
{
    public class ContractInstallmentConfiguration : IEntityTypeConfiguration<ContractInstallment>
    {
        public void Configure(EntityTypeBuilder<ContractInstallment> builder)
        {
            builder.ToTable("ContractInstallments");

            builder.HasKey(ci => ci.Id);

            builder.Property(ci => ci.StageName)
                .IsRequired()
                .HasMaxLength(150);

            builder.Property(ci => ci.Amount)
                .HasPrecision(18, 2);

            builder.HasOne(ci => ci.Contract)
                .WithMany(c => c.Installments)
                .HasForeignKey(ci => ci.ContractId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
