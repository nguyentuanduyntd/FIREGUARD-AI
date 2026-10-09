using System;
using System.Collections.Generic;
using System.Linq;
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
    public class AuditController : ControllerBase
    {
        private readonly IAuditService _auditService;
        private readonly ApplicationDbContext _context;

        public AuditController(IAuditService auditService, ApplicationDbContext context)
        {
            _auditService = auditService;
            _context = context;
        }

        [HttpGet]
        [HasPermission("SERVICE_EXECUTE")] // Restricts viewing to admin operators
        public async Task<ActionResult<ApiResponse<object>>> GetAuditLogs(
            [FromQuery] string? search,
            [FromQuery] string? module,
            [FromQuery] bool? isSuccess,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            var query = _context.AuditLogs.AsNoTracking().AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(l => 
                    (l.Operator != null && l.Operator.ToLower().Contains(lowerSearch)) ||
                    l.Action.ToLower().Contains(lowerSearch) ||
                    l.Module.ToLower().Contains(lowerSearch) ||
                    (l.EntityName != null && l.EntityName.ToLower().Contains(lowerSearch)) ||
                    (l.EntityId != null && l.EntityId.ToLower().Contains(lowerSearch)) ||
                    (l.ErrorMessage != null && l.ErrorMessage.ToLower().Contains(lowerSearch))
                );
            }

            if (!string.IsNullOrEmpty(module))
            {
                query = query.Where(l => l.Module == module);
            }

            if (isSuccess.HasValue)
            {
                query = query.Where(l => l.IsSuccess == isSuccess.Value);
            }

            // Total count for pagination
            var totalCount = await query.CountAsync();

            var list = await query
                .OrderByDescending(l => l.TimestampUtc)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(ApiResponse<object>.Success(new
            {
                Items = list,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            }));
        }

        [HttpPost("purge")]
        [HasPermission("SERVICE_EXECUTE")]
        public async Task<ActionResult<ApiResponse<bool>>> PurgeLogs([FromQuery] int retentionDays = 90)
        {
            if (retentionDays < 30)
            {
                return BadRequest(ApiResponse<bool>.Failure("Retention policy must preserve logs for at least 30 days."));
            }

            await _auditService.PurgeOldLogsAsync(retentionDays);
            return Ok(ApiResponse<bool>.Success(true, $"Đã thực hiện dọn dẹp và xóa hoàn toàn các bản ghi Audit Log cũ hơn {retentionDays} ngày thành công."));
        }
    }
}
