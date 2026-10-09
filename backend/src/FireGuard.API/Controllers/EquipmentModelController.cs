using FireGuard.API.Authorization;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Application.Common.Models;
using FireGuard.Domain.Entities.Catalog;
using FireGuard.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace FireGuard.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EquipmentModelController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileStorageService _storageService;

        public class ModelQueryParameters
        {
            public string? SearchTerm { get; set; }
            public string? CategoryId { get; set; }
            public string? BrandId { get; set; }
            public bool? IsActive { get; set; }
            public int PageNumber { get; set; } = 1;
            public int PageSize { get; set; } = 10;
        }

        public class CreateModelRequest
        {
            public string CategoryId { get; set; } = null!;
            public string BrandId { get; set; } = null!;
            public string UnitId { get; set; } = null!;
            public string? SupplierId { get; set; }
            public string ModelCode { get; set; } = null!;
            public string Name { get; set; } = null!;
            public string? Description { get; set; }
            public decimal PurchasePrice { get; set; }
            public decimal SellingPrice { get; set; }
            public int WarrantyMonths { get; set; }
            public int MaintenanceIntervalMonths { get; set; }
            public string? Specifications { get; set; }
            public string? ImageUrl { get; set; }
            public bool IsActive { get; set; } = true;
        }

        public EquipmentModelController(ApplicationDbContext context, IFileStorageService storageService)
        {
            _context = context;
            _storageService = storageService;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<ApiResponse<PaginatedList<EquipmentModel>>>> GetModels([FromQuery] ModelQueryParameters query)
        {
            var source = _context.EquipmentModels
                .Include(m => m.Category)
                .Include(m => m.Brand)
                .Include(m => m.Unit)
                .Include(m => m.Supplier)
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(query.SearchTerm))
            {
                var search = query.SearchTerm.Trim().ToLower();
                source = source.Where(m => 
                    m.Name.ToLower().Contains(search) ||
                    m.ModelCode.ToLower().Contains(search) ||
                    m.Category.Name.ToLower().Contains(search) ||
                    m.Brand.Name.ToLower().Contains(search)
                );
            }

            if (!string.IsNullOrEmpty(query.CategoryId))
            {
                source = source.Where(m => m.CategoryId == query.CategoryId);
            }

            if (!string.IsNullOrEmpty(query.BrandId))
            {
                source = source.Where(m => m.BrandId == query.BrandId);
            }

            if (query.IsActive.HasValue)
            {
                source = source.Where(m => m.IsActive == query.IsActive.Value);
            }

            source = source.OrderByDescending(m => m.CreatedAtUtc);

            var count = await source.CountAsync();
            var items = await source
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            var paginatedResult = new PaginatedList<EquipmentModel>(items, count, query.PageNumber, query.PageSize);
            return Ok(ApiResponse<PaginatedList<EquipmentModel>>.Success(paginatedResult));
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<EquipmentModel>>> GetModelById(string id)
        {
            var model = await _context.EquipmentModels
                .Include(m => m.Category)
                .Include(m => m.Brand)
                .Include(m => m.Unit)
                .Include(m => m.Supplier)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (model == null)
            {
                return NotFound(ApiResponse<EquipmentModel>.Failure("Equipment model not found."));
            }

            return Ok(ApiResponse<EquipmentModel>.Success(model));
        }

        [HttpPost]
        [HasPermission("INVENTORY_IMPORT")]
        public async Task<ActionResult<ApiResponse<EquipmentModel>>> CreateModel([FromBody] CreateModelRequest request)
        {
            if (await _context.EquipmentModels.AnyAsync(m => m.ModelCode == request.ModelCode))
            {
                return BadRequest(ApiResponse<EquipmentModel>.Failure("Model code already exists."));
            }

            var model = new EquipmentModel
            {
                CategoryId = request.CategoryId,
                BrandId = request.BrandId,
                UnitId = request.UnitId,
                SupplierId = request.SupplierId,
                ModelCode = request.ModelCode,
                Name = request.Name,
                Description = request.Description,
                PurchasePrice = request.PurchasePrice,
                SellingPrice = request.SellingPrice,
                WarrantyMonths = request.WarrantyMonths,
                MaintenanceIntervalMonths = request.MaintenanceIntervalMonths,
                Specifications = request.Specifications,
                ImageUrl = request.ImageUrl,
                IsActive = request.IsActive
            };

            await _context.EquipmentModels.AddAsync(model);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<EquipmentModel>.Success(model, "Equipment model created successfully."));
        }

        [HttpPut("{id}")]
        [HasPermission("INVENTORY_IMPORT")]
        public async Task<ActionResult<ApiResponse<EquipmentModel>>> UpdateModel(string id, [FromBody] CreateModelRequest request)
        {
            var model = await _context.EquipmentModels.FirstOrDefaultAsync(m => m.Id == id);
            if (model == null)
            {
                return NotFound(ApiResponse<EquipmentModel>.Failure("Equipment model not found."));
            }

            if (model.ModelCode != request.ModelCode && await _context.EquipmentModels.AnyAsync(m => m.ModelCode == request.ModelCode && m.Id != id))
            {
                return BadRequest(ApiResponse<EquipmentModel>.Failure("Model code already exists."));
            }

            model.CategoryId = request.CategoryId;
            model.BrandId = request.BrandId;
            model.UnitId = request.UnitId;
            model.SupplierId = request.SupplierId;
            model.ModelCode = request.ModelCode;
            model.Name = request.Name;
            model.Description = request.Description;
            model.PurchasePrice = request.PurchasePrice;
            model.SellingPrice = request.SellingPrice;
            model.WarrantyMonths = request.WarrantyMonths;
            model.MaintenanceIntervalMonths = request.MaintenanceIntervalMonths;
            model.Specifications = request.Specifications;
            model.ImageUrl = request.ImageUrl;
            model.IsActive = request.IsActive;

            _context.EquipmentModels.Update(model);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<EquipmentModel>.Success(model, "Equipment model updated successfully."));
        }

        [HttpDelete("{id}")]
        [HasPermission("INVENTORY_EXPORT")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteModel(string id)
        {
            var model = await _context.EquipmentModels.FirstOrDefaultAsync(m => m.Id == id);
            if (model == null)
            {
                return NotFound(ApiResponse<bool>.Failure("Equipment model not found."));
            }

            // CRITICAL BUSINESS RULE: Do not delete if associated assets/giao dịch exist
            var hasAssets = await _context.EquipmentAssets.AnyAsync(a => a.ModelId == id);
            if (hasAssets)
            {
                return BadRequest(ApiResponse<bool>.Failure("Cannot delete model as it has active assets or transaction history."));
            }

            _context.EquipmentModels.Remove(model);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<bool>.Success(true, "Equipment model deleted successfully."));
        }

        [HttpGet("images")]
        [HasPermission("INVENTORY_VIEW")]
        public async Task<ActionResult<ApiResponse<List<string>>>> GetImages()
        {
            var urls = await _storageService.ListFilesAsync("images");
            return Ok(ApiResponse<List<string>>.Success(urls));
        }

        [HttpPost("upload")]
        [HasPermission("INVENTORY_IMPORT")]
        public async Task<ActionResult<ApiResponse<string>>> UploadImage([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(ApiResponse<string>.Failure("No file was uploaded."));
            }

            var extension = Path.GetExtension(file.FileName).ToLower();
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(ApiResponse<string>.Failure("Only JPG, JPEG, PNG, and WEBP image files are allowed."));
            }

            var uniqueName = $"{Guid.NewGuid()}{extension}";
            
            using var stream = file.OpenReadStream();
            var url = await _storageService.UploadFileAsync(stream, uniqueName, file.ContentType, "equipment-images");

            return Ok(ApiResponse<string>.Success(url, "Image uploaded successfully."));
        }
    }
}
