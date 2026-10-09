using System;
using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.Notifications
{
    public class EmailLog : BaseEntity<string>
    {
        public EmailLog()
        {
            Id = Guid.NewGuid().ToString();
            CreatedAtUtc = DateTime.UtcNow;
            Status = "Pending";
            RetryCount = 0;
            MaxRetries = 3;
        }

        public string? NotificationId { get; set; }
        public virtual Notification? Notification { get; set; }

        public string RecipientEmail { get; set; } = null!;
        public string Subject { get; set; } = null!;
        public string BodyHtml { get; set; } = null!;
        public DateTime? SentAtUtc { get; set; }
        public string Status { get; set; } // Pending, Sent, Failed
        public string? ErrorMessage { get; set; }
        public int RetryCount { get; set; }
        public int MaxRetries { get; set; }
    }
}
