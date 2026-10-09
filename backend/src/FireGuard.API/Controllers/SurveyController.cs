using FireGuard.API.Authorization;
using FireGuard.Application.Common.Models;
using FireGuard.Domain.Entities.CRM;
using FireGuard.Domain.Entities.Sales;
using FireGuard.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FireGuard.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SurveyController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SurveyController(ApplicationDbContext context)
        {
            _context = context;
        }

        public class CreateSurveyRequest
        {
            public string CustomerId { get; set; } = null!;
            public string AddressId { get; set; } = null!;
            public DateTime ScheduledDate { get; set; }
        }

        public class AssignSurveyRequest
        {
            public string AssignedUserId { get; set; } = null!;
        }

        public class CheckInRequest
        {
            public double Latitude { get; set; }
            public double Longitude { get; set; }
        }

        public class CompleteSurveyRequest
        {
            public double Area { get; set; }
            public int FloorCount { get; set; }
            public string? BuildingType { get; set; }
            public int RoomCount { get; set; }
            public string? BuildingMaterial { get; set; }
            public string? RiskLevel { get; set; }
            public string? ExistingPcccSystem { get; set; }
            public string? CustomerRequirements { get; set; }
            public string? ResultNotes { get; set; }
            public List<string> Images { get; set; } = new();
            public List<ProposedItemRequest> ProposedItems { get; set; } = new();
        }

        public class ProposedItemRequest
        {
            public string ModelId { get; set; } = null!;
            public int Quantity { get; set; }
            public string? Notes { get; set; }
        }

        [HttpGet]
        [HasPermission("SURVEY_MANAGE")]
        public async Task<ActionResult<ApiResponse<List<SurveyRequest>>>> GetSurveys([FromQuery] string? search, [FromQuery] SurveyStatus? status)
        {
            var query = _context.SurveyRequests
                .Include(s => s.Customer)
                .Include(s => s.Address)
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var clean = search.Trim().ToLower();
                query = query.Where(s => s.RequestNumber.ToLower().Contains(clean) || s.Customer.Name.ToLower().Contains(clean));
            }

            if (status.HasValue)
            {
                query = query.Where(s => s.Status == status.Value);
            }

            var list = await query.OrderByDescending(s => s.CreatedAtUtc).ToListAsync();
            return Ok(ApiResponse<List<SurveyRequest>>.Success(list));
        }

        [HttpGet("{id}")]
        [HasPermission("SURVEY_MANAGE")]
        public async Task<ActionResult<ApiResponse<SurveyRequest>>> GetSurveyById(string id)
        {
            var survey = await _context.SurveyRequests
                .Include(s => s.Customer)
                .Include(s => s.Address)
                .Include(s => s.Images)
                .Include(s => s.ProposedItems)
                    .ThenInclude(p => p.Model)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (survey == null)
            {
                return NotFound(ApiResponse<SurveyRequest>.Failure("Survey request not found."));
            }

            return Ok(ApiResponse<SurveyRequest>.Success(survey));
        }

        [HttpPost]
        [HasPermission("SURVEY_MANAGE")]
        public async Task<ActionResult<ApiResponse<SurveyRequest>>> CreateSurvey([FromBody] CreateSurveyRequest request)
        {
            var survey = new SurveyRequest
            {
                RequestNumber = $"SV-{DateTime.UtcNow:yyyyMMddHHmmss}",
                CustomerId = request.CustomerId,
                AddressId = request.AddressId,
                ScheduledDate = request.ScheduledDate,
                Status = SurveyStatus.Pending
            };

            await _context.SurveyRequests.AddAsync(survey);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<SurveyRequest>.Success(survey, "Survey request created successfully."));
        }

        [HttpPost("{id}/assign")]
        [HasPermission("SURVEY_MANAGE")]
        public async Task<ActionResult<ApiResponse<bool>>> AssignSurvey(string id, [FromBody] AssignSurveyRequest request)
        {
            var survey = await _context.SurveyRequests.FindAsync(id);
            if (survey == null) return NotFound(ApiResponse<bool>.Failure("Survey request not found."));

            survey.AssignedUserId = request.AssignedUserId;
            survey.Status = SurveyStatus.Assigned;

            _context.SurveyRequests.Update(survey);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<bool>.Success(true, "Survey assigned successfully."));
        }

        [HttpPost("{id}/checkin")]
        [HasPermission("SURVEY_MANAGE")]
        public async Task<ActionResult<ApiResponse<bool>>> CheckIn(string id, [FromBody] CheckInRequest request)
        {
            var survey = await _context.SurveyRequests.FindAsync(id);
            if (survey == null) return NotFound(ApiResponse<bool>.Failure("Survey request not found."));

            if (survey.Status != SurveyStatus.Assigned)
            {
                return BadRequest(ApiResponse<bool>.Failure("Survey must be assigned before checking in."));
            }

            survey.CheckedInLatitude = request.Latitude;
            survey.CheckedInLongitude = request.Longitude;
            survey.CheckedInTime = DateTime.UtcNow;
            survey.Status = SurveyStatus.CheckedIn;

            _context.SurveyRequests.Update(survey);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<bool>.Success(true, "GPS check-in recorded successfully."));
        }

        [HttpPost("{id}/complete")]
        [HasPermission("SURVEY_MANAGE")]
        public async Task<ActionResult<ApiResponse<bool>>> CompleteSurvey(string id, [FromBody] CompleteSurveyRequest request)
        {
            var survey = await _context.SurveyRequests
                .Include(s => s.Images)
                .Include(s => s.ProposedItems)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (survey == null) return NotFound(ApiResponse<bool>.Failure("Survey request not found."));

            survey.Area = request.Area;
            survey.FloorCount = request.FloorCount;
            survey.BuildingType = request.BuildingType;
            survey.RoomCount = request.RoomCount;
            survey.BuildingMaterial = request.BuildingMaterial;
            survey.RiskLevel = request.RiskLevel;
            survey.ExistingPcccSystem = request.ExistingPcccSystem;
            survey.CustomerRequirements = request.CustomerRequirements;
            survey.ResultNotes = request.ResultNotes;
            survey.Status = SurveyStatus.Completed;

            // Clear old values if any
            _context.SurveyImages.RemoveRange(survey.Images);
            _context.SurveyProposedItems.RemoveRange(survey.ProposedItems);
            survey.Images.Clear();
            survey.ProposedItems.Clear();

            // Save new images
            foreach (var img in request.Images)
            {
                survey.Images.Add(new SurveyImage { ImageUrl = img });
            }

            // Save proposed equipment
            foreach (var item in request.ProposedItems)
            {
                survey.ProposedItems.Add(new SurveyProposedItem
                {
                    ModelId = item.ModelId,
                    Quantity = item.Quantity,
                    Notes = item.Notes
                });
            }

            _context.SurveyRequests.Update(survey);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<bool>.Success(true, "Survey details saved and completed."));
        }

        [HttpPost("{id}/convert")]
        [HasPermission("QUOTATION_CREATE")]
        public async Task<ActionResult<ApiResponse<Quotation>>> ConvertToQuotation(string id)
        {
            var survey = await _context.SurveyRequests
                .Include(s => s.ProposedItems)
                    .ThenInclude(p => p.Model)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (survey == null) return NotFound(ApiResponse<Quotation>.Failure("Survey request not found."));

            if (survey.Status != SurveyStatus.Completed)
            {
                return BadRequest(ApiResponse<Quotation>.Failure("Only completed surveys can be converted to quotations."));
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                decimal subTotal = 0;
                var items = new List<QuotationItem>();
                foreach (var prop in survey.ProposedItems)
                {
                    var price = prop.Model.SellingPrice;
                    var total = price * prop.Quantity;
                    subTotal += total;

                    items.Add(new QuotationItem
                    {
                        ItemType = QuotationItemType.Equipment,
                        ModelId = prop.ModelId,
                        Name = prop.Model.Name,
                        Quantity = prop.Quantity,
                        UnitPrice = price,
                        TotalPrice = total
                    });
                }

                // Add standard installation service as a recommendation placeholder
                var installationCost = subTotal * 0.1m; // 10%
                subTotal += installationCost;
                items.Add(new QuotationItem
                {
                    ItemType = QuotationItemType.InstallationService,
                    Name = "Dịch vụ thi công lắp đặt thiết bị PCCC (10% dự tính)",
                    Quantity = 1,
                    UnitPrice = installationCost,
                    TotalPrice = installationCost
                });

                var vatAmount = subTotal * 0.1m; // 10% VAT
                var totalAmount = subTotal + vatAmount;

                var quotation = new Quotation
                {
                    QuotationNumber = $"QO-{DateTime.UtcNow:yyyyMMddHHmmss}",
                    CustomerId = survey.CustomerId,
                    ExpirationDate = DateTime.UtcNow.AddDays(30), // 30 days expiration
                    SubTotal = subTotal,
                    DiscountAmount = 0,
                    VatRate = 10,
                    VatAmount = vatAmount,
                    TotalAmount = totalAmount,
                    Status = QuotationStatus.Draft,
                    Notes = $"Được chuyển từ phiếu khảo sát: {survey.RequestNumber}. " + survey.ResultNotes,
                    Items = items
                };

                survey.Status = SurveyStatus.Converted;
                _context.SurveyRequests.Update(survey);

                await _context.Quotations.AddAsync(quotation);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(ApiResponse<Quotation>.Success(quotation, "Survey successfully converted to Quotation."));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ApiResponse<Quotation>.Failure(ex.Message));
            }
        }
    }
}
