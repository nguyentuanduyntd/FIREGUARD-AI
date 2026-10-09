using FireGuard.API.Authorization;
using FireGuard.Application.Common.Models;
using FireGuard.Domain.Entities.Catalog;
using FireGuard.Domain.Entities.Inventory;
using FireGuard.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FireGuard.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public InventoryController(ApplicationDbContext context)
        {
            _context = context;
        }

        public class CreateReceiptRequest
        {
            public string WarehouseId { get; set; } = null!;
            public string? SupplierId { get; set; }
            public ReceiptType ReceiptType { get; set; } = ReceiptType.Import;
            public string? Notes { get; set; }
            public List<ReceiptItemRequest> Items { get; set; } = new();
        }

        public class ReceiptItemRequest
        {
            public string ModelId { get; set; } = null!;
            public int Quantity { get; set; }
            public decimal UnitPrice { get; set; }
            public List<string> SerialNumbers { get; set; } = new();
        }

        public class CreateIssueRequest
        {
            public string WarehouseId { get; set; } = null!;
            public string? CustomerId { get; set; }
            public IssueType IssueType { get; set; } = IssueType.Export;
            public string? Notes { get; set; }
            public List<IssueItemRequest> Items { get; set; } = new();
        }

        public class IssueItemRequest
        {
            public string ModelId { get; set; } = null!;
            public int Quantity { get; set; }
            public decimal UnitPrice { get; set; }
            public List<string> SerialNumbers { get; set; } = new();
        }

        public class TransferRequest
        {
            public string SourceWarehouseId { get; set; } = null!;
            public string DestinationWarehouseId { get; set; } = null!;
            public string ModelId { get; set; } = null!;
            public int Quantity { get; set; }
            public List<string> SerialNumbers { get; set; } = new();
            public string? Notes { get; set; }
        }

        public class DirectStockRequest
        {
            public string WarehouseId { get; set; } = null!;
            public string ModelId { get; set; } = null!;
            public int Quantity { get; set; }
        }

        // ==================== WAREHOUSES ====================
        [HttpGet("warehouses")]
        [HasPermission("INVENTORY_VIEW")]
        public async Task<ActionResult<ApiResponse<List<Warehouse>>>> GetWarehouses()
        {
            var list = await _context.Warehouses.ToListAsync();
            return Ok(ApiResponse<List<Warehouse>>.Success(list));
        }

        [HttpPost("warehouses")]
        [HasPermission("INVENTORY_IMPORT")]
        public async Task<ActionResult<ApiResponse<Warehouse>>> CreateWarehouse([FromBody] Warehouse warehouse)
        {
            await _context.Warehouses.AddAsync(warehouse);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<Warehouse>.Success(warehouse));
        }

        // ==================== STOCK LEVELS ====================
        [HttpGet("stock")]
        [HasPermission("INVENTORY_VIEW")]
        public async Task<ActionResult<ApiResponse<List<WarehouseStock>>>> GetStockLevels()
        {
            var stock = await _context.WarehouseStocks
                .Include(ws => ws.Warehouse)
                .Include(ws => ws.Model)
                    .ThenInclude(m => m.Category)
                .ToListAsync();

            return Ok(ApiResponse<List<WarehouseStock>>.Success(stock));
        }

        [HttpPost("stock/direct")]
        [HasPermission("INVENTORY_IMPORT")]
        public async Task<ActionResult<ApiResponse<WarehouseStock>>> CreateStockDirect([FromBody] DirectStockRequest request)
        {
            var existingStock = await _context.WarehouseStocks
                .FirstOrDefaultAsync(ws => ws.WarehouseId == request.WarehouseId && ws.ModelId == request.ModelId);

            if (existingStock != null)
            {
                return BadRequest(ApiResponse<WarehouseStock>.Failure("Stock record already exists for this model in the selected warehouse. Use Update instead."));
            }

            var stock = new WarehouseStock
            {
                WarehouseId = request.WarehouseId,
                ModelId = request.ModelId,
                Quantity = request.Quantity
            };

            await _context.WarehouseStocks.AddAsync(stock);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<WarehouseStock>.Success(stock, "Stock added successfully."));
        }

        [HttpPut("stock/direct/{id}")]
        [HasPermission("INVENTORY_IMPORT")]
        public async Task<ActionResult<ApiResponse<WarehouseStock>>> UpdateStockDirect(string id, [FromBody] DirectStockRequest request)
        {
            var stock = await _context.WarehouseStocks.FirstOrDefaultAsync(s => s.Id == id);
            
            if (stock == null)
            {
                return NotFound(ApiResponse<WarehouseStock>.Failure("Stock record not found."));
            }

            // Optional: If they change warehouse or model id, we should check for duplicates
            if (stock.WarehouseId != request.WarehouseId || stock.ModelId != request.ModelId)
            {
                var duplicate = await _context.WarehouseStocks
                    .AnyAsync(ws => ws.WarehouseId == request.WarehouseId && ws.ModelId == request.ModelId && ws.Id != id);
                if (duplicate)
                {
                    return BadRequest(ApiResponse<WarehouseStock>.Failure("A stock record for this model and warehouse already exists."));
                }
            }

            stock.WarehouseId = request.WarehouseId;
            stock.ModelId = request.ModelId;
            stock.Quantity = request.Quantity;

            _context.WarehouseStocks.Update(stock);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<WarehouseStock>.Success(stock, "Stock updated successfully."));
        }

        [HttpDelete("stock/direct/{id}")]
        [HasPermission("INVENTORY_EXPORT")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteStockDirect(string id)
        {
            var stock = await _context.WarehouseStocks.FirstOrDefaultAsync(s => s.Id == id);
            if (stock == null)
            {
                return NotFound(ApiResponse<bool>.Failure("Stock record not found."));
            }

            _context.WarehouseStocks.Remove(stock);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<bool>.Success(true, "Stock deleted successfully."));
        }


        // ==================== TRANSACTIONS ====================
        [HttpGet("transactions")]
        [HasPermission("INVENTORY_VIEW")]
        public async Task<ActionResult<ApiResponse<List<StockTransaction>>>> GetTransactions()
        {
            var list = await _context.StockTransactions
                .Include(t => t.Warehouse)
                .Include(t => t.Model)
                .OrderByDescending(t => t.CreatedAtUtc)
                .ToListAsync();

            return Ok(ApiResponse<List<StockTransaction>>.Success(list));
        }

        // ==================== STOCK RECEIPT ====================
        [HttpPost("receipt")]
        [HasPermission("INVENTORY_IMPORT")]
        public async Task<ActionResult<ApiResponse<StockReceipt>>> CreateReceipt([FromBody] CreateReceiptRequest request)
        {
            var receipt = new StockReceipt
            {
                ReceiptNumber = $"IM-{DateTime.UtcNow:yyyyMMddHHmmss}",
                WarehouseId = request.WarehouseId,
                SupplierId = request.SupplierId,
                ReceiptType = request.ReceiptType,
                Status = ReceiptStatus.Draft,
                Notes = request.Notes
            };

            foreach (var item in request.Items)
            {
                receipt.Items.Add(new StockReceiptItem
                {
                    ModelId = item.ModelId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    SerialNumbers = string.Join(",", item.SerialNumbers)
                });
            }

            await _context.StockReceipts.AddAsync(receipt);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<StockReceipt>.Success(receipt, "Stock receipt draft created successfully."));
        }

        [HttpPost("receipt/{id}/confirm")]
        [HasPermission("INVENTORY_IMPORT")]
        public async Task<ActionResult<ApiResponse<bool>>> ConfirmReceipt(string id)
        {
            var receipt = await _context.StockReceipts
                .Include(r => r.Items)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (receipt == null)
            {
                return NotFound(ApiResponse<bool>.Failure("Receipt not found."));
            }

            if (receipt.Status == ReceiptStatus.Confirmed)
            {
                return BadRequest(ApiResponse<bool>.Failure("Receipt has already been confirmed and cannot be modified."));
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                foreach (var item in receipt.Items)
                {
                    // 1. Process Concurrency Safe stock levels
                    var stock = await _context.WarehouseStocks
                        .FirstOrDefaultAsync(ws => ws.WarehouseId == receipt.WarehouseId && ws.ModelId == item.ModelId);

                    if (stock == null)
                    {
                        stock = new WarehouseStock
                        {
                            WarehouseId = receipt.WarehouseId,
                            ModelId = item.ModelId,
                            Quantity = item.Quantity
                        };
                        await _context.WarehouseStocks.AddAsync(stock);
                    }
                    else
                    {
                        stock.Quantity += item.Quantity;
                        _context.WarehouseStocks.Update(stock);
                    }

                    // 2. Register Serialized Assets if applicable
                    if (!string.IsNullOrEmpty(item.SerialNumbers))
                    {
                        var serials = item.SerialNumbers.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                        foreach (var serial in serials)
                        {
                            var cleanSerial = serial.Trim();
                            if (await _context.EquipmentAssets.AnyAsync(a => a.SerialNumber == cleanSerial))
                            {
                                throw new InvalidOperationException($"Serial number '{cleanSerial}' already exists in database.");
                            }

                            var asset = new EquipmentAsset
                            {
                                ModelId = item.ModelId,
                                WarehouseId = receipt.WarehouseId,
                                SerialNumber = cleanSerial,
                                Status = AssetStatus.InStock,
                                PurchasePrice = item.UnitPrice
                            };
                            await _context.EquipmentAssets.AddAsync(asset);
                        }
                    }

                    // 3. Create stock transaction ledger entry
                    var stockTx = new StockTransaction
                    {
                        WarehouseId = receipt.WarehouseId,
                        ModelId = item.ModelId,
                        Quantity = item.Quantity,
                        TransactionType = TransactionType.Import,
                        ReferenceNumber = receipt.ReceiptNumber,
                        Notes = $"Import from receipt ID: {receipt.Id}"
                    };
                    await _context.StockTransactions.AddAsync(stockTx);
                }

                receipt.Status = ReceiptStatus.Confirmed;
                _context.StockReceipts.Update(receipt);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(ApiResponse<bool>.Success(true, "Stock receipt confirmed and stock levels updated successfully."));
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaction.RollbackAsync();
                return StatusCode(409, ApiResponse<bool>.Failure("Concurrency conflict detected. Please retry the operation."));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ApiResponse<bool>.Failure(ex.Message));
            }
        }

        // ==================== STOCK ISSUE ====================
        [HttpPost("issue")]
        [HasPermission("INVENTORY_EXPORT")]
        public async Task<ActionResult<ApiResponse<StockIssue>>> CreateIssue([FromBody] CreateIssueRequest request)
        {
            var issue = new StockIssue
            {
                IssueNumber = $"EX-{DateTime.UtcNow:yyyyMMddHHmmss}",
                WarehouseId = request.WarehouseId,
                CustomerId = request.CustomerId,
                IssueType = request.IssueType,
                Status = IssueStatus.Draft,
                Notes = request.Notes
            };

            foreach (var item in request.Items)
            {
                issue.Items.Add(new StockIssueItem
                {
                    ModelId = item.ModelId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    SerialNumbers = string.Join(",", item.SerialNumbers)
                });
            }

            await _context.StockIssues.AddAsync(issue);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<StockIssue>.Success(issue, "Stock issue draft created successfully."));
        }

        [HttpPost("issue/{id}/confirm")]
        [HasPermission("INVENTORY_EXPORT")]
        public async Task<ActionResult<ApiResponse<bool>>> ConfirmIssue(string id)
        {
            var issue = await _context.StockIssues
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (issue == null)
            {
                return NotFound(ApiResponse<bool>.Failure("Stock issue ticket not found."));
            }

            if (issue.Status == IssueStatus.Confirmed)
            {
                return BadRequest(ApiResponse<bool>.Failure("Issue has already been confirmed and cannot be modified."));
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                foreach (var item in issue.Items)
                {
                    var stock = await _context.WarehouseStocks
                        .FirstOrDefaultAsync(ws => ws.WarehouseId == issue.WarehouseId && ws.ModelId == item.ModelId);

                    // CRITICAL RULE: Cannot issue more than available stock
                    if (stock == null || stock.Quantity < item.Quantity)
                    {
                        throw new InvalidOperationException($"Cannot export more than available in-stock quantity. Available: {(stock?.Quantity ?? 0)}");
                    }

                    stock.Quantity -= item.Quantity;
                    _context.WarehouseStocks.Update(stock);

                    // Process serial numbers if provided
                    if (!string.IsNullOrEmpty(item.SerialNumbers))
                    {
                        var serials = item.SerialNumbers.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                        foreach (var serial in serials)
                        {
                            var cleanSerial = serial.Trim();
                            var asset = await _context.EquipmentAssets
                                .FirstOrDefaultAsync(a => a.SerialNumber == cleanSerial && a.WarehouseId == issue.WarehouseId);

                            if (asset == null)
                            {
                                throw new InvalidOperationException($"Serial number '{cleanSerial}' is not in stock in this warehouse.");
                            }

                            // Update state to installed/deployed
                            asset.WarehouseId = null;
                            asset.CustomerId = issue.CustomerId;
                            asset.Status = AssetStatus.Installed; // Out of warehouse to site
                            _context.EquipmentAssets.Update(asset);
                        }
                    }

                    var stockTx = new StockTransaction
                    {
                        WarehouseId = issue.WarehouseId,
                        ModelId = item.ModelId,
                        Quantity = -item.Quantity, // Negative value
                        TransactionType = TransactionType.Export,
                        ReferenceNumber = issue.IssueNumber,
                        Notes = $"Export from issue ID: {issue.Id}"
                    };
                    await _context.StockTransactions.AddAsync(stockTx);
                }

                issue.Status = IssueStatus.Confirmed;
                _context.StockIssues.Update(issue);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(ApiResponse<bool>.Success(true, "Stock issue confirmed and inventory updated."));
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaction.RollbackAsync();
                return StatusCode(409, ApiResponse<bool>.Failure("Concurrency conflict detected. Please retry."));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ApiResponse<bool>.Failure(ex.Message));
            }
        }

        // ==================== WAREHOUSE TRANSFER ====================
        [HttpPost("transfer")]
        [HasPermission("INVENTORY_EXPORT")]
        public async Task<ActionResult<ApiResponse<bool>>> TransferStock([FromBody] TransferRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Decrement from Source
                var srcStock = await _context.WarehouseStocks
                    .FirstOrDefaultAsync(ws => ws.WarehouseId == request.SourceWarehouseId && ws.ModelId == request.ModelId);

                if (srcStock == null || srcStock.Quantity < request.Quantity)
                {
                    throw new InvalidOperationException("Insufficient stock in source warehouse.");
                }

                srcStock.Quantity -= request.Quantity;
                _context.WarehouseStocks.Update(srcStock);

                // 2. Increment in Destination
                var destStock = await _context.WarehouseStocks
                    .FirstOrDefaultAsync(ws => ws.WarehouseId == request.DestinationWarehouseId && ws.ModelId == request.ModelId);

                if (destStock == null)
                {
                    destStock = new WarehouseStock
                    {
                        WarehouseId = request.DestinationWarehouseId,
                        ModelId = request.ModelId,
                        Quantity = request.Quantity
                    };
                    await _context.WarehouseStocks.AddAsync(destStock);
                }
                else
                {
                    destStock.Quantity += request.Quantity;
                    _context.WarehouseStocks.Update(destStock);
                }

                // 3. Update serials if applicable
                foreach (var serial in request.SerialNumbers)
                {
                    var cleanSerial = serial.Trim();
                    var asset = await _context.EquipmentAssets
                        .FirstOrDefaultAsync(a => a.SerialNumber == cleanSerial && a.WarehouseId == request.SourceWarehouseId);

                    if (asset == null)
                    {
                        throw new InvalidOperationException($"Serial number '{cleanSerial}' is not in stock in source warehouse.");
                    }

                    asset.WarehouseId = request.DestinationWarehouseId;
                    _context.EquipmentAssets.Update(asset);
                }

                // 4. Record transactions
                var refNum = $"TR-{DateTime.UtcNow:yyyyMMddHHmmss}";
                
                var txOut = new StockTransaction
                {
                    WarehouseId = request.SourceWarehouseId,
                    ModelId = request.ModelId,
                    Quantity = -request.Quantity,
                    TransactionType = TransactionType.Transfer,
                    ReferenceNumber = refNum,
                    Notes = $"Transfer out to warehouse {request.DestinationWarehouseId}. {request.Notes}"
                };
                await _context.StockTransactions.AddAsync(txOut);

                var txIn = new StockTransaction
                {
                    WarehouseId = request.DestinationWarehouseId,
                    ModelId = request.ModelId,
                    Quantity = request.Quantity,
                    TransactionType = TransactionType.Transfer,
                    ReferenceNumber = refNum,
                    Notes = $"Transfer in from warehouse {request.SourceWarehouseId}. {request.Notes}"
                };
                await _context.StockTransactions.AddAsync(txIn);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(ApiResponse<bool>.Success(true, "Stock transfer completed successfully."));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ApiResponse<bool>.Failure(ex.Message));
            }
        }
    }
}
