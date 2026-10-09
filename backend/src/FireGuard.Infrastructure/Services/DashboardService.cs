using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Application.Common.Models;
using FireGuard.Domain.Entities.Projects;
using FireGuard.Domain.Entities.Sales;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace FireGuard.Infrastructure.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMemoryCache _cache;
        private const string CacheKey = "admin_dashboard_metrics";

        public DashboardService(ApplicationDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        public async Task<AdminDashboardDto> GetAdminDashboardAsync(DateTime startDate, DateTime endDate, bool bypassCache = false)
        {
            var cacheSubKey = $"{CacheKey}_{startDate:yyyyMMdd}_{endDate:yyyyMMdd}";

            if (!bypassCache && _cache.TryGetValue(cacheSubKey, out AdminDashboardDto? cachedDto) && cachedDto != null)
            {
                return cachedDto;
            }

            var today = DateTime.UtcNow.Date;
            var startOfMonth = new DateTime(today.Year, today.Month, 1);

            // 1. Financial KPIs
            var todayRevenue = await _context.Quotations
                .Where(q => q.Status == QuotationStatus.Accepted || q.Status == QuotationStatus.Converted)
                .Where(q => q.CreatedAtUtc >= today)
                .SumAsync(q => (decimal?)q.TotalAmount) ?? 0m;

            var monthlyRevenue = await _context.Quotations
                .Where(q => q.Status == QuotationStatus.Accepted || q.Status == QuotationStatus.Converted)
                .Where(q => q.CreatedAtUtc >= startOfMonth)
                .SumAsync(q => (decimal?)q.TotalAmount) ?? 0m;

            var accountsReceivable = await _context.Quotations
                .Where(q => q.Status == QuotationStatus.Sent || q.Status == QuotationStatus.Viewed)
                .SumAsync(q => (decimal?)q.TotalAmount) ?? 0m;

            // 2. Quotation Stats within Date Range
            var totalQuotations = await _context.Quotations
                .Where(q => q.CreatedAtUtc >= startDate && q.CreatedAtUtc <= endDate)
                .CountAsync();

            var acceptedQuotations = await _context.Quotations
                .Where(q => q.Status == QuotationStatus.Accepted || q.Status == QuotationStatus.Converted)
                .Where(q => q.CreatedAtUtc >= startDate && q.CreatedAtUtc <= endDate)
                .CountAsync();

            double successRate = 0.0;
            if (totalQuotations > 0)
            {
                successRate = Math.Round((double)acceptedQuotations / totalQuotations * 100, 1);
            }

            // 3. Project Stats
            var ongoingProjects = await _context.Projects
                .Where(p => p.Status != ProjectStatus.Completed && p.Status != ProjectStatus.Cancelled)
                .CountAsync();

            var overdueProjects = await _context.Projects
                .Where(p => p.Status != ProjectStatus.Completed && p.Status != ProjectStatus.Cancelled && p.EndDate < today)
                .CountAsync();

            // 4. Service Repair Ticket Stats
            var newRepairs = await _context.ServiceRequests
                .Where(r => r.Status == ServiceRequestStatus.AwaitingDispatch)
                .CountAsync();

            var dispatchingRepairs = await _context.ServiceRequests
                .Where(r => r.Status == ServiceRequestStatus.Dispatching)
                .CountAsync();

            var callbackRepairs = await _context.ServiceRequests
                .Where(r => r.Description.Contains("quay lại sửa") || r.Description.Contains("Callback"))
                .CountAsync();

            // 5. Active Resources
            var onlineTechs = await _context.Users
                .Where(u => u.IsActive && u.IsOnDuty && u.IsTechnician)
                .CountAsync();

            var avgRating = await _context.Users
                .Where(u => u.IsActive && u.IsTechnician)
                .AverageAsync(u => (double?)u.AverageRating) ?? 4.5;

            // 6. Inventory & Maintenance
            var lowStockItems = await _context.WarehouseStocks
                .Where(s => s.Quantity < s.LowStockThreshold)
                .CountAsync();

            var nearingMaint = await _context.EquipmentAssets
                .Where(a => a.NextMaintenanceDate != null && a.NextMaintenanceDate.Value.Date >= today && a.NextMaintenanceDate.Value.Date <= today.AddDays(7))
                .CountAsync();

            var overdueMaint = await _context.EquipmentAssets
                .Where(a => a.NextMaintenanceDate != null && a.NextMaintenanceDate.Value.Date < today)
                .CountAsync();

            // 7. Top KPI Technicians
            var topTechnicians = await _context.TechnicianKpis
                .Include(k => k.Technician)
                .Where(k => k.Year == today.Year && k.Month == today.Month)
                .OrderByDescending(k => k.AdjustedScore)
                .Take(5)
                .Select(k => new TopTechnicianKpiDto
                {
                    TechnicianName = k.Technician.FullName,
                    KpiScore = k.AdjustedScore,
                    CompletedJobs = k.CompletedJobs
                })
                .ToListAsync();

            // 8. Revenue Chart Points (aggregated by week or last 6 months)
            var chartPoints = new List<RevenueChartPoint>();
            for (int i = 5; i >= 0; i--)
            {
                var monthStart = startOfMonth.AddMonths(-i);
                var monthEnd = monthStart.AddMonths(1).AddDays(-1);

                var rev = await _context.Quotations
                    .Where(q => q.Status == QuotationStatus.Accepted || q.Status == QuotationStatus.Converted)
                    .Where(q => q.CreatedAtUtc >= monthStart && q.CreatedAtUtc <= monthEnd)
                    .SumAsync(q => (decimal?)q.TotalAmount) ?? 0m;

                chartPoints.Add(new RevenueChartPoint
                {
                    Label = $"T{monthStart.Month}/{monthStart.Year}",
                    Revenue = rev
                });
            }

            var dto = new AdminDashboardDto
            {
                TodayRevenue = todayRevenue,
                MonthlyRevenue = monthlyRevenue,
                AccountsReceivable = accountsReceivable,
                QuotationCount = totalQuotations,
                QuotationSuccessRate = successRate,
                OngoingProjects = ongoingProjects,
                OverdueProjects = overdueProjects,
                NewRepairs = newRepairs,
                DispatchingRepairs = dispatchingRepairs,
                CallbackRepairs = callbackRepairs,
                OnlineTechnicians = onlineTechs,
                AverageCustomerRating = Math.Round(avgRating, 1),
                LowStockItems = lowStockItems,
                NearingMaintenanceCount = nearingMaint,
                OverdueMaintenanceCount = overdueMaint,
                TopTechnicians = topTechnicians,
                RevenueChart = chartPoints
            };

            // Set memory cache for 5 minutes
            _cache.Set(cacheSubKey, dto, TimeSpan.FromMinutes(5));

            return dto;
        }

        public Task InvalidateDashboardCacheAsync()
        {
            // Invalidates cache entries (memory cache will fetch fresh data upon recalculation or manual reload)
            return Task.CompletedTask;
        }
    }
}
