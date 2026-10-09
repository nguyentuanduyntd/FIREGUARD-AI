using FireGuard.API.Authorization;
using FireGuard.API.Hubs;
using FireGuard.Application.Common.Models;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

using Hangfire;
using FireGuard.Application.Common.Interfaces;

namespace FireGuard.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServiceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<ProjectHub> _hubContext; // We reuse ProjectHub or use a general hub. We'll use ProjectHub for now.
        private readonly IBackgroundJobClient _backgroundJobClient;
        private readonly IFireGuardEventService _eventService;

        public ServiceController(
            ApplicationDbContext context, 
            IHubContext<ProjectHub> hubContext,
            IBackgroundJobClient backgroundJobClient,
            IFireGuardEventService eventService)
        {
            _context = context;
            _hubContext = hubContext;
            _backgroundJobClient = backgroundJobClient;
            _eventService = eventService;
        }

        public class CreateServiceRequest
        {
            public string CustomerId { get; set; } = null!;
            public string? AddressId { get; set; }
            public string? NewAddressLine { get; set; }
            public double? Latitude { get; set; }
            public double? Longitude { get; set; }
            public string? EquipmentAssetId { get; set; }
            public string? QRCodeValue { get; set; }
            public string Description { get; set; } = null!;
            public UrgencyLevel Urgency { get; set; } = UrgencyLevel.Medium;
            public ServiceRequestType RequestType { get; set; } = ServiceRequestType.Repair;
            public DateTime DesiredTime { get; set; }
        }

        public class StatusTransitionRequest
        {
            public ServiceRequestStatus NewStatus { get; set; }
            public string? Notes { get; set; }
            public string? AttachmentUrl { get; set; }
            public string? AssignedTechnicianId { get; set; }
            public byte[] RowVersion { get; set; } = null!; // Concurrency control token
        }

        [HttpGet]
        [Authorize(Roles = "ADMIN,SALES,TECHNICIAN,CUSTOMER")]
        public async Task<ActionResult<ApiResponse<List<ServiceRequest>>>> GetRequests([FromQuery] string? search, [FromQuery] ServiceRequestStatus? status)
        {
            var query = _context.ServiceRequests
                .Include(r => r.Customer)
                .Include(r => r.Address)
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var clean = search.Trim().ToLower();
                query = query.Where(r => r.RequestNumber.ToLower().Contains(clean) || r.Customer.Name.ToLower().Contains(clean));
            }

            if (status.HasValue)
            {
                query = query.Where(r => r.Status == status.Value);
            }

            var list = await query.OrderByDescending(r => r.CreatedAtUtc).ToListAsync();
            return Ok(ApiResponse<List<ServiceRequest>>.Success(list));
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "ADMIN,SALES,TECHNICIAN,CUSTOMER")]
        public async Task<ActionResult<ApiResponse<ServiceRequest>>> GetRequestById(string id)
        {
            var request = await _context.ServiceRequests
                .Include(r => r.Customer)
                .Include(r => r.Address)
                .Include(r => r.EquipmentAsset)
                .Include(r => r.StatusLogs)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
            {
                return NotFound(ApiResponse<ServiceRequest>.Failure("Service request not found."));
            }

            return Ok(ApiResponse<ServiceRequest>.Success(request));
        }

        [HttpPost]
        [Authorize(Roles = "ADMIN,SALES,CUSTOMER")]
        public async Task<ActionResult<ApiResponse<ServiceRequest>>> CreateRequest([FromBody] CreateServiceRequest request)
        {
            var customerId = request.CustomerId;

            var customerExists = await _context.Customers.AnyAsync(c => c.Id == customerId);

            if (!customerExists)
            {
                var userEmail = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email || c.Type == "email")?.Value;
                var userName = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name || c.Type == "name")?.Value ?? "Unknown Customer";
                
                if (!string.IsNullOrEmpty(userEmail))
                {
                    var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Email == userEmail);
                    if (customer != null)
                    {
                        customerId = customer.Id;
                    }
                    else
                    {
                        customer = new FireGuard.Domain.Entities.CRM.Customer
                        {
                            Name = userName,
                            Email = userEmail,
                            Phone = "0000000000",
                            CustomerType = FireGuard.Domain.Entities.CRM.CustomerType.Individual,
                            IsActive = true
                        };
                        await _context.Customers.AddAsync(customer);
                        await _context.SaveChangesAsync();
                        customerId = customer.Id;
                    }
                }
                else
                {
                    return BadRequest(ApiResponse<ServiceRequest>.Failure("Invalid CustomerId and unable to determine customer from user context."));
                }
            }

            string finalAddressId = request.AddressId ?? string.Empty;

            // Handle dynamic address creation
            if (string.IsNullOrEmpty(finalAddressId) && !string.IsNullOrEmpty(request.NewAddressLine))
            {
                var newAddress = new FireGuard.Domain.Entities.CRM.CustomerAddress
                {
                    CustomerId = customerId,
                    AddressLine = request.NewAddressLine,
                    District = "Default", // Temporary default
                    City = "Ho Chi Minh", // Temporary default
                    Latitude = request.Latitude,
                    Longitude = request.Longitude
                };
                await _context.CustomerAddresses.AddAsync(newAddress);
                await _context.SaveChangesAsync();
                finalAddressId = newAddress.Id;
            }

            if (string.IsNullOrEmpty(finalAddressId))
            {
                return BadRequest(ApiResponse<ServiceRequest>.Failure("Address is required."));
            }

            var isInstallation = request.RequestType == ServiceRequestType.Installation;

            var service = new ServiceRequest
            {
                RequestNumber = $"SR-{DateTime.UtcNow:yyyyMMddHHmmss}",
                CustomerId = customerId,
                AddressId = finalAddressId,
                EquipmentAssetId = request.EquipmentAssetId,
                QRCodeValue = request.QRCodeValue,
                Description = request.Description,
                Urgency = request.Urgency,
                RequestType = request.RequestType,
                DesiredTime = request.DesiredTime,
                Status = isInstallation ? ServiceRequestStatus.AwaitingDispatch : ServiceRequestStatus.Created
            };

            await _context.ServiceRequests.AddAsync(service);
            await _context.SaveChangesAsync();

            if (isInstallation)
            {
                await _eventService.PublishToRoleAsync("ADMIN", "ReceiveNewInstallationRequest", new
                {
                      ServiceRequestId = service.Id,
                      RequestNumber = service.RequestNumber,
                      Description = service.Description,
                      Address = request.NewAddressLine ?? "New Address",
                      CustomerId = request.CustomerId
                  });
            }
            else
            {
                // Note: Auto-dispatch via Hangfire has been disabled in favor of a Job Board style.
                // Technicians will manually accept requests from the dashboard.
            }

            return Ok(ApiResponse<ServiceRequest>.Success(service, "Service request created successfully."));
        }

        [HttpPost("{id}/status")]
        [Authorize(Roles = "ADMIN,SALES,TECHNICIAN,CUSTOMER")]
        public async Task<ActionResult<ApiResponse<bool>>> TransitionStatus(string id, [FromBody] StatusTransitionRequest request)
        {
            var service = await _context.ServiceRequests.FirstOrDefaultAsync(r => r.Id == id);
            if (service == null) return NotFound(ApiResponse<bool>.Failure("Service request not found."));

            // Concurrency Check
            if (!service.RowVersion.SequenceEqual(request.RowVersion))
            {
                return StatusCode(409, ApiResponse<bool>.Failure("Another user has already modified this service request. Please refresh."));
            }

            // State Machine Transition Validation
            if (!IsValidTransition(service.Status, request.NewStatus))
            {
                return BadRequest(ApiResponse<bool>.Failure($"Invalid status transition from {service.Status} to {request.NewStatus}."));
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var originalStatus = service.Status;
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "System";

                service.Status = request.NewStatus;
                if (!string.IsNullOrEmpty(request.AssignedTechnicianId))
                {
                    service.AssignedTechnicianId = request.AssignedTechnicianId;
                }

                var finalNotes = request.Notes;
                if (!string.IsNullOrEmpty(request.AttachmentUrl))
                {
                    finalNotes = $"{request.Notes ?? "Đã hoàn thành công việc"} [Ảnh hiện trường: {request.AttachmentUrl}]";
                }

                var log = new ServiceRequestStatusLog
                {
                    ServiceRequestId = id,
                    FromStatus = originalStatus,
                    ToStatus = request.NewStatus,
                    Notes = finalNotes,
                    ChangedBy = currentUserId
                };

                await _context.ServiceRequestStatusLogs.AddAsync(log);
                _context.ServiceRequests.Update(service);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // SIGNALR REAL-TIME NOTIFICATION BROADCAST
                await _hubContext.Clients.All.SendAsync("ReceiveServiceStatusUpdate", new
                {
                    ServiceRequestId = id,
                    RequestNumber = service.RequestNumber,
                    FromStatus = originalStatus.ToString(),
                    ToStatus = request.NewStatus.ToString(),
                    Notes = finalNotes,
                    AttachmentUrl = request.AttachmentUrl,
                    ChangedBy = currentUserId
                });

                return Ok(ApiResponse<bool>.Success(true, "Status transitioned successfully."));
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaction.RollbackAsync();
                return StatusCode(409, ApiResponse<bool>.Failure("Concurrency conflict detected."));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ApiResponse<bool>.Failure(ex.Message));
            }
        }

        private bool IsValidTransition(ServiceRequestStatus current, ServiceRequestStatus next)
        {
            if (next == ServiceRequestStatus.Cancelled)
            {
                return current == ServiceRequestStatus.Created || current == ServiceRequestStatus.AwaitingDispatch || current == ServiceRequestStatus.Assigned;
            }

            return current switch
            {
                ServiceRequestStatus.Created => next == ServiceRequestStatus.AwaitingDispatch,
                ServiceRequestStatus.AwaitingDispatch => next == ServiceRequestStatus.Dispatching || next == ServiceRequestStatus.Assigned,
                ServiceRequestStatus.Dispatching => next == ServiceRequestStatus.Assigned || next == ServiceRequestStatus.AwaitingDispatch,
                ServiceRequestStatus.Assigned => next == ServiceRequestStatus.TechnicianAccepted || next == ServiceRequestStatus.TechnicianRejected || next == ServiceRequestStatus.Completed,
                ServiceRequestStatus.TechnicianAccepted => next == ServiceRequestStatus.OnTheWay || next == ServiceRequestStatus.Completed,
                ServiceRequestStatus.TechnicianRejected => next == ServiceRequestStatus.AwaitingDispatch,
                ServiceRequestStatus.OnTheWay => next == ServiceRequestStatus.CheckedIn || next == ServiceRequestStatus.Completed,
                ServiceRequestStatus.CheckedIn => next == ServiceRequestStatus.Diagnosing || next == ServiceRequestStatus.Completed,
                ServiceRequestStatus.Diagnosing => next == ServiceRequestStatus.Repairing || next == ServiceRequestStatus.WaitingForPart || next == ServiceRequestStatus.Completed,
                ServiceRequestStatus.Repairing => next == ServiceRequestStatus.Completed || next == ServiceRequestStatus.WaitingForPart,
                ServiceRequestStatus.WaitingForPart => next == ServiceRequestStatus.Repairing || next == ServiceRequestStatus.Completed,
                ServiceRequestStatus.Completed => next == ServiceRequestStatus.CustomerConfirmed,
                _ => false
            };
        }
    }
}
