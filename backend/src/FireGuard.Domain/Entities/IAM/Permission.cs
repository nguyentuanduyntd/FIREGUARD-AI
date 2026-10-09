using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.IAM
{
    public class Permission : BaseEntity<string>
    {
        public Permission()
        {
            Id = Guid.NewGuid().ToString();
            RolePermissions = new HashSet<RolePermission>();
        }

        public string Name { get; set; } = null!;
        public string? Description { get; set; }

        public virtual ICollection<RolePermission> RolePermissions { get; set; }
    }
}
