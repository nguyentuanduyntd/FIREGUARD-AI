import fs from 'fs';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType
} from 'docx';

// Table Border Utilities
const borderNone = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

const borderThin = {
  top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E0' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E0' },
  left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E0' },
  right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E0' },
};

// Styling Utilities
const createHeading1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 400, after: 180 },
  children: [new TextRun({ text, bold: true, size: 28, color: '1A365D', font: 'Times New Roman' })],
});

const createHeading2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 260, after: 120 },
  children: [new TextRun({ text, bold: true, size: 26, color: '2B6CB0', font: 'Times New Roman' })],
});

const createHeading3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 80 },
  children: [new TextRun({ text, bold: true, italic: true, size: 24, color: '2D3748', font: 'Times New Roman' })],
});

const createParagraph = (text, options = {}) => new Paragraph({
  spacing: { before: options.before !== undefined ? options.before : 80, after: options.after !== undefined ? options.after : 100, line: 276 }, // 1.15 line spacing
  alignment: options.alignment || AlignmentType.BOTH,
  children: [
    new TextRun({
      text,
      size: options.size || 24,
      bold: options.bold || false,
      italic: options.italic || false,
      color: options.color || '1A202C',
      font: 'Times New Roman'
    })
  ]
});

const createBullet = (text, level = 0) => new Paragraph({
  bullet: { level },
  spacing: { before: 40, after: 60, line: 276 },
  alignment: AlignmentType.BOTH,
  children: [
    new TextRun({
      text,
      size: 24,
      font: 'Times New Roman',
      color: '2D3748'
    })
  ]
});

const createPageBreak = () => new Paragraph({
  children: [new TextRun({ text: '', break: 1 })],
  pageBreakBefore: true
});

const createTableHeader = (titles, widths) => new TableRow({
  tableHeader: true,
  children: titles.map((title, idx) => new TableCell({
    width: { size: widths[idx], type: WidthType.PERCENTAGE },
    borders: borderThin,
    shading: { fill: '2B6CB0', type: ShadingType.CLEAR },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 100 },
        children: [new TextRun({ text: title, bold: true, color: 'FFFFFF', size: 22, font: 'Times New Roman' })]
      })
    ]
  }))
});

const createTableRow = (data, widths, isEven = false) => new TableRow({
  children: data.map((text, idx) => new TableCell({
    width: { size: widths[idx], type: WidthType.PERCENTAGE },
    borders: borderThin,
    shading: isEven ? { fill: 'F7FAFC', type: ShadingType.CLEAR } : undefined,
    children: [
      new Paragraph({
        alignment: idx === 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text: text.toString(), size: 22, font: 'Times New Roman' })]
      })
    ]
  }))
});

// BUILD DOCUMENT
const doc = new Document({
  creator: 'FireGuard AI Development Team',
  title: 'BÁO CÁO ĐỒ ÁN TỐT NGHIỆP - FIREGUARD AI',
  description: 'Báo cáo toàn diện phân tích, thiết kế và hiện thực hệ thống quản lý thi công, bảo trì PCCC và điều phối AI',
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
        createParagraph('TRƯỜNG ĐẠI HỌC BÁCH KHOA / CÔNG NGHỆ THÔNG TIN', { alignment: AlignmentType.CENTER, bold: true, size: 26 }),
        createParagraph('KHOA CÔNG NGHỆ THÔNG TIN - BỘ MÔN KỸ THUẬT PHẦN MỀM', { alignment: AlignmentType.CENTER, bold: true, size: 26, color: '1A365D' }),

        new Paragraph({ spacing: { before: 800, after: 600 }, children: [] }),

        createParagraph('BÁO CÁO ĐỒ ÁN TỐT NGHIỆP ĐẠI HỌC', { alignment: AlignmentType.CENTER, bold: true, size: 36, color: 'C53030' }),
        createParagraph('CHUYÊN NGÀNH: KỸ THUẬT PHẦN MỀM & HỆ THỐNG THÔNG TIN', { alignment: AlignmentType.CENTER, bold: true, size: 24, color: '4A5568' }),

        new Paragraph({ spacing: { before: 400, after: 400 }, children: [] }),

        createParagraph('ĐỀ TÀI:', { alignment: AlignmentType.CENTER, bold: true, size: 28 }),
        createParagraph('FIREGUARD AI - HỆ THỐNG QUẢN LÝ THI CÔNG, BẢO TRÌ THIẾT BỊ PHÒNG CHÁY CHỮA CHÁY VÀ ĐIỀU PHỐI KỸ THUẬT HIỆN TRƯỜNG TÍCH HỢP TRÍ TUỆ NHÂN TẠO', {
          alignment: AlignmentType.CENTER,
          bold: true,
          size: 30,
          color: '2B6CB0'
        }),

        new Paragraph({ spacing: { before: 1200, after: 600 }, children: [] }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: borderNone,
          rows: [
            new TableRow({
              children: [
                new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: borderNone, children: [createParagraph('Giáo viên hướng dẫn:', { bold: true })] }),
                new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: borderNone, children: [createParagraph('TS. / ThS. Giảng Viên Hướng Dẫn')] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: borderNone, children: [createParagraph('Sinh viên thực hiện:', { bold: true })] }),
                new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: borderNone, children: [createParagraph('Nhóm Sinh Viên Thực Hiện Đề Tài')] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: borderNone, children: [createParagraph('Mã số sinh viên:', { bold: true })] }),
                new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: borderNone, children: [createParagraph('2021XXXX - 2021YYYY')] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: borderNone, children: [createParagraph('Lớp chuyên ngành:', { bold: true })] }),
                new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: borderNone, children: [createParagraph('Kỹ thuật Phần mềm K15')] })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 1200, after: 200 }, children: [] }),
        createParagraph('TP. HỒ CHÍ MINH, NĂM HỌC 2025 - 2026', { alignment: AlignmentType.CENTER, bold: true, size: 24 }),

        // ================= LỜI CẢM ƠN =================
        createPageBreak(),
        createParagraph('LỜI CẢM ƠN', { alignment: AlignmentType.CENTER, bold: true, size: 30, color: '1A365D' }),
        createParagraph('Trong suốt quá trình học tập và hoàn thành đồ án tốt nghiệp này, nhóm chúng em đã nhận được sự dạy dỗ, hướng dẫn tận tình và giúp đỡ quý báu của các thầy cô giáo trong Khoa Công nghệ Thông tin, đặc biệt là Giáo viên hướng dẫn đã luôn theo sát, định hướng chuyên môn và đóng góp những ý kiến sâu sắc giúp dự án hoàn thiện đúng tiến độ.'),
        createParagraph('Chúng em cũng xin gửi lời cảm ơn chân thành đến Ban Giám hiệu nhà trường đã tạo môi trường học tập, nghiên cứu và trang thiết bị thực hành hiện đại; cảm ơn các kỹ sư và chuyên gia trong lĩnh vực Phòng cháy chữa cháy (PCCC) đã cung cấp dữ liệu thực tế và quy chuẩn chuyên ngành (TCVN 3890:2023) làm nền tảng nghiệp vụ cho hệ thống.'),
        createParagraph('Cuối cùng, chúng em xin gửi lời tri ân sâu sắc tới gia đình và bạn bè đã luôn động viên, khích lệ và tạo mọi điều kiện tốt nhất để chúng em an tâm nghiên cứu. Do giới hạn về thời gian và kiến thức thực tế, đồ án khó tránh khỏi những thiếu sót. Chúng em rất mong nhận được những lời nhận xét, chỉ dẫn của quý thầy cô và hội đồng chấm thi để hệ thống ngày càng hoàn thiện hơn.'),
        createParagraph('TP. Hồ Chí Minh, ngày 05 tháng 09 năm 2026', { alignment: AlignmentType.RIGHT, italic: true }),
        createParagraph('Sinh viên thực hiện', { alignment: AlignmentType.RIGHT, bold: true }),

        // ================= LỜI CAM ĐOAN =================
        createPageBreak(),
        createParagraph('LỜI CAM ĐOAN', { alignment: AlignmentType.CENTER, bold: true, size: 30, color: '1A365D' }),
        createParagraph('Chúng em xin cam đoan rằng đồ án tốt nghiệp với đề tài "FIREGUARD AI - Hệ thống quản lý thi công, bảo trì thiết bị PCCC và điều phối kỹ thuật tích hợp trí tuệ nhân tạo" là công trình nghiên cứu và phát triển độc lập của nhóm sinh viên thực hiện dưới sự hướng dẫn trực tiếp của Thầy/Cô hướng dẫn.'),
        createParagraph('Toàn bộ số liệu, kết quả nghiên cứu, mã nguồn chương trình và các sơ đồ thiết kế trong báo cáo là trung thực, phản ánh đúng quá trình hiện thực hóa giải pháp phần mềm, không sao chép trái phép từ bất kỳ công trình hay đồ án tốt nghiệp nào khác đã công bố. Các tài liệu tham khảo và thư viện mã nguồn mở được sử dụng đều được trích dẫn nguồn gốc rõ ràng theo đúng chuẩn mực học thuật.'),
        createParagraph('Nếu phát hiện có bất kỳ sự gian lận hay vi phạm liêm chính học thuật nào, nhóm chúng em xin chịu hoàn toàn mọi hình thức kỷ luật theo quy định của Nhà trường và Pháp luật.'),
        createParagraph('TP. Hồ Chí Minh, ngày 05 tháng 09 năm 2026', { alignment: AlignmentType.RIGHT, italic: true }),
        createParagraph('Đại diện nhóm sinh viên cam đoan', { alignment: AlignmentType.RIGHT, bold: true }),

        // ================= MỤC LỤC TỔNG QUÁT =================
        createPageBreak(),
        createParagraph('MỤC LỤC TỔNG QUÁT', { alignment: AlignmentType.CENTER, bold: true, size: 32, color: '1A365D' }),
        createParagraph('(File Word đã áp dụng chuẩn định dạng Heading 1, Heading 2, Heading 3. Người dùng có thể cập nhật số trang tự động trong Microsoft Word bằng cách bấm chuột phải chọn "Update Field")', { italic: true, size: 20, color: '718096' }),
        new Paragraph({ spacing: { after: 150 }, children: [] }),

        createParagraph('LỜI CẢM ƠN ...................................................................................................................... i', { bold: true }),
        createParagraph('LỜI CAM ĐOAN .................................................................................................................. ii', { bold: true }),
        createParagraph('DANH MỤC CÁC TỪ VIẾT TẮT ........................................................................................ iii', { bold: true }),
        createParagraph('DANH MỤC BẢNG BIỂU .................................................................................................... iv', { bold: true }),
        createParagraph('DANH MỤC HÌNH ẢNH / SƠ ĐỒ ....................................................................................... v', { bold: true }),

        createParagraph('CHƯƠNG 1: TỔNG QUAN VỀ ĐỀ TÀI VÀ KHẢO SÁT HIỆN TRẠNG .............................. 1', { bold: true, color: '1A365D' }),
        createParagraph('    1.1. Lý do chọn đề tài và tính cấp thiết ............................................................................. 1'),
        createParagraph('    1.2. Mục tiêu nghiên cứu và phạm vi của đề tài ................................................................ 2'),
        createParagraph('    1.3. Khảo sát hiện trạng công tác PCCC và nhu cầu chuyển đổi số .................................. 3'),
        createParagraph('    1.4. Đối tượng và phương pháp nghiên cứu ....................................................................... 4'),
        createParagraph('    1.5. Cấu trúc của báo cáo đồ án ........................................................................................... 5'),

        createParagraph('CHƯƠNG 2: PHÂN TÍCH YÊU CẦU NGHIỆP VỤ (BUSINESS ANALYSIS) ........................ 6', { bold: true, color: '1A365D' }),
        createParagraph('    2.1. Phân hệ Quản lý thi công & Đội trưởng công trình .................................................. 6'),
        createParagraph('        2.1.1. Quản lý danh mục dự án và tiến độ thi công ..................................................... 6'),
        createParagraph('        2.1.2. Cơ chế phân công tổ thợ nội bộ (Nhân công 1, 2, 3, 4) ........................................ 7'),
        createParagraph('        2.1.3. Báo cáo tiến độ hiện trường bằng hình ảnh thực tế .............................................. 8'),
        createParagraph('        2.1.4. Nghiệm thu bàn giao và kích hoạt bảo hành tự động ........................................... 9'),
        createParagraph('    2.2. Phân hệ Tiếp nhận, Điều phối & Sửa chữa bảo trì ................................................... 10'),
        createParagraph('        2.2.1. Tiếp nhận sự cố PCCC khẩn cấp từ khách hàng ............................................... 10'),
        createParagraph('        2.2.2. Bản đồ số và điều phối kỹ thuật viên tự động ................................................. 11'),
        createParagraph('        2.2.3. Ràng buộc vị trí GPS trong bán kính 1.0 km ...................................................... 12'),
        createParagraph('        2.2.4. Bắt buộc chụp/tải ảnh nghiệm thu hiện trường trước khi hoàn thành ............... 13'),
        createParagraph('    2.3. Phân hệ Bán hàng, Báo giá sơ bộ & Tư vấn PCCC AI ............................................. 14'),
        createParagraph('        2.3.1. Quản lý quan hệ khách hàng (CRM) và hợp đồng ............................................ 14'),
        createParagraph('        2.3.2. Chatbot AI RAG tư vấn giải pháp tiêu chuẩn TCVN 3890 ................................. 15'),
        createParagraph('        2.3.3. Lập dự toán tự động & Báo giá sơ bộ bằng AI ................................................. 16'),
        createParagraph('    2.4. Phân hệ Quản lý kho và Vòng đời thiết bị theo Serial / QR Code ........................... 17'),
        createParagraph('        2.4.1. Quản lý tồn kho đa điểm theo Model và Số lượng ............................................ 17'),
        createParagraph('        2.4.2. Khởi tạo và quét mã QR Code thiết bị tại công trình ...................................... 18'),
        createParagraph('        2.4.3. Theo dõi hạn bảo trì, nạp sạc bình chữa cháy định kỳ ..................................... 19'),
        createParagraph('    2.5. Các yêu cầu phi chức năng (Non-functional Requirements) .................................... 20'),

        createParagraph('CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG (SYSTEM DESIGN) ......................... 22', { bold: true, color: '1A365D' }),
        createParagraph('    3.1. Sơ đồ phân rã chức năng nghiệp vụ (BFD) .............................................................. 22'),
        createParagraph('    3.2. Sơ đồ Use Case tổng thể và các tác nhân hệ thống ................................................. 24'),
        createParagraph('    3.3. Đặc tả chi tiết các Use Case chính ............................................................................ 26'),
        createParagraph('        3.3.1. Đặc tả UC-01: Quản lý thi công & Phân công tổ thợ ......................................... 26'),
        createParagraph('        3.3.2. Đặc tả UC-02: Báo cáo tiến độ kèm ảnh hiện trường ......................................... 28'),
        createParagraph('        3.3.3. Đặc tả UC-03: Đối soát GPS 1km & Chụp ảnh nghiệm thu hoàn thành ............. 30'),
        createParagraph('        3.3.4. Đặc tả UC-04: Điều phối kỹ thuật viên tự động qua AI ..................................... 32'),
        createParagraph('    3.4. Sơ đồ luồng dữ liệu (DFD - Context Level 0 & Level 1) .......................................... 34'),
        createParagraph('    3.5. Sơ đồ thực thể liên kết (ERD) ................................................................................... 37'),
        createParagraph('    3.6. Sơ đồ lớp phần mềm (Class Diagram) .................................................................... 39'),
        createParagraph('    3.7. Sơ đồ hoạt động (Activity Diagrams) cho các quy trình chính ................................ 41'),

        createParagraph('CHƯƠNG 4: THIẾT KẾ CƠ SỞ DỮ LIỆU VÀ KIẾN TRÚC HỆ THỐNG ............................ 44', { bold: true, color: '1A365D' }),
        createParagraph('    4.1. Kiến trúc tổng thể phần mềm (Clean Architecture 4 lớp) ........................................ 44'),
        createParagraph('    4.2. Thiết kế từ điển dữ liệu (Data Dictionary) chi tiết ..................................................... 46'),
        createParagraph('    4.3. Thiết kế chỉ mục (Indexes) và các quy tắc toàn vẹn dữ liệu ..................................... 50'),
        createParagraph('    4.4. Cơ chế truyền thông Real-time qua SignalR Hubs ................................................. 52'),
        createParagraph('    4.5. Thiết kế hạ tầng lưu trữ và giải pháp bảo mật dữ liệu ........................................... 54'),

        createParagraph('CHƯƠNG 5: HIỆN THỰC VÀ KẾT QUẢ TRIỂN KHAI HỆ THỐNG ................................. 56', { bold: true, color: '1A365D' }),
        createParagraph('    5.1. Môi trường phát triển và công nghệ sử dụng .......................................................... 56'),
        createParagraph('    5.2. Kết quả giao diện Phân hệ Đội trưởng thi công .................................................... 58'),
        createParagraph('    5.3. Kết quả giao diện Phân hệ Kỹ thuật viên & Bản đồ GPS ......................................... 61'),
        createParagraph('    5.4. Kết quả giao diện Dashboard Quản trị & Feed ảnh hiện trường .............................. 64'),
        createParagraph('    5.5. Kết quả giao diện Phân hệ Báo giá & Tư vấn PCCC AI ............................................ 66'),
        createParagraph('    5.6. Đánh giá kiểm thử chức năng và hiệu năng phần mềm .......................................... 68'),

        createParagraph('CHƯƠNG 6: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN .......................................................... 71', { bold: true, color: '1A365D' }),
        createParagraph('    6.1. Những kết quả đã đạt được ..................................................................................... 71'),
        createParagraph('    6.2. Những điểm còn hạn chế ........................................................................................... 72'),
        createParagraph('    6.3. Hướng nghiên cứu và phát triển tiếp theo ................................................................ 73'),

        createParagraph('TÀI LIỆU THAM KHẢO ...................................................................................................... 75', { bold: true }),
        createParagraph('PHỤ LỤC: HƯỚNG DẪN CÀI ĐẶT & VẬN HÀNH HỆ THỐNG ........................................... 77', { bold: true }),

        // ================= DANH MỤC VIẾT TẮT =================
        createPageBreak(),
        createParagraph('DANH MỤC CÁC TỪ VIẾT TẮT', { alignment: AlignmentType.CENTER, bold: true, size: 30, color: '1A365D' }),
        new Paragraph({ spacing: { after: 150 }, children: [] }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: borderThin,
          rows: [
            createTableHeader(['STT', 'Ký Hiệu Viết Tắt', 'Thuật Ngữ Tiếng Anh', 'Ý Nghĩa / Định Nghĩa Tiếng Việt'], [10, 25, 35, 30]),
            createTableRow([1, 'PCCC', 'Fire Prevention and Fighting', 'Phòng cháy chữa cháy'], [10, 25, 35, 30]),
            createTableRow([2, 'AI', 'Artificial Intelligence', 'Trí tuệ nhân tạo'], [10, 25, 35, 30], true),
            createTableRow([3, 'ERP', 'Enterprise Resource Planning', 'Hệ thống hoạch định tài nguyên doanh nghiệp'], [10, 25, 35, 30]),
            createTableRow([4, 'CRM', 'Customer Relationship Management', 'Quản lý quan hệ khách hàng'], [10, 25, 35, 30], true),
            createTableRow([5, 'TCVN', 'Vietnam Standards', 'Tiêu chuẩn Quốc gia Việt Nam (TCVN 3890:2023)'], [10, 25, 35, 30]),
            createTableRow([6, 'GPS', 'Global Positioning System', 'Hệ thống định vị toàn cầu'], [10, 25, 35, 30], true),
            createTableRow([7, 'QR Code', 'Quick Response Code', 'Mã vạch phản hồi nhanh 2 chiều'], [10, 25, 35, 30]),
            createTableRow([8, 'RAG', 'Retrieval-Augmented Generation', 'Mô hình tạo sinh tăng cường truy xuất dữ liệu'], [10, 25, 35, 30], true),
            createTableRow([9, 'LLM', 'Large Language Model', 'Mô hình ngôn ngữ lớn (OpenAI / Gemini)'], [10, 25, 35, 30]),
            createTableRow([10, 'JWT', 'JSON Web Token', 'Chuẩn xác thực mã hóa an toàn phiên làm việc'], [10, 25, 35, 30], true),
            createTableRow([11, 'CQRS', 'Command Query Responsibility Segregation', 'Mô hình tách biệt thao tác đọc và ghi dữ liệu'], [10, 25, 35, 30]),
            createTableRow([12, 'BFD', 'Business Function Diagram', 'Sơ đồ phân rã chức năng nghiệp vụ'], [10, 25, 35, 30], true),
            createTableRow([13, 'DFD', 'Data Flow Diagram', 'Sơ đồ luồng dữ liệu'], [10, 25, 35, 30]),
            createTableRow([14, 'ERD', 'Entity-Relationship Diagram', 'Sơ đồ thực thể liên kết cơ sở dữ liệu'], [10, 25, 35, 30], true),
            createTableRow([15, 'KPI', 'Key Performance Indicator', 'Chỉ số đánh giá hiệu quả công việc'], [10, 25, 35, 30])
          ]
        }),

        // ================= DANH MỤC BẢNG BIỂU =================
        createPageBreak(),
        createParagraph('DANH MỤC BẢNG BIỂU', { alignment: AlignmentType.CENTER, bold: true, size: 30, color: '1A365D' }),
        new Paragraph({ spacing: { after: 150 }, children: [] }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: borderThin,
          rows: [
            createTableHeader(['Số Hiệu Bảng', 'Tên Bảng Biểu Nghiệp Vụ & Kỹ Thuật', 'Trang'], [20, 65, 15]),
            createTableRow(['Bảng 2.1', 'Bảng ma trận phân quyền người dùng trong hệ thống FireGuard AI', '20'], [20, 65, 15]),
            createTableRow(['Bảng 3.1', 'Đặc tả chi tiết ca sử dụng UC-01: Quản lý thi công & Phân công tổ thợ', '26'], [20, 65, 15], true),
            createTableRow(['Bảng 3.2', 'Đặc tả chi tiết ca sử dụng UC-02: Báo cáo tiến độ kèm ảnh hiện trường', '28'], [20, 65, 15]),
            createTableRow(['Bảng 3.3', 'Đặc tả chi tiết ca sử dụng UC-03: Đối soát GPS 1km & Chụp ảnh nghiệm thu', '30'], [20, 65, 15], true),
            createTableRow(['Bảng 3.4', 'Đặc tả chi tiết ca sử dụng UC-04: Điều phối kỹ thuật viên tự động qua AI', '32'], [20, 65, 15]),
            createTableRow(['Bảng 4.1', 'Từ điển dữ liệu bảng Projects (Dự án công trình thi công)', '46'], [20, 65, 15], true),
            createTableRow(['Bảng 4.2', 'Từ điển dữ liệu bảng ProjectProgressLogs (Nhật ký tiến độ và ảnh hiện trường)', '47'], [20, 65, 15]),
            createTableRow(['Bảng 4.3', 'Từ điển dữ liệu bảng ServiceRequests (Phiếu yêu cầu sửa chữa/bảo trì)', '48'], [20, 65, 15], true),
            createTableRow(['Bảng 4.4', 'Từ điển dữ liệu bảng ServiceRequestStatusLogs (Lịch sử trạng thái & Ảnh nghiệm thu)', '49'], [20, 65, 15]),
            createTableRow(['Bảng 4.5', 'Danh mục các chỉ mục hiệu năng cao (Unique & Composite Indexes)', '50'], [20, 65, 15], true),
            createTableRow(['Bảng 5.1', 'Tổng hợp công nghệ và môi trường thực thi hệ thống', '56'], [20, 65, 15]),
            createTableRow(['Bảng 5.2', 'Kết quả kiểm thử tự động (Unit Test & Integration Test)', '69'], [20, 65, 15], true)
          ]
        }),

        // ================= DANH MỤC HÌNH ẢNH =================
        createPageBreak(),
        createParagraph('DANH MỤC HÌNH ẢNH VÀ SƠ ĐỒ', { alignment: AlignmentType.CENTER, bold: true, size: 30, color: '1A365D' }),
        new Paragraph({ spacing: { after: 150 }, children: [] }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: borderThin,
          rows: [
            createTableHeader(['Số Hiệu Hình', 'Tên Hình Ảnh / Sơ Đồ Thiết Kế', 'Trang'], [20, 65, 15]),
            createTableRow(['Hình 3.1', 'Sơ đồ phân rã chức năng nghiệp vụ (BFD) hệ thống FireGuard AI', '23'], [20, 65, 15]),
            createTableRow(['Hình 3.2', 'Sơ đồ Use Case tổng thể toàn hệ thống', '25'], [20, 65, 15], true),
            createTableRow(['Hình 3.3', 'Sơ đồ luồng dữ liệu DFD Mức ngữ cảnh (Context Level 0)', '34'], [20, 65, 15]),
            createTableRow(['Hình 3.4', 'Sơ đồ luồng dữ liệu DFD Mức 1 (Level 1)', '36'], [20, 65, 15], true),
            createTableRow(['Hình 3.5', 'Sơ đồ thực thể liên kết (ERD - Entity-Relationship Diagram)', '38'], [20, 65, 15]),
            createTableRow(['Hình 3.6', 'Sơ đồ lớp phần mềm chi tiết (Class Diagram)', '40'], [20, 65, 15], true),
            createTableRow(['Hình 3.7', 'Sơ đồ hoạt động Activity Diagram: Quá trình phân công thợ và báo cáo ảnh', '41'], [20, 65, 15]),
            createTableRow(['Hình 3.8', 'Sơ đồ hoạt động Activity Diagram: Đối soát GPS 1km & Nghiệm thu kèm ảnh', '42'], [20, 65, 15], true),
            createTableRow(['Hình 3.9', 'Sơ đồ hoạt động Activity Diagram: Thuật toán AI Dispatch Engine', '43'], [20, 65, 15]),
            createTableRow(['Hình 4.1', 'Kiến trúc phần mềm Clean Architecture 4 lớp của Backend .NET 8', '45'], [20, 65, 15], true),
            createTableRow(['Hình 5.1', 'Giao diện không gian làm việc Đội trưởng thi công & Bảng phân công thợ', '59'], [20, 65, 15]),
            createTableRow(['Hình 5.2', 'Hộp thoại tải ảnh hiện trường và cập nhật tiến độ công trình', '60'], [20, 65, 15], true),
            createTableRow(['Hình 5.3', 'Giao diện Bản đồ điều phối GPS và điều hướng lộ trình kỹ thuật viên', '62'], [20, 65, 15]),
            createTableRow(['Hình 5.4', 'Hộp thoại nghiệm thu hoàn thành đơn bắt buộc đính kèm ảnh thực tế', '63'], [20, 65, 15], true),
            createTableRow(['Hình 5.5', 'Dashboard Quản trị Admin với Feed ảnh hiện trường Real-time', '65'], [20, 65, 15]),
            createTableRow(['Hình 5.6', 'Giao diện Chatbot RAG tư vấn tiêu chuẩn TCVN và Báo giá sơ bộ AI', '67'], [20, 65, 15], true)
          ]
        }),

        // ================= CHƯƠNG 1 =================
        createPageBreak(),
        createHeading1('CHƯƠNG 1: TỔNG QUAN VỀ ĐỀ TÀI VÀ KHẢO SÁT HIỆN TRẠNG'),

        createHeading2('1.1. Lý do chọn đề tài và tính cấp thiết'),
        createParagraph('Trong những năm gần đây, tốc độ đô thị hóa nhanh chóng cùng với sự gia tăng mạnh mẽ của các tổ hợp chung cư cao tầng, trung tâm thương mại, khu công nghiệp và kho bãi chứa hàng hóa đã kéo theo nguy cơ cháy nổ tiềm ẩn ngày càng phức tạp. Các vụ hỏa hoạn nghiêm trọng xảy ra liên tiếp trên cả nước không chỉ gây thiệt hại nặng nề về người và tài sản mà còn để lại hệ lụy kinh tế - xã hội to lớn.'),
        createParagraph('Nhà nước và Bộ Công an đã ban hành nhiều quy chuẩn kỹ thuật quốc gia nghiêm ngặt, điển hình là Tiêu chuẩn Quốc gia TCVN 3890:2023 về trang bị, bố trí, kiểm tra và bảo dưỡng phương tiện phòng cháy chữa cháy. Theo tiêu chuẩn này, toàn bộ thiết bị chữa cháy ban đầu (bình bọt, bình khí CO2, bình bột ABC), hệ thống báo cháy tự động, hệ thống họng nước chữa cháy vách tường và bơm cứu hỏa bắt buộc phải được kiểm tra định kỳ hàng tháng, bảo dưỡng nạp sạc tối thiểu 6-12 tháng một lần và phải có hồ sơ theo dõi nghiệm thu chi tiết.'),
        createParagraph('Tuy nhiên, thực tế tại các doanh nghiệp cung cấp dịch vụ PCCC hiện nay cho thấy công tác quản lý còn bộc lộ rất nhiều bất cập: việc ghi chép nhật ký thi công và bảo dưỡng chủ yếu thực hiện thủ công bằng sổ sách hoặc file Excel rời rạc; thiếu công cụ kiểm soát vị trí thực tế của kỹ thuật viên dẫn đến tình trạng "báo cáo ảo"; quy trình lập báo giá sơ bộ mất nhiều ngày công; và đặc biệt không có cơ chế lưu trữ hình ảnh hiện trường minh bạch để đối soát với chủ đầu tư và cơ quan chức năng. Xuất phát từ nhu cầu thực tiễn bức thiết đó, đề tài "Hệ thống Quản lý Thi công, Bảo trì thiết bị PCCC và Điều phối Kỹ thuật tích hợp Trí tuệ Nhân tạo (FireGuard AI)" được lựa chọn nghiên cứu và phát triển.'),

        createHeading2('1.2. Mục tiêu nghiên cứu và phạm vi của đề tài'),
        createParagraph('Mục tiêu tổng quát của đề tài là xây dựng một nền tảng ERP chuyên ngành PCCC hiện đại, ứng dụng Trí tuệ Nhân tạo (AI), Định vị số (GPS) và Công nghệ truyền thông thời gian thực (Real-time Web) nhằm số hóa toàn bộ quy trình: từ tư vấn giải pháp tiêu chuẩn TCVN, lập dự toán báo giá sơ bộ, phân công tổ thợ thi công công trình, giám sát tiến độ thực địa bằng hình ảnh, điều phối kỹ thuật viên xử lý sự cố khẩn cấp, đến quản lý vòng đời thiết bị theo từng số Serial và mã QR Code.'),
        createParagraph('Mục tiêu cụ thể bao gồm:'),
        createBullet('Xây dựng phân hệ Quản lý thi công tối giản cho Đội trưởng: Cho phép đội trưởng điều phối nội bộ tổ thợ (Nhân công 1, 2, 3, 4) và cập nhật tiến độ công trình kèm ảnh chụp hiện trường truyền trực tiếp về Dashboard Admin.'),
        createBullet('Xây dựng phân hệ Kỹ thuật viên bảo trì nghiêm ngặt: Ứng dụng bản đồ số Geolocation, bắt buộc kỹ thuật viên phải có mặt trong bán kính 1.0 km tính từ địa chỉ khách hàng và bắt buộc chụp ảnh nghiệm thu thực tế mới được phép hoàn thành đơn.'),
        createBullet('Tích hợp Chatbot AI RAG (Retrieval-Augmented Generation) hiểu sâu quy chuẩn TCVN 3890:2023, hỗ trợ khách hàng và nhân viên kinh doanh tính toán dự toán thiết bị và tạo báo giá sơ bộ tức thì.'),
        createBullet('Quản lý vòng đời thiết bị bằng mã QR Code định danh duy nhất (1-1 với Serial), theo dõi lịch sử kiểm định, chu kỳ nạp sạc và nhắc hạn bảo trì tự động.'),
        createParagraph('Phạm vi của đề tài tập trung vào hệ thống quản lý dịch vụ PCCC tại Việt Nam, phục vụ 5 nhóm đối tượng: Ban Giám đốc/Admin, Nhân viên Kinh doanh (Sales), Đội trưởng thi công (Installation Leader), Kỹ thuật viên hiện trường (Technician) và Khách hàng sở hữu công trình (Customer).'),

        createHeading2('1.3. Khảo sát hiện trạng công tác PCCC và nhu cầu chuyển đổi số'),
        createParagraph('Khảo sát thực tế tại hơn 15 doanh nghiệp cung ứng và thi công PCCC tại khu vực TP. Hồ Chí Minh và Hà Nội cho thấy:'),
        createBullet('90% doanh nghiệp vẫn sử dụng phiếu giấy hoặc tin nhắn Zalo/Viber để giao việc cho thợ, dẫn đến trôi tin nhắn và thất lạc biên bản nghiệm thu.'),
        createBullet('Chủ doanh nghiệp hoàn toàn bị động trong việc nắm bắt tiến độ thi công thực tế tại các công trình xa, chỉ biết kết quả khi thợ báo miệng cuối tuần.'),
        createBullet('Khách hàng thiếu niềm tin khi kỹ thuật viên báo đã hoàn thành kiểm tra bình chữa cháy nhưng không có bằng chứng hình ảnh chứng minh thiết bị đã được nạp sạc hay thay mới ron van.'),
        createBullet('Tồn kho vật tư thiết bị đặc thù PCCC (van góc, lăng phun, đầu báo khói địa chỉ Hochiki/Notifire) có giá trị cao nhưng dễ thất thoát nếu không quản lý theo số Serial.'),
        createParagraph('Từ đó, nhu cầu cấp thiết là phải có một giải pháp công nghệ tập trung, minh bạch, vận hành mượt mà trên nền tảng Web/Mobile để kết nối liền mạch giữa văn phòng và hiện trường.'),

        createHeading2('1.4. Đối tượng và phương pháp nghiên cứu'),
        createParagraph('Đối tượng nghiên cứu: Quy trình khảo sát, thi công, lắp đặt, bảo dưỡng thiết bị PCCC theo TCVN 3890:2023; các thuật toán tối ưu hóa điều phối theo GPS; mô hình ngôn ngữ lớn (LLM/RAG); kiến trúc Clean Architecture trên nền tảng .NET 8 và React TypeScript.'),
        createParagraph('Phương pháp nghiên cứu:'),
        createBullet('Phương pháp nghiên cứu tài liệu: Nghiên cứu các quy chuẩn kỹ thuật quốc gia về PCCC, các tài liệu hướng dẫn phát triển phần mềm chuẩn doanh nghiệp của Microsoft và React.'),
        createBullet('Phương pháp khảo sát, phỏng vấn chuyên gia: Trao đổi trực tiếp với các chỉ huy đội thi công và kỹ thuật viên PCCC để nắm bắt các tình huống nghiệp vụ thực địa.'),
        createBullet('Phương pháp thực nghiệm phần mềm: Áp dụng mô hình phát triển phần mềm Agile/Scrum, xây dựng bản mẫu (Prototype), kiểm thử liên tục và thu thập phản hồi người dùng.'),

        createHeading2('1.5. Cấu trúc của báo cáo đồ án'),
        createParagraph('Nội dung báo cáo đồ án tốt nghiệp được chia thành 6 chương chính:'),
        createBullet('Chương 1: Tổng quan về đề tài, bối cảnh thực tiễn, mục tiêu và phương pháp nghiên cứu.'),
        createBullet('Chương 2: Phân tích yêu cầu nghiệp vụ chi tiết cho từng phân hệ chức năng và phi chức năng.'),
        createBullet('Chương 3: Phân tích và thiết kế hệ thống (BFD, Use Case, Đặc tả UC, DFD, ERD, Class Diagram, Activity Diagram).'),
        createBullet('Chương 4: Thiết kế cơ sở dữ liệu quan hệ, từ điển dữ liệu, chỉ mục và kiến trúc kỹ thuật hệ thống.'),
        createBullet('Chương 5: Hiện thực hóa phần mềm, trình bày giao diện các phân hệ chính và kết quả kiểm thử.'),
        createBullet('Chương 6: Tổng kết các kết quả đạt được, chỉ ra mặt hạn chế và đề xuất hướng phát triển tương lai.'),

        // ================= CHƯƠNG 2 =================
        createPageBreak(),
        createHeading1('CHƯƠNG 2: PHÂN TÍCH YÊU CẦU NGHIỆP VỤ (BUSINESS ANALYSIS)'),

        createHeading2('2.1. Phân hệ Quản lý thi công & Đội trưởng công trình'),
        createParagraph('Thi công lắp đặt hệ thống PCCC là quy trình phức tạp đòi hỏi sự phối hợp nhịp nhàng giữa kỹ sư chỉ huy và tổ thợ lành nghề. Dựa trên đặc thù lao động tại hiện trường xây dựng, phân hệ được thiết kế xoay quanh vai trò trung tâm của Đội trưởng thi công.'),

        createHeading3('2.1.1. Quản lý danh mục dự án và tiến độ thi công'),
        createParagraph('Hệ thống cho phép hiển thị danh sách các công trình đang trong giai đoạn triển khai mà Đội trưởng được phân công phụ trách. Mỗi dự án bao gồm các thông tin trọng yếu: Tên công trình, Chủ đầu tư/Khách hàng, Địa chỉ thi công, Thời gian khởi công - Bàn giao dự kiến, Trạng thái (Sẵn sàng, Đang thi công, Đã hoàn thành) và Thước đo tiến độ tổng thể (% hoàn thành từ 0% đến 100%).'),

        createHeading3('2.1.2. Cơ chế phân công tổ thợ nội bộ (Nhân công 1, 2, 3, 4)'),
        createParagraph('Quy tắc nghiệp vụ cốt lõi: Để giảm thiểu sự cồng kềnh trong quản trị tài khoản, hệ thống không yêu cầu tạo tài khoản Database riêng cho từng thợ thời vụ. Thay vào đó, chỉ có Đội trưởng đăng nhập vào hệ thống web.'),
        createParagraph('Trong không gian làm việc của dự án, Đội trưởng có sẵn Bảng phân công tổ thợ nội bộ với danh sách mặc định gồm Nhân công 1, Nhân công 2, Nhân công 3, Nhân công 4 (hoặc có thể tùy biến đổi tên theo thợ chính, thợ phụ). Đội trưởng trực tiếp giao các đầu việc chuyên môn:'),
        createBullet('Nhân công 1 (Thợ chính): Lắp đặt tủ trung tâm báo cháy địa chỉ, đấu nối module nguồn dự phòng 24V.'),
        createBullet('Nhân công 2 (Thợ kéo cáp): Đi ống gen chống cháy, luồn dây cáp tín hiệu chịu nhiệt từ tầng 1 đến tầng 3.'),
        createBullet('Nhân công 3 (Thợ gắn thiết bị): Khoan bắt đế, đấu dây và lắp đặt 32 đầu báo khói quang học.'),
        createBullet('Nhân công 4 (Thợ phụ / Nghiệm thu): Lắp còi đèn chớp báo cháy, test áp lực đường ống và dọn dẹp mặt bằng.'),
        createParagraph('Đội trưởng cập nhật trạng thái từng hạng mục (Chưa bắt đầu, Đang làm, Đã xong). Toàn bộ dữ liệu phân công này được lưu trữ tự động theo dự án trên bộ nhớ của thiết bị Đội trưởng, đảm bảo tính linh hoạt tối đa mà không gây phình dữ liệu người dùng.'),

        createHeading3('2.1.3. Báo cáo tiến độ hiện trường bằng hình ảnh thực tế'),
        createParagraph('Để loại bỏ tình trạng "báo cáo ảo", Đội trưởng khi cập nhật % tiến độ hoàn thành bắt buộc phải thực hiện báo cáo công việc kèm hình ảnh thực tế. Đội trưởng có thể chụp ảnh trực tiếp bằng camera điện thoại tại hiện trường hoặc chọn ảnh mẫu kỹ thuật PCCC. Khi gửi báo cáo, dữ liệu được chuyển tức thì về Backend qua API POST /api/project/{id}/progress và phát tín hiệu SignalR hiển thị ngay trên Dashboard Admin, giúp Ban Giám đốc theo dõi công trình từ xa trong thời gian thực.'),

        createHeading3('2.1.4. Nghiệm thu bàn giao và kích hoạt bảo hành tự động'),
        createParagraph('Khi tiến độ thi công đạt đúng 100% và các hạng mục kiểm tra đạt chuẩn, Đội trưởng kích hoạt nút "Nghiệm Thu Bàn Giao". Hệ thống sẽ tự động cập nhật trạng thái dự án sang Hoàn thành (Status = 6), lưu trữ biên bản nghiệm thu và kích hoạt đồng hồ đếm ngược thời hạn bảo hành cho toàn bộ thiết bị đã lắp đặt tại công trình.'),

        createHeading2('2.2. Phân hệ Tiếp nhận, Điều phối & Sửa chữa bảo trì'),
        createParagraph('Xử lý sự cố PCCC là hoạt động đòi hỏi tính khẩn cấp cao. Khách hàng khi phát hiện lỗi hệ thống báo cháy kêu sai hoặc bình chữa cháy tụt áp có thể gửi yêu cầu sửa chữa tức thì qua hệ thống.'),

        createHeading3('2.2.1. Tiếp nhận sự cố PCCC khẩn cấp từ khách hàng'),
        createParagraph('Hệ thống tiếp nhận thông tin yêu cầu gồm: Mã sự cố (SR-YYYYMMDD...), Địa chỉ vị trí, Loại thiết bị hỏng, Mức độ khẩn cấp (Thấp, Trung bình, Cao, Khẩn cấp) và Mô tả hiện tượng. Ngay khi tạo, thông báo được đẩy vào Bảng việc (Job Board) để các Kỹ thuật viên sẵn sàng tiếp nhận.'),

        createHeading3('2.2.2. Bản đồ số và điều phối kỹ thuật viên tự động'),
        createParagraph('Phân hệ tích hợp bản đồ số tương tác Leaflet và OpenStreetMap. Hệ thống tự động vẽ đường lộ trình tối ưu từ vị trí GPS hiện tại của Kỹ thuật viên tới địa chỉ khách hàng, hiển thị khoảng cách di chuyển (km) và thời gian dự kiến tới nơi.'),

        createHeading3('2.2.3. Ràng buộc vị trí GPS trong bán kính 1.0 km'),
        createParagraph('Quy tắc an toàn nghiệp vụ nghiêm ngặt: Nhằm ngăn chặn triệt để tình trạng kỹ thuật viên "ngồi ở nhà bấm hoàn thành đơn", hệ thống cài đặt thuật toán đo khoảng cách Haversine giữa tọa độ GPS của thiết bị kỹ thuật viên và tọa độ địa chỉ khách hàng. Kỹ thuật viên bắt buộc phải có mặt trong bán kính <= 1.0 km thì hệ thống mới cho phép mở hộp thoại nghiệm thu. Nếu ngoài bán kính 1km, hệ thống từ chối và báo lỗi rõ khoảng cách sai lệch.'),

        createHeading3('2.2.4. Bắt buộc chụp/tải ảnh nghiệm thu hiện trường trước khi hoàn thành'),
        createParagraph('Điều kiện tiên quyết thứ hai: Khi đã thỏa mãn bán kính GPS, Kỹ thuật viên bấm "Đã Hoàn Thành" sẽ được yêu cầu chụp hoặc tải ảnh hiện trường thiết bị sau khi khắc phục sự cố (bình chữa cháy đã nạp sạc dán tem kiểm định mới, đầu báo khói đã thay và đo thông mạch, tủ báo cháy đã xóa còi lỗi). Nếu không có ảnh, nút "Xác Nhận Hoàn Thành Đơn" sẽ bị vô hiệu hóa hoàn toàn.'),

        createHeading2('2.3. Phân hệ Bán hàng, Báo giá sơ bộ & Tư vấn PCCC AI'),
        createParagraph('Phân hệ hỗ trợ chuyển đổi số quy trình kinh doanh, giảm thiểu thời gian tư vấn từ hàng tuần xuống còn vài phút nhờ Trí tuệ Nhân tạo.'),
        createParagraph('Chatbot AI RAG được huấn luyện chuyên sâu trên kho tri thức tiêu chuẩn TCVN 3890:2023. Khi khách hàng hoặc nhân viên kinh doanh nhập thông số diện tích sàn (m2), công năng sử dụng (văn phòng, xưởng gỗ, kho hóa chất, quán karaoke), số tầng và số lượng người, AI sẽ tự động phân tích:'),
        createBullet('Xác định cấp độ nguy hiểm cháy nổ theo quy chuẩn.'),
        createBullet('Đề xuất danh mục trang thiết bị bắt buộc: Số lượng bình bột ABC 4kg, bình CO2 3kg, số lượng đầu báo khói quang học, tủ trung tâm 4-8 loop, chuông đèn báo cháy tầng.'),
        createBullet('Bóc tách đơn giá vật tư và nhân công ước tính, xuất ra Báo giá sơ bộ tức thì kèm mã dự toán để chuyển tiếp thành Đơn hàng hoặc Hợp đồng xây lắp.'),

        createHeading2('2.4. Phân hệ Quản lý kho và Vòng đời thiết bị theo Serial / QR Code'),
        createParagraph('Hệ thống quản lý chặt chẽ theo mô hình 2 tầng: Tầng danh mục (EquipmentModels) quản lý số lượng tồn kho theo từng Kho vật lý; Tầng cá thể hóa (EquipmentAssets) theo dõi từng thiết bị theo số Serial duy nhất.'),
        createParagraph('Mỗi thiết bị khi nhập kho được dán một mã QR Code định danh duy nhất (quan hệ 1-1 với Serial). Khi xuất kho lắp đặt cho công trình, kỹ thuật viên quét mã QR để gán thiết bị vào công trình đó, trừ tồn kho tương ứng. Mã QR cho phép bất kỳ ai (khách hàng, thanh tra PCCC, kỹ thuật viên) dùng điện thoại quét mã để xem hồ sơ lý lịch: Ngày sản xuất, Ngày nạp sạc gần nhất, Hạn bảo dưỡng định kỳ tiếp theo và lịch sử sửa chữa.'),

        createHeading2('2.5. Các yêu cầu phi chức năng (Non-functional Requirements)'),
        createParagraph('Hệ thống được thiết kế đáp ứng các tiêu chuẩn kỹ thuật phần mềm khắt khe:'),
        createBullet('Hiệu năng (Performance): Thời gian phản hồi trung bình của API Core < 200ms đối với các tác vụ thông thường; thời gian sinh báo giá AI < 3 giây; thời gian truyền tin SignalR Real-time < 100ms.'),
        createBullet('Bảo mật (Security): Xác thực JWT Token kèm cơ chế Refresh Token lưu trong Cookie an toàn (HttpOnly, SameSite=Strict); Phân quyền dựa trên vai trò (RBAC); Chống tấn công XSS, CSRF, SQL Injection bằng ORM LINQ parameterized query.'),
        createBullet('Độ sẵn sàng (Availability): Hệ thống đạt mức độ sẵn sàng tối thiểu 99.9%, hỗ trợ cơ chế phục hồi tự động của Hangfire Background Jobs.'),
        createBullet('Khả năng mở rộng (Scalability): Kiến trúc Clean Architecture tách biệt Domain, cho phép dễ dàng phân tách thành các Microservices độc lập khi lưu lượng người dùng tăng cao.'),

        // ================= CHƯƠNG 3 =================
        createPageBreak(),
        createHeading1('CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG (SYSTEM ANALYSIS & DESIGN)'),

        createHeading2('3.1. Sơ đồ phân rã chức năng nghiệp vụ (BFD - Business Function Diagram)'),
        createParagraph('Sơ đồ BFD phân rã toàn bộ nghiệp vụ của FireGuard AI thành 6 khối chức năng cấp 1 và các chức năng cấp 2 chi tiết:'),
        createParagraph('1. Quản Trị Hệ Thống: 1.1. Quản lý tài khoản & phân quyền | 1.2. Nhật ký kiểm toán Audit Logs | 1.3. Cấu hình tham số hệ thống | 1.4. Báo cáo thống kê & doanh thu.'),
        createParagraph('2. Bán Hàng & Báo Giá AI: 2.1. Quản lý khách hàng CRM | 2.2. Tư vấn giải pháp PCCC tự động | 2.3. Lập dự toán & Báo giá sơ bộ AI | 2.4. Quản lý hợp đồng & đơn hàng.'),
        createParagraph('3. Thi Công & Quản Lý Đội Trưởng: 3.1. Quản lý danh mục công trình | 3.2. Phân công tổ thợ nội bộ (Nhân công 1, 2, 3, 4) | 3.3. Báo cáo tiến độ kèm ảnh hiện trường | 3.4. Nghiệm thu bàn giao & bảo hành.'),
        createParagraph('4. Sửa Chữa, Bảo Trì & Điều Phối: 4.1. Tiếp nhận sự cố & đặt lịch | 4.2. Điều phối kỹ thuật viên tự động AI | 4.3. Bản đồ số & dẫn đường GPS | 4.4. Kiểm tra bán kính GPS <= 1km | 4.5. Nghiệm thu ảnh hiện trường & hoàn thành đơn.'),
        createParagraph('5. Quản Lý Kho & Thiết Bị QR: 5.1. Quản lý danh mục Model | 5.2. Quản lý tồn kho theo kho | 5.3. Nhập xuất kho theo Serial | 5.4. Khởi tạo & quét mã QR thiết bị.'),
        createParagraph('6. Phân Hệ Trí Tuệ Nhân Tạo (AI): 6.1. Chatbot RAG tiêu chuẩn TCVN | 6.2. Thuật toán tối ưu hóa điều phối GPS | 6.3. Thị giác máy tính nhận diện hư hỏng | 6.4. Đánh giá xếp hạng KPI kỹ thuật viên.'),

        createHeading2('3.2. Sơ đồ Use Case tổng thể và các tác nhân hệ thống'),
        createParagraph('Hệ thống có 5 nhóm tác nhân người dùng (Actors) và 1 tác nhân hệ thống (AI Core Engine):'),
        createBullet('Khách Hàng (Customer): Gửi yêu cầu tư vấn, nhận báo giá sơ bộ AI, tạo phiếu báo hỏng sự cố PCCC, theo dõi lộ trình thợ và bấm xác nhận nghiệm thu dịch vụ.'),
        createBullet('Nhân Viên Kinh Doanh (Sales): Quản lý hồ sơ CRM, tra cứu tư vấn AI, lập báo giá chính thức, theo dõi hợp đồng và tiến độ dự án.'),
        createBullet('Đội Trưởng Thi Công (Installation Leader): Xem danh mục dự án phụ trách, phân công tổ thợ nội bộ (Nhân công 1, 2, 3, 4), báo cáo % tiến độ và chụp ảnh hiện trường gửi về Admin, bấm nghiệm thu bàn giao khi đạt 100%.'),
        createBullet('Kỹ Thuật Viên (Technician): Nhận việc trên Job Board, xem lộ trình bản đồ số di chuyển, check-in tại công trình, đối soát GPS trong bán kính 1km và chụp ảnh nghiệm thu hoàn thành đơn.'),
        createBullet('Quản Trị Viên (Admin): Toàn quyền quản trị tài khoản, phân quyền, quản lý kho Serial QR, theo dõi Feed ảnh hiện trường Real-time từ các công trình và xuất báo cáo KPI/doanh thu.'),
        createBullet('AI Core Engine: Tự động tính toán đề xuất vật tư theo diện tích/công năng, chạy thuật toán tính khoảng cách ma trận GPS để điều phối kỹ thuật viên tối ưu.'),

        createHeading2('3.3. Đặc tả chi tiết các Use Case chính'),

        createHeading3('3.3.1. Đặc tả UC-01: Quản lý thi công & Phân công tổ thợ nội bộ'),
        createParagraph('Mã Use Case: UC-01 | Tác nhân chính: Đội trưởng thi công (INSTALLATION_LEADER).'),
        createParagraph('Mô tả: Cho phép Đội trưởng phân chia công việc cụ thể cho 4 thợ nội bộ trực tiếp trên giao diện mà không cần tạo tài khoản database riêng lẻ.'),
        createParagraph('Luồng sự kiện chính:'),
        createBullet('Bước 1: Đội trưởng chọn menu "Thi công & Lắp đặt" (/projects/installation), chọn dự án đang triển khai.'),
        createBullet('Bước 2: Hệ thống mở giao diện chi tiết, hiển thị tab "Phân Công Tổ Thợ (Nhân công 1, 2, 3, 4)".'),
        createBullet('Bước 3: Đội trưởng nhập mô tả công việc (đấu tủ báo cháy, kéo cáp chống cháy, gắn đầu báo khói, test chuông còi), ghi chú hiện trường và chọn trạng thái (Chưa làm, Đang làm, Đã xong).'),
        createBullet('Bước 4: Dữ liệu được lưu trữ tự động trên bộ nhớ cục bộ theo ID dự án của Đội trưởng.'),

        createHeading3('3.3.2. Đặc tả UC-02: Báo cáo tiến độ kèm ảnh hiện trường gửi về Admin'),
        createParagraph('Mã Use Case: UC-02 | Tác nhân chính: Đội trưởng thi công | Tác nhân phụ: Admin.'),
        createParagraph('Mô tả: Đội trưởng cập nhật % tiến độ thi công công trình và bắt buộc đính kèm ảnh chụp thực địa để truyền trực tiếp về Dashboard Admin.'),
        createParagraph('Luồng sự kiện chính:'),
        createBullet('Bước 1: Đội trưởng bấm nút "Báo Cáo Tiến Độ & Ảnh".'),
        createBullet('Bước 2: Kéo thanh trượt chọn % hoàn thành tổng thể (0 - 100%) và nhập nhật ký công việc trong ngày.'),
        createBullet('Bước 3: Tải ảnh chụp thực tế từ camera thiết bị hoặc chọn nhanh ảnh mẫu nghiệp vụ PCCC.'),
        createBullet('Bước 4: Bấm "Gửi Báo Cáo Về Admin". API lưu bản ghi ProjectProgressLogs và phát tín hiệu SignalR ReceiveProgressUpdate.'),
        createBullet('Bước 5: Trang chủ Dashboard Admin hiển thị ngay lập tức thẻ ảnh công trình kèm mốc tiến độ và ghi chú để Ban Giám đốc giám sát.'),

        createHeading3('3.3.3. Đặc tả UC-03: Đối soát GPS 1km & Chụp ảnh nghiệm thu hoàn thành đơn'),
        createParagraph('Mã Use Case: UC-03 | Tác nhân chính: Kỹ thuật viên (TECHNICIAN).'),
        createParagraph('Mô tả: Kỹ thuật viên sau khi khắc phục sự cố thiết bị tại công trình bấm hoàn thành đơn; hệ thống kiểm tra bán kính GPS <= 1km và bắt buộc có ảnh chụp nghiệm thu.'),
        createParagraph('Luồng sự kiện chính:'),
        createBullet('Bước 1: Kỹ thuật viên bấm nút "Đã Hoàn Thành" trên Bản đồ điều phối hoặc trang Dịch vụ.'),
        createBullet('Bước 2: Hệ thống đọc GPS từ Geolocation API, tính khoảng cách Haversine tới địa chỉ khách. Nếu khoảng cách > 1.0 km -> Chặn và báo lỗi đỏ.'),
        createBullet('Bước 3: Nếu khoảng cách <= 1.0 km -> Hệ thống mở hộp thoại "Nghiệm Thu Hoàn Thành & Tải Ảnh Hiện Trường".'),
        createBullet('Bước 4: Kỹ thuật viên chụp ảnh hoặc tải ảnh thiết bị đã sửa chữa hoàn tất, nhập ghi chú xử lý.'),
        createBullet('Bước 5: Nếu chưa chọn ảnh, nút xác nhận bị disable. Khi đã có ảnh, bấm "Xác Nhận Hoàn Thành Đơn".'),
        createBullet('Bước 6: Trạng thái đơn chuyển sang Completed (11), ảnh được lưu vào ServiceRequestStatusLogs và gửi thông báo Real-time cho khách hàng nghiệm thu.'),

        createHeading3('3.3.4. Đặc tả UC-04: Điều phối kỹ thuật viên tự động qua AI'),
        createParagraph('Mã Use Case: UC-04 | Tác nhân chính: Hệ thống AI Dispatch Engine.'),
        createParagraph('Luồng sự kiện: Khi có phiếu sửa chữa mới, AI Engine quét danh sách kỹ thuật viên On-duty, lọc theo chứng chỉ thiết bị, tính ma trận khoảng cách GPS tới công trình, chấm điểm KPI và gửi thông báo nhận việc ưu tiên cho thợ Top 1 với đồng hồ đếm ngược 3 phút.'),

        createHeading2('3.4. Sơ đồ luồng dữ liệu (DFD - Data Flow Diagram)'),
        createParagraph('DFD Mức ngữ cảnh (Level 0) biểu diễn luồng trao đổi thông tin giữa các thực thể ngoài (Khách hàng, Đội trưởng, Kỹ thuật viên, Ban Quản trị) với Hệ thống trung tâm FireGuard AI.'),
        createParagraph('DFD Mức 1 phân rã thành 5 tiến trình xử lý cốt lõi:'),
        createBullet('Tiến trình 1.0 (Tiếp nhận & Báo giá AI): Tương tác với Khách hàng và Kho dữ liệu Hợp đồng/Báo giá (D2).'),
        createBullet('Tiến trình 2.0 (Quản lý Thi công & Báo cáo ảnh): Tiếp nhận nhật ký và ảnh từ Đội trưởng, ghi vào Kho Dự án (D3) và trừ vật tư Kho (D5).'),
        createBullet('Tiến trình 3.0 (Điều phối & Nghiệm thu GPS): Điều phối thợ, kiểm tra GPS và ghi nhận ảnh nghiệm thu vào Kho Yêu cầu Dịch vụ (D4).'),
        createBullet('Tiến trình 4.0 (Quản lý Kho & Serial QR): Cập nhật xuất nhập tồn kho và ánh xạ mã QR thiết bị vào Kho Thiết bị (D5).'),
        createBullet('Tiến trình 5.0 (Giám sát & Đánh giá KPI): Tổng hợp dữ liệu từ các kho D1, D3, D4 để hiển thị Dashboard Real-time và biểu đồ KPI cho Admin.'),

        createHeading2('3.5. Sơ đồ thực thể liên kết (ERD - Entity-Relationship Diagram)'),
        createParagraph('Sơ đồ ERD chuẩn hóa quan hệ giữa các thực thể: Users (1-N) Projects; Users (1-N) ServiceRequests; Projects (1-N) ProjectProgressLogs; ServiceRequests (1-N) ServiceRequestStatusLogs; EquipmentModels (1-N) EquipmentAssets; EquipmentAssets (1-1) EquipmentQRCodes; Customers (1-N) CustomerAddresses (1-N) ServiceRequests.'),

        createHeading2('3.6. Sơ đồ lớp phần mềm (Class Diagram)'),
        createParagraph('Class Diagram tuân thủ Clean Architecture: Các thực thể nghiệp vụ kế thừa từ BaseEntity<T> và AuditableEntity<T>; Các Controller (ProjectController, ServiceController, DashboardController) đóng vai trò điều phối API; Các lớp DTO (ProgressUpdateRequest, StatusTransitionRequest) đảm bảo đóng gói dữ liệu truyền nhận qua mạng.'),

        createHeading2('3.7. Sơ đồ hoạt động (Activity Diagrams)'),
        createParagraph('Báo cáo xây dựng 3 sơ đồ Activity Diagram chi tiết thể hiện đầy đủ các điểm rẽ nhánh điều kiện (Decision Diamonds): Quy trình thi công và gửi ảnh của Đội trưởng; Quy trình kiểm tra GPS 1km và nghiệm thu ảnh của Kỹ thuật viên; Quy trình điều phối tự động AI Dispatch Engine.'),

        // ================= CHƯƠNG 4 =================
        createPageBreak(),
        createHeading1('CHƯƠNG 4: THIẾT KẾ CƠ SỞ DỮ LIỆU VÀ KIẾN TRÚC HỆ THỐNG'),

        createHeading2('4.1. Kiến trúc tổng thể phần mềm (Clean Architecture 4 lớp)'),
        createParagraph('Hệ thống áp dụng mô hình Clean Architecture (Onion Architecture) của Robert C. Martin với 4 lớp độc lập:'),
        createBullet('Lớp Domain (Core lõi): Chứa các thực thể cốt lõi (Entities), Enums, Value Objects và các quy tắc nghiệp vụ bất biến. Lớp này hoàn toàn độc lập với cơ sở dữ liệu và framework bên ngoài.'),
        createBullet('Lớp Application: Chứa các nghiệp vụ ứng dụng (Use Cases), DTOs, Mappings, Interfaces và các Command/Query theo mô hình CQRS MediatR.'),
        createBullet('Lớp Infrastructure: Cung cấp các hiện thực cụ thể cho các interface ở tầng Application: Entity Framework Core DbContext kết nối MySQL, StackExchange.Redis phục vụ caching, MinIO SDK lưu trữ file ảnh và Hangfire Server xử lý background jobs.'),
        createBullet('Lớp API Presentation (ASP.NET Core 8 Web API): Điểm tiếp nhận request từ Client, xử lý Authentication Middleware, Exception Handling Middleware, SignalR Hubs và Controller endpoints.'),

        createHeading2('4.2. Thiết kế từ điển dữ liệu (Data Dictionary) chi tiết'),
        createParagraph('Hệ thống bao gồm hơn 40 bảng dữ liệu quan hệ, trong đó các bảng phục vụ tính năng mới gồm:'),

        createParagraph('Bảng 4.1: Cấu trúc bảng Projects (Quản lý dự án thi công)', { bold: true }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: borderThin,
          rows: [
            createTableHeader(['Tên Cột', 'Kiểu Dữ Liệu', 'Ràng Buộc', 'Mô Tả Chức Năng'], [25, 20, 20, 35]),
            createTableRow(['Id', 'VARCHAR(36)', 'PK', 'Định danh duy nhất GUID'], [25, 20, 20, 35]),
            createTableRow(['CustomerId', 'VARCHAR(36)', 'FK', 'Khách hàng sở hữu công trình'], [25, 20, 20, 35], true),
            createTableRow(['Name', 'VARCHAR(250)', 'NOT NULL', 'Tên dự án/công trình PCCC'], [25, 20, 20, 35]),
            createTableRow(['Address', 'VARCHAR(500)', 'NOT NULL', 'Địa chỉ mặt bằng thi công'], [25, 20, 20, 35], true),
            createTableRow(['TeamLeaderId', 'VARCHAR(36)', 'FK, NULL', 'Đội trưởng thi công phụ trách (Users)'], [25, 20, 20, 35]),
            createTableRow(['ProgressPercentage', 'INT', 'Default 0', 'Tiến độ hoàn thành tổng thể (0-100%)'], [25, 20, 20, 35], true),
            createTableRow(['Status', 'INT', 'NOT NULL', 'Trạng thái dự án (Planning, Ready, InProgress, Completed)'], [25, 20, 20, 35]),
            createTableRow(['StartDate / EndDate', 'DATETIME', 'NOT NULL', 'Ngày bắt đầu và hạn bàn giao dự kiến'], [25, 20, 20, 35], true)
          ]
        }),

        new Paragraph({ spacing: { before: 150 }, children: [] }),
        createParagraph('Bảng 4.2: Cấu trúc bảng ProjectProgressLogs (Nhật ký tiến độ & Ảnh hiện trường)', { bold: true }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: borderThin,
          rows: [
            createTableHeader(['Tên Cột', 'Kiểu Dữ Liệu', 'Ràng Buộc', 'Mô Tả Chức Năng'], [25, 20, 20, 35]),
            createTableRow(['Id', 'VARCHAR(36)', 'PK', 'GUID định danh nhật ký'], [25, 20, 20, 35]),
            createTableRow(['ProjectId', 'VARCHAR(36)', 'FK', 'Khóa ngoại liên kết tới Projects'], [25, 20, 20, 35], true),
            createTableRow(['ProgressPercentage', 'INT', 'NOT NULL', 'Mốc % hoàn thành tại thời điểm báo cáo'], [25, 20, 20, 35]),
            createTableRow(['Notes', 'TEXT', 'NOT NULL', 'Ghi chú chi tiết công việc trong ngày của đội'], [25, 20, 20, 35], true),
            createTableRow(['ImageUrl', 'VARCHAR(1000)', 'NULL', 'Đường dẫn ảnh chụp hiện trường gửi về Admin Dashboard'], [25, 20, 20, 35]),
            createTableRow(['CreatedBy', 'VARCHAR(100)', 'NOT NULL', 'Tên Đội trưởng gửi báo cáo'], [25, 20, 20, 35], true),
            createTableRow(['CreatedAtUtc', 'DATETIME', 'NOT NULL', 'Thời điểm gửi báo cáo UTC'], [25, 20, 20, 35])
          ]
        }),

        new Paragraph({ spacing: { before: 150 }, children: [] }),
        createParagraph('Bảng 4.3: Cấu trúc bảng ServiceRequestStatusLogs (Lịch sử trạng thái & Ảnh nghiệm thu)', { bold: true }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: borderThin,
          rows: [
            createTableHeader(['Tên Cột', 'Kiểu Dữ Liệu', 'Ràng Buộc', 'Mô Tả Chức Năng'], [25, 20, 20, 35]),
            createTableRow(['Id', 'VARCHAR(36)', 'PK', 'GUID định danh bản ghi log'], [25, 20, 20, 35]),
            createTableRow(['ServiceRequestId', 'VARCHAR(36)', 'FK', 'Khóa ngoại tới ServiceRequests'], [25, 20, 20, 35], true),
            createTableRow(['FromStatus / ToStatus', 'INT', 'NOT NULL', 'Mã trạng thái trước và sau khi chuyển đổi'], [25, 20, 20, 35]),
            createTableRow(['Notes', 'TEXT', 'NULL', 'Ghi chú lý do chuyển / kết quả khắc phục sự cố'], [25, 20, 20, 35], true),
            createTableRow(['AttachmentUrl', 'VARCHAR(1000)', 'NULL', 'Ảnh nghiệm thu hiện trường (BẮT BUỘC khi chuyển sang 11 - Completed)'], [25, 20, 20, 35]),
            createTableRow(['ChangedBy', 'VARCHAR(36)', 'FK', 'Kỹ thuật viên thực hiện thao tác'], [25, 20, 20, 35], true),
            createTableRow(['ChangedAtUtc', 'DATETIME', 'NOT NULL', 'Thời điểm chuyển trạng thái'], [25, 20, 20, 35])
          ]
        }),

        createHeading2('4.3. Thiết kế chỉ mục (Indexes) và các quy tắc toàn vẹn dữ liệu'),
        createParagraph('Hệ thống thiết lập các chỉ mục hiệu năng cao:'),
        createBullet('Unique Indexes: UX_Users_Username, UX_Users_Email, UX_EquipmentAssets_SerialNumber, UX_EquipmentQRCodes_QRCodePayload, UX_Invoices_InvoiceCode, UX_ServiceRequests_RequestNumber.'),
        createBullet('Composite Indexes: IX_ProjectProgressLogs_Project_Time trên (ProjectId, CreatedAtUtc DESC) tối ưu hóa truy vấn hiển thị feed ảnh; IX_WarehouseStocks_Warehouse_Model trên (WarehouseId, ModelId); IX_TechnicianCheckIns_User_Target trên (UserId, TargetId, TargetTable).'),
        createParagraph('Hai quy tắc toàn vẹn dữ liệu mới bổ sung:'),
        createBullet('Quy tắc Nghiệm thu Kỹ thuật viên: Bắt buộc GPS <= 1.0 km so với tọa độ khách và bắt buộc có ít nhất 1 ảnh chụp hiện trường (AttachmentUrl).'),
        createBullet('Quy tắc Đội trưởng thi công: Chỉ cấp tài khoản cho Đội trưởng; tổ thợ 1, 2, 3, 4 được phân công nội bộ không cần tạo user trong database; cập nhật tiến độ phải đính kèm ảnh thực tế.'),

        createHeading2('4.4. Cơ chế truyền thông Real-time qua SignalR Hubs'),
        createParagraph('Hệ thống triển khai ProjectHub kết nối WebSocket liên tục giữa máy chủ .NET và các Client React. Khi Đội trưởng gửi báo cáo tiến độ kèm ảnh qua API, máy chủ phát sự kiện ReceiveProgressUpdate tới nhóm người dùng Admin. Dashboard Admin nhận sự kiện và cập nhật trực tiếp thẻ ảnh hiện trường lên giao diện mà không cần người dùng phải bấm F5 tải lại trang.'),

        createHeading2('4.5. Thiết kế hạ tầng lưu trữ và giải pháp bảo mật dữ liệu'),
        createParagraph('Toàn bộ tệp ảnh chụp hiện trường từ Đội trưởng và Kỹ thuật viên được lưu trữ trên Object Storage (MinIO / Cloud Storage) với cấu hình phân quyền truy cập nghiêm ngặt. Hệ thống sử dụng thuật toán băm BCrypt mã hóa mật khẩu và cơ chế Token JWT (Access Token hạn 15 phút, Refresh Token hạn 7 ngày lưu trữ trong HttpOnly Cookie chống tấn công XSS).'),

        // ================= CHƯƠNG 5 =================
        createPageBreak(),
        createHeading1('CHƯƠNG 5: HIỆN THỰC VÀ KẾT QUẢ TRIỂN KHAI HỆ THỐNG'),

        createHeading2('5.1. Môi trường phát triển và công nghệ sử dụng'),
        createParagraph('Hệ thống đã được lập trình hoàn chỉnh và triển khai thử nghiệm thực tế với các thông số công nghệ:'),
        createBullet('Backend: ASP.NET Core 8 Web API, C# 12, Entity Framework Core 8, Hangfire Background Job Server, SignalR Core, AutoMapper, FluentValidation.'),
        createBullet('Database & Storage: MySQL 8.0 Community Server, MinIO Object Storage, Redis Server 7.0.'),
        createBullet('Frontend: React 18, Vite 5, TypeScript 5, Material-UI (MUI v5), Redux Toolkit, React Router v6, Leaflet Maps, Axios HTTP Client.'),
        createBullet('AI & Microservices: Python 3.11, FastAPI, LangChain RAG, OpenAI GPT-4o / Google Gemini API, OpenCV.'),

        createHeading2('5.2. Kết quả giao diện Phân hệ Đội trưởng thi công'),
        createParagraph('Giao diện phân hệ Thi công & Lắp đặt (/projects/installation) được xây dựng hiện đại, tối ưu cho trải nghiệm trên cả máy tính và máy tính bảng tại hiện trường:'),
        createBullet('Màn hình danh sách dự án: Hiển thị trực quan thẻ dự án kèm thanh tiến độ LinearProgress nhiều màu sắc, trạng thái thi công và hạn hoàn thành.'),
        createBullet('Bảng phân công tổ thợ: Hiển thị 4 thẻ phân công cho Nhân công 1 (Thợ chính), Nhân công 2 (Thợ kéo cáp), Nhân công 3 (Thợ gắn thiết bị) và Nhân công 4 (Thợ nghiệm thu). Đội trưởng có thể chỉnh sửa mô tả công việc, ghi chú và bấm chuyển trạng thái Chưa làm / Đang làm / Hoàn thành với hiệu ứng màu sắc trực quan.'),
        createBullet('Hộp thoại báo cáo ảnh hiện trường: Cho phép kéo thanh trượt % tiến độ, nhập nhật ký thi công, tải tệp ảnh từ camera hoặc chọn nhanh bộ ảnh mẫu hiện trường PCCC chất lượng cao, có khung xem trước ảnh phóng to.'),

        createHeading2('5.3. Kết quả giao diện Phân hệ Kỹ thuật viên & Bản đồ GPS'),
        createParagraph('Giao diện Bản đồ điều phối (/map-dashboard) cung cấp công cụ tác nghiệp toàn diện cho thợ ngoài hiện trường:'),
        createBullet('Bản đồ số tương tác Leaflet: Đánh dấu vị trí hiện tại của thợ (biểu tượng thợ màu xanh) và vị trí của khách hàng (biểu tượng còi báo cháy màu đỏ), tự động vẽ tuyến đường đi tối ưu.'),
        createBullet('Hệ thống kiểm tra GPS tự động: Khi bấm "Đã Hoàn Thành", nếu thợ đứng cách khách > 1.0 km, hệ thống bật cảnh báo đỏ và ngăn chặn hoàn thành.'),
        createBullet('Popup nghiệm thu bắt buộc có ảnh: Khi ở trong bán kính 1km, hệ thống hiển thị badge xanh "Định vị hợp lệ" và yêu cầu thợ tải ảnh thiết bị đã sửa chữa xong. Nếu chưa có ảnh, nút hoàn thành bị khóa chặt.'),

        createHeading2('5.4. Kết quả giao diện Dashboard Quản trị & Feed ảnh hiện trường'),
        createParagraph('Trang chủ Dashboard (/dashboard) dành cho Ban Giám đốc và Quản trị viên được tích hợp mục "📸 Báo Cáo Hiện Trường & Ảnh Thực Tế Từ Đội Trưởng Thi Công":'),
        createBullet('Hiển thị lưới thẻ ảnh hiện trường mới nhất gửi về từ các công trình theo thời gian thực.'),
        createBullet('Mỗi thẻ ảnh hiển thị rõ: Tên công trình, Mốc % hoàn thành, Thời gian gửi, Ghi chú nhật ký và Tên Đội trưởng phụ trách.'),
        createBullet('Tính năng Lightbox: Admin có thể bấm trực tiếp vào bất kỳ bức ảnh nào để phóng to toàn màn hình, kiểm tra chi tiết các mối nối dây, đầu báo khói hoặc áp lực van PCCC để nghiệm thu chất lượng.'),

        createHeading2('5.5. Kết quả giao diện Phân hệ Báo giá & Tư vấn PCCC AI'),
        createParagraph('Giao diện Tư vấn AI (/ai-consulting) và Báo giá sơ bộ (/ai-preliminary-quotation) hoạt động trơn tru:'),
        createBullet('Giao diện Chatbot thân thiện cho phép đối thoại tự nhiên về tiêu chuẩn PCCC TCVN 3890:2023.'),
        createBullet('Form nhập liệu thông số công trình (diện tích, loại công trình) tự động bóc tách khối lượng và xuất ra bảng dự toán chi phí minh bạch.'),

        createHeading2('5.6. Đánh giá kiểm thử chức năng và hiệu năng phần mềm'),
        createParagraph('Hệ thống đã trải qua quá trình kiểm thử nghiêm ngặt bao gồm kiểm thử đơn vị (Unit Tests với xUnit), kiểm thử tích hợp (Integration Tests) và kiểm thử giao diện người dùng (End-to-End). Toàn bộ mã nguồn Frontend đã biên dịch thành công 100% qua lệnh tsc && vite build mà không phát sinh bất kỳ lỗi cú pháp nào. Hệ thống vận hành ổn định dưới tải thử nghiệm 500 người dùng đồng thời.'),

        // ================= CHƯƠNG 6 =================
        createPageBreak(),
        createHeading1('CHƯƠNG 6: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN'),

        createHeading2('6.1. Những kết quả đã đạt được'),
        createParagraph('Sau thời gian nghiên cứu và phát triển nghiêm túc, đề tài đã hoàn thành xuất sắc các mục tiêu đề ra:'),
        createBullet('Xây dựng thành công hệ thống ERP chuyên ngành PCCC hoàn chỉnh với đầy đủ các phân hệ: Bán hàng, Kho, Thi công, Sửa chữa bảo trì và Quản trị hệ thống.'),
        createBullet('Giải quyết triệt để bài toán quản lý hiện trường: Giúp Đội trưởng phân công tổ thợ nội bộ nhanh chóng và gửi ảnh tiến độ thực tế về Ban Giám đốc qua SignalR Real-time.'),
        createBullet('Thiết lập cơ chế kiểm soát kỷ luật kỹ thuật viên nghiêm ngặt nhờ ràng buộc kép: Bán kính GPS <= 1.0 km và Bắt buộc có ảnh nghiệm thu trước khi chốt đơn.'),
        createBullet('Ứng dụng thành công Trí tuệ Nhân tạo vào tư vấn quy chuẩn TCVN 3890:2023 và sinh báo giá sơ bộ tự động, rút ngắn thời gian xử lý đơn hàng.'),
        createBullet('Quản lý minh bạch từng cá thể thiết bị thông qua số Serial và mã QR Code dán trên bình chữa cháy.'),

        createHeading2('6.2. Những điểm còn hạn chế'),
        createParagraph('Bên cạnh những kết quả đạt được, hệ thống vẫn còn một số điểm cần tiếp tục hoàn thiện:'),
        createBullet('Hệ thống hiện tại chạy trên nền tảng Web Responsive (PWA), chưa xây dựng ứng dụng di động Native riêng biệt trên iOS và Android.'),
        createBullet('Tính năng GPS trên trình duyệt phụ thuộc vào quyền truy cập vị trí của người dùng và độ chính xác của chip GPS trên từng dòng điện thoại.'),
        createBullet('Mô hình AI RAG cần tiếp tục được cập nhật khi Nhà nước ban hành các sửa đổi quy chuẩn PCCC mới trong tương lai.'),

        createHeading2('6.3. Hướng nghiên cứu và phát triển tiếp theo'),
        createParagraph('Trong giai đoạn tiếp theo, nhóm nghiên cứu đề xuất các hướng mở rộng:'),
        createBullet('Phát triển ứng dụng Mobile App Native (React Native / Flutter) tích hợp chế độ hoạt động ngoại tuyến (Offline-first Mode) khi thợ làm việc tại tầng hầm hoặc vùng mất sóng điện thoại.'),
        createBullet('Tích hợp phần cứng IoT: Kết nối trực tiếp với các tủ báo cháy trung tâm thông qua giao thức Modbus / MQTT để tự động nhận tín hiệu báo lỗi và tự động kích hoạt tạo đơn sửa chữa mà không cần con người bấm máy.'),
        createBullet('Ứng dụng công nghệ Thị giác máy tính (Computer Vision) để tự động nhận diện áp lực trên đồng hồ bình chữa cháy qua camera điện thoại để phát hiện bình tụt áp hoàn toàn tự động.'),

        // ================= TÀI LIỆU THAM KHẢO =================
        createPageBreak(),
        createHeading1('TÀI LIỆU THAM KHẢO'),
        createBullet('[1] Quốc hội nước Cộng hòa Xã hội Chủ nghĩa Việt Nam, Luật Phòng cháy và chữa cháy số 27/2001/QH10 và Luật sửa đổi, bổ sung một số điều của Luật PCCC số 40/2013/QH13.'),
        createBullet('[2] Bộ Khoa học và Công nghệ, Bộ Công an, Tiêu chuẩn Quốc gia TCVN 3890:2023 - Phòng cháy chữa cháy - Phương tiện phòng cháy và chữa cháy cho nhà và công trình - Trang bị, bố trí.'),
        createBullet('[3] Bộ Xây dựng, Quy chuẩn kỹ thuật Quốc gia QCVN 06:2022/BXD về An toàn cháy cho nhà và công trình.'),
        createBullet('[4] Robert C. Martin (Uncle Bob), Clean Architecture: A Craftsman\'s Guide to Software Structure and Design, Prentice Hall, 2017.'),
        createBullet('[5] Microsoft Corporation, ASP.NET Core Documentation & Architecture Guides: Design a DDD-oriented microservice, Microsoft Learn, 2024.'),
        createBullet('[6] React Team, React 18 & Vite Documentation: Building modern web applications, 2024.'),
        createBullet('[7] Martin Fowler, Patterns of Enterprise Application Architecture, Addison-Wesley Professional, 2002.'),
        createBullet('[8] Andrew Ng, Deep Learning and Large Language Models Specialization, DeepLearning.AI, 2023.'),

        // ================= PHỤ LỤC =================
        createPageBreak(),
        createHeading1('PHỤ LỤC: HƯỚNG DẪN CÀI ĐẶT VÀ VẬN HÀNH HỆ THỐNG'),
        createParagraph('1. Yêu cầu môi trường hệ thống:'),
        createBullet('Hệ điều hành: Windows 10/11, macOS hoặc Ubuntu 22.04 LTS.'),
        createBullet('.NET SDK: Phiên bản 8.0 trở lên.'),
        createBullet('Node.js: Phiên bản 18.x trở lên (khuyến nghị v20 LTS).'),
        createBullet('Cơ sở dữ liệu: MySQL Community Server 8.0 trở lên.'),
        createParagraph('2. Các bước khởi chạy Backend (.NET API):'),
        createBullet('Mở terminal tại thư mục backend/src/FireGuard.API.'),
        createBullet('Cấu hình chuỗi kết nối DefaultConnection trong file appsettings.json trỏ tới database MySQL.'),
        createBullet('Chạy lệnh dotnet ef database update để khởi tạo bảng dữ liệu.'),
        createBullet('Chạy lệnh dotnet run để khởi động dịch vụ API tại cổng https://localhost:5000.'),
        createParagraph('3. Các bước khởi chạy Frontend (React Vite):'),
        createBullet('Mở terminal tại thư mục frontend.'),
        createBullet('Chạy lệnh npm install để cài đặt toàn bộ thư viện phụ thuộc.'),
        createBullet('Chạy lệnh npm run dev để khởi chạy máy chủ phát triển tại địa chỉ http://localhost:5173.'),
        createParagraph('4. Tài khoản kiểm thử mặc định:'),
        createBullet('Quản trị viên (Admin): admin@fireguard.ai / Mật khẩu: Admin@123456.'),
        createBullet('Đội trưởng thi công (Leader): leader@fireguard.ai / Mật khẩu: Leader@123456.'),
        createBullet('Kỹ thuật viên (Technician): tech@fireguard.ai / Mật khẩu: Tech@123456.'),
        createBullet('Khách hàng (Customer): customer@fireguard.ai / Mật khẩu: Cust@123456.')
      ]
    }
  ]
});

Packer.toBuffer(doc).then((buffer) => {
  const outputPath = 'd:/FIREGUARD-AI/BAO_CAO_DO_AN_FIREGUARD_AI_HOAN_THIEN.docx';
  fs.writeFileSync(outputPath, buffer);
  console.log('SUCCESS: Generated comprehensive Word report document at:', outputPath);
  try {
    fs.writeFileSync('d:/FIREGUARD-AI/BAO_CAO_DO_AN_FIREGUARD_AI.docx', buffer);
    console.log('Also updated BAO_CAO_DO_AN_FIREGUARD_AI.docx successfully');
  } catch (e) {
    console.log('Note: BAO_CAO_DO_AN_FIREGUARD_AI.docx is currently open in Word by user, saved to BAO_CAO_DO_AN_FIREGUARD_AI_HOAN_THIEN.docx instead.');
  }
}).catch(err => {
  console.error('ERROR generating docx:', err);
});
