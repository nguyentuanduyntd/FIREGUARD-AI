using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Application.Common.Models;
using FireGuard.Application.DTOs.Auth;
using FireGuard.Domain.Entities.IAM;
using FireGuard.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace FireGuard.Infrastructure.Identity
{
    public class TokenService : ITokenService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<TokenService> _logger;

        public TokenService(
            ApplicationDbContext context,
            IConfiguration configuration,
            ILogger<TokenService> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        public string GenerateAccessToken(User user, IEnumerable<string> roles, IEnumerable<string> permissions)
        {
            var secretKey = _configuration["Jwt:Secret"] ?? "super_secret_jwt_key_with_at_least_32_characters_123456";
            var expiryMinutes = int.TryParse(_configuration["Jwt:AccessExpiryMinutes"], out var minutes) ? minutes : 15;

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.Id),
                new(JwtRegisteredClaimNames.UniqueName, user.Username),
                new(JwtRegisteredClaimNames.Email, user.Email),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            // Add Roles
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            // Add Permissions as custom claims
            foreach (var permission in permissions)
            {
                claims.Add(new Claim("permission", permission));
            }

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<string> GenerateRefreshTokenAsync(string userId, string deviceName, string? osVersion, string? pushToken)
        {
            var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            var tokenHash = HashToken(rawToken);

            var expiryDays = int.TryParse(_configuration["Jwt:RefreshExpiryDays"], out var days) ? days : 7;

            // Deactivate existing devices/refresh tokens for this device
            var existingDevice = await _context.UserDevices
                .FirstOrDefaultAsync(d => d.UserId == userId && d.DeviceName == deviceName);
            
            if (existingDevice != null)
            {
                existingDevice.OSVersion = osVersion;
                existingDevice.PushToken = pushToken;
                _context.UserDevices.Update(existingDevice);
            }
            else
            {
                await _context.UserDevices.AddAsync(new UserDevice
                {
                    UserId = userId,
                    DeviceName = deviceName,
                    OSVersion = osVersion,
                    PushToken = pushToken,
                    CreatedBy = "System"
                });
            }

            var refreshToken = new RefreshToken
            {
                UserId = userId,
                TokenHash = tokenHash,
                ExpiresAtUtc = DateTime.UtcNow.AddDays(expiryDays),
                CreatedBy = "System"
            };

            await _context.RefreshTokens.AddAsync(refreshToken);
            await _context.SaveChangesAsync();

            return rawToken;
        }

        public async Task<Result<TokenResponse>> RotateRefreshTokenAsync(string refreshToken, string deviceName, string? osVersion, string? pushToken)
        {
            var tokenHash = HashToken(refreshToken);
            
            // Find refresh token in DB including user details
            var storedToken = await _context.RefreshTokens
                .Include(t => t.User)
                .ThenInclude(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

            if (storedToken == null)
            {
                return Result<TokenResponse>.Failure("Invalid refresh token.");
            }

            // Token reuse attack detection
            if (storedToken.IsRevoked)
            {
                _logger.LogWarning("Refresh token reuse detected! Revoking all tokens for User ID: {UserId}", storedToken.UserId);
                await RevokeAllUserTokensAsync(storedToken.UserId);
                return Result<TokenResponse>.Failure("Compromised token. All sessions revoked.");
            }

            if (storedToken.IsExpired)
            {
                return Result<TokenResponse>.Failure("Expired refresh token.");
            }

            // Rotate: generate new tokens
            var user = storedToken.User;
            var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
            var permissions = user.UserRoles.SelectMany(ur => ur.Role.RolePermissions).Select(rp => rp.Permission.Name).Distinct().ToList();

            var newAccessToken = GenerateAccessToken(user, roles, permissions);
            var newRawRefreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            var newHash = HashToken(newRawRefreshToken);

            var expiryDays = int.TryParse(_configuration["Jwt:RefreshExpiryDays"], out var days) ? days : 7;

            // Revoke old token
            storedToken.RevokedAtUtc = DateTime.UtcNow;
            storedToken.ReplacedByToken = newHash;

            var newRefreshTokenEntity = new RefreshToken
            {
                UserId = user.Id,
                TokenHash = newHash,
                ExpiresAtUtc = DateTime.UtcNow.AddDays(expiryDays),
                CreatedBy = "System"
            };

            await _context.RefreshTokens.AddAsync(newRefreshTokenEntity);
            _context.RefreshTokens.Update(storedToken);
            await _context.SaveChangesAsync();

            return Result<TokenResponse>.Success(new TokenResponse
            {
                AccessToken = newAccessToken,
                RefreshToken = newRawRefreshToken,
                AccessTokenExpiresAt = DateTime.UtcNow.AddMinutes(int.TryParse(_configuration["Jwt:AccessExpiryMinutes"], out var minutes) ? minutes : 15)
            });
        }

        public async Task<bool> RevokeRefreshTokenAsync(string refreshToken)
        {
            var tokenHash = HashToken(refreshToken);
            var storedToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

            if (storedToken == null || storedToken.IsRevoked)
            {
                return false;
            }

            storedToken.RevokedAtUtc = DateTime.UtcNow;
            _context.RefreshTokens.Update(storedToken);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RevokeAllUserTokensAsync(string userId)
        {
            var tokens = await _context.RefreshTokens
                .Where(t => t.UserId == userId && t.RevokedAtUtc == null)
                .ToListAsync();

            if (!tokens.Any())
            {
                return false;
            }

            foreach (var token in tokens)
            {
                token.RevokedAtUtc = DateTime.UtcNow;
            }

            _context.RefreshTokens.UpdateRange(tokens);
            await _context.SaveChangesAsync();
            return true;
        }

        private static string HashToken(string token)
        {
            var bytes = Encoding.UTF8.GetBytes(token);
            var hash = SHA256.HashData(bytes);
            return Convert.ToBase64String(hash);
        }
    }
}
