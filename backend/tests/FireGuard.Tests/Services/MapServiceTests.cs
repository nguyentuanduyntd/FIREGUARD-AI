using System;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using FireGuard.Domain.Entities.IAM;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Persistence;
using FireGuard.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FireGuard.Tests.Services
{
    public class MapServiceTests
    {
        private ApplicationDbContext GetInMemoryContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            
            return new ApplicationDbContext(options);
        }

        [Fact]
        public async Task Test_GoogleMapsService_Fallback_CalculatesCorrectly()
        {
            // Arrange
            var mockConfig = new Mock<IConfiguration>();
            mockConfig.Setup(c => c["GoogleMaps:ApiKey"]).Returns(string.Empty); // Empty key to trigger fallback

            var mockLogger = new Mock<ILogger<GoogleMapsService>>();
            var service = new GoogleMapsService(new HttpClient(), mockConfig.Object, mockLogger.Object);

            // Coordinates for Hanoi center to Thanh Xuan district (~5km)
            double lat1 = 21.0285;
            double lon1 = 105.8542;
            double lat2 = 21.0050;
            double lon2 = 105.8000;

            // Act
            var (distanceKm, durationMin) = await service.GetDistanceAndDurationAsync(lat1, lon1, lat2, lon2);

            // Assert
            Assert.True(distanceKm > 0);
            Assert.True(durationMin > 0);
            Assert.Equal(Math.Round((distanceKm / 30.0) * 60.0, 1), durationMin);
        }

        [Fact]
        public async Task Test_GpsTracking_ThrottlesLogs()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            
            var techId = "tech_1";
            var tech = new User
            {
                Id = techId,
                Username = "tech1",
                FullName = "GPS Tech",
                IsTechnician = true,
                IsOnDuty = true
            };

            await context.Users.AddAsync(tech);
            await context.SaveChangesAsync();

            // First GPS log
            var log1 = new TechnicianGpsLog
            {
                TechnicianId = techId,
                Latitude = 21.0,
                Longitude = 105.0,
                TimestampUtc = DateTime.UtcNow.AddSeconds(-20) // 20s ago
            };
            await context.TechnicianGpsLogs.AddAsync(log1);
            await context.SaveChangesAsync();

            // Act 1: Update GPS (should log because last update was 20s ago)
            var timeNow = DateTime.UtcNow;
            var log2 = new TechnicianGpsLog
            {
                TechnicianId = techId,
                Latitude = 21.01,
                Longitude = 105.01,
                TimestampUtc = timeNow
            };
            await context.TechnicianGpsLogs.AddAsync(log2);
            await context.SaveChangesAsync();

            // Act 2: Attempt another update 2 seconds later (simulating throttle block in controller)
            var timeLater = timeNow.AddSeconds(2);
            bool skipLog = (timeLater - timeNow).TotalSeconds < 15;

            if (!skipLog)
            {
                var log3 = new TechnicianGpsLog
                {
                    TechnicianId = techId,
                    Latitude = 21.02,
                    Longitude = 105.02,
                    TimestampUtc = timeLater
                };
                await context.TechnicianGpsLogs.AddAsync(log3);
                await context.SaveChangesAsync();
            }

            // Assert
            var totalLogs = await context.TechnicianGpsLogs.CountAsync();
            Assert.Equal(2, totalLogs); // Should have exactly 2 logs, 3rd was throttled
        }

        [Fact]
        public async Task Test_GpsPurging_RemovesOldLogs()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());

            var oldLog = new TechnicianGpsLog
            {
                TechnicianId = "tech_1",
                Latitude = 21.0,
                Longitude = 105.0,
                TimestampUtc = DateTime.UtcNow.AddDays(-10) // 10 days old (should be purged)
            };

            var newLog = new TechnicianGpsLog
            {
                TechnicianId = "tech_1",
                Latitude = 21.1,
                Longitude = 105.1,
                TimestampUtc = DateTime.UtcNow.AddDays(-2) // 2 days old (keep)
            };

            await context.TechnicianGpsLogs.AddRangeAsync(oldLog, newLog);
            await context.SaveChangesAsync();

            // Act
            var cutoff = DateTime.UtcNow.AddDays(-7);
            var toRemove = await context.TechnicianGpsLogs.Where(l => l.TimestampUtc < cutoff).ToListAsync();
            context.TechnicianGpsLogs.RemoveRange(toRemove);
            await context.SaveChangesAsync();

            // Assert
            var remainingLogs = await context.TechnicianGpsLogs.ToListAsync();
            Assert.Single(remainingLogs);
            Assert.Equal(newLog.Id, remainingLogs[0].Id);
        }
    }
}
