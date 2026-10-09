using FireGuard.API.Authorization;
using FireGuard.Application.Common.Models;
using FireGuard.Domain.Entities.CRM;
using FireGuard.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FireGuard.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public class CustomerQueryParameters
        {
            public string? SearchTerm { get; set; }
            public CustomerType? CustomerType { get; set; }
            public bool? IsActive { get; set; }
            public int PageNumber { get; set; } = 1;
            public int PageSize { get; set; } = 10;
        }

        public class CreateCustomerRequest
        {
            public string Name { get; set; } = null!;
            public CustomerType CustomerType { get; set; } = CustomerType.Individual;
            public string? TaxCode { get; set; }
            public string? RepresentativeName { get; set; }
            public string Email { get; set; } = null!;
            public string Phone { get; set; } = null!;
            
            public List<CreateAddressRequest> Addresses { get; set; } = new();
            public List<CreateContactRequest> Contacts { get; set; } = new();
        }

        public class CreateAddressRequest
        {
            public string AddressLine { get; set; } = null!;
            public string? Ward { get; set; }
            public string District { get; set; } = null!;
            public string City { get; set; } = null!;
            public bool IsDefault { get; set; }
            public double? Latitude { get; set; }
            public double? Longitude { get; set; }
        }

        public class CreateContactRequest
        {
            public string FullName { get; set; } = null!;
            public string Position { get; set; } = null!;
            public string Email { get; set; } = null!;
            public string Phone { get; set; } = null!;
            public bool IsPrimary { get; set; }
        }

        public class CreateNoteRequest
        {
            public string Content { get; set; } = null!;
            public string NoteType { get; set; } = "General";
        }

        public CustomerController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "ADMIN,SALES,CUSTOMER")]
        public async Task<ActionResult<ApiResponse<PaginatedList<Customer>>>> GetCustomers([FromQuery] CustomerQueryParameters query)
        {
            var source = _context.Customers
                .Include(c => c.Addresses)
                .Include(c => c.Contacts)
                .AsNoTracking()
                .AsQueryable();

            if (User.IsInRole("CUSTOMER"))
            {
                var userEmail = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Email || c.Type == "email")?.Value;
                if (!string.IsNullOrEmpty(userEmail))
                {
                    source = source.Where(c => c.Email == userEmail);
                }
            }

            if (!string.IsNullOrWhiteSpace(query.SearchTerm))
            {
                var search = query.SearchTerm.Trim().ToLower();
                source = source.Where(c => 
                    c.Name.ToLower().Contains(search) ||
                    (c.TaxCode != null && c.TaxCode.ToLower().Contains(search)) ||
                    c.Email.ToLower().Contains(search) ||
                    c.Phone.Contains(search)
                );
            }

            if (query.CustomerType.HasValue)
            {
                source = source.Where(c => c.CustomerType == query.CustomerType.Value);
            }

            if (query.IsActive.HasValue)
            {
                source = source.Where(c => c.IsActive == query.IsActive.Value);
            }

            // Ordering
            source = source.OrderByDescending(c => c.CreatedAtUtc);

            // Pagination execution
            var count = await source.CountAsync();
            var items = await source
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            var paginatedResult = new PaginatedList<Customer>(items, count, query.PageNumber, query.PageSize);
            return Ok(ApiResponse<PaginatedList<Customer>>.Success(paginatedResult));
        }

        [HttpGet("{id}")]
        [HasPermission("CUSTOMER_VIEW")]
        public async Task<ActionResult<ApiResponse<Customer>>> GetCustomerById(string id)
        {
            var customer = await _context.Customers
                .Include(c => c.Addresses)
                .Include(c => c.Contacts)
                .Include(c => c.Notes.OrderByDescending(n => n.CreatedAtUtc))
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                return NotFound(ApiResponse<Customer>.Failure("Customer not found."));
            }

            return Ok(ApiResponse<Customer>.Success(customer));
        }

        [HttpPost]
        [HasPermission("CUSTOMER_MANAGE")]
        public async Task<ActionResult<ApiResponse<Customer>>> CreateCustomer([FromBody] CreateCustomerRequest request)
        {
            if (await _context.Customers.AnyAsync(c => c.Email == request.Email))
            {
                return BadRequest(ApiResponse<Customer>.Failure("Customer with this email already exists."));
            }

            var customer = new Customer
            {
                Name = request.Name,
                CustomerType = request.CustomerType,
                TaxCode = request.TaxCode,
                RepresentativeName = request.RepresentativeName,
                Email = request.Email,
                Phone = request.Phone,
                IsActive = true
            };

            foreach (var addr in request.Addresses)
            {
                customer.Addresses.Add(new CustomerAddress
                {
                    AddressLine = addr.AddressLine,
                    Ward = addr.Ward,
                    District = addr.District,
                    City = addr.City,
                    IsDefault = addr.IsDefault,
                    Latitude = addr.Latitude,
                    Longitude = addr.Longitude
                });
            }

            foreach (var contact in request.Contacts)
            {
                customer.Contacts.Add(new CustomerContact
                {
                    FullName = contact.FullName,
                    Position = contact.Position,
                    Email = contact.Email,
                    Phone = contact.Phone,
                    IsPrimary = contact.IsPrimary
                });
            }

            await _context.Customers.AddAsync(customer);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<Customer>.Success(customer, "Customer created successfully."));
        }

        [HttpPut("{id}")]
        [HasPermission("CUSTOMER_MANAGE")]
        public async Task<ActionResult<ApiResponse<Customer>>> UpdateCustomer(string id, [FromBody] CreateCustomerRequest request)
        {
            var customer = await _context.Customers
                .Include(c => c.Addresses)
                .Include(c => c.Contacts)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                return NotFound(ApiResponse<Customer>.Failure("Customer not found."));
            }

            if (customer.Email != request.Email && await _context.Customers.AnyAsync(c => c.Email == request.Email && c.Id != id))
            {
                return BadRequest(ApiResponse<Customer>.Failure("Another customer with this email already exists."));
            }

            customer.Name = request.Name;
            customer.CustomerType = request.CustomerType;
            customer.TaxCode = request.TaxCode;
            customer.RepresentativeName = request.RepresentativeName;
            customer.Email = request.Email;
            customer.Phone = request.Phone;

            // Simple replace of addresses/contacts for demo/completion
            _context.CustomerAddresses.RemoveRange(customer.Addresses);
            _context.CustomerContacts.RemoveRange(customer.Contacts);

            foreach (var addr in request.Addresses)
            {
                customer.Addresses.Add(new CustomerAddress
                {
                    AddressLine = addr.AddressLine,
                    Ward = addr.Ward,
                    District = addr.District,
                    City = addr.City,
                    IsDefault = addr.IsDefault,
                    Latitude = addr.Latitude,
                    Longitude = addr.Longitude
                });
            }

            foreach (var contact in request.Contacts)
            {
                customer.Contacts.Add(new CustomerContact
                {
                    FullName = contact.FullName,
                    Position = contact.Position,
                    Email = contact.Email,
                    Phone = contact.Phone,
                    IsPrimary = contact.IsPrimary
                });
            }

            _context.Customers.Update(customer);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<Customer>.Success(customer, "Customer updated successfully."));
        }

        [HttpDelete("{id}")]
        [HasPermission("CUSTOMER_MANAGE")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteCustomer(string id)
        {
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == id);
            if (customer == null)
            {
                return NotFound(ApiResponse<bool>.Failure("Customer not found."));
            }

            _context.Customers.Remove(customer); // Soft delete handled via EF Interceptor
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<bool>.Success(true, "Customer deleted successfully."));
        }

        [HttpGet("{id}/timeline")]
        [HasPermission("CUSTOMER_VIEW")]
        public async Task<ActionResult<ApiResponse<List<CustomerNote>>>> GetCustomerTimeline(string id)
        {
            var exists = await _context.Customers.AnyAsync(c => c.Id == id);
            if (!exists)
            {
                return NotFound(ApiResponse<List<CustomerNote>>.Failure("Customer not found."));
            }

            var notes = await _context.CustomerNotes
                .Where(n => n.CustomerId == id)
                .OrderByDescending(n => n.CreatedAtUtc)
                .ToListAsync();

            return Ok(ApiResponse<List<CustomerNote>>.Success(notes));
        }

        [HttpPost("{id}/notes")]
        [HasPermission("CUSTOMER_MANAGE")]
        public async Task<ActionResult<ApiResponse<CustomerNote>>> AddCustomerNote(string id, [FromBody] CreateNoteRequest request)
        {
            var exists = await _context.Customers.AnyAsync(c => c.Id == id);
            if (!exists)
            {
                return NotFound(ApiResponse<CustomerNote>.Failure("Customer not found."));
            }

            var note = new CustomerNote
            {
                CustomerId = id,
                Content = request.Content,
                NoteType = request.NoteType
            };

            await _context.CustomerNotes.AddAsync(note);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<CustomerNote>.Success(note, "Note added successfully."));
        }
    }
}
