using FireGuard.API.Authorization;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Application.Common.Models;
using FireGuard.Domain.Entities.Sales;
using FireGuard.Domain.Entities.CRM;
using FireGuard.Domain.Entities.Services;
using FireGuard.Domain.Entities.Projects;
using FireGuard.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FireGuard.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SalesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileStorageService _storageService;

        public SalesController(ApplicationDbContext context, IFileStorageService storageService)
        {
            _context = context;
            _storageService = storageService;
        }

        public class QuickOrderRequest
        {
            public string CustomerName { get; set; } = null!;
            public string Phone { get; set; } = null!;
            public string Address { get; set; } = null!;
            public string ProductId { get; set; } = null!;
            public int Quantity { get; set; }
            public bool IsLargeProject { get; set; }
        }

        public class CreateOrderRequest
        {
            public string CustomerId { get; set; } = null!;
            public string? Notes { get; set; }
            public List<OrderItemRequest> Items { get; set; } = new();
        }

        public class OrderItemRequest
        {
            public string ModelId { get; set; } = null!;
            public int Quantity { get; set; }
            public decimal UnitPrice { get; set; }
        }

        public class CreateContractRequest
        {
            public string CustomerId { get; set; } = null!;
            public DateTime StartDate { get; set; }
            public DateTime EndDate { get; set; }
            public decimal TotalValue { get; set; }
            public string? AttachmentUrl { get; set; }
            public string? Notes { get; set; }
            public List<InstallmentRequest> Installments { get; set; } = new();
        }

        public class InstallmentRequest
        {
            public string StageName { get; set; } = null!;
            public DateTime DueDate { get; set; }
            public decimal Amount { get; set; }
        }

        public class CreateInvoiceRequest
        {
            public string CustomerId { get; set; } = null!;
            public string? SalesOrderId { get; set; }
            public string? ContractId { get; set; }
            public string? TaxCode { get; set; }
            public decimal VatRate { get; set; }
            public string? Notes { get; set; }
            public List<InvoiceItemRequest> Items { get; set; } = new();
        }

        public class InvoiceItemRequest
        {
            public string Description { get; set; } = null!;
            public int Quantity { get; set; }
            public decimal UnitPrice { get; set; }
        }

        public class RecordPaymentRequest
        {
            public string? InvoiceId { get; set; }
            public string? ContractId { get; set; }
            public decimal Amount { get; set; }
            public PaymentMethod PaymentMethod { get; set; }
            public string? ReferenceNumber { get; set; }
            public string? AttachmentUrl { get; set; }
        }

        // ==================== SALES ORDERS ====================
        [HttpGet("orders")]
        [HasPermission("CONTRACT_MANAGE")]
        public async Task<ActionResult<ApiResponse<List<SalesOrder>>>> GetOrders()
        {
            var list = await _context.SalesOrders.Include(o => o.Customer).ToListAsync();
            return Ok(ApiResponse<List<SalesOrder>>.Success(list));
        }

        [HttpPost("orders")]
        [HasPermission("CONTRACT_MANAGE")]
        public async Task<ActionResult<ApiResponse<SalesOrder>>> CreateOrder([FromBody] CreateOrderRequest request)
        {
            var customer = await _context.Customers.FindAsync(request.CustomerId);
            if (customer == null) return BadRequest(ApiResponse<SalesOrder>.Failure("Customer not found."));

            decimal total = 0;
            var orderItems = new List<SalesOrderItem>();
            foreach (var item in request.Items)
            {
                var price = item.UnitPrice;
                if (price == 0)
                {
                    var model = await _context.EquipmentModels.FindAsync(item.ModelId);
                    if (model != null) price = model.SellingPrice;
                }
                var sub = price * item.Quantity;
                total += sub;

                orderItems.Add(new SalesOrderItem
                {
                    ModelId = item.ModelId,
                    Quantity = item.Quantity,
                    UnitPrice = price,
                    TotalPrice = sub
                });
            }

            var order = new SalesOrder
            {
                OrderNumber = $"SO-{DateTime.UtcNow:yyyyMMddHHmmss}",
                CustomerId = request.CustomerId,
                TotalAmount = total,
                Status = SalesOrderStatus.Draft,
                Notes = request.Notes,
                Items = orderItems
            };

            await _context.SalesOrders.AddAsync(order);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<SalesOrder>.Success(order));
        }

        [HttpPost("quick-order")]
        [HasPermission("CONTRACT_MANAGE")]
        public async Task<ActionResult<ApiResponse<bool>>> QuickOrder([FromBody] QuickOrderRequest request)
        {
            var product = await _context.EquipmentModels.FindAsync(request.ProductId);
            if (product == null) return BadRequest(ApiResponse<bool>.Failure("Product not found."));

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Phone == request.Phone);
            if (customer == null)
            {
                customer = new Customer
                {
                    Id = $"cust_{Guid.NewGuid().ToString("N")[..8]}",
                    Name = request.CustomerName,
                    Phone = request.Phone,
                    IsActive = true
                };
                await _context.Customers.AddAsync(customer);

                var addr = new CustomerAddress
                {
                    CustomerId = customer.Id,
                    AddressLine = request.Address,
                    IsDefault = true
                };
                await _context.CustomerAddresses.AddAsync(addr);
                await _context.SaveChangesAsync();
            }

            string description = $"Yêu cầu đặt hàng: {product.Name} (SL: {request.Quantity}). " +
                                 $"Khách hàng: {request.CustomerName}, SĐT: {request.Phone}, Địa chỉ: {request.Address}";

            if (!request.IsLargeProject)
            {
                var sr = new ServiceRequest
                {
                    RequestNumber = $"SR-{DateTime.UtcNow:yyyyMMddHHmmss}",
                    CustomerId = customer.Id,
                    AddressId = (await _context.CustomerAddresses.FirstOrDefaultAsync(a => a.CustomerId == customer.Id))?.Id ?? "",
                    Description = description,
                    Urgency = UrgencyLevel.Medium,
                    RequestType = ServiceRequestType.Installation,
                    Status = ServiceRequestStatus.AwaitingDispatch,
                    DesiredTime = DateTime.UtcNow.AddDays(1)
                };
                await _context.ServiceRequests.AddAsync(sr);
            }
            else
            {
                var contract = new Contract
                {
                    ContractNumber = $"HD-{DateTime.UtcNow:yyyyMMddHHmmss}",
                    CustomerId = customer.Id,
                    StartDate = DateTime.UtcNow,
                    EndDate = DateTime.UtcNow.AddMonths(1),
                    TotalValue = product.SellingPrice * request.Quantity,
                    Status = ContractStatus.Active,
                    Notes = description
                };
                await _context.Contracts.AddAsync(contract);

                var proj = new Project
                {
                    Name = $"Lắp đặt: {product.Name}",
                    ContractId = contract.Id,
                    CustomerId = customer.Id,
                    Status = ProjectStatus.Planning,
                    StartDate = DateTime.UtcNow.AddDays(1),
                    EndDate = DateTime.UtcNow.AddDays(10),
                    ProgressPercentage = 0
                };
                await _context.Projects.AddAsync(proj);
            }

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<bool>.Success(true, "Quick order created successfully."));
        }

        // ==================== CONTRACTS ====================
        [HttpGet("contracts")]
        [HasPermission("CONTRACT_MANAGE")]
        public async Task<ActionResult<ApiResponse<List<Contract>>>> GetContracts()
        {
            var list = await _context.Contracts.Include(c => c.Customer).Include(c => c.Installments).ToListAsync();
            return Ok(ApiResponse<List<Contract>>.Success(list));
        }

        [HttpPost("contracts")]
        [HasPermission("CONTRACT_MANAGE")]
        public async Task<ActionResult<ApiResponse<Contract>>> CreateContract([FromBody] CreateContractRequest request)
        {
            var contract = new Contract
            {
                ContractNumber = $"HD-{DateTime.UtcNow:yyyyMMddHHmmss}",
                CustomerId = request.CustomerId,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                TotalValue = request.TotalValue,
                Status = ContractStatus.Active,
                AttachmentUrl = request.AttachmentUrl,
                Notes = request.Notes
            };

            foreach (var inst in request.Installments)
            {
                contract.Installments.Add(new ContractInstallment
                {
                    StageName = inst.StageName,
                    DueDate = inst.DueDate,
                    Amount = inst.Amount,
                    IsPaid = false
                });
            }

            await _context.Contracts.AddAsync(contract);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<Contract>.Success(contract));
        }

        [HttpPost("contracts/upload")]
        [HasPermission("CONTRACT_MANAGE")]
        public async Task<ActionResult<ApiResponse<string>>> UploadContractFile([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest(ApiResponse<string>.Failure("No file uploaded"));
            
            var uniqueName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            using var stream = file.OpenReadStream();
            var url = await _storageService.UploadFileAsync(stream, uniqueName, file.ContentType, "contract-attachments");

            return Ok(ApiResponse<string>.Success(url));
        }

        // ==================== INVOICES ====================
        [HttpGet("invoices")]
        [HasPermission("CONTRACT_MANAGE")]
        public async Task<ActionResult<ApiResponse<List<Invoice>>>> GetInvoices()
        {
            var list = await _context.Invoices.Include(i => i.Customer).ToListAsync();
            return Ok(ApiResponse<List<Invoice>>.Success(list));
        }

        [HttpPost("invoices")]
        [HasPermission("CONTRACT_MANAGE")]
        public async Task<ActionResult<ApiResponse<Invoice>>> CreateInvoice([FromBody] CreateInvoiceRequest request)
        {
            decimal subTotal = 0;
            var items = new List<InvoiceItem>();
            foreach (var item in request.Items)
            {
                var total = item.UnitPrice * item.Quantity;
                subTotal += total;

                items.Add(new InvoiceItem
                {
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = total
                });
            }

            var vatAmount = subTotal * (request.VatRate / 100);
            var totalAmount = subTotal + vatAmount;

            var invoice = new Invoice
            {
                InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMddHHmmss}",
                CustomerId = request.CustomerId,
                SalesOrderId = request.SalesOrderId,
                ContractId = request.ContractId,
                TaxCode = request.TaxCode,
                SubTotal = subTotal,
                VatRate = request.VatRate,
                VatAmount = vatAmount,
                TotalAmount = totalAmount,
                AmountPaid = 0,
                DebtRemaining = totalAmount,
                Status = InvoiceStatus.Draft,
                Notes = request.Notes,
                Items = items
            };

            await _context.Invoices.AddAsync(invoice);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<Invoice>.Success(invoice));
        }

        [HttpPost("invoices/{id}/issue")]
        [HasPermission("CONTRACT_MANAGE")]
        public async Task<ActionResult<ApiResponse<bool>>> IssueInvoice(string id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null) return NotFound(ApiResponse<bool>.Failure("Invoice not found."));

            invoice.Status = InvoiceStatus.Issued;
            _context.Invoices.Update(invoice);
            
            // Increment customer debt ledger
            var customer = await _context.Customers.FindAsync(invoice.CustomerId);
            if (customer != null)
            {
                customer.TotalDebt += invoice.DebtRemaining;
                _context.Customers.Update(customer);
            }

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<bool>.Success(true, "Invoice issued successfully."));
        }

        [HttpDelete("invoices/{id}")]
        [HasPermission("CONTRACT_MANAGE")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteInvoice(string id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null) return NotFound(ApiResponse<bool>.Failure("Invoice not found."));

            // CRITICAL BUSINESS RULE: Do not delete if already issued/paid
            if (invoice.Status != InvoiceStatus.Draft)
            {
                return BadRequest(ApiResponse<bool>.Failure("Cannot delete an issued, paid or cancelled invoice."));
            }

            _context.Invoices.Remove(invoice);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<bool>.Success(true, "Draft invoice deleted."));
        }

        // ==================== PAYMENTS ====================
        [HttpPost("payments")]
        [HasPermission("CONTRACT_MANAGE")]
        public async Task<ActionResult<ApiResponse<Payment>>> RecordPayment([FromBody] RecordPaymentRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var payment = new Payment
                {
                    PaymentNumber = $"PM-{DateTime.UtcNow:yyyyMMddHHmmss}",
                    InvoiceId = request.InvoiceId,
                    ContractId = request.ContractId,
                    Amount = request.Amount,
                    PaymentMethod = request.PaymentMethod,
                    ReferenceNumber = request.ReferenceNumber,
                    AttachmentUrl = request.AttachmentUrl,
                    PaidAt = DateTime.UtcNow
                };

                if (!string.IsNullOrEmpty(request.InvoiceId))
                {
                    var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.Id == request.InvoiceId);
                    if (invoice == null) throw new InvalidOperationException("Invoice not found.");

                    invoice.AmountPaid += request.Amount;
                    invoice.DebtRemaining = Math.Max(0, invoice.TotalAmount - invoice.AmountPaid);

                    if (invoice.DebtRemaining <= 0)
                    {
                        invoice.Status = InvoiceStatus.Paid;
                    }

                    _context.Invoices.Update(invoice);

                    // Subtract from Customer overall debt ledger
                    var customer = await _context.Customers.FindAsync(invoice.CustomerId);
                    if (customer != null)
                    {
                        customer.TotalDebt = Math.Max(0, customer.TotalDebt - request.Amount);
                        _context.Customers.Update(customer);
                    }
                }

                if (!string.IsNullOrEmpty(request.ContractId))
                {
                    var contract = await _context.Contracts
                        .Include(c => c.Installments)
                        .FirstOrDefaultAsync(c => c.Id == request.ContractId);

                    if (contract == null) throw new InvalidOperationException("Contract not found.");

                    // Auto-allocate payment to oldest unpaid installment
                    var unpaid = contract.Installments.Where(i => !i.IsPaid).OrderBy(i => i.DueDate).FirstOrDefault();
                    if (unpaid != null)
                    {
                        unpaid.IsPaid = true;
                        _context.ContractInstallments.Update(unpaid);
                    }
                }

                await _context.Payments.AddAsync(payment);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(ApiResponse<Payment>.Success(payment, "Payment recorded successfully."));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ApiResponse<Payment>.Failure(ex.Message));
            }
        }
    }
}
