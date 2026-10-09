using System;
using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.IAM;

namespace FireGuard.Domain.Entities.Notifications
{
    public class Notification : AuditableEntity<string>
    {
        public Notification()
        {
            Id = Guid.NewGuid().ToString();
            IsRead = false;
        }

        public string UserId { get; set; } = null!;
        public virtual User User { get; set; } = null!;

        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public bool IsRead { get; set; }
        public DateTime? ReadAtUtc { get; set; }
        public string? LinkUrl { get; set; }
        
        // Context IDs
        public string? ServiceRequestId { get; set; }
        public string? ProjectId { get; set; }

        // Comma separated channels, e.g. "InApp,Email"
        public string Channels { get; set; } = "InApp";
    }
}
