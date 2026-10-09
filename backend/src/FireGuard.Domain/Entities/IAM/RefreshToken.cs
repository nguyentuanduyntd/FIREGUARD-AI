using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.IAM
{
    public class RefreshToken : BaseEntity<string>
    {
        public RefreshToken()
        {
            Id = Guid.NewGuid().ToString();
        }

        public string UserId { get; set; } = null!;
        public virtual User User { get; set; } = null!;

        public string TokenHash { get; set; } = null!;
        public DateTime ExpiresAtUtc { get; set; }
        public DateTime? RevokedAtUtc { get; set; }
        public string? ReplacedByToken { get; set; }

        public bool IsExpired => DateTime.UtcNow >= ExpiresAtUtc;
        public bool IsRevoked => RevokedAtUtc != null;
        public bool IsActive => !IsRevoked && !IsExpired;
    }
}
