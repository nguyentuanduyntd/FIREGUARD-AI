using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FireGuard.API.Authorization;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Application.Common.Models;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FireGuard.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class KpiController : ControllerBase
    {
        private readonly ITechnicianKpiService _kpiService;
        private readonly ApplicationDbContext _context;

        public KpiController(
            ITechnicianKpiService kpiService,
            ApplicationDbContext context)
        {
            _kpiService = kpiService;
            _context = context;
        }

        public class AdjustKpiRequest
        {
            public double AdjustmentValue { get; set; }
            public string Reason { get; set; } = null!;
        }

        public class ApproveKpiRequest
        {
            public decimal ApprovedBonus { get; set; }
            public string? AdminNotes { get; set; }
        }

        [HttpGet]
        [HasPermission("SERVICE_EXECUTE")]
        public async Task<ActionResult<ApiResponse<List<TechnicianKpi>>>> GetKpis([FromQuery] int? year, [FromQuery] int? month)
        {
            var y = year ?? DateTime.UtcNow.Year;
            var m = month ?? DateTime.UtcNow.Month;

            var list = await _context.TechnicianKpis
                .Include(k => k.Technician)
                .Where(k => k.Year == y && k.Month == m)
                .OrderByDescending(k => k.AdjustedScore)
                .ToListAsync();

            return Ok(ApiResponse<List<TechnicianKpi>>.Success(list));
        }

        [HttpGet("leaderboard")]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetLeaderboard([FromQuery] int? year, [FromQuery] int? month)
        {
            var y = year ?? DateTime.UtcNow.Year;
            var m = month ?? DateTime.UtcNow.Month;

            var list = await _context.TechnicianKpis
                .Include(k => k.Technician)
                .Where(k => k.Year == y && k.Month == m)
                .OrderByDescending(k => k.AdjustedScore)
                .Select((k, idx) => new
                {
                    Rank = idx + 1,
                    k.Id,
                    TechnicianName = k.Technician.FullName,
                    k.RawKpiScore,
                    k.AdjustedScore,
                    k.CompletedJobs,
                    k.IsApproved,
                    k.ApprovedBonus
                })
                .ToListAsync();

            return Ok(ApiResponse<List<object>>.Success(list.Cast<object>().ToList()));
        }

        [HttpGet("my")]
        public async Task<ActionResult<ApiResponse<List<TechnicianKpi>>>> GetMyKpis()
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized(ApiResponse<List<TechnicianKpi>>.Failure("Unauthorized."));
            }

            var list = await _context.TechnicianKpis
                .Where(k => k.TechnicianId == currentUserId)
                .OrderByDescending(k => k.Year)
                .ThenByDescending(k => k.Month)
                .ToListAsync();

            return Ok(ApiResponse<List<TechnicianKpi>>.Success(list));
        }

        [HttpPost("{id}/adjust")]
        [HasPermission("SERVICE_EXECUTE")]
        public async Task<ActionResult<ApiResponse<bool>>> AdjustKpi(string id, [FromBody] AdjustKpiRequest request)
        {
            var adminUsername = User.FindFirst(ClaimTypes.Name)?.Value ?? "Admin";
            var success = await _kpiService.AdjustKpiAsync(id, request.AdjustmentValue, request.Reason, adminUsername);

            if (success)
            {
                return Ok(ApiResponse<bool>.Success(true, "Điều chỉnh điểm KPI thành công và đã ghi nhận lịch sử audit."));
            }

            return NotFound(ApiResponse<bool>.Failure("Không tìm thấy thông tin KPI của kỹ thuật viên."));
        }

        [HttpPost("{id}/approve")]
        [HasPermission("SERVICE_EXECUTE")]
        public async Task<ActionResult<ApiResponse<bool>>> ApproveKpi(string id, [FromBody] ApproveKpiRequest request)
        {
            var success = await _kpiService.ApproveKpiAsync(id, request.ApprovedBonus, request.AdminNotes);

            if (success)
            {
                return Ok(ApiResponse<bool>.Success(true, "Phê duyệt KPI và mức tiền thưởng cho kỹ thuật viên thành công."));
            }

            return NotFound(ApiResponse<bool>.Failure("Không tìm thấy thông tin KPI để phê duyệt."));
        }

        [HttpPost("calculate")]
        [HasPermission("SERVICE_EXECUTE")]
        public async Task<ActionResult<ApiResponse<bool>>> TriggerCalculation([FromQuery] int? year, [FromQuery] int? month)
        {
            var y = year ?? DateTime.UtcNow.Year;
            var m = month ?? DateTime.UtcNow.Month;

            await _kpiService.CalculateMonthlyKpiAsync(y, m);
            return Ok(ApiResponse<bool>.Success(true, $"Đã chạy tính toán điểm KPI cho tháng {m}/{y} thành công."));
        }
    }
}
