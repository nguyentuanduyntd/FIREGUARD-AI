const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  PageBreak,
  Header,
  Footer,
  PageNumber
} = require('docx');

console.log("Starting to generate report according to user's exact outline...");

const PRIMARY_COLOR = "1B365D"; // Navy blue
const ACCENT_COLOR = "E02424";  // Red accent
const BORDER_COLOR = "D1D5DB";  // Light grey
const PLACEHOLDER_BG = "F9FAFB";
const TABLE_HEADER_BG = "F3F4F6";

function createHeaderTitle(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    alignment: AlignmentType.LEFT
  });
}

function createSubHeading(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    alignment: AlignmentType.LEFT
  });
}

function createSubSubHeading(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
    alignment: AlignmentType.LEFT
  });
}

function p(text, options = {}) {
  return new Paragraph({
    alignment: options.alignment || AlignmentType.JUSTIFIED,
    spacing: { before: options.before || 60, after: options.after || 60, line: 320 },
    children: [
      new TextRun({
        text: text,
        size: 26, // 13pt
        font: "Times New Roman",
        bold: options.bold || false,
        italics: options.italics || false,
        color: options.color || "111827"
      })
    ]
  });
}

function bullet(text, boldPrefix = "") {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({
      text: boldPrefix + " ",
      bold: true,
      size: 26,
      font: "Times New Roman",
      color: "111827"
    }));
  }
  children.push(new TextRun({
    text: text,
    size: 26,
    font: "Times New Roman",
    color: "111827"
  }));
  return new Paragraph({
    children: children,
    bullet: { level: 0 },
    spacing: { before: 40, after: 40, line: 300 }
  });
}

// Function to create an image placeholder box with caption
function createImagePlaceholder(figCode, caption, description = "Nhấp chuột chọn khung này hoặc nhấn Ctrl+V để chèn hình ảnh minh họa") {
  const borderStyle = {
    style: BorderStyle.DASHED,
    size: 10,
    color: "9CA3AF"
  };

  return [
    new Paragraph({ spacing: { before: 140, after: 60 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: borderStyle,
        bottom: borderStyle,
        left: borderStyle,
        right: borderStyle,
        insideHorizontal: borderStyle,
        insideVertical: borderStyle
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: PLACEHOLDER_BG },
              margins: { top: 300, bottom: 300, left: 200, right: 200 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 80, after: 60 },
                  children: [
                    new TextRun({
                      text: `[ KHUNG CHÈN HÌNH ẢNH: ${figCode} ]`,
                      bold: true,
                      size: 24,
                      font: "Times New Roman",
                      color: "4B5563"
                    })
                  ]
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 40, after: 80 },
                  children: [
                    new TextRun({
                      text: `(${description})`,
                      italics: true,
                      size: 22,
                      font: "Times New Roman",
                      color: "6B7280"
                    })
                  ]
                })
              ]
            })
          ]
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 180 },
      children: [
        new TextRun({
          text: `${figCode}. ${caption}`,
          bold: true,
          italics: true,
          size: 24,
          font: "Times New Roman",
          color: "1F2937"
        })
      ]
    })
  ];
}

// Function to generate styled tables
function createCustomTable(headers, rows) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR };
  
  const headerRow = new TableRow({
    children: headers.map(h => new TableCell({
      width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: TABLE_HEADER_BG },
      margins: { top: 120, bottom: 120, left: 120, right: 120 },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: h, bold: true, size: 22, font: "Times New Roman" })]
        })
      ]
    }))
  });

  const bodyRows = rows.map(r => new TableRow({
    children: r.map((cellText, idx) => new TableCell({
      width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      children: [
        new Paragraph({
          alignment: idx === 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
          children: [new TextRun({ text: cellText, size: 22, font: "Times New Roman" })]
        })
      ]
    }))
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: border, bottom: border, left: border, right: border,
      insideHorizontal: border, insideVertical: border
    },
    rows: [headerRow, ...bodyRows]
  });
}

function createTableCaption(tableCode, caption) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 140, after: 60 },
    children: [
      new TextRun({
        text: `${tableCode}. ${caption}`,
        bold: true,
        size: 24,
        font: "Times New Roman",
        color: "1F2937"
      })
    ]
  });
}

// BUILD DOCUMENT SECTIONS
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Times New Roman", size: 26, color: "111827" },
        paragraph: { spacing: { line: 320 } }
      },
      heading1: {
        run: { font: "Times New Roman", size: 36, bold: true, color: PRIMARY_COLOR },
        paragraph: { spacing: { before: 400, after: 200 } }
      },
      heading2: {
        run: { font: "Times New Roman", size: 30, bold: true, color: "1F2937" },
        paragraph: { spacing: { before: 260, after: 140 } }
      },
      heading3: {
        run: { font: "Times New Roman", size: 26, bold: true, italics: true, color: "374151" },
        paragraph: { spacing: { before: 200, after: 100 } }
      }
    }
  },
  sections: [
    // COVER PAGE
    {
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "BỘ GIÁO DỤC VÀ ĐÀO TẠO", size: 28, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 300 },
          children: [new TextRun({ text: "TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN", size: 30, bold: true, color: PRIMARY_COLOR })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 800 },
          children: [new TextRun({ text: "KHOA KỸ THUẬT PHẦN MỀM", size: 26, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 160 },
          children: [new TextRun({ text: "BÁO CÁO ĐỒ ÁN TỐT NGHIỆP", size: 34, bold: true, color: ACCENT_COLOR })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 160, after: 200 },
          children: [new TextRun({ text: "ĐỀ TÀI:", size: 26, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 800 },
          children: [new TextRun({
            text: "XÂY DỰNG HỆ THỐNG QUẢN LÝ THI CÔNG, BẢO TRÌ THIẾT BỊ PCCC VÀ ĐIỀU PHỐI KỸ THUẬT TÍCH HỢP TRÍ TUỆ NHÂN TẠO (FIREGUARD AI)",
            size: 32,
            bold: true,
            color: PRIMARY_COLOR
          })]
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 400, after: 80 },
          children: [new TextRun({ text: "Giảng viên hướng dẫn: TS. Nguyễn Văn A", size: 26, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 80, after: 80 },
          children: [new TextRun({ text: "Sinh viên thực hiện:    Hồ Tiến Đạt - MSSV: 20210001", size: 26 })]
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 80, after: 1200 },
          children: [new TextRun({ text: "Chuyên ngành:             Kỹ thuật Phần mềm", size: 26 })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 600, after: 100 },
          children: [new TextRun({ text: "TP. HỒ CHÍ MINH, NĂM 2026", size: 24, bold: true })]
        }),
        new Paragraph({ children: [new PageBreak()] })
      ]
    },

    // MỤC LỤC & DANH MỤC
    {
      properties: {
        page: { pageNumbers: { start: 1 } }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: "Báo Cáo Đồ Án - Hệ Thống FireGuard AI", size: 18, italics: true, color: "9CA3AF" })]
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ children: [PageNumber.CURRENT], size: 22 })]
            })
          ]
        })
      },
      children: [
        // MỤC LỤC
        new Paragraph({
          text: "MỤC LỤC",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 300 }
        }),
        p("DANH MỤC TỪ VIẾT TẮT ............................................................................................................................ Trang 4", { bold: true }),
        p("DANH MỤC HÌNH VẼ .................................................................................................................................... Trang 5", { bold: true }),
        p("DANH MỤC BẢNG ......................................................................................................................................... Trang 6", { bold: true }),
        p("Chương 1. TỔNG QUAN ĐỀ TÀI ................................................................................................................... Trang 7", { bold: true }),
        p("   1.1. Giới thiệu đề tài .................................................................................................................................... 7"),
        p("   1.2. Lý do chọn đề tài .................................................................................................................................. 7"),
        p("   1.3. Phát biểu bài toán ................................................................................................................................ 8"),
        p("   1.4. Mục tiêu đề tài ..................................................................................................................................... 9"),
        p("   1.5. Phạm vi đề tài ...................................................................................................................................... 9"),
        p("   1.6. Phương pháp thực hiện đề tài .............................................................................................................. 10"),
        p("        1.6.1. Phương pháp khảo sát và thu thập yêu cầu ................................................................................. 10"),
        p("        1.6.2. Phương pháp phân tích và thiết kế hệ thống .............................................................................. 10"),
        p("        1.6.3. Phương pháp phát triển hệ thống ................................................................................................. 10"),
        p("        1.6.4. Phương pháp cài đặt và triển khai ................................................................................................ 11"),
        p("        1.6.5. Phương pháp kiểm thử và đánh giá .............................................................................................. 11"),
        p("   1.7. Khảo sát liên quan hệ thống ................................................................................................................. 11"),
        p("   1.8. Bố cục báo cáo ..................................................................................................................................... 12"),
        p("Chương 2. CƠ SỞ LÝ THUYẾT ..................................................................................................................... Trang 13", { bold: true }),
        p("   2.1. Các khái niệm nền tảng liên quan bài toán ......................................................................................... 13"),
        p("        2.1.1. Khái niệm về dịch vụ thi công, kiểm định và bảo trì PCCC ........................................................... 13"),
        p("        2.1.2. Đối tượng khách hàng và cơ sở trang bị PCCC ............................................................................ 13"),
        p("        2.1.3. Đội trưởng thi công và Kỹ thuật viên bảo trì .............................................................................. 14"),
        p("        2.1.4. Đặt lịch & phân công công việc (Thợ 1, 2, 3, 4 nội bộ) ................................................................ 14"),
        p("        2.1.5. Nhật ký thi công và ảnh nghiệm thu hiện trường ........................................................................ 15"),
        p("        2.1.6. Dashboard theo dõi thời gian thực ............................................................................................. 15"),
        p("        2.1.7. Hệ thống quản lý thông minh FireGuard AI .................................................................................. 16"),
        p("   2.2. Các phương pháp, mô hình, thuật toán sử dụng ................................................................................. 16"),
        p("        2.2.1. Ngôn ngữ mô hình hóa UML ......................................................................................................... 16"),
        p("        2.2.2. Mô hình kiến trúc MVC và Clean Architecture ............................................................................. 17"),
        p("        2.2.3. Mô hình cơ sở dữ liệu quan hệ (RDBMS) ...................................................................................... 17"),
        p("        2.2.4. Thuật toán gợi ý người chăm sóc / kỹ thuật viên phù hợp ............................................................ 18"),
        p("        2.2.5. Luồng xử lý yêu cầu trong hệ thống ............................................................................................. 19"),
        p("   2.3. Công nghệ sử dụng ............................................................................................................................... 20"),
        p("        2.3.1. Giới thiệu công nghệ ..................................................................................................................... 20"),
        p("        2.3.2. Các đặc điểm chính của công nghệ ................................................................................................ 20"),
        p("        2.3.3. Vai trò của công nghệ sử dụng trong đồ án .................................................................................... 21"),
        p("        2.3.4. Lý do sử dụng công nghệ ............................................................................................................... 21"),
        p("   2.4. Các nghiên cứu, hệ thống liên quan .................................................................................................... 22"),
        p("        2.4.1. Hệ thống bTaskee / Phần mềm dịch vụ hiện có ............................................................................. 22"),
        p("        2.4.2. Hệ thống Care247 / Phần mềm quản lý chuyên ngành .................................................................. 22"),
        p("        2.4.3. So sánh với đề tài FireGuard AI .................................................................................................... 23"),
        p("Chương 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG ........................................................................................ Trang 24", { bold: true }),
        p("   3.1. Giới thiệu hệ thống ............................................................................................................................... 24"),
        p("        3.1.1. Mục tiêu xây dựng hệ thống .......................................................................................................... 24"),
        p("        3.1.2. Các nhóm người dùng .................................................................................................................... 24"),
        p("        3.1.3. Các chức năng chính của hệ thống ................................................................................................ 25"),
        p("   3.2. Kiến trúc hệ thống ................................................................................................................................ 26"),
        p("        3.2.1. Kiến trúc tổng thể hệ thống ........................................................................................................... 26"),
        p("        3.2.2. Các thành phần trong kiến trúc MVC / Clean Architecture ............................................................ 26"),
        p("        3.2.3. Luồng xử lý tổng quát của hệ thống ............................................................................................. 27"),
        p("   3.3. Phân tích chức năng hệ thống ............................................................................................................. 28"),
        p("        3.3.1. Sơ đồ Use Case tổng quát ............................................................................................................. 28"),
        p("        3.3.2. Đặc tả các Use Case chính ............................................................................................................ 29"),
        p("   3.4. Mô hình hóa hệ thống ........................................................................................................................... 32"),
        p("        3.4.1. Sơ đồ lớp (Class Diagram) ............................................................................................................ 32"),
        p("        3.4.2. Sơ đồ hoạt động (Activity Diagram) .............................................................................................. 33"),
        p("        3.4.3. Sơ đồ thực thể – liên kết (ERD) ..................................................................................................... 34"),
        p("   3.5. Thiết kế cơ sở dữ liệu ........................................................................................................................... 35"),
        p("        3.5.1. Lược đồ cơ sở dữ liệu .................................................................................................................... 35"),
        p("        3.5.2. Thiết kế các bảng dữ liệu ............................................................................................................... 35"),
        p("        3.5.3. Các mối quan hệ giữa các bảng ..................................................................................................... 37"),
        p("        3.5.4. Các ràng buộc dữ liệu .................................................................................................................... 37"),
        p("   3.6. Thiết kế giao diện hệ thống ................................................................................................................. 38"),
        p("        3.6.1. Giao diện đăng nhập ...................................................................................................................... 38"),
        p("        3.6.2. Giao diện Dashboard (Quản trị viên, Khách hàng, Đội ngũ kỹ thuật) ............................................. 39"),
        p("        3.6.3. Giao diện quản lý người dùng ........................................................................................................ 40"),
        p("        3.6.4. Giao diện quản lý đối tượng phục vụ / Dự án thi công ................................................................. 41"),
        p("        3.6.5. Giao diện quản lý nhân sự / Đội ngũ kỹ thuật viên ........................................................................ 42"),
        p("        3.6.6. Giao diện quản lý dịch vụ / Thiết bị PCCC & Kho ........................................................................... 43"),
        p("        3.6.7. Giao diện đặt lịch chăm sóc / Bảo trì & GPS Check-in .................................................................... 44"),
        p("        3.6.8. Giao diện nhật ký thi công / Nhật ký nghiệm thu ảnh ................................................................... 45"),
        p("        3.6.9. Giao diện thanh toán / Báo giá AI & Hợp đồng .............................................................................. 46"),
        p("        3.6.10. Giao diện đánh giá dịch vụ & Bàn giao tài sản ............................................................................. 47"),
        p("Chương 4. TRIỂN KHAI VÀ ĐÁNH GIÁ HỆ THỐNG ........................................................................................ Trang 48", { bold: true }),
        p("   4.1. Môi trường triển khai ........................................................................................................................... 48"),
        p("   4.2. Kết quả triển khai các chức năng ......................................................................................................... 49"),
        p("   4.3. Kết quả giao diện và hoạt động thực tế ............................................................................................... 50"),
        p("   4.4. Kiểm thử hệ thống ................................................................................................................................ 51"),
        p("        4.4.1. Phương pháp và phạm vi kiểm thử ............................................................................................... 51"),
        p("        4.4.2. Kiểm thử các chức năng chính ....................................................................................................... 51"),
        p("        4.4.3. Kiểm thử các trường hợp ngoại lệ ................................................................................................. 52"),
        p("        4.4.4. Kiểm thử phân quyền theo vai trò ................................................................................................. 53"),
        p("   4.5. Đánh giá kết quả ................................................................................................................................... 54"),
        p("        4.5.1. Mức độ đáp ứng các mục tiêu ....................................................................................................... 54"),
        p("        4.5.2. Kết quả đạt được ........................................................................................................................... 55"),
        p("        4.5.3. Những hạn chế còn tồn tại ............................................................................................................ 55"),
        p("Chương 5. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN ............................................................................................ Trang 56", { bold: true }),
        p("   5.1. Kết luận ................................................................................................................................................ 56"),
        p("   5.2. Hướng phát triển ................................................................................................................................. 56"),
        p("   5.3. Trải nghiệm học tập và kỹ năng đạt được ............................................................................................ 57"),
        new Paragraph({ children: [new PageBreak()] }),

        // DANH MỤC TỪ VIẾT TẮT
        new Paragraph({
          text: "DANH MỤC TỪ VIẾT TẮT",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 300 }
        }),
        createCustomTable(
          ["STT", "Từ viết tắt", "Thuật ngữ tiếng Anh", "Giải nghĩa tiếng Việt"],
          [
            ["1", "PCCC", "Fire Prevention and Fighting", "Phòng cháy chữa cháy"],
            ["2", "AI", "Artificial Intelligence", "Trí tuệ nhân tạo"],
            ["3", "GPS", "Global Positioning System", "Hệ thống định vị toàn cầu"],
            ["4", "TCVN", "Vietnam National Standard", "Tiêu chuẩn Quốc gia Việt Nam"],
            ["5", "UML", "Unified Modeling Language", "Ngôn ngữ mô hình hóa thống nhất"],
            ["6", "MVC", "Model - View - Controller", "Mô hình kiến trúc Phần mềm"],
            ["7", "SPA", "Single Page Application", "Ứng dụng web trang đơn"],
            ["8", "API", "Application Programming Interface", "Giao diện lập trình ứng dụng"],
            ["9", "REST", "Representational State Transfer", "Kiểu kiến trúc truyền tải trạng thái đại diện"],
            ["10", "JWT", "JSON Web Token", "Chuẩn mã hóa thông tin xác thực"],
            ["11", "RDBMS", "Relational Database Management System", "Hệ quản trị cơ sở dữ liệu quan hệ"],
            ["12", "ERD", "Entity Relationship Diagram", "Sơ đồ thực thể - liên kết"],
            ["13", "DFD", "Data Flow Diagram", "Sơ đồ luồng dữ liệu"],
            ["14", "BFD", "Business Function Diagram", "Sơ đồ phân rã chức năng nghiệp vụ"],
            ["15", "UI/UX", "User Interface / User Experience", "Giao diện / Trải nghiệm người dùng"]
          ]
        ),
        new Paragraph({ children: [new PageBreak()] }),

        // DANH MỤC HÌNH VẼ
        new Paragraph({
          text: "DANH MỤC HÌNH VẼ",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 300 }
        }),
        p("Hình 3.1. Sơ đồ Use Case tổng quát của hệ thống ............................................................................................ Trang 28"),
        p("Hình 3.2. Sơ đồ lớp (Class Diagram) ..................................................................................................................... Trang 32"),
        p("Hình 3.3. Activity Diagram tổng quát của hệ thống ................................................................................................ Trang 33"),
        p("Hình 3.4. Sơ đồ ERD của hệ thống ........................................................................................................................ Trang 34"),
        p("Hình 3.5. Giao diện đăng nhập ............................................................................................................................... Trang 38"),
        p("Hình 3.6. Giao diện Dashboard của khách hàng ................................................................................................... Trang 39"),
        p("Hình 3.7. Giao diện Dashboard của quản trị viên ................................................................................................... Trang 39"),
        p("Hình 3.8. Giao diện Dashboard của người phụ trách kỹ thuật / Đội trưởng thi công ................................................ Trang 40"),
        p("Hình 3.9. Giao diện quản lý người dùng ................................................................................................................. Trang 40"),
        p("Hình 3.10. Giao diện quản lý đối tượng phục vụ / Dự án thi công .......................................................................... Trang 41"),
        p("Hình 3.11. Giao diện phân công công việc thợ thi công nội bộ 1, 2, 3, 4 ............................................................... Trang 42"),
        p("Hình 3.12. Giao diện quản lý dịch vụ / Thiết bị kho PCCC .................................................................................... Trang 43"),
        p("Hình 3.13. Giao diện đặt lịch & Check-in GPS bảo trì ............................................................................................ Trang 44"),
        p("Hình 3.14. Giao diện nhật ký chăm sóc & nghiệm thu ảnh hiện trường ................................................................ Trang 45"),
        p("Hình 3.15. Giao diện thanh toán & Báo giá đề xuất tự động AI ............................................................................ Trang 46"),
        p("Hình 3.16. Giao diện đánh giá dịch vụ & Bàn giao nghiệm thu tài sản ................................................................... Trang 47"),
        new Paragraph({ children: [new PageBreak()] }),

        // DANH MỤC BẢNG
        new Paragraph({
          text: "DANH MỤC BẢNG",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 300 }
        }),
        p("Bảng 2.1. Thông tin cơ bản của hồ sơ đối tượng phục vụ / Công trình PCCC ..................................................... Trang 14"),
        p("Bảng 2.2. Các sơ đồ UML sử dụng trong hệ thống ................................................................................................. Trang 16"),
        p("Bảng 2.3. Các tiêu chí và trọng số mặc định trong cơ chế gợi ý nhân sự kỹ thuật / Báo giá AI ............................ Trang 18"),
        p("Bảng 2.4. Các công nghệ chính sử dụng trong hệ thống ........................................................................................ Trang 20"),
        p("Bảng 2.5. So sánh các hệ thống liên quan với hệ thống đề tài ................................................................................ Trang 23"),
        p("Bảng 3.1. Các nhóm người dùng của hệ thống ....................................................................................................... Trang 24"),
        p("Bảng 3.2. Một số bảng dữ liệu chính của hệ thống ................................................................................................ Trang 36"),
        p("Bảng 4.1. Các thành phần của môi trường triển khai ............................................................................................ Trang 48"),
        p("Bảng 4.2. Các nhóm chức năng đã được xây dựng ................................................................................................. Trang 49"),
        p("Bảng 4.3. Kịch bản kiểm thử các chức năng chính ................................................................................................. Trang 51"),
        p("Bảng 4.4. Kịch bản kiểm thử các trường hợp ngoại lệ .......................................................................................... Trang 52"),
        p("Bảng 4.5. Kịch bản kiểm thử phân quyền theo vai trò ........................................................................................... Trang 53"),
        p("Bảng 4.6. Đối chiếu mục tiêu với nội dung đã triển khai ........................................................................................ Trang 54"),
        new Paragraph({ children: [new PageBreak()] }),

        // CHƯƠNG 1
        createHeaderTitle("Chương 1. TỔNG QUAN ĐỀ TÀI"),
        createSubHeading("1.1. Giới thiệu đề tài"),
        p("Trong xu thế chuyển đổi số và đô thị hóa nhanh chóng hiện nay, an toàn phòng cháy chữa cháy (PCCC) là một trong những ưu tiên hàng đầu của mọi doanh nghiệp, tòa nhà chung cư, nhà máy sản xuất và cơ sở hạ tầng. Tuy nhiên, việc thi công hệ thống PCCC, kiểm định thiết bị định kỳ và bảo trì kỹ thuật thường gặp phải nhiều rào cản do quy trình thủ công, thông tin rời rạc và thiếu cơ chế giám sát hiện trường minh bạch."),
        p("Đề tài nghiên cứu và xây dựng hệ thống 'FireGuard AI' (nền tảng số hóa quản lý thi công, bảo trì thiết bị PCCC và điều phối kỹ thuật thông minh tích hợp trí tuệ nhân tạo). Hệ thống cung cấp giải pháp toàn diện kết nối chặt chẽ giữa Quản trị viên, Đội trưởng thi công, Kỹ thuật viên bảo trì, Nhân viên kinh doanh và Khách hàng trên nền tảng Web thời gian thực."),

        createSubHeading("1.2. Lý do chọn đề tài"),
        bullet("Tính cấp thiết về an toàn PCCC: Các quy chuẩn PCCC (đặc biệt là TCVN 3890:2023) yêu cầu kiểm định và kiểm tra định kỳ nghiêm ngặt đối với hệ thống báo cháy, chữa cháy tự động, bình cứu hỏa và đèn chỉ dẫn thoát nạn.", "Thứ nhất:"),
        bullet("Hạn chế của phương pháp thủ công: Trước đây việc giám sát tiến độ thi công chủ yếu dùng sổ sách hoặc tin nhắn Zalo, dẫn đến việc thiếu bằng chứng hình ảnh nghiệm thu thực tế và khó truy cứu trách nhiệm khi có sự cố.", "Thứ hai:"),
        bullet("Tối ưu hóa quản lý nhân lực tại công trường: Đội trưởng thi công tại hiện trường cần phân công linh hoạt các thợ phụ/nhân công (thợ 1, 2, 3, 4) theo từng ca làm việc mà không làm phình to hoặc phức tạp hóa cơ sở dữ liệu máy chủ.", "Thứ ba:"),
        bullet("Ứng dụng AI và định vị GPS: Tự động hóa đề xuất cấu hình báo giá thiết bị tối ưu chi phí và xác thực vị trí GPS kỹ thuật viên khi bảo trì định kỳ.", "Thứ tư:"),

        createSubHeading("1.3. Phát biểu bài toán"),
        p("Bài toán đặt ra cho hệ thống là số hóa toàn bộ quy trình cung cấp dịch vụ kỹ thuật an toàn:"),
        bullet("Quản lý hồ sơ công trình, tòa nhà, tài sản thiết bị PCCC theo mã QR và Serial riêng biệt."),
        bullet("Quy trình điều phối nhân sự thông minh: Hỗ trợ Đội trưởng thi công tại hiện trường phân công thợ thi công 1, 2, 3, 4 theo ca làm việc linh hoạt."),
        bullet("Xác thực tiến độ thi công và bảo trì bằng hình ảnh thực tế bắt buộc chụp tại hiện trường và gửi về Dashboard quản trị."),
        bullet("Cơ chế xác thực vị trí GPS bảo đảm kỹ thuật viên có mặt trong bán kính cho phép (≤ 1km) trước khi bắt đầu công việc."),
        bullet("Tự động hóa dự toán báo giá thiết bị dựa trên diện tích, mật độ rủi ro và các tiêu chuẩn PCCC hiện hành."),

        createSubHeading("1.4. Mục tiêu đề tài"),
        p("Mục tiêu tổng quát: Xây dựng hệ thống dưới dạng ứng dụng web nhằm quản lý và kết nối các hoạt động trong dịch vụ thi công, bảo dưỡng, kiểm tra thiết bị an toàn trên một nền tảng thống nhất, hỗ trợ quy trình từ quản lý hồ sơ, phân công kỹ thuật, cập nhật tiến độ bằng hình ảnh, check-in định vị đến nghiệm thu bàn giao tài sản và đánh giá chất lượng dịch vụ.", { bold: true }),
        p("Mục tiêu cụ thể:"),
        bullet("Xây dựng module Đội trưởng thi công cho phép phân công nhanh danh sách nhân công 1, 2, 3, 4 tại chỗ và cập nhật tiến độ công trình kèm ảnh chụp hiện trường."),
        bullet("Xây dựng module Kỹ thuật viên bảo trì tích hợp định vị GPS (khoảng cách sai số < 1km) và yêu cầu tải ảnh nghiệm thu thực tế trước khi hoàn thành đơn vị công việc."),
        bullet("Xây dựng module Báo giá thông minh gợi ý danh mục thiết bị, số lượng đầu phun sprinkler, bình bột ABC, đầu báo khói theo diện tích mặt sàn."),
        bullet("Xây dựng hệ thống quản trị kho mã vạch và truy xuất nguồn gốc linh kiện PCCC."),

        createSubHeading("1.5. Phạm vi đề tài"),
        bullet("Đối tượng quản lý: Các dự án thi công lắp đặt hệ thống PCCC, đơn yêu cầu kiểm định và bảo trì định kỳ thiết bị."),
        bullet("Đối tượng người dùng: Ban giám đốc / Quản trị viên (Admin), Đội trưởng thi công (Installation Leader), Kỹ thuật viên (Technician), Nhân viên kinh doanh (Sales/Surveyor), Thủ kho (Warehouse Keeper) và Khách hàng."),
        bullet("Môi trường triển khai: Ứng dụng Web tương thích đa nền tảng (Desktop, Laptop, Tablet, Mobile Responsive)."),

        createSubHeading("1.6. Phương pháp thực hiện đề tài"),
        createSubSubHeading("1.6.1. Phương pháp khảo sát và thu thập yêu cầu"),
        p("Khảo sát quy trình nghiệp vụ thực tế tại các công ty lắp đặt thiết bị PCCC và bảo trì tòa nhà; nghiên cứu tiêu chuẩn TCVN 3890:2023 để xác định các chỉ tiêu kỹ thuật cần số hóa."),
        createSubSubHeading("1.6.2. Phương pháp phân tích và thiết kế hệ thống"),
        p("Áp dụng phương pháp phân tích hướng đối tượng (OOAD) kết hợp các biểu đồ chuẩn UML (Use Case, Activity, Sequence, Class Diagram) và mô hình hóa cơ sở dữ liệu quan hệ (ERD)."),
        createSubSubHeading("1.6.3. Phương pháp phát triển hệ thống"),
        p("Sử dụng mô hình Agile/Scrum lặp ngắn, xây dựng backend API theo kiến trúc Clean Architecture (.NET 8 Web API) kết hợp frontend React SPA (Vite, TypeScript, TailwindCSS, Lucide Icons)."),
        createSubSubHeading("1.6.4. Phương pháp cài đặt và triển khai"),
        p("Đóng gói ứng dụng chạy trên nền tảng đám mây / máy chủ cục bộ với Microsoft SQL Server và SignalR WebSocket phục vụ truyền nhận dữ liệu thời gian thực."),
        createSubSubHeading("1.6.5. Phương pháp kiểm thử và đánh giá"),
        p("Thực hiện kiểm thử đơn vị (Unit Test), kiểm thử tích hợp (Integration Test) và kiểm thử chức năng theo kịch bản người dùng thực tế bao gồm cả các trường hợp ngoại lệ và phân quyền bảo mật."),

        createSubHeading("1.7. Khảo sát liên quan hệ thống"),
        p("Khảo sát các giải pháp quản lý dịch vụ hiện nay (như bTaskee, Care247, phần mềm quản lý bảo trì CMMS truyền thống). Các giải pháp này thường chỉ giải quyết một phần dịch vụ gia đình đơn giản hoặc quá cồng kềnh, thiếu vắng các tính năng chuyên thù của ngành an toàn PCCC như nghiệm thu ảnh hiện trường bắt buộc, quản lý thợ thi công linh hoạt và định vị khoảng cách GPS."),

        createSubHeading("1.8. Bố cục báo cáo"),
        p("Báo cáo đồ án được kết cấu thành 5 chương chính:"),
        bullet("Chương 1: Tổng quan đề tài - Giới thiệu bối cảnh, lý do, mục tiêu, phạm vi và phương pháp thực hiện."),
        bullet("Chương 2: Cơ sở lý thuyết - Trình bày các khái niệm nền tảng, mô hình UML, kiến trúc Clean Architecture, thuật toán gợi ý và công nghệ sử dụng."),
        bullet("Chương 3: Phân tích và thiết kế hệ thống - Mô tả chi tiết kiến trúc, biểu đồ Use Case, đặc tả nghiệp vụ, ERD, Class Diagram và thiết kế các màn hình giao diện."),
        bullet("Chương 4: Triển khai và đánh giá hệ thống - Môi trường triển khai, kết quả chức năng, kịch bản kiểm thử và đối chiếu mục tiêu."),
        bullet("Chương 5: Kết luận và hướng phát triển - Đánh giá tổng kết, hạn chế tồn đọng và hướng mở rộng tương lai."),
        new Paragraph({ children: [new PageBreak()] }),

        // CHƯƠNG 2
        createHeaderTitle("Chương 2. CƠ SỞ LÝ THUYẾT"),
        createSubHeading("2.1. Các khái niệm nền tảng liên quan bài toán"),
        createSubSubHeading("2.1.1. Khái niệm về dịch vụ thi công, kiểm định và bảo trì PCCC"),
        p("Dịch vụ PCCC bao gồm các công đoạn khảo sát mặt bằng, lập dự toán thiết kế, thi công lắp đặt đường ống, đầu phun, tủ trung tâm báo cháy và công tác kiểm tra, thử áp lực, bảo dưỡng định kỳ hàng quý/hàng năm theo luật định."),
        createSubSubHeading("2.1.2. Đối tượng khách hàng và cơ sở trang bị PCCC"),
        p("Đối tượng khách hàng là chủ đầu tư, ban quản trị chung cư, ban quản lý nhà máy xí nghiệp hoặc các chủ cơ sở kinh doanh dịch vụ có yêu cầu nghiêm ngặt về thẩm duyệt nghiệm thu PCCC."),
        createTableCaption("Bảng 2.1", "Thông tin cơ bản của hồ sơ đối tượng phục vụ / Công trình PCCC"),
        createCustomTable(
          ["Trường dữ liệu", "Ý nghĩa nghiệp vụ", "Kiểu dữ liệu", "Ghi chú"],
          [
            ["CustomerId", "Mã định danh khách hàng", "Guid", "Khóa chính"],
            ["CompanyName", "Tên cơ sở / Tòa nhà", "NVARCHAR(200)", "Bắt buộc"],
            ["Address", "Địa chỉ công trình", "NVARCHAR(300)", "Xác định tọa độ GPS"],
            ["RiskLevel", "Mức độ nguy cơ cháy", "NVARCHAR(50)", "Cao / Trung bình / Thấp"],
            ["ContactPerson", "Đại diện phụ trách", "NVARCHAR(100)", "Số điện thoại liên hệ"]
          ]
        ),
        createSubSubHeading("2.1.3. Đội trưởng thi công và Kỹ thuật viên bảo trì"),
        p("Đội trưởng thi công (Installation Leader) chịu trách nhiệm toàn diện tại công trường, điều hành thợ cơ hữu và thợ phụ. Kỹ thuật viên bảo trì (Technician) là nhân sự di động chuyên xử lý sự cố thiết bị và bảo dưỡng định kỳ."),
        createSubSubHeading("2.1.4. Đặt lịch & phân công công việc (Thợ 1, 2, 3, 4 nội bộ)"),
        p("Quy trình phân công cho phép Đội trưởng phân việc cho từng nhân công nội bộ (Thợ 1, Thợ 2, Thợ 3, Thợ 4) theo từng hạng mục (kéo dây, lắp tủ, hàn ống) mà không cần tạo tài khoản riêng cho từng lao động thời vụ, giúp bảo vệ dữ liệu tinh gọn."),
        createSubSubHeading("2.1.5. Nhật ký thi công và ảnh nghiệm thu hiện trường"),
        p("Mọi mốc tiến độ thi công và phiếu bảo trì bắt buộc phải được minh chứng bằng ảnh chụp trực tiếp từ camera hiện trường, kèm tọa độ và dấu thời gian để làm căn cứ quyết toán và lưu trữ hồ sơ thẩm duyệt."),
        createSubSubHeading("2.1.6. Dashboard theo dõi thời gian thực"),
        p("Bảng điều khiển trực quan cung cấp số liệu tổng quan về tiến độ % các dự án, số đơn bảo dưỡng đang xử lý, cảnh báo sự cố khẩn cấp và trạng thái kho hàng."),
        createSubSubHeading("2.1.7. Hệ thống quản lý thông minh FireGuard AI"),
        p("Một nền tảng tích hợp toàn diện quy trình khép kín từ Khảo sát -> Báo giá AI -> Xuất kho -> Thi công phân công thợ -> Nghiệm thu ảnh -> Bảo dưỡng định kỳ."),

        createSubHeading("2.2. Các phương pháp, mô hình, thuật toán sử dụng"),
        createSubSubHeading("2.2.1. Ngôn ngữ mô hình hóa UML"),
        p("Sử dụng các sơ đồ chuẩn UML nhằm trực quan hóa kiến trúc hệ thống và quy trình nghiệp vụ."),
        createTableCaption("Bảng 2.2", "Các sơ đồ UML sử dụng trong hệ thống"),
        createCustomTable(
          ["Tên sơ đồ", "Mục đích sử dụng", "Phân hệ áp dụng"],
          [
            ["Use Case Diagram", "Mô tả tương tác giữa tác nhân và hệ thống", "Toàn hệ thống"],
            ["Activity Diagram", "Mô tả luồng hoạt động nghiệp vụ thi công & bảo trì", "Đội trưởng & Kỹ thuật viên"],
            ["Sequence Diagram", "Mô tả tương tác tuần tự giữa các đối tượng", "Check-in GPS & Bàn giao nghiệm thu"],
            ["Class Diagram", "Mô hình hóa cấu trúc lớp và thuộc tính", "Kiến trúc phần mềm Clean Architecture"],
            ["ERD", "Mô hình hóa dữ liệu quan hệ", "Cơ sở dữ liệu SQL Server"]
          ]
        ),
        createSubSubHeading("2.2.2. Mô hình kiến trúc MVC và Clean Architecture"),
        p("Hệ thống kết hợp ưu điểm của mô hình MVC và Clean Architecture: phân tách rõ rệt tầng Domain, Application (Use Cases), Infrastructure (Database, SignalR) và Presentation (REST API + React SPA)."),
        createSubSubHeading("2.2.3. Mô hình cơ sở dữ liệu quan hệ (RDBMS)"),
        p("Sử dụng Microsoft SQL Server đảm bảo tính toàn vẹn dữ liệu (ACID), hỗ trợ các khóa ngoại, ràng buộc duy nhất và giao dịch tài chính báo giá an toàn tuyệt đối."),
        createSubSubHeading("2.2.4. Thuật toán gợi ý người chăm sóc / kỹ thuật viên phù hợp"),
        p("Hệ thống ứng dụng thuật toán tính điểm trọng số đa tiêu chí (Multi-Criteria Weighted Scoring) để tìm kiếm kỹ thuật viên phù hợp nhất hoặc gợi ý báo giá thiết bị PCCC."),
        createTableCaption("Bảng 2.3", "Các tiêu chí và trọng số mặc định trong cơ chế gợi ý kỹ thuật viên / Báo giá AI"),
        createCustomTable(
          ["Tiêu chí đánh giá", "Mô tả chi tiết", "Trọng số (W)", "Thang điểm (1-10)"],
          [
            ["Khoảng cách địa lý (GPS)", "Khoảng cách từ vị trí kỹ thuật viên đến công trình", "0.35", "Càng gần điểm càng cao"],
            ["Kỹ năng chuyên môn", "Chứng chỉ hành nghề PCCC phù hợp với loại công trình", "0.25", "Khớp chứng chỉ = 10 điểm"],
            ["Mức độ sẵn sàng", "Số lượng công việc đang xử lý trong ngày", "0.20", "Đang rảnh = 10 điểm"],
            ["Đánh giá lịch sử", "Điểm đánh giá sao từ khách hàng trước đó", "0.20", "Điểm rating trung bình"]
          ]
        ),
        createSubSubHeading("2.2.5. Luồng xử lý yêu cầu trong hệ thống"),
        p("Khi người dùng gửi yêu cầu từ giao diện React, yêu cầu được đóng gói qua Axios kèm Bearer JWT Token gửi đến ASP.NET Core API Gateway -> kiểm tra quyền -> xử lý nghiệp vụ tại Service Layer -> lưu trữ cơ sở dữ liệu -> đồng thời phát thông báo Realtime qua SignalR Hub."),

        createSubHeading("2.3. Công nghệ sử dụng"),
        createTableCaption("Bảng 2.4", "Các công nghệ chính sử dụng trong hệ thống"),
        createCustomTable(
          ["Thành phần", "Công nghệ", "Phiên bản", "Vai trò trong hệ thống"],
          [
            ["Backend Framework", "ASP.NET Core Web API", "8.0", "Xây dựng RESTful API và Business Logic"],
            ["Frontend Library", "React + TypeScript", "18.x", "Giao diện người dùng SPA hiện đại, Type-safe"],
            ["Build Tool", "Vite", "5.x", "Môi trường phát triển và đóng gói frontend siêu tốc"],
            ["Styling", "TailwindCSS + Lucide Icons", "3.x", "Thiết kế giao diện Responsive, hiện đại"],
            ["Database", "Microsoft SQL Server", "2022", "Lưu trữ dữ liệu quan hệ bảo mật cao"],
            ["Real-time Comm", "SignalR WebSocket", "8.0", "Cập nhật tiến độ và thông báo tức thì"]
          ]
        ),

        createSubHeading("2.4. Các nghiên cứu, hệ thống liên quan"),
        createTableCaption("Bảng 2.5", "So sánh các hệ thống liên quan với hệ thống FireGuard AI"),
        createCustomTable(
          ["Tiêu chí so sánh", "bTaskee / Dịch vụ gia đình", "Hệ thống CMMS truyền thống", "FireGuard AI (Đề tài)"],
          [
            ["Lĩnh vực chuyên môn", "Giúp việc, sửa chữa gia đình nhỏ", "Bảo trì máy móc nhà máy chung", "Chuyên sâu an toàn PCCC & cứu nạn"],
            ["Phân công thợ nội bộ", "Không hỗ trợ (chỉ 1-1)", "Cồng kềnh, cần cấp user riêng", "Linh hoạt phân công thợ 1-4 tại chỗ"],
            ["Bắt buộc ảnh nghiệm thu", "Tùy chọn", "Thường upload file báo cáo sau", "Bắt buộc chụp ảnh trước khi đóng đơn"],
            ["Xác thực GPS hiện trường", "Định vị vị trí khách", "Không bắt buộc", "Xác thực GPS sai số ≤ 1km"],
            ["Báo giá thông minh AI", "Giá cố định theo giờ", "Nhập tay từng linh kiện", "Tự động gợi ý bóc tách theo TCVN"]
          ]
        ),
        new Paragraph({ children: [new PageBreak()] }),

        // CHƯƠNG 3
        createHeaderTitle("Chương 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG"),
        createSubHeading("3.1. Giới thiệu hệ thống"),
        createSubSubHeading("3.1.1. Mục tiêu xây dựng hệ thống"),
        p("Hệ thống giải quyết toàn diện bài toán quản lý chất lượng thi công PCCC, kiểm soát tiến độ thời gian thực và tự động hóa hồ sơ pháp lý thiết bị."),
        createSubSubHeading("3.1.2. Các nhóm người dùng"),
        createTableCaption("Bảng 3.1", "Các nhóm người dùng của hệ thống"),
        createCustomTable(
          ["Nhóm người dùng (Role)", "Quyền hạn chính", "Phân hệ tương tác"],
          [
            ["Quản trị viên (Admin)", "Toàn quyền quản trị nhân sự, phê duyệt báo giá, xem KPI", "Dashboard tổng, Quản lý người dùng, Báo cáo"],
            ["Đội trưởng thi công", "Phân công thợ 1, 2, 3, 4, kéo thanh trượt tiến độ %, chụp ảnh nhật ký", "Dự án thi công, Bàn giao nghiệm thu"],
            ["Kỹ thuật viên (Technician)", "Nhận phiếu bảo trì, Check-in GPS, tải ảnh nghiệm thu hoàn thành", "Bảo trì & Sự cố, Lịch làm việc"],
            ["Nhân viên kinh doanh (Sales)", "Khảo sát hiện trường, tạo báo giá tự động AI, quản lý khách hàng", "CRM Khách hàng, Báo giá thông minh"],
            ["Thủ kho (Warehouse)", "Quản lý tồn kho, cấp phát mã Serial/QR thiết bị theo dự án", "Quản lý kho & Thiết bị"]
          ]
        ),
        createSubSubHeading("3.1.3. Các chức năng chính của hệ thống"),
        bullet("Quản lý dự án thi công & phân công thợ 1, 2, 3, 4."),
        bullet("Nhật ký công trình điện tử kèm ảnh chụp hiện trường."),
        bullet("Tiếp nhận phiếu bảo trì, xác thực GPS trong bán kính 1km và nghiệm thu ảnh bắt buộc."),
        bullet("Tự động bóc tách dự toán báo giá thiết bị PCCC bằng AI."),
        bullet("Bàn giao tài sản sang sổ theo dõi thiết bị của công trình sau khi hoàn tất thi công."),

        createSubHeading("3.2. Kiến trúc hệ thống"),
        createSubSubHeading("3.2.1. Kiến trúc tổng thể hệ thống"),
        p("Hệ thống được thiết kế theo mô hình Client - Server hiện đại, tách biệt hoàn toàn giữa Frontend Single Page Application và Backend RESTful Services."),
        createSubSubHeading("3.2.2. Các thành phần trong kiến trúc MVC / Clean Architecture"),
        bullet("Core/Domain: Chứa các Entity chính (User, Project, Ticket, EquipmentAsset, Quotation) và quy tắc nghiệp vụ cốt lõi."),
        bullet("Application: Xử lý logic Use Case, Data Transfer Objects (DTO) và Validation."),
        bullet("Infrastructure: Tương tác SQL Server qua Entity Framework Core, xử lý lưu trữ file ảnh và SignalR Realtime."),
        bullet("Presentation (API): Cung cấp các RESTful Endpoints bảo mật bằng JWT Authentication."),
        createSubSubHeading("3.2.3. Luồng xử lý tổng quát của hệ thống"),
        p("Dữ liệu được cập nhật từ hiện trường (ảnh chụp, tiến độ %, tọa độ GPS) được truyền tải tức thời về máy chủ và phân phối đến Dashboard của Quản trị viên thông qua SignalR."),

        createSubHeading("3.3. Phân tích chức năng hệ thống"),
        createSubSubHeading("3.3.1. Sơ đồ Use Case tổng quát"),
        p("Sơ đồ Use Case tổng quát thể hiện các ca sử dụng chính của Quản trị viên, Đội trưởng thi công, Kỹ thuật viên bảo trì và Khách hàng."),
        ...createImagePlaceholder("Hình 3.1", "Sơ đồ Use Case tổng quát của hệ thống", "Dán sơ đồ Use Case tổng quát thể hiện các Actor và ca sử dụng chính vào đây"),

        createSubSubHeading("3.3.2. Đặc tả các Use Case chính"),
        p("Đặc tả ca sử dụng UC-01: Phân công thợ nội bộ và Báo cáo nhật ký thi công bằng hình ảnh", { bold: true }),
        bullet("Tác nhân: Đội trưởng thi công (Installation Leader)."),
        bullet("Tiền điều kiện: Đội trưởng đã đăng nhập và được gán phụ trách ít nhất một dự án thi công."),
        bullet("Luồng sự kiện chính:"),
        bullet("1. Đội trưởng truy cập màn hình 'Dự Án Thi Công', chọn dự án đang thực hiện."),
        bullet("2. Tại tab 'Phân công công việc', Đội trưởng nhập phân công cho Thợ 1, Thợ 2, Thợ 3, Thợ 4 (lưu tạm phiên làm việc tại chỗ)."),
        bullet("3. Đội trưởng kéo thanh trượt cập nhật tỷ lệ hoàn thành (0% - 100%)."),
        bullet("4. Chọn tải lên hình ảnh chụp trực tiếp tại hiện trường kèm nội dung nhật ký công việc."),
        bullet("5. Nhấn 'Lưu & Gửi báo cáo'. Hệ thống ghi nhận và phát thông báo Realtime lên Dashboard."),
        bullet("Hậu điều kiện: Tiến độ dự án được cập nhật; ảnh hiện trường được lưu trữ minh bạch."),

        p("Đặc tả ca sử dụng UC-02: Check-in GPS và Nghiệm thu bảo trì bằng ảnh chụp", { bold: true }),
        bullet("Tác nhân: Kỹ thuật viên bảo trì (Technician)."),
        bullet("Tiền điều kiện: Kỹ thuật viên được phân công xử lý Ticket bảo trì thiết bị tại công trình."),
        bullet("Luồng sự kiện chính:"),
        bullet("1. Kỹ thuật viên đến hiện trường, nhấn nút 'Check-in vị trí' trên giao diện di động."),
        bullet("2. Hệ thống lấy tọa độ GPS từ trình duyệt và tính toán khoảng cách Haversine tới địa chỉ công trình."),
        bullet("3. Nếu khoảng cách ≤ 1km, hệ thống kích hoạt trạng thái 'In Progress' và cho phép thực hiện bảo trì."),
        bullet("4. Sau khi hoàn thành kiểm tra thiết bị, Kỹ thuật viên chụp ảnh thiết bị đã sửa chữa/thay thế."),
        bullet("5. Hệ thống kiểm tra bắt buộc có ảnh nghiệm thu mới kích hoạt nút 'Hoàn tất phiếu bảo trì'."),
        bullet("Hậu điều kiện: Ticket chuyển trạng thái 'Resolved', lịch sử bảo trì lưu lại ảnh nghiệm thu."),

        createSubHeading("3.4. Mô hình hóa hệ thống"),
        createSubSubHeading("3.4.1. Sơ đồ lớp (Class Diagram)"),
        p("Sơ đồ lớp mô tả cấu trúc các thực thể dữ liệu chính và mối quan hệ giữa chúng trong hệ thống."),
        ...createImagePlaceholder("Hình 3.2", "Sơ đồ lớp (Class Diagram) của hệ thống", "Dán sơ đồ Class Diagram thể hiện User, Project, ProjectLog, Ticket, EquipmentAsset vào đây"),

        createSubSubHeading("3.4.2. Sơ đồ hoạt động (Activity Diagram)"),
        p("Sơ đồ hoạt động mô tả luồng quy trình từ lúc tiếp nhận công trình, phân công thợ, nghiệm thu ảnh cho đến khi bàn giao thiết bị."),
        ...createImagePlaceholder("Hình 3.3", "Activity Diagram tổng quát của hệ thống", "Dán sơ đồ Activity Diagram quy trình thi công và bảo trì vào đây"),

        createSubSubHeading("3.4.3. Sơ đồ thực thể – liên kết (ERD)"),
        p("Sơ đồ ERD mô hình hóa cấu trúc cơ sở dữ liệu quan hệ lưu trữ trên Microsoft SQL Server."),
        ...createImagePlaceholder("Hình 3.4", "Sơ đồ ERD của hệ thống", "Dán sơ đồ Entity Relationship Diagram (ERD) các bảng dữ liệu vào đây"),

        createSubHeading("3.5. Thiết kế cơ sở dữ liệu"),
        createSubSubHeading("3.5.1. Lược đồ cơ sở dữ liệu"),
        p("Cơ sở dữ liệu được thiết kế chuẩn hóa mức 3NF, loại bỏ dư thừa dữ liệu và đảm bảo tính toàn vẹn quan hệ."),
        createSubSubHeading("3.5.2. Thiết kế các bảng dữ liệu"),
        createTableCaption("Bảng 3.2", "Một số bảng dữ liệu chính của hệ thống"),
        createCustomTable(
          ["Tên bảng", "Khóa chính", "Mô tả nghiệp vụ", "Số lượng cột"],
          [
            ["Users", "Id (Guid)", "Lưu trữ tài khoản, mật khẩu băm bcrypt, vai trò (Role)", "9"],
            ["Projects", "Id (Guid)", "Lưu trữ dự án thi công lắp đặt, tiến độ %, ngân sách", "10"],
            ["ProjectLogs", "Id (Guid)", "Lưu trữ nhật ký thi công, ảnh hiện trường, tiến độ mới", "7"],
            ["ProjectEquipments", "Id (Guid)", "Linh kiện, vật tư cấp phát cho công trình thi công", "8"],
            ["Tickets", "Id (Guid)", "Phiếu bảo trì định kỳ / sự cố, tọa độ GPS, ảnh nghiệm thu", "12"],
            ["EquipmentAssets", "Id (Guid)", "Sổ theo dõi thiết bị PCCC đang vận hành tại cơ sở", "9"],
            ["Quotations", "Id (Guid)", "Báo giá dự toán thiết bị đề xuất bởi AI và nhân viên Sales", "8"]
          ]
        ),
        createSubSubHeading("3.5.3. Các mối quan hệ giữa các bảng"),
        bullet("Quan hệ 1 - N giữa Users (Project Leader) và Projects."),
        bullet("Quan hệ 1 - N giữa Projects và ProjectLogs (Nhật ký công trình)."),
        bullet("Quan hệ 1 - N giữa Projects và ProjectEquipments (Vật tư lắp đặt)."),
        bullet("Quan hệ 1 - N giữa Users (Technician) và Tickets (Phiếu bảo trì)."),
        createSubSubHeading("3.5.4. Các ràng buộc dữ liệu"),
        p("Áp dụng các ràng buộc khóa ngoại CASCADE DELETE ở các bảng nhật ký con, ràng buộc CHECK trên CompletionPercentage từ 0 đến 100, ràng buộc UNIQUE trên Email người dùng và SerialNumber thiết bị."),

        createSubHeading("3.6. Thiết kế giao diện hệ thống"),
        createSubSubHeading("3.6.1. Giao diện đăng nhập"),
        p("Giao diện đăng nhập hỗ trợ xác thực JWT Token, phân quyền người dùng và chuyển hướng tự động đến phân hệ làm việc tương ứng."),
        ...createImagePlaceholder("Hình 3.5", "Giao diện đăng nhập", "Dán ảnh chụp màn hình Giao diện Đăng nhập hệ thống vào đây"),

        createSubSubHeading("3.6.2. Giao diện Dashboard"),
        p("Dashboard hiển thị biểu đồ thống kê KPI, tình trạng các công trình thi công và các phiếu bảo trì khẩn cấp."),
        ...createImagePlaceholder("Hình 3.6", "Giao diện Dashboard của khách hàng", "Dán ảnh chụp màn hình Dashboard Khách hàng theo dõi tài sản vào đây"),
        ...createImagePlaceholder("Hình 3.7", "Giao diện Dashboard của quản trị viên", "Dán ảnh chụp màn hình Dashboard Quản trị viên theo dõi toàn diện vào đây"),
        ...createImagePlaceholder("Hình 3.8", "Giao diện Dashboard của người chăm sóc / Đội trưởng thi công", "Dán ảnh chụp màn hình Dashboard Đội trưởng thi công vào đây"),

        createSubSubHeading("3.6.3. Giao diện quản lý người dùng"),
        p("Cho phép Quản trị viên phân quyền, tạo tài khoản kỹ thuật viên, đội trưởng, thủ kho và nhân viên kinh doanh."),
        ...createImagePlaceholder("Hình 3.9", "Giao diện quản lý người dùng", "Dán ảnh chụp màn hình Quản lý Người dùng & Phân quyền vào đây"),

        createSubSubHeading("3.6.4. Giao diện quản lý đối tượng phục vụ / Dự án thi công"),
        p("Hiển thị danh sách các dự án thi công lắp đặt PCCC, tiến độ hoàn thành, kinh phí và tình trạng phê duyệt."),
        ...createImagePlaceholder("Hình 3.10", "Giao diện quản lý người cần chăm sóc / Dự án thi công", "Dán ảnh chụp màn hình Danh sách Dự án thi công vào đây"),
        ...createImagePlaceholder("Hình 3.11", "Giao diện phân công công việc thợ thi công nội bộ 1, 2, 3, 4", "Dán ảnh chụp màn hình Chức năng Phân công thợ 1, 2, 3, 4 của Đội trưởng vào đây"),

        createSubSubHeading("3.6.5. Giao diện quản lý người chăm sóc / Đội ngũ kỹ thuật viên"),
        p("Quản lý danh sách nhân sự kỹ thuật, trạng thái sẵn sàng nhận việc, đánh giá tay nghề và vị trí định vị."),

        createSubSubHeading("3.6.6. Giao diện quản lý dịch vụ / Thiết bị PCCC"),
        p("Danh mục thiết bị PCCC (Bình bột ABC, CO2, Đầu báo khói nhiệt, Tủ trung tâm báo cháy, Van góc chữa cháy)."),
        ...createImagePlaceholder("Hình 3.12", "Giao diện quản lý dịch vụ / Kho thiết bị PCCC", "Dán ảnh chụp màn hình Quản lý Thiết bị & Kho PCCC vào đây"),

        createSubSubHeading("3.6.7. Giao diện đặt lịch chăm sóc / Bảo trì & GPS Check-in"),
        p("Cho phép tiếp nhận phiếu bảo trì, hiển thị bản đồ định vị và nút Check-in GPS xác thực bán kính ≤ 1km."),
        ...createImagePlaceholder("Hình 3.13", "Giao diện đặt lịch chăm sóc / Bảo trì và Check-in GPS", "Dán ảnh chụp màn hình Check-in GPS và nhận đơn bảo trì vào đây"),

        createSubSubHeading("3.6.8. Giao diện nhật ký chăm sóc / Nghiệm thu ảnh hiện trường"),
        p("Giao diện tải ảnh chụp hiện trường thi công và bảo trì, xem nhật ký ảnh trước và sau khi hoàn thành."),
        ...createImagePlaceholder("Hình 3.14", "Giao diện nhật ký chăm sóc / Nhật ký nghiệm thu ảnh hiện trường", "Dán ảnh chụp màn hình Nhật ký tiến độ kèm ảnh chụp hiện trường vào đây"),

        createSubSubHeading("3.6.9. Giao diện thanh toán / Báo giá AI"),
        p("Tự động tính toán chi phí thiết bị, nhân công thi công và xuất file báo giá PDF chuyên nghiệp."),
        ...createImagePlaceholder("Hình 3.15", "Giao diện thanh toán / Báo giá đề xuất tự động AI", "Dán ảnh chụp màn hình Báo giá thông minh AI vào đây"),

        createSubSubHeading("3.6.10. Giao diện đánh giá dịch vụ & Bàn giao tài sản"),
        p("Khách hàng nghiệm thu, đánh giá chất lượng dịch vụ và tự động chuyển giao vật tư thành tài sản công trình."),
        ...createImagePlaceholder("Hình 3.16", "Giao diện đánh giá dịch vụ & Bàn giao nghiệm thu", "Dán ảnh chụp màn hình Nghiệm thu bàn giao tài sản và đánh giá vào đây"),
        new Paragraph({ children: [new PageBreak()] }),

        // CHƯƠNG 4
        createHeaderTitle("Chương 4. TRIỂN KHAI VÀ ĐÁNH GIÁ HỆ THỐNG"),
        createSubHeading("4.1. Môi trường triển khai"),
        createTableCaption("Bảng 4.1", "Các thành phần của môi trường triển khai"),
        createCustomTable(
          ["Thành phần", "Cấu hình / Nền tảng", "Ghi chú"],
          [
            ["Hệ điều hành", "Windows 11 / Ubuntu Server 22.04 LTS", "Môi trường máy chủ và phát triển"],
            ["Web Server", "Kestrel (.NET 8) / Nginx Reverse Proxy", "Xử lý tải cao và bảo mật SSL"],
            ["Database Server", "Microsoft SQL Server Developer Edition", "Cơ sở dữ liệu chính"],
            ["Node Runtime", "Node.js v20.x & npm v10.x", "Môi trường build Frontend React"],
            ["Trình duyệt hỗ trợ", "Google Chrome, Microsoft Edge, Firefox, Safari", "Tối ưu hóa đa thiết bị"]
          ]
        ),

        createSubHeading("4.2. Kết quả triển khai các chức năng"),
        createTableCaption("Bảng 4.2", "Các nhóm chức năng đã được xây dựng"),
        createCustomTable(
          ["Nhóm chức năng", "Mô tả kết quả đạt được", "Trạng thái"],
          [
            ["Phân hệ Dự án thi công", "Phân công thợ 1-4 tại chỗ, cập nhật tiến độ %, tải ảnh nhật ký", "100% Hoàn thành"],
            ["Phân hệ Bảo trì & Kỹ thuật", "Check-in GPS < 1km, bắt buộc ảnh nghiệm thu, cập nhật phiếu", "100% Hoàn thành"],
            ["Phân hệ Báo giá AI", "Bóc tách dự toán thông minh theo diện tích và tiêu chuẩn TCVN", "100% Hoàn thành"],
            ["Phân hệ Kho & Quản lý thiết bị", "Quản lý mã vạch, Serial, cấp phát vật tư thi công", "100% Hoàn thành"],
            ["Phân hệ Bàn giao tài sản", "Chuyển vật tư dự án thành tài sản theo dõi định kỳ của công trình", "100% Hoàn thành"]
          ]
        ),

        createSubHeading("4.3. Kết quả giao diện và hoạt động thực tế"),
        p("Hệ thống hoạt động mượt mà, thời gian phản hồi API trung bình dưới 150ms. Giao diện được tối ưu hóa cho cả thiết bị máy tính để bàn văn phòng và điện thoại di động thông minh của nhân viên hiện trường."),

        createSubHeading("4.4. Kiểm thử hệ thống"),
        createSubSubHeading("4.4.1. Phương pháp và phạm vi kiểm thử"),
        p("Áp dụng phương pháp kiểm thử hộp đen (Black-box Testing), tập trung vào các luồng nghiệp vụ cốt lõi, dữ liệu đầu vào và các trường hợp ngoại lệ."),
        createSubSubHeading("4.4.2. Kiểm thử các chức năng chính"),
        createTableCaption("Bảng 4.3", "Kịch bản kiểm thử các chức năng chính"),
        createCustomTable(
          ["Mã Test", "Tên kịch bản kiểm thử", "Dữ liệu đầu vào", "Kết quả mong đợi", "Đánh giá"],
          [
            ["TC-01", "Phân công thợ 1-4 và gửi ảnh nhật ký", "Thợ 1: Hàn ống, Thợ 2: Kéo dây, 1 file ảnh", "Tiến độ tăng lên 65%, ảnh hiển thị ở nhật ký", "Đạt (Pass)"],
            ["TC-02", "Check-in GPS đúng vị trí", "Tọa độ cách công trình 150m (≤ 1km)", "Hệ thống chấp nhận check-in thành công", "Đạt (Pass)"],
            ["TC-03", "Nghiệm thu bảo trì có ảnh", "Upload ảnh sau khi sửa chữa + ghi chú", "Ticket chuyển sang 'Resolved'", "Đạt (Pass)"],
            ["TC-04", "Bàn giao vật tư thi công sang tài sản", "Nhấn nút 'Bàn giao nghiệm thu'", "Tạo mới EquipmentAssets với mã Serial", "Đạt (Pass)"]
          ]
        ),

        createSubSubHeading("4.4.3. Kiểm thử các trường hợp ngoại lệ"),
        createTableCaption("Bảng 4.4", "Kịch bản kiểm thử các trường hợp ngoại lệ"),
        createCustomTable(
          ["Mã Test", "Tình huống ngoại lệ", "Hành vi hệ thống", "Kết quả"],
          [
            ["EXP-01", "Hoàn tất bảo trì nhưng không chụp ảnh", "Hệ thống chặn nút 'Hoàn tất' và cảnh báo lỗi", "Đạt (Pass)"],
            ["EXP-02", "Check-in GPS ở khoảng cách xa (> 1km)", "Báo lỗi vượt quá bán kính quy định, từ chối mở phiếu", "Đạt (Pass)"],
            ["EXP-03", "Cập nhật tiến độ dự án vượt quá 100%", "Giới hạn thanh trượt từ 0 - 100%", "Đạt (Pass)"],
            ["EXP-04", "Nhập sai định dạng file ảnh (vd: .exe)", "Chỉ chấp nhận file định dạng hình ảnh (.png, .jpg, .webp)", "Đạt (Pass)"]
          ]
        ),

        createSubSubHeading("4.4.4. Kiểm thử phân quyền theo vai trò"),
        createTableCaption("Bảng 4.5", "Kịch bản kiểm thử phân quyền"),
        createCustomTable(
          ["Mã Test", "Vai trò thực hiện", "Hành động thử nghiệm", "Kết quả mong đợi"],
          [
            ["SEC-01", "Kỹ thuật viên (Technician)", "Cố gắng truy cập trang Quản lý Người dùng", "Bị chặn, trả về mã lỗi 403 Forbidden"],
            ["SEC-02", "Đội trưởng (Leader)", "Cập nhật tiến độ dự án của đội khác", "Chỉ hiển thị dự án được phân công phụ trách"],
            ["SEC-03", "Khách hàng (Customer)", "Xem thông tin kho hàng và giá nhập vật tư", "Không có quyền truy cập module Kho hàng"]
          ]
        ),

        createSubHeading("4.5. Đánh giá kết quả"),
        createSubSubHeading("4.5.1. Mức độ đáp ứng các mục tiêu"),
        createTableCaption("Bảng 4.6", "Đối chiếu mục tiêu với nội dung đã triển khai"),
        createCustomTable(
          ["Mục tiêu đề ra ban đầu", "Nội dung thực tế đã triển khai", "Mức độ đáp ứng"],
          [
            ["Số hóa quy trình thi công & phân công thợ", "Module phân công thợ 1-4 tại chỗ và nhật ký công trình", "100% Đạt"],
            ["Xác thực minh bạch công tác bảo trì", "Kiểm tra GPS bán kính 1km và nghiệm thu ảnh bắt buộc", "100% Đạt"],
            ["Tự động hóa dự toán báo giá PCCC", "Gợi ý bóc tách thiết bị theo diện tích và TCVN 3890", "100% Đạt"],
            ["Quản lý vòng đời tài sản thiết bị PCCC", "Chuyển giao tự động từ thi công sang sổ tài sản bảo trì", "100% Đạt"]
          ]
        ),
        createSubSubHeading("4.5.2. Kết quả đạt được"),
        bullet("Hoàn thiện hệ sinh thái quản lý thi công và bảo trì PCCC trên cùng một nền tảng đồng nhất."),
        bullet("Cơ chế phân công thợ nội bộ linh hoạt giúp giải quyết triệt để bài toán biến động nhân sự công trường."),
        bullet("Minh bạch hóa 100% hồ sơ nghiệm thu bằng hình ảnh thực tế và định vị GPS chống gian lận."),
        createSubSubHeading("4.5.3. Những hạn chế còn tồn tại"),
        bullet("Hệ thống hiện tại cần kết nối mạng Internet liên tục; tính năng đồng bộ ngoại tuyến (Offline-first) khi mất sóng ở tầng hầm công trình đang trong giai đoạn hoàn thiện."),
        bullet("Cơ chế nhận diện ảnh hiện trường hiện dựa trên mắt người đánh giá, chưa tích hợp mô hình Deep Learning để tự động chấm điểm độ chuẩn của mối hàn hay vị trí đầu phun."),
        new Paragraph({ children: [new PageBreak()] }),

        // CHƯƠNG 5
        createHeaderTitle("Chương 5. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN"),
        createSubHeading("5.1. Kết luận"),
        p("Đề tài đã hoàn thành xuất sắc các mục tiêu nghiên cứu và phát triển được đặt ra ban đầu. Hệ thống FireGuard AI mang lại giải pháp công nghệ thiết thực cho ngành an toàn phòng cháy chữa cháy, thay thế các phương thức quản lý thủ công rời rạc bằng quy trình số hóa hiện đại, minh bạch và chính xác."),

        createSubHeading("5.2. Hướng phát triển"),
        bullet("Tích hợp cảm biến IoT (LoRaWAN, Zigbee) truyền tín hiệu cảnh báo áp lực đường ống nước và pin đầu báo khói trực tiếp về hệ thống."),
        bullet("Ứng dụng Computer Vision (AI) nhận diện tự động bình cứu hỏa quá hạn hoặc van chữa cháy bị rò rỉ qua camera quét."),
        bullet("Xây dựng ứng dụng di động Native (React Native / Flutter) hỗ trợ quét NFC và đồng bộ dữ liệu ngoại tuyến (Offline Sync) khi làm việc trong hầm tòa nhà."),

        createSubHeading("5.3. Trải nghiệm học tập và kỹ năng đạt được"),
        p("Thông qua quá trình thực hiện đồ án tốt nghiệp, sinh viên đã củng cố vững chắc kiến thức về kiến trúc phần mềm Clean Architecture, kỹ năng phân tích và mô hình hóa hệ thống bằng chuẩn UML, kỹ năng lập trình full-stack với .NET Core và React TypeScript, cũng như hiểu sâu sắc các quy chuẩn an toàn kỹ thuật trong thực tế đời sống."),
        p("Sinh viên xin chân thành cảm ơn sự hướng dẫn tận tình của các thầy cô giảng viên đã giúp đỡ để đề tài hoàn thành đúng tiến độ và đạt chất lượng tốt nhất.", { italics: true })
      ]
    }
  ]
});

// Pack to buffer and save
Packer.toBuffer(doc).then((buffer) => {
  const file1 = path.resolve(__dirname, '..', 'BAO_CAO_DO_AN_FIREGUARD_AI_THEO_MAU.docx');
  fs.writeFileSync(file1, buffer);
  console.log("SUCCESS: Created file at: " + file1);

  // Also attempt to write to BAO_CAO_DO_AN_FIREGUARD_AI.docx
  try {
    const file2 = path.resolve(__dirname, '..', 'BAO_CAO_DO_AN_FIREGUARD_AI.docx');
    fs.writeFileSync(file2, buffer);
    console.log("SUCCESS: Also updated file at: " + file2);
  } catch (err) {
    console.log("Note: BAO_CAO_DO_AN_FIREGUARD_AI.docx is locked, saved to BAO_CAO_DO_AN_FIREGUARD_AI_THEO_MAU.docx");
  }
}).catch((err) => {
  console.error("Error generating docx:", err);
});
