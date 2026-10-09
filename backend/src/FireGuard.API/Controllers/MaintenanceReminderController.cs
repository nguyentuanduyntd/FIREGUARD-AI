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
    public class MaintenanceReminderController : ControllerBase
    {
        private readonly IMaintenanceReminderService _reminderService;
        private readonly ApplicationDbContext _context;

        public MaintenanceReminderController(
            IMaintenanceReminderService reminderService,
            ApplicationDbContext context)
        {
            _reminderService = reminderService;
            _context = context;
        }

        public class RespondToReminderRequest
        {
            public ReminderStatus Status { get; set; }
            public string? DeclineReason { get; set; }
        }

        [HttpGet]
        [HasPermission("SERVICE_EXECUTE")]
        public async Task<ActionResult<ApiResponse<List<MaintenanceReminder>>>> GetReminders()
        {
            var list = await _context.MaintenanceReminders
                .Include(r => r.EquipmentAsset)
                    .ThenInclude(a => a.Model)
                .Include(r => r.EquipmentAsset)
                    .ThenInclude(a => a.Customer)
                .OrderByDescending(r => r.ScheduledDate)
                .ToListAsync();

            return Ok(ApiResponse<List<MaintenanceReminder>>.Success(list));
        }

        [HttpGet("customer")]
        public async Task<ActionResult<ApiResponse<List<MaintenanceReminder>>>> GetCustomerReminders()
        {
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value 
                        ?? User.Identity?.Name;
                        
            if (string.IsNullOrEmpty(email))
            {
                return Unauthorized(ApiResponse<List<MaintenanceReminder>>.Failure("Unauthorized."));
            }

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Email == email || c.Email == email + "@client.com");
            if (customer == null)
            {
                return Ok(ApiResponse<List<MaintenanceReminder>>.Success(new List<MaintenanceReminder>()));
            }

            var list = await _context.MaintenanceReminders
                .Include(r => r.EquipmentAsset)
                    .ThenInclude(a => a.Model)
                .Where(r => r.EquipmentAsset.CustomerId == customer.Id)
                .OrderByDescending(r => r.ScheduledDate)
                .ToListAsync();

            return Ok(ApiResponse<List<MaintenanceReminder>>.Success(list));
        }

        [HttpPost("{id}/respond")]
        public async Task<ActionResult<ApiResponse<bool>>> RespondToReminder(string id, [FromBody] RespondToReminderRequest request)
        {
            if (request.Status != ReminderStatus.Accepted && 
                request.Status != ReminderStatus.Declined && 
                request.Status != ReminderStatus.Postponed)
            {
                return BadRequest(ApiResponse<bool>.Failure("Trạng thái phản hồi không hợp lệ. Chỉ chấp nhận Accepted, Declined, hoặc Postponed."));
            }

            var result = await _reminderService.RespondToReminderAsync(id, request.Status, request.DeclineReason);
            if (result)
            {
                string msg = request.Status == ReminderStatus.Accepted 
                    ? "Đã chấp nhận lịch đề xuất bảo trì. Hệ thống đã đưa đơn vào hàng chờ điều phối."
                    : "Đã ghi nhận ý kiến từ chối/dời lịch của quý khách.";
                return Ok(ApiResponse<bool>.Success(true, msg));
            }

            return NotFound(ApiResponse<bool>.Failure("Không tìm thấy thông tin nhắc nhở bảo trì này."));
        }

        [HttpPost("scan")]
        [HasPermission("SERVICE_EXECUTE")]
        public async Task<ActionResult<ApiResponse<bool>>> TriggerScanManually()
        {
            await _reminderService.RunDailyScanAsync();
            return Ok(ApiResponse<bool>.Success(true, "Đã chạy quét thủ công toàn bộ thiết bị sắp đến hạn bảo trì thành công."));
        }
    }
}
