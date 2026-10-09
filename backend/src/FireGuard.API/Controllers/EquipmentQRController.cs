using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FireGuard.Application.Common.Models;
using FireGuard.Domain.Entities.Catalog;
using FireGuard.Domain.Entities.Projects;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FireGuard.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EquipmentQRController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EquipmentQRController(ApplicationDbContext context)
        {
            _context = context;
        }

        public class GenerateQRRequest
        {
            public string ModelId { get; set; } = null!;
            public string? SerialNumber { get; set; }
            public string? CustomerId { get; set; }
            public string? ProjectId { get; set; }
            public string? LocationName { get; set; }
            public DateTime? InstallationDate { get; set; }
            public int? WarrantyPeriodMonths { get; set; }
            public int? MaintenanceIntervalMonths { get; set; }
            public AssetStatus Status { get; set; } = AssetStatus.Installed;
            public string? Notes { get; set; }
        }

        public class LogMaintenanceRequest
        {
            public string PerformedBy { get; set; } = "Kỹ thuật viên PCCC";
            public string ActionNotes { get; set; } = "Kiểm tra bảo dưỡng định kỳ đạt chuẩn PCCC";
            public int NextIntervalMonths { get; set; } = 6;
            public decimal? PressureGaugeValue { get; set; } // Bar (cho bình chữa cháy)
        }

        public class EquipmentAssetDto
        {
            public string Id { get; set; } = null!;
            public string SerialNumber { get; set; } = null!;
            public string ModelId { get; set; } = null!;
            public string ModelName { get; set; } = null!;
            public string ModelCode { get; set; } = null!;
            public string? CategoryName { get; set; }
            public string? ImageUrl { get; set; }
            public string? CustomerId { get; set; }
            public string? CustomerName { get; set; }
            public string? CustomerPhone { get; set; }
            public string? CustomerAddress { get; set; }
            public string? ProjectId { get; set; }
            public string? ProjectName { get; set; }
            public string? LocationName { get; set; }
            public string Status { get; set; } = null!;
            public DateTime InstallationDate { get; set; }
            public int WarrantyPeriodMonths { get; set; }
            public DateTime WarrantyEndDate { get; set; }
            public bool IsWarrantyValid { get; set; }
            public DateTime? LastMaintenanceDate { get; set; }
            public DateTime? NextMaintenanceDate { get; set; }
            public bool IsMaintenanceOverdue { get; set; }
            public int? DaysUntilMaintenance { get; set; }
            public string QRCodePayload { get; set; } = null!;
        }

        // ==================== 1. LIST EQUIPMENT ASSETS WITH QR & MAINTENANCE ====================
        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<EquipmentAssetDto>>>> GetAssets(
            [FromQuery] string? search = null,
            [FromQuery] string? status = null,
            [FromQuery] bool? overdueOnly = null)
        {
            var query = _context.EquipmentAssets
                .Include(a => a.Model)
                    .ThenInclude(m => m.Category)
                .Include(a => a.Customer)
                    .ThenInclude(c => c.Addresses)
                .Include(a => a.QRCode)
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(a =>
                    a.SerialNumber.ToLower().Contains(term) ||
                    a.Model.Name.ToLower().Contains(term) ||
                    (a.Customer != null && a.Customer.Name.ToLower().Contains(term)));
            }

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<AssetStatus>(status, true, out var assetStatus))
            {
                query = query.Where(a => a.Status == assetStatus);
            }

            var now = DateTime.UtcNow;

            if (overdueOnly == true)
            {
                query = query.Where(a => a.NextMaintenanceDate.HasValue && a.NextMaintenanceDate.Value < now);
            }

            var assets = await query.OrderByDescending(a => a.CreatedAtUtc).Take(100).ToListAsync();

            // Fetch location info from ProjectEquipments
            var assetIds = assets.Select(a => a.Id).ToList();
            var projectEquipments = await _context.ProjectEquipments
                .Include(pe => pe.Project)
                .Where(pe => pe.EquipmentAssetId != null && assetIds.Contains(pe.EquipmentAssetId))
                .ToDictionaryAsync(pe => pe.EquipmentAssetId!, pe => pe);

            var dtos = assets.Select(a =>
            {
                projectEquipments.TryGetValue(a.Id, out var pe);
                var installDate = a.CreatedAtUtc;
                var warrantyEnd = installDate.AddMonths(a.WarrantyPeriodMonths > 0 ? a.WarrantyPeriodMonths : 12);
                var isOverdue = a.NextMaintenanceDate.HasValue && a.NextMaintenanceDate.Value < now;
                int? daysLeft = a.NextMaintenanceDate.HasValue ? (int)(a.NextMaintenanceDate.Value - now).TotalDays : null;

                return new EquipmentAssetDto
                {
                    Id = a.Id,
                    SerialNumber = a.SerialNumber,
                    ModelId = a.ModelId,
                    ModelName = a.Model?.Name ?? "N/A",
                    ModelCode = a.Model?.ModelCode ?? "N/A",
                    CategoryName = a.Model?.Category?.Name,
                    ImageUrl = a.Model?.ImageUrl,
                    CustomerId = a.CustomerId,
                    CustomerName = a.Customer?.Name,
                    CustomerPhone = a.Customer?.Phone,
                    CustomerAddress = a.Customer?.Addresses?.FirstOrDefault()?.AddressLine,
                    ProjectId = pe?.ProjectId,
                    ProjectName = pe?.Project?.Name,
                    LocationName = pe?.LocationName ?? "Chưa chỉ định vị trí",
                    Status = a.Status.ToString(),
                    InstallationDate = installDate,
                    WarrantyPeriodMonths = a.WarrantyPeriodMonths,
                    WarrantyEndDate = warrantyEnd,
                    IsWarrantyValid = warrantyEnd > now,
                    LastMaintenanceDate = a.LastMaintenanceDate,
                    NextMaintenanceDate = a.NextMaintenanceDate,
                    IsMaintenanceOverdue = isOverdue,
                    DaysUntilMaintenance = daysLeft,
                    QRCodePayload = a.QRCode?.QRCodePayload ?? $"https://fireguard.vn/scan/asset/{a.Id}?sn={a.SerialNumber}"
                };
            }).ToList();

            return Ok(ApiResponse<List<EquipmentAssetDto>>.Success(dtos));
        }

        // ==================== 2. LOOKUP EQUIPMENT BY QR CODE OR SERIAL ====================
        [HttpGet("lookup/{code}")]
        public async Task<ActionResult<ApiResponse<object>>> LookupByCode(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(ApiResponse<object>.Failure("Vui lòng cung cấp mã QR hoặc số Serial thiết bị."));
            }

            var cleanCode = code.Trim();

            // Extract serial or assetId if user passed full URL like https://fireguard.vn/scan/asset/{id}?sn={serial}
            if (cleanCode.Contains("sn="))
            {
                var queryParams = System.Web.HttpUtility.ParseQueryString(new Uri(cleanCode).Query);
                var extractedSn = queryParams["sn"];
                if (!string.IsNullOrEmpty(extractedSn))
                {
                    cleanCode = extractedSn;
                }
            }
            else if (cleanCode.Contains("/asset/"))
            {
                var parts = cleanCode.Split("/asset/");
                if (parts.Length > 1)
                {
                    var idPart = parts[1].Split('?')[0].Trim('/');
                    cleanCode = idPart;
                }
            }

            var asset = await _context.EquipmentAssets
                .Include(a => a.Model)
                    .ThenInclude(m => m.Category)
                .Include(a => a.Model)
                    .ThenInclude(m => m.Brand)
                .Include(a => a.Customer)
                    .ThenInclude(c => c.Addresses)
                .Include(a => a.QRCode)
                .FirstOrDefaultAsync(a =>
                    a.SerialNumber == cleanCode ||
                    a.Id == cleanCode ||
                    (a.QRCode != null && a.QRCode.QRCodePayload.Contains(cleanCode)));

            if (asset == null)
            {
                return NotFound(ApiResponse<object>.Failure($"Không tìm thấy thiết bị PCCC với mã tra cứu: '{code}'"));
            }

            var now = DateTime.UtcNow;
            var installDate = asset.CreatedAtUtc;
            var warrantyMonths = asset.WarrantyPeriodMonths > 0 ? asset.WarrantyPeriodMonths : 12;
            var warrantyEnd = installDate.AddMonths(warrantyMonths);
            var isOverdue = asset.NextMaintenanceDate.HasValue && asset.NextMaintenanceDate.Value < now;
            int? daysLeft = asset.NextMaintenanceDate.HasValue ? (int)(asset.NextMaintenanceDate.Value - now).TotalDays : null;

            // Project & physical location
            var projectEquip = await _context.ProjectEquipments
                .Include(pe => pe.Project)
                .FirstOrDefaultAsync(pe => pe.EquipmentAssetId == asset.Id);

            // Maintenance Reminders & History
            var reminders = await _context.MaintenanceReminders
                .Where(r => r.EquipmentAssetId == asset.Id)
                .OrderByDescending(r => r.ScheduledDate)
                .Take(5)
                .Select(r => new
                {
                    r.Id,
                    r.ScheduledDate,
                    ReminderType = r.ReminderType.ToString(),
                    Status = r.Status.ToString(),
                    r.DeclineReason
                })
                .ToListAsync();

            // Service Tickets on this asset
            var serviceTickets = await _context.ServiceRequests
                .Where(s => s.EquipmentAssetId == asset.Id)
                .OrderByDescending(s => s.CreatedAtUtc)
                .Take(5)
                .Select(s => new
                {
                    s.Id,
                    s.RequestNumber,
                    RequestType = s.RequestType.ToString(),
                    Status = s.Status.ToString(),
                    s.Description,
                    s.CreatedAtUtc
                })
                .ToListAsync();

            var result = new
            {
                Asset = new
                {
                    asset.Id,
                    asset.SerialNumber,
                    Status = asset.Status.ToString(),
                    InstallationDate = installDate,
                    WarrantyMonths = warrantyMonths,
                    WarrantyEndDate = warrantyEnd,
                    IsWarrantyValid = warrantyEnd > now,
                    asset.LastMaintenanceDate,
                    asset.NextMaintenanceDate,
                    IsMaintenanceOverdue = isOverdue,
                    DaysUntilMaintenance = daysLeft,
                    QRCodePayload = asset.QRCode?.QRCodePayload ?? $"https://fireguard.vn/scan/asset/{asset.Id}?sn={asset.SerialNumber}"
                },
                Model = new
                {
                    asset.Model?.Id,
                    asset.Model?.ModelCode,
                    asset.Model?.Name,
                    Category = asset.Model?.Category?.Name,
                    Brand = asset.Model?.Brand?.Name,
                    asset.Model?.Specifications,
                    asset.Model?.ImageUrl,
                    MaintenanceIntervalMonths = asset.Model?.MaintenanceIntervalMonths ?? 6
                },
                Customer = asset.Customer != null ? new
                {
                    asset.Customer.Id,
                    asset.Customer.Name,
                    asset.Customer.Phone,
                    asset.Customer.Email,
                    Address = asset.Customer.Addresses?.FirstOrDefault()?.AddressLine
                } : null,
                Location = projectEquip != null ? new
                {
                    projectEquip.ProjectId,
                    ProjectName = projectEquip.Project?.Name,
                    projectEquip.LocationName,
                    projectEquip.IsWarrantyActivated
                } : null,
                MaintenanceHistory = reminders,
                ServiceTickets = serviceTickets
            };

            return Ok(ApiResponse<object>.Success(result));
        }

        // ==================== 3. CREATE EQUIPMENT ASSET & GENERATE QR CODE ====================
        [HttpPost("generate")]
        public async Task<ActionResult<ApiResponse<EquipmentAssetDto>>> GenerateQRCode([FromBody] GenerateQRRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ModelId))
            {
                return BadRequest(ApiResponse<EquipmentAssetDto>.Failure("Vui lòng chọn model thiết bị PCCC."));
            }

            var model = await _context.EquipmentModels.Include(m => m.Category).FirstOrDefaultAsync(m => m.Id == request.ModelId);
            if (model == null)
            {
                return NotFound(ApiResponse<EquipmentAssetDto>.Failure("Không tìm thấy model thiết bị đã chọn."));
            }

            // Generate unique Serial Number if not provided
            var serial = request.SerialNumber?.Trim();
            if (string.IsNullOrWhiteSpace(serial))
            {
                var randomSuffix = Guid.NewGuid().ToString("N")[..6].ToUpper();
                serial = $"FG-PCCC-{DateTime.UtcNow:yyyy}-{randomSuffix}";
            }

            // Check if serial already exists
            if (await _context.EquipmentAssets.AnyAsync(a => a.SerialNumber == serial))
            {
                return BadRequest(ApiResponse<EquipmentAssetDto>.Failure($"Số Serial '{serial}' đã tồn tại trên hệ thống. Vui lòng đổi số khác."));
            }

            var installDate = request.InstallationDate ?? DateTime.UtcNow;
            var warrantyMonths = request.WarrantyPeriodMonths ?? (model.WarrantyMonths > 0 ? model.WarrantyMonths : 12);
            var intervalMonths = request.MaintenanceIntervalMonths ?? (model.MaintenanceIntervalMonths > 0 ? model.MaintenanceIntervalMonths : 6);

            var asset = new EquipmentAsset
            {
                ModelId = model.Id,
                CustomerId = request.CustomerId,
                SerialNumber = serial,
                Status = request.Status,
                PurchasePrice = model.PurchasePrice,
                WarrantyPeriodMonths = warrantyMonths,
                ManufacturedDate = installDate.AddMonths(-1),
                ExpiryDate = installDate.AddYears(5),
                LastMaintenanceDate = installDate,
                NextMaintenanceDate = installDate.AddMonths(intervalMonths),
                CreatedAtUtc = installDate
            };

            await _context.EquipmentAssets.AddAsync(asset);

            // Generate EquipmentQRCode
            var qr = new EquipmentQRCode
            {
                AssetId = asset.Id,
                QRCodePayload = $"https://fireguard.vn/scan/asset/{asset.Id}?sn={asset.SerialNumber}"
            };
            await _context.EquipmentQRCodes.AddAsync(qr);

            // If project is supplied, link physical installation
            if (!string.IsNullOrWhiteSpace(request.ProjectId))
            {
                var pe = new ProjectEquipment
                {
                    ProjectId = request.ProjectId,
                    ModelId = model.Id,
                    EquipmentAssetId = asset.Id,
                    LocationName = request.LocationName ?? "Khu vực PCCC",
                    IsWarrantyActivated = true,
                    WarrantyStartDate = installDate
                };
                await _context.ProjectEquipments.AddAsync(pe);
            }

            await _context.SaveChangesAsync();

            var now = DateTime.UtcNow;
            var warrantyEnd = installDate.AddMonths(warrantyMonths);

            var dto = new EquipmentAssetDto
            {
                Id = asset.Id,
                SerialNumber = asset.SerialNumber,
                ModelId = model.Id,
                ModelName = model.Name,
                ModelCode = model.ModelCode,
                CategoryName = model.Category?.Name,
                ImageUrl = model.ImageUrl,
                CustomerId = asset.CustomerId,
                LocationName = request.LocationName ?? "Chưa chỉ định vị trí",
                Status = asset.Status.ToString(),
                InstallationDate = installDate,
                WarrantyPeriodMonths = warrantyMonths,
                WarrantyEndDate = warrantyEnd,
                IsWarrantyValid = warrantyEnd > now,
                LastMaintenanceDate = asset.LastMaintenanceDate,
                NextMaintenanceDate = asset.NextMaintenanceDate,
                IsMaintenanceOverdue = false,
                DaysUntilMaintenance = (int)(asset.NextMaintenanceDate.Value - now).TotalDays,
                QRCodePayload = qr.QRCodePayload
            };

            return Ok(ApiResponse<EquipmentAssetDto>.Success(dto, "Tạo mã định danh và QR Code thiết bị PCCC thành công."));
        }

        // ==================== 4. LOG COMPLETED MAINTENANCE CHECK ====================
        [HttpPost("{id}/log-maintenance")]
        public async Task<ActionResult<ApiResponse<bool>>> LogMaintenance(string id, [FromBody] LogMaintenanceRequest request)
        {
            var asset = await _context.EquipmentAssets.FindAsync(id);
            if (asset == null)
            {
                return NotFound(ApiResponse<bool>.Failure("Không tìm thấy thiết bị PCCC này."));
            }

            var now = DateTime.UtcNow;
            var interval = request.NextIntervalMonths > 0 ? request.NextIntervalMonths : 6;

            asset.LastMaintenanceDate = now;
            asset.NextMaintenanceDate = now.AddMonths(interval);
            asset.Status = AssetStatus.Installed; // Reset to healthy/installed

            // Close any pending maintenance reminders for this asset
            var pendingReminders = await _context.MaintenanceReminders
                .Where(r => r.EquipmentAssetId == id && r.Status != ReminderStatus.Accepted)
                .ToListAsync();

            foreach (var rem in pendingReminders)
            {
                rem.Status = ReminderStatus.Accepted;
            }

            _context.EquipmentAssets.Update(asset);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<bool>.Success(true, $"Đã ghi nhận bảo trì thiết bị thành công. Hạn bảo trì định kỳ kế tiếp: {asset.NextMaintenanceDate:dd/MM/yyyy}."));
        }

        // ==================== 5. SUMMARY STATS ====================
        [HttpGet("stats")]
        public async Task<ActionResult<ApiResponse<object>>> GetStats()
        {
            var now = DateTime.UtcNow;
            var total = await _context.EquipmentAssets.CountAsync();
            var installed = await _context.EquipmentAssets.CountAsync(a => a.Status == AssetStatus.Installed);
            var overdue = await _context.EquipmentAssets.CountAsync(a => a.NextMaintenanceDate.HasValue && a.NextMaintenanceDate.Value < now);
            var upcoming30Days = await _context.EquipmentAssets.CountAsync(a => a.NextMaintenanceDate.HasValue && a.NextMaintenanceDate.Value >= now && a.NextMaintenanceDate.Value <= now.AddDays(30));

            return Ok(ApiResponse<object>.Success(new
            {
                Total = total,
                Installed = installed,
                Overdue = overdue,
                Upcoming30Days = upcoming30Days
            }));
        }

        // ==================== 6. REFERENCE DATA FOR CREATION ====================
        [HttpGet("models")]
        public async Task<ActionResult<ApiResponse<object>>> GetModelsList()
        {
            var models = await _context.EquipmentModels
                .Include(m => m.Category)
                .Where(m => m.IsActive)
                .OrderBy(m => m.Name)
                .Select(m => new
                {
                    m.Id,
                    m.Name,
                    m.ModelCode,
                    CategoryName = m.Category != null ? m.Category.Name : "Khác",
                    m.WarrantyMonths,
                    m.MaintenanceIntervalMonths
                })
                .ToListAsync();

            var projects = await _context.Projects
                .Include(p => p.Customer)
                .OrderByDescending(p => p.CreatedAtUtc)
                .Take(50)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.CustomerId,
                    CustomerName = p.Customer != null ? p.Customer.Name : "Khách hàng"
                })
                .ToListAsync();

            var customers = await _context.Customers
                .Where(c => c.IsActive)
                .OrderBy(c => c.Name)
                .Take(50)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.Phone
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.Success(new
            {
                Models = models,
                Projects = projects,
                Customers = customers
            }));
        }
    }
}
