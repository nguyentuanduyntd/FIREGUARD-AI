using System;
using System.Threading.Tasks;
using FireGuard.API.Authorization;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Application.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FireGuard.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("admin")]
        [HasPermission("SERVICE_EXECUTE")] // Enforces authorization to view admin analytics
        public async Task<ActionResult<ApiResponse<AdminDashboardDto>>> GetAdminDashboard(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] bool bypassCache = false)
        {
            var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
            var end = endDate ?? DateTime.UtcNow;

            if (start > end)
            {
                return BadRequest(ApiResponse<AdminDashboardDto>.Failure("StartDate must be before EndDate."));
            }

            var dto = await _dashboardService.GetAdminDashboardAsync(start, end, bypassCache);
            return Ok(ApiResponse<AdminDashboardDto>.Success(dto));
        }

        [HttpPost("admin/cache-invalidate")]
        [HasPermission("SERVICE_EXECUTE")]
        public async Task<ActionResult<ApiResponse<bool>>> InvalidateCache()
        {
            await _dashboardService.InvalidateDashboardCacheAsync();
            return Ok(ApiResponse<bool>.Success(true, "Dashboard cache invalidated successfully."));
        }
    }
}
