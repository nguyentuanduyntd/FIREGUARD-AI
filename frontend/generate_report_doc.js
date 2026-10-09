import fs from 'fs';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle
} from 'docx';

const borderNone = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

const createHeading1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 360, after: 180 },
  children: [new TextRun({ text, bold: true, size: 30, color: '1A365D', font: 'Times New Roman' })],
});

const createHeading2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 240, after: 120 },
  children: [new TextRun({ text, bold: true, size: 26, color: '2B6CB0', font: 'Times New Roman' })],
});

const createHeading3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 180, after: 80 },
  children: [new TextRun({ text, bold: true, italic: true, size: 24, color: '2D3748', font: 'Times New Roman' })],
});

const createPlaceholder = (hint = 'Sinh viên điền nội dung chi tiết vào phần này...') => new Paragraph({
  spacing: { before: 80, after: 180 },
  children: [
    new TextRun({
      text: `[... ${hint} ...]`,
      italic: true,
      color: '718096',
      size: 24,
      font: 'Times New Roman'
    })
  ]
});

const createParagraph = (text, options = {}) => new Paragraph({
  spacing: { before: 80, after: 120 },
  alignment: options.alignment || AlignmentType.LEFT,
  children: [
    new TextRun({
      text,
      size: options.size || 24,
      bold: options.bold || false,
      italic: options.italic || false,
      color: options.color || '000000',
      font: 'Times New Roman'
    })
  ]
});

const createPageBreak = () => new Paragraph({
  children: [new TextRun({ text: '', break: 1 })],
  pageBreakBefore: true
});

const doc = new Document({
  creator: 'FireGuard AI Team',
  title: 'Báo Cáo Đồ Án Tốt Nghiệp - FireGuard AI',
  description: 'Mẫu khung mục lục báo cáo đồ án hệ thống quản lý PCCC',
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1440, // 2.54 cm
            bottom: 1440,
            left: 1700, // 3 cm
            right: 1134  // 2 cm
          }
        }
      },
      children: [
        // ================= TRANG BÌA =================
        createParagraph('BỘ GIÁO DỤC VÀ ĐÀO TẠO', { alignment: AlignmentType.CENTER, bold: true, size: 26 }),
        createParagraph('TRƯỜNG ĐẠI HỌC .................................................', { alignment: AlignmentType.CENTER, bold: true, size: 26 }),
        createParagraph('KHOA CÔNG NGHỆ THÔNG TIN', { alignment: AlignmentType.CENTER, bold: true, size: 28, color: '1A365D' }),

        new Paragraph({ spacing: { before: 720, after: 720 }, children: [] }),

        createParagraph('BÁO CÁO ĐỒ ÁN TỐT NGHIỆP', { alignment: AlignmentType.CENTER, bold: true, size: 36, color: 'C53030' }),
        createParagraph('ĐỀ TÀI:', { alignment: AlignmentType.CENTER, bold: true, size: 28 }),
        createParagraph('FIREGUARD AI - HỆ THỐNG QUẢN LÝ THI CÔNG, BẢO TRÌ THIẾT BỊ PCCC VÀ ĐIỀU PHỐI KỸ THUẬT TÍCH HỢP TRÍ TUỆ NHÂN TẠO', {
          alignment: AlignmentType.CENTER,
          bold: true,
          size: 30,
          color: '2B6CB0'
        }),

        new Paragraph({ spacing: { before: 1200, after: 720 }, children: [] }),

        // Thông tin sinh viên & GVHD
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: borderNone,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 35, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  children: [createParagraph('Giáo viên hướng dẫn:', { bold: true })]
                }),
                new TableCell({
                  width: { size: 65, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  children: [createParagraph('..................................................................')]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 35, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  children: [createParagraph('Sinh viên thực hiện:', { bold: true })]
                }),
                new TableCell({
                  width: { size: 65, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  children: [createParagraph('..................................................................')]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 35, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  children: [createParagraph('Mã số sinh viên:', { bold: true })]
                }),
                new TableCell({
                  width: { size: 65, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  children: [createParagraph('..................................................................')]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 35, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  children: [createParagraph('Lớp / Khóa:', { bold: true })]
                }),
                new TableCell({
                  width: { size: 65, type: WidthType.PERCENTAGE },
                  borders: borderNone,
                  children: [createParagraph('..................................................................')]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 1440, after: 200 }, children: [] }),
        createParagraph('Năm học: 2025 - 2026', { alignment: AlignmentType.CENTER, bold: true }),

        // ================= LỜI CẢM ƠN =================
        createPageBreak(),
        createParagraph('LỜI CẢM ƠN', { alignment: AlignmentType.CENTER, bold: true, size: 30, color: '1A365D' }),
        createPlaceholder('Gửi lời cảm ơn thầy cô, nhà trường, gia đình và bạn bè...'),

        // ================= LỜI CAM ĐOAN =================
        createPageBreak(),
        createParagraph('LỜI CAM ĐOAN', { alignment: AlignmentType.CENTER, bold: true, size: 30, color: '1A365D' }),
        createPlaceholder('Cam đoan đề tài là sản phẩm tự nghiên cứu, không sao chép trái phép...'),

        // ================= MỤC LỤC TỔNG QUÁT =================
        createPageBreak(),
        createParagraph('MỤC LỤC', { alignment: AlignmentType.CENTER, bold: true, size: 32, color: '1A365D' }),
        createParagraph('(Gợi ý: Trong Microsoft Word, bạn có thể bấm chuột phải chọn "Update Field" để cập nhật số trang tự động sau khi điền nội dung)', { italic: true, size: 20, color: '718096' }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        createParagraph('LỜI CẢM ƠN ...................................................................................................................... i', { bold: true }),
        createParagraph('LỜI CAM ĐOAN .................................................................................................................. ii', { bold: true }),
        createParagraph('DANH MỤC CÁC TỪ VIẾT TẮT ........................................................................................ iii', { bold: true }),
        createParagraph('DANH MỤC BẢNG BIỂU .................................................................................................... iv', { bold: true }),
        createParagraph('DANH MỤC HÌNH ẢNH / SƠ ĐỒ ....................................................................................... v', { bold: true }),

        new Paragraph({ spacing: { before: 150, after: 50 }, children: [] }),
        createParagraph('CHƯƠNG 1: TỔNG QUAN VỀ ĐỀ TÀI VÀ KHẢO SÁT HIỆN TRẠNG', { bold: true, color: '1A365D' }),
        createParagraph('    1.1. Lý do chọn đề tài và tính cấp thiết'),
        createParagraph('    1.2. Mục tiêu nghiên cứu và phạm vi của đề tài'),
        createParagraph('    1.3. Khảo sát hiện trạng công tác PCCC và chuyển đổi số'),
        createParagraph('    1.4. Đối tượng và phương pháp nghiên cứu'),
        createParagraph('    1.5. Cấu trúc của báo cáo đồ án'),

        new Paragraph({ spacing: { before: 150, after: 50 }, children: [] }),
        createParagraph('CHƯƠNG 2: PHÂN TÍCH YÊU CẦU NGHIỆP VỤ (BUSINESS ANALYSIS)', { bold: true, color: '1A365D' }),
        createParagraph('    2.1. Phân hệ Quản lý thi công & Đội trưởng công trình'),
        createParagraph('        2.1.1. Quản lý danh mục dự án và tiến độ thi công'),
        createParagraph('        2.1.2. Cơ chế phân công tổ thợ nội bộ (Nhân công 1, 2, 3, 4)'),
        createParagraph('        2.1.3. Báo cáo tiến độ hiện trường bằng hình ảnh thực tế'),
        createParagraph('        2.1.4. Nghiệm thu bàn giao và kích hoạt bảo hành'),
        createParagraph('    2.2. Phân hệ Tiếp nhận, Điều phối & Sửa chữa bảo trì'),
        createParagraph('        2.2.1. Tiếp nhận sự cố PCCC từ khách hàng'),
        createParagraph('        2.2.2. Bản đồ số và điều phối kỹ thuật viên'),
        createParagraph('        2.2.3. Ràng buộc vị trí GPS trong bán kính 1.0 km'),
        createParagraph('        2.2.4. Bắt buộc chụp/tải ảnh nghiệm thu hiện trường trước khi hoàn thành'),
        createParagraph('    2.3. Phân hệ Bán hàng, Báo giá & Tư vấn PCCC AI'),
        createParagraph('        2.3.1. Quản lý khách hàng (CRM) và hợp đồng kinh doanh'),
        createParagraph('        2.3.2. Chatbot AI tư vấn giải pháp tiêu chuẩn TCVN'),
        createParagraph('        2.3.3. Lập dự toán tự động & Báo giá sơ bộ bằng AI'),
        createParagraph('    2.4. Phân hệ Quản lý kho và Vòng đời thiết bị theo Serial / QR Code'),
        createParagraph('        2.4.1. Quản lý tồn kho theo danh mục Model và Kho thực tế'),
        createParagraph('        2.4.2. Khởi tạo và quét mã QR Code thiết bị'),
        createParagraph('        2.4.3. Theo dõi hạn bảo trì, nạp sạc bình chữa cháy định kỳ'),
        createParagraph('    2.5. Các yêu cầu phi chức năng (Non-functional Requirements)'),
        createParagraph('        2.5.1. Yêu cầu về hiệu năng và tải hệ thống'),
        createParagraph('        2.5.2. Yêu cầu về an toàn và bảo mật thông tin'),
        createParagraph('        2.5.3. Khả năng mở rộng và tính tương thích nền tảng'),

        new Paragraph({ spacing: { before: 150, after: 50 }, children: [] }),
        createParagraph('CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG (SYSTEM ANALYSIS & DESIGN)', { bold: true, color: '1A365D' }),
        createParagraph('    3.1. Sơ đồ phân rã chức năng nghiệp vụ (BFD - Business Function Diagram)'),
        createParagraph('    3.2. Sơ đồ Use Case tổng thể và phân hệ'),
        createParagraph('    3.3. Đặc tả chi tiết các Use Case chính'),
        createParagraph('        3.3.1. Đặc tả UC-01: Quản lý thi công & Phân công tổ thợ'),
        createParagraph('        3.3.2. Đặc tả UC-02: Báo cáo tiến độ kèm ảnh hiện trường'),
        createParagraph('        3.3.3. Đặc tả UC-03: Đối soát GPS 1km & Chụp ảnh nghiệm thu hoàn thành'),
        createParagraph('        3.3.4. Đặc tả UC-04: Điều phối kỹ thuật viên tự động qua AI'),
        createParagraph('    3.4. Sơ đồ luồng dữ liệu (DFD - Data Flow Diagram)'),
        createParagraph('        3.4.1. DFD Mức ngữ cảnh (Context Level 0)'),
        createParagraph('        3.4.2. DFD Mức 1 (Level 1)'),
        createParagraph('    3.5. Sơ đồ thực thể liên kết (ERD - Entity-Relationship Diagram)'),
        createParagraph('    3.6. Sơ đồ lớp phần mềm (Class Diagram)'),
        createParagraph('    3.7. Sơ đồ hoạt động (Activity Diagrams) cho các quy trình chính'),
        createParagraph('        3.7.1. Hoạt động 1: Quy trình phân công thợ và báo cáo ảnh của Đội trưởng'),
        createParagraph('        3.7.2. Hoạt động 2: Quy trình kiểm tra GPS 1km và nghiệm thu ảnh của Kỹ thuật viên'),
        createParagraph('        3.7.3. Hoạt động 3: Quy trình điều phối tự động AI Dispatch'),

        new Paragraph({ spacing: { before: 150, after: 50 }, children: [] }),
        createParagraph('CHƯƠNG 4: THIẾT KẾ CƠ SỞ DỮ LIỆU VÀ KIẾN TRÚC HỆ THỐNG', { bold: true, color: '1A365D' }),
        createParagraph('    4.1. Kiến trúc tổng thể phần mềm (Clean Architecture + FastAPI + React Vite)'),
        createParagraph('    4.2. Thiết kế từ điển dữ liệu (Data Dictionary) các bảng chính'),
        createParagraph('    4.3. Thiết kế chỉ mục (Indexes) và ràng buộc toàn vẹn dữ liệu'),
        createParagraph('    4.4. Cơ chế đồng bộ dữ liệu thời gian thực (SignalR Realtime)'),
        createParagraph('    4.5. Thiết kế hạ tầng lưu trữ và giải pháp bảo mật dữ liệu'),

        new Paragraph({ spacing: { before: 150, after: 50 }, children: [] }),
        createParagraph('CHƯƠNG 5: HIỆN THỰC VÀ KẾT QUẢ TRIỂN KHAI HỆ THỐNG', { bold: true, color: '1A365D' }),
        createParagraph('    5.1. Môi trường phát triển và công nghệ sử dụng'),
        createParagraph('    5.2. Kết quả giao diện Phân hệ Đội trưởng thi công'),
        createParagraph('    5.3. Kết quả giao diện Phân hệ Kỹ thuật viên & Bản đồ GPS'),
        createParagraph('    5.4. Kết quả giao diện Dashboard Quản trị & Feed ảnh hiện trường'),
        createParagraph('    5.5. Kết quả giao diện Phân hệ Báo giá & Tư vấn AI'),
        createParagraph('    5.6. Đánh giá kiểm thử chức năng và hiệu năng phần mềm'),

        new Paragraph({ spacing: { before: 150, after: 50 }, children: [] }),
        createParagraph('CHƯƠNG 6: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN', { bold: true, color: '1A365D' }),
        createParagraph('    6.1. Những kết quả đã đạt được'),
        createParagraph('    6.2. Những điểm còn hạn chế'),
        createParagraph('    6.3. Hướng nghiên cứu và phát triển tiếp theo'),

        new Paragraph({ spacing: { before: 150, after: 50 }, children: [] }),
        createParagraph('TÀI LIỆU THAM KHẢO ......................................................................................................', { bold: true }),
        createParagraph('PHỤ LỤC .................................................................................................................................', { bold: true }),

        // ================= DANH MỤC VIẾT TẮT =================
        createPageBreak(),
        createParagraph('DANH MỤC CÁC TỪ VIẾT TẮT', { alignment: AlignmentType.CENTER, bold: true, size: 30, color: '1A365D' }),
        createPlaceholder('Bảng danh mục các chữ viết tắt: PCCC, AI, ERP, CRM, GPS, API, QR, TCVN...'),

        // ================= DANH MỤC BẢNG BIỂU =================
        createPageBreak(),
        createParagraph('DANH MỤC BẢNG BIỂU', { alignment: AlignmentType.CENTER, bold: true, size: 30, color: '1A365D' }),
        createPlaceholder('Liệt kê danh sách bảng: Bảng 2.1, Bảng 3.1, Bảng 4.1...'),

        // ================= DANH MỤC HÌNH ẢNH =================
        createPageBreak(),
        createParagraph('DANH MỤC HÌNH ẢNH / SƠ ĐỒ', { alignment: AlignmentType.CENTER, bold: true, size: 30, color: '1A365D' }),
        createPlaceholder('Liệt kê danh sách hình: Hình 1.1, Sơ đồ 3.1 BFD, Sơ đồ 3.2 Use Case, Sơ đồ 3.3 DFD...'),

        // ================= CHƯƠNG 1 =================
        createPageBreak(),
        createHeading1('CHƯƠNG 1: TỔNG QUAN VỀ ĐỀ TÀI VÀ KHẢO SÁT HIỆN TRẠNG'),
        createHeading2('1.1. Lý do chọn đề tài và tính cấp thiết'),
        createPlaceholder('Trình bày bối cảnh an toàn PCCC hiện nay, tính cấp thiết của việc áp dụng công nghệ số và AI...'),
        createHeading2('1.2. Mục tiêu nghiên cứu và phạm vi của đề tài'),
        createPlaceholder('Mục tiêu tổng quát, mục tiêu cụ thể và phạm vi giới hạn của dự án...'),
        createHeading2('1.3. Khảo sát hiện trạng công tác PCCC và chuyển đổi số'),
        createPlaceholder('Khảo sát thực tế các doanh nghiệp PCCC, các khó khăn trong quản lý thi công và kiểm tra định kỳ...'),
        createHeading2('1.4. Đối tượng và phương pháp nghiên cứu'),
        createPlaceholder('Đối tượng áp dụng, phương pháp thu thập dữ liệu, phân tích quy trình...'),
        createHeading2('1.5. Cấu trúc của báo cáo đồ án'),
        createPlaceholder('Tóm tắt nội dung chính của 6 chương trong đồ án...'),

        // ================= CHƯƠNG 2 =================
        createPageBreak(),
        createHeading1('CHƯƠNG 2: PHÂN TÍCH YÊU CẦU NGHIỆP VỤ (BUSINESS ANALYSIS)'),
        createHeading2('2.1. Phân hệ Quản lý thi công & Đội trưởng công trình'),
        createHeading3('2.1.1. Quản lý danh mục dự án và tiến độ thi công'),
        createPlaceholder('Quy trình theo dõi tiến độ tổng thể công trình PCCC...'),
        createHeading3('2.1.2. Cơ chế phân công tổ thợ nội bộ (Nhân công 1, 2, 3, 4)'),
        createPlaceholder('Đặc tả quy tắc: Chỉ cấp tài khoản cho Đội trưởng, tổ thợ nội bộ được điều phối linh hoạt theo dự án...'),
        createHeading3('2.1.3. Báo cáo tiến độ hiện trường bằng hình ảnh thực tế'),
        createPlaceholder('Mô tả tính năng Đội trưởng tải ảnh hiện trường truyền trực tiếp về Dashboard Admin...'),
        createHeading3('2.1.4. Nghiệm thu bàn giao và kích hoạt bảo hành'),
        createPlaceholder('Quy trình khi tiến độ đạt 100% nghiệm thu chuyển giao...'),

        createHeading2('2.2. Phân hệ Tiếp nhận, Điều phối & Sửa chữa bảo trì'),
        createHeading3('2.2.1. Tiếp nhận sự cố PCCC từ khách hàng'),
        createPlaceholder('Luồng tiếp nhận báo hỏng thiết bị, phân loại mức độ khẩn cấp...'),
        createHeading3('2.2.2. Bản đồ số và điều phối kỹ thuật viên'),
        createPlaceholder('Giao diện bản đồ số, hiển thị vị trí khách hàng và điều hướng thợ...'),
        createHeading3('2.2.3. Ràng buộc vị trí GPS trong bán kính 1.0 km'),
        createPlaceholder('Mô tả quy tắc bắt buộc kỹ thuật viên phải ở trong bán kính 1km so với khách mới được bấm hoàn thành...'),
        createHeading3('2.2.4. Bắt buộc chụp/tải ảnh nghiệm thu hiện trường trước khi hoàn thành'),
        createPlaceholder('Mô tả quy tắc bắt buộc có ảnh chụp thiết bị sau sửa chữa mới cho phép chốt đơn...'),

        createHeading2('2.3. Phân hệ Bán hàng, Báo giá & Tư vấn PCCC AI'),
        createHeading3('2.3.1. Quản lý khách hàng (CRM) và hợp đồng kinh doanh'),
        createPlaceholder('Quản lý hồ sơ khách hàng, lịch sử hợp đồng...'),
        createHeading3('2.3.2. Chatbot AI tư vấn giải pháp tiêu chuẩn TCVN'),
        createPlaceholder('Ứng dụng RAG và LLM hỗ trợ tư vấn quy chuẩn PCCC...'),
        createHeading3('2.3.3. Lập dự toán tự động & Báo giá sơ bộ bằng AI'),
        createPlaceholder('Thuật toán bóc tách khối lượng và tính toán dự toán sơ bộ...'),

        createHeading2('2.4. Phân hệ Quản lý kho và Vòng đời thiết bị theo Serial / QR Code'),
        createHeading3('2.4.1. Quản lý tồn kho theo danh mục Model và Kho thực tế'),
        createPlaceholder('Theo dõi số lượng tồn, xuất kho công trình...'),
        createHeading3('2.4.2. Khởi tạo và quét mã QR Code thiết bị'),
        createPlaceholder('Quy trình tạo mã QR định danh cho từng bình chữa cháy / thiết bị...'),
        createHeading3('2.4.3. Theo dõi hạn bảo trì, nạp sạc bình chữa cháy định kỳ'),
        createPlaceholder('Hệ thống nhắc hạn bảo dưỡng định kỳ theo TCVN 3890...'),

        createHeading2('2.5. Các yêu cầu phi chức năng (Non-functional Requirements)'),
        createHeading3('2.5.1. Yêu cầu về hiệu năng và tải hệ thống'),
        createPlaceholder('Thời gian phản hồi API, khả năng chịu tải đồng thời...'),
        createHeading3('2.5.2. Yêu cầu về an toàn và bảo mật thông tin'),
        createPlaceholder('JWT authentication, Role-based Access Control, mã hóa mật khẩu...'),
        createHeading3('2.5.3. Khả năng mở rộng và tính tương thích nền tảng'),
        createPlaceholder('Tương thích đa nền tảng Responsive Web, thiết bị di động...'),

        // ================= CHƯƠNG 3 =================
        createPageBreak(),
        createHeading1('CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG (SYSTEM ANALYSIS & DESIGN)'),
        createHeading2('3.1. Sơ đồ phân rã chức năng nghiệp vụ (BFD - Business Function Diagram)'),
        createPlaceholder('Chèn hình vẽ BFD phân rã 6 khối nghiệp vụ từ file system_architecture.md...'),
        createHeading2('3.2. Sơ đồ Use Case tổng thể và phân hệ'),
        createPlaceholder('Chèn hình vẽ sơ đồ Use Case tổng thể và tương tác của các Actors...'),
        createHeading2('3.3. Đặc tả chi tiết các Use Case chính'),
        createHeading3('3.3.1. Đặc tả UC-01: Quản lý thi công & Phân công tổ thợ'),
        createPlaceholder('Chèn bảng đặc tả Use Case 01...'),
        createHeading3('3.3.2. Đặc tả UC-02: Báo cáo tiến độ kèm ảnh hiện trường'),
        createPlaceholder('Chèn bảng đặc tả Use Case 02...'),
        createHeading3('3.3.3. Đặc tả UC-03: Đối soát GPS 1km & Chụp ảnh nghiệm thu hoàn thành'),
        createPlaceholder('Chèn bảng đặc tả Use Case 03...'),
        createHeading3('3.3.4. Đặc tả UC-04: Điều phối kỹ thuật viên tự động qua AI'),
        createPlaceholder('Chèn bảng đặc tả Use Case 04...'),

        createHeading2('3.4. Sơ đồ luồng dữ liệu (DFD - Data Flow Diagram)'),
        createHeading3('3.4.1. DFD Mức ngữ cảnh (Context Level 0)'),
        createPlaceholder('Chèn sơ đồ DFD Level 0...'),
        createHeading3('3.4.2. DFD Mức 1 (Level 1)'),
        createPlaceholder('Chèn sơ đồ DFD Level 1 và mô tả các luồng dữ liệu...'),

        createHeading2('3.5. Sơ đồ thực thể liên kết (ERD - Entity-Relationship Diagram)'),
        createPlaceholder('Chèn sơ đồ ERD chi tiết các thực thể...'),
        createHeading2('3.6. Sơ đồ lớp phần mềm (Class Diagram)'),
        createPlaceholder('Chèn sơ đồ Class Diagram kiến trúc Clean Architecture...'),
        createHeading2('3.7. Sơ đồ hoạt động (Activity Diagrams) cho các quy trình chính'),
        createHeading3('3.7.1. Hoạt động 1: Quy trình phân công thợ và báo cáo ảnh của Đội trưởng'),
        createPlaceholder('Chèn Activity Diagram quy trình Đội trưởng thi công...'),
        createHeading3('3.7.2. Hoạt động 2: Quy trình kiểm tra GPS 1km và nghiệm thu ảnh của Kỹ thuật viên'),
        createPlaceholder('Chèn Activity Diagram quy trình Kỹ thuật viên hoàn thành đơn...'),
        createHeading3('3.7.3. Hoạt động 3: Quy trình điều phối tự động AI Dispatch'),
        createPlaceholder('Chèn Activity Diagram thuật toán điều phối...'),

        // ================= CHƯƠNG 4 =================
        createPageBreak(),
        createHeading1('CHƯƠNG 4: THIẾT KẾ CƠ SỞ DỮ LIỆU VÀ KIẾN TRÚC HỆ THỐNG'),
        createHeading2('4.1. Kiến trúc tổng thể phần mềm (Clean Architecture + FastAPI + React Vite)'),
        createPlaceholder('Mô tả chi tiết 4 lớp Clean Architecture (Domain, Application, Infrastructure, API)...'),
        createHeading2('4.2. Thiết kế từ điển dữ liệu (Data Dictionary) các bảng chính'),
        createPlaceholder('Liệt kê cấu trúc bảng Projects, ProjectProgressLogs, ServiceRequests, ServiceRequestStatusLogs, EquipmentAssets... từ database_design.md...'),
        createHeading2('4.3. Thiết kế chỉ mục (Indexes) và ràng buộc toàn vẹn dữ liệu'),
        createPlaceholder('Trình bày danh mục Unique Index, Composite Index và các quy tắc toàn vẹn...'),
        createHeading2('4.4. Cơ chế đồng bộ dữ liệu thời gian thực (SignalR Realtime)'),
        createPlaceholder('Mô tả cách thức SignalR Hub phát tín hiệu cập nhật ảnh và trạng thái tức thì...'),
        createHeading2('4.5. Thiết kế hạ tầng lưu trữ và giải pháp bảo mật dữ liệu'),
        createPlaceholder('Mô tả lưu trữ ảnh MinIO/Cloud, mã hóa mật khẩu và phân quyền Token...'),

        // ================= CHƯƠNG 5 =================
        createPageBreak(),
        createHeading1('CHƯƠNG 5: HIỆN THỰC VÀ KẾT QUẢ TRIỂN KHAI HỆ THỐNG'),
        createHeading2('5.1. Môi trường phát triển và công nghệ sử dụng'),
        createPlaceholder('Bảng liệt kê: .NET 8, C#, React, TypeScript, Material-UI, Leaflet, MySQL, Hangfire...'),
        createHeading2('5.2. Kết quả giao diện Phân hệ Đội trưởng thi công'),
        createPlaceholder('Chèn hình ảnh giao diện phân công Nhân công 1-2-3-4 và hộp thoại báo cáo ảnh hiện trường...'),
        createHeading2('5.3. Kết quả giao diện Phân hệ Kỹ thuật viên & Bản đồ GPS'),
        createPlaceholder('Chèn hình ảnh giao diện bản đồ điều phối, kiểm tra GPS 1km và popup bắt buộc ảnh nghiệm thu...'),
        createHeading2('5.4. Kết quả giao diện Dashboard Quản trị & Feed ảnh hiện trường'),
        createPlaceholder('Chèn hình ảnh Dashboard Admin hiển thị thống kê và feed ảnh thực tế từ công trình...'),
        createHeading2('5.5. Kết quả giao diện Phân hệ Báo giá & Tư vấn AI'),
        createPlaceholder('Chèn hình ảnh tính năng tư vấn và báo giá sơ bộ AI...'),
        createHeading2('5.6. Đánh giá kiểm thử chức năng và hiệu năng phần mềm'),
        createPlaceholder('Trình bày kết quả test chức năng, kiểm thử đơn vị và tốc độ xử lý...'),

        // ================= CHƯƠNG 6 =================
        createPageBreak(),
        createHeading1('CHƯƠNG 6: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN'),
        createHeading2('6.1. Những kết quả đã đạt được'),
        createPlaceholder('Tổng kết các tính năng đã hoàn thành so với mục tiêu đề ra ban đầu...'),
        createHeading2('6.2. Những điểm còn hạn chế'),
        createPlaceholder('Chỉ ra các mặt chưa tối ưu cần cải thiện...'),
        createHeading2('6.3. Hướng nghiên cứu và phát triển tiếp theo'),
        createPlaceholder('Đề xuất hướng phát triển ứng dụng di động Native, tích hợp IoT cảm biến khói tự động...'),

        // ================= TÀI LIỆU THAM KHẢO =================
        createPageBreak(),
        createHeading1('TÀI LIỆU THAM KHẢO'),
        createPlaceholder('Liệt kê danh mục tài liệu: Tiêu chuẩn TCVN 3890:2023, Tài liệu Clean Architecture Microsoft, Tài liệu React Vite...'),

        // ================= PHỤ LỤC =================
        createPageBreak(),
        createHeading1('PHỤ LỤC'),
        createPlaceholder('Mã nguồn tiêu biểu, hướng dẫn cài đặt và vận hành hệ thống...')
      ]
    }
  ]
});

Packer.toBuffer(doc).then((buffer) => {
  const outputPath = 'd:/FIREGUARD-AI/BAO_CAO_DO_AN_FIREGUARD_AI.docx';
  fs.writeFileSync(outputPath, buffer);
  console.log('SUCCESS: Generated Word document at:', outputPath);
}).catch(err => {
  console.error('ERROR generating docx:', err);
});
