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
    public class MapController : ControllerBase
    {
        private readonly IGoogleMapsService _mapsService;
        private readonly ApplicationDbContext _context;

        public MapController(IGoogleMapsService mapsService, ApplicationDbContext context)
        {
            _mapsService = mapsService;
            _context = context;
        }

        public class UpdateGpsRequest
        {
            public double Latitude { get; set; }
            public double Longitude { get; set; }
        }

        [HttpPost("update-gps")]
        public async Task<ActionResult<ApiResponse<bool>>> UpdateGps([FromBody] UpdateGpsRequest request)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized(ApiResponse<bool>.Failure("Unauthorized."));
            }

            if (request.Latitude < -90 || request.Latitude > 90 || request.Longitude < -180 || request.Longitude > 180)
            {
                return BadRequest(ApiResponse<bool>.Failure("Tọa độ GPS không hợp lý. Vĩ độ phải từ -90 đến 90, kinh độ từ -180 đến 180."));
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == currentUserId);
            if (user == null || !user.IsTechnician)
            {
                return BadRequest(ApiResponse<bool>.Failure("User is not a technician."));
            }

            // Enforce tracking only when technician is on duty and active
            if (!user.IsOnDuty)
            {
                return BadRequest(ApiResponse<bool>.Failure("GPS tracking is only allowed while the technician is on-duty."));
            }

            // Implement Throttling: Do not log more than once every 15 seconds
            var lastLog = await _context.TechnicianGpsLogs
                .Where(l => l.TechnicianId == currentUserId)
                .OrderByDescending(l => l.TimestampUtc)
                .FirstOrDefaultAsync();

            bool skipLog = lastLog != null && (DateTime.UtcNow - lastLog.TimestampUtc).TotalSeconds < 15;

            // Update user current coordinates
            user.Latitude = request.Latitude;
            user.Longitude = request.Longitude;
            _context.Users.Update(user);

            if (!skipLog)
            {
                var gpsLog = new TechnicianGpsLog
                {
                    TechnicianId = currentUserId,
                    Latitude = request.Latitude,
                    Longitude = request.Longitude,
                    TimestampUtc = DateTime.UtcNow
                };
                await _context.TechnicianGpsLogs.AddAsync(gpsLog);
            }

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<bool>.Success(true, "Vị trí GPS đã được cập nhật thành công."));
        }

        [HttpGet("technicians")]
        [HasPermission("SERVICE_EXECUTE")]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetOnlineTechnicians()
        {
            var list = await _context.Users
                .Where(u => u.IsActive && u.IsTechnician && u.IsOnDuty && u.Latitude.HasValue && u.Longitude.HasValue)
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Username,
                    Latitude = u.Latitude!.Value,
                    Longitude = u.Longitude!.Value,
                    u.AverageRating,
                    u.AcceptanceRate,
                    u.Skills
                })
                .ToListAsync();

            return Ok(ApiResponse<List<object>>.Success(list.Cast<object>().ToList()));
        }

        [HttpGet("distance")]
        public async Task<ActionResult<ApiResponse<object>>> GetDistanceMatrix(
            [FromQuery] double origLat, [FromQuery] double origLon,
            [FromQuery] double destLat, [FromQuery] double destLon)
        {
            var (distanceKm, durationMin) = await _mapsService.GetDistanceAndDurationAsync(origLat, origLon, destLat, destLon);
            
            return Ok(ApiResponse<object>.Success(new
            {
                DistanceKm = distanceKm,
                DurationMinutes = durationMin,
                EtaText = $"{Math.Round(durationMin, 0)} phút"
            }));
        }

        [HttpPost("purge")]
        [HasPermission("SERVICE_EXECUTE")]
        public async Task<ActionResult<ApiResponse<int>>> PurgeGPSHistory()
        {
            // GDPR Purging policy: Delete history older than 7 days
            var cutoff = DateTime.UtcNow.AddDays(-7);
            var logsToPurge = await _context.TechnicianGpsLogs
                .Where(l => l.TimestampUtc < cutoff)
                .ToListAsync();

            int count = logsToPurge.Count;
            if (count > 0)
            {
                _context.TechnicianGpsLogs.RemoveRange(logsToPurge);
                await _context.SaveChangesAsync();
            }

            return Ok(ApiResponse<int>.Success(count, $"Đã dọn dẹp và xóa hoàn toàn {count} bản ghi GPS lịch sử quá 7 ngày thành công."));
        }
    }
}
