using System;
using System.Threading.Tasks;
using FireGuard.Application.Common.Models;

namespace FireGuard.Application.Common.Interfaces
{
    public interface IDashboardService
    {
        Task<AdminDashboardDto> GetAdminDashboardAsync(DateTime startDate, DateTime endDate, bool bypassCache = false);
        Task InvalidateDashboardCacheAsync();
    }
}
