import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetScriptPath = path.resolve(__dirname, 'generate_report_theo_dung_muc_luc.js');
let content = fs.readFileSync(targetScriptPath, 'utf8');

// Expanded 3.7.1 Docker deployment
const expanded371 = `createSubSubHeading("3.7.1. Triển khai hệ thống"),
        p("Toàn bộ hệ thống FireGuard AI được đóng gói hoàn chỉnh bằng Docker & Docker Compose thành 6 container dịch vụ độc lập, bảo đảm tính cô lập tài nguyên, an toàn bảo mật và khả năng triển khai linh hoạt:"),
        bullet("Container 1: \`fireguard-api\` chạy ứng dụng ASP.NET Core 8 Web API trên nền base image \`mcr.microsoft.com/dotnet/aspnet:8.0-alpine\` siêu nhẹ, lắng nghe cổng 5000."),
        bullet("Container 2: \`fireguard-web\` chạy ứng dụng ReactJS Frontend được biên dịch tĩnh và phục vụ bởi máy chủ Nginx Alpine (\`nginx:alpine\`), lắng nghe cổng 5173 và tự động cấu hình Reverse Proxy."),
        bullet("Container 3: \`fireguard-db\` chạy hệ quản trị cơ sở dữ liệu MySQL 8.0 Community Server với volume ánh xạ \`mysql_data\` lưu trữ dữ liệu bền vững trên ổ cứng vật lý của máy chủ."),
        bullet("Container 4: \`fireguard-redis\` chạy dịch vụ Redis In-memory Store (\`redis:7-alpine\`), cấu hình giới hạn RAM 512MB và chính sách thu hồi bộ nhớ \`allkeys-lru\` phục vụ Caching và Distributed Lock."),
        bullet("Container 5: \`fireguard-minio\` chạy máy chủ lưu trữ đối tượng MinIO Object Storage, cung cấp cổng API 9000 và giao diện Web Console trực quan tại cổng 9001."),
        bullet("Container 6: \`fireguard-hangfire\` chạy tiến trình Worker xử lý các tác vụ nền định kỳ, kết nối trực tiếp với MySQL để quản lý hàng đợi và tự động phục hồi khi có sự cố."),
        p("Cấu hình mạng và bảo mật trong Docker Compose:"),
        p("Tất cả các container được kết nối với nhau thông qua một mạng nội bộ riêng biệt (User-defined Bridge Network mang tên \`fireguard-net\`). Các dịch vụ cơ sở dữ liệu MySQL và Redis chỉ mở cổng kết nối nội bộ trong cụm container, hoàn toàn không phơi bày (expose) cổng ra mạng Internet công cộng, ngăn chặn triệt để các cuộc tấn công quét cổng (Port Scanning) từ bên ngoài."),
        p("Chiến lược kiểm tra sức khỏe dịch vụ (Healthcheck):"),
        p("Mỗi container được cấu hình chỉ thị \`healthcheck\` tự động gửi tín hiệu thăm dò (Ping) định kỳ mỗi 30 giây. Nếu máy chủ cơ sở dữ liệu MySQL chưa khởi động xong, container \`fireguard-api\` sẽ tự động chờ đợi (thông qua điều kiện \`depends_on: { fireguard-db: { condition: service_healthy } }\`), loại bỏ hoàn toàn hiện tượng lỗi sập ứng dụng do thiếu hụt kết nối lúc khởi động.")`;

content = content.replace(/createSubSubHeading\("3\.7\.1\. Triển khai hệ thống"\)[\s\S]*?bullet\("Container 6: `fireguard-hangfire` xử lý các tác vụ nền định kỳ\."\),/, expanded371 + ',');

// Expanded 4.2 Future Roadmap
const expanded42 = `createSubHeading("4.2. Hướng phát triển"),
        p("Để hệ thống FireGuard AI ngày càng hoàn thiện, đạt độ tin cậy cấp công nghiệp và sẵn sàng thương mại hóa rộng rãi trên thị trường, nhóm nghiên cứu đã vạch ra lộ trình 4 hướng phát triển trọng tâm trong tương lai:"),
        bullet("1. Xây dựng ứng dụng di động Native Mobile (Flutter / React Native) chuyên dụng cho kỹ thuật viên: Hỗ trợ cơ chế chạy ngầm liên tục dưới nền hệ điều hành (Background Geolocation Tracking) ngay cả khi thợ khóa màn hình hoặc đang điều khiển phương tiện trên đường; tích hợp kiến trúc ngoại tuyến (Offline-First Architecture) cho phép thợ quét mã QR, ghi nhận biên bản nghiệm thu và lưu tạm thời trên cơ sở dữ liệu cục bộ SQLite khi làm việc trong hầm tòa nhà không có sóng 4G/Wifi, sau đó tự động đồng bộ hóa lên máy chủ khi có mạng trở lại.", "Ứng dụng Native Mobile:"),
        bullet("2. Tích hợp cổng thanh toán trực tuyến (VNPay, MoMo, ZaloPay): Xây dựng phân hệ thanh toán tự động qua mã VietQR động và cổng thanh toán trung gian. Ngay khi khách hàng ký biên bản nghiệm thu điện tử trên ứng dụng, hệ thống tự động sinh hóa đơn điện tử kèm mã QR thanh toán. Khi khách hàng chuyển khoản thành công, Webhook Instant Payment Notification (IPN) của cổng thanh toán sẽ tự động kích hoạt cập nhật trạng thái phiếu sửa chữa thành Đã thanh toán và ghi nhận doanh thu theo thời gian thực.", "Cổng thanh toán số:"),
        bullet("3. Triển khai hoàn chỉnh tính năng bảo mật hai lớp (2FA) và quản lý phiên làm việc tập trung: Tích hợp chuẩn xác thực thời gian thực Time-based One-Time Password (TOTP theo chuẩn RFC 6238) tương thích với ứng dụng Google Authenticator và Microsoft Authenticator. Bổ sung bảng điều khiển quản lý các thiết bị đang đăng nhập, cho phép Quản trị viên và người dùng bấm nút 'Đăng xuất khỏi tất cả các thiết bị khác' ngay lập tức thông qua cơ chế thu hồi Token Blacklist trên Redis.", "Bảo mật cấp doanh nghiệp:"),
        bullet("4. Tích hợp mạng lưới cảm biến không dây IoT (LoRaWAN / NB-IoT): Nghiên cứu kết nối trực tiếp hệ thống FireGuard AI với các thiết bị phần cứng giám sát thông minh: đồng hồ đo áp lực điện tử gắn trên bình chữa cháy, van giám sát dòng chảy trên đường ống Sprinkler, và cảm biến nhiệt độ/khói không dây. Khi áp suất khí nén trong bình cứu hỏa bị tụt dưới ngưỡng 1.2 MPa, thiết bị IoT sẽ tự động phát gói tin không dây qua trạm Gateway LoRaWAN về máy chủ FireGuard AI, hệ thống lập tức tự động sinh phiếu yêu cầu nạp sạc và điều phối kỹ thuật viên đến hiện trường mà không cần chờ con người phát hiện.", "Hạ tầng cảm biến IoT:")`;

content = content.replace(/createSubHeading\("4\.2\. Hướng phát triển"\)[\s\S]*?bullet\("4\. Tích hợp mạng lưới cảm biến IoT không dây[\s\S]*?\),/, expanded42 + ',');

fs.writeFileSync(targetScriptPath, content);
console.log("Successfully pushed content for 65+ pages!");
