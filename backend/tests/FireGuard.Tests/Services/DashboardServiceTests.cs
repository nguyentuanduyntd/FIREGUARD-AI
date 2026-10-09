using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FireGuard.Domain.Entities.CRM;
using FireGuard.Domain.Entities.Inventory;
using FireGuard.Domain.Entities.Projects;
using FireGuard.Domain.Entities.Sales;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Persistence;
using FireGuard.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Xunit;

namespace FireGuard.Tests.Services
{
    public class DashboardServiceTests
    {
        private ApplicationDbContext GetInMemoryContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            
            return new ApplicationDbContext(options);
        }

        [Fact]
        public async Task Test_GetAdminDashboard_CalculatesMetricsCorrectly()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var cache = new MemoryCache(new MemoryCacheOptions());
            var service = new DashboardService(context, cache);

            var customer = new Customer { Id = "cust_1", Name = "Client A", Email = "c1@test.com", Phone = "1" };
            await context.Customers.AddAsync(customer);

            var today = DateTime.UtcNow.Date;
            var isFirstDayOfMonth = today.Day == 1;

            // 1. Seed Quotations (Accepted/Converted = revenue)
            var q1 = new Quotation
            {
                Id = "q_1",
                CustomerId = "cust_1",
                TotalAmount = 5000000m,
                Status = QuotationStatus.Accepted,
                CreatedAtUtc = DateTime.UtcNow // Today
            };
            var q2 = new Quotation
            {
                Id = "q_2",
                CustomerId = "cust_1",
                TotalAmount = 3000000m,
                Status = QuotationStatus.Converted,
                CreatedAtUtc = isFirstDayOfMonth ? DateTime.UtcNow : today.AddDays(-1) // This month
            };
            var q3 = new Quotation
            {
                Id = "q_3",
                CustomerId = "cust_1",
                TotalAmount = 1500000m,
                Status = QuotationStatus.Draft,
                CreatedAtUtc = DateTime.UtcNow
            };

            // 2. Seed Projects (Ongoing / Overdue)
            var p1 = new Project
            {
                Id = "p_1",
                Name = "Project Alpha",
                CustomerId = "cust_1",
                Status = ProjectStatus.InProgress,
                StartDate = DateTime.UtcNow.AddDays(-10),
                EndDate = DateTime.UtcNow.AddDays(5) // Ongoing, on track
            };
            var p2 = new Project
            {
                Id = "p_2",
                Name = "Project Beta",
                CustomerId = "cust_1",
                Status = ProjectStatus.InProgress,
                StartDate = DateTime.UtcNow.AddDays(-20),
                EndDate = DateTime.UtcNow.AddDays(-2) // Ongoing, overdue!
            };

            await context.Quotations.AddRangeAsync(q1, q2, q3);
            await context.Projects.AddRangeAsync(p1, p2);
            await context.SaveChangesAsync();

            // Act
            var dashboard = await service.GetAdminDashboardAsync(DateTime.UtcNow.AddMonths(-1), DateTime.UtcNow, bypassCache: true);

            // Assert
            Assert.NotNull(dashboard);
            Assert.Equal(isFirstDayOfMonth ? 8000000m : 5000000m, dashboard.TodayRevenue);
            Assert.Equal(8000000m, dashboard.MonthlyRevenue);
            Assert.Equal(2, dashboard.OngoingProjects);
            Assert.Equal(1, dashboard.OverdueProjects);
            // Success rate = 2 accepted / 3 total = 66.7%
            Assert.Equal(66.7, dashboard.QuotationSuccessRate);
        }
    }
}
