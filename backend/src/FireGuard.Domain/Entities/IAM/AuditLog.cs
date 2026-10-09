namespace FireGuard.Domain.Entities.IAM
{
    public class AuditLog
    {
        public long Id { get; set; }
        public string? UserId { get; set; }
        public string Action { get; set; } = null!;
        public string TableName { get; set; } = null!;
        public string? OldValues { get; set; }
        public string? NewValues { get; set; }
        public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
    }
}
