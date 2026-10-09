using System;
using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.Services
{
    public class AuditLog : BaseEntity<string>
    {
        public AuditLog()
        {
            Id = Guid.NewGuid().ToString();
            TimestampUtc = DateTime.UtcNow;
            IsSuccess = true;
        }

        public string? Operator { get; set; }
        public DateTime TimestampUtc { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public string Action { get; set; } = null!;
        public string Module { get; set; } = null!;
        public string? EntityName { get; set; }
        public string? EntityId { get; set; }
        public string? BeforeValues { get; set; } // JSON string
        public string? AfterValues { get; set; }  // JSON string
        public string? CorrelationId { get; set; }
        public bool IsSuccess { get; set; }
        public string? ErrorMessage { get; set; }
    }
}
