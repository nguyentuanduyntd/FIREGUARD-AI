namespace FireGuard.Domain.Common
{
    public abstract class BaseEntity<TId>
    {
        public TId Id { get; set; } = default!;
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public string CreatedBy { get; set; } = "System";
    }

    public abstract class AuditableEntity<TId> : BaseEntity<TId>, IAuditableEntity, ISoftDelete
    {
        public DateTime? LastModifiedAtUtc { get; set; }
        public string? LastModifiedBy { get; set; }
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAtUtc { get; set; }
        public string? DeletedBy { get; set; }
    }
}
