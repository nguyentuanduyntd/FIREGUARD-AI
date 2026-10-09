using FireGuard.API.Authorization;
using FireGuard.Application.Common.Models;
using FireGuard.Domain.Entities.Catalog;
using FireGuard.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FireGuard.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CatalogController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CatalogController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ==================== SUPPLIERS ====================
        [HttpGet("suppliers")]
        [HasPermission("INVENTORY_VIEW")]
        public async Task<ActionResult<ApiResponse<List<Supplier>>>> GetSuppliers()
        {
            var suppliers = await _context.Suppliers.ToListAsync();
            return Ok(ApiResponse<List<Supplier>>.Success(suppliers));
        }

        [HttpPost("suppliers")]
        [HasPermission("INVENTORY_IMPORT")]
        public async Task<ActionResult<ApiResponse<Supplier>>> CreateSupplier([FromBody] Supplier supplier)
        {
            await _context.Suppliers.AddAsync(supplier);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<Supplier>.Success(supplier));
        }

        // ==================== BRANDS ====================
        [HttpGet("brands")]
        [HasPermission("INVENTORY_VIEW")]
        public async Task<ActionResult<ApiResponse<List<Brand>>>> GetBrands()
        {
            var brands = await _context.Brands.ToListAsync();
            return Ok(ApiResponse<List<Brand>>.Success(brands));
        }

        [HttpPost("brands")]
        [HasPermission("INVENTORY_IMPORT")]
        public async Task<ActionResult<ApiResponse<Brand>>> CreateBrand([FromBody] Brand brand)
        {
            await _context.Brands.AddAsync(brand);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<Brand>.Success(brand));
        }

        // ==================== CATEGORIES ====================
        [HttpGet("categories")]
        [HasPermission("INVENTORY_VIEW")]
        public async Task<ActionResult<ApiResponse<List<EquipmentCategory>>>> GetCategories()
        {
            var categories = await _context.EquipmentCategories.ToListAsync();
            return Ok(ApiResponse<List<EquipmentCategory>>.Success(categories));
        }

        [HttpPost("categories")]
        [HasPermission("INVENTORY_IMPORT")]
        public async Task<ActionResult<ApiResponse<EquipmentCategory>>> CreateCategory([FromBody] EquipmentCategory category)
        {
            await _context.EquipmentCategories.AddAsync(category);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<EquipmentCategory>.Success(category));
        }

        // ==================== UNITS ====================
        [HttpGet("units")]
        [HasPermission("INVENTORY_VIEW")]
        public async Task<ActionResult<ApiResponse<List<Unit>>>> GetUnits()
        {
            var units = await _context.Units.ToListAsync();
            return Ok(ApiResponse<List<Unit>>.Success(units));
        }

        [HttpPost("units")]
        [HasPermission("INVENTORY_IMPORT")]
        public async Task<ActionResult<ApiResponse<Unit>>> CreateUnit([FromBody] Unit unit)
        {
            await _context.Units.AddAsync(unit);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<Unit>.Success(unit));
        }
    }
}
