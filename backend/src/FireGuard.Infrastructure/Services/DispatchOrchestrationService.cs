using System;
using System.Linq;
using System.Threading.Tasks;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Persistence;
using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace FireGuard.Infrastructure.Services
{
    public class DispatchOrchestrationService : IDispatchOrchestrationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IDispatchScoringService _scoringService;
        private readonly IFireGuardEventService _eventService;

        public DispatchOrchestrationService(
            ApplicationDbContext context,
            IDispatchScoringService scoringService,
            IFireGuardEventService eventService)
        {
            _context = context;
            _scoringService = scoringService;
            _eventService = eventService;
        }

        public async Task StartDispatchWorkflowAsync(string serviceRequestId)
        {
            var serviceRequest = await _context.ServiceRequests
                .Include(r => r.Address)
                .FirstOrDefaultAsync(r => r.Id == serviceRequestId);

            if (serviceRequest == null) return;

            // Only allow starting workflow if the request is in AwaitingDispatch state
            if (serviceRequest.Status != ServiceRequestStatus.AwaitingDispatch) return;

            // Generate dispatch recommendation if not already existing
            ServiceRequestDispatch recommendation;
            if (string.IsNullOrEmpty(serviceRequest.DispatchRecommendationId))
            {
                recommendation = await _scoringService.GenerateRecommendationAsync(serviceRequestId);
                await _context.ServiceRequestDispatches.AddAsync(recommendation);
                await _context.SaveChangesAsync();

                serviceRequest.DispatchRecommendationId = recommendation.Id;
                _context.ServiceRequests.Update(serviceRequest);
                await _context.SaveChangesAsync();
            }
            else
            {
                recommendation = await _context.ServiceRequestDispatches
                    .Include(d => d.TechnicianScores)
                    .FirstOrDefaultAsync(d => d.Id == serviceRequest.DispatchRecommendationId) 
                    ?? await _scoringService.GenerateRecommendationAsync(serviceRequestId);
            }

            var scoresList = recommendation.TechnicianScores.OrderByDescending(s => s.TotalScore).ToList();
            if (!scoresList.Any())
            {
                // Log and notify admin that no technicians are eligible
                var log = new ServiceRequestStatusLog
                {
                    ServiceRequestId = serviceRequestId,
                    FromStatus = serviceRequest.Status,
                    ToStatus = serviceRequest.Status,
                    Notes = "Không tìm thấy kỹ thuật viên đủ điều kiện để điều phối tự động.",
                    ChangedBy = "AI Engine"
                };
                await _context.ServiceRequestStatusLogs.AddAsync(log);
                await _context.SaveChangesAsync();

                await _eventService.PublishToAllAsync("ReceiveServiceStatusUpdate", new
                {
                    ServiceRequestId = serviceRequestId,
                    RequestNumber = serviceRequest.RequestNumber,
                    Notes = "Cảnh báo: Không tìm thấy kỹ thuật viên phù hợp để điều phối tự động."
                });
                return;
            }

            // Start offering to the highest ranked technician (index 0)
            await OfferJobToTechnicianAsync(serviceRequest, recommendation, 0);
        }

        public async Task EvaluateOfferTimeoutAsync(string serviceRequestId, string offeredTechnicianId, int attemptIndex)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var serviceRequest = await _context.ServiceRequests.FirstOrDefaultAsync(r => r.Id == serviceRequestId);
                if (serviceRequest == null) return;

                // If job is no longer dispatching or has been accepted/cancelled, or if it moved to another candidate, skip
                if (serviceRequest.Status != ServiceRequestStatus.Dispatching ||
                    serviceRequest.CurrentOfferedTechnicianId != offeredTechnicianId ||
                    serviceRequest.CurrentOfferAttemptIndex != attemptIndex)
                {
                    return;
                }

                // Check if expired
                if (serviceRequest.OfferExpiresAtUtc.HasValue && serviceRequest.OfferExpiresAtUtc.Value <= DateTime.UtcNow.AddSeconds(2))
                {
                    // Log timeout transition
                    var log = new ServiceRequestStatusLog
                    {
                        ServiceRequestId = serviceRequestId,
                        FromStatus = ServiceRequestStatus.Dispatching,
                        ToStatus = ServiceRequestStatus.Dispatching,
                        Notes = $"Kỹ thuật viên {offeredTechnicianId} không nhận đơn trong vòng 60 giây (hết hạn).",
                        ChangedBy = "AI Engine"
                    };
                    await _context.ServiceRequestStatusLogs.AddAsync(log);
                    await _context.SaveChangesAsync();

                    // Load recommendation to get next candidate
                    var recommendation = await _context.ServiceRequestDispatches
                        .Include(d => d.TechnicianScores)
                        .FirstOrDefaultAsync(d => d.Id == serviceRequest.DispatchRecommendationId);

                    if (recommendation != null)
                    {
                        var scoresList = recommendation.TechnicianScores.OrderByDescending(s => s.TotalScore).ToList();
                        int nextIndex = attemptIndex + 1;

                        if (nextIndex < scoresList.Count)
                        {
                            await OfferJobToTechnicianAsync(serviceRequest, recommendation, nextIndex);
                        }
                        else
                        {
                            // No more technicians left - revert back to AwaitingDispatch and flag manual assignment
                            var prevStatus = serviceRequest.Status;
                            serviceRequest.Status = ServiceRequestStatus.AwaitingDispatch;
                            serviceRequest.CurrentOfferedTechnicianId = null;
                            serviceRequest.OfferExpiresAtUtc = null;

                            var finalLog = new ServiceRequestStatusLog
                            {
                                ServiceRequestId = serviceRequestId,
                                FromStatus = prevStatus,
                                ToStatus = ServiceRequestStatus.AwaitingDispatch,
                                Notes = "Đã thử duyệt hết danh sách kỹ thuật viên phù hợp nhưng không có ai nhận đơn. Yêu cầu chuyển sang điều phối thủ công.",
                                ChangedBy = "AI Engine"
                            };

                            _context.ServiceRequests.Update(serviceRequest);
                            await _context.ServiceRequestStatusLogs.AddAsync(finalLog);
                            await _context.SaveChangesAsync();

                            await _eventService.PublishToAllAsync("ReceiveServiceStatusUpdate", new
                            {
                                ServiceRequestId = serviceRequestId,
                                RequestNumber = serviceRequest.RequestNumber,
                                FromStatus = prevStatus.ToString(),
                                ToStatus = ServiceRequestStatus.AwaitingDispatch.ToString(),
                                Notes = "Không có kỹ thuật viên nào nhận đơn tự động. Chuyển sang gán thủ công."
                            });
                        }
                    }
                }

                await transaction.CommitAsync();
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> AcceptOfferAsync(string serviceRequestId, string technicianId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var serviceRequest = await _context.ServiceRequests.FirstOrDefaultAsync(r => r.Id == serviceRequestId);
                if (serviceRequest == null) return false;

                // Double check state to avoid race condition
                if (serviceRequest.Status != ServiceRequestStatus.Dispatching ||
                    serviceRequest.CurrentOfferedTechnicianId != technicianId)
                {
                    return false; // Already timed out, rejected or assigned to someone else
                }

                // Verify technician validity
                var tech = await _context.Users.FirstOrDefaultAsync(u => u.Id == technicianId);
                if (tech == null || !tech.IsActive || !tech.IsOnDuty || tech.IsOnLeave)
                {
                    return false; // Technician is no longer valid to receive job
                }

                var originalStatus = serviceRequest.Status;
                serviceRequest.Status = ServiceRequestStatus.TechnicianAccepted;
                serviceRequest.AssignedTechnicianId = technicianId;
                serviceRequest.CurrentOfferedTechnicianId = null;
                serviceRequest.OfferExpiresAtUtc = null;

                var log = new ServiceRequestStatusLog
                {
                    ServiceRequestId = serviceRequestId,
                    FromStatus = originalStatus,
                    ToStatus = ServiceRequestStatus.TechnicianAccepted,
                    Notes = $"Kỹ thuật viên {tech.FullName} đã chấp nhận đơn hàng.",
                    ChangedBy = tech.Username
                };

                _context.ServiceRequests.Update(serviceRequest);
                await _context.ServiceRequestStatusLogs.AddAsync(log);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                // SignalR Broadcast
                await _eventService.PublishToAllAsync("ReceiveServiceStatusUpdate", new
                {
                    ServiceRequestId = serviceRequestId,
                    RequestNumber = serviceRequest.RequestNumber,
                    FromStatus = originalStatus.ToString(),
                    ToStatus = ServiceRequestStatus.TechnicianAccepted.ToString(),
                    Notes = $"Đã giao đơn thành công cho {tech.FullName}.",
                    ChangedBy = tech.Username
                });

                return true;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return false;
            }
        }

        public async Task<bool> RejectOfferAsync(string serviceRequestId, string technicianId, string? reason)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var serviceRequest = await _context.ServiceRequests.FirstOrDefaultAsync(r => r.Id == serviceRequestId);
                if (serviceRequest == null) return false;

                if (serviceRequest.Status != ServiceRequestStatus.Dispatching ||
                    serviceRequest.CurrentOfferedTechnicianId != technicianId)
                {
                    return false;
                }

                var tech = await _context.Users.FirstOrDefaultAsync(u => u.Id == technicianId);
                var techName = tech?.FullName ?? technicianId;

                var log = new ServiceRequestStatusLog
                {
                    ServiceRequestId = serviceRequestId,
                    FromStatus = ServiceRequestStatus.Dispatching,
                    ToStatus = ServiceRequestStatus.Dispatching,
                    Notes = $"Kỹ thuật viên {techName} từ chối nhận đơn. Lý do: {reason ?? "Không rõ"}.",
                    ChangedBy = tech?.Username ?? "Technician"
                };
                await _context.ServiceRequestStatusLogs.AddAsync(log);
                await _context.SaveChangesAsync();

                // Immediately move to the next candidate
                var recommendation = await _context.ServiceRequestDispatches
                    .Include(d => d.TechnicianScores)
                    .FirstOrDefaultAsync(d => d.Id == serviceRequest.DispatchRecommendationId);

                if (recommendation != null)
                {
                    var scoresList = recommendation.TechnicianScores.OrderByDescending(s => s.TotalScore).ToList();
                    int nextIndex = serviceRequest.CurrentOfferAttemptIndex + 1;

                    if (nextIndex < scoresList.Count)
                    {
                        await OfferJobToTechnicianAsync(serviceRequest, recommendation, nextIndex);
                    }
                    else
                    {
                        // No more technicians left - revert back to AwaitingDispatch
                        var prevStatus = serviceRequest.Status;
                        serviceRequest.Status = ServiceRequestStatus.AwaitingDispatch;
                        serviceRequest.CurrentOfferedTechnicianId = null;
                        serviceRequest.OfferExpiresAtUtc = null;

                        var finalLog = new ServiceRequestStatusLog
                        {
                            ServiceRequestId = serviceRequestId,
                            FromStatus = prevStatus,
                            ToStatus = ServiceRequestStatus.AwaitingDispatch,
                            Notes = "Đã duyệt hết danh sách kỹ thuật viên. Không có ai nhận đơn. Chuyển sang điều phối thủ công.",
                            ChangedBy = "AI Engine"
                        };

                        _context.ServiceRequests.Update(serviceRequest);
                        await _context.ServiceRequestStatusLogs.AddAsync(finalLog);
                        await _context.SaveChangesAsync();

                        await _eventService.PublishToAllAsync("ReceiveServiceStatusUpdate", new
                        {
                            ServiceRequestId = serviceRequestId,
                            RequestNumber = serviceRequest.RequestNumber,
                            FromStatus = prevStatus.ToString(),
                            ToStatus = ServiceRequestStatus.AwaitingDispatch.ToString(),
                            Notes = "Không có kỹ thuật viên nào nhận đơn. Chuyển sang gán thủ công."
                        });
                    }
                }

                await transaction.CommitAsync();
                return true;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return false;
            }
        }

        private async Task OfferJobToTechnicianAsync(ServiceRequest serviceRequest, ServiceRequestDispatch recommendation, int index)
        {
            var scoresList = recommendation.TechnicianScores.OrderByDescending(s => s.TotalScore).ToList();
            var candidate = scoresList[index];

            serviceRequest.Status = ServiceRequestStatus.Dispatching;
            serviceRequest.CurrentOfferedTechnicianId = candidate.TechnicianId;
            serviceRequest.OfferExpiresAtUtc = DateTime.UtcNow.AddSeconds(60);
            serviceRequest.CurrentOfferAttemptIndex = index;
            serviceRequest.DispatchRecommendationId = recommendation.Id;

            var log = new ServiceRequestStatusLog
            {
                ServiceRequestId = serviceRequest.Id,
                FromStatus = serviceRequest.Status,
                ToStatus = ServiceRequestStatus.Dispatching,
                Notes = $"Đang gửi đề xuất giao việc cho Kỹ thuật viên {candidate.TechnicianName} (Hạng #{index + 1}, Điểm {Math.Round(candidate.TotalScore, 1)}/100). Chờ phản hồi trong 60 giây.",
                ChangedBy = "AI Engine"
            };

            _context.ServiceRequests.Update(serviceRequest);
            await _context.ServiceRequestStatusLogs.AddAsync(log);
            await _context.SaveChangesAsync();

            // Schedule Hangfire timeout check
            try
            {
                BackgroundJob.Schedule<IDispatchOrchestrationService>(
                    s => s.EvaluateOfferTimeoutAsync(serviceRequest.Id, candidate.TechnicianId, index),
                    TimeSpan.FromSeconds(60)
                );
            }
            catch (Exception)
            {
                // In test or non-Hangfire environments, safely continue
            }

            // SignalR notify specific user
            await _eventService.PublishToUserAsync(candidate.TechnicianId, "ReceiveJobOffer", new
            {
                ServiceRequestId = serviceRequest.Id,
                RequestNumber = serviceRequest.RequestNumber,
                Description = serviceRequest.Description,
                Urgency = serviceRequest.Urgency.ToString(),
                OfferExpiresAt = serviceRequest.OfferExpiresAtUtc
            });

            // SignalR notify all about state transition
            await _eventService.PublishToAllAsync("ReceiveServiceStatusUpdate", new
            {
                ServiceRequestId = serviceRequest.Id,
                RequestNumber = serviceRequest.RequestNumber,
                FromStatus = serviceRequest.Status.ToString(),
                ToStatus = ServiceRequestStatus.Dispatching.ToString(),
                Notes = $"Đang đề xuất giao đơn cho {candidate.TechnicianName}."
            });
        }
    }
}
