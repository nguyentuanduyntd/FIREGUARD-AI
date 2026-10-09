using System;
using System.Collections.Generic;
using System.IO;
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
    public class ReportController : ControllerBase
    {
        private readonly IReportService _reportService;
        private readonly ApplicationDbContext _context;

        public ReportController(IReportService reportService, ApplicationDbContext context)
        {
            _reportService = reportService;
            _context = context;
        }

        public class RequestExportCommand
        {
            public ReportType ReportType { get; set; }
            public string FileFormat { get; set; } = null!; // "Excel" or "PDF"
            public string? FiltersJson { get; set; }
        }

        [HttpGet]
        [HasPermission("SERVICE_EXECUTE")]
        public async Task<ActionResult<ApiResponse<List<ReportExport>>>> GetMyExports()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var list = await _context.ReportExports
                .Where(e => string.IsNullOrEmpty(userId) || e.RequestedBy == userId)
                .OrderByDescending(e => e.CreatedAtUtc)
                .ToListAsync();

            return Ok(ApiResponse<List<ReportExport>>.Success(list));
        }

        [HttpPost("export")]
        [HasPermission("SERVICE_EXECUTE")]
        public async Task<ActionResult<ApiResponse<string>>> RequestExport([FromBody] RequestExportCommand command)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                var adminUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == "admin");
                userId = adminUser?.Id ?? "admin";
            }
            
            var exportId = await _reportService.TriggerExportAsync(
                command.ReportType,
                command.FileFormat,
                command.FiltersJson ?? "{}",
                userId
            );

            return Ok(ApiResponse<string>.Success(exportId, "Yêu cầu kết xuất báo cáo của bạn đang được xử lý trong nền. Bạn sẽ nhận được thông báo sau khi hoàn tất."));
        }

        [HttpGet("{id}/download")]
        [AllowAnonymous] // Allow download via temporary links
        public async Task<IActionResult> DownloadReport(string id)
        {
            var export = await _context.ReportExports.FirstOrDefaultAsync(e => e.Id == id);
            if (export == null)
            {
                return NotFound("Không tìm thấy tệp báo cáo.");
            }

            if (export.Status != ExportStatus.Completed || string.IsNullOrEmpty(export.FileUrl))
            {
                return BadRequest("Báo cáo chưa được xử lý hoàn tất.");
            }

            if (export.ExpiresAtUtc.HasValue && DateTime.UtcNow > export.ExpiresAtUtc.Value)
            {
                return BadRequest("Đường liên kết tải xuống đã hết hạn (Thời hạn tối đa là 24h).");
            }

            var fileName = Path.GetFileName(export.FileUrl);
            var targetDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "wwwroot", "exports");
            var filePath = Path.Combine(targetDir, fileName);

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound("Tệp báo cáo không còn tồn tại trên máy chủ.");
            }

            var bytes = await System.IO.File.ReadAllBytesAsync(filePath);
            var contentType = export.FileFormat == "PDF" ? "application/pdf" : "text/csv";

            return File(bytes, contentType, fileName);
        }
    }
}
