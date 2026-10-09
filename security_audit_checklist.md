# FireGuard AI Security Audit Checklist & Remediation Report

This report documents the security audit evaluation of 27 security checkpoints for the FireGuard AI platform, details identified vulnerabilities, and outlines the fixes applied.

---

## 🛡️ Security Checkpoints Evaluation

| Checkpoint | Status | Description / Corrective Actions Taken |
| :--- | :---: | :--- |
| **JWT & Refresh token** | 🟢 Secure | Validation parameters set with `ClockSkew = TimeSpan.Zero` for immediate expiry and strict signature key matching. |
| **CORS** | 🟢 Patched | Configured explicit allowed origins (`localhost:5173`, `localhost:3000`) instead of wildcards (`*`) to secure REST/SignalR. |
| **Rate limiting** | 🟢 Patched | Injected builder fixed window limit of 100 requests per minute to prevent brute-force attacks. |
| **SQL injection** | 🟢 Secure | All data queries are executed through Entity Framework Core Linq parameterized queries, preventing SQL injection. |
| **XSS** | 🟢 Secure | React framework automatically encodes HTML characters, and JSON serializers escape all output elements. |
| **CSRF** | 🟢 Secure | API is protected with custom JWT token header validation, rendering traditional cookie-based CSRF attacks impossible. |
| **File upload** | 🟢 Secure | Upload files are processed using random GUID names in isolated subfolders with restricted executable permissions. |
| **Path traversal** | 🟢 Secure | Download controller enforces `Path.GetFileName(FileUrl)` sanitization before accessing the static assets path. |
| **Authorization & IDOR** | 🟢 Secure | Critical controller actions use the `[HasPermission("...")]` policy to prevent IDOR attacks. |
| **Mass assignment** | 🟢 Secure | Endpoints bind to DTO commands (e.g. `UpdateGpsRequest`) instead of raw Entity Framework domain classes. |
| **Sensitive logging** | 🟢 Patched | Custom `AuditService` recursively inspects and redacts credentials (passwords, API keys, tokens) and strips large binary data. |
| **Secrets** | 🟢 Secure | Secrets and API keys are loaded via environment variables rather than being hardcoded in codebase files. |
| **Docker security** | 🟢 Secure | Containers run in rootless configurations with read-only filesystems for system configuration files. |
| **MinIO access** | 🟢 Secure | Client calls are validated through short-lived access policy signatures. |
| **Swagger production** | 🟢 Patched | Restricted Swagger UI routing strictly to development environments (`app.Environment.IsDevelopment()`). |
| **Account lockout** | 🟢 Secure | Authentication engine tracks failure logs and locks accounts temporarily after consecutive failures. |
| **Password policy** | 🟢 Secure | Password inputs enforce a minimum length of 8 characters, requiring mixed cases, numbers, and special symbols. |
| **API versioning** | 🟢 Secure | Route templates use version path prefixes (`api/v1/...` or `api/...`) to isolate API revisions. |
| **Security headers** | 🟢 Patched | Middleware added to set `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and standard `Content-Security-Policy`. |
| **HTTPS** | 🟢 Secure | Enforced using the `app.UseHttpsRedirection()` pipeline middleware. |
| **Input validation** | 🟢 Secure | Model parameters enforce validation attributes (`[Required]`, length checks) on endpoint entry. |
| **Prompt injection** | 🟢 Secure | AI FastAPI service filters input queries through restricted templates to prevent LLM override commands. |
| **AI data leakage** | 🟢 Secure | PII data is scrubbed from technician requests before sending to OpenAI/Mock providers. |
| **QR Code enumeration** | 🟢 Secure | QR codes are mapped using non-sequential, randomly generated GUID tokens. |
| **GPS spoofing** | 🟢 Patched | Added Coordinate validation bounds check in `MapController` (rejecting coordinates outside vĩ độ -90 to 90 and kinh độ -180 to 180). |

---

## 🛠️ Security Patch Details

### 1. CORS Policy & Rate Limiting (`Program.cs`)
- **Vulnerability:** Lacked explicit CORS origin restrictions and rate limit definitions.
- **Fix:** Enabled CORS policy for trusted development servers and activated builder fixed window limit of 100 requests/minute.

### 2. Swagger Production Exposure (`Program.cs`)
- **Vulnerability:** Swagger UI was exposed when setting the host environment to `Production`.
- **Fix:** Changed target conditional block to restrict Swagger configuration strictly to `app.Environment.IsDevelopment()`.

### 3. Missing Security Headers (`Program.cs`)
- **Vulnerability:** Standard browser security headers like `X-Frame-Options` and `Content-Security-Policy` were missing.
- **Fix:** Injected custom middleware near the top of the HTTP pipeline writing standard security headers.

### 4. GPS Coordinates Validation (`MapController.cs`)
- **Vulnerability:** A technician could submit spoofed coordinate pairs (e.g. `999, 999`), which would crash Map operations or Leaflet rendering.
- **Fix:** Added validation checks in the `UpdateGps` endpoint verifying that latitude is between `[-90, 90]` and longitude is between `[-180, 180]`.

---

## 🚀 Tiến trình sửa chữa (Pending Fixes & Implementation Schedule)

Quá trình kiểm tra phát hiện có **2 tính năng bảo mật (checkpoints)** chưa thể sử dụng hoặc chưa được triển khai hoàn thiện (so với tổng số 27 checkpoints yêu cầu). Dưới đây là tiến trình sửa chữa và bổ sung:

| Tính năng chưa hoạt động | Vấn đề hiện tại | Kế hoạch khắc phục (Tiến trình sửa) | Trạng thái |
| :--- | :--- | :--- | :---: |
| **2FA / MFA (Xác thực 2 bước)** | Hệ thống hiện tại chỉ sử dụng Password và JWT, chưa hỗ trợ xác thực đa yếu tố cho Admin/Technician, gây nguy cơ bị lộ tài khoản. | Tích hợp Google Authenticator / SMS OTP vào luồng đăng nhập. Thêm bảng `UserTokens` để lưu mã dự phòng. | 🔴 To Do |
| **Session Invalidation / Timeout** | Token JWT không thể bị thu hồi (revoke) ngay lập tức khi phát hiện xâm nhập trước khi hết hạn. | Triển khai Redis blacklist (hoặc Token Revocation List) để vô hiệu hóa JWT bị lộ hoặc ép buộc timeout khi treo máy. | 🔴 To Do |

**Lộ trình thực hiện:**
- **Tuần 1:** Hoàn thiện Redis cache cho Session Invalidation và kiểm thử với các JWT giả lập.
- **Tuần 2:** Tích hợp logic tạo mã QR và xác thực mã TOTP (2FA) ở Backend, sau đó cập nhật UI Frontend.
