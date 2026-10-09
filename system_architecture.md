# FireGuard AI - Thiết Kế Kiến Trúc Hệ Thống (System Architecture)

> [!NOTE]
> Tài liệu này mô tả chi tiết kiến trúc tổng thể, thiết kế hệ thống, cấu trúc các thành phần phần mềm và các luồng dữ liệu kỹ thuật của hệ thống **FireGuard AI**.

---

## 1. Sơ Đồ Kiến Trúc Tổng Thể (Overall Architecture Diagram)

Hệ thống được thiết kế theo mô hình **Microservices lai (Hybrid Distributed)**, trong đó ứng dụng Core ERP chạy trên nền tảng **ASP.NET Core 8 Web API** áp dụng **Clean Architecture**, giao tiếp bất đồng bộ với **Python FastAPI AI Service** thông qua REST API hoặc gRPC, và đồng bộ trạng thái realtime cho clients qua **SignalR**.

```mermaid
graph TD
    subgraph Clients["Lớp Trình Diễn (Client Apps)"]
        React["React Web Portal (Vite + TS)"]
        Mobile["Mobile Web App / PWA (MUI)"]
    end

    subgraph API_Gateway["Lớp Định Tuyến & Bảo Mật"]
        ReverseProxy["Nginx / Gateway (SSL termination)"]
    end

    subgraph Core_Services["Lớp Dịch Vụ Core (ASP.NET Core 8)"]
        API["FireGuardAI.API (Controllers, Middlewares)"]
        App["FireGuardAI.Application (CQRS, MediatR, FluentValidation)"]
        Infra["FireGuardAI.Infrastructure (EF Core, Repositories, Identity)"]
        Domain["FireGuardAI.Domain (Entities, Value Objects)"]
        HangfireService["Hangfire Engine (Background Jobs)"]
    end

    subgraph AI_Services["Lớp AI Dịch Vụ (Python FastAPI)"]
        FastAPI["FastAPI App"]
        LLMEngine["RAG & LLM (OpenAI/Gemini)"]
        CVEngine["Computer Vision (YOLO/OCR)"]
        OptEngine["Optimization Engine (Routing)"]
    end

    subgraph Storage_Cache["Lớp Lưu Trữ & Cache"]
        MySQL[("MySQL 8 Database")]
        Redis[("Redis Cache & SignalR Backplane")]
        MinIO[("MinIO Object Storage")]
    end

    %% Giao tiếp giữa các lớp
    React & Mobile <-->|HTTPS / WSS| ReverseProxy
    ReverseProxy <--> API
    
    %% Clean Architecture internal references
    API --> App
    App --> Domain
    Infra --> App
    Infra --> Domain
    API --> Infra
    
    %% Core Services connections
    Infra <-->|EF Core / ADO.NET| MySQL
    Infra <-->|StackExchange.Redis| Redis
    Infra <-->|Minio SDK| MinIO
    HangfireService <-->|MySqlStorage| MySQL
    
    %% Core & AI Service connections
    App <-->|REST API / gRPC| FastAPI
    FastAPI <--> LLMEngine & CVEngine & OptEngine
    
    %% Realtime
    API <-->|SignalR Hubs| React & Mobile
```

---

## 2. Cấu Trúc Solution Backend (ASP.NET Core 8 Clean Architecture)

Solution được tổ chức thành 4 projects chính tương ứng với 4 lớp của Clean Architecture:

```
FireGuardAI.sln
├── src
│   ├── FireGuardAI.Domain
│   │   ├── Common (BaseEntity, IAuditableEntity, ISoftDelete)
│   │   ├── Entities (User, Role, Permission, Customer, Supplier, Device, DeviceSerial, Project, Task, AuditLog...)
│   │   ├── Exceptions (DomainExceptions)
│   │   └── ValueObjects (GPSLocation, Money)
│   │
│   ├── FireGuardAI.Application
│   │   ├── Common (Interfaces, Behaviors, Exceptions, Models)
│   │   │   ├── Interfaces (IDbContext, ICacheService, IStorageService, IAIService, ICurrentUserService)
│   │   │   └── Behaviours (ValidationBehaviour, LoggingBehaviour, PerformanceBehaviour)
│   │   ├── DTOs (Auth, User, Device, Project, WorkOrder...)
│   │   ├── Features (CQRS Handlers using MediatR)
│   │   │   ├── Authentication (Commands, Queries)
│   │   │   ├── Devices (Commands, Queries, Validators)
│   │   │   └── Projects (Commands, Queries, Validators)
│   │   └── Mappings (AutoMapper Profiles)
│   │
│   ├── FireGuardAI.Infrastructure
│   │   ├── Persistence (ApplicationDbContext, Configurations, Migrations, Seeders)
│   │   ├── Repositories (GenericRepository, UnitOfWork, SpecificRepositories)
│   │   ├── Identity (IdentityService, TokenService)
│   │   ├── Services (RedisCacheService, MinioStorageService, FastAPIClientService)
│   │   └── BackgroundJobs (HangfireJobsManager)
│   │
│   └── FireGuardAI.API
│       ├── Controllers (BaseApiController, AuthController, DeviceController, ProjectController...)
│       ├── Middlewares (GlobalExceptionMiddleware, PerformanceMiddleware, AuditMiddleware)
│       ├── Hubs (NotificationHub, LiveTrackingHub)
│       ├── Extensions (ServiceCollectionExtensions)
│       ├── Program.cs
│       └── appsettings.json
```

---

## 3. Cấu Trúc Thư Mục Frontend (Vite + React + TypeScript)

Sử dụng cấu trúc thư mục dạng **Feature-based** giúp quản lý dễ dàng khi ứng dụng phình to:

```
frontend/
├── public/
├── src/
│   ├── assets/             # Hình ảnh, logo, fonts
│   ├── components/         # Các Component dùng chung toàn app (Buttons, Inputs, Table, Modal)
│   ├── config/             # Cấu hình hệ thống (Axios client, Route definitions)
│   ├── context/            # ThemeContext, UIContext
│   ├── features/           # Các Module nghiệp vụ chính
│   │   ├── auth/           # Login, Register, Profile components & Redux slice
│   │   ├── dashboard/      # Admin/Sales/Tech dashboards
│   │   ├── inventory/      # Quản lý kho, quét mã QR
│   │   ├── projects/       # Quản lý công trình, tiến độ lắp đặt
│   │   └── service-tickets/# Quản lý yêu cầu bảo trì, sửa chữa
│   ├── hooks/              # Custom hooks (useAuth, useSignalR, useGPS)
│   ├── layouts/            # Layouts (AdminLayout, CustomerLayout, AuthLayout)
│   ├── routes/             # Định tuyến (ProtectedRoutes, PublicRoutes)
│   ├── store/              # Cấu hình Redux Toolkit (store, rootReducer)
│   ├── services/           # React Query API integrations (queries, mutations)
│   ├── styles/             # Global CSS, Tailwind/MUI theme configuration
│   ├── utils/              # Helper functions (date formatters, token validators, GPS calculators)
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── tsconfig.json
├── package.json
└── vite.config.ts
```

---

## 4. Cấu Trúc AI Service (Python FastAPI)

```
ai-service/
├── app/
│   ├── core/               # Cấu hình hệ thống (config, security, logger)
│   ├── api/                # Các Router API endpoints
│   │   ├── v1/
│   │   │   ├── chat.py     # API chatbot tư vấn PCCC
│   │   │   ├── vision.py   # API quét bản vẽ, chẩn đoán lỗi qua ảnh
│   │   │   ├── routing.py  # API tối ưu hóa tuyến đường & điều phối
│   │   │   └── kpi.py      # API phân tích KPI nhân sự
│   ├── services/           # Logic xử lý nghiệp vụ AI
│   │   ├── llm_service.py  # Gọi API OpenAI/Gemini + RAG
│   │   ├── cv_service.py   # Xử lý ảnh bằng OpenCV, YOLO
│   │   └── opt_service.py  # Giải bài toán VRP (Vehicle Routing Problem)
│   ├── models/             # Định nghĩa Pydantic Schemas cho API
│   ├── utils/              # Helper functions, RAG VectorDB helpers
│   ├── main.py
│   └── requirements.txt
├── models_weight/          # Lưu trữ trọng số model offline (nếu có)
├── Dockerfile
└── README.md
```

---

## 5. Các Luồng Dữ Liệu Và Quy Trình Kỹ Thuật (Data Workflows)

### 5.1. Luồng Xác Thực JWT & Refresh Token

Đảm bảo bảo mật bằng cách sử dụng **Access Token (lưu ở bộ nhớ tạm - Memory)** và **Refresh Token (được thiết lập HttpOnly Cookie chống tấn công XSS)**.

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (React App)
    participant API as ASP.NET Core API
    participant DB as MySQL Database
    participant Redis as Redis Cache

    Note over User, API: Luồng đăng nhập (Authentication)
    User->>API: Gửi Username/Password (POST /api/auth/login)
    API->>DB: Kiểm tra thông tin người dùng
    DB-->>API: Người dùng hợp lệ & Role/Permissions
    API->>API: Sinh Access Token (hạn 15p) & Refresh Token (hạn 7 ngày)
    API->>DB: Lưu Refresh Token hash kèm Expiry
    API->>API: Đặt Refresh Token vào HttpOnly Cookie
    API-->>User: Trả về Access Token & Thông tin User (JSON body)

    Note over User, API: Luồng làm mới Token (Refresh Token)
    User->>API: Gửi yêu cầu gia hạn (POST /api/auth/refresh) kèm HttpOnly Cookie
    API->>API: Giải mã Access Token hết hạn & lấy Refresh Token từ Cookie
    API->>DB: Kiểm tra Refresh Token trong DB (chưa hết hạn, chưa bị thu hồi)
    DB-->>API: Hợp lệ
    API->>API: Sinh cặp Access Token & Refresh Token mới
    API->>DB: Cập nhật Refresh Token mới vào DB (Revoke token cũ)
    API->>API: Đặt Refresh Token mới vào HttpOnly Cookie
    API-->>User: Trả về Access Token mới (JSON body)
```

### 5.2. Luồng Realtime SignalR

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Nhân viên Lắp đặt
    participant API as ASP.NET Core API
    participant Redis as Redis (SignalR Backplane)
    actor Lead as Đội trưởng (Dashboard)

    Lead->>API: Kết nối Websocket (WS /notification-hub?access_token=...)
    API->>Redis: Đăng ký Client Connection ID vào Group "Lead_Dự_Án_A"
    Staff->>API: POST /api/tasks/{id}/complete (Quét QR lắp đặt thành công)
    API->>API: Xử lý lưu DB thành công
    API->>Redis: Phát message `TaskUpdated` cho Group "Lead_Dự_Án_A"
    Redis-->>Lead: Push Message realtime qua Websocket
    Note over Lead: Dashboard tự động tăng % tiến độ không cần F5
```

### 5.3. Luồng Upload File (MinIO)

Để tránh tải nặng cho API Server, hệ thống áp dụng cơ chế **Presigned URL**:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client (React/Mobile)
    participant API as ASP.NET Core API
    participant MinIO as MinIO S3 Server

    Client->>API: Đăng ký upload file: `POST /api/media/presigned` (Tên file, kích thước)
    API->>API: Kiểm tra quyền hạn của User
    API->>MinIO: Yêu cầu sinh Presigned PUT URL (hạn dùng 10 phút)
    MinIO-->>API: Trả về Presigned URL
    API-->>Client: Trả về Presigned URL & Object Key
    Client->>MinIO: Trực tiếp PUT file data lên Presigned URL (Binary upload)
    MinIO-->>Client: HTTP 200 OK (Upload thành công)
    Client->>API: Xác nhận hoàn thành: `POST /api/media/confirm` (Object Key)
    API->>API: Lưu thông tin File Path vào Cơ sở dữ liệu MySQL
    API-->>Client: Trả về kết quả lưu trữ thành công
```

### 5.4. Luồng AI Điều Phối Kỹ Thuật Viên

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant API as ASP.NET Core API
    participant AI as FastAPI AI Service
    participant DB as MySQL Database
    actor Tech as Kỹ thuật viên (Mobile)

    Customer->>API: Gửi Yêu cầu Sửa chữa Khẩn cấp
    API->>DB: Lưu trạng thái yêu cầu `PendingAssignment`
    API->>AI: Gọi API điều phối: POST /api/v1/routing/dispatch
    Note over AI: Nhận tọa độ khách hàng, danh sách Kỹ thuật viên rảnh rỗi, kỹ năng & vị trí GPS hiện tại
    AI->>AI: Chạy thuật toán tối ưu hóa định tuyến (VRP Solver)
    AI-->>API: Đề xuất Kỹ thuật viên tối ưu nhất
    API->>DB: Gán Kỹ thuật viên cho Yêu cầu sửa chữa
    API->>Tech: Đẩy thông báo giao việc realtime qua SignalR
```

### 5.5. Luồng Background Job Nhắc Nhở Bảo Trì (Hangfire)

```mermaid
sequenceDiagram
    autonumber
    participant Job as Hangfire Background Job
    participant DB as MySQL Database
    participant AI as FastAPI AI Service
    participant Mail as Mail Service
    participant Push as SignalR Service

    Job->>DB: Chạy định kỳ (0:00 hàng ngày): Quét thiết bị sắp đến hạn bảo trì (< 15 ngày)
    DB-->>Job: Danh sách 200 thiết bị cần bảo trì
    Job->>AI: POST /api/v1/routing/schedule-maintenance (Gửi 200 thiết bị & danh sách kỹ thuật viên)
    AI->>AI: Nhóm thiết bị theo cụm vị trí, phân công lịch và lộ trình tối ưu cho tuần tới
    AI-->>Job: Bản kế hoạch phân công công việc
    Job->>DB: Lưu các bản ghi công việc bảo trì mới (`PendingAssignment`)
    Job->>Mail: Gửi Email cảnh báo kế hoạch bảo trì cho Khách hàng
    Job->>Push: Gửi thông báo đẩy lịch làm việc tuần mới cho Kỹ thuật viên
```

### 5.6. Luồng GPS Check-in & Check-out

```mermaid
sequenceDiagram
    autonumber
    actor Tech as Kỹ thuật viên (Mobile)
    participant Browser as GPS Geolocation Web API
    participant API as ASP.NET Core API
    participant DB as MySQL Database

    Tech->>Browser: Ấn nút "Check-in Công trình"
    Browser-->>Tech: Trả về tọa độ vĩ độ/kinh độ (Latitude/Longitude)
    Tech->>API: POST /api/tasks/checkin (TaskId, Latitude, Longitude)
    API->>DB: Truy vấn tọa độ định cấu hình của công trình đó
    API->>API: Tính khoảng cách (Haversine formula) giữa tọa độ check-in và công trình
    alt Khoảng cách <= 100 mét
        API->>DB: Lưu bản ghi Check-in (Thời gian UTC, Tọa độ thực tế, Hợp lệ = True)
        API-->>Tech: Trả về HTTP 200 OK (Check-in thành công)
    else Khoảng cách > 100 mét
        API->>DB: Lưu bản ghi Check-in lỗi (Hợp lệ = False, Nghi vấn giả mạo GPS)
        API-->>Tech: Trả về HTTP 400 Bad Request (Sai lệch vị trí cho phép)
    end
```

---

## 6. Chiến Lược Giám Sát, Bảo Mật Và Vận Hành (Ops & Security)

### 6.1. Chiến lược Logging (Serilog)
*   **Structured Logging**: Ghi log dưới định dạng cấu trúc JSON giúp dễ dàng truy vấn và phân tích.
*   **Sinks**:
    *   `Console`: Hiển thị log trực tiếp khi phát triển ở local.
    *   `File`: Ghi file log xoay vòng hàng ngày (Daily rolling file) lưu trong thư mục `Logs/` của container, tự động xóa log cũ hơn 30 ngày.
*   **Log Levels**:
    *   *Development*: `Debug` trở lên.
    *   *Production*: `Information` trở lên, chỉ ghi `Warning`/`Error` đối với các lỗi hệ thống để tiết kiệm dung lượng lưu trữ.
*   **Correlation ID**: Mỗi request sẽ được gán một `CorrelationId` duy nhất ở Middleware đầu tiên để theo vết luồng xử lý từ Client qua API tới FastAPI.

### 6.2. Chiến lược Audit Log
*   Tự động ghi lại các thao tác thay đổi dữ liệu (Create, Update, Delete) của các bảng danh mục quan trọng (Thiết bị, Kho, Hợp đồng, Công trình).
*   **Cơ chế**: Triển khai `SaveChangesAsync` tùy biến trong Entity Framework Core. Khi lưu dữ liệu, EF Core sẽ phát hiện các thực thể triển khai interface `IAuditableEntity`, so sánh dữ liệu cũ (Original Values) và dữ liệu mới (Current Values), tự động lưu kết quả vào bảng `AuditLogs`:
    *   `Id` (Khóa chính)
    *   `UserId` (Ai thực hiện thao tác)
    *   `TableName` (Tên bảng bị tác động)
    *   `Action` (INSERT, UPDATE, DELETE)
    *   `OldValues` (JSON chứa trạng thái cũ)
    *   `NewValues` (JSON chứa trạng thái mới)
    *   `Timestamp` (Thời gian thực hiện UTC)

### 6.3. Chiến lược Backup Database (MySQL)
*   **Automated Backups**: Thiết lập một Docker container phụ chạy công cụ `cron` kết hợp `mysqldump` để backup dữ liệu tự động.
*   **Tần suất**:
    *   *Daily Backup*: Chạy vào lúc 2:00 AM hàng ngày. Lưu giữ bản backup trong vòng 30 ngày.
    *   *Weekly/Monthly Backup*: Chạy vào chủ nhật hàng tuần và ngày đầu tháng. Lưu giữ trong vòng 1 năm.
*   **Lưu trữ**: File backup sau khi nén (`.sql.gz`) sẽ được tự động đồng bộ lên một bucket riêng tư trên **MinIO Storage** (được cấu hình chính sách bảo vệ chống xóa).

### 6.4. Biện Pháp Bảo Mật Hệ Thống (Security Hardening)
1.  **Chống tấn công XSS & CSRF**:
    *   Lưu trữ Refresh Token trong `HttpOnly`, `Secure` và `SameSite=Strict` Cookie.
    *   Cấu hình Content Security Policy (CSP) chặt chẽ trên Frontend.
2.  **CORS Policy**: Cấu hình API chỉ cho phép các Domain cụ thể của Frontend truy cập, cấm cấu hình dạng wild-card (`*`) ở môi trường Production.
3.  **Rate Limiting**: Triển khai Rate Limiting Middleware ở lớp API Gateway/Nginx và ASP.NET Core API (ví dụ: tối đa 60 requests/phút trên mỗi IP đối với API thông thường, và 5 requests/phút đối với API Auth/Login).
4.  **SQL Injection Prevention**: Bắt buộc sử dụng Entity Framework Core parameterized queries (LINQ) để tương tác DB, cấm tuyệt đối việc cộng chuỗi SQL sống.
5.  **Dữ liệu nhạy cảm**: Mã hóa mật khẩu người dùng bằng thuật toán băm mạnh `BCrypt` hoặc `PBKDF2` với muối ngẫu nhiên (Salt).
6.  **MinIO Security**: Không public toàn bộ bucket. Tất cả tệp tải lên (ngoại trừ ảnh đại diện người dùng hoặc ảnh thiết bị công cộng) đều nằm trong bucket private và chỉ truy cập được qua Presigned URL có thời gian hết hạn ngắn.

---

## 7. Các Sơ Đồ Thiết Kế & Đặc Tả Hệ Thống (UML & System Diagrams)

### 7.1. Sơ Đồ Phân Rã Chức Năng Nghiệp Vụ (BFD - Business Function Diagram)

Sơ đồ phân rã chức năng mô tả cấu trúc hình cây của các phân hệ nghiệp vụ trong FireGuard AI:

```mermaid
graph TD
    Root["HỆ THỐNG FIREGUARD AI"]

    %% Cấp 1
    F1["1. Quản Trị Hệ Thống"]
    F2["2. Bán Hàng & Báo Giá AI"]
    F3["3. Thi Công & Quản Lý Đội Trưởng"]
    F4["4. Sửa Chữa, Bảo Trì & Điều Phối"]
    F5["5. Quản Lý Kho & Thiết Bị QR"]
    F6["6. Phân Hệ Trí Tuệ Nhân Tạo (AI)"]

    Root --> F1
    Root --> F2
    Root --> F3
    Root --> F4
    Root --> F5
    Root --> F6

    %% Cấp 2 - Phân hệ 1
    F1 --> F11["1.1. Quản lý tài khoản & Phân quyền"]
    F1 --> F12["1.2. Nhật ký kiểm toán (Audit Logs)"]
    F1 --> F13["1.3. Cấu hình tham số hệ thống"]
    F1 --> F14["1.4. Báo cáo & Thống kê doanh thu"]

    %% Cấp 2 - Phân hệ 2
    F2 --> F21["2.1. Quản lý thông tin khách hàng (CRM)"]
    F2 --> F22["2.2. Tư vấn giải pháp PCCC tự động"]
    F2 --> F23["2.3. Lập dự toán & Báo giá sơ bộ AI"]
    F2 --> F24["2.4. Quản lý hợp đồng & Đơn hàng"]

    %% Cấp 2 - Phân hệ 3
    F3 --> F31["3.1. Quản lý danh sách công trình dự án"]
    F3 --> F32["3.2. Phân công tổ thợ nội bộ (Nhân công 1, 2, 3, 4)"]
    F3 --> F33["3.3. Báo cáo tiến độ ngày kèm ảnh chụp hiện trường"]
    F3 --> F34["3.4. Nghiệm thu bàn giao & Kích hoạt bảo hành"]

    %% Cấp 2 - Phân hệ 4
    F4 --> F41["4.1. Tiếp nhận sự cố & Đặt lịch dịch vụ"]
    F4 --> F42["4.2. Điều phối kỹ thuật viên tự động (AI Dispatch)"]
    F4 --> F43["4.3. Bản đồ số & Dẫn đường GPS"]
    F4 --> F44["4.4. Kiểm tra bán kính GPS <= 1km"]
    F4 --> F45["4.5. Chụp ảnh nghiệm thu hiện trường & Hoàn thành đơn"]

    %% Cấp 2 - Phân hệ 5
    F5 --> F51["5.1. Quản lý danh mục thiết bị PCCC"]
    F5 --> F52["5.2. Quản lý tồn kho theo từng kho"]
    F5 --> F53["5.3. Nhập / Xuất kho theo Serial"]
    F5 --> F54["5.4. Khởi tạo & Quét mã QR Code thiết bị"]

    %% Cấp 2 - Phân hệ 6
    F6 --> F61["6.1. Chatbot RAG tư vấn tiêu chuẩn TCVN PCCC"]
    F6 --> F62["6.2. Thuật toán tối ưu hóa điều phối theo GPS"]
    F6 --> F63["6.3. Thị giác máy tính nhận diện hư hỏng thiết bị"]
    F6 --> F64["6.4. Đánh giá xếp hạng KPI kỹ thuật viên"]
```

---

### 7.2. Sơ Đồ Use Case Tổng Thể (Use Case Diagram)

Sơ đồ thể hiện mối quan hệ giữa các tác nhân (Actors) và các ca sử dụng (Use Cases) trong hệ thống:

```mermaid
flowchart LR
    %% Actors
    Customer(["Khách Hàng"]):::actorStyle
    Sales(["Nhân Viên Sales"]):::actorStyle
    Leader(["Đội Trưởng Thi Công"]):::actorStyle
    Tech(["Kỹ Thuật Viên"]):::actorStyle
    Admin(["Quản Trị Viên (Admin)"]):::actorStyle
    AIEngine["Hệ Thống AI Core"]:::systemStyle

    subgraph FireGuardApp["HỆ THỐNG FIREGUARD AI"]
        %% Core Use cases
        UC_Auth("Đăng nhập & Xác thực JWT")
        UC_AIConsult("Tư vấn giải pháp PCCC qua AI")
        UC_AIQuote("Lập dự toán & Báo giá sơ bộ AI")
        UC_CreateRequest("Tạo yêu cầu sửa chữa / bảo trì")
        UC_CustomerConfirm("Xác nhận nghiệm thu dịch vụ")

        UC_ProjectList("Quản lý danh sách công trình")
        UC_AssignCrew("Phân công tổ thợ nội bộ (Nhân công 1, 2, 3, 4)")
        UC_ReportProgress("Cập nhật tiến độ kèm ảnh hiện trường")
        UC_HandoverProject("Nghiệm thu bàn giao dự án")

        UC_AcceptJob("Tiếp nhận đơn hàng trên Job Board")
        UC_MapNav("Xem vị trí khách & Điều hướng bản đồ")
        UC_CheckGPS("Đối soát định vị GPS bán kính 1km")
        UC_TechComplete("Chụp ảnh nghiệm thu & Hoàn thành đơn")

        UC_AIDispatch("Điều phối tự động theo vị trí GPS")
        UC_AdminFeed("Theo dõi feed ảnh hiện trường từ Đội trưởng")
        UC_ManageCatalog("Quản lý kho & Thiết bị QR Code")
        UC_ViewReports("Xem báo cáo thống kê & Đánh giá KPI")
    end

    %% Connections for Customer
    Customer --> UC_Auth
    Customer --> UC_AIConsult
    Customer --> UC_AIQuote
    Customer --> UC_CreateRequest
    Customer --> UC_CustomerConfirm

    %% Connections for Sales
    Sales --> UC_Auth
    Sales --> UC_AIConsult
    Sales --> UC_AIQuote
    Sales --> UC_ProjectList

    %% Connections for Leader
    Leader --> UC_Auth
    Leader --> UC_ProjectList
    Leader --> UC_AssignCrew
    Leader --> UC_ReportProgress
    Leader --> UC_HandoverProject

    %% Connections for Technician
    Tech --> UC_Auth
    Tech --> UC_AcceptJob
    Tech --> UC_MapNav
    Tech --> UC_CheckGPS
    Tech --> UC_TechComplete

    %% Connections for Admin
    Admin --> UC_Auth
    Admin --> UC_AdminFeed
    Admin --> UC_ManageCatalog
    Admin --> UC_ViewReports
    Admin --> UC_ProjectList

    %% System interactions
    UC_AIConsult <--> AIEngine
    UC_AIQuote <--> AIEngine
    UC_AIDispatch <--> AIEngine
    UC_ReportProgress -.->|Gửi ảnh realtime| UC_AdminFeed

    classDef actorStyle fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#0d47a1;
    classDef systemStyle fill:#fbe9e7,stroke:#d84315,stroke-width:2px,color:#bf360c;
```

---

### 7.3. Tài Liệu Đặc Tả Use Case Chính (Use Case Specifications)

#### Đặc Tả Use Case 01: Quản Lý Thi Công & Phân Công Tổ Thợ (Đội Trưởng)

| Thuộc Tính | Chi Tiết |
| :--- | :--- |
| **Mã Use Case** | **UC-01** |
| **Tên Use Case** | Quản lý thi công & Phân công tổ thợ nội bộ |
| **Tác nhân chính** | Đội trưởng thi công (`INSTALLATION_LEADER`) |
| **Mô tả** | Cho phép Đội trưởng truy cập không gian công trình, phân bổ trực tiếp các hạng mục công việc cụ thể cho Nhân công 1, 2, 3, 4 mà không cần tạo tài khoản database riêng cho thợ. |
| **Tiền điều kiện** | Đội trưởng đã đăng nhập vào hệ thống và được gán phụ trách công trình. |
| **Hậu điều kiện** | Bảng phân công công việc của các thợ được lưu trữ và cập nhật trạng thái tiến độ tức thời. |
| **Luồng sự kiện chính (Basic Flow)** | 1. Đội trưởng chọn menu **"Thi công & Lắp đặt"** (`/projects/installation`).<br>2. Hệ thống hiển thị danh sách các dự án đang phụ trách kèm % tiến độ.<br>3. Đội trưởng nhấn **"Vào Quản Lý"** của một dự án.<br>4. Hệ thống mở tab **"Phân Công Tổ Thợ"**, hiển thị thẻ công việc của Nhân công 1, 2, 3, 4.<br>5. Đội trưởng nhập nhiệm vụ cụ thể (đấu tủ báo cháy, kéo dây, gắn đầu báo khói...), ghi chú và chọn trạng thái (*Chưa làm / Đang làm / Hoàn thành*).<br>6. Dữ liệu phân bổ được tự động lưu trên bộ nhớ cục bộ dự án của Đội trưởng. |
| **Luồng nhánh / Ngoại lệ** | - Khi tiến độ đạt 100%, nút **"Nghiệm Thu Bàn Giao"** sẽ sáng lên để Đội trưởng kết thúc giai đoạn thi công chuyển sang bảo hành. |

---

#### Đặc Tả Use Case 02: Báo Cáo Tiến Độ Kèm Ảnh Hiện Trường (Đội Trưởng)

| Thuộc Tính | Chi Tiết |
| :--- | :--- |
| **Mã Use Case** | **UC-02** |
| **Tên Use Case** | Báo cáo tiến độ thi công kèm hình ảnh hiện trường thực tế |
| **Tác nhân chính** | Đội trưởng thi công (`INSTALLATION_LEADER`) |
| **Tác nhân phụ** | Quản trị viên (`ADMIN`), Ban Giám đốc (`SALES`) |
| **Mô tả** | Đội trưởng báo cáo % tiến độ và nhật ký công việc trong ngày, kèm hình ảnh chụp thực địa tại công trình truyền trực tiếp về Trang chủ Admin. |
| **Tiền điều kiện** | Đội trưởng đang mở chi tiết dự án thi công. |
| **Hậu điều kiện** | Bản ghi `ProjectProgressLogs` mới được tạo, ảnh hiện trường xuất hiện trên Dashboard Admin. |
| **Luồng sự kiện chính (Basic Flow)** | 1. Đội trưởng nhấn nút **"Báo Cáo Tiến Độ & Ảnh"**.<br>2. Hộp thoại báo cáo mở ra, Đội trưởng kéo thanh trượt % tiến độ hoàn thành (0 - 100%).<br>3. Đội trưởng nhập nhật ký công việc thực tế trong ngày.<br>4. Đội trưởng tải ảnh chụp từ camera điện thoại/máy tính hoặc chọn nhanh ảnh mẫu nghiệp vụ PCCC.<br>5. Hệ thống hiển thị ảnh xem trước (Preview).<br>6. Đội trưởng nhấn **"Gửi Báo Cáo Về Admin"**.<br>7. Hệ thống gọi API `POST /api/project/{id}/progress`, lưu log vào DB và phát tín hiệu SignalR.<br>8. Trang chủ Admin (`/dashboard`) nhận cập nhật và hiển thị ảnh hiện trường trong mục **"📸 Báo Cáo Hiện Trường Từ Đội Trưởng"**. |
| **Luồng ngoại lệ** | - Nếu bỏ trống phần ghi chú: Hệ thống cảnh báo yêu cầu nhập nhật ký trước khi gửi. |

---

#### Đặc Tả Use Case 03: Nghiệm Thu Hoàn Thành Đơn Kèm Ảnh & Đối Soát GPS (Kỹ Thuật Viên)

| Thuộc Tính | Chi Tiết |
| :--- | :--- |
| **Mã Use Case** | **UC-03** |
| **Tên Use Case** | Đối soát định vị GPS bán kính 1km & Chụp ảnh nghiệm thu hoàn thành đơn |
| **Tác nhân chính** | Kỹ thuật viên (`TECHNICIAN`) |
| **Mô tả** | Kỹ thuật viên hoàn tất công việc sửa chữa/bảo trì tại hiện trường, hệ thống kiểm tra khoảng cách GPS (phải trong bán kính 1km) và **bắt buộc tải ảnh nghiệm thu thực tế** mới cho phép hoàn thành đơn. |
| **Tiền điều kiện** | Kỹ thuật viên đã nhận đơn và đang xử lý đơn ở trạng thái `Repairing` hoặc trên bản đồ điều phối. |
| **Hậu điều kiện** | Trạng thái đơn chuyển sang `Completed` (11), ảnh nghiệm thu được lưu vào `ServiceRequestStatusLogs`. |
| **Luồng sự kiện chính (Basic Flow)** | 1. Kỹ thuật viên hoàn tất sửa chữa thiết bị PCCC, nhấn nút **"Đã Hoàn Thành"**.<br>2. Hệ thống thu thập tọa độ GPS hiện tại từ Geolocation API và tính khoảng cách Haversine tới địa chỉ khách hàng.<br>3. **Kiểm tra GPS**: Khoảng cách `<= 1.0 km` -> Cho phép tiếp tục.<br>4. Hệ thống mở hộp thoại **"Nghiệm Thu Hoàn Thành & Tải Ảnh Hiện Trường"**.<br>5. Kỹ thuật viên nhập ghi chú kết quả sửa chữa.<br>6. Kỹ thuật viên **bắt buộc tải ảnh chụp thực tế thiết bị đã khắc phục** (từ camera điện thoại/tệp ảnh).<br>7. Hệ thống hiển thị ảnh xem trước.<br>8. Kỹ thuật viên nhấn **"Xác Nhận Hoàn Thành Đơn"**.<br>9. Hệ thống gửi request `POST /api/service/{id}/status` với `newStatus: 11` và `attachmentUrl`.<br>10. Trạng thái đơn được cập nhật thành công, phát thông báo Realtime tới Admin và Khách hàng. |
| **Luồng ngoại lệ** | - **Cách khách hàng > 1.0 km**: Hệ thống chặn và báo lỗi *"Bạn đang ở cách khách hàng X km. Bắt buộc phải ở trong bán kính 1km mới có thể hoàn thành đơn."*<br>- **Chưa có ảnh nghiệm thu**: Nút *"Xác Nhận Hoàn Thành Đơn"* bị vô hiệu hóa kèm cảnh báo màu vàng bắt buộc phải có ảnh. |

---

### 7.4. Sơ Đồ Luồng Dữ Liệu (DFD - Data Flow Diagram)

#### 7.4.1. Sơ Đồ DFD Mức Ngữ Cảnh (Context Level 0)

```mermaid
graph LR
    Customer["Khách Hàng"]
    Leader["Đội Trưởng Thi Công"]
    Tech["Kỹ Thuật Viên"]
    Admin["Quản Trị Viên (Admin)"]

    System[("0. HỆ THỐNG QUẢN TRỊ & ĐIỀU PHỐI FIREGUARD AI")]

    %% Customer Flow
    Customer -->|Yêu cầu tư vấn, báo giá, đặt lịch sửa chữa PCCC| System
    System -->|Báo giá sơ bộ AI, trạng thái đơn, hồ sơ nghiệm thu| Customer

    %% Leader Flow
    Leader -->|Phân công thợ 1-2-3-4, báo cáo tiến độ & ảnh hiện trường| System
    System -->|Thông tin dự án, danh mục vật tư cần lắp đặt| Leader

    %% Technician Flow
    Tech -->|Tọa độ GPS di chuyển, ảnh chụp nghiệm thu hoàn thành| System
    System -->|Thông tin đơn việc, tọa độ bản đồ khách, chỉ dẫn đường đi| Tech

    %% Admin Flow
    Admin -->|Cấu hình hệ thống, quản lý danh mục kho, tài khoản| System
    System -->|Feed ảnh hiện trường realtime, báo cáo doanh thu & KPI| Admin
```

---

### 7.4.2. Sơ Đồ DFD Mức 1 (Data Flow Diagram Level 1)

```mermaid
graph TD
    %% External Entities
    Customer["Khách Hàng"]
    Leader["Đội Trưởng Thi Công"]
    Tech["Kỹ Thuật Viên"]
    Admin["Quản Trị Viên (Admin)"]

    %% Processes
    P1["1.0 Tiếp Nhận, Tư Vấn & Báo Giá AI"]
    P2["2.0 Quản Lý Thi Công & Báo Cáo Tiến Độ"]
    P3["3.0 Điều Phối & Nghiệm Thu Sửa Chữa"]
    P4["4.0 Quản Lý Kho & Vòng Đời Serial QR"]
    P5["5.0 Giám Sát, Thống Kê & Đánh Giá KPI"]

    %% Data Stores
    D1[("D1: Users & Roles")]
    D2[("D2: Customers & Contracts")]
    D3[("D3: Projects & Progress Logs")]
    D4[("D4: Service Requests & Status Logs")]
    D5[("D5: Inventory & Equipment Serial QR")]

    %% Interactions with Process 1
    Customer -->|Dữ liệu mặt bằng, nhu cầu PCCC| P1
    P1 -->|Dự toán & Báo giá sơ bộ| Customer
    P1 <-->|Đọc / Ghi hợp đồng, báo giá| D2

    %% Interactions with Process 2
    Leader -->|Nhật ký thi công, % tiến độ, ảnh hiện trường| P2
    P2 -->|Lưu log tiến độ & ảnh hiện trường| D3
    D3 -->|Dữ liệu công trình| P2
    P2 <-->|Trừ xuất vật tư công trình| D5

    %% Interactions with Process 3
    Customer -->|Báo hỏng, yêu cầu bảo trì| P3
    P3 <-->|Truy vấn & Cập nhật trạng thái, ảnh nghiệm thu| D4
    P3 -->|Tọa độ khách, thông tin đơn| Tech
    Tech -->|Tọa độ GPS check-in, ảnh nghiệm thu hoàn thành| P3

    %% Interactions with Process 4
    Admin -->|Nhập xuất kho, in mã QR thiết bị| P4
    P4 <-->|Cập nhật tồn kho theo Serial| D5

    %% Interactions with Process 5
    Admin -->|Cấu hình tiêu chí KPI, xem báo cáo| P5
    D3 -->|Ảnh hiện trường mới nhất| P5
    D4 -->|Lịch sử đơn sửa chữa| P5
    D1 -->|Danh sách kỹ thuật viên| P5
    P5 -->|Dashboard realtime, feed ảnh hiện trường, biểu đồ KPI| Admin
```

---

### 7.5. Sơ Đồ Thực Thể Liên Kết (ERD - Entity-Relationship Diagram)

```mermaid
erDiagram
    Users ||--o{ UserRoles : "has"
    Roles ||--o{ UserRoles : "assigned_to"

    Users ||--o{ Projects : "leads"
    Users ||--o{ ServiceRequests : "assigned_to"
    Users ||--o{ ServiceRequestStatusLogs : "updates"
    Users ||--o{ ProjectProgressLogs : "submits"

    Customers ||--o{ CustomerAddresses : "has"
    Customers ||--o{ Projects : "contracts"
    Customers ||--o{ ServiceRequests : "requests"

    Projects ||--o{ ProjectProgressLogs : "contains"
    Projects ||--o{ EquipmentInstallations : "installs"

    CustomerAddresses ||--o{ ServiceRequests : "located_at"
    ServiceRequests ||--o{ ServiceRequestStatusLogs : "status_history"
    ServiceRequests ||--o{ RepairTickets : "resolves"

    EquipmentModels ||--o{ EquipmentAssets : "instantiates"
    EquipmentModels ||--o{ WarehouseStocks : "stored_in"
    EquipmentAssets ||--|| EquipmentQRCodes : "scanned_by"
    EquipmentAssets ||--o{ EquipmentInstallations : "installed_as"

    Users {
        string Id PK
        string FullName
        string Username
        string Email
        string PhoneNumber
        boolean IsActive
    }

    Projects {
        string Id PK
        string CustomerId FK
        string ContractId FK
        string Name
        string Address
        string TeamLeaderId FK
        int ProgressPercentage
        int Status
        datetime StartDate
        datetime EndDate
    }

    ProjectProgressLogs {
        string Id PK
        string ProjectId FK
        int ProgressPercentage
        string Notes
        string ImageUrl
        string CreatedBy
        datetime CreatedAtUtc
    }

    ServiceRequests {
        string Id PK
        string RequestNumber
        string CustomerId FK
        string AddressId FK
        string EquipmentAssetId FK
        string Description
        int Urgency
        int RequestType
        int Status
        string AssignedTechnicianId FK
        datetime DesiredTime
        varbinary RowVersion
    }

    ServiceRequestStatusLogs {
        string Id PK
        string ServiceRequestId FK
        int FromStatus
        int ToStatus
        string Notes
        string AttachmentUrl
        string ChangedBy FK
        datetime ChangedAtUtc
    }

    CustomerAddresses {
        string Id PK
        string CustomerId FK
        string AddressLine
        double Latitude
        double Longitude
    }
```

---

### 7.6. Sơ Đồ Lớp (Class Diagram - Domain, Application & API)

```mermaid
classDiagram
    %% Base Entities
    class BaseEntity~T~ {
        +T Id
        +DateTime CreatedAtUtc
    }

    class AuditableEntity~T~ {
        +string CreatedBy
        +DateTime? LastModifiedAtUtc
        +string LastModifiedBy
    }

    BaseEntity <|-- AuditableEntity

    %% Domain Entities
    class Project {
        +string Name
        +string CustomerId
        +string ContractId
        +string Address
        +double? Latitude
        +double? Longitude
        +string TeamLeaderId
        +int ProgressPercentage
        +ProjectStatus Status
        +DateTime StartDate
        +DateTime EndDate
        +ICollection~ProjectProgressLog~ ProgressLogs
        +UpdateProgress(int percent, string notes)
        +CompleteHandover()
    }

    class ProjectProgressLog {
        +string ProjectId
        +int ProgressPercentage
        +string Notes
        +string ImageUrl
        +DateTime CreatedAtUtc
        +string CreatedBy
    }

    class ServiceRequest {
        +string RequestNumber
        +string CustomerId
        +string AddressId
        +string EquipmentAssetId
        +string Description
        +UrgencyLevel Urgency
        +ServiceRequestType RequestType
        +ServiceRequestStatus Status
        +string AssignedTechnicianId
        +byte[] RowVersion
        +ICollection~ServiceRequestStatusLog~ StatusLogs
        +AssignTechnician(string techId)
        +TransitionStatus(ServiceRequestStatus next)
    }

    class ServiceRequestStatusLog {
        +string ServiceRequestId
        +ServiceRequestStatus FromStatus
        +ServiceRequestStatus ToStatus
        +string Notes
        +string AttachmentUrl
        +string ChangedBy
        +DateTime ChangedAtUtc
    }

    %% Controllers
    class ProjectController {
        -ApplicationDbContext _context
        -IHubContext~ProjectHub~ _hubContext
        +GetProjects()
        +GetProjectById(string id)
        +GetRecentProgressLogs()
        +UpdateProgress(string id, ProgressUpdateRequest req)
        +CompleteAcceptance(string id, CompleteAcceptanceRequest req)
    }

    class ServiceController {
        -ApplicationDbContext _context
        -IHubContext~ProjectHub~ _hubContext
        +GetRequests(string search, ServiceRequestStatus status)
        +GetRequestById(string id)
        +CreateRequest(CreateServiceRequest req)
        +TransitionStatus(string id, StatusTransitionRequest req)
    }

    %% DTOs
    class ProgressUpdateRequest {
        +int ProgressPercentage
        +string Notes
        +string ImageUrl
    }

    class StatusTransitionRequest {
        +ServiceRequestStatus NewStatus
        +string Notes
        +string AttachmentUrl
        +string AssignedTechnicianId
        +byte[] RowVersion
    }

    %% Relationships
    AuditableEntity <|-- Project
    AuditableEntity <|-- ProjectProgressLog
    AuditableEntity <|-- ServiceRequest
    BaseEntity <|-- ServiceRequestStatusLog

    Project "1" *-- "0..*" ProjectProgressLog : contains
    ServiceRequest "1" *-- "0..*" ServiceRequestStatusLog : contains

    ProjectController ..> Project : manages
    ProjectController ..> ProgressUpdateRequest : receives
    ServiceController ..> ServiceRequest : manages
    ServiceController ..> StatusTransitionRequest : receives
```

---

### 7.7. Sơ Đồ Hoạt Động (Activity Diagrams - Các Quy Trình Chính)

#### 7.7.1. Hoạt Động 1: Quy Trình Phân Công Thợ & Báo Cáo Ảnh Tiến Độ (Đội Trưởng Thi Công)

```mermaid
flowchart TD
    Start([Bắt đầu]) --> Login[Đội trưởng đăng nhập vào hệ thống]
    Login --> SelectProject[Chọn dự án thi công đang phụ trách]
    SelectProject --> OpenWorkspace[Vào không gian thi công dự án]

    %% Phân công thợ
    OpenWorkspace --> AssignWorkers[Mở bảng phân công tổ thợ nội bộ]
    AssignWorkers --> InputTasks[Giao việc cho Nhân công 1, 2, 3, 4]
    InputTasks --> UpdateWorkerStatus[Cập nhật trạng thái: Chưa làm / Đang làm / Đã xong]
    UpdateWorkerStatus --> SaveLocal[Lưu trạng thái tổ thợ tự động trên thiết bị]

    %% Báo cáo ảnh
    SaveLocal --> OpenReportDialog[Nhấn 'Báo Cáo Tiến Độ & Ảnh']
    OpenReportDialog --> InputPercent[Chọn % hoàn thành & Nhập nhật ký công việc]
    InputPercent --> UploadPhoto[Chụp ảnh camera hoặc tải ảnh hiện trường]
    UploadPhoto --> ReviewPreview{Ảnh xem trước hợp lệ?}
    ReviewPreview -- Chưa đạt --> UploadPhoto
    ReviewPreview -- Đạt chuẩn --> SubmitReport[Nhấn 'Gửi Báo Cáo Về Admin']

    %% Hệ thống xử lý
    SubmitReport --> BackendSave[API ProjectController lưu vào ProjectProgressLogs]
    BackendSave --> SignalRBroadcast[SignalR phát sự kiện Realtime]
    SignalRBroadcast --> AdminDashboard[Dashboard Admin hiển thị ngay ảnh & mốc tiến độ]

    AdminDashboard --> Check100{Tiến độ đạt 100%?}
    Check100 -- Chưa đạt --> ContinueWork[Tiếp tục thi công ngày tiếp theo]
    Check100 -- Đạt 100% --> Handover[Nhấn 'Nghiệm Thu Bàn Giao' chuyển giao dự án]
    Handover --> End([Kết thúc])
    ContinueWork --> End
```

---

#### 7.7.2. Hoạt Động 2: Quy Trình Đối Soát GPS 1km & Nghiệm Thu Kèm Ảnh (Kỹ Thuật Viên)

```mermaid
flowchart TD
    Start([Bắt đầu xử lý đơn]) --> TechAccept[Kỹ thuật viên nhận đơn trên Bản đồ / Job Board]
    TechAccept --> OnTheWay[Bấm 'Di chuyển' - Hệ thống dẫn đường bản đồ số]
    OnTheWay --> ArriveClient[Kỹ thuật viên đến hiện trường khách hàng]
    ArriveClient --> CheckIn[Bấm 'Check-in' & Bắt đầu chẩn đoán sự cố]
    CheckIn --> RepairJob[Thực hiện thay thế, sửa chữa hoặc nạp sạc bình PCCC]

    %% Kết thúc công việc
    RepairJob --> ClickComplete[Kỹ thuật viên bấm 'Đã Hoàn Thành']
    ClickComplete --> ReadGPS[Hệ thống đọc GPS hiện tại từ Geolocation API]
    ReadGPS --> CalcDistance[Tính khoảng cách Haversine tới địa chỉ khách]

    CalcDistance --> CheckRadius{Khoảng cách <= 1.0 km?}
    CheckRadius -- Sai > 1km --> ShowGPSError[Báo lỗi: Ngoài bán kính 1km cho phép, từ chối hoàn thành]
    ShowGPSError --> EndReject([Không cho phép hoàn thành])

    CheckRadius -- Đúng <= 1km --> OpenCompleteModal[Mở hộp thoại Nghiệm Thu & Tải Ảnh]
    OpenCompleteModal --> InputNotes[Nhập ghi chú kết quả sửa chữa]
    InputNotes --> SelectImage[Chụp ảnh camera hoặc tải ảnh thiết bị đã sửa xong]

    SelectImage --> CheckImage{Đã có ảnh nghiệm thu?}
    CheckImage -- Chưa có ảnh --> DisableSubmit[Nút Hoàn Thành bị vô hiệu hóa, hiện cảnh báo vàng]
    DisableSubmit --> SelectImage

    CheckImage -- Đã có ảnh --> EnableSubmit[Nút Xác Nhận sáng lên]
    EnableSubmit --> ConfirmJob[Nhấn 'Xác Nhận Hoàn Thành Đơn']
    ConfirmJob --> CallAPI[Gọi API ServiceController lưu AttachmentUrl vào StatusLog]
    CallAPI --> SignalR[SignalR phát thông báo Realtime hoàn thành]
    SignalR --> CustomerConfirm[Khách hàng nhận thông báo & Bấm xác nhận nghiệm thu]
    CustomerConfirm --> EndSuccess([Hoàn tất đơn hàng thành công])
```

---

#### 7.7.3. Hoạt Động 3: Quy Trình Điều Phối Tự Động Kỹ Thuật Viên Bằng AI (AI Automated Dispatch)

```mermaid
flowchart TD
    Start([Yêu cầu sửa chữa mới]) --> SystemEvent[Khách hàng gửi yêu cầu dịch vụ PCCC]
    SystemEvent --> AIService[Kích hoạt AI Dispatch Engine]
    AIService --> GetTechnicians[Quét danh sách kỹ thuật viên đang Online]
    GetTechnicians --> FilterSkills[Lọc kỹ thuật viên theo chứng chỉ & loại thiết bị]
    FilterSkills --> CalcMatrix[Tính ma trận khoảng cách GPS từ thợ tới khách hàng]
    CalcMatrix --> ScoreKPI[Kết hợp điểm đánh giá sao & chỉ số KPI hoàn thành đơn]
    ScoreKPI --> RankTechs[Sắp xếp danh sách kỹ thuật viên tối ưu nhất]

    RankTechs --> SendOffer[Gửi thông báo nhận việc ưu tiên tới Kỹ thuật viên Top 1]
    SendOffer --> WaitTimer[Bắt đầu đếm ngược thời gian phản hồi (3 phút)]

    WaitTimer --> TechResponse{Kỹ thuật viên phản hồi?}
    TechResponse -- Đồng ý nhận việc --> AssignSuccess[Chuyển trạng thái: Assigned / Đã giao việc]
    TechResponse -- Từ chối hoặc Hết giờ --> PickNext[Chuyển sang Kỹ thuật viên Top 2 tiếp theo]
    PickNext --> SendOffer

    AssignSuccess --> PushJob[Đẩy đơn vào màn hình Bản đồ điều phối của thợ]
    PushJob --> End([Kết thúc quy trình điều phối])
```
