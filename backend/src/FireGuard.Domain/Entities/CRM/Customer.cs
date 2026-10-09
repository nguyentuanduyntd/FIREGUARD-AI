using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.CRM
{
    public enum CustomerType
    {
        Individual,
        Corporate
    }

    public class Customer : AuditableEntity<string>
    {
        public Customer()
        {
            Id = Guid.NewGuid().ToString();
            Email = "customer@fireguard.vn";
            Phone = "0900000000";
            Addresses = new HashSet<CustomerAddress>();
            Contacts = new HashSet<CustomerContact>();
            Notes = new HashSet<CustomerNote>();
        }

        public string Name { get; set; } = null!;
        public CustomerType CustomerType { get; set; } = CustomerType.Individual;
        public string? TaxCode { get; set; }
        public string? RepresentativeName { get; set; }
        public string Email { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Industry { get; set; }
        public string? Website { get; set; }
        public decimal TotalDebt { get; set; } = 0;
        public bool IsActive { get; set; } = true;

        public virtual ICollection<CustomerAddress> Addresses { get; set; }
        public virtual ICollection<CustomerContact> Contacts { get; set; }
        public virtual ICollection<CustomerNote> Notes { get; set; }
    }
}
