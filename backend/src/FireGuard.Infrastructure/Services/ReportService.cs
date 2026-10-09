using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Persistence;
using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace FireGuard.Infrastructure.Services
{
    public class ReportService : IReportService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IBackgroundJobClient _backgroundJobClient;

        public ReportService(
            ApplicationDbContext context,
            INotificationService notificationService,
            IBackgroundJobClient backgroundJobClient)
        {
            _context = context;
            _notificationService = notificationService;
            _backgroundJobClient = backgroundJobClient;
        }

        public async Task<string> TriggerExportAsync(ReportType type, string format, string filtersJson, string username)
        {
            var export = new ReportExport
            {
                RequestedBy = username,
                ReportType = type,
                FileFormat = format,
                FiltersJson = filtersJson,
                Status = ExportStatus.Pending,
                ExpiresAtUtc = DateTime.UtcNow.AddHours(24)
            };

            await _context.ReportExports.AddAsync(export);
            await _context.SaveChangesAsync();

            // Queue background export job via Hangfire
            _backgroundJobClient.Enqueue<IReportService>(s => s.ProcessExportAsync(export.Id));

            return export.Id;
        }

        public async Task ProcessExportAsync(string exportId)
        {
            var export = await _context.ReportExports.FirstOrDefaultAsync(e => e.Id == exportId);
            if (export == null) return;

            export.Status = ExportStatus.Processing;
            _context.ReportExports.Update(export);
            await _context.SaveChangesAsync();

            try
            {
                // Simulate processing/retrieving data from DB with filters
                await Task.Delay(2000); // simulate report generation delay

                // Create folder under wwwroot for file serving
                var targetDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "wwwroot", "exports");
                if (!Directory.Exists(targetDir))
                {
                    Directory.CreateDirectory(targetDir);
                }

                var fileName = $"Report_{export.ReportType}_{exportId}.csv";
                var filePath = Path.Combine(targetDir, fileName);

                // Write report records (mock CSV content)
                using (var writer = new StreamWriter(filePath))
                {
                    writer.WriteLine("--- FireGuard AI Comprehensive Audit Report ---");
                    writer.WriteLine($"Report Type: {export.ReportType}");
                    writer.WriteLine($"Exported At: {DateTime.UtcNow}");
                    writer.WriteLine($"Format: {export.FileFormat}");
                    writer.WriteLine($"Requested By: {export.RequestedBy}");
                    writer.WriteLine("-----------------------------------------------");
                    writer.WriteLine();

                    if (export.ReportType == ReportType.Revenue)
                    {
                        writer.WriteLine("Date,QuotationNumber,CustomerName,Amount,Status");
                        var quotes = await _context.Quotations.Include(q => q.Customer).Take(100).ToListAsync();
                        foreach (var q in quotes)
                        {
                            writer.WriteLine($"{q.CreatedAtUtc:yyyy-MM-dd},{q.QuotationNumber},{q.Customer.Name},{q.TotalAmount},{q.Status}");
                        }
                    }
                    else if (export.ReportType == ReportType.Maintenance)
                    {
                        writer.WriteLine("SerialNumber,NextMaintenance,ReminderType,Status");
                        var rems = await _context.MaintenanceReminders.Include(r => r.EquipmentAsset).Take(100).ToListAsync();
                        foreach (var r in rems)
                        {
                            writer.WriteLine($"{r.EquipmentAsset.SerialNumber},{r.ScheduledDate:yyyy-MM-dd},{r.ReminderType},{r.Status}");
                        }
                    }
                    else if (export.ReportType == ReportType.TechnicianPerformance)
                    {
                        writer.WriteLine("TechnicianName,Month,CompletedJobs,RawScore,AdjustedScore,ApprovedBonus");
                        var kpis = await _context.TechnicianKpis.Include(k => k.Technician).Take(100).ToListAsync();
                        foreach (var k in kpis)
                        {
                            writer.WriteLine($"{k.Technician.FullName},{k.Month}/{k.Year},{k.CompletedJobs},{k.RawKpiScore},{k.AdjustedScore},{k.ApprovedBonus}");
                        }
                    }
                    else
                    {
                        // Generic Fallback
                        writer.WriteLine("Timestamp,Description,RequestNumber");
                        var reqs = await _context.ServiceRequests.Take(100).ToListAsync();
                        foreach (var r in reqs)
                        {
                            writer.WriteLine($"{r.CreatedAtUtc:yyyy-MM-dd},{r.Description},{r.RequestNumber}");
                        }
                    }
                }

                // Finalize report location and links
                export.Status = ExportStatus.Completed;
                export.FileUrl = $"/exports/{fileName}";
                _context.ReportExports.Update(export);
                await _context.SaveChangesAsync();

                // Send realtime browser notification when export finishes
                await _notificationService.SendNotificationAsync(
                    export.RequestedBy,
                    "Báo cáo hoàn tất",
                    $"Báo cáo {export.ReportType} ({export.FileFormat}) của bạn đã được xuất thành công. Link tải về có thời hạn trong 24h.",
                    "InApp",
                    $"/reports?download={export.Id}"
                );
            }
            catch (Exception ex)
            {
                export.Status = ExportStatus.Failed;
                export.ErrorMessage = ex.Message;
                _context.ReportExports.Update(export);
                await _context.SaveChangesAsync();

                await _notificationService.SendNotificationAsync(
                    export.RequestedBy,
                    "Lỗi xuất báo cáo",
                    $"Đã xảy ra lỗi khi kết xuất báo cáo {export.ReportType}: {ex.Message}",
                    "InApp",
                    "/reports"
                );
            }
        }
    }
}
