using System;
using System.Linq;
using System.Threading.Tasks;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Persistence;
using FireGuard.Infrastructure.Services;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace FireGuard.Tests.Services
{
    public class ReportServiceTests
    {
        private ApplicationDbContext GetInMemoryContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            
            return new ApplicationDbContext(options);
        }

        [Fact]
        public async Task Test_TriggerExport_EnqueuesBackgroundJobAndCreatesPendingRecord()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            
            var mockNotifier = new Mock<INotificationService>();
            var mockHangfire = new Mock<IBackgroundJobClient>();

            var service = new ReportService(context, mockNotifier.Object, mockHangfire.Object);

            // Act
            var exportId = await service.TriggerExportAsync(
                ReportType.Revenue,
                "Excel",
                "{}",
                "admin_user"
            );

            // Assert
            var record = await context.ReportExports.FindAsync(exportId);
            Assert.NotNull(record);
            Assert.Equal(ExportStatus.Pending, record.Status);
            Assert.Equal("admin_user", record.RequestedBy);
            Assert.NotNull(record.ExpiresAtUtc);

            // Verify Hangfire was triggered
            mockHangfire.Verify(h => h.Create(
                It.Is<Hangfire.Common.Job>(j => j.Method.Name == "ProcessExportAsync"),
                It.IsAny<Hangfire.States.EnqueuedState>()),
                Times.Once);
        }

        [Fact]
        public async Task Test_ProcessExport_GeneratesFileAndNotifiesUser()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            
            var mockNotifier = new Mock<INotificationService>();
            var mockHangfire = new Mock<IBackgroundJobClient>();

            var service = new ReportService(context, mockNotifier.Object, mockHangfire.Object);

            var export = new ReportExport
            {
                RequestedBy = "admin_user",
                ReportType = ReportType.Quotation,
                FileFormat = "Excel",
                Status = ExportStatus.Pending
            };

            await context.ReportExports.AddAsync(export);
            await context.SaveChangesAsync();

            // Act
            await service.ProcessExportAsync(export.Id);

            // Assert
            var record = await context.ReportExports.FindAsync(export.Id);
            Assert.NotNull(record);
            Assert.Equal(ExportStatus.Completed, record.Status);
            Assert.NotNull(record.FileUrl);

            // Verify SignalR/Database notifications triggered
            mockNotifier.Verify(n => n.SendNotificationAsync(
                "admin_user",
                "Báo cáo hoàn tất",
                It.IsAny<string>(),
                "InApp",
                It.IsAny<string>(),
                null,
                null),
                Times.Once);
        }
    }
}
