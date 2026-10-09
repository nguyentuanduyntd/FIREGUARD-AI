using FireGuard.Domain.Entities.CRM;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FireGuard.Infrastructure.Persistence.Configurations.CRM
{
    public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
    {
        public void Configure(EntityTypeBuilder<Customer> builder)
        {
            builder.ToTable("Customers");

            builder.HasKey(c => c.Id);

            builder.Property(c => c.Name)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(c => c.CustomerType)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(c => c.TaxCode)
                .HasMaxLength(50);

            builder.Property(c => c.RepresentativeName)
                .HasMaxLength(150);

            builder.Property(c => c.Email)
                .IsRequired()
                .HasMaxLength(150);

            builder.Property(c => c.Phone)
                .IsRequired()
                .HasMaxLength(20);

            builder.Property(c => c.TotalDebt)
                .HasPrecision(18, 2)
                .HasDefaultValue(0);

            builder.HasIndex(c => c.Email).IsUnique();

            builder.HasMany(c => c.Addresses)
                .WithOne(a => a.Customer)
                .HasForeignKey(a => a.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(c => c.Contacts)
                .WithOne(co => co.Customer)
                .HasForeignKey(co => co.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(c => c.Notes)
                .WithOne(n => n.Customer)
                .HasForeignKey(n => n.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
