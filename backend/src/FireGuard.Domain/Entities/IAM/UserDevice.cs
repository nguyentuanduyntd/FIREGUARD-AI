using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.IAM
{
    public class UserDevice : BaseEntity<string>
    {
        public UserDevice()
        {
            Id = Guid.NewGuid().ToString();
        }

        public string UserId { get; set; } = null!;
        public virtual User User { get; set; } = null!;

        public string DeviceName { get; set; } = null!;
        public string? OSVersion { get; set; }
        public string? PushToken { get; set; }
    }
}
