using FireGuard.API.Authorization;
using FireGuard.API.Hubs;
using FireGuard.Application.Common.Models;
using FireGuard.Domain.Entities.Catalog;
using FireGuard.Domain.Entities.Projects;
using FireGuard.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace FireGuard.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<ProjectHub> _hubContext;

        public ProjectController(ApplicationDbContext context, IHubContext<ProjectHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        public class CreateProjectRequest
        {
            public string Name { get; set; } = null!;
            public string? ContractId { get; set; }
            public string CustomerId { get; set; } = null!;
            public DateTime StartDate { get; set; }
            public DateTime EndDate { get; set; }
            public string? Notes { get; set; }
        }

        public class AssignTeamRequest
        {
            public string TeamLeaderId { get; set; } = null!;
            public List<string> MemberIds { get; set; } = new();
        }

        public class ProgressUpdateRequest
        {
            public int ProgressPercentage { get; set; }
            public string Notes { get; set; } = null!; // Required
            public string? ImageUrl { get; set; }
        }

        public class InstallEquipmentRequest
        {
            public string ModelId { get; set; } = null!;
            public string? EquipmentAssetId { get; set; } // Nullable if not tracked by serial
            public string? LocationName { get; set; }
        }

        public class CompleteAcceptanceRequest
        {
            public string AcceptanceRecordUrl { get; set; } = null!;
        }

        [HttpGet]
        [AllowAnonymous] // Use role logic inside instead of strict permission
        public async Task<ActionResult<ApiResponse<List<Project>>>> GetProjects()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var roles = User.FindAll(ClaimTypes.Role).Select(r => r.Value).ToList();

            var query = _context.Projects
                .Include(p => p.Customer)
                .Include(p => p.Contract)
                .AsNoTracking()
                .AsQueryable();

            if (roles.Contains("CUSTOMER"))
            {
                query = query.Where(p => p.CustomerId == userId);
            }
            else if (roles.Contains("INSTALLATION_LEADER"))
            {
                query = query.Where(p => p.TeamLeaderId == userId || string.IsNullOrEmpty(p.TeamLeaderId));
            }
            else if (roles.Contains("INSTALLATION_MEMBER"))
            {
                query = query.Where(p => (p.TeamMembersJson != null && p.TeamMembersJson.Contains(userId!)) || string.IsNullOrEmpty(p.TeamLeaderId));
            }
            // Admin and Sales see all projects

            var list = await query.OrderByDescending(p => p.CreatedAtUtc).ToListAsync();

            return Ok(ApiResponse<List<Project>>.Success(list));
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<Project>>> GetProjectById(string id)
        {
            var project = await _context.Projects
                .Include(p => p.Customer)
                .Include(p => p.Contract)
                .Include(p => p.Tasks)
                .Include(p => p.ProgressLogs)
                .Include(p => p.Installations)
                    .ThenInclude(pe => pe.Model)
                .Include(p => p.Installations)
                    .ThenInclude(pe => pe.EquipmentAsset)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
            {
                return NotFound(ApiResponse<Project>.Failure("Project not found."));
            }

            return Ok(ApiResponse<Project>.Success(project));
        }

        [HttpPost]
        [HasPermission("PROJECT_MANAGE")]
        public async Task<ActionResult<ApiResponse<Project>>> CreateProject([FromBody] CreateProjectRequest request)
        {
            var project = new Project
            {
                Name = request.Name,
                ContractId = request.ContractId,
                CustomerId = request.CustomerId,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Status = ProjectStatus.Planning,
                ProgressPercentage = 0,
                Notes = request.Notes
            };

            await _context.Projects.AddAsync(project);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<Project>.Success(project, "Project created successfully."));
        }

        [HttpPost("{id}/assign")]
        [HasPermission("PROJECT_MANAGE")]
        public async Task<ActionResult<ApiResponse<bool>>> AssignTeam(string id, [FromBody] AssignTeamRequest request)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound(ApiResponse<bool>.Failure("Project not found."));

            project.TeamLeaderId = request.TeamLeaderId;
            project.TeamMembersJson = string.Join(",", request.MemberIds);
            project.Status = ProjectStatus.Ready;

            _context.Projects.Update(project);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<bool>.Success(true, "Installation team assigned successfully."));
        }

        [HttpGet("recent-progress")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetRecentProgressLogs()
        {
            var logs = await _context.ProjectProgressLogs
                .Include(l => l.Project)
                .OrderByDescending(l => l.CreatedAtUtc)
                .Take(20)
                .Select(l => new
                {
                    l.Id,
                    l.ProjectId,
                    ProjectName = l.Project != null ? l.Project.Name : "Công trình PCCC",
                    l.ProgressPercentage,
                    l.Notes,
                    l.ImageUrl,
                    l.CreatedAtUtc,
                    CreatedBy = l.CreatedBy ?? "Đội trưởng thi công"
                })
                .ToListAsync();

            return Ok(ApiResponse<List<object>>.Success(logs.Cast<object>().ToList()));
        }

        [HttpPost("{id}/progress")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<bool>>> UpdateProgress(string id, [FromBody] ProgressUpdateRequest request)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound(ApiResponse<bool>.Failure("Project not found."));

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrWhiteSpace(request.Notes))
            {
                return BadRequest(ApiResponse<bool>.Failure("Notes are mandatory for all progress updates."));
            }

            project.ProgressPercentage = request.ProgressPercentage;
            if (project.Status == ProjectStatus.Planning || project.Status == ProjectStatus.Ready)
            {
                project.Status = ProjectStatus.InProgress;
            }

            var log = new ProjectProgressLog
            {
                ProjectId = id,
                ProgressPercentage = request.ProgressPercentage,
                Notes = request.Notes,
                ImageUrl = request.ImageUrl,
                CreatedBy = User.Identity?.Name ?? "Đội trưởng thi công",
                CreatedAtUtc = DateTime.UtcNow
            };

            await _context.ProjectProgressLogs.AddAsync(log);
            _context.Projects.Update(project);
            await _context.SaveChangesAsync();

            // REAL-TIME SIGNALR BROADCAST: Send update to all clients in group
            await _hubContext.Clients.Group(id).SendAsync("ReceiveProgressUpdate", new
            {
                ProjectId = id,
                ProgressPercentage = request.ProgressPercentage,
                Notes = request.Notes,
                ImageUrl = request.ImageUrl,
                UpdatedBy = currentUserId ?? "Đội trưởng"
            });

            return Ok(ApiResponse<bool>.Success(true, "Progress updated successfully and broadcasted in realtime."));
        }

        [HttpPost("{id}/equipment")]
        [HasPermission("INSTALLATION_UPDATE")]
        public async Task<ActionResult<ApiResponse<bool>>> InstallEquipment(string id, [FromBody] InstallEquipmentRequest request)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound(ApiResponse<bool>.Failure("Project not found."));

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var projectEquipment = new ProjectEquipment
                {
                    ProjectId = id,
                    ModelId = request.ModelId,
                    EquipmentAssetId = request.EquipmentAssetId,
                    LocationName = request.LocationName,
                    IsWarrantyActivated = false
                };

                // CRITICAL RULE: If serial number is supplied, deduct/move the asset from warehouse
                if (!string.IsNullOrEmpty(request.EquipmentAssetId))
                {
                    var asset = await _context.EquipmentAssets.FindAsync(request.EquipmentAssetId);
                    if (asset == null)
                    {
                        return BadRequest(ApiResponse<bool>.Failure("Equipment asset serial not found."));
                    }

                    if (asset.Status != AssetStatus.InStock)
                    {
                        return BadRequest(ApiResponse<bool>.Failure("Asset is not in warehouse stock."));
                    }

                    // Deduct from stock levels
                    if (!string.IsNullOrEmpty(asset.WarehouseId))
                    {
                        var stock = await _context.WarehouseStocks
                            .FirstOrDefaultAsync(ws => ws.WarehouseId == asset.WarehouseId && ws.ModelId == request.ModelId);

                        if (stock != null)
                        {
                            stock.Quantity = Math.Max(0, stock.Quantity - 1);
                            _context.WarehouseStocks.Update(stock);
                        }
                    }

                    asset.Status = AssetStatus.Installed;
                    asset.WarehouseId = null;
                    asset.CustomerId = project.CustomerId;
                    _context.EquipmentAssets.Update(asset);
                }

                await _context.ProjectEquipments.AddAsync(projectEquipment);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(ApiResponse<bool>.Success(true, "Equipment physical installation registered successfully."));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ApiResponse<bool>.Failure(ex.Message));
            }
        }

        [HttpPost("{id}/acceptance")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<bool>>> CompleteAcceptance(string id, [FromBody] CompleteAcceptanceRequest request)
        {
            var project = await _context.Projects
                .Include(p => p.Installations)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null) return NotFound(ApiResponse<bool>.Failure("Project not found."));

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                project.AcceptanceRecordUrl = request.AcceptanceRecordUrl;
                project.Status = ProjectStatus.Completed;
                project.ProgressPercentage = 100;
                project.HandoverDate = DateTime.UtcNow;

                // CRITICAL BUSINESS RULE: Warranty is only activated after acceptance record completion
                foreach (var inst in project.Installations)
                {
                    inst.IsWarrantyActivated = true;
                    inst.WarrantyStartDate = DateTime.UtcNow;
                    _context.ProjectEquipments.Update(inst);
                }

                _context.Projects.Update(project);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(ApiResponse<bool>.Success(true, "Project completed and equipment warranties activated successfully."));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ApiResponse<bool>.Failure(ex.Message));
            }
        }
    }
}
