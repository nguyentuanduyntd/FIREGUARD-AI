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
            var defaultRoles = new Dictionary<string, string>
            {
                { "ADMIN", "System Administrator" },
                { "SALES", "Sales Representative" },
                { "INSTALLATION_LEADER", "Installation Team Leader" },
                { "INSTALLATION_MEMBER", "Installation Staff Member" },
                { "TECHNICIAN", "Maintenance and Repair Technician" },
                { "CUSTOMER", "Customer Representative" }
            };

            foreach (var kvp in defaultRoles)
            {
                if (!await context.Roles.AnyAsync(r => r.Name == kvp.Key))
                {
                    await context.Roles.AddAsync(new Role { Name = kvp.Key, Description = kvp.Value });
                }
            }
            await context.SaveChangesAsync();

            var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "ADMIN") ?? new Role { Name = "ADMIN", Description = "System Administrator" };
            var salesRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "SALES") ?? new Role { Name = "SALES", Description = "Sales Representative" };
            var leaderRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "INSTALLATION_LEADER") ?? new Role { Name = "INSTALLATION_LEADER", Description = "Installation Team Leader" };
            var memberRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "INSTALLATION_MEMBER") ?? new Role { Name = "INSTALLATION_MEMBER", Description = "Installation Staff Member" };
            var techRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "TECHNICIAN") ?? new Role { Name = "TECHNICIAN", Description = "Maintenance and Repair Technician" };
            var custRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "CUSTOMER") ?? new Role { Name = "CUSTOMER", Description = "Customer Representative" };

            // 2. Seed Permissions
            var defaultPermissions = new List<Permission>
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

            foreach (var perm in defaultPermissions)
            {
                if (!await context.Permissions.AnyAsync(p => p.Name == perm.Name))
                {
                    await context.Permissions.AddAsync(perm);
                }
            }
            await context.SaveChangesAsync();

            var allPermissions = await context.Permissions.ToListAsync();
            var permDict = allPermissions.ToDictionary(p => p.Name, p => p.Id);

            async Task AssignPermissionsAsync(Role targetRole, IEnumerable<string> permNames)
            {
                foreach (var pName in permNames)
                {
                    if (permDict.TryGetValue(pName, out var pId))
                    {
                        if (!await context.RolePermissions.AnyAsync(rp => rp.RoleId == targetRole.Id && rp.PermissionId == pId))
                        {
                            await context.RolePermissions.AddAsync(new RolePermission { RoleId = targetRole.Id, PermissionId = pId });
                        }
                    }
                }
                await context.SaveChangesAsync();
            }

            // Link Roles with Permissions
            await AssignPermissionsAsync(adminRole, permDict.Keys);
            await AssignPermissionsAsync(salesRole, new[] {
                "CUSTOMER_VIEW", "CUSTOMER_MANAGE", "INVENTORY_VIEW",
                "QUOTATION_CREATE", "CONTRACT_MANAGE", "REPORT_VIEW",
                "KPI_VIEW", "EQUIPMENT_SCAN", "SURVEY_MANAGE"
            });
            await AssignPermissionsAsync(techRole, new[] {
                "SERVICE_REQUEST_CREATE", "SERVICE_ASSIGN", "SERVICE_EXECUTE",
                "EQUIPMENT_SCAN", "KPI_VIEW", "INVENTORY_VIEW"
            });
            await AssignPermissionsAsync(leaderRole, new[] {
                "PROJECT_MANAGE", "SURVEY_MANAGE", "INSTALLATION_UPDATE",
                "EQUIPMENT_SCAN", "KPI_VIEW", "INVENTORY_VIEW"
            });
            await AssignPermissionsAsync(memberRole, new[] {
                "INSTALLATION_UPDATE", "EQUIPMENT_SCAN", "INVENTORY_VIEW"
            });
            await AssignPermissionsAsync(custRole, new[] {
                "SERVICE_REQUEST_CREATE", "CUSTOMER_VIEW", "EQUIPMENT_SCAN"
            });

            async Task EnsureUserRoleAsync(string userId, string roleId)
            {
                if (!await context.UserRoles.AnyAsync(ur => ur.UserId == userId && ur.RoleId == roleId))
                {
                    await context.UserRoles.AddAsync(new UserRole { UserId = userId, RoleId = roleId });
                    await context.SaveChangesAsync();
                }
            }

            // 3. Seed Accounts
            // 1 Admin
            var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "admin");
            if (adminUser == null)
            {
                adminUser = new User { Username = "admin", Email = "admin@fireguard.vn", FullName = "System Admin", PasswordHash = hashedPassword, IsActive = true };
                await context.Users.AddAsync(adminUser);
                await context.SaveChangesAsync();
            }
            else
            {
                adminUser.PasswordHash = hashedPassword;
                await context.SaveChangesAsync();
            }
            await EnsureUserRoleAsync(adminUser.Id, adminRole.Id);

            // 3 Sales Staff
            for (int i = 1; i <= 3; i++)
            {
                var username = $"sales{i}";
                var existUser = await context.Users.FirstOrDefaultAsync(u => u.Username == username);
                if (existUser == null)
                {
                    existUser = new User { Username = username, Email = $"{username}@fireguard.vn", FullName = $"Nhân Viên Kinh Doanh {i}", PasswordHash = hashedPassword, IsActive = true };
                    await context.Users.AddAsync(existUser);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existUser.PasswordHash = hashedPassword;
                    await context.SaveChangesAsync();
                }
                await EnsureUserRoleAsync(existUser.Id, salesRole.Id);
            }

            // 2 Installation Captains
            var leaders = new List<User>();
            for (int i = 1; i <= 2; i++)
            {
                var username = $"leader{i}";
                var existUser = await context.Users.FirstOrDefaultAsync(u => u.Username == username);
                if (existUser == null)
                {
                    existUser = new User { Username = username, Email = $"{username}@fireguard.vn", FullName = $"Đội Trưởng Lắp Đặt {i}", PasswordHash = hashedPassword, IsActive = true };
                    await context.Users.AddAsync(existUser);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existUser.PasswordHash = hashedPassword;
                    await context.SaveChangesAsync();
                }
                await EnsureUserRoleAsync(existUser.Id, leaderRole.Id);
                leaders.Add(existUser);
            }

            // 8 Installation Members
            var members = new List<User>();
            for (int i = 1; i <= 8; i++)
            {
                var username = $"member{i}";
                var existUser = await context.Users.FirstOrDefaultAsync(u => u.Username == username);
                if (existUser == null)
                {
                    existUser = new User { Username = username, Email = $"{username}@fireguard.vn", FullName = $"Kỹ Thuật Viên Thi Công {i}", PasswordHash = hashedPassword, IsActive = true };
                    await context.Users.AddAsync(existUser);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existUser.PasswordHash = hashedPassword;
                    await context.SaveChangesAsync();
                }
                await EnsureUserRoleAsync(existUser.Id, memberRole.Id);
                members.Add(existUser);
            }

            // 10 Repair Technicians (technicians who can be assigned to service requests)
            var techUsers = new List<User>();
            for (int i = 1; i <= 10; i++)
            {
                var username = $"tech{i}";
                var existUser = await context.Users.FirstOrDefaultAsync(u => u.Username == username);
                if (existUser == null)
                {
                    existUser = new User
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
                        Latitude = 21.028511 + (i * 0.005), // Hanoi coordinates variance
                        Longitude = 105.804817 + (i * 0.005)
                    };
                    await context.Users.AddAsync(existUser);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existUser.PasswordHash = hashedPassword;
                    await context.SaveChangesAsync();
                }
                await EnsureUserRoleAsync(existUser.Id, techRole.Id);
                techUsers.Add(existUser);
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
                        AddressLine = $"{i * 10} Đường Láng",
                        District = "Đống Đa",
                        City = "Hà Nội",
                        IsDefault = true,
                        Latitude = 21.0125 + (i * 0.001),
                        Longitude = 105.8012 + (i * 0.001)
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
                    existCustUser = new User { Username = username, Email = $"{username}@client.com", FullName = $"Đại Diện Khách Hàng {i}", PasswordHash = hashedPassword, IsActive = true };
                    await context.Users.AddAsync(existCustUser);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existCustUser.PasswordHash = hashedPassword;
                    await context.SaveChangesAsync();
                }
                await EnsureUserRoleAsync(existCustUser.Id, custRole.Id);
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
            var brand = await context.Brands.FirstOrDefaultAsync() ?? new Brand { Name = "FireGuard Premium", Description = "Thương hiệu PCCC cao cấp" };

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
            var binUnit = await context.Units.FirstOrDefaultAsync(u => u.Name == "Bình") ?? new Unit { Name = "Bình" };
            var caiUnit = await context.Units.FirstOrDefaultAsync(u => u.Name == "Cái") ?? new Unit { Name = "Cái" };

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

            // 7. Seed Equipment Models (Realistic Fire Protection Products)
            var models = new List<EquipmentModel>();
            if (await context.EquipmentModels.CountAsync() < 100)
            {
                var realProducts = new[]
                {
                    new { Code = "BCC-MFZ4", Name = "Bình chữa cháy bột ABC 4kg MFZL4", Desc = "Bình chữa cháy xách tay dùng bột ABC, dung tích 4kg, phù hợp văn phòng, nhà xưởng nhỏ.", Price = 250000m, IsBin = true, Img = "/assets/products/extinguisher_1789470333748.jpg" },
                    new { Code = "EXT-ABC-4KG", Name = "Bình chữa cháy bột ABC 4kg MFZL4", Desc = "Bình chữa cháy xách tay dùng bột ABC 4kg đạt chuẩn PCCC.", Price = 250000m, IsBin = true, Img = "/assets/products/extinguisher_1789470333748.jpg" },
                    new { Code = "BCC-MT3", Name = "Bình chữa cháy khí CO2 3kg MT3", Desc = "Bình chữa cháy khí CO2 chuyên dụng cho thiết bị điện, máy móc, dung tích 3kg.", Price = 380000m, IsBin = true, Img = "/assets/products/extinguisher_1789470333748.jpg" },
                    new { Code = "EXT-CO2-3KG", Name = "Bình chữa cháy khí CO2 3kg MT3", Desc = "Bình chữa cháy khí CO2 3kg dập tắt đám cháy phòng máy, phòng server.", Price = 380000m, IsBin = true, Img = "/assets/products/extinguisher_1789470333748.jpg" },
                    new { Code = "BCC-MFZ8", Name = "Bình chữa cháy bột ABC 8kg MFZL8", Desc = "Bình chữa cháy xách tay dùng bột ABC, dung tích lớn 8kg.", Price = 350000m, IsBin = true, Img = "/assets/products/extinguisher_1789470333748.jpg" },
                    new { Code = "EXT-ABC-8KG", Name = "Bình chữa cháy bột ABC 8kg MFZL8", Desc = "Bình chữa cháy xách tay dùng bột ABC dung tích lớn 8kg.", Price = 350000m, IsBin = true, Img = "/assets/products/extinguisher_1789470333748.jpg" },
                    new { Code = "BCC-MT5", Name = "Bình chữa cháy khí CO2 5kg MT5", Desc = "Bình chữa cháy khí CO2 xách tay, dung tích 5kg, dập tắt đám cháy điện hiệu quả.", Price = 520000m, IsBin = true, Img = "/assets/products/extinguisher_1789470333748.jpg" },
                    new { Code = "EXT-CO2-5KG", Name = "Bình chữa cháy khí CO2 5kg MT5", Desc = "Bình chữa cháy khí CO2 loại 5kg.", Price = 520000m, IsBin = true, Img = "/assets/products/extinguisher_1789470333748.jpg" },
                    new { Code = "BCC-XE35", Name = "Bình chữa cháy xe đẩy bột 35kg", Desc = "Bình chữa cháy loại xe đẩy cỡ lớn dùng cho nhà kho, nhà xưởng công nghiệp.", Price = 1850000m, IsBin = true, Img = "/assets/products/extinguisher_1789470333748.jpg" },
                    new { Code = "DB-KHOI", Name = "Đầu báo khói quang học hochiki", Desc = "Đầu báo khói quang học hochiki SOC-24VN độ nhạy cao, chống báo giả.", Price = 450000m, IsBin = false, Img = "/assets/products/smoke_detector_1789470347056.jpg" },
                    new { Code = "DET-SMOKE-WIRE", Name = "Đầu báo khói quang học Hochiki SOC-24VN", Desc = "Đầu báo khói quang học không dây kết nối tự động, độ nhạy cao.", Price = 450000m, IsBin = false, Img = "/assets/products/smoke_detector_1789470347056.jpg" },
                    new { Code = "DB-NHIET", Name = "Đầu báo nhiệt gia tăng hochiki", Desc = "Đầu báo nhiệt gia tăng DSC-EA phát hiện sự thay đổi nhiệt độ đột ngột.", Price = 280000m, IsBin = false, Img = "/assets/products/smoke_detector_1789470347056.jpg" },
                    new { Code = "DET-HEAT-WIRE", Name = "Đầu báo nhiệt gia tăng Hochiki DSC-EA", Desc = "Đầu báo nhiệt gia tăng chống báo giả khu vực nhiệt độ cao.", Price = 280000m, IsBin = false, Img = "/assets/products/smoke_detector_1789470347056.jpg" },
                    new { Code = "TCC-4ZONE", Name = "Tủ trung tâm báo cháy 4 kênh", Desc = "Tủ điều khiển trung tâm báo cháy thường 4 kênh (Zone) hochiki HCP-1004E.", Price = 4200000m, IsBin = false, Img = "/assets/products/fire_alarm_panel_1789470361607.jpg" },
                    new { Code = "ALM-PANEL-4", Name = "Tủ trung tâm báo cháy 4 kênh Hochiki", Desc = "Tủ điều khiển báo cháy 4 zone Hochiki HCP-1004E.", Price = 4200000m, IsBin = false, Img = "/assets/products/fire_alarm_panel_1789470361607.jpg" },
                    new { Code = "TCC-8ZONE", Name = "Tủ trung tâm báo cháy 8 kênh", Desc = "Tủ điều khiển trung tâm báo cháy thường 8 kênh hochiki HCP-1008E.", Price = 5800000m, IsBin = false, Img = "/assets/products/fire_alarm_panel_1789470361607.jpg" },
                    new { Code = "ALM-PANEL-8", Name = "Tủ trung tâm báo cháy 8 kênh Hochiki", Desc = "Tủ điều khiển trung tâm báo cháy 8 kênh Hochiki HCP-1008E.", Price = 5800000m, IsBin = false, Img = "/assets/products/fire_alarm_panel_1789470361607.jpg" },
                    new { Code = "CHUONG-BAO", Name = "Chuông báo cháy 6 inch", Desc = "Chuông báo cháy Hochiki FBB-150I 24VDC âm lượng 90dB.", Price = 320000m, IsBin = false, Img = "/assets/products/fire_bell_1789470375496.jpg" },
                    new { Code = "ALM-BELL", Name = "Chuông báo cháy 6 inch Hochiki", Desc = "Chuông báo động âm lượng 90dB Hochiki FBB-150I 24VDC.", Price = 320000m, IsBin = false, Img = "/assets/products/fire_bell_1789470375496.jpg" },
                    new { Code = "ALM-BUTTON", Name = "Nút nhấn báo cháy khẩn cấp Hochiki", Desc = "Nút nhấn khẩn cấp báo cháy có nắp bảo vệ chống va chạm.", Price = 180000m, IsBin = false, Img = "/assets/products/fire_bell_1789470375496.jpg" },
                    new { Code = "DEN-EXIT", Name = "Đèn EXIT thoát hiểm", Desc = "Đèn chỉ dẫn thoát hiểm (EXIT) 2 mặt, có pin dự phòng 2h.", Price = 150000m, IsBin = false, Img = "/assets/products/exit_sign_1789470391485.jpg" },
                    new { Code = "DEN-SCS", Name = "Đèn sự cố mắt ếch kép", Desc = "Đèn chiếu sáng sự cố khi mất điện, pin dự phòng chiếu sáng liên tục 2 tiếng.", Price = 220000m, IsBin = false, Img = "/assets/products/exit_sign_1789470391485.jpg" },
                    new { Code = "SPK-NOZZLE-68", Name = "Đầu phun Sprinkler 68°C", Desc = "Đầu phun chữa cháy tự động Sprinkler phản ứng nhiệt 68°C.", Price = 85000m, IsBin = false, Img = "/assets/products/fire_sprinkler_1789470404564.jpg" },
                    new { Code = "PIPE-STEEL-DN50", Name = "Ống thép đúc DN50 PCCC", Desc = "Ống thép dẫn nước chữa cháy áp lực cao DN50 (đơn vị: mét).", Price = 160000m, IsBin = false, Img = "/assets/products/fire_hose_1789470427528.jpg" },
                    new { Code = "BOM-DIESEL", Name = "Máy bơm chữa cháy Diesel 50HP", Desc = "Máy bơm chữa cháy động cơ Diesel Hyundai công suất 50HP, lưu lượng lớn.", Price = 45000000m, IsBin = false, Img = "/assets/products/fire_pump_1789470416223.jpg" },
                    new { Code = "BOM-ELEC", Name = "Máy bơm chữa cháy Điện 30HP", Desc = "Máy bơm chữa cháy động cơ điện Ebara công suất 30HP.", Price = 32000000m, IsBin = false, Img = "/assets/products/fire_pump_1789470416223.jpg" },
                    new { Code = "VOI-CC-D50", Name = "Vòi chữa cháy D50 dài 20m", Desc = "Vòi chữa cháy vách tường D50 dài 20m kèm ngàm nối ngàm nhôm.", Price = 450000m, IsBin = false, Img = "/assets/products/fire_hose_1789470427528.jpg" },
                    new { Code = "LANG-CC", Name = "Lăng phun chữa cháy D50", Desc = "Lăng phun nước chữa cháy hợp kim nhôm D50.", Price = 80000m, IsBin = false, Img = "/assets/products/fire_sprinkler_1789470404564.jpg" }
                };

                for (int i = 0; i < realProducts.Length; i++)
                {
                    var rp = realProducts[i];
                    var cat = categories[i % categories.Count];
                    var existingModel = await context.EquipmentModels.FirstOrDefaultAsync(m => m.ModelCode == rp.Code);
                    if (existingModel == null)
                    {
                        var model = new EquipmentModel
                        {
                            ModelCode = rp.Code,
                            Name = rp.Name,
                            Description = rp.Desc,
                            SellingPrice = rp.Price,
                            CategoryId = cat.Id,
                            BrandId = brand.Id,
                            UnitId = rp.IsBin ? binUnit.Id : caiUnit.Id,
                            ImageUrl = rp.Img
                        };
                        await context.EquipmentModels.AddAsync(model);
                        await context.SaveChangesAsync();
                        models.Add(model);
                    }
                    else
                    {
                        if (existingModel.ImageUrl != rp.Img)
                        {
                            existingModel.ImageUrl = rp.Img;
                            await context.SaveChangesAsync();
                        }
                        models.Add(existingModel);
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
                    var leader = leaders.Count > 0 ? leaders[i % leaders.Count] : null;
                    var memberSubList = members.Skip((i % 4) * 2).Take(2).Select(m => m.Id).ToList();
                    var p = new Project
                    {
                        Name = $"Công Trình Lắp Đặt Trụ Sở {i + 1}",
                        ContractId = c.Id,
                        CustomerId = c.CustomerId,
                        TeamLeaderId = leader?.Id,
                        TeamMembersJson = string.Join(",", memberSubList),
                        Status = ProjectStatus.InProgress,
                        StartDate = DateTime.UtcNow.AddDays(-15),
                        EndDate = DateTime.UtcNow.AddDays(15),
                        ProgressPercentage = 30 + (i * 10)
                    };
                    await context.Projects.AddAsync(p);
                    await context.SaveChangesAsync();
                }
            }

            // Always update any unassigned projects so leader1 and leader2 have projects assigned
            var unassignedProjects = await context.Projects.Where(p => string.IsNullOrEmpty(p.TeamLeaderId)).ToListAsync();
            if (unassignedProjects.Any() && leaders.Any())
            {
                for (int i = 0; i < unassignedProjects.Count; i++)
                {
                    var p = unassignedProjects[i];
                    p.TeamLeaderId = leaders[i % leaders.Count].Id;
                    if (members.Any())
                    {
                        var memberSubList = members.Skip((i % 4) * 2).Take(2).Select(m => m.Id).ToList();
                        p.TeamMembersJson = string.Join(",", memberSubList);
                    }
                }
                await context.SaveChangesAsync();
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
            // 15. Seed Projects for Installation Team
            if (!await context.Projects.AnyAsync())
            {
                var leaderUsers = await context.Users.Where(u => u.Username.StartsWith("leader")).ToListAsync();
                var memberUsers = await context.Users.Where(u => u.Username.StartsWith("member")).ToListAsync();

                var project1 = new FireGuard.Domain.Entities.Projects.Project
                {
                    Name = "Dự án Lắp đặt PCCC Tòa nhà Alpha",
                    CustomerId = customers.First().Id,
                    Status = FireGuard.Domain.Entities.Projects.ProjectStatus.InProgress,
                    ProgressPercentage = 30,
                    TeamLeaderId = leaderUsers.FirstOrDefault()?.Id,
                    TeamMembersJson = "[\"" + memberUsers.FirstOrDefault()?.Id + "\"]",
                    StartDate = DateTime.UtcNow.AddDays(-10),
                    EndDate = DateTime.UtcNow.AddDays(20),
                    Notes = "Đang đi đường ống chính tầng trệt"
                };
                
                var project2 = new FireGuard.Domain.Entities.Projects.Project
                {
                    Name = "Dự án Lắp đặt PCCC Nhà kho Beta",
                    CustomerId = customers.Skip(1).First().Id,
                    Status = FireGuard.Domain.Entities.Projects.ProjectStatus.Ready,
                    ProgressPercentage = 0,
                    TeamLeaderId = leaderUsers.FirstOrDefault()?.Id,
                    StartDate = DateTime.UtcNow.AddDays(2),
                    EndDate = DateTime.UtcNow.AddDays(30),
                    Notes = "Chờ vật tư tập kết để bắt đầu thi công"
                };

                await context.Projects.AddRangeAsync(project1, project2);
                await context.SaveChangesAsync();

                // Seed some Project Tasks
                var task1 = new FireGuard.Domain.Entities.Projects.ProjectTask
                {
                    ProjectId = project1.Id,
                    TaskName = "Kéo dây tín hiệu báo cháy tầng 1",
                    Description = "Kéo dây tín hiệu chống cháy 2x1.5",
                    Status = FireGuard.Domain.Entities.Projects.ProjectTaskStatus.Completed,
                    AssignedToUserId = memberUsers.FirstOrDefault()?.Id,
                    Progress = 100
                };
                var task2 = new FireGuard.Domain.Entities.Projects.ProjectTask
                {
                    ProjectId = project1.Id,
                    TaskName = "Lắp đặt và test chuông báo cháy",
                    Description = "Lắp đặt 10 chuông báo tại hành lang",
                    Status = FireGuard.Domain.Entities.Projects.ProjectTaskStatus.InProgress,
                    AssignedToUserId = memberUsers.FirstOrDefault()?.Id,
                    Progress = 50
                };
                
                await context.ProjectTasks.AddRangeAsync(task1, task2);
                await context.SaveChangesAsync();
            }
        }
    }
}
