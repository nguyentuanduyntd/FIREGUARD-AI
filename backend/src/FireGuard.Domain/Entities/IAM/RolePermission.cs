namespace FireGuard.Domain.Entities.IAM
{
    public class RolePermission
    {
        public string RoleId { get; set; } = null!;
        public virtual Role Role { get; set; } = null!;

        public string PermissionId { get; set; } = null!;
        public virtual Permission Permission { get; set; } = null!;
    }
}
