using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FireGuard.Domain.Entities.Catalog;
using FireGuard.Domain.Entities.CRM;
using FireGuard.Domain.Entities.IAM;
using FireGuard.Domain.Entities.Inventory;
using FireGuard.Domain.Entities.Projects;
using FireGuard.Domain.Entities.Sales;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;

namespace FireGuard.Infrastructure.Persistence
{
    public static class ApplicationDbContextSeed
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            var defaultPassword = Environment.GetEnvironmentVariable("DEMO_PASSWORD") ?? "FireGuard@2026";
            var hashedPassword = PasswordHasher.HashPassword(defaultPassword);

            // 1. Seed Roles
            if (!await context.Roles.AnyAsync())
            {
                var roles = new List<Role>
                {
                    new() { Name = "ADMIN", Description = "System Administrator" },
                    new() { Name = "SALES", Description = "Sales Representative" },
                    new() { Name = "INSTALLATION_LEADER", Description = "Installation Team Leader" },
                    new() { Name = "INSTALLATION_MEMBER", Description = "Installation Staff Member" },
                    new() { Name = "TECHNICIAN", Description = "Maintenance and Repair Technician" },
                    new() { Name = "CUSTOMER", Description = "Customer Representative" }
                };
                await context.Roles.AddRangeAsync(roles);
                await context.SaveChangesAsync();
            }

            var adminRole = await context.Roles.FirstAsync(r => r.Name == "ADMIN");
            var salesRole = await context.Roles.FirstAsync(r => r.Name == "SALES");
            var leaderRole = await context.Roles.FirstAsync(r => r.Name == "INSTALLATION_LEADER");
            var memberRole = await context.Roles.FirstAsync(r => r.Name == "INSTALLATION_MEMBER");
            var techRole = await context.Roles.FirstAsync(r => r.Name == "TECHNICIAN");
            var custRole = await context.Roles.FirstAsync(r => r.Name == "CUSTOMER");

            // 2. Seed Permissions
            if (!await context.Permissions.AnyAsync())
            {
                var permissions = new List<Permission>
                {
                    new() { Name = "USER_VIEW", Description = "View users info" },
                    new() { Name = "USER_CREATE", Description = "Create new user" },
                    new() { Name = "USER_UPDATE", Description = "Update user info" },
                    new() { Name = "USER_LOCK", Description = "Lock or unlock user account" },
                    new() { Name = "ROLE_MANAGE", Description = "Manage roles and role permissions" },
                    new() { Name = "CUSTOMER_VIEW", Description = "View customers info" },
                    new() { Name = "CUSTOMER_MANAGE", Description = "Manage customer information" },
                    new() { Name = "INVENTORY_VIEW", Description = "View inventory stocks" },
                    new() { Name = "INVENTORY_IMPORT", Description = "Import materials to warehouse" },
                    new() { Name = "INVENTORY_EXPORT", Description = "Export materials from warehouse" },
                    new() { Name = "QUOTATION_CREATE", Description = "Create price quotation" },
                    new() { Name = "CONTRACT_MANAGE", Description = "Manage sales and installation contracts" },
                    new() { Name = "PROJECT_MANAGE", Description = "Manage construction projects" },
                    new() { Name = "SURVEY_MANAGE", Description = "Manage site surveys" },
                    new() { Name = "INSTALLATION_UPDATE", Description = "Update installation progress" },
                    new() { Name = "SERVICE_REQUEST_CREATE", Description = "Create service request ticket" },
                    new() { Name = "SERVICE_ASSIGN", Description = "Assign service request to technician" },
                    new() { Name = "SERVICE_EXECUTE", Description = "Execute maintenance or repair" },
                    new() { Name = "EQUIPMENT_SCAN", Description = "Scan QR codes on equipment" },
                    new() { Name = "KPI_VIEW", Description = "View employee KPI results" },
                    new() { Name = "KPI_MANAGE", Description = "Configure and manage KPIs" },
                    new() { Name = "REPORT_VIEW", Description = "View system reports and dashboards" },
                    new() { Name = "AI_CONFIGURE", Description = "Configure AI model settings" }
                };
                await context.Permissions.AddRangeAsync(permissions);
                await context.SaveChangesAsync();
            }

            // Link ADMIN Role with all Permissions
            if (adminRole != null && !await context.RolePermissions.AnyAsync(rp => rp.RoleId == adminRole.Id))
            {
                var allPermissions = await context.Permissions.ToListAsync();
                var rolePermissions = allPermissions.Select(p => new RolePermission
                {
                    RoleId = adminRole.Id,
                    PermissionId = p.Id
                });
                await context.RolePermissions.AddRangeAsync(rolePermissions);
                await context.SaveChangesAsync();
            }

            // 3. Seed Accounts
            // 1 Admin
            var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "admin");
            if (adminUser == null)
            {
                var user = new User { Username = "admin", Email = "admin@fireguard.vn", FullName = "System Admin", PasswordHash = hashedPassword, IsActive = true };
                await context.Users.AddAsync(user);
                await context.SaveChangesAsync();
                await context.UserRoles.AddAsync(new UserRole { UserId = user.Id, RoleId = adminRole!.Id });
            }
            else
            {
                adminUser.PasswordHash = hashedPassword;
                await context.SaveChangesAsync();
            }

            // 3 Sales Staff
            for (int i = 1; i <= 3; i++)
            {
                var username = $"sales{i}";
                var existUser = await context.Users.FirstOrDefaultAsync(u => u.Username == username);
                if (existUser == null)
                {
                    var user = new User { Username = username, Email = $"{username}@fireguard.vn", FullName = $"Nhân Viên Kinh Doanh {i}", PasswordHash = hashedPassword, IsActive = true };
                    await context.Users.AddAsync(user);
                    await context.SaveChangesAsync();
                    await context.UserRoles.AddAsync(new UserRole { UserId = user.Id, RoleId = salesRole.Id });
                }
                else
                {
                    existUser.PasswordHash = hashedPassword;
                    await context.SaveChangesAsync();
                }
            }

            // 2 Installation Captains
            for (int i = 1; i <= 2; i++)
            {
                var username = $"leader{i}";
                var existUser = await context.Users.FirstOrDefaultAsync(u => u.Username == username);
                if (existUser == null)
                {
                    var user = new User { Username = username, Email = $"{username}@fireguard.vn", FullName = $"Đội Trưởng Lắp Đặt {i}", PasswordHash = hashedPassword, IsActive = true };
                    await context.Users.AddAsync(user);
                    await context.SaveChangesAsync();
                    await context.UserRoles.AddAsync(new UserRole { UserId = user.Id, RoleId = leaderRole.Id });
                }
                else
                {
                    existUser.PasswordHash = hashedPassword;
                    await context.SaveChangesAsync();
                }
            }

            // 8 Installation Members
            for (int i = 1; i <= 8; i++)
            {
                var username = $"member{i}";
                var existUser = await context.Users.FirstOrDefaultAsync(u => u.Username == username);
                if (existUser == null)
                {
                    var user = new User { Username = username, Email = $"{username}@fireguard.vn", FullName = $"Kỹ Thuật Viên Thi Công {i}", PasswordHash = hashedPassword, IsActive = true };
                    await context.Users.AddAsync(user);
                    await context.SaveChangesAsync();
                    await context.UserRoles.AddAsync(new UserRole { UserId = user.Id, RoleId = memberRole.Id });
                }
                else
                {
                    existUser.PasswordHash = hashedPassword;
                    await context.SaveChangesAsync();
                }
            }

            // 10 Repair Technicians (technicians who can be assigned to service requests)
            var techUsers = new List<User>();
            for (int i = 1; i <= 10; i++)
            {
                var username = $"tech{i}";
                var existUser = await context.Users.FirstOrDefaultAsync(u => u.Username == username);
                if (existUser == null)
                {
                    var user = new User
                    {
                        Username = username,
                        Email = $"{username}@fireguard.vn",
                        FullName = $"Kỹ Thuật Viên Bảo Trì {i}",
                        PasswordHash = hashedPassword,
                        IsActive = true,
                        IsTechnician = true,
                        IsOnDuty = true,
                        AverageRating = 4.0 + (i % 10) * 0.1, // 4.0 to 4.9 stars
                        AcceptanceRate = 0.8 + (i % 10) * 0.02,
                        Skills = i % 3 == 0 ? "Alarms,Pumps" : i % 2 == 0 ? "Sprinklers,Pumps" : "Alarms,Sprinklers",
                        Latitude = 10.762622 + (i * 0.005), // HCMC coordinates variance
                        Longitude = 106.660172 + (i * 0.005)
                    };
                    await context.Users.AddAsync(user);
                    await context.SaveChangesAsync();
                    await context.UserRoles.AddAsync(new UserRole { UserId = user.Id, RoleId = techRole.Id });
                    techUsers.Add(user);
                }
                else
                {
                    existUser.PasswordHash = hashedPassword;
                    await context.SaveChangesAsync();
                    techUsers.Add(existUser);
                }
            }

            // 20 Customers (CRM and Accounts)
            var customers = new List<Customer>();
            for (int i = 1; i <= 20; i++)
            {
                var username = $"customer{i}";
                var existCust = await context.Customers.FirstOrDefaultAsync(c => c.Email == $"{username}@client.com");
                if (existCust == null)
                {
                    var cust = new Customer
                    {
                        Id = $"cust_{i}",
                        Name = $"Công Ty Cổ Phần PCCC Khách Hàng {i}",
                        Email = $"{username}@client.com",
                        Phone = $"09000000{i:D2}",
                        IsActive = true
                    };
                    await context.Customers.AddAsync(cust);
                    await context.SaveChangesAsync();

                    var addr = new CustomerAddress
                    {
                        CustomerId = cust.Id,
                        AddressLine = $"{i * 10} Nguyễn Đình Chiểu",
                        District = "Quận 3",
                        City = "TP. Hồ Chí Minh",
                        IsDefault = true,
                        Latitude = 10.7526 + (i * 0.001),
                        Longitude = 106.6501 + (i * 0.001)
                    };
                    await context.CustomerAddresses.AddAsync(addr);
                    await context.SaveChangesAsync();
                    customers.Add(cust);
                }
                else
                {
                    customers.Add(existCust);
                }

                var existCustUser = await context.Users.FirstOrDefaultAsync(u => u.Username == username);
                if (existCustUser == null)
                {
                    var user = new User { Username = username, Email = $"{username}@client.com", FullName = $"Đại Diện Khách Hàng {i}", PasswordHash = hashedPassword, IsActive = true };
                    await context.Users.AddAsync(user);
                    await context.SaveChangesAsync();
                    await context.UserRoles.AddAsync(new UserRole { UserId = user.Id, RoleId = custRole.Id });
                }
                else
                {
                    existCustUser.PasswordHash = hashedPassword;
                    await context.SaveChangesAsync();
                }
            }

            // 4. Seed Suppliers (5 Suppliers)
            var suppliers = new List<Supplier>();
            for (int i = 1; i <= 5; i++)
            {
                var name = $"Nhà Cung Cấp Thiết Bị PCCC {i}";
                var existSup = await context.Suppliers.FirstOrDefaultAsync(s => s.Name == name);
                if (existSup == null)
                {
                    var sup = new Supplier { Name = name, TaxCode = $"010999988{i}", Email = $"supplier{i}@fireguard.vn", Phone = $"024399911{i}", Address = $"KCN Thăng Long, Đông Anh, Hà Nội" };
                    await context.Suppliers.AddAsync(sup);
                    await context.SaveChangesAsync();
                    suppliers.Add(sup);
                }
                else
                {
                    suppliers.Add(existSup);
                }
            }

            // 5. Seed Brands & Units
            if (!await context.Brands.AnyAsync())
            {
                await context.Brands.AddAsync(new Brand { Name = "FireGuard Premium", Description = "Thương hiệu PCCC cao cấp" });
                await context.SaveChangesAsync();
            }
            var brand = await context.Brands.FirstAsync();

            if (!await context.Units.AnyAsync())
            {
                var units = new List<Unit>
                {
                    new() { Name = "Bình", Description = "Bình chữa cháy các loại" },
                    new() { Name = "Cái", Description = "Đầu phun, chuông báo, cảm biến" },
                    new() { Name = "Bộ", Description = "Hệ thống tủ điều khiển" },
                    new() { Name = "Mét", Description = "Cuộn vòi chữa cháy" }
                };
                await context.Units.AddRangeAsync(units);
                await context.SaveChangesAsync();
            }
            var binUnit = await context.Units.FirstAsync(u => u.Name == "Bình");
            var caiUnit = await context.Units.FirstAsync(u => u.Name == "Cái");

            // 6. Seed Categories (10 Categories)
            var categories = new List<EquipmentCategory>();
            for (int i = 1; i <= 10; i++)
            {
                var name = i switch
                {
                    1 => "Bình chữa cháy bột",
                    2 => "Bình chữa cháy khí CO2",
                    3 => "Đầu báo khói cảm biến",
                    4 => "Đầu báo nhiệt liên hợp",
                    5 => "Tủ trung tâm báo cháy",
                    6 => "Nút nhấn khẩn cấp",
                    7 => "Chuông và còi báo động",
                    8 => "Đầu phun Sprinkler",
                    9 => "Cuộn vòi và lăng phun",
                    _ => $"Hệ thống cứu hộ chuyên dụng {i}"
                };

                var existCat = await context.EquipmentCategories.FirstOrDefaultAsync(c => c.Name == name);
                if (existCat == null)
                {
                    var cat = new EquipmentCategory { Name = name, Description = $"Danh mục sản phẩm {name}" };
                    await context.EquipmentCategories.AddAsync(cat);
                    await context.SaveChangesAsync();
                    categories.Add(cat);
                }
                else
                {
                    categories.Add(existCat);
                }
            }

            // 7. Seed Equipment Models (30 Equipment Models)
            var models = new List<EquipmentModel>();
            if (await context.EquipmentModels.CountAsync() < 30)
            {
                for (int i = 1; i <= 30; i++)
                {
                    var cat = categories[i % categories.Count];
                    var code = $"MODEL-CODE-{i:D3}";
                    if (!await context.EquipmentModels.AnyAsync(m => m.ModelCode == code))
                    {
                        var model = new EquipmentModel
                        {
                            ModelCode = code,
                            Name = $"Thiết Bị PCCC Model {i}",
                            Description = $"Mẫu thiết bị báo động phòng chống cháy chất lượng cao mã hiệu {i}",
                            SellingPrice = 150000 + (i * 20000),
                            CategoryId = cat.Id,
                            BrandId = brand.Id,
                            UnitId = i % 2 == 0 ? binUnit.Id : caiUnit.Id
                        };
                        await context.EquipmentModels.AddAsync(model);
                        await context.SaveChangesAsync();
                        models.Add(model);
                    }
                }
            }
            else
            {
                models = await context.EquipmentModels.ToListAsync();
            }

            // 8. Seed Warehouses (3 Warehouses)
            var warehouses = new List<Warehouse>();
            for (int i = 1; i <= 3; i++)
            {
                var name = $"Kho Lưu Trữ Thiết Bị Số {i}";
                var existWh = await context.Warehouses.FirstOrDefaultAsync(w => w.Name == name);
                if (existWh == null)
                {
                    var wh = new Warehouse { Name = name, Address = $"Số {i * 20} Giải Phóng, Hai Bà Trưng, Hà Nội", ContactPerson = $"Thủ Kho Số {i}", ContactPhone = "0911223344" };
                    await context.Warehouses.AddAsync(wh);
                    await context.SaveChangesAsync();
                    warehouses.Add(wh);
                }
                else
                {
                    warehouses.Add(existWh);
                }
            }

            // 9. Seed 100 Equipment Assets with serial & QR payload
            var assets = new List<EquipmentAsset>();
            if (await context.EquipmentAssets.CountAsync() < 100)
            {
                for (int i = 1; i <= 100; i++)
                {
                    var model = models[i % models.Count];
                    var wh = warehouses[i % warehouses.Count];
                    var cust = customers[i % customers.Count];
                    var serial = $"SN-2026-FIREGUARD-{i:D4}";

                    var asset = new EquipmentAsset
                    {
                        ModelId = model.Id,
                        WarehouseId = wh.Id,
                        CustomerId = cust.Id,
                        SerialNumber = serial,
                        Status = i % 10 == 0 ? AssetStatus.Installed : AssetStatus.InStock,
                        PurchasePrice = model.SellingPrice * 0.8m,
                        WarrantyPeriodMonths = 24,
                        ManufacturedDate = DateTime.UtcNow.AddMonths(-6),
                        ExpiryDate = DateTime.UtcNow.AddMonths(18),
                        NextMaintenanceDate = DateTime.UtcNow.AddDays((i % 15) - 5) // Creates overdue, nearing, and distant reminders
                    };

                    await context.EquipmentAssets.AddAsync(asset);
                    await context.SaveChangesAsync();

                    var qr = new EquipmentQRCode
                    {
                        AssetId = asset.Id,
                        QRCodePayload = $"https://fireguard.vn/scan/asset/{asset.Id}?sn={serial}"
                    };
                    await context.EquipmentQRCodes.AddAsync(qr);
                    await context.SaveChangesAsync();
                    assets.Add(asset);
                }
            }
            else
            {
                assets = await context.EquipmentAssets.ToListAsync();
            }

            // 10. Seed 10 Quotations & 5 Contracts
            var quotations = new List<Quotation>();
            if (!await context.Quotations.AnyAsync())
            {
                for (int i = 1; i <= 10; i++)
                {
                    var cust = customers[i % customers.Count];
                    var q = new Quotation
                    {
                        QuotationNumber = $"BG-2026-Q{i:D4}",
                        Version = 1,
                        CustomerId = cust.Id,
                        SubTotal = 10000000m * i,
                        TotalAmount = 10800000m * i,
                        Status = i <= 5 ? QuotationStatus.Accepted : QuotationStatus.Sent
                    };
                    await context.Quotations.AddAsync(q);
                    await context.SaveChangesAsync();
                    quotations.Add(q);

                    // Seed corresponding 5 contracts
                    if (i <= 5)
                    {
                        var c = new Contract
                        {
                            ContractNumber = $"HD-2026-C{i:D4}",
                            CustomerId = cust.Id,
                            StartDate = DateTime.UtcNow.AddMonths(-1),
                            EndDate = DateTime.UtcNow.AddMonths(11),
                            TotalValue = q.TotalAmount,
                            Status = ContractStatus.Active
                        };
                        await context.Contracts.AddAsync(c);
                        await context.SaveChangesAsync();
                    }
                }
            }

            // 11. Seed 5 Projects
            if (!await context.Projects.AnyAsync())
            {
                var activeContracts = await context.Contracts.Take(5).ToListAsync();
                for (int i = 0; i < activeContracts.Count; i++)
                {
                    var c = activeContracts[i];
                    var p = new Project
                    {
                        Name = $"Công Trình Lắp Đặt Trụ Sở {i + 1}",
                        ContractId = c.Id,
                        CustomerId = c.CustomerId,
                        Status = ProjectStatus.InProgress,
                        StartDate = DateTime.UtcNow.AddDays(-15),
                        EndDate = DateTime.UtcNow.AddDays(15),
                        ProgressPercentage = 30 + (i * 10)
                    };
                    await context.Projects.AddAsync(p);
                    await context.SaveChangesAsync();
                }
            }

            // 12. Seed 20 Repair Requests
            if (!await context.ServiceRequests.AnyAsync())
            {
                for (int i = 1; i <= 20; i++)
                {
                    var cust = customers[i % customers.Count];
                    var defaultAddr = await context.CustomerAddresses.FirstOrDefaultAsync(a => a.CustomerId == cust.Id)
                                      ?? await context.CustomerAddresses.FirstOrDefaultAsync();

                    var req = new ServiceRequest
                    {
                        RequestNumber = $"SR-2026-{i:D4}",
                        CustomerId = cust.Id,
                        AddressId = defaultAddr?.Id ?? "dummy-address-id",
                        Description = i % 3 == 0 ? "Bình chữa cháy khí CO2 bị tụt áp suất nhẹ." : "Đầu báo khói nhấp nháy báo lỗi đèn vàng liên tục.",
                        Status = i <= 5 ? ServiceRequestStatus.Completed : i <= 10 ? ServiceRequestStatus.Dispatching : ServiceRequestStatus.AwaitingDispatch,
                        Urgency = i % 4 == 0 ? UrgencyLevel.Emergency : UrgencyLevel.Medium,
                        DesiredTime = DateTime.UtcNow.AddDays(1)
                    };
                    await context.ServiceRequests.AddAsync(req);
                    await context.SaveChangesAsync();
                }
            }

            // 13. Seed 10 Maintenance Reminders
            if (!await context.MaintenanceReminders.AnyAsync())
            {
                var maintenanceAssets = assets.Take(10).ToList();
                for (int i = 0; i < maintenanceAssets.Count; i++)
                {
                    var asset = maintenanceAssets[i];
                    var reminder = new MaintenanceReminder
                    {
                        EquipmentAssetId = asset.Id,
                        ScheduledDate = DateTime.UtcNow.AddDays(3),
                        ReminderType = i % 3 == 0 ? "Overdue" : "3Days",
                        Status = ReminderStatus.Pending
                    };
                    await context.MaintenanceReminders.AddAsync(reminder);
                    await context.SaveChangesAsync();
                }
            }

            // 14. Seed Technician KPIs
            if (!await context.TechnicianKpis.AnyAsync())
            {
                var month = DateTime.UtcNow.Month;
                var year = DateTime.UtcNow.Year;
                for (int i = 0; i < Math.Min(techUsers.Count, 5); i++)
                {
                    var tech = techUsers[i];
                    var kpi = new TechnicianKpi
                    {
                        TechnicianId = tech.Id,
                        Year = year,
                        Month = month,
                        CompletedJobs = 15 + i,
                        CustomerRating = 4.2 + (i * 0.1),
                        OnTimeRate = 0.90 + (i * 0.02),
                        FirstTimeFixRate = 0.85 + (i * 0.02),
                        ComplianceRate = 0.95,
                        RawKpiScore = 80 + (i * 3),
                        AdjustedScore = 80 + (i * 3),
                        ApprovedBonus = 1000000 * i
                    };
                    await context.TechnicianKpis.AddAsync(kpi);
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}
