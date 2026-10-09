namespace FireGuard.Domain.Entities.IAM
{
    public class UserRole
    {
        public string UserId { get; set; } = null!;
        public virtual User User { get; set; } = null!;

        public string RoleId { get; set; } = null!;
        public virtual Role Role { get; set; } = null!;
    }
}
