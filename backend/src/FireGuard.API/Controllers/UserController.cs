using FireGuard.API.Authorization;
using FireGuard.Application.Common.Models;
using FireGuard.Domain.Entities.IAM;
using FireGuard.Infrastructure.Identity;
using FireGuard.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FireGuard.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UserController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<UserItemDto>>>> GetUsers([FromQuery] string? role = null)
        {
            var query = _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(role))
            {
                var upperRole = role.Trim().ToUpper();
                query = query.Where(u => u.UserRoles.Any(ur => ur.Role.Name == upperRole));
            }

            var users = await query
                .OrderByDescending(u => u.CreatedAtUtc)
                .Select(u => new UserItemDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    FullName = u.FullName,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    Department = u.Department,
                    IsActive = u.IsActive,
                    IsTechnician = u.IsTechnician,
                    Skills = u.Skills,
                    Roles = u.UserRoles.Select(ur => ur.Role.Name).ToList(),
                    CreatedAt = u.CreatedAtUtc
                })
                .ToListAsync();

            return Ok(ApiResponse<List<UserItemDto>>.Success(users));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<UserItemDto>>> CreateUser([FromBody] CreateUserRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.FullName))
                return BadRequest(ApiResponse<UserItemDto>.Failure("Họ và tên không được để trống."));

            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(ApiResponse<UserItemDto>.Failure("Email không được để trống."));

            var normalizedEmail = request.Email.Trim().ToLower();
            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail))
                return BadRequest(ApiResponse<UserItemDto>.Failure("Email này đã được sử dụng."));

            var username = string.IsNullOrWhiteSpace(request.Username) 
                ? normalizedEmail.Split('@')[0] 
                : request.Username.Trim();

            if (await _context.Users.AnyAsync(u => u.Username.ToLower() == username.ToLower()))
            {
                username = $"{username}_{new Random().Next(100, 999)}";
            }

            var roleName = string.IsNullOrWhiteSpace(request.Role) ? "TECHNICIAN" : request.Role.Trim().ToUpper();
            if (roleName == "LEADER") roleName = "INSTALLATION_LEADER";
            if (roleName == "MEMBER") roleName = "INSTALLATION_MEMBER";

            var targetRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
            if (targetRole == null)
            {
                targetRole = new Role { Name = roleName, Description = $"Vai trò {roleName}" };
                await _context.Roles.AddAsync(targetRole);
                await _context.SaveChangesAsync();
            }

            var rawPassword = string.IsNullOrWhiteSpace(request.Password) ? "FireGuard@2026" : request.Password;
            var passwordHash = PasswordHasher.HashPassword(rawPassword);

            var isTech = roleName.Contains("TECH") || request.IsTechnician;

            var user = new User
            {
                Username = username,
                Email = normalizedEmail,
                FullName = request.FullName.Trim(),
                PhoneNumber = request.PhoneNumber?.Trim(),
                Department = request.Department?.Trim() ?? (isTech ? "Phòng Kỹ Thuật" : (roleName.Contains("SALE") ? "Phòng Kinh Doanh" : "Phòng Vận Hành")),
                PasswordHash = passwordHash,
                IsActive = true,
                IsTechnician = isTech,
                Skills = isTech ? (request.Skills ?? "PCCC,Bảo trì,Bơm,Báo cháy") : null,
                AverageRating = 4.8,
                CreatedBy = "System Admin"
            };

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            await _context.UserRoles.AddAsync(new UserRole
            {
                UserId = user.Id,
                RoleId = targetRole.Id
            });
            await _context.SaveChangesAsync();

            var resultDto = new UserItemDto
            {
                Id = user.Id,
                Username = user.Username,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Department = user.Department,
                IsActive = user.IsActive,
                IsTechnician = user.IsTechnician,
                Skills = user.Skills,
                Roles = new List<string> { targetRole.Name },
                CreatedAt = user.CreatedAtUtc
            };

            return Ok(ApiResponse<UserItemDto>.Success(resultDto, "Tạo tài khoản nhân viên thành công."));
        }

        [HttpPost("{id}/lock")]
        public async Task<ActionResult<ApiResponse<bool>>> ToggleLock(string id, [FromQuery] bool @lock)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(ApiResponse<bool>.Failure("Không tìm thấy người dùng."));

            user.IsActive = !@lock;
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<bool>.Success(true, @lock ? "Đã khóa tài khoản thành công." : "Đã mở khóa tài khoản thành công."));
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteUser(string id)
        {
            var user = await _context.Users.Include(u => u.UserRoles).FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
                return NotFound(ApiResponse<bool>.Failure("Không tìm thấy người dùng."));

            if (user.Username == "admin")
                return BadRequest(ApiResponse<bool>.Failure("Không thể xóa tài khoản Admin mặc định."));

            _context.UserRoles.RemoveRange(user.UserRoles);
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<bool>.Success(true, "Đã xóa tài khoản nhân viên."));
        }
    }

    public class UserItemDto
    {
        public string Id { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string? Department { get; set; }
        public bool IsActive { get; set; }
        public bool IsTechnician { get; set; }
        public string? Skills { get; set; }
        public List<string> Roles { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }

    public class CreateUserRequest
    {
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Username { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Department { get; set; }
        public string? Role { get; set; } // TECHNICIAN, SALES, LEADER, ADMIN, CUSTOMER
        public string? Password { get; set; }
        public bool IsTechnician { get; set; }
        public string? Skills { get; set; }
    }
}
