using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.CRM
{
    public class CustomerContact : BaseEntity<string>
    {
        public CustomerContact()
        {
            Id = Guid.NewGuid().ToString();
        }

        public string CustomerId { get; set; } = null!;
        public virtual Customer Customer { get; set; } = null!;

        public string FullName { get; set; } = null!;
        public string Position { get; set; } = null!; // e.g. Safety Director, Accountant
        public string Email { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public bool IsPrimary { get; set; } = false;
    }
}
