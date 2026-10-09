using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.IAM
{
    public class Role : BaseEntity<string>
    {
        public Role()
        {
            Id = Guid.NewGuid().ToString();
            UserRoles = new HashSet<UserRole>();
            RolePermissions = new HashSet<RolePermission>();
        }

        public string Name { get; set; } = null!;
        public string? Description { get; set; }

        public virtual ICollection<UserRole> UserRoles { get; set; }
        public virtual ICollection<RolePermission> RolePermissions { get; set; }
    }
}
