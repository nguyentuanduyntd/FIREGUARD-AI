using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.IAM
{
    public class User : AuditableEntity<string>
    {
        public User()
        {
            Id = Guid.NewGuid().ToString();
            Email = "user@fireguard.vn";
            PasswordHash = "hashed_password";
            RefreshTokens = new HashSet<RefreshToken>();
            UserDevices = new HashSet<UserDevice>();
            UserRoles = new HashSet<UserRole>();
        }

        public string Username { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Address { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? IdentificationNumber { get; set; }
        public string? Department { get; set; }
        public bool IsActive { get; set; } = true;

        // Technician Specific Attributes (For AI Dispatching)
        public bool IsTechnician { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? Skills { get; set; } // Comma-separated (e.g. "Alarms,Pumps,Sprinklers")
        public bool IsOnDuty { get; set; } = true;
        public bool IsOnLeave { get; set; } = false;
        public double AverageRating { get; set; } = 4.5;
        public int DailyJobsCompleted { get; set; } = 0;
        public double AcceptanceRate { get; set; } = 0.95; // 95%
        public double CallbackRate { get; set; } = 0.05; // 5% callbacks
        public string? ExperiencedBrands { get; set; } // Comma-separated (e.g. "FireSmart,Tyco,Horings")

        public virtual ICollection<RefreshToken> RefreshTokens { get; set; }
        public virtual ICollection<UserDevice> UserDevices { get; set; }
        public virtual ICollection<UserRole> UserRoles { get; set; }
    }
}
