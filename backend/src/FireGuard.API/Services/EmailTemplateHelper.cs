using System;

namespace FireGuard.API.Services
{
    public static class EmailTemplateHelper
    {
        public static string GenerateNotificationEmail(string title, string message, string? linkUrl)
        {
            var actionBtnHtml = string.Empty;
            if (!string.IsNullOrEmpty(linkUrl))
            {
                // In production, prepend the base frontend domain if it's a relative path
                var absoluteUrl = linkUrl.StartsWith("http") ? linkUrl : $"http://localhost:5173{linkUrl}";
                actionBtnHtml = $@"
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='{absoluteUrl}' class='btn' style='display: inline-block; padding: 12px 24px; background-color: #ff3d00; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; text-align: center;'>Xem chi tiết nghiệp vụ</a>
                    </div>";
            }

            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>{title}</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f5f7; color: #333333; margin: 0; padding: 20px; }}
        .container {{ max-width: 600px; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); margin: 0 auto; border-top: 4px solid #ff3d00; }}
        .header {{ text-align: center; margin-bottom: 25px; }}
        .logo {{ font-size: 24px; font-weight: bold; color: #ff3d00; text-decoration: none; }}
        .title {{ font-size: 20px; font-weight: bold; color: #111111; margin-bottom: 15px; border-bottom: 1px solid #eeeeee; padding-bottom: 10px; }}
        .message {{ font-size: 16px; line-height: 1.6; color: #444444; margin-bottom: 25px; }}
        .footer {{ text-align: center; margin-top: 35px; font-size: 12px; color: #888888; border-top: 1px solid #eeeeee; padding-top: 20px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <span class='logo'>FireGuard AI</span>
        </div>
        <div class='title'>{title}</div>
        <div class='message'>{message}</div>
        {actionBtnHtml}
        <div class='footer'>
            Đây là email tự động được gửi từ hệ thống giám sát và vận hành FireGuard AI ERP.<br>
            Vui lòng không phản hồi email này.<br>
            &copy; {DateTime.UtcNow.Year} FireGuard AI Corporation. All rights reserved.
        </div>
    </div>
</body>
</html>";
        }
    }
}
