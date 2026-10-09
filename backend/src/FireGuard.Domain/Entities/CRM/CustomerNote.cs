using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.CRM
{
    public class CustomerNote : AuditableEntity<string>
    {
        public CustomerNote()
        {
            Id = Guid.NewGuid().ToString();
        }

        public string CustomerId { get; set; } = null!;
        public virtual Customer Customer { get; set; } = null!;

        public string Content { get; set; } = null!;
        public string NoteType { get; set; } = "General"; // e.g. PhoneCall, Survey, Complaint, Support
    }
}
