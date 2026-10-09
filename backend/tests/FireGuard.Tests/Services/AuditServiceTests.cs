using System;
using System.Text.Json;
using System.Threading.Tasks;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Persistence;
using FireGuard.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FireGuard.Tests.Services
{
    public class AuditServiceTests
    {
        private ApplicationDbContext GetInMemoryContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            
            return new ApplicationDbContext(options);
        }

        [Fact]
        public async Task Test_LogAsync_MasksPasswordAndSensitiveFields()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var service = new AuditService(context);

            var beforeObject = new
            {
                Username = "installer_john",
                Password = "SuperSecretPassword123!",
                ApiKey = "live_key_9999",
                PhotoBytes = new byte[] { 0x20, 0x30, 0x40 }
            };

            // Act
            await service.LogAsync(
                "admin_user",
                "CreateUser",
                "IAM",
                "User",
                "usr_123",
                beforeObject,
                null,
                "127.0.0.1",
                "Mozilla/5.0",
                "corr-id-001"
            );

            // Assert
            var log = await context.AuditLogs.FirstOrDefaultAsync(l => l.EntityId == "usr_123");
            Assert.NotNull(log);
            Assert.Equal("admin_user", log.Operator);
            Assert.Equal("CreateUser", log.Action);

            // Verify before values JSON masks sensitive attributes
            Assert.NotNull(log.BeforeValues);
            using var doc = JsonDocument.Parse(log.BeforeValues);
            var root = doc.RootElement;

            Assert.Equal("installer_john", root.GetProperty("Username").GetString());
            Assert.Equal("[REDACTED_SENSITIVE_DATA]", root.GetProperty("Password").GetString());
            Assert.Equal("[REDACTED_SENSITIVE_DATA]", root.GetProperty("ApiKey").GetString());
            Assert.Equal("[BINARY_DATA_REMOVED]", root.GetProperty("PhotoBytes").GetString());
        }

        [Fact]
        public async Task Test_PurgeOldLogs_RemovesExpiredLogs()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var service = new AuditService(context);

            var oldLog = new AuditLog
            {
                Operator = "admin",
                Action = "DeleteDevice",
                Module = "Catalog",
                TimestampUtc = DateTime.UtcNow.AddDays(-100) // Older than 90 days
            };

            var newLog = new AuditLog
            {
                Operator = "admin",
                Action = "UpdateSettings",
                Module = "Configuration",
                TimestampUtc = DateTime.UtcNow.AddDays(-30) // Within 90 days
            };

            await context.AuditLogs.AddRangeAsync(oldLog, newLog);
            await context.SaveChangesAsync();

            // Act
            await service.PurgeOldLogsAsync(90);

            // Assert
            var remaining = await context.AuditLogs.ToListAsync();
            Assert.Single(remaining);
            Assert.Equal(newLog.Id, remaining[0].Id);
        }
    }
}
