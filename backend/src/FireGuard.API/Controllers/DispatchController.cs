using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FireGuard.API.Authorization;
using FireGuard.API.Hubs;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Application.Common.Models;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace FireGuard.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DispatchController : ControllerBase
    {
        private readonly IDispatchScoringService _scoringService;
        private readonly IDispatchOrchestrationService _orchestrationService;
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<ProjectHub> _hubContext;

        public DispatchController(
            IDispatchScoringService scoringService,
            IDispatchOrchestrationService orchestrationService,
            ApplicationDbContext context,
            IHubContext<ProjectHub> hubContext)
        {
            _scoringService = scoringService;
            _orchestrationService = orchestrationService;
            _context = context;
            _hubContext = hubContext;
        }

        public class GenerateDispatchRecommendationRequest
        {
            public double MaxDistanceKm { get; set; } = 30.0;
            public double DistanceWeight { get; set; } = 0.25;
            public double SkillWeight { get; set; } = 0.25;
            public double AvailabilityWeight { get; set; } = 0.15;
            public double RatingWeight { get; set; } = 0.10;
            public double WorkloadWeight { get; set; } = 0.10;
            public double FirstTimeFixWeight { get; set; } = 0.10;
            public double AcceptanceWeight { get; set; } = 0.05;
        }

        public class ConfirmDispatchSelectionRequest
        {
            public string ServiceRequestId { get; set; } = null!;
            public string RecommendationId { get; set; } = null!;
            public string ChosenTechnicianId { get; set; } = null!;
            public string? Notes { get; set; }
        }

        public class RejectOfferRequest
        {
            public string? Reason { get; set; }
        }

        [HttpPost("{serviceRequestId}/recommend")]
        [HasPermission("SERVICE_EXECUTE")]
        public async Task<ActionResult<ApiResponse<ServiceRequestDispatch>>> RecommendTechnicians(
            string serviceRequestId,
            [FromBody] GenerateDispatchRecommendationRequest request)
        {
            try
            {
                var sum = request.DistanceWeight + request.SkillWeight + request.AvailabilityWeight +
                          request.RatingWeight + request.WorkloadWeight + request.FirstTimeFixWeight +
                          request.AcceptanceWeight;

                if (Math.Abs(sum - 1.0) > 0.01)
                {
                    return BadRequest(ApiResponse<ServiceRequestDispatch>.Failure("Tổng trọng số (weights) cấu hình bắt buộc phải bằng 1.0 (100%)."));
                }

                var recommendation = await _scoringService.GenerateRecommendationAsync(
                    serviceRequestId,
                    request.MaxDistanceKm,
                    request.DistanceWeight,
                    request.SkillWeight,
                    request.AvailabilityWeight,
                    request.RatingWeight,
                    request.WorkloadWeight,
                    request.FirstTimeFixWeight,
                    request.AcceptanceWeight
                );

                await _context.ServiceRequestDispatches.AddAsync(recommendation);
                await _context.SaveChangesAsync();

                var result = await _context.ServiceRequestDispatches
                    .Include(d => d.TechnicianScores)
                    .FirstOrDefaultAsync(d => d.Id == recommendation.Id);

                return Ok(ApiResponse<ServiceRequestDispatch>.Success(result!));
            }
            catch (ArgumentException ex)
            {
                return NotFound(ApiResponse<ServiceRequestDispatch>.Failure(ex.Message));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<ServiceRequestDispatch>.Failure(ex.Message));
            }
        }

        [HttpGet("{serviceRequestId}/recommendation")]
        [HasPermission("SERVICE_EXECUTE")]
        public async Task<ActionResult<ApiResponse<ServiceRequestDispatch>>> GetLatestRecommendation(string serviceRequestId)
        {
            var recommendation = await _context.ServiceRequestDispatches
                .Include(d => d.TechnicianScores)
                .Where(d => d.ServiceRequestId == serviceRequestId)
                .OrderByDescending(d => d.CreatedAtUtc)
                .FirstOrDefaultAsync();

            if (recommendation == null)
            {
                return NotFound(ApiResponse<ServiceRequestDispatch>.Failure("Chưa có kết quả chẩn đoán xếp hạng AI cho yêu cầu dịch vụ này."));
            }

            return Ok(ApiResponse<ServiceRequestDispatch>.Success(recommendation));
        }

        [HttpPost("confirm")]
        [HasPermission("SERVICE_EXECUTE")]
        public async Task<ActionResult<ApiResponse<bool>>> ConfirmDispatchSelection([FromBody] ConfirmDispatchSelectionRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var dispatch = await _context.ServiceRequestDispatches
                    .Include(d => d.TechnicianScores)
                    .FirstOrDefaultAsync(d => d.Id == request.RecommendationId);

                if (dispatch == null)
                {
                    return NotFound(ApiResponse<bool>.Failure("Recommendation log not found."));
                }

                var serviceRequest = await _context.ServiceRequests.FirstOrDefaultAsync(r => r.Id == request.ServiceRequestId);
                if (serviceRequest == null)
                {
                    return NotFound(ApiResponse<bool>.Failure("Service request not found."));
                }

                var technician = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.ChosenTechnicianId);
                if (technician == null)
                {
                    return NotFound(ApiResponse<bool>.Failure("Technician not found."));
                }

                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "System";

                dispatch.ChosenTechnicianId = request.ChosenTechnicianId;
                dispatch.DispatchNotes = request.Notes ?? $"Điều phối thủ công kỹ thuật viên {technician.FullName}.";
                
                var originalStatus = serviceRequest.Status;
                serviceRequest.Status = ServiceRequestStatus.Assigned;
                serviceRequest.AssignedTechnicianId = request.ChosenTechnicianId;

                var log = new ServiceRequestStatusLog
                {
                    ServiceRequestId = serviceRequest.Id,
                    FromStatus = originalStatus,
                    ToStatus = ServiceRequestStatus.Assigned,
                    Notes = dispatch.DispatchNotes,
                    ChangedBy = currentUserId
                };

                _context.ServiceRequestDispatches.Update(dispatch);
                _context.ServiceRequests.Update(serviceRequest);
                await _context.ServiceRequestStatusLogs.AddAsync(log);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                await _hubContext.Clients.All.SendAsync("ReceiveServiceStatusUpdate", new
                {
                    ServiceRequestId = serviceRequest.Id,
                    RequestNumber = serviceRequest.RequestNumber,
                    FromStatus = originalStatus.ToString(),
                    ToStatus = ServiceRequestStatus.Assigned.ToString(),
                    Notes = dispatch.DispatchNotes,
                    ChangedBy = currentUserId
                });

                return Ok(ApiResponse<bool>.Success(true, "Kỹ thuật viên đã được điều phối thành công."));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ApiResponse<bool>.Failure(ex.Message));
            }
        }

        [HttpPost("{serviceRequestId}/start")]
        [HasPermission("SERVICE_EXECUTE")]
        public async Task<ActionResult<ApiResponse<bool>>> StartAutoDispatch(string serviceRequestId)
        {
            await _orchestrationService.StartDispatchWorkflowAsync(serviceRequestId);
            return Ok(ApiResponse<bool>.Success(true, "Đã khởi chạy quy trình điều phối tự động."));
        }

        [HttpPost("{serviceRequestId}/accept")]
        public async Task<ActionResult<ApiResponse<bool>>> AcceptJobOffer(string serviceRequestId)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized(ApiResponse<bool>.Failure("Unauthorized."));
            }

            var result = await _orchestrationService.AcceptOfferAsync(serviceRequestId, currentUserId);
            if (result)
            {
                return Ok(ApiResponse<bool>.Success(true, "Chấp nhận đơn thành công."));
            }

            return BadRequest(ApiResponse<bool>.Failure("Yêu cầu nhận đơn không hợp lệ (hết hạn hoặc đã được giao cho người khác)."));
        }

        [HttpPost("{serviceRequestId}/reject")]
        public async Task<ActionResult<ApiResponse<bool>>> RejectJobOffer(string serviceRequestId, [FromBody] RejectOfferRequest request)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized(ApiResponse<bool>.Failure("Unauthorized."));
            }

            var result = await _orchestrationService.RejectOfferAsync(serviceRequestId, currentUserId, request.Reason);
            if (result)
            {
                return Ok(ApiResponse<bool>.Success(true, "Từ chối đơn thành công. Chuyển tiếp sang ứng viên tiếp theo."));
            }

            return BadRequest(ApiResponse<bool>.Failure("Không thể từ chối đơn hàng này."));
        }
    }
}
