using FireGuard.Application.Common.Models;
using FireGuard.Application.DTOs.Auth;
using FireGuard.Domain.Entities.IAM;
using FireGuard.Infrastructure.Identity;
using FireGuard.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace FireGuard.Tests.Identity
{
    public class IdentityTests
    {
        private readonly IConfiguration _configuration;

        public IdentityTests()
        {
            var inMemorySettings = new Dictionary<string, string?>
            {
                {"Jwt:Secret", "super_secret_jwt_key_with_at_least_32_characters_123456"},
                {"Jwt:AccessExpiryMinutes", "15"},
                {"Jwt:RefreshExpiryDays", "7"}
            };

            _configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();
        }

        private ApplicationDbContext CreateContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new ApplicationDbContext(options);
        }

        [Fact]
        public async Task Login_WithValidCredentials_ReturnsSuccessAndTokens()
        {
            // Arrange
            using var context = CreateContext();
            var hashedPassword = PasswordHasher.HashPassword("Password@123");
            var user = new User
            {
                Username = "testuser",
                Email = "test@fireguard.vn",
                FullName = "Test User",
                PasswordHash = hashedPassword,
                IsActive = true
            };
            await context.Users.AddAsync(user);
            await context.SaveChangesAsync();

            var tokenService = new TokenService(context, _configuration, NullLogger<TokenService>.Instance);
            var identityService = new IdentityService(context, tokenService, NullLogger<IdentityService>.Instance, _configuration);

            var loginRequest = new LoginRequest
            {
                Email = "test@fireguard.vn",
                Password = "Password@123"
            };

            // Act
            var result = await identityService.LoginAsync(loginRequest, "Test Device", null, null);

            // Assert
            Assert.True(result.Succeeded);
            Assert.NotNull(result.Data);
            Assert.NotNull(result.Data.AccessToken);
            Assert.NotNull(result.Data.RefreshToken);
        }

        [Fact]
        public async Task Login_WithInvalidPassword_ReturnsFailureAndGenericMessage()
        {
            // Arrange
            using var context = CreateContext();
            var hashedPassword = PasswordHasher.HashPassword("Password@123");
            var user = new User
            {
                Username = "testuser",
                Email = "test@fireguard.vn",
                FullName = "Test User",
                PasswordHash = hashedPassword,
                IsActive = true
            };
            await context.Users.AddAsync(user);
            await context.SaveChangesAsync();

            var tokenService = new TokenService(context, _configuration, NullLogger<TokenService>.Instance);
            var identityService = new IdentityService(context, tokenService, NullLogger<IdentityService>.Instance, _configuration);

            var loginRequest = new LoginRequest
            {
                Email = "test@fireguard.vn",
                Password = "WrongPassword"
            };

            // Act
            var result = await identityService.LoginAsync(loginRequest, "Test Device", null, null);

            // Assert
            Assert.False(result.Succeeded);
            Assert.Equal("Invalid email or password.", result.Errors[0]);
        }

        [Fact]
        public async Task RotateRefreshToken_WithValidActiveToken_ReturnsNewTokens()
        {
            // Arrange
            using var context = CreateContext();
            var user = new User
            {
                Username = "testuser",
                Email = "test@fireguard.vn",
                FullName = "Test User",
                PasswordHash = "dummyhash",
                IsActive = true
            };
            await context.Users.AddAsync(user);
            await context.SaveChangesAsync();

            var tokenService = new TokenService(context, _configuration, NullLogger<TokenService>.Instance);
            var rawRefreshToken = await tokenService.GenerateRefreshTokenAsync(user.Id, "Test Device", null, null);

            // Act
            var result = await tokenService.RotateRefreshTokenAsync(rawRefreshToken, "Test Device", null, null);

            // Assert
            Assert.True(result.Succeeded);
            Assert.NotNull(result.Data.AccessToken);
            Assert.NotNull(result.Data.RefreshToken);
        }

        [Fact]
        public async Task RotateRefreshToken_WithRevokedToken_TriggersReuseDetectionAndRevokesAll()
        {
            // Arrange
            using var context = CreateContext();
            var user = new User
            {
                Username = "testuser",
                Email = "test@fireguard.vn",
                FullName = "Test User",
                PasswordHash = "dummyhash",
                IsActive = true
            };
            await context.Users.AddAsync(user);
            await context.SaveChangesAsync();

            var tokenService = new TokenService(context, _configuration, NullLogger<TokenService>.Instance);
            
            // Generate a token
            var rawRefreshToken = await tokenService.GenerateRefreshTokenAsync(user.Id, "Test Device", null, null);

            // Revoke it manually
            var tokenEntity = await context.RefreshTokens.FirstAsync();
            tokenEntity.RevokedAtUtc = DateTime.UtcNow;
            context.RefreshTokens.Update(tokenEntity);
            await context.SaveChangesAsync();

            // Act
            var result = await tokenService.RotateRefreshTokenAsync(rawRefreshToken, "Test Device", null, null);

            // Assert
            Assert.False(result.Succeeded);
            Assert.Contains("Compromised token", result.Errors[0]);

            // Verify all tokens for this user are now revoked
            var activeTokensCount = await context.RefreshTokens
                .CountAsync(t => t.UserId == user.Id && t.RevokedAtUtc == null);
            Assert.Equal(0, activeTokensCount);
        }
    }
}
