using FireGuard.API.Authorization;
using FireGuard.Application.Common.Models;
using FireGuard.Domain.Entities.Sales;
using FireGuard.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FireGuard.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QuotationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public QuotationController(ApplicationDbContext context)
        {
            _context = context;
        }

        public class CreateQuotationRequest
        {
            public string CustomerId { get; set; } = null!;
            public DateTime ExpirationDate { get; set; }
            public decimal DiscountAmount { get; set; }
            public decimal VatRate { get; set; }
            public string? Notes { get; set; }
            public List<QuotationItemRequest> Items { get; set; } = new();
        }

        public class QuotationItemRequest
        {
            public QuotationItemType ItemType { get; set; }
            public string? ModelId { get; set; }
            public string Name { get; set; } = null!;
            public int Quantity { get; set; }
            public decimal UnitPrice { get; set; }
        }

        public class UpdateStatusRequest
        {
            public QuotationStatus Status { get; set; }
        }

        [HttpGet]
        [HasPermission("QUOTATION_CREATE")]
        public async Task<ActionResult<ApiResponse<List<Quotation>>>> GetQuotations([FromQuery] string? search, [FromQuery] QuotationStatus? status)
        {
            var query = _context.Quotations
                .Include(q => q.Customer)
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var clean = search.Trim().ToLower();
                query = query.Where(q => q.QuotationNumber.ToLower().Contains(clean) || q.Customer.Name.ToLower().Contains(clean));
            }

            if (status.HasValue)
            {
                query = query.Where(q => q.Status == status.Value);
            }

            var list = await query.OrderByDescending(q => q.CreatedAtUtc).ToListAsync();
            return Ok(ApiResponse<List<Quotation>>.Success(list));
        }

        [HttpGet("{id}")]
        [HasPermission("QUOTATION_CREATE")]
        public async Task<ActionResult<ApiResponse<Quotation>>> GetQuotationById(string id)
        {
            var quotation = await _context.Quotations
                .Include(q => q.Customer)
                .Include(q => q.Items)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (quotation == null)
            {
                return NotFound(ApiResponse<Quotation>.Failure("Quotation not found."));
            }

            return Ok(ApiResponse<Quotation>.Success(quotation));
        }

        [HttpPost]
        [HasPermission("QUOTATION_CREATE")]
        public async Task<ActionResult<ApiResponse<Quotation>>> CreateQuotation([FromBody] CreateQuotationRequest request)
        {
            var customer = await _context.Customers.FindAsync(request.CustomerId);
            if (customer == null)
            {
                return BadRequest(ApiResponse<Quotation>.Failure("Customer not found."));
            }

            // Calculation
            decimal subTotal = 0;
            var items = new List<QuotationItem>();
            foreach (var item in request.Items)
            {
                var price = item.UnitPrice;
                // If it is an equipment, we fetch the current model price if unit price is not supplied
                if (item.ItemType == QuotationItemType.Equipment && !string.IsNullOrEmpty(item.ModelId))
                {
                    var model = await _context.EquipmentModels.FindAsync(item.ModelId);
                    if (model != null && price == 0)
                    {
                        price = model.SellingPrice;
                    }
                }

                var total = price * item.Quantity;
                subTotal += total;

                items.Add(new QuotationItem
                {
                    ItemType = item.ItemType,
                    ModelId = item.ModelId,
                    Name = item.Name,
                    Quantity = item.Quantity,
                    UnitPrice = price,
                    TotalPrice = total
                });
            }

            var vatAmount = (subTotal - request.DiscountAmount) * (request.VatRate / 100);
            var totalAmount = subTotal - request.DiscountAmount + vatAmount;

            var quotation = new Quotation
            {
                QuotationNumber = $"QO-{DateTime.UtcNow:yyyyMMddHHmmss}",
                CustomerId = request.CustomerId,
                ExpirationDate = request.ExpirationDate,
                SubTotal = subTotal,
                DiscountAmount = request.DiscountAmount,
                VatRate = request.VatRate,
                VatAmount = vatAmount,
                TotalAmount = totalAmount,
                Status = QuotationStatus.Draft,
                Notes = request.Notes,
                Items = items
            };

            await _context.Quotations.AddAsync(quotation);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<Quotation>.Success(quotation, "Quotation draft created successfully."));
        }

        [HttpPut("{id}")]
        [HasPermission("QUOTATION_CREATE")]
        public async Task<ActionResult<ApiResponse<Quotation>>> UpdateQuotation(string id, [FromBody] CreateQuotationRequest request)
        {
            var quotation = await _context.Quotations
                .Include(q => q.Items)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (quotation == null)
            {
                return NotFound(ApiResponse<Quotation>.Failure("Quotation not found."));
            }

            // CRITICAL BUSINESS RULE: Quotation already sent/accepted cannot be edited directly
            if (quotation.Status != QuotationStatus.Draft)
            {
                return BadRequest(ApiResponse<Quotation>.Failure("Sent or accepted quotations cannot be edited directly. Please create a new version."));
            }

            decimal subTotal = 0;
            _context.QuotationItems.RemoveRange(quotation.Items);
            quotation.Items.Clear();

            foreach (var item in request.Items)
            {
                var price = item.UnitPrice;
                var total = price * item.Quantity;
                subTotal += total;

                quotation.Items.Add(new QuotationItem
                {
                    ItemType = item.ItemType,
                    ModelId = item.ModelId,
                    Name = item.Name,
                    Quantity = item.Quantity,
                    UnitPrice = price,
                    TotalPrice = total
                });
            }

            var vatAmount = (subTotal - request.DiscountAmount) * (request.VatRate / 100);
            var totalAmount = subTotal - request.DiscountAmount + vatAmount;

            quotation.ExpirationDate = request.ExpirationDate;
            quotation.SubTotal = subTotal;
            quotation.DiscountAmount = request.DiscountAmount;
            quotation.VatRate = request.VatRate;
            quotation.VatAmount = vatAmount;
            quotation.TotalAmount = totalAmount;
            quotation.Notes = request.Notes;

            _context.Quotations.Update(quotation);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<Quotation>.Success(quotation, "Quotation updated successfully."));
        }

        [HttpPost("{id}/version")]
        [HasPermission("QUOTATION_CREATE")]
        public async Task<ActionResult<ApiResponse<Quotation>>> CreateNewVersion(string id)
        {
            var oldQuotation = await _context.Quotations
                .Include(q => q.Items)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (oldQuotation == null)
            {
                return NotFound(ApiResponse<Quotation>.Failure("Quotation not found."));
            }

            // Clone to a new version in Draft
            var newQuotation = new Quotation
            {
                QuotationNumber = oldQuotation.QuotationNumber,
                Version = oldQuotation.Version + 1,
                ParentQuotationId = oldQuotation.Id,
                CustomerId = oldQuotation.CustomerId,
                ExpirationDate = oldQuotation.ExpirationDate,
                SubTotal = oldQuotation.SubTotal,
                DiscountAmount = oldQuotation.DiscountAmount,
                VatRate = oldQuotation.VatRate,
                VatAmount = oldQuotation.VatAmount,
                TotalAmount = oldQuotation.TotalAmount,
                Status = QuotationStatus.Draft, // Newly created version starts as Draft
                Notes = $"Bản sao điều chỉnh từ V{oldQuotation.Version}. " + oldQuotation.Notes
            };

            foreach (var item in oldQuotation.Items)
            {
                newQuotation.Items.Add(new QuotationItem
                {
                    ItemType = item.ItemType,
                    ModelId = item.ModelId,
                    Name = item.Name,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice, // Kept historical prices
                    TotalPrice = item.TotalPrice
                });
            }

            // Update old one as Cancelled/Superseded
            oldQuotation.Status = QuotationStatus.Cancelled;
            _context.Quotations.Update(oldQuotation);

            await _context.Quotations.AddAsync(newQuotation);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<Quotation>.Success(newQuotation, $"Created new version V{newQuotation.Version} successfully."));
        }

        [HttpPost("{id}/status")]
        [HasPermission("QUOTATION_CREATE")]
        public async Task<ActionResult<ApiResponse<bool>>> UpdateStatus(string id, [FromBody] UpdateStatusRequest request)
        {
            var quotation = await _context.Quotations.FindAsync(id);
            if (quotation == null)
            {
                return NotFound(ApiResponse<bool>.Failure("Quotation not found."));
            }

            quotation.Status = request.Status;
            _context.Quotations.Update(quotation);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<bool>.Success(true, "Quotation status updated successfully."));
        }

        [HttpGet("{id}/pdf")]
        [HasPermission("QUOTATION_CREATE")]
        public async Task<IActionResult> ExportPdf(string id)
        {
            var q = await _context.Quotations
                .Include(x => x.Customer)
                .Include(x => x.Items)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (q == null) return NotFound("Quotation not found");

            // Generate HTML structure for printable view
            var html = $@"
            <html>
            <head>
                <style>
                    body {{ font-family: 'Arial', sans-serif; padding: 30px; color: #333; }}
                    .header {{ border-bottom: 2px solid #b71c1c; padding-bottom: 20px; margin-bottom: 30px; }}
                    .title {{ font-size: 24px; font-weight: bold; color: #b71c1c; }}
                    .info-table {{ width: 100%; margin-bottom: 30px; }}
                    .info-table td {{ padding: 5px; }}
                    .items-table {{ width: 100%; border-collapse: collapse; margin-bottom: 30px; }}
                    .items-table th, .items-table td {{ border: 1px solid #ddd; padding: 10px; text-align: left; }}
                    .items-table th {{ background-color: #f5f5f5; }}
                    .totals {{ text-align: right; margin-top: 20px; font-size: 16px; }}
                    .totals div {{ margin-bottom: 5px; }}
                </style>
            </head>
            <body>
                <div class='header'>
                    <div class='title'>BÁO GIÁ THIẾT BỊ PCCC - FIREGUARD AI</div>
                    <div>Mã số báo giá: {q.QuotationNumber} (Bản V{q.Version})</div>
                    <div>Ngày lập: {q.CreatedAtUtc:dd/MM/yyyy}</div>
                    <div>Ngày hết hạn: {q.ExpirationDate:dd/MM/yyyy}</div>
                </div>
                <table class='info-table'>
                    <tr>
                        <td><strong>Khách hàng:</strong> {q.Customer.Name}</td>
                        <td><strong>Số điện thoại:</strong> {q.Customer.Phone}</td>
                    </tr>
                    <tr>
                        <td><strong>Email:</strong> {q.Customer.Email}</td>
                        <td><strong>Địa chỉ:</strong> {q.Customer.RepresentativeName ?? "N/A"}</td>
                    </tr>
                </table>
                <table class='items-table'>
                    <thead>
                        <tr>
                            <th>Hạng mục</th>
                            <th>Tên chi tiết</th>
                            <th>Số lượng</th>
                            <th>Đơn giá (VND)</th>
                            <th>Thành tiền (VND)</th>
                        </tr>
                    </thead>
                    <tbody>";

            foreach (var item in q.Items)
            {
                html += $@"
                        <tr>
                            <td>{item.ItemType}</td>
                            <td>{item.Name}</td>
                            <td>{item.Quantity}</td>
                            <td>{item.UnitPrice:N0}</td>
                            <td>{item.TotalPrice:N0}</td>
                        </tr>";
            }

            html += $@"
                    </tbody>
                </table>
                <div class='totals'>
                    <div>Tạm tính: <strong>{q.SubTotal:N0} VND</strong></div>
                    <div>Giảm giá: <strong>{q.DiscountAmount:N0} VND</strong></div>
                    <div>Thuế VAT ({q.VatRate}%): <strong>{q.VatAmount:N0} VND</strong></div>
                    <hr/>
                    <div style='font-size: 18px; color: #b71c1c;'>Tổng cộng: <strong>{q.TotalAmount:N0} VND</strong></div>
                </div>
                <div style='margin-top: 50px; text-align: center; color: #777;'>
                    <p>Cảm ơn quý khách đã tin tưởng dịch vụ của FireGuard AI!</p>
                </div>
            </body>
            </html>";

            return Content(html, "text/html", System.Text.Encoding.UTF8);
        }
    }
}
