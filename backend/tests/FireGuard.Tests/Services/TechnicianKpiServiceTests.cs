using System;
using System.Linq;
using System.Threading.Tasks;
using FireGuard.Domain.Entities.CRM;
using FireGuard.Domain.Entities.IAM;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Persistence;
using FireGuard.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FireGuard.Tests.Services
{
    public class TechnicianKpiServiceTests
    {
        private ApplicationDbContext GetInMemoryContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            
            return new ApplicationDbContext(options);
        }

        [Fact]
        public async Task Test_CalculateKpi_CalculatesRawAndCreatesRecord()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var service = new TechnicianKpiService(context);

            var tech = new User
            {
                Id = "tech_1",
                Username = "tech1",
                Email = "tech1@fireguard.com",
                FullName = "KPI Tech",
                IsTechnician = true,
                IsOnDuty = true,
                IsOnLeave = false,
                AverageRating = 4.8,
                AcceptanceRate = 0.9,
                CallbackRate = 0.08
            };

            // Add completed jobs in current month
            var request1 = new ServiceRequest
            {
                Id = "req_1",
                AssignedTechnicianId = "tech_1",
                Status = ServiceRequestStatus.Completed,
                LastModifiedAtUtc = DateTime.UtcNow, // this month
                RequestNumber = "SR-1",
                CustomerId = "c",
                AddressId = "a"
            };

            var request2 = new ServiceRequest
            {
                Id = "req_2",
                AssignedTechnicianId = "tech_1",
                Status = ServiceRequestStatus.Completed,
                LastModifiedAtUtc = DateTime.UtcNow, // this month
                RequestNumber = "SR-2",
                CustomerId = "c",
                AddressId = "a"
            };

            await context.Users.AddAsync(tech);
            await context.ServiceRequests.AddRangeAsync(request1, request2);
            await context.SaveChangesAsync();

            int year = DateTime.UtcNow.Year;
            int month = DateTime.UtcNow.Month;

            // Act
            await service.CalculateMonthlyKpiAsync(year, month);

            // Assert
            var kpi = await context.TechnicianKpis
                .FirstOrDefaultAsync(k => k.TechnicianId == "tech_1" && k.Year == year && k.Month == month);

            Assert.NotNull(kpi);
            Assert.Equal(2, kpi.CompletedJobs);
            Assert.Equal(4.8, kpi.CustomerRating);
            Assert.True(kpi.RawKpiScore > 0);
            Assert.NotNull(kpi.AiSummary);
            Assert.False(kpi.IsApproved);
        }

        [Fact]
        public async Task Test_AdjustKpi_AuditsCorrectly()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var service = new TechnicianKpiService(context);

            var kpi = new TechnicianKpi
            {
                TechnicianId = "tech_1",
                Year = 2026,
                Month = 7,
                RawKpiScore = 80,
                AdjustedScore = 80,
                IsApproved = false
            };

            await context.TechnicianKpis.AddAsync(kpi);
            await context.SaveChangesAsync();

            // Act
            var success = await service.AdjustKpiAsync(kpi.Id, 5.0, "Thái độ tích cực cứu hộ", "admin_user");

            // Assert
            Assert.True(success);
            var updatedKpi = await context.TechnicianKpis.FindAsync(kpi.Id);
            Assert.Equal(85.0, updatedKpi!.AdjustedScore);
            Assert.Equal(5.0, updatedKpi.AdjustmentValue);
            Assert.Equal("Thái độ tích cực cứu hộ", updatedKpi.AdjustmentReason);
            Assert.Equal("admin_user", updatedKpi.AdjustedBy);
            Assert.NotNull(updatedKpi.AdjustedAtUtc);
        }

        [Fact]
        public async Task Test_ApproveKpi_SavesBonusAndNotes()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var service = new TechnicianKpiService(context);

            var kpi = new TechnicianKpi
            {
                TechnicianId = "tech_1",
                Year = 2026,
                Month = 7,
                RawKpiScore = 85,
                AdjustedScore = 85,
                IsApproved = false
            };

            await context.TechnicianKpis.AddAsync(kpi);
            await context.SaveChangesAsync();

            // Act
            var success = await service.ApproveKpiAsync(kpi.Id, 1500000m, "Phê duyệt thưởng tháng 7");

            // Assert
            Assert.True(success);
            var updatedKpi = await context.TechnicianKpis.FindAsync(kpi.Id);
            Assert.True(updatedKpi!.IsApproved);
            Assert.Equal(1500000m, updatedKpi.ApprovedBonus);
            Assert.Equal("Phê duyệt thưởng tháng 7", updatedKpi.AdminNotes);
        }
    }
}
