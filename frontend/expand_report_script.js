import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Writing ultimate 65-75+ page generator script...");

// Read the existing script as base template
const targetScriptPath = path.resolve(__dirname, 'generate_report_theo_dung_muc_luc.js');
let content = fs.readFileSync(targetScriptPath, 'utf8');

// Let's enhance Chương 2.3 with deep technical architecture descriptions
const expanded23 = `        createSubHeading("2.3. Công nghệ sử dụng"),
        createSubSubHeading("2.3.1. Giới thiệu công nghệ"),
        p("Hệ thống FireGuard AI được xây dựng trên một ngăn xếp công nghệ (Technology Stack) hiện đại, đồng bộ và đạt chuẩn công nghiệp hàng đầu hiện nay:"),
        bullet("Backend Framework: Ngôn ngữ C# trên nền tảng .NET Core 8 (phiên bản LTS hỗ trợ dài hạn của Microsoft), Entity Framework Core 8 làm ORM thao tác cơ sở dữ liệu, SignalR Core xử lý truyền thông thời gian thực hai chiều."),
        bullet("Frontend Framework: Thư viện ReactJS 18, trình đóng gói siêu tốc Vite, ngôn ngữ TypeScript kiểm soát kiểu dữ liệu tĩnh an toàn, thư viện xác thực schema Zod, và hệ thống thiết kế giao diện Tailwind CSS."),
        bullet("Cơ sở dữ liệu & Dịch vụ phụ trợ: Hệ quản trị cơ sở dữ liệu quan hệ MySQL 8.0, Redis In-memory Data Store phục vụ Caching và Distributed Lock, MinIO Object Storage lưu trữ tài liệu chứng từ và ảnh nghiệm thu tương thích chuẩn Amazon S3, Hangfire quản lý và giám sát tác vụ nền."),
        bullet("Môi trường triển khai: Docker Engine và Docker Compose đóng gói toàn bộ hệ sinh thái dịch vụ vào các container độc lập, bảo đảm tính nhất quán trên mọi môi trường."),
        p("Chi tiết về nền tảng Backend (.NET Core 8 & C# 12):"),
        p(".NET Core 8 là nền tảng điện toán đám mây hiện đại của Microsoft, cung cấp môi trường thực thi mã nguồn mở (CoreCLR) với trình biên dịch tức thời RyuJIT được tối ưu hóa sâu sắc. Với sự hỗ trợ của các cấu trúc dữ liệu không cấp phát bộ nhớ như Span<T> và Memory<T>, nền tảng này cho phép xử lý hàng chục nghìn yêu cầu mỗi giây với độ trễ cực thấp. Mô hình lập trình bất đồng bộ Task-based Asynchronous Pattern (TAP) với từ khóa async/await cho phép giải phóng các luồng thực thi (Thread Pool Threads) trong thời gian chờ I/O từ cơ sở dữ liệu hoặc Redis, từ đó tối ưu hóa tối đa khả năng phục vụ đồng thời."),
        p("Chi tiết về cơ chế truyền thông thời gian thực SignalR Core:"),
        p("SignalR Core là công nghệ truyền thông hai chiều thời gian thực cao cấp của Microsoft. SignalR trừu tượng hóa các giao thức truyền dẫn phức tạp bên dưới (WebSocket, Server-Sent Events, Long Polling) và tự động đàm phán (Negotiate) kênh truyền tối ưu nhất. Khi ứng dụng khởi chạy, SignalR Hub duy trì một danh bạ kết nối (Connection Manager) ánh xạ giữa UserId của kỹ thuật viên và ConnectionId của phiên làm việc. Khi sự cố phát sinh, máy chủ chỉ mất 15 đến 30 mili-giây để đẩy gói tin nhị phân xuống đúng thiết bị của kỹ thuật viên."),
        p("Chi tiết về nền tảng Frontend (ReactJS 18 & Vite):"),
        p("ReactJS 18 giới thiệu kiến trúc điều phối mới (Concurrent React) với cơ chế phân chia thời gian thực thi (Time Slicing), cho phép giao diện người dùng luôn phản hồi mượt mà ngay cả khi đang render các danh sách thiết bị phức tạp hoặc biểu đồ KPI nặng. Kết hợp với Vite – công cụ build thế hệ mới chạy trên nền tảng esbuild viết bằng ngôn ngữ Go – tốc độ khởi động máy chủ phát triển cục bộ và tính năng cập nhật mã nguồn nóng (Hot Module Replacement - HMR) đạt mức tính bằng mili-giây, giúp gia tăng năng suất phát triển của nhóm lập trình viên."),
        p("Chi tiết về hệ thống xử lý tác vụ nền Hangfire:"),
        p("Hangfire là giải pháp quản lý background jobs hàng đầu cho hệ sinh thái .NET. Khác với các tiến trình chạy ngầm trong bộ nhớ RAM dễ bị mất dữ liệu khi máy chủ khởi động lại, Hangfire lưu trữ toàn bộ trạng thái tác vụ một cách bền vững (Persistent Storage) trong cơ sở dữ liệu quan hệ. Hangfire cung cấp sẵn giao diện quản trị trực quan (Hangfire Dashboard) cho phép theo dõi số lượng job thành công, job thất bại, thời gian thực thi trung bình và kích hoạt chạy lại thủ công chỉ với một cú click chuột."),

        createSubSubHeading("2.3.2. Các đặc điểm chính của công nghệ"),
        createTableCaption("Bảng 2.1", "Bảng so sánh đặc điểm nổi bật và ưu điểm của các công nghệ chính"),
        createCustomTable(
          ["Công nghệ", "Đặc điểm nổi bật", "Ưu điểm cốt lõi trong hệ thống"],
          [
            [".NET Core 8", "Framework mã nguồn mở, đa nền tảng, kiến trúc phi kết nối, hiệu năng hàng đầu thế giới.", "Hỗ trợ lập trình hướng đối tượng mạnh mẽ, bảo mật cấp doanh nghiệp, Dependency Injection tích hợp sẵn."],
            ["ReactJS & Vite", "Mô hình Component-based, Virtual DOM, trình đóng gói Vite chạy trên esbuild.", "Tốc độ tải trang tính bằng mili-giây, giao diện SPA mượt mà, dễ dàng tái sử dụng các thành phần giao diện."],
            ["Hangfire", "Thư viện quản lý Background Jobs mã nguồn mở cho .NET có sẵn Dashboard trực quan.", "Hỗ trợ lập lịch tác vụ Cron, tự động thử lại (Retry) khi có lỗi, lưu trữ trạng thái tác vụ bền vững trong CSDL."],
            ["Redis", "In-memory Data Structure Store lưu trữ dữ liệu dạng Key-Value trực tiếp trên RAM.", "Tốc độ đọc/ghi dữ liệu siêu nhanh (< 1ms), giải quyết triệt để bài toán Caching và thu hồi phiên làm việc tức thời."],
            ["MinIO", "Hệ thống lưu trữ đối tượng (Object Storage) mã nguồn mở tương thích 100% chuẩn Amazon S3 API.", "Lưu trữ tệp tin ảnh chứng từ độc lập với Application Server, dễ dàng mở rộng dung lượng lưu trữ không giới hạn."],
            ["SignalR", "Thư viện truyền thông thời gian thực hai chiều, tự động đàm phán WebSocket.", "Đẩy thông báo đơn hàng khẩn cấp và cập nhật tọa độ GPS thợ lên bản đồ số ngay tức thì."]
          ],
          [20, 40, 40]
        ),
        p("Phân tích kỹ thuật chuyên sâu về các công nghệ phụ trợ:"),
        bullet("1. Redis In-Memory Data Store: Vận hành theo mô hình đơn luồng dựa trên cơ chế non-blocking I/O multiplexing (epoll). Nhờ dữ liệu nằm hoàn toàn trên RAM, các thao tác đọc ghi với độ phức tạp O(1) giúp hệ thống truy xuất vị trí GPS của hàng trăm thợ và kiểm tra Session Blacklist chỉ trong vòng dưới 1 mili-giây. Ngoài ra, tính năng Expiring Keys (TTL) của Redis được áp dụng hoàn hảo để quản lý vòng đời tạm khóa 60 giây của đơn hàng.", "Redis Caching & Lock:"),
        bullet("2. MinIO Object Storage: Cung cấp kiến trúc lưu trữ phân tán bền vững với thuật toán Erasure Coding (chia nhỏ tệp tin thành các khối dữ liệu và khối chẵn lẻ Reed-Solomon). Giải pháp này cho phép hệ thống lưu trữ hàng triệu ảnh nghiệm thu hiện trường và biên bản kiểm định mà không sợ mất mát dữ liệu ngay cả khi có ổ cứng vật lý bị hỏng.", "MinIO Cloud Storage:"),
        bullet("3. MySQL 8.0 & InnoDB Storage Engine: Đảm bảo trọn vẹn các thuộc tính ACID (Atomicity, Consistency, Isolation, Durability) cho các giao dịch tài chính, xuất nhập kho linh kiện và nghiệm thu đơn hàng. Cơ chế khóa mức bản ghi (Row-level Locking) và chỉ mục B+Tree tối ưu hóa tối đa các truy vấn phức tạp của hệ thống.", "MySQL Database:"),

        createSubSubHeading("2.3.3. Vai trò của công nghệ sử dụng trong đồ án"),
        p("Mỗi công nghệ được lựa chọn đều đảm nhận một vai trò sống còn trong kiến trúc tổng thể:"),
        bullet("Vai trò của SignalR: Đóng vai trò là cầu nối thời gian thực giữa máy chủ và thiết bị người dùng. Khi khách hàng phát sinh đơn hàng, SignalR lập tức đẩy sự kiện có chuông báo đến máy kỹ thuật viên; khi kỹ thuật viên di chuyển, tọa độ GPS được gửi liên tục qua SignalR để vẽ Marker di động trên màn hình Admin."),
        bullet("Vai trò của MinIO: Chịu trách nhiệm lưu trữ an toàn và tập trung toàn bộ các file chứng từ, hợp đồng bảo trì, biên bản nghiệm thu và ảnh chụp hiện trường thiết bị, tách biệt hoàn toàn dữ liệu tệp tin ra khỏi máy chủ ứng dụng."),
        bullet("Vai trò của Hangfire: Chạy ngầm 24/7 để quản lý các tác vụ định kỳ. Đúng 00:00 mỗi đêm, Hangfire tự động quét cơ sở dữ liệu để tìm ra các thiết bị PCCC sắp đến hạn bảo trì trong vòng 15-30 ngày tới và tự động tạo các phiếu yêu cầu bảo dưỡng dự kiến."),
        bullet("Vai trò của Redis: Lưu trữ tạm thời danh sách thợ đang Online kèm tọa độ mới nhất; quản lý Token thu hồi (Session Invalidation) khi người dùng đổi mật khẩu hoặc đăng xuất; và thực hiện khóa phân tán (Distributed Lock) chống việc 2 thợ cùng bấm nhận 1 đơn."),

        createSubSubHeading("2.3.4. Lý do sử dụng công nghệ"),
        p("Sự kết hợp hoàn hảo giữa .NET Core 8 ở Backend và ReactJS ở Frontend mang lại sự cân bằng lý tưởng: Backend vô cùng ổn định, an toàn, xử lý logic tính toán đa luồng phức tạp; Frontend mang lại trải nghiệm tương tác trực quan, mượt mà và hiện đại cho người dùng."),
        p("So sánh các phương án công nghệ thay thế:"),
        bullet("Tại sao chọn .NET 8 thay vì Node.js (ExpressJS)? Mặc dù Node.js rất phổ biến và dễ viết, nhưng mô hình Single-threaded Event Loop của Node.js dễ bị nghẽn (Block) khi phải tính toán các thuật toán nặng như ma trận khoảng cách Haversine hoặc xử lý đồng thời số lượng lớn. .NET 8 sở hữu hệ sinh thái lập trình hướng đối tượng mạnh mẽ (C# 12), hệ thống kiểm soát kiểu chặt chẽ, hiệu năng I/O hàng đầu thế giới và tích hợp sẵn chuẩn Enterprise Dependency Injection.", "Lựa chọn Backend:"),
        bullet("Tại sao chọn ReactJS thay vì Vue hoặc Angular? ReactJS sở hữu hệ sinh thái thư viện khổng lồ, tài liệu dồi dào và cộng đồng hỗ trợ lớn nhất thế giới. Mô hình Component-based kết hợp với Virtual DOM và TypeScript giúp nhóm phát triển dễ dàng tái sử dụng các thành phần giao diện phức tạp (như Modal đếm ngược, Bảng dữ liệu phân trang, Bản đồ tương tác).", "Lựa chọn Frontend:"),
        bullet("Tại sao chọn MinIO thay vì lưu tệp tin trực tiếp trên ổ cứng Web Server? Việc lưu ảnh trực tiếp trên ổ cứng của Web Server dẫn đến tình trạng máy chủ bị phình to dung lượng, không thể mở rộng theo chiều ngang (Scale-out) khi triển khai nhiều container. MinIO cung cấp chuẩn API tương thích hoàn toàn với Amazon S3, giúp tách biệt dữ liệu phi cấu trúc và sẵn sàng di chuyển lên các hạ tầng đám mây công cộng (AWS, Google Cloud) mà không cần sửa đổi mã nguồn.", "Lựa chọn Lưu trữ tệp:"),
        p("Bên cạnh đó, việc áp dụng Docker và Docker Compose giải quyết triệt để vấn nạn muôn thuở trong công nghệ phần mềm: 'Chạy được trên máy của tôi nhưng lỗi trên máy chủ'. Mọi dịch vụ (API, Web, Database, Redis, MinIO) được định nghĩa trong file docker-compose.yml, cho phép thiết lập và khởi chạy toàn bộ hệ thống trên bất kỳ máy chủ nào chỉ với một câu lệnh duy nhất.")`;

// Replace 2.3 in content
const old23Regex = /createSubHeading\("2\.3\. Công nghệ sử dụng"\)[\s\S]*?createHeaderTitle\("Chương 3\. HỆ THỐNG FIREGUARD AI"\)/;
content = content.replace(old23Regex, expanded23 + ',\n\n        // =============================================================================\n        // CHƯƠNG 3. HỆ THỐNG FIREGUARD AI (ĐÚNG OUTLINE: 3.1 -> 3.7)\n        // =============================================================================\n        createHeaderTitle("Chương 3. HỆ THỐNG FIREGUARD AI")');

// Let's enhance Chương 3.2 (Clean Architecture deep dive)
const expanded32 = `        createSubHeading("3.2. Kiến trúc hệ thống"),
        createSubSubHeading("3.2.1. Kiến trúc tổng thể hệ thống"),
        p("Hệ thống FireGuard AI được thiết kế theo mô hình kiến trúc Client - Server hiện đại ở mức tổng thể, và tuân thủ chặt chẽ nguyên lý Clean Architecture (Kiến trúc Sạch) của Robert C. Martin ở phía Backend:"),
        ...createImagePlaceholder("Hình 3.1", "Sơ đồ kiến trúc tổng thể hệ thống (Clean Architecture & Client-Server)", "Dán sơ đồ kiến trúc hệ thống thể hiện Client Web/Mobile, API Controllers, Application Services, Infrastructure, Database, Redis, Hangfire, MinIO vào đây"),
        p("Nguyên lý cốt lõi của Clean Architecture trong FireGuard AI:"),
        p("Toàn bộ kiến trúc được chia thành các vòng tròn đồng tâm với Nguyên tắc Phụ thuộc (The Dependency Rule) bất di bất dịch: Các phụ thuộc mã nguồn chỉ được phép trỏ vào phía trong, tầng bên trong hoàn toàn không biết gì về các tầng bên ngoài."),
        bullet("1. Tầng Domain (Trung tâm hệ thống): Chứa các Thực thể nghiệp vụ cốt lõi (Entities) như User, ServiceRequest, Equipment, Value Objects và các Domain Events. Tầng này độc lập 100% với mọi công nghệ, không phụ thuộc vào bất kỳ thư viện bên thứ ba nào kể cả Entity Framework hay ASP.NET Core.", "Domain Layer:"),
        bullet("2. Tầng Application (Quy tắc ứng dụng): Chứa các Use Case, Interfaces dịch vụ (IDispatchService, ICurrentUserService), các DTOs (Data Transfer Objects), MediatR Commands/Queries, và các quy tắc kiểm tra tính hợp lệ dữ liệu (FluentValidation). Tầng này định nghĩa hành vi của hệ thống nhưng không trực tiếp thao tác với cơ sở dữ liệu vật lý.", "Application Layer:"),
        bullet("3. Tầng Infrastructure (Hạ tầng kỹ thuật): Hiện thực hóa các interface được định nghĩa bởi Application. Chứa mã nguồn kết nối cơ sở dữ liệu qua EF Core DbContext, các cấu hình Fluent API bảng dữ liệu, dịch vụ lưu trữ MinIO S3, bộ nhớ đệm Redis, các tác vụ nền Hangfire, và dịch vụ gửi Email thông báo.", "Infrastructure Layer:"),
        bullet("4. Tầng Presentation (Giao diện hiển thị & API): Điểm đón nhận các yêu cầu từ bên ngoài, bao gồm các ASP.NET Core API Controllers, SignalR Hubs truyền thông thời gian thực, Swagger UI và các Middleware xử lý xác thực danh tính JWT, phân quyền RBAC và bắt lỗi toàn cục (Global Exception Handler).", "Presentation Layer:"),

        createSubSubHeading("3.2.2. Các thành phần của kiến trúc"),
        p("Chi tiết tổ chức các thư mục và trách nhiệm cụ thể trong giải pháp (Solution Structure):"),
        bullet("FireGuard.Domain: Chứa các thư mục Common (BaseEntity, IAuditableEntity), Entities (User.cs, ServiceRequest.cs, Equipment.cs, InventoryItem.cs), Enums (UserRole, RequestStatus, RequestPriority), và Exceptions (DomainException)."),
        bullet("FireGuard.Application: Chứa các thư mục Common/Interfaces (IApplicationDbContext, IDispatchService, IFileStorageService), Features (thư mục con chứa Commands, Queries, Handlers theo chuẩn CQRS cho từng phân hệ nghiệp vụ), DTOs và Mappings (AutoMapper Profiles)."),
        bullet("FireGuard.Infrastructure: Chứa Data/Configurations (EF Core EntityConfigurations), Services (DispatchService.cs, MinioStorageService.cs, RedisCacheService.cs), và BackgroundJobs (EquipmentMaintenanceScannerJob.cs)."),
        bullet("FireGuard.Api: Chứa Controllers (AuthController.cs, ServiceRequestsController.cs, EquipmentsController.cs), Hubs (NotificationHub.cs, LocationHub.cs), Middlewares (ExceptionMiddleware.cs, JwtRevocationMiddleware.cs), và tệp cấu hình khởi động Program.cs."),
        p("Các mẫu thiết kế (Design Patterns) tiêu biểu được áp dụng:"),
        bullet("Repository & Unit of Work Pattern: Trừu tượng hóa tầng truy xuất dữ liệu, giúp dễ dàng viết các bài Unit Test với dữ liệu giả lập (Mocking) mà không cần kết nối cơ sở dữ liệu thật.", "Mẫu Repository:"),
        bullet("Mediator Pattern (thư viện MediatR): Tách rời hoàn toàn Controller khỏi Business Logic, giúp Controller trở nên 'mỏng' và trong sáng, mỗi Request Handler đảm nhận duy nhất một trách nhiệm đơn lẻ (Single Responsibility Principle).", "Mẫu Mediator:"),
        bullet("Strategy Pattern: Đóng gói thuật toán tính điểm AI Scoring thành các chiến lược tính điểm linh hoạt, cho phép thay đổi công thức tính mà không ảnh hưởng đến luồng điều phối chính.", "Mẫu Strategy:"),
        bullet("Observer Pattern (SignalR): Cho phép máy chủ tự động thông báo cho các bên liên quan (Kỹ thuật viên, Khách hàng, Quản trị viên) ngay khi trạng thái của đơn hàng có sự thay đổi.", "Mẫu Observer:"),

        createSubSubHeading("3.2.3. Luồng xử lý tổng quát của hệ thống"),
        p("Một chu trình nghiệp vụ điều phối và xử lý sự cố điển hình diễn ra qua 5 bước liên hoàn:")`;

// Replace 3.2 in content
const old32Regex = /createSubHeading\("3\.2\. Kiến trúc hệ thống"\)[\s\S]*?createSubSubHeading\("3\.2\.3\. Luồng xử lý tổng quát của hệ thống"\)[\s\S]*?p\("Một chu trình nghiệp vụ điều phối và xử lý sự cố điển hình diễn ra qua 5 bước liên hoàn:"\)/;
content = content.replace(old32Regex, expanded32);

// Enhance Phụ lục with more code
const expandedPhuLuc = `        createHeaderTitle("PHỤ LỤC"),
        createSubHeading("1. Hướng dẫn khởi chạy hệ thống bằng Docker Compose"),
        p("Toàn bộ hệ thống FireGuard AI được đóng gói hoàn chỉnh trong tệp \`docker-compose.yml\`. Để triển khai ứng dụng trên máy chủ hoặc môi trường phát triển cục bộ:"),
        bullet("Bước 1: Cài đặt Docker Engine (phiên bản 24.0+) và Docker Compose trên máy chủ Linux / Windows."),
        bullet("Bước 2: Mở terminal tại thư mục gốc của dự án \`d:\\\\FIREGUARD-AI\`."),
        bullet("Bước 3: Chạy câu lệnh biên dịch và khởi động toàn bộ cụm container: \`docker-compose up -d --build\`."),
        bullet("Bước 4: Kiểm tra trạng thái hoạt động của 6 container bằng câu lệnh: \`docker-compose ps\`."),
        bullet("Bước 5: Truy cập giao diện ứng dụng Frontend tại địa chỉ: \`http://localhost:5173\` và giao diện Backend Swagger API tại: \`http://localhost:5000/swagger\`."),
        new Paragraph({ spacing: { before: 140, after: 100 }, children: [] }),

        createSubHeading("2. Trích đoạn mã nguồn thuật toán AI Dispatching (C# Backend)"),
        p("Dưới đây là trích đoạn mã nguồn phương thức điều phối và tính điểm thợ trong \`DispatchService.cs\`:"),
        p("public class DispatchService : IDispatchService\\n{\\n    private readonly IApplicationDbContext _context;\\n    private readonly IHubContext<NotificationHub> _hubContext;\\n    private readonly IDistributedCache _cache;\\n\\n    public async Task<TechnicianDto> FindAndDispatchBestTechnicianAsync(Guid serviceRequestId)\\n    {\\n        var request = await _context.ServiceRequests.FindAsync(serviceRequestId);\\n        if (request == null) throw new NotFoundException(\\\"Không tìm thấy yêu cầu dịch vụ\\\");\\n\\n        // 1. Lọc danh sách kỹ thuật viên đang trực tuyến và rảnh việc\\n        var availableTechs = await _context.Users\\n            .Where(u => u.Role == UserRole.Technician && u.IsOnline && u.IsActive)\\n            .ToListAsync();\\n\\n        if (!availableTechs.Any()) return null;\\n\\n        // 2. Chấm điểm đa tiêu chí (AI Scoring WSM Model)\\n        var scoredTechs = availableTechs.Select(tech => new {\\n            Technician = tech,\\n            Score = CalculateScore(tech, request)\\n        })\\n        .OrderByDescending(x => x.Score)\\n        .ToList();\\n\\n        var bestTech = scoredTechs.First().Technician;\\n\\n        // 3. Khóa đơn hàng tạm thời và gửi Pop-up đếm ngược 60 giây qua SignalR\\n        await LockAndNotifyTechnicianAsync(bestTech.Id, request.Id, 60);\\n\\n        return _mapper.Map<TechnicianDto>(bestTech);\\n    }\\n\\n    private double CalculateScore(User tech, ServiceRequest req)\\n    {\\n        double dist = HaversineDistance(tech.CurrentLatitude ?? 0, tech.CurrentLongitude ?? 0, req.DestinationLat, req.DestinationLng);\\n        double cGps = Math.Max(1.0, 10.0 - (dist / 2.0));\\n        double cRating = (tech.RatingAverage ?? 4.0) * 2.0;\\n        double cAccept = (tech.AcceptanceRate ?? 0.8) * 10.0;\\n        double cSkill = tech.HasCertifiedSkill(req.EquipmentType) ? 10.0 : 5.0;\\n\\n        return (0.35 * cGps) + (0.25 * cRating) + (0.20 * cAccept) + (0.20 * cSkill);\\n    }\\n\\n    private double HaversineDistance(double lat1, double lon1, double lat2, double lon2)\\n    {\\n        double r = 6371.0;\\n        double dLat = (lat2 - lat1) * Math.PI / 180.0;\\n        double dLon = (lon2 - lon1) * Math.PI / 180.0;\\n        double a = Math.Sin(dLat/2) * Math.Sin(dLat/2) +\\n                   Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *\\n                   Math.Sin(dLon/2) * Math.Sin(dLon/2);\\n        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1-a));\\n        return r * c;\\n    }\\n}", { bold: true, italics: true, alignment: AlignmentType.LEFT }),
        new Paragraph({ spacing: { before: 140, after: 100 }, children: [] }),

        createSubHeading("3. Trích đoạn mã nguồn tác vụ nền Hangfire quét kiểm tra thiết bị PCCC (C#)"),
        p("Dưới đây là trích đoạn mã nguồn tác vụ nền quét hạn bảo dưỡng hàng đêm trong \`EquipmentMaintenanceJob.cs\`:"),
        p("public class EquipmentMaintenanceJob\\n{\\n    private readonly IApplicationDbContext _context;\\n    private readonly ILogger<EquipmentMaintenanceJob> _logger;\\n\\n    [AutomaticRetry(Attempts = 3)]\\n    public async Task ScanExpiringEquipmentsAsync()\\n    {\\n        _logger.LogInformation(\\\"Bắt đầu quét danh mục thiết bị PCCC sắp hết hạn kiểm định...\\\");\\n        var thresholdDate = DateTime.UtcNow.AddDays(30);\\n\\n        var expiringItems = await _context.Equipments\\n            .Where(e => e.NextMaintenanceDate <= thresholdDate && e.Status != EquipmentStatus.Warning_Expiring)\\n            .ToListAsync();\\n\\n        foreach (var eq in expiringItems)\\n        {\\n            eq.Status = EquipmentStatus.Warning_Expiring;\\n            _context.MaintenanceReminders.Add(new MaintenanceReminder\\n            {\\n                Id = Guid.NewGuid(),\\n                EquipmentId = eq.Id,\\n                DueDate = eq.NextMaintenanceDate,\\n                Status = ReminderStatus.Pending\\n            });\\n        }\\n        await _context.SaveChangesAsync();\\n        _logger.LogInformation($\\\"Đã phát hiện và tạo phiếu nhắc cho {expiringItems.Count} thiết bị PCCC.\\\");\\n    }\\n}", { bold: true, italics: true, alignment: AlignmentType.LEFT }),
        new Paragraph({ spacing: { before: 140, after: 100 }, children: [] }),

        createSubHeading("4. Trích đoạn cấu hình Docker Compose (\`docker-compose.yml\`)"),
        p("version: '3.8'\\nservices:\\n  fireguard-api:\\n    build:\\n      context: ./backend\\n      dockerfile: Dockerfile\\n    ports:\\n      - \\\"5000:8080\\\"\\n    environment:\\n      - ConnectionStrings__DefaultConnection=Server=fireguard-db;Database=fireguard;User=root;Password=root;\\n      - Redis__ConnectionString=fireguard-redis:6379\\n    depends_on:\\n      - fireguard-db\\n      - fireguard-redis\\n\\n  fireguard-web:\\n    build:\\n      context: ./frontend\\n      dockerfile: Dockerfile\\n    ports:\\n      - \\\"5173:80\\\"\\n    depends_on:\\n      - fireguard-api\\n\\n  fireguard-db:\\n    image: mysql:8.0\\n    environment:\\n      MYSQL_ROOT_PASSWORD: root\\n      MYSQL_DATABASE: fireguard\\n    volumes:\\n      - mysql_data:/var/lib/mysql\\n\\n  fireguard-redis:\\n    image: redis:7-alpine\\n    ports:\\n      - \\\"6379:6379\\\"\\n\\n  fireguard-minio:\\n    image: minio/minio\\n    command: server /data --console-address \\\":9001\\\"\\n    ports:\\n      - \\\"9000:9000\\\"\\n      - \\\"9001:9001\\\"\\n\\nvolumes:\\n  mysql_data:", { bold: true, italics: true, alignment: AlignmentType.LEFT })`;

// Replace Phụ lục in content
const oldPhuLucRegex = /createHeaderTitle\("PHỤ LỤC"\)[\s\S]*?mysql_data:", \{ bold: true, italics: true, alignment: AlignmentType\.LEFT \}\)/;
content = content.replace(oldPhuLucRegex, expandedPhuLuc);

// Write back to generate_report_theo_dung_muc_luc.js
fs.writeFileSync(targetScriptPath, content);
console.log("Successfully expanded generate_report_theo_dung_muc_luc.js!");
