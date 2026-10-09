using FireGuard.Application.Common.Interfaces;
using FireGuard.Application.Common.Models;
using FireGuard.Application.DTOs.Auth;
using FireGuard.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FireGuard.Infrastructure.Identity
{
    public class IdentityService : IIdentityService
    {
        private readonly ApplicationDbContext _context;
        private readonly ITokenService _tokenService;
        private readonly ILogger<IdentityService> _logger;
        private readonly IConfiguration _configuration;

        public IdentityService(
            ApplicationDbContext context,
            ITokenService tokenService,
            ILogger<IdentityService> logger,
            IConfiguration configuration)
        {
            _context = context;
            _tokenService = tokenService;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<Result<TokenResponse>> LoginAsync(LoginRequest request, string deviceName, string? osVersion, string? pushToken)
        {
            var emailOrUsername = request.Email?.Trim() ?? string.Empty;
            var searchKey = emailOrUsername.Contains('@') ? emailOrUsername.Split('@')[0].ToLower() : emailOrUsername.ToLower();

            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(u => 
                    u.Email == emailOrUsername || 
                    u.Username == emailOrUsername || 
                    (u.Email != null && u.Email.ToLower() == emailOrUsername.ToLower()) || 
                    (u.Username != null && u.Username.ToLower() == emailOrUsername.ToLower()));

            if (user == null && !string.IsNullOrEmpty(searchKey))
            {
                user = await _context.Users
                    .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
                    .FirstOrDefaultAsync(u => 
                        (u.Username != null && u.Username.ToLower() == searchKey) ||
                        (u.Email != null && u.Email.ToLower().StartsWith(searchKey)));
            }

            if (user == null && emailOrUsername.Contains("admin", StringComparison.OrdinalIgnoreCase))
            {
                user = await _context.Users
                    .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
                    .FirstOrDefaultAsync(u => u.Username == "admin" || u.Email == "admin@fireguard.vn");
            }

            // Generic error message to prevent email harvesting
            const string genericError = "Invalid email or password.";

            if (user == null)
            {
                _logger.LogWarning("Failed login attempt for non-existent email: {Email}", request.Email);
                return Result<TokenResponse>.Failure(genericError);
            }

            if (!user.IsActive)
            {
                _logger.LogWarning("Login attempt for deactivated user account: {Email}", request.Email);
                return Result<TokenResponse>.Failure("Your account has been deactivated.");
            }

            var isPasswordValid = PasswordHasher.VerifyPassword(request.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                _logger.LogWarning("Failed login attempt (incorrect password) for email: {Email}", request.Email);
                return Result<TokenResponse>.Failure(genericError);
            }

            // Retrieve roles & permissions
            var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
            var permissions = user.UserRoles.SelectMany(ur => ur.Role.RolePermissions).Select(rp => rp.Permission.Name).Distinct().ToList();

            // Generate JWT and Refresh Tokens
            var accessToken = _tokenService.GenerateAccessToken(user, roles, permissions);
            var refreshToken = await _tokenService.GenerateRefreshTokenAsync(user.Id, deviceName, osVersion, pushToken);

            var accessExpiryMinutes = int.TryParse(_configuration["Jwt:AccessExpiryMinutes"], out var minutes) ? minutes : 15;

            _logger.LogInformation("User {Username} successfully logged in on device {DeviceName}.", user.Username, deviceName);

            return Result<TokenResponse>.Success(new TokenResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                AccessTokenExpiresAt = DateTime.UtcNow.AddMinutes(accessExpiryMinutes)
            });
        }

        public async Task<Result> ChangePasswordAsync(string userId, ChangePasswordRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return Result.Failure("User not found.");
            }

            if (!PasswordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
            {
                return Result.Failure("Current password is incorrect.");
            }

            user.PasswordHash = PasswordHasher.HashPassword(request.NewPassword);
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {Username} changed password successfully.", user.Username);

            return Result.Success();
        }

        public async Task<Result> LockUserAsync(string userId, bool lockUser)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return Result.Failure("User not found.");
            }

            user.IsActive = !lockUser;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            var status = lockUser ? "locked" : "unlocked";
            _logger.LogInformation("User {Username} account was {Status} by administrator.", user.Username, status);

            return Result.Success();
        }

        public async Task<UserDto?> GetCurrentUserAsync(string userId)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return null;

            return new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                IsActive = user.IsActive,
                Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList(),
                Permissions = user.UserRoles.SelectMany(ur => ur.Role.RolePermissions).Select(rp => rp.Permission.Name).Distinct().ToList()
            };
        }
    }
}
