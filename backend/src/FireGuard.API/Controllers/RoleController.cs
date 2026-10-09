using FireGuard.API.Authorization;
using FireGuard.Application.Common.Models;
using FireGuard.Domain.Entities.IAM;
using FireGuard.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FireGuard.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoleController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RoleController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [HasPermission("ROLE_MANAGE")]
        public async Task<ActionResult<ApiResponse<List<Role>>>> GetRoles()
        {
            var roles = await _context.Roles.ToListAsync();
            return Ok(ApiResponse<List<Role>>.Success(roles));
        }

        [HttpPost]
        [HasPermission("ROLE_MANAGE")]
        public async Task<ActionResult<ApiResponse<Role>>> CreateRole([FromBody] CreateRoleRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(ApiResponse<Role>.Failure("Role name cannot be empty."));
            }

            var normalizedName = request.Name.Trim().ToUpper();

            if (await _context.Roles.AnyAsync(r => r.Name == normalizedName))
            {
                return BadRequest(ApiResponse<Role>.Failure("Role already exists."));
            }

            var role = new Role
            {
                Name = normalizedName,
                Description = request.Description,
                CreatedBy = "Admin" // TODO: Update with current user
            };

            await _context.Roles.AddAsync(role);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<Role>.Success(role, "Role created successfully."));
        }

        [HttpDelete("{id}")]
        [HasPermission("ROLE_MANAGE")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteRole(string id)
        {
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Id == id);
            if (role == null)
            {
                return NotFound(ApiResponse<bool>.Failure("Role not found."));
            }

            if (role.Name == "ADMIN")
            {
                return BadRequest(ApiResponse<bool>.Failure("Cannot delete ADMIN role."));
            }

            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<bool>.Success(true, "Role deleted successfully."));
        }

        [HttpGet("{id}/permissions")]
        [HasPermission("ROLE_MANAGE")]
        public async Task<ActionResult<ApiResponse<List<string>>>> GetRolePermissions(string id)
        {
            var exists = await _context.Roles.AnyAsync(r => r.Id == id);
            if (!exists)
            {
                return NotFound(ApiResponse<List<string>>.Failure("Role not found."));
            }

            var permissions = await _context.RolePermissions
                .Where(rp => rp.RoleId == id)
                .Select(rp => rp.Permission.Name)
                .ToListAsync();

            return Ok(ApiResponse<List<string>>.Success(permissions));
        }

        [HttpPost("{id}/permissions")]
        [HasPermission("ROLE_MANAGE")]
        public async Task<ActionResult<ApiResponse<bool>>> AssignPermissionsToRole(string id, [FromBody] AssignPermissionsRequest request)
        {
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Id == id);
            if (role == null)
            {
                return NotFound(ApiResponse<bool>.Failure("Role not found."));
            }

            if (role.Name == "ADMIN")
            {
                return BadRequest(ApiResponse<bool>.Failure("Permissions for ADMIN role cannot be modified."));
            }

            // Remove existing permissions
            var existing = await _context.RolePermissions.Where(rp => rp.RoleId == id).ToListAsync();
            _context.RolePermissions.RemoveRange(existing);

            // Add new permissions
            var validPermissions = await _context.Permissions
                .Where(p => request.Permissions.Contains(p.Name))
                .ToListAsync();

            var newRolePermissions = validPermissions.Select(p => new RolePermission
            {
                RoleId = id,
                PermissionId = p.Id
            });

            await _context.RolePermissions.AddRangeAsync(newRolePermissions);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<bool>.Success(true, "Permissions assigned to role successfully."));
        }

        [HttpPost("users/{userId}/roles")]
        [HasPermission("ROLE_MANAGE")]
        public async Task<ActionResult<ApiResponse<bool>>> AssignRolesToUser(string userId, [FromBody] AssignRolesRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return NotFound(ApiResponse<bool>.Failure("User not found."));
            }

            // Remove existing roles
            var existing = await _context.UserRoles.Where(ur => ur.UserId == userId).ToListAsync();
            _context.UserRoles.RemoveRange(existing);

            // Add new roles
            var validRoles = await _context.Roles
                .Where(r => request.Roles.Contains(r.Name))
                .ToListAsync();

            var newUserRoles = validRoles.Select(r => new UserRole
            {
                UserId = userId,
                RoleId = r.Id
            });

            await _context.UserRoles.AddRangeAsync(newUserRoles);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<bool>.Success(true, "Roles assigned to user successfully."));
        }

        [HttpGet("permissions")]
        [HasPermission("ROLE_MANAGE")]
        public async Task<ActionResult<ApiResponse<List<Permission>>>> GetAllPermissions()
        {
            var permissions = await _context.Permissions.ToListAsync();
            return Ok(ApiResponse<List<Permission>>.Success(permissions));
        }
    }

    public class CreateRoleRequest
    {
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
    }

    public class AssignPermissionsRequest
    {
        public List<string> Permissions { get; set; } = new();
    }

    public class AssignRolesRequest
    {
        public List<string> Roles { get; set; } = new();
    }
}
