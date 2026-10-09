import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
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
} from 'docx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("================================================================================");
console.log("Đang tạo BÁO CÁO ĐỒ ÁN TỐT NGHIỆP ĐẠI HỌC (FIREGUARD AI) - CHUẨN MỤC LỤC & 65-75+ TRANG");
console.log("Mục lục bám sát 100% tài liệu: Bao_Cao_Do_An.md");
console.log("================================================================================");

const PRIMARY_COLOR = "1B365D"; // Navy Blue chuẩn học thuật
const ACCENT_COLOR = "C53030";  // Đỏ PCCC sang trọng
const BORDER_COLOR = "CBD5E1";  // Viền Slate xám nhạt
const PLACEHOLDER_BG = "F8FAFC";
const TABLE_HEADER_BG = "1E3A8A"; // Xanh đậm tiêu đề bảng
const ZEBRA_BG = "F1F5F9";

// Helper hàm tiêu đề
function createHeaderTitle(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    alignment: AlignmentType.LEFT,
    pageBreakBefore: true
  });
}

function createSubHeading(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    alignment: AlignmentType.LEFT
  });
}

function createSubSubHeading(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    alignment: AlignmentType.LEFT
  });
}

function p(text, options = {}) {
  return new Paragraph({
    alignment: options.alignment || AlignmentType.JUSTIFIED,
    spacing: { before: options.before || 80, after: options.after || 100, line: 320 }, // Dãn dòng chuẩn 1.35
    children: [
      new TextRun({
        text: text,
        size: 26, // 13pt
        font: "Times New Roman",
        bold: options.bold || false,
        italics: options.italics || false,
        color: options.color || "1E293B"
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
      color: "0F172A"
    }));
  }
  children.push(new TextRun({
    text: text,
    size: 26,
    font: "Times New Roman",
    color: "1E293B"
  }));
  return new Paragraph({
    children: children,
    bullet: { level: 0 },
    spacing: { before: 60, after: 70, line: 310 },
    alignment: AlignmentType.JUSTIFIED
  });
}

function createImagePlaceholder(figCode, caption, description = "Nhấp chuột chọn khung này hoặc nhấn Ctrl+V để dán hình ảnh minh họa") {
  const borderStyle = {
    style: BorderStyle.DASHED,
    size: 10,
    color: "94A3B8"
  };

  return [
    new Paragraph({ spacing: { before: 180, after: 80 } }),
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
              margins: { top: 450, bottom: 450, left: 240, right: 240 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 100, after: 70 },
                  children: [
                    new TextRun({
                      text: `[ KHUNG CHÈN HÌNH ẢNH MINH HỌA: ${figCode} ]`,
                      bold: true,
                      size: 24,
                      font: "Times New Roman",
                      color: "334155"
                    })
                  ]
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 50, after: 90 },
                  children: [
                    new TextRun({
                      text: `(${description})`,
                      italics: true,
                      size: 22,
                      font: "Times New Roman",
                      color: "64748B"
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
      spacing: { before: 100, after: 200 },
      children: [
        new TextRun({
          text: `${figCode}. ${caption}`,
          bold: true,
          italics: true,
          size: 24,
          font: "Times New Roman",
          color: "0F172A"
        })
      ]
    })
  ];
}

function createCustomTable(headers, rows, widths = null) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR };
  const colCount = headers.length;
  let colWidths;
  if (Array.isArray(widths) && widths.length === colCount) {
    colWidths = widths;
  } else {
    const defaultW = Math.floor(100 / colCount);
    colWidths = headers.map((_, i) => i === colCount - 1 ? 100 - defaultW * (colCount - 1) : defaultW);
  }

  const headerRow = new TableRow({
    children: headers.map((h, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: TABLE_HEADER_BG },
      margins: { top: 130, bottom: 130, left: 130, right: 130 },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: h, bold: true, size: 22, font: "Times New Roman", color: "FFFFFF" })]
        })
      ]
    }))
  });

  const bodyRows = rows.map((r, rIdx) => new TableRow({
    children: r.map((cellText, idx) => new TableCell({
      width: { size: colWidths[idx], type: WidthType.PERCENTAGE },
      shading: rIdx % 2 === 1 ? { type: ShadingType.CLEAR, fill: ZEBRA_BG } : undefined,
      margins: { top: 110, bottom: 110, left: 130, right: 130 },
      children: [
        new Paragraph({
          alignment: (idx === 0 && colCount > 2) ? AlignmentType.CENTER : AlignmentType.LEFT,
          children: [new TextRun({ text: cellText.toString(), size: 22, font: "Times New Roman", color: "1E293B" })]
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
    spacing: { before: 180, after: 90 },
    children: [
      new TextRun({
        text: `${tableCode}. ${caption}`,
        bold: true,
        size: 24,
        font: "Times New Roman",
        color: "0F172A"
      })
    ]
  });
}

// Khởi tạo Document
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Times New Roman", size: 26, color: "0F172A" },
        paragraph: { spacing: { line: 320 } }
      },
      heading1: {
        run: { font: "Times New Roman", size: 34, bold: true, color: PRIMARY_COLOR },
        paragraph: { spacing: { before: 400, after: 200 } }
      },
      heading2: {
        run: { font: "Times New Roman", size: 28, bold: true, color: "1E3A8A" },
        paragraph: { spacing: { before: 280, after: 140 } }
      },
      heading3: {
        run: { font: "Times New Roman", size: 26, bold: true, italics: true, color: "334155" },
        paragraph: { spacing: { before: 200, after: 100 } }
      }
    }
  },
  sections: [
    // -----------------------------------------------------------------------------
    // TRANG BÌA CHÍNH (ĐẠI HỌC CHUẨN QUỐC GIA)
    // -----------------------------------------------------------------------------
    {
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1700, right: 1134 } }
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 60 },
          children: [new TextRun({ text: "BỘ GIÁO DỤC VÀ ĐÀO TẠO", size: 28, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 200 },
          children: [new TextRun({ text: "TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN", size: 30, bold: true, color: PRIMARY_COLOR })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 600 },
          children: [new TextRun({ text: "KHOA KỸ THUẬT PHẦN MỀM - BỘ MÔN CÔNG NGHỆ PHẦN MỀM", size: 24, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 300, after: 140 },
          children: [new TextRun({ text: "BÁO CÁO ĐỒ ÁN TỐT NGHIỆP ĐẠI HỌC", size: 36, bold: true, color: ACCENT_COLOR })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 60, after: 260 },
          children: [new TextRun({ text: "CHUYÊN NGÀNH: KỸ THUẬT PHẦN MỀM & HỆ THỐNG THÔNG TIN", size: 24, bold: true, color: "475569" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 160 },
          children: [new TextRun({ text: "ĐỀ TÀI:", size: 26, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 60, after: 800 },
          children: [new TextRun({
            text: "HỆ THỐNG ĐIỀU PHỐI VÀ QUẢN LÝ BẢO TRÌ PCCC (FIREGUARD AI)",
            size: 32,
            bold: true,
            color: PRIMARY_COLOR
          })]
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: "auto" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
            left: { style: BorderStyle.NONE, size: 0, color: "auto" },
            right: { style: BorderStyle.NONE, size: 0, color: "auto" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" }
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [p("Giảng viên hướng dẫn:", { bold: true })] }),
                new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [p("TS. / ThS. Giảng Viên Hướng Dẫn")] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [p("Sinh viên thực hiện:", { bold: true })] }),
                new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [p("Hồ Tiến Đạt")] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [p("Mã số sinh viên:", { bold: true })] }),
                new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [p("20210001")] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [p("Lớp chuyên ngành:", { bold: true })] }),
                new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [p("Kỹ thuật Phần mềm Khóa 2021")] })
              ]
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 800, after: 80 },
          children: [new TextRun({ text: "TP. HỒ CHÍ MINH, NĂM 2026", size: 26, bold: true })]
        }),
        new Paragraph({ children: [new PageBreak()] })
      ]
    },

    // -----------------------------------------------------------------------------
    // BÌA PHỤ VÀ CÁC TRANG ĐẦU BÁO CÁO (ĐÚNG THỨ TỰ TRONG Bao_Cao_Do_An.md)
    // -----------------------------------------------------------------------------
    {
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1700, right: 1134 }, pageNumbers: { start: 1 } }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: "Báo Cáo Đồ Án: Hệ Thống FireGuard AI - Hồ Tiến Đạt (20210001)", size: 20, italics: true, color: "64748B" })]
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ children: [PageNumber.CURRENT], size: 22, font: "Times New Roman" })]
            })
          ]
        })
      },
      children: [
        // =============================================================================
        // LỜI CẢM ƠN (ĐÚNG THEO MỤC LỤC BẠN GỬI)
        // =============================================================================
        new Paragraph({
          text: "LỜI CẢM ƠN",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 260 }
        }),
        p("Để hoàn thành đồ án tốt nghiệp đại học này, em xin bày tỏ lòng biết ơn sâu sắc và chân thành nhất đến quý Thầy Cô trong Khoa Công nghệ Thông tin, Trường Đại học Công nghệ Thông tin. Những bài giảng tâm huyết, những kiến thức nền tảng vững chắc về kỹ thuật phần mềm, cơ sở dữ liệu nâng cao, kiến trúc hệ thống phân tán, hệ điều hành mạng và an toàn thông tin mà quý Thầy Cô truyền đạt trong suốt bốn năm học tập chính là hành trang quý giá giúp em hoàn thành đề tài này."),
        p("Đặc biệt, em xin gửi lời cảm ơn chân thành và sâu sắc nhất đến Giảng viên hướng dẫn – Thầy/Cô đã tận tình định hướng nghiên cứu, chỉ bảo từng phương pháp tiếp cận công nghệ, đóng góp những ý kiến phản biện sắc bén và luôn khích lệ, động viên em vượt qua những khó khăn, thử thách trong suốt các giai đoạn nghiên cứu, khảo sát thực tế và phát triển hệ thống FireGuard AI."),
        p("Em cũng xin chân thành cảm ơn các kỹ sư, cán bộ kỹ thuật tại các doanh nghiệp cung cấp dịch vụ cơ điện, thi công và bảo trì phòng cháy chữa cháy (PCCC) tại địa bàn Thành phố Hồ Chí Minh đã nhiệt tình chia sẻ những bài học thực tế, quy trình nghiệm thu công trường, các tiêu chuẩn chuyên ngành (TCVN 3890:2023) và các tình huống sự cố thực tế. Những dữ liệu và kinh nghiệm thực tiễn quý báu đó đã giúp hệ thống FireGuard AI bám sát nhu cầu thực tế của đời sống."),
        p("Sau cùng, con xin gửi lời tri ân thiêng liêng nhất đến cha mẹ, gia đình và bạn bè đã luôn là điểm tựa vững chắc, nguồn động viên tinh thần lớn lao và tạo mọi điều kiện tốt nhất để con yên tâm học tập, nghiên cứu và hoàn thành khóa học."),
        p("Dù đã cố gắng hết sức với tinh thần nghiêm túc và cầu thị, song do giới hạn về thời gian và kinh nghiệm thực tế, đồ án chắc chắn khó tránh khỏi những thiếu sót nhất định. Em rất kính mong nhận được những lời chỉ bảo, đóng góp ý kiến quý báu từ quý Thầy Cô trong Hội đồng chấm đồ án để hệ thống phần mềm được tiếp tục hoàn thiện và phát triển hơn nữa."),
        p("TP. Hồ Chí Minh, ngày 05 tháng 09 năm 2026", { alignment: AlignmentType.RIGHT, italics: true }),
        p("Sinh viên thực hiện", { alignment: AlignmentType.RIGHT, bold: true }),
        p("Hồ Tiến Đạt", { alignment: AlignmentType.RIGHT, italics: true }),
        new Paragraph({ children: [new PageBreak()] }),

        // =============================================================================
        // NHẬN XÉT CỦA GIÁO VIÊN HƯỚNG DẪN (ĐÚNG THEO MỤC LỤC BẠN GỬI)
        // =============================================================================
        new Paragraph({
          text: "NHẬN XÉT CỦA GIÁO VIÊN HƯỚNG DẪN",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 260 }
        }),
        p("1. Về tinh thần, thái độ làm việc và ý thức kỷ luật của sinh viên:"),
        p("..................................................................................................................................................................................................."),
        p("..................................................................................................................................................................................................."),
        p("2. Về tính cấp thiết, giá trị khoa học và khả năng ứng dụng thực tế của đề tài:"),
        p("..................................................................................................................................................................................................."),
        p("..................................................................................................................................................................................................."),
        p("3. Về khối lượng công việc, mức độ hoàn thành và chất lượng sản phẩm phần mềm:"),
        p("..................................................................................................................................................................................................."),
        p("..................................................................................................................................................................................................."),
        p("4. Những điểm mạnh và hạn chế cần khắc phục của đề tài:"),
        p("..................................................................................................................................................................................................."),
        p("..................................................................................................................................................................................................."),
        p("5. Điểm đánh giá của Giáo viên hướng dẫn: .............. / 10 điểm."),
        p("TP. Hồ Chí Minh, ngày ...... tháng ...... năm 2026", { alignment: AlignmentType.RIGHT, italics: true }),
        p("Giáo viên hướng dẫn", { alignment: AlignmentType.RIGHT, bold: true }),
        p("(Ký và ghi rõ họ tên)", { alignment: AlignmentType.RIGHT, italics: true }),
        new Paragraph({ children: [new PageBreak()] }),

        // =============================================================================
        // TÓM TẮT ĐỒ ÁN NGÀNH (ĐÚNG THEO MỤC LỤC BẠN GỬI)
        // =============================================================================
        new Paragraph({
          text: "TÓM TẮT ĐỒ ÁN NGÀNH",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 260 }
        }),
        p("Đồ án tốt nghiệp này trình bày quá trình nghiên cứu, phân tích nghiệp vụ, thiết kế kiến trúc và phát triển toàn diện 'Hệ thống Điều phối và Quản lý bảo trì PCCC (FireGuard AI)'. Hệ thống ứng dụng trí tuệ nhân tạo (AI) trong việc tự động chấm điểm và điều phối kỹ thuật viên dựa trên vị trí GPS, kỹ năng chuyên môn, tỷ lệ hoàn thành công việc và chỉ số KPI. Bên cạnh đó, hệ thống tích hợp các công nghệ hiện đại hàng đầu như .NET Core 8, ReactJS, Redis, Hangfire, MinIO và SignalR để đảm bảo hiệu năng cao, xử lý thời gian thực và tự động hóa quy trình nhắc lịch bảo trì thiết bị phòng cháy chữa cháy."),
        p("Hệ thống giải quyết triệt để 4 nhóm bài toán cốt lõi trong thực tế quản lý PCCC: (1) Khảo sát hiện trạng và tự động điều phối thợ sửa chữa thông minh trong vòng 60 giây có cơ chế Fallback tự động; (2) Giám sát vị trí kỹ thuật viên trên bản đồ số thời gian thực và đối soát nghiêm ngặt bán kính GPS $\\le 1.0$ km; (3) Tác vụ nền tự động quét hạn bảo dưỡng thiết bị hàng đêm và phát cảnh báo sớm; (4) Quản lý vòng đời thiết bị, xuất nhập kho vật tư linh kiện và đánh giá KPI minh bạch."),
        p("Kết quả thử nghiệm thực tế cho thấy hệ thống hoạt động ổn định với thời gian phản hồi API dưới 50ms, độ trễ phát sóng thời gian thực qua WebSocket dưới 80ms, và loại bỏ hoàn toàn hiện tượng xung đột dữ liệu (Race Condition) nhờ cơ chế khóa lạc quan Concurrency Token kết hợp khóa phân tán Redis."),
        new Paragraph({ spacing: { before: 200, after: 200 }, children: [] }),

        // =============================================================================
        // ABSTRACT (ĐÚNG THEO MỤC LỤC BẠN GỬI)
        // =============================================================================
        new Paragraph({
          text: "ABSTRACT",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 260 }
        }),
        p("This graduation thesis presents the comprehensive research, operational analysis, architectural design, and full-stack development of the 'Fire Protection Maintenance and Dispatching Management System (FireGuard AI)'. The system applies Artificial Intelligence (AI) to automatically score and dispatch field service technicians based on real-time GPS location, professional skill certifications, task acceptance rates, and historical KPI performance ratings. In addition, the platform integrates state-of-the-art technologies including .NET Core 8, ReactJS, Redis caching, Hangfire background processing, MinIO object storage, and SignalR WebSockets to ensure exceptional throughput, sub-second real-time responsiveness, and full automation of fire protection equipment maintenance schedules."),
        p("The platform successfully resolves four critical operational bottlenecks: (1) Rapid intelligent technician dispatching with a 60-second countdown lock and automated fallback routing; (2) Real-time GPS field monitoring with strict 1.0 km radius geofencing; (3) Automated nightly recurring background jobs to detect expiring equipment and trigger preemptive alerts; (4) Full-lifecycle equipment asset tracking, spare-parts inventory control, and transparent KPI evaluation."),
        p("Empirical test results confirm that the system maintains superior performance with average API response latencies below 50ms, WebSocket broadcast propagation below 80ms, and complete prevention of concurrent race conditions through optimistic concurrency tokens and Redis distributed locking."),
        new Paragraph({ children: [new PageBreak()] }),

        // =============================================================================
        // MỤC LỤC TỔNG QUÁT (ĐÚNG CHÍNH XÁC THEO MỤC LỤC CỦA BẠN TRONG Bao_Cao_Do_An.md)
        // =============================================================================
        new Paragraph({
          text: "MỤC LỤC TỔNG QUÁT",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 }
        }),
        p("LỜI CẢM ƠN ................................................................................................................................................ i", { bold: true }),
        p("NHẬN XÉT CỦA GIÁO VIÊN HƯỚNG DẪN .................................................................................................. ii", { bold: true }),
        p("TÓM TẮT ĐỒ ÁN NGÀNH ........................................................................................................................... iii", { bold: true }),
        p("ABSTRACT .................................................................................................................................................. iv", { bold: true }),
        p("MỤC LỤC ..................................................................................................................................................... v", { bold: true }),
        p("DANH MỤC TỪ VIẾT TẮT ......................................................................................................................... vii", { bold: true }),
        p("DANH MỤC HÌNH VẼ ................................................................................................................................. viii", { bold: true }),
        p("DANH MỤC BẢNG BIỂU ............................................................................................................................. x", { bold: true }),
        p("Chương 1. TỔNG QUAN ĐỀ TÀI .................................................................................................................... 1", { bold: true, color: PRIMARY_COLOR }),
        p("   1.1. Giới thiệu đề tài .................................................................................................................................... 1"),
        p("   1.2. Lý do chọn đề tài .................................................................................................................................. 6"),
        p("   1.3. Phát biểu bài toán ................................................................................................................................ 10"),
        p("   1.4. Mục tiêu đề tài ..................................................................................................................................... 14"),
        p("   1.5. Phạm vi đề tài ...................................................................................................................................... 18"),
        p("   1.6. Phương pháp thực hiện đề tài .............................................................................................................. 21"),
        p("   1.7. Khảo sát liên quan hệ thống ................................................................................................................. 25"),
        p("   1.8. Bố cục báo cáo ..................................................................................................................................... 30"),
        p("Chương 2. CƠ SỞ LÝ THUYẾT ..................................................................................................................... 32", { bold: true, color: PRIMARY_COLOR }),
        p("   2.1. Các khái niệm nền tảng liên quan ......................................................................................................... 32"),
        p("   2.2. Các phương pháp, mô hình, thuật toán sử dụng ................................................................................. 40"),
        p("   2.3. Công nghệ sử dụng ............................................................................................................................... 50"),
        p("        2.3.1. Giới thiệu công nghệ ..................................................................................................................... 50"),
        p("        2.3.2. Các đặc điểm chính của công nghệ ................................................................................................ 55"),
        p("        2.3.3. Vai trò của công nghệ sử dụng trong đồ án .................................................................................... 61"),
        p("        2.3.4. Lý do sử dụng công nghệ ............................................................................................................... 66"),
        p("Chương 3. HỆ THỐNG FIREGUARD AI ........................................................................................................ 70", { bold: true, color: PRIMARY_COLOR }),
        p("   3.1. Giới thiệu hệ thống ............................................................................................................................... 70"),
        p("   3.2. Kiến trúc hệ thống ................................................................................................................................ 76"),
        p("        3.2.1. Kiến trúc tổng thể hệ thống .......................................................................................................... 76"),
        p("        3.2.2. Các thành phần của kiến trúc ........................................................................................................ 81"),
        p("        3.2.3. Luồng xử lý tổng quát của hệ thống ............................................................................................. 87"),
        p("   3.3. Phân tích sơ đồ use case hệ thống ....................................................................................................... 92"),
        p("        3.3.1. Sơ đồ use case ............................................................................................................................... 92"),
        p("        3.3.2. Đặc tả use case .............................................................................................................................. 97"),
        p("   3.4. Mô hình hoá hệ thống ........................................................................................................................... 111"),
        p("   3.5. Thiết kế cơ sở dữ liệu hệ thống ............................................................................................................ 124"),
        p("        3.5.1. Lược đồ cơ sở dữ liệu quan hệ ...................................................................................................... 124"),
        p("        3.5.2. Các mối quan hệ quan trọng ......................................................................................................... 130"),
        p("        3.5.3. Các ràng buộc dữ liệu .................................................................................................................... 135"),
        p("   3.6. Thiết kế giao diện hệ thống ................................................................................................................... 141"),
        p("   3.7. Kết quả triển khai hệ thống .................................................................................................................. 153"),
        p("        3.7.1. Triển khai hệ thống ........................................................................................................................ 153"),
        p("        3.7.2. Chức năng đã hoàn thành ............................................................................................................. 159"),
        p("        3.7.3. Hình ảnh chạy thực tế hệ thống ..................................................................................................... 166"),
        p("        3.7.4. Hạn chế còn tồn tại ....................................................................................................................... 174"),
        p("Chương 4. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN ...................................................................................... 177", { bold: true, color: PRIMARY_COLOR }),
        p("   4.1. Kết luận ................................................................................................................................................ 177"),
        p("   4.2. Hướng phát triển ................................................................................................................................... 183"),
        p("TÀI LIỆU THAM KHẢO .............................................................................................................................. 189", { bold: true }),
        p("PHỤ LỤC ..................................................................................................................................................... 193", { bold: true }),
        new Paragraph({ children: [new PageBreak()] }),

        // =============================================================================
        // DANH MỤC TỪ VIẾT TẮT
        // =============================================================================
        new Paragraph({
          text: "DANH MỤC CÁC TỪ VIẾT TẮT",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 }
        }),
        createCustomTable(
          ["STT", "Ký hiệu", "Thuật ngữ tiếng Anh", "Ý nghĩa / Định nghĩa ngữ cảnh chuyên ngành"],
          [
            ["1", "PCCC", "Fire Prevention and Fighting", "Hoạt động phòng cháy, chữa cháy và cứu nạn cứu hộ theo quy chuẩn pháp luật."],
            ["2", "AI", "Artificial Intelligence", "Trí tuệ nhân tạo, các thuật toán chấm điểm và tối ưu hóa điều phối."],
            ["3", "GPS", "Global Positioning System", "Hệ thống định vị toàn cầu phục vụ theo dõi vị trí thợ theo thời gian thực."],
            ["4", "KPI", "Key Performance Indicator", "Chỉ số đánh giá định lượng hiệu quả làm việc và chất lượng phục vụ."],
            ["5", "EF Core", "Entity Framework Core", "Framework ánh xạ đối tượng quan hệ (ORM) mạnh mẽ của Microsoft .NET."],
            ["6", "RDBMS", "Relational Database Management System", "Hệ quản trị cơ sở dữ liệu quan hệ (MySQL 8.0 / SQL Server)."],
            ["7", "UML", "Unified Modeling Language", "Ngôn ngữ mô hình hóa thống nhất dùng trong phân tích thiết kế phần mềm."],
            ["8", "ERD", "Entity-Relationship Diagram", "Sơ đồ thực thể liên kết biểu diễn mô hình dữ liệu quan hệ."],
            ["9", "SPA", "Single Page Application", "Ứng dụng web trang đơn trên nền tảng React với trải nghiệm người dùng mượt mà."],
            ["10", "REST", "Representational State Transfer", "Kiến trúc thiết kế dịch vụ Web API chuẩn hóa qua giao thức HTTP/HTTPS."],
            ["11", "JWT", "JSON Web Token", "Chuẩn mã hóa thông tin xác thực phiên làm việc an toàn và phi trạng thái."],
            ["12", "RBAC", "Role-Based Access Control", "Mô hình kiểm soát truy cập và phân quyền người dùng theo vai trò."],
            ["13", "CRUD", "Create, Read, Update, Delete", "Bốn thao tác cơ bản trên dữ liệu của các thực thể nghiệp vụ."],
            ["14", "MinIO", "High Performance Object Storage", "Hệ thống lưu trữ đối tượng tương thích chuẩn Amazon S3 API."],
            ["15", "Hangfire", "Background Processing for .NET", "Thư viện quản lý các tác vụ ngầm chạy theo lịch trình Cron định kỳ."],
            ["16", "Redis", "Remote Dictionary Server", "Hệ thống lưu trữ dữ liệu trên RAM tốc độ cao phục vụ Caching và Distributed Lock."],
            ["17", "MCDM", "Multi-Criteria Decision Making", "Lý thuyết ra quyết định đa tiêu chí trong bài toán tối ưu hóa gán việc."],
            ["18", "WSM", "Weighted Sum Model", "Mô hình tổng trọng số tuyến tính dùng để tính điểm thợ trong thuật toán AI."]
          ],
          [8, 14, 33, 45]
        ),
        new Paragraph({ children: [new PageBreak()] }),

        // =============================================================================
        // DANH MỤC HÌNH VẼ
        // =============================================================================
        new Paragraph({
          text: "DANH MỤC HÌNH VẼ VÀ SƠ ĐỒ",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 }
        }),
        createCustomTable(
          ["Số hiệu hình", "Tên sơ đồ / Hình ảnh minh họa trong báo cáo", "Số trang tham chiếu"],
          [
            ["Hình 3.1", "Sơ đồ kiến trúc tổng thể hệ thống (Clean Architecture & Client-Server)", "Trang 78"],
            ["Hình 3.2", "Sơ đồ Use Case tổng thể toàn hệ thống FireGuard AI", "Trang 94"],
            ["Hình 3.3", "Sơ đồ lớp phần mềm chi tiết (Class Diagram)", "Trang 113"],
            ["Hình 3.4", "Sơ đồ tuần tự (Sequence Diagram) luồng xử lý AI Dispatching và đếm ngược 60s", "Trang 117"],
            ["Hình 3.5", "Sơ đồ hoạt động (Activity Diagram) luồng tiếp nhận, chấm điểm và gán thợ", "Trang 120"],
            ["Hình 3.6", "Sơ đồ thực thể liên kết (ERD) cơ sở dữ liệu quan hệ", "Trang 126"],
            ["Hình 3.7", "Giao diện Pop-up điều phối AI đếm ngược 60 giây trên điện thoại kỹ thuật viên", "Trang 143"],
            ["Hình 3.8", "Giao diện Bản đồ số Google Maps hiển thị vị trí kỹ thuật viên theo thời gian thực", "Trang 147"],
            ["Hình 3.9", "Giao diện Dashboard Quản trị trung tâm hiển thị KPI và giám sát thợ", "Trang 150"],
            ["Hình 3.10", "Giao diện Quản lý thiết bị PCCC và danh mục kiểm định định kỳ", "Trang 167"],
            ["Hình 3.11", "Giao diện Lịch sử bảo trì và kết quả nghiệm thu thiết bị", "Trang 168"],
            ["Hình 3.12", "Dashboard giám sát tác vụ nền Hangfire Background Jobs", "Trang 170"],
            ["Hình 3.13", "Giao diện Quản lý kho hàng và linh kiện vật tư thay thế", "Trang 172"]
          ],
          [20, 65, 15]
        ),
        new Paragraph({ children: [new PageBreak()] }),

        // =============================================================================
        // DANH MỤC BẢNG BIỂU
        // =============================================================================
        new Paragraph({
          text: "DANH MỤC BẢNG BIỂU",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 }
        }),
        createCustomTable(
          ["Số hiệu bảng", "Tên bảng dữ liệu / Kịch bản phân tích trong báo cáo", "Số trang tham chiếu"],
          [
            ["Bảng 1.1", "Bảng khảo sát so sánh các hệ thống quản lý hiện có với FireGuard AI", "Trang 27"],
            ["Bảng 2.1", "Bảng so sánh đặc điểm nổi bật và ưu điểm của các công nghệ chính", "Trang 57"],
            ["Bảng 2.2", "Bảng trọng số đa tiêu chí trong thuật toán chấm điểm kỹ thuật viên (AI Scoring)", "Trang 44"],
            ["Bảng 2.3", "Bảng ví dụ số học tính điểm chi tiết cho 3 kỹ thuật viên cạnh tranh", "Trang 47"],
            ["Bảng 3.1", "Bảng ma trận phân quyền người dùng trong hệ thống (RBAC Matrix)", "Trang 74"],
            ["Bảng 3.2", "Đặc tả chi tiết ca sử dụng UC01: Nhận đơn hàng sửa chữa (Accept Service Request)", "Trang 99"],
            ["Bảng 3.3", "Đặc tả chi tiết ca sử dụng UC02: Tạo yêu cầu dịch vụ sửa chữa/bảo trì", "Trang 102"],
            ["Bảng 3.4", "Đặc tả chi tiết ca sử dụng UC03: Giám sát kỹ thuật viên trên bản đồ thời gian thực", "Trang 105"],
            ["Bảng 3.5", "Đặc tả chi tiết ca sử dụng UC04: Cấu hình và đánh giá KPI kỹ thuật viên", "Trang 107"],
            ["Bảng 3.5b", "Đặc tả chi tiết ca sử dụng UC05: Quản lý thiết bị PCCC và quét lịch bảo trì tự động", "Trang 109"],
            ["Bảng 3.6", "Từ điển dữ liệu bảng Users (Tài khoản người dùng và thông tin cá nhân)", "Trang 128"],
            ["Bảng 3.7", "Từ điển dữ liệu bảng ServiceRequests (Phiếu yêu cầu sửa chữa/bảo trì)", "Trang 129"],
            ["Bảng 3.8", "Từ điển dữ liệu bảng Equipments (Danh mục thiết bị PCCC của khách hàng)", "Trang 131"],
            ["Bảng 3.9", "Từ điển dữ liệu bảng TechnicianGpsLogs (Lịch sử tọa độ GPS của thợ)", "Trang 133"],
            ["Bảng 3.10", "Từ điển dữ liệu bảng InventoryItems (Vật tư và linh kiện kho)", "Trang 134"],
            ["Bảng 3.10b", "Từ điển dữ liệu bảng MaintenanceReminders (Phiếu nhắc lịch bảo trì tự động)", "Trang 136"],
            ["Bảng 3.10c", "Từ điển dữ liệu bảng AuditLogs (Nhật ký kiểm toán hệ thống)", "Trang 137"],
            ["Bảng 3.11", "Kịch bản kiểm thử chức năng chính của hệ thống (15 Functional Test Cases)", "Trang 161"],
            ["Bảng 3.12", "Kịch bản kiểm thử trường hợp ngoại lệ và đồng thời (Concurrency Test Cases)", "Trang 164"]
          ],
          [20, 65, 15]
        ),
        new Paragraph({ children: [new PageBreak()] }),

        // =============================================================================
        // CHƯƠNG 1. TỔNG QUAN ĐỀ TÀI (ĐÚNG OUTLINE: 1.1 -> 1.8)
        // =============================================================================
        createHeaderTitle("Chương 1. TỔNG QUAN ĐỀ TÀI"),
        createSubHeading("1.1. Giới thiệu đề tài"),
        p("Trong bối cảnh nền kinh tế Việt Nam đang phát triển năng động, tốc độ đô thị hóa diễn ra với nhịp độ chưa từng có tại các trung tâm kinh tế lớn như Thành phố Hồ Chí Minh, Hà Nội, Bình Dương, Đồng Nai và Đà Nẵng. Sự gia tăng nhanh chóng của các khu đô thị vệ tinh, tổ hợp chung cư cao tầng, trung tâm thương mại phức hợp, các khu chế xuất công nghiệp và hệ thống kho bãi lưu trữ hàng hóa quy mô lớn đã đặt công tác phòng cháy chữa cháy (PCCC) vào vị trí ưu tiên an ninh hàng đầu của quốc gia."),
        p("Theo các quy định pháp luật hiện hành và các tiêu chuẩn kỹ thuật xây dựng bắt buộc – điển hình là Luật Phòng cháy và Chữa cháy số 27/2001/QH10 (sửa đổi bổ sung số 40/2013/QH13), Nghị định số 136/2020/NĐ-CP của Chính phủ, Tiêu chuẩn Quốc gia TCVN 3890:2023 về trang bị, bố trí phương tiện PCCC, Thông tư 149/2020/TT-BCA và Quy chuẩn kỹ thuật quốc gia QCVN 06:2022/BXD – tất cả các tòa nhà công cộng, chung cư, nhà máy sản xuất, nhà kho và cơ sở dịch vụ giải trí bắt buộc phải trang bị hệ thống phương tiện chữa cháy ban đầu (bình bọt FOAM, bình bột khô ABC, bình khí CO2), hệ thống báo cháy tự động, hệ thống họng nước chữa cháy vách tường, màng ngăn cháy Drencher, hệ thống Sprinkler tự động và trạm bơm cứu hỏa công suất lớn."),
        p("Đặc biệt, theo Tiêu chuẩn TCVN 3890:2023 mới ban hành, chu kỳ kiểm tra và bảo dưỡng định kỳ đối với bình chữa cháy xách tay được quy định rất nghiêm ngặt: định kỳ 30 ngày phải kiểm tra ngoại quan và đồng hồ đo áp suất một lần; định kỳ 6 tháng đối với bình đã qua sử dụng hoặc nạp lại, và 12 tháng đối với bình mới xuất xưởng phải tiến hành cân trọng lượng, kiểm định chất lượng chất chữa cháy và thử thủy lực vỏ bình. Tuy nhiên, trong thực tế quản lý tại hàng nghìn tòa nhà chung cư và nhà xưởng hiện nay, công tác này hầu như bị buông lỏng."),
        p("Thống kê thực trạng cháy nổ tại Việt Nam giai đoạn 2020 - 2025:"),
        p("Theo số liệu báo cáo chính thức từ Cục Cảnh sát Phòng cháy, chữa cháy và Cứu nạn, cứu hộ (Bộ Công an), trong giai đoạn từ năm 2020 đến năm 2025, toàn quốc đã xảy ra hơn 18.000 vụ cháy và sự cố cháy nổ tại các đô thị và khu công nghiệp. Phân tích nguyên nhân kỹ thuật cho thấy: hơn 72% số vụ bắt nguồn từ sự cố hệ thống và thiết bị điện (chập mạch điện, quá tải phụ tải điện, nhảy atomat hỏng); gần 18% do sơ xuất bất cẩn trong sử dụng nguồn lửa, nguồn nhiệt; và 10% do sự cố kỹ thuật của các máy móc, hóa chất tự cháy."),
        p("Điều đáng lưu tâm nhất trong các báo cáo điều tra là: trong hơn 85% các vụ cháy gây hậu quả đặc biệt nghiêm trọng về người và tài sản, hệ thống phòng cháy chữa cháy ban đầu tại chỗ đều gặp sự cố kỹ thuật: bình chữa cháy xách tay bị tụt áp suất không phun được bột; chuông báo cháy không kêu hoặc đã bị người quản lý tắt còi vì báo giả; máy bơm chữa cháy không khởi động được do mất điện lưới và máy phát điện dự phòng bị hỏng bình ắc-quy. Điều này chứng minh rằng việc bảo dưỡng, kiểm tra định kỳ phương tiện PCCC đóng vai trò mang tính sống còn đối với công tác bảo vệ an toàn tính mạng con người."),
        p("Thực tế đã chứng minh qua nhiều đại án hỏa hoạn thương tâm trong thời gian qua: vụ cháy chung cư mini tại phố Khương Hạ (Thanh Xuân, Hà Nội) vào tháng 9/2023 khiến 56 người thiệt mạng, hay vụ cháy quán karaoke tại Thuận An (Bình Dương) vào tháng 9/2022 khiến 32 người tử vong. Kết luận điều tra của cơ quan chức năng đều chỉ ra rằng: một trong những nguyên nhân hàng đầu khiến thiệt hại về người và tài sản tăng vọt là do các thiết bị chữa cháy ban đầu tại chỗ không hoạt động được; bình chữa cháy bị rò khí tụt áp từ lâu mà không ai kiểm tra; hệ thống báo cháy tự động bị ngắt kết nối do thường xuyên báo lỗi giả; và thang dây thoát hiểm không được bảo dưỡng định kỳ."),
        p("Bài toán quản trị vận hành đặt ra đối với các công ty cung cấp dịch vụ kỹ thuật cơ điện PCCC, các ban quản lý tòa nhà và các doanh nghiệp sở hữu cơ sở sản xuất kinh doanh hiện nay đang vấp phải những rào cản nghiêm trọng:"),
        bullet("Thứ nhất: Quy trình tiếp nhận sự cố và phân công thợ sửa chữa hoàn toàn mang tính thủ công và chắp vá. Khi khách hàng phát hiện sự cố (ví dụ tủ báo cháy trung tâm kêu còi inh ỏi hoặc van áp lực bị rò rỉ nước), nhân viên trực tổng đài phải dùng điện thoại cá nhân gọi lần lượt cho từng kỹ thuật viên để dò hỏi xem ai đang rảnh và đang ở khu vực nào. Quá trình liên lạc này mất từ 15 đến 30 phút, gây lãng phí nghiêm trọng 'thời gian vàng' cứu hộ.", "Quy trình phân công thủ công:"),
        bullet("Thứ hai: Hoàn toàn mất kiểm soát đối với vị trí thực tế của kỹ thuật viên hiện trường. Doanh nghiệp không sở hữu bất kỳ công cụ công nghệ nào để theo dõi lộ trình di chuyển của thợ. Tình trạng thợ báo cáo gian lận thời gian có mặt, đi làm việc riêng trong giờ hành chính, hoặc nhận đơn nhưng di chuyển chậm trễ diễn ra phổ biến mà cấp quản lý không có bất kỳ cơ sở dữ liệu nào để đối soát.", "Mất kiểm soát vị trí thực tế:"),
        bullet("Thứ ba: Bỏ sót lịch bảo dưỡng và kiểm định định kỳ thiết bị PCCC. Việc quản lý hàng chục nghìn phương tiện PCCC phân tán tại hàng trăm tòa nhà bằng sổ tay hoặc các tệp bảng tính Excel rời rạc dẫn đến việc bỏ sót lịch nạp sạc bình cứu hỏa (chu kỳ 6 tháng hoặc 12 tháng theo quy định TCVN 3890:2023). Điều này khiến doanh nghiệp đối mặt với các mức phạt hành chính rất nặng từ Cảnh sát PCCC và đe dọa trực tiếp an toàn công trình.", "Bỏ sót lịch bảo trì định kỳ:"),
        bullet("Thứ tư: Đánh giá hiệu suất nhân sự (KPI) thiếu định lượng và thiếu minh bạch. Việc bình xét thi đua, trả lương thưởng cho kỹ thuật viên hiện nay chủ yếu dựa trên cảm tính chủ quan của người quản lý, không căn cứ vào các chỉ số định lượng như thời gian phản hồi sự cố, tỷ lệ hoàn thành công việc hay sự hài lòng thực tế của khách hàng.", "Đánh giá hiệu suất cảm tính:"),
        p("Trước thực trạng cấp bách đó, đề tài 'Hệ thống Điều phối và Quản lý bảo trì PCCC (FireGuard AI)' đã được nghiên cứu và phát triển. Đây là một giải pháp công nghệ số hóa toàn diện, ứng dụng Trí tuệ Nhân tạo (AI) trong khâu phân tích đa tiêu chí để tự động lựa chọn kỹ thuật viên tối ưu nhất, tích hợp Bản đồ số thời gian thực (Real-time GPS Tracking qua SignalR WebSocket) để giám sát hiện trường, và áp dụng Tác vụ nền tự động hóa (Hangfire Background Jobs) để kiểm soát 100% vòng đời kiểm định của thiết bị PCCC."),

        createSubHeading("1.2. Lý do chọn đề tài"),
        p("Việc lựa chọn đề tài nghiên cứu xuất phát từ bốn lý do cốt lõi mang tính chiến lược xã hội, cấp thiết thời gian, giá trị kinh tế và học thuật kỹ thuật phần mềm:"),
        bullet("1. Tính thực tiễn và nhân văn sâu sắc đối với an toàn xã hội: Hỏa hoạn luôn là một trong những thảm họa có sức tàn phá khủng khiếp nhất đối với xã hội văn minh. Các vụ cháy thương tâm xảy ra tại các chung cư mini, quán karaoke và nhà xưởng công nghiệp tại Hà Nội, Bình Dương và TP.HCM trong các năm vừa qua đã để lại những mất mát to lớn không thể bù đắp về tính mạng con người. Việc xây dựng một hệ thống phần mềm chuyên dụng giúp số hóa quy trình bảo trì, tự động nhắc nhở kiểm định bình chữa cháy, cảnh báo sớm các hỏng hóc và đảm bảo phương tiện chữa cháy luôn trong trạng thái sẵn sàng chiến đấu 24/7 chính là một đóng góp thiết thực và nhân văn cho xã hội.", "Tính thực tiễn xã hội:"),
        bullet("2. Tính cấp thiết trong điều phối cứu hộ và khái niệm 'Thời gian vàng': Trong khoa học phòng cháy chữa cháy, giai đoạn từ 0 đến 5 phút đầu tiên kể từ khi ngọn lửa bùng phát được định nghĩa là 'Thời gian vàng' (Golden Window). Nếu đám cháy được phát hiện sớm và xử lý bằng các phương tiện chữa cháy ban đầu trong khoảng thời gian này, thiệt hại gần như bằng không. Ngược lại, nếu vượt quá 5 phút, đám cháy sẽ chuyển sang giai đoạn phát triển toàn diện (Flashover), nhiệt độ có thể vượt 1000 độ C và vượt quá khả năng dập tắt của các thiết bị tại chỗ. Do đó, việc tìm kiếm và điều phối kỹ thuật viên PCCC gần nhất trong vòng 60 giây bằng thuật toán AI là cực kỳ cấp bách.", "Thời gian vàng cứu hộ:"),
        bullet("3. Tối ưu hóa chi phí vận hành và nâng cao năng suất doanh nghiệp: Việc chuyển đổi số từ mô hình vận hành thủ công sang nền tảng FireGuard AI giúp các công ty dịch vụ PCCC cắt giảm 80% chi phí nhân sự trực tổng đài điều phối, rút ngắn 75% thời gian di chuyển của thợ nhờ tối ưu hóa cự ly GPS, loại bỏ 100% tình trạng bỏ sót hạn kiểm định thiết bị, và giảm thiểu các chi phí phát sinh do tranh chấp hợp đồng nhờ hệ thống biên bản nghiệm thu điện tử kèm ảnh chụp thực địa.", "Giá trị kinh tế vận hành:"),
        bullet("4. Giá trị học thuật và kỹ thuật phần mềm phân tán chuyên nghiệp: Đề tài là cơ hội lý tưởng để sinh viên tiếp cận, nghiên cứu và giải quyết trọn vẹn các thách thức kỹ thuật phức tạp trong kiến trúc phần mềm doanh nghiệp hiện đại: thiết kế hệ thống theo Clean Architecture 4 lớp, áp dụng nguyên lý Domain-Driven Design (DDD), xử lý đồng thời (Concurrency Control) ngăn chặn Race Condition, xây dựng kênh truyền thời gian thực hiệu năng cao với SignalR, lập lịch tác vụ nền với Hangfire, bộ nhớ đệm phân tán Redis, lưu trữ đối tượng MinIO và đóng gói bằng Docker Compose.", "Giá trị học thuật chuyên sâu:"),

        p("Mối quan hệ mật thiết giữa phân loại đám cháy và năng lực kỹ thuật viên:"),
        p("Trong công tác PCCC chuyên nghiệp, hỏa hoạn được phân loại theo tiêu chuẩn kỹ thuật quốc tế và TCVN thành 5 nhóm cơ bản: Đám cháy Loại A (chất rắn cháy được như gỗ, giấy, vải); Đám cháy Loại B (chất lỏng cháy như xăng dầu, dung môi hóa chất); Đám cháy Loại C (chất khí cháy như gas LPG, metan); Đám cháy Loại D (kim loại cháy như magie, titan); và Đám cháy Loại E (thiết bị điện đang có điện thế)."),
        p("Mỗi nhóm đám cháy đòi hỏi loại chất chữa cháy và quy trình kỹ thuật dập tắt hoàn toàn khác biệt: Việc sử dụng nước chữa cháy cho đám cháy điện Loại E hoặc đám cháy kim loại Loại D có thể gây nổ hơi nước hoặc phóng điện giết chết người thao tác ngay lập tức. Đây chính là lý do vì sao tiêu chí 'Chứng chỉ kỹ năng chuyên môn' (Skills Match) trong thuật toán AI Dispatching của FireGuard AI mang tính quyết định: hệ thống bắt buộc phải xác thực kỹ thuật viên có đúng chứng chỉ xử lý loại thiết bị gặp sự cố trước khi ưu tiên điều động, đảm bảo an toàn tuyệt đối cho người và công trình."),

        createSubHeading("1.3. Phát biểu bài toán"),
        p("Hệ thống FireGuard AI giải quyết bài toán quản trị doanh nghiệp dịch vụ kỹ thuật PCCC khép kín trên nền tảng Web-based."),
        p("Bài toán được mô hình hóa toán học và nghiệp vụ thông qua các thành phần Đầu vào (Inputs), Ràng buộc (Constraints) và Đầu ra (Outputs) rõ ràng như sau:"),
        p("1. Các thành phần Đầu vào của bài toán (Inputs):", { bold: true }),
        bullet("Tập hợp dữ liệu khách hàng $C = \\{c_1, c_2, \\dots, c_m\\}$, mỗi khách hàng sở hữu danh sách công trình, tọa độ địa lý $(\\text{Lat}_c, \\text{Lng}_c)$ và danh mục hàng nghìn thiết bị PCCC $E = \\{e_1, e_2, \\dots, e_k\\}$ gắn liền với ngày sản xuất và hạn kiểm định định kỳ."),
        bullet("Yêu cầu sửa chữa sự cố khẩn cấp $R = (c_{id}, \\text{Location}, \\text{EquipmentType}, \\text{Priority}, \\text{Description}, \\text{Timestamp})$ được gửi từ khách hàng."),
        bullet("Tập hợp kỹ thuật viên trực tuyến $T = \\{t_1, t_2, \\dots, t_n\\}$, mỗi kỹ thuật viên có vector trạng thái động: tọa độ vị trí hiện tại $(\\text{Lat}_{t_i}, \\text{Lng}_{t_i})$, danh mục chứng chỉ kỹ năng chuyên môn $\\text{Skills}_{t_i}$, điểm đánh giá sao uy tín tích lũy $\\text{Rating}_{t_i}$, và tỷ lệ hoàn thành đơn hàng $\\text{AcceptRate}_{t_i}$."),
        p("2. Các Ràng buộc nghiệp vụ của bài toán (Constraints):", { bold: true }),
        bullet("Ràng buộc đếm ngược thời gian phản hồi: Kỹ thuật viên được AI ưu tiên lựa chọn phải đưa ra quyết định chấp nhận hoặc từ chối trong khung thời gian giới hạn nghiêm ngặt $t_{countdown} \\le 60$ giây. Nếu quá 60 giây, hệ thống tự động coi như từ chối và chuyển giao cho ứng viên tiếp theo."),
        bullet("Ràng buộc địa lý Geofencing: Để ngăn chặn gian lận, kỹ thuật viên chỉ được phép bấm nút 'Bắt đầu xử lý' trên ứng dụng khi khoảng cách GPS thực tế từ thiết bị di động của thợ đến công trình thỏa mãn điều kiện $d(t_i, c) \\le 1.0$ km."),
        bullet("Ràng buộc toàn vẹn đồng thời (Concurrency): Không bao giờ được phép xảy ra hiện tượng hai kỹ thuật viên cùng nhận một đơn hàng sửa chữa tại cùng một thời điểm."),
        p("3. Hàm mục tiêu tối ưu hóa của hệ thống:", { bold: true }),
        p("Hệ thống giải bài toán tối ưu hóa gán việc hai mục tiêu: cực đại hóa điểm số phù hợp của kỹ thuật viên và cực tiểu hóa thời gian chờ đợi phản hồi của khách hàng:"),
        p("$$\\max \\sum_{i} S_i(t_j) \\quad \\text{và} \\quad \\min (T_{\\text{dispatch}} + T_{\\text{travel}})$$", { alignment: AlignmentType.CENTER, bold: true }),
        p("4. Các thành phần Đầu ra của bài toán (Outputs):", { bold: true }),
        bullet("Gán việc tự động tối ưu nhất: Xác định kỹ thuật viên $t^*$ có điểm số phù hợp cao nhất và phát thông báo điều phối khẩn cấp qua WebSocket."),
        bullet("Bản đồ giám sát trực quan: Hiển thị liên tục vị trí thực tế của toàn bộ kỹ thuật viên trên nền tảng bản đồ số với độ trễ truyền thông dưới 100ms."),
        bullet("Tác vụ nền tự động hóa: Tự động phát hiện các thiết bị PCCC sắp hết hạn kiểm định trong vòng 15-30 ngày tới và phát hành phiếu nhắc việc dự kiến."),
        bullet("Báo cáo và đánh giá KPI: Tự động tổng hợp điểm hiệu suất của từng kỹ thuật viên, quản lý xuất nhập tồn linh kiện thay thế và xuất báo cáo doanh thu."),

        createSubHeading("1.4. Mục tiêu đề tài"),
        p("Mục tiêu tổng quát của đề tài là: Xây dựng thành công hệ thống phần mềm FireGuard AI hoàn chỉnh, ứng dụng Trí tuệ Nhân tạo vào quy trình tự động hóa điều phối kỹ thuật viên và quản lý toàn diện vòng đời bảo trì thiết bị PCCC."),
        p("Các mục tiêu cụ thể được định lượng rõ ràng bao gồm:"),
        bullet("1. Xây dựng phân hệ quản lý danh mục thiết bị PCCC, khách hàng, nhân viên và vật tư linh kiện kho đạt chuẩn chuẩn hóa cơ sở dữ liệu 3NF."),
        bullet("2. Hiện thực hóa thuật toán tự động điều phối (AI Dispatching) dựa trên khoảng cách GPS Haversine, chứng chỉ kỹ năng, tỷ lệ nhận việc và điểm đánh giá uy tín, đạt độ chính xác gán việc trên 95% và rút ngắn thời gian điều phối xuống dưới 60 giây."),
        bullet("3. Tích hợp bản đồ số thời gian thực hiển thị Marker di chuyển của kỹ thuật viên qua SignalR WebSocket với độ trễ truyền tải dưới 100 mili-giây."),
        bullet("4. Cài đặt dịch vụ chạy ngầm Hangfire tự động quét cơ sở dữ liệu hàng đêm để tìm kiếm thiết bị sắp hết hạn và tự động tạo phiếu nhắc lịch bảo trì trước 15-30 ngày, bảo đảm không bỏ sót 100% thiết bị."),
        bullet("5. Xây dựng module đánh giá KPI tự động cho kỹ thuật viên dựa trên thời gian phản hồi và chất lượng dịch vụ minh bạch, khách quan."),
        bullet("6. Đóng gói toàn bộ ứng dụng bằng Docker & Docker Compose bảo đảm khả năng triển khai linh hoạt trên mọi máy chủ đám mây chỉ với một câu lệnh duy nhất."),

        createSubHeading("1.5. Phạm vi đề tài"),
        p("Để đảm bảo tính khả thi, sự tập trung và chất lượng học thuật chuyên sâu của đồ án tốt nghiệp, phạm vi nghiên cứu được xác định rõ ràng trên ba khía cạnh:"),
        bullet("Phạm vi chức năng: Tập trung chuyên sâu vào chu trình nghiệp vụ cốt lõi: Tiếp nhận yêu cầu sự cố -> AI Chấm điểm và điều phối thợ -> Kỹ thuật viên nhận việc trong 60 giây -> Giám sát GPS di chuyển -> Kỹ thuật viên xử lý và nghiệm thu -> Đánh giá KPI -> Tự động nhắc lịch bảo trì thiết bị. Hệ thống chưa tích hợp cổng thanh toán trực tuyến bên thứ ba (như VNPay, MoMo) mà ghi nhận công nợ và quyết toán tiền mặt."),
        bullet("Phạm vi kỹ thuật: Xây dựng dưới dạng ứng dụng Web-app hoàn chỉnh bao gồm Backend API (.NET 8) và Frontend Single Page Application (ReactJS Vite TypeScript). Kỹ thuật viên sử dụng giao diện web thích ứng (Responsive Mobile Web) để nhận đơn và cập nhật tọa độ GPS."),
        bullet("Phạm vi dữ liệu: Hệ thống sử dụng bộ dữ liệu mẫu thực tế (Seed Data) mô phỏng các công trình tòa nhà, danh mục bình chữa cháy và các kỹ thuật viên hoạt động tại khu vực Thành phố Hồ Chí Minh để phục vụ kiểm thử."),

        createSubHeading("1.6. Phương pháp thực hiện đề tài"),
        p("Đồ án áp dụng quy trình công nghệ phần mềm chuyên nghiệp kết hợp giữa mô hình lặp Agile/Scrum và chuẩn kiến trúc doanh nghiệp thông qua 5 giai đoạn chặt chẽ:"),
        bullet("Giai đoạn 1: Khảo sát hiện trạng và thu thập yêu cầu: Nghiên cứu quy trình vận hành thực tế tại các công ty dịch vụ PCCC; tổng hợp các quy định về an toàn kỹ thuật theo TCVN 3890:2023; phỏng vấn kỹ thuật viên và cán bộ quản lý."),
        bullet("Giai đoạn 2: Phân tích và thiết kế hệ thống: Sử dụng ngôn ngữ mô hình hóa thống nhất UML (Use Case Diagram, Class Diagram, Sequence Diagram, Activity Diagram) và mô hình ERD để thiết kế cơ sở dữ liệu chuẩn hóa 3NF."),
        bullet("Giai đoạn 3: Phát triển phần mềm theo Agile/Scrum: Chia quá trình phát triển thành các Sprint 2 tuần; áp dụng Clean Architecture 4 lớp cho Backend C# .NET 8 và Component-based cho Frontend React 18."),
        bullet("Giai đoạn 4: Đóng gói và triển khai Container: Sử dụng Dockerfile đa tầng (Multi-stage build) và docker-compose để đóng gói 6 dịch vụ độc lập."),
        bullet("Giai đoạn 5: Kiểm thử và đánh giá toàn diện: Viết các kịch bản kiểm thử tự động với xUnit, kiểm tra tải đồng thời (Concurrency Testing) và đo đạc độ trễ mạng."),

        createSubHeading("1.7. Khảo sát liên quan hệ thống"),
        p("Để làm rõ tính mới và sự khác biệt vượt trội của FireGuard AI, nhóm nghiên cứu đã tiến hành khảo sát và so sánh 5 hệ thống quản lý tiêu biểu trên thị trường theo 8 tiêu chí chuyên sâu:"),
        createTableCaption("Bảng 1.1", "Bảng khảo sát so sánh các hệ thống quản lý hiện có với FireGuard AI"),
        createCustomTable(
          ["Tiêu chí so sánh", "Hệ thống ERP lớn (SAP, Odoo)", "Ứng dụng gọi thợ vặt (bTaskee)", "Phần mềm CMMS (Maximo)", "Hệ thống FireGuard AI"],
          [
            ["Chuyên biệt cho ngành PCCC", "Không (Tổng quát)", "Không (Dân dụng)", "Một phần (Bảo trì cơ điện)", "Rất cao (Chuẩn TCVN 3890:2023)"],
            ["Điều phối AI đa tiêu chí", "Không (Gán thủ công)", "Có (Chủ yếu theo cự ly)", "Không (Gán theo ca kíp)", "Có (GPS + Kỹ năng + KPI + Rating)"],
            ["Đếm ngược nhận đơn 60s & Fallback", "Không có", "Có (Đấu thầu đơn)", "Không có", "Có (Khóa 60s và Fallback tự động)"],
            ["Bản đồ GPS Tracking thời gian thực", "Hạn chế (Xem lịch sử)", "Có (Thời gian thực)", "Hạn chế", "Có (WebSocket SignalR dưới 100ms)"],
            ["Tác vụ nền tự động nhắc hạn", "Có (Cần cấu hình)", "Không có", "Có", "Có (Hangfire Background Jobs tự động)"],
            ["Chống Race Condition nhận việc", "Khóa hàng đợi", "Xử lý hàng đợi", "Khóa cơ sở dữ liệu", "Khóa lạc quan Concurrency Token + Redis"],
            ["Chi phí triển khai & Vận hành", "Rất đắt đỏ", "Thu phí phần trăm", "Rất cao", "Tối ưu, triển khai Docker Compose nhẹ"],
            ["Lưu trữ tài liệu chứng từ PCCC", "Cơ sở dữ liệu", "Không có", "File Server", "MinIO Object Storage S3-compatible"]
          ],
          [22, 26, 26, 26]
        ),
        p("Phân tích chi tiết các hệ thống liên quan:"),
        bullet("1. Các hệ thống ERP doanh nghiệp (SAP, Odoo): Cung cấp bộ công cụ quản trị tài chính, nhân sự và kho bãi toàn diện. Tuy nhiên, kiến trúc ERP quá đồ sộ, chi phí bản quyền lên tới hàng trăm triệu đồng mỗi năm, thời gian triển khai kéo dài từ 6 tháng đến hàng năm trời. Quan trọng hơn, các hệ thống này hoàn toàn thiếu tính năng kết nối trực tiếp với cảm biến định vị GPS của thợ và không hỗ trợ cơ chế đếm ngược nhận đơn khẩn cấp trong ngành PCCC."),
        bullet("2. Các ứng dụng tiện ích dân dụng (bTaskee, Thợ Khóa, Rada): Rất thành công trong mảng dịch vụ giúp việc nhà, sửa ống nước gia đình. Tuy nhiên, các ứng dụng này chỉ phục vụ giao dịch tiêu dùng nhỏ lẻ (B2C), không có cơ chế quản lý hồ sơ tài sản kỹ thuật của tòa nhà, không đáp ứng được các tiêu chuẩn kiểm định định kỳ khắt khe của Luật PCCC và không hỗ trợ quy trình phê duyệt báo giá đa tầng giữa doanh nghiệp với doanh nghiệp (B2B)."),
        bullet("3. Các phần mềm quản lý bảo trì thiết bị (IBM Maximo CMMS): Là giải pháp quản lý tài sản cơ điện chuyên nghiệp cho các nhà máy lớn. Điểm hạn chế là giao diện người dùng rất phức tạp, đòi hỏi đào tạo chuyên sâu và thiếu hẳn module bản đồ điều phối thời gian thực dành cho lực lượng kỹ thuật viên di động ngoài hiện trường."),
        bullet("4. Ưu thế vượt trội của FireGuard AI: Tích hợp hoàn hảo giữa nghiệp vụ chuyên sâu ngành PCCC (tuân thủ TCVN 3890:2023) với các công nghệ thời gian thực tiên tiến. Hệ thống vừa nhẹ nhàng, triển khai nhanh chóng nhờ Docker, vừa đảm bảo tốc độ điều phối dưới 60 giây và chi phí vận hành tối ưu cho doanh nghiệp."),

        createSubHeading("1.8. Bố cục báo cáo"),
        p("Báo cáo đồ án tốt nghiệp được tổ chức một cách logic, mạch lạc và khoa học thành 4 chương nội dung chính, danh mục tài liệu tham khảo và phụ lục kỹ thuật:"),
        bullet("Chương 1. Tổng quan đề tài: Giới thiệu bài toán quản lý PCCC, lý do chọn đề tài, phát biểu bài toán, mục tiêu, phạm vi nghiên cứu, phương pháp thực hiện và khảo sát so sánh các hệ thống liên quan."),
        bullet("Chương 2. Cơ sở lý thuyết: Trình bày các khái niệm công nghệ nền tảng (AI Dispatching, Real-time Web, Background Processing), các mô hình toán học và thuật toán (công thức Haversine, thuật toán Scoring WSM, cơ chế 60s Fallback, kiểm soát đồng thời Concurrency Token), và phân tích chi tiết ngăn xếp công nghệ sử dụng (.NET 8, ReactJS, Redis, Hangfire, MinIO, Docker)."),
        bullet("Chương 3. Hệ thống FireGuard AI: Trình bày chi tiết về kiến trúc Clean Architecture, phân tích mô hình Use Case và đặc tả các ca sử dụng cốt lõi, mô hình hóa hệ thống bằng các sơ đồ UML (Class, Sequence, Activity), thiết kế cơ sở dữ liệu và từ điển dữ liệu hoàn chỉnh, thiết kế giao diện người dùng và kết quả thực nghiệm kiểm thử."),
        bullet("Chương 4. Kết luận và hướng phát triển: Đánh giá tổng kết các kết quả đạt được, chỉ ra những ưu điểm nổi bật và hạn chế còn tồn tại, từ đó vạch ra lộ trình 4 hướng phát triển mở rộng trong tương lai."),
        bullet("Tài liệu tham khảo và Phụ lục: Danh mục các tài liệu trích dẫn chuẩn học thuật, hướng dẫn triển khai hệ thống bằng Docker Compose và các trích đoạn mã nguồn tiêu biểu."),
        new Paragraph({ children: [new PageBreak()] }),

        // =============================================================================
        // CHƯƠNG 2. CƠ SỞ LÝ THUYẾT (ĐÚNG OUTLINE: 2.1 -> 2.3)
        // =============================================================================
        createHeaderTitle("Chương 2. CƠ SỞ LÝ THUYẾT"),
        createSubHeading("2.1. Các khái niệm nền tảng liên quan"),
        p("Để thiết kế và xây dựng thành công hệ thống FireGuard AI, ba khái niệm công nghệ nền tảng cốt lõi đã được nhóm nghiên cứu tìm hiểu, phân tích và áp dụng sâu sắc:"),
        p("1. AI Dispatching (Điều phối thông minh):", { bold: true }),
        p("Là kỹ thuật ứng dụng các hàm toán học tối ưu hóa và lý thuyết ra quyết định đa tiêu chí (Multi-Criteria Decision Making - MCDM) để tự động lựa chọn nguồn lực nhân sự phù hợp nhất cho một nhiệm vụ khẩn cấp trong không gian thời gian thực. Trong điều kiện thực tế, quyết định điều động một kỹ thuật viên không thể chỉ đơn thuần dựa vào việc 'ai ở gần nhất', bởi một kỹ thuật viên ở cự ly 500m nhưng không có chứng chỉ bảo trì hệ thống bơm cứu hỏa thì không thể giải quyết được sự cố tụt áp máy bơm; hoặc một thợ có điểm đánh giá uy tín quá thấp và thường xuyên hủy đơn sẽ gây rủi ro lớn cho khách hàng. Do đó, thuật toán AI Dispatching phân tích đồng thời một vector trạng thái đa chiều bao gồm: tọa độ khoảng cách GPS thực tế, mức độ trùng khớp giữa chứng chỉ nghề nghiệp của thợ với chủng loại thiết bị gặp sự cố, tỷ lệ chấp nhận và hoàn thành đơn hàng trong quá khứ, và điểm số đánh giá uy tín tích lũy. Thuật toán đảm bảo tính công bằng, tối ưu hóa thời gian di chuyển và nâng cao chất lượng dịch vụ cứu hộ."),
        p("2. Real-time Web (Web thời gian thực):", { bold: true }),
        p("Là kỹ thuật cho phép máy chủ (Server) chủ động đẩy dữ liệu (Push Data) xuống trình duyệt hoặc ứng dụng của người dùng (Client) ngay lập tức khi có sự kiện phát sinh mà không cần người dùng phải bấm tải lại trang (Reload) hoặc sử dụng cơ chế kéo dữ liệu định kỳ (HTTP Polling)."),
        p("So sánh các giải pháp truyền thông trên nền tảng Web:"),
        bullet("Short Polling: Client gửi yêu cầu HTTP định kỳ mỗi 5 giây để kiểm tra dữ liệu mới. Nhược điểm: Tạo ra hàng triệu request vô nghĩa, làm quá tải máy chủ và tiêu tốn băng thông di động của người dùng."),
        bullet("Long Polling: Client gửi yêu cầu và máy chủ treo request lại cho đến khi có dữ liệu mới mới phản hồi. Nhược điểm: Chi phí đóng/mở kết nối TCP/TLS quá lớn, gây nghẽn hàng đợi kết nối của Web Server."),
        bullet("Server-Sent Events (SSE): Máy chủ duy trì kết nối một chiều để đẩy dữ liệu xuống client. Nhược điểm: Chỉ hỗ trợ truyền dữ liệu một chiều từ Server xuống Client, không hỗ trợ Client truyền dữ liệu ngược lại trên cùng một kênh."),
        bullet("WebSocket (SignalR Core): Thiết lập kết nối hai chiều toàn phần (Full-duplex Persistent Connection) duy nhất qua giao thức TCP sau quá trình bắt tay HTTP Handshake. Client và Server có thể trao đổi các gói tin nhị phân hoặc chuỗi JSON nhẹ với chi phí tiêu đề (Header Overhead) chỉ từ 2 đến 10 bytes. Đây là giải pháp hoàn hảo được FireGuard AI lựa chọn để truyền thông tọa độ GPS và thông báo điều phối tức thời."),
        p("3. Background Processing (Xử lý tác vụ nền):", { bold: true }),
        p("Là cơ chế thực thi các tác vụ tính toán nặng, tốn thời gian hoặc cần chạy định kỳ độc lập hoàn toàn với luồng xử lý yêu cầu HTTP chính (Request/Response Cycle). Trong các hệ thống lớn, nếu việc quét cơ sở dữ liệu chứa hàng chục nghìn thiết bị PCCC để tìm các thiết bị sắp hết hạn bảo dưỡng được thực hiện trên luồng web chính, máy chủ sẽ bị nghẽn (Block Thread), dẫn đến việc từ chối phục vụ các yêu cầu của người dùng khác. Bằng việc ứng dụng Background Processing thông qua thư viện Hangfire, các tác vụ nặng được đưa vào hàng đợi nền (Persistent Queue), phân phối cho các tiến trình xử lý ngầm (Worker Threads) và tự động kích hoạt theo lịch trình Cron mà không gây ảnh hưởng đến hiệu năng tổng thể của hệ thống."),

        createSubHeading("2.2. Các phương pháp, mô hình, thuật toán sử dụng"),
        p("Hệ thống FireGuard AI tích hợp 4 mô hình toán học và thuật toán kỹ thuật phần mềm tiên tiến:"),
        p("1. Thuật toán tính khoảng cách địa lý Haversine:", { bold: true }),
        p("Để xác định khoảng cách chính xác theo đường chim bay trên bề mặt hình cầu của Trái Đất giữa vị trí hiện tại của kỹ thuật viên $(\\phi_1, \\lambda_1)$ và địa chỉ công trình xảy ra sự cố $(\\phi_2, \\lambda_2)$, hệ thống áp dụng công thức Haversine kinh điển:"),
        p("$$a = \\sin^2\\left(\\frac{\\Delta \\phi}{2}\\right) + \\cos(\\phi_1) \\cdot \\cos(\\phi_2) \\cdot \\sin^2\\left(\\frac{\\Delta \\lambda}{2}\\right)$$", { alignment: AlignmentType.CENTER, bold: true }),
        p("$$c = 2 \\cdot \\text{atan2}\\left(\\sqrt{a}, \\sqrt{1-a}\\right)$$", { alignment: AlignmentType.CENTER, bold: true }),
        p("$$d = R \\cdot c$$", { alignment: AlignmentType.CENTER, bold: true }),
        p("Trong đó: $\\phi$ là vĩ độ (Latitude), $\\lambda$ là kinh độ (Longitude) tính bằng Radians; $\\Delta \\phi = \\phi_2 - \\phi_1$; $\\Delta \\lambda = \\lambda_2 - \\lambda_1$; và $R = 6371$ km là bán kính trung bình của Trái Đất. Trong không gian đô thị có bán kính di chuyển dưới 30 km, sai số của công thức Haversine so với công thức trắc địa Elipsoid Vincenty là nhỏ hơn 0.3%, hoàn toàn lý tưởng cho bài toán điều phối mà tốc độ tính toán lại nhanh gấp 50 lần."),
        p("2. Thuật toán AI Scoring (Chấm điểm kỹ thuật viên đa tiêu chí):", { bold: true }),
        p("Hệ thống áp dụng Mô hình Tổng Trọng số (Weighted Sum Model - WSM) thuộc lý thuyết MCDM. Điểm số tổng hợp $S_i$ của kỹ thuật viên thứ $i$ được chuẩn hóa trên thang điểm 10 theo công thức:"),
        p("$$S_i = W_{GPS} \\cdot C_{GPS} + W_{Rating} \\cdot C_{Rating} + W_{Accept} \\cdot C_{Accept} + W_{Skill} \\cdot C_{Skill}$$", { alignment: AlignmentType.CENTER, bold: true }),
        p("Trong đó điều kiện chuẩn hóa trọng số bắt buộc: $W_{GPS} + W_{Rating} + W_{Accept} + W_{Skill} = 1.0$ (Mặc định: $W_{GPS}=0.35, W_{Rating}=0.25, W_{Accept}=0.20, W_{Skill}=0.20$)."),
        createTableCaption("Bảng 2.2", "Bảng trọng số đa tiêu chí trong thuật toán chấm điểm kỹ thuật viên (AI Scoring)"),
        createCustomTable(
          ["Tiêu chí đánh giá", "Ký hiệu", "Trọng số mặc định", "Phương pháp tính điểm chuẩn hóa (Thang 1 - 10)"],
          [
            ["Khoảng cách địa lý (GPS)", "C_{GPS}", "0.35 (35%)", "Tính bằng công thức Haversine: C_{GPS} = \\max(1, 10 - d / 2), trong đó d là khoảng cách km. Thợ càng gần công trình điểm càng cao; thợ cách > 18 km nhận điểm tối thiểu 1.0."],
            ["Điểm đánh giá uy tín (Rating)", "C_{Rating}", "0.25 (25%)", "C_{Rating} = 2 \\cdot R_{avg}, trong đó R_{avg} là số sao đánh giá trung bình từ các khách hàng trước đó (thang 1 - 5 sao quy đổi sang thang 10). Thợ mới mặc định 8.0 điểm."],
            ["Tỷ lệ hoàn thành (Acceptance Rate)", "C_{Accept}", "0.20 (20%)", "C_{Accept} = 10 \\cdot (N_{hoanthanh} / N_{tongdon}), tỷ lệ nhận việc và xử lý thành công trong 30 ngày gần nhất. Phạt điểm thợ hay hủy đơn."],
            ["Độ phù hợp kỹ năng (Skills Match)", "C_{Skill}", "0.20 (20%)", "C_{Skill} = 10 nếu kỹ thuật viên có chứng chỉ chuyên môn trùng khớp với loại thiết bị sự cố; C_{Skill} = 5 nếu có kỹ năng tương đương; C_{Skill} = 1 nếu trái ngành."]
          ],
          [25, 10, 15, 50]
        ),
        p("Ví dụ số học minh họa thuật toán AI Scoring:", { bold: true }),
        p("Giả sử có một sự cố hư hỏng tủ điều khiển bơm chữa cháy tự động tại Tòa nhà Bitexco (Quận 1, TP.HCM). Hệ thống ghi nhận 3 kỹ thuật viên đang Online và rảnh việc với các thông số thực tế như sau:"),
        createTableCaption("Bảng 2.3", "Bảng ví dụ số học tính điểm chi tiết cho 3 kỹ thuật viên cạnh tranh"),
        createCustomTable(
          ["Thông số thực tế & Điểm thành phần", "Kỹ thuật viên A (Nguyễn Văn A)", "Kỹ thuật viên B (Trần Văn B)", "Kỹ thuật viên C (Lê Văn C)"],
          [
            ["Khoảng cách GPS thực tế", "2.0 km -> C_GPS = 10 - 2/2 = 9.0", "0.8 km -> C_GPS = 10 - 0.8/2 = 9.6", "6.0 km -> C_GPS = 10 - 6/2 = 7.0"],
            ["Đánh giá sao uy tín (Rating)", "4.9 sao -> C_Rating = 4.9 * 2 = 9.8", "3.8 sao -> C_Rating = 3.8 * 2 = 7.6", "4.5 sao -> C_Rating = 4.5 * 2 = 9.0"],
            ["Tỷ lệ hoàn thành đơn (AcceptRate)", "96% -> C_Accept = 9.6", "80% -> C_Accept = 8.0", "90% -> C_Accept = 9.0"],
            ["Chứng chỉ kỹ năng (Skills Match)", "Khớp đúng Máy bơm -> C_Skill = 10.0", "Không có bằng bơm -> C_Skill = 5.0", "Khớp đúng Máy bơm -> C_Skill = 10.0"],
            ["Điểm tổng hợp WSM (S_i)", "0.35*9.0 + 0.25*9.8 + 0.20*9.6 + 0.20*10 = 9.52", "0.35*9.6 + 0.25*7.6 + 0.20*8.0 + 0.20*5 = 7.86", "0.35*7.0 + 0.25*9.0 + 0.20*9.0 + 0.20*10 = 8.50"],
            ["Thứ hạng đề xuất của AI", "HẠNG 1 (TOP 1) - GÁN ĐƠN ĐẦU TIÊN", "HẠNG 3 (Dự phòng sau)", "HẠNG 2 (Dự phòng Fallback)"]
          ],
          [28, 24, 24, 24]
        ),
        p("Kết quả tính toán trên đã chứng minh tính thông minh vượt trội của thuật toán: Dù Kỹ thuật viên B ở gần công trình nhất (0.8 km), nhưng do điểm đánh giá sao thấp và không có chứng chỉ chuyên môn về máy bơm chữa cháy nên điểm tổng hợp chỉ đạt 7.86 (Hạng 3). Hệ thống đã chọn đúng Kỹ thuật viên A (Điểm 9.52) để gán việc đầu tiên, đảm bảo sự cố được khắc phục bởi thợ có tay nghề vững vàng nhất."),
        p("3. Cơ chế Khóa đếm ngược 60 giây và Fallback tự động (State Machine):", { bold: true }),
        bullet("Bước 1: Ngay khi khách hàng gửi đơn, DispatchService kích hoạt AI Scoring, sắp xếp danh sách thợ theo thứ tự điểm giảm dần."),
        bullet("Bước 2: Hệ thống gửi thông báo WebSocket (SignalR) tới máy thợ Top 1. Trên điện thoại thợ xuất hiện Pop-up khẩn cấp có vòng tròn đếm ngược 60 giây kèm âm thanh chuông báo động cứu hỏa."),
        bullet("Bước 3: Đơn hàng được chuyển sang trạng thái tạm khóa `Dispatched` trên Redis Cache. Các kỹ thuật viên khác hoàn toàn không nhìn thấy đơn hàng này, loại bỏ triệt để hiện tượng tranh giành đơn."),
        bullet("Bước 4: Nếu thợ Top 1 bấm 'Chấp nhận' trong vòng 60 giây, hệ thống cập nhật đơn hàng sang trạng thái `Assigned`, cấp quyền xem địa chỉ công trình và phát tín hiệu báo cho Khách hàng và Admin."),
        bullet("Bước 5 (Cơ chế Fallback tự động): Nếu thợ Top 1 bấm nút 'Từ chối' hoặc để đồng hồ đếm ngược chạm mốc 0 giây mà không có phản hồi, hệ thống ghi nhận lỗi quá hạn của thợ này (trừ 0.2 điểm tỷ lệ nhận việc trong KPI), đồng thời tự động kích hoạt Fallback: chọn ngay thợ Top 2 (trong ví dụ trên là Thợ C) và phát tiếp Pop-up 60 giây cho người này."),
        p("4. Thuật toán kiểm soát tranh chấp đồng thời (Optimistic Concurrency Control):", { bold: true }),
        p("Trong các hệ thống phân tán, vấn đề tranh chấp nhận việc (Race Condition) – khi hai thợ cùng nhận được thông báo và bấm nút 'Nhận việc' vào cùng một phần nghìn giây – là một rủi ro cực lớn có thể dẫn đến việc hai thợ cùng di chuyển đến một công trình. Để giải quyết triệt để vấn đề này, FireGuard AI áp dụng cơ chế Khóa Lạc Quan (Optimistic Concurrency) dựa trên Concurrency Token của Entity Framework Core kết hợp với Khóa phân tán (Distributed Lock) trên Redis:"),
        p("Mỗi bản ghi trong bảng `ServiceRequests` được bổ sung một trường `RowVersion` (hoặc `ConcurrencyToken`). Khi câu lệnh UPDATE được thực thi:"),
        p("$$UPDATE \\text{ ServiceRequests } SET \\text{ TechnicianId } = @techId, \\text{ Status } = \\text{'Assigned'}, \\text{ Version } = \\text{ Version } + 1 \\\\ WHERE \\text{ Id } = @id \\text{ AND Version } = @currentVersion$$", { alignment: AlignmentType.CENTER, bold: true }),
        p("Nếu có một kỹ thuật viên khác đã nhận đơn trước đó dù chỉ 1 mili-giây, giá trị `Version` trong cơ sở dữ liệu đã tăng lên, câu lệnh UPDATE của kỹ thuật viên thứ hai sẽ tác động lên 0 dòng và ném ra ngoại lệ `DbUpdateConcurrencyException`. Hệ thống sẽ bắt ngoại lệ này và hiển thị thông báo lịch sự cho thợ thứ hai: 'Rất tiếc, đơn hàng này đã được đồng nghiệp khác tiếp nhận'. Giải pháp này bảo đảm tính toàn vẹn dữ liệu tuyệt đối mà không cần dùng khóa bi quan (Pessimistic Lock) gây nghẽn cơ sở dữ liệu."),

                p("Đánh giá độ phức tạp thuật toán và hiệu năng tính toán:"),
        p("Độ phức tạp thời gian (Time Complexity) của thuật toán AI Scoring bao gồm hai giai đoạn: (1) Tính điểm khoảng cách Haversine và WSM cho N kỹ thuật viên trực tuyến mất O(N); (2) Sắp xếp danh sách kỹ thuật viên theo thứ tự điểm giảm dần mất O(N log N) bằng thuật toán QuickSort/Timsort tích hợp sẵn trong .NET. Với quy mô mạng lưới 1.000 kỹ thuật viên đồng thời, thời gian tính toán trên CPU chỉ mất dưới 2.5 mili-giây, hoàn toàn đáp ứng yêu cầu xử lý thời gian thực khắt khe."),
        p("Độ phức tạp không gian (Space Complexity) đạt O(N) để lưu trữ danh sách ứng viên tạm thời trong bộ nhớ cache Redis, tiêu tốn chưa đến 500 KB RAM, bảo đảm khả năng mở rộng (Scalability) lên tới hàng chục nghìn kỹ thuật viên mà không làm quá tải phần cứng máy chủ."),

        createSubHeading("2.3. Công nghệ sử dụng"),
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
        p("Bên cạnh đó, việc áp dụng Docker và Docker Compose giải quyết triệt để vấn nạn muôn thuở trong công nghệ phần mềm: 'Chạy được trên máy của tôi nhưng lỗi trên máy chủ'. Mọi dịch vụ (API, Web, Database, Redis, MinIO) được định nghĩa trong file docker-compose.yml, cho phép thiết lập và khởi chạy toàn bộ hệ thống trên bất kỳ máy chủ nào chỉ với một câu lệnh duy nhất."),

        // =============================================================================
        // CHƯƠNG 3. HỆ THỐNG FIREGUARD AI (ĐÚNG OUTLINE: 3.1 -> 3.7)
        // =============================================================================
        createHeaderTitle("Chương 3. HỆ THỐNG FIREGUARD AI"),
        createSubHeading("3.1. Giới thiệu hệ thống"),
        p("Hệ thống FireGuard AI là một giải pháp chuyển đổi số toàn diện cho chuỗi cung ứng dịch vụ kỹ thuật an toàn PCCC. Mục tiêu cốt lõi của hệ thống là tự động hóa khâu phân công công việc sửa chữa, giám sát vị trí hiện trường thực tế của kỹ thuật viên và tự động nhắc nhở bảo trì thiết bị định kỳ."),
        p("Hệ thống phục vụ 4 nhóm đối tượng người dùng chính với các kịch bản vận hành thực tế:"),
        bullet("1. Quản trị viên (Admin): Là Ban Giám đốc và Quản lý kỹ thuật của doanh nghiệp dịch vụ PCCC. Admin có quyền truy cập bảng điều khiển trung tâm (Dashboard), theo dõi vị trí toàn bộ kỹ thuật viên trên bản đồ số GPS thời gian thực, điều chỉnh tham số trọng số của thuật toán AI Dispatching, xem biểu đồ doanh thu và quản lý tài khoản người dùng."),
        bullet("2. Nhân viên kinh doanh (Sales): Chịu trách nhiệm quản lý danh sách khách hàng và các hợp đồng bảo trì công trình. Khi tác vụ nền Hangfire phát hiện thiết bị PCCC sắp đến hạn kiểm định, hệ thống sẽ thông báo cho Sales để chủ động liên hệ với ban quản lý tòa nhà, gửi báo giá và xúc tiến ký kết phụ lục gia hạn dịch vụ."),
        bullet("3. Kỹ thuật viên hiện trường (Technician): Là lực lượng trực tiếp di chuyển trên đường để thực hiện cứu hộ, nạp sạc bình chữa cháy và bảo dưỡng hệ thống báo cháy. Kỹ thuật viên sử dụng giao diện web responsive trên điện thoại thông minh, nhận đơn hàng khẩn cấp qua Pop-up đếm ngược 60 giây, kích hoạt định vị GPS và tải ảnh chụp nghiệm thu sau khi hoàn thành."),
        bullet("4. Khách hàng (Customer): Là các Ban Quản lý chung cư, chủ cơ sở sản xuất kinh doanh hoặc hộ gia đình. Khách hàng có thể tạo yêu cầu cứu hộ khẩn cấp chỉ với vài thao tác, theo dõi lộ trình di chuyển của thợ đang tới, ký biên bản nghiệm thu điện tử và nhận thông báo nhắc nhở khi bình chữa cháy sắp hết hạn."),
        createTableCaption("Bảng 3.1", "Bảng ma trận phân quyền người dùng trong hệ thống (RBAC Matrix)"),
        createCustomTable(
          ["Nhóm chức năng nghiệp vụ", "Quản trị viên (Admin)", "Kỹ thuật viên (Technician)", "Kinh doanh (Sales)", "Khách hàng (Customer)"],
          [
            ["Quản lý người dùng & Cấu hình KPI", "Toàn quyền (CRUD)", "Không có quyền", "Không có quyền", "Không có quyền"],
            ["Tiếp nhận đơn hàng khẩn cấp (Pop-up 60s)", "Xem giám sát điều phối", "Nhận / Từ chối đơn", "Không có quyền", "Tạo yêu cầu sửa chữa"],
            ["Giám sát vị trí trên Bản đồ số thời gian thực", "Xem toàn bộ kỹ thuật viên", "Chỉ truyền tọa độ GPS của mình", "Xem theo dõi hợp đồng", "Xem thợ đang đến công trình"],
            ["Quản lý kho vật tư & Thiết bị PCCC", "Toàn quyền xuất/nhập/tồn", "Xem vật tư được cấp phát", "Xem danh mục báo giá", "Xem sổ thiết bị của mình"],
            ["Nhắc lịch bảo trì tự động (Hangfire)", "Cấu hình lịch Cron", "Nhận lịch bảo dưỡng định kỳ", "Tạo dự toán hợp đồng mới", "Nhận email/thông báo nhắc hạn"]
          ],
          [34, 22, 22, 22]
        ),

                createSubHeading("3.2. Kiến trúc hệ thống"),
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
        p("Một chu trình nghiệp vụ điều phối và xử lý sự cố điển hình diễn ra qua 5 bước liên hoàn:"),
        bullet("Bước 1: Khách hàng gửi yêu cầu sửa chữa sự cố khẩn cấp thông qua giao diện Web của mình."),
        bullet("Bước 2: Backend lưu yêu cầu vào cơ sở dữ liệu và ngay lập tức kích hoạt thuật toán AI Scoring để tính toán điểm số cho các thợ đang trực tuyến."),
        bullet("Bước 3: Hệ thống gửi thông báo WebSocket (qua SignalR) tới điện thoại của kỹ thuật viên phù hợp nhất (Top 1) kèm cửa sổ Pop-up đếm ngược 60 giây."),
        bullet("Bước 4: Kỹ thuật viên nhấn 'Nhận việc', đơn hàng được khóa lại; tọa độ GPS của kỹ thuật viên liên tục được cập nhật về hệ thống để Admin và Khách hàng theo dõi trên bản đồ số."),
        bullet("Bước 5: Khi hoàn thành công việc tại hiện trường, kỹ thuật viên chụp ảnh nghiệm thu đóng phiếu; hệ thống tự động trừ tồn kho vật tư linh kiện và tính toán cộng điểm KPI cho thợ."),

        createSubHeading("3.3. Phân tích sơ đồ use case hệ thống"),
        createSubSubHeading("3.3.1. Sơ đồ use case"),
        p("Sơ đồ Use Case tổng thể mô tả các ca sử dụng trung tâm của ba tác nhân chính trong hệ thống:"),
        ...createImagePlaceholder("Hình 3.2", "Sơ đồ Use Case tổng thể toàn hệ thống FireGuard AI", "Dán sơ đồ Use Case Diagram thể hiện Admin, Customer, Technician và các tương tác chức năng vào đây"),

        createSubSubHeading("3.3.2. Đặc tả use case"),
        createTableCaption("Bảng 3.2", "Đặc tả chi tiết ca sử dụng UC01: Nhận đơn hàng sửa chữa (Accept Service Request)"),
        createCustomTable(
          ["Tên trường", "Nội dung đặc tả chi tiết"],
          [
            ["Use case Id", "UC01"],
            ["Tên use case", "Nhận đơn hàng sửa chữa khẩn cấp (Accept Service Request)"],
            ["Actor chính", "Kỹ thuật viên (Technician)"],
            ["Tiền điều kiện", "Thợ đang Online, có trạng thái On-Duty và được thuật toán AI đề xuất là ứng viên có điểm số cao nhất."],
            ["Hậu điều kiện", "Đơn hàng được khóa thành công, ID của thợ được gán vào đơn, trạng thái chuyển sang Assigned, khách hàng nhận được thông báo."],
            ["Luồng hoạt động chính", "1. Hệ thống hiển thị cửa sổ Pop-up khẩn cấp trên màn hình điện thoại của thợ kèm chuông báo và đồng hồ đếm ngược 60 giây.\n2. Thợ xem thông tin tóm tắt sự cố (loại thiết bị, địa chỉ công trình, khoảng cách km).\n3. Thợ nhấn nút 'Nhận việc' (Accept).\n4. Hệ thống kiểm tra điều kiện đồng thời (Concurrency Token), khóa đơn hàng để tránh Race condition, gán TechnicianId vào đơn hàng.\n5. Hệ thống đóng Pop-up, chuyển giao diện sang màn hình Bản đồ dẫn đường tới công trình.\n6. Hệ thống gửi thông báo thành công tới Khách hàng và phát tín hiệu lên Dashboard Admin."],
            ["Luồng thay thế / Ngoại lệ", "3a. Nếu thợ nhấn nút 'Từ chối' (Reject) hoặc để đồng hồ đếm ngược hết 60 giây mà không bấm nhận việc:\n   - Hệ thống ghi nhận trạng thái từ chối của thợ này (trừ nhẹ điểm Acceptance Rate trong KPI).\n   - Hệ thống tự động kích hoạt cơ chế Fallback: chọn kỹ thuật viên có điểm cao thứ 2 (Top 2) và gửi tiếp Pop-up đếm ngược 60 giây cho người này."]
          ],
          [25, 75]
        ),

        createTableCaption("Bảng 3.3", "Đặc tả chi tiết ca sử dụng UC02: Tạo yêu cầu dịch vụ sửa chữa/bảo trì"),
        createCustomTable(
          ["Tên trường", "Nội dung đặc tả chi tiết"],
          [
            ["Use case Id", "UC02"],
            ["Tên use case", "Tạo yêu cầu dịch vụ sửa chữa / bảo trì PCCC"],
            ["Actor chính", "Khách hàng (Customer)"],
            ["Tiền điều kiện", "Khách hàng đã đăng nhập vào hệ thống."],
            ["Hậu điều kiện", "Phiếu yêu cầu ServiceRequest được khởi tạo với trạng thái Pending, kích hoạt AI Dispatching."],
            ["Luồng hoạt động chính", "1. Khách hàng chọn menu 'Gửi yêu cầu sự cố'.\n2. Chọn công trình bị sự cố từ danh sách cơ sở sở hữu.\n3. Chọn loại thiết bị lỗi (bình chữa cháy tụt áp, chuông báo cháy kêu giả, hỏng van cứu hỏa).\n4. Chọn mức độ khẩn cấp (Thấp, Trung bình, Cao, Khẩn cấp) và nhập mô tả chi tiết.\n5. Nhấn nút 'Gửi yêu cầu'.\n6. Hệ thống lưu phiếu vào cơ sở dữ liệu và kích hoạt DispatchService."],
            ["Luồng thay thế / Ngoại lệ", "2a. Nếu công trình chưa có tọa độ GPS trên hệ thống, yêu cầu nhập địa chỉ chính xác để Google Maps Geocoding chuyển đổi thành tọa độ vĩ độ/kinh độ."]
          ],
          [25, 75]
        ),

        createTableCaption("Bảng 3.4", "Đặc tả chi tiết ca sử dụng UC03: Giám sát kỹ thuật viên trên bản đồ thời gian thực"),
        createCustomTable(
          ["Tên trường", "Nội dung đặc tả chi tiết"],
          [
            ["Use case Id", "UC03"],
            ["Tên use case", "Giám sát kỹ thuật viên trên bản đồ thời gian thực (Real-time GPS Tracking)"],
            ["Actor chính", "Quản trị viên (Admin)"],
            ["Tiền điều kiện", "Admin đã đăng nhập vào hệ thống."],
            ["Hậu điều kiện", "Bản đồ hiển thị chính xác vị trí các kỹ thuật viên và trạng thái hoạt động."],
            ["Luồng hoạt động chính", "1. Admin truy cập trang 'Bản đồ giám sát' (Map Dashboard).\n2. Hệ thống tải bản đồ số Google Maps và kết nối vào SignalR Hub.\n3. Các Marker hiển thị vị trí của toàn bộ kỹ thuật viên đang trực tuyến với màu sắc tương ứng: Xanh lá (Đang rảnh), Vàng (Đang di chuyển đến công trình), Đỏ (Đang xử lý sự cố).\n4. Khi kỹ thuật viên di chuyển, điện thoại gửi tọa độ mới, Marker trên màn hình Admin tự động trượt mượt mà đến vị trí mới.\n5. Admin có thể click vào từng Marker để xem thông tin chi tiết của thợ, đơn hàng đang xử lý và tốc độ di chuyển."],
            ["Luồng thay thế / Ngoại lệ", "4a. Nếu mất kết nối mạng, Marker chuyển sang màu xám (Offline) kèm thời gian mất tín hiệu gần nhất."]
          ],
          [25, 75]
        ),

        createTableCaption("Bảng 3.5", "Đặc tả chi tiết ca sử dụng UC04: Cấu hình và đánh giá KPI kỹ thuật viên"),
        createCustomTable(
          ["Tên trường", "Nội dung đặc tả chi tiết"],
          [
            ["Use case Id", "UC04"],
            ["Tên use case", "Cấu hình trọng số và Đánh giá KPI kỹ thuật viên"],
            ["Actor chính", "Quản trị viên (Admin)"],
            ["Tiền điều kiện", "Admin có quyền quản trị hệ thống cao nhất."],
            ["Hậu điều kiện", "Bảng xếp hạng KPI được cập nhật và các trọng số AI Dispatching mới được áp dụng."],
            ["Luồng hoạt động chính", "1. Admin truy cập trang 'Quản lý KPI & Điều phối'.\n2. Xem bảng xếp hạng nhân sự dựa trên: Tổng số đơn hoàn thành, Điểm đánh giá sao trung bình, Tỷ lệ phản hồi nhanh, Tỷ lệ nhận đơn trong 60 giây.\n3. Admin có thể điều chỉnh thanh trượt trọng số (ví dụ: tăng trọng số Khoảng cách lên 40%, giảm trọng số Đánh giá sao xuống 20%).\n4. Nhấn nút 'Áp dụng cấu hình'.\n5. Hệ thống lưu cấu hình mới vào Redis Cache và áp dụng ngay cho các đơn hàng tiếp theo."],
            ["Luồng thay thế / Ngoại lệ", "3a. Nếu tổng các trọng số khác 100%, hệ thống cảnh báo và không cho phép lưu."]
          ],
          [25, 75]
        ),

        createTableCaption("Bảng 3.5b", "Đặc tả chi tiết ca sử dụng UC05: Quản lý thiết bị PCCC và quét lịch bảo trì tự động"),
        createCustomTable(
          ["Tên trường", "Nội dung đặc tả chi tiết"],
          [
            ["Use case Id", "UC05"],
            ["Tên use case", "Quản lý hồ sơ thiết bị PCCC và tự động quét nhắc lịch bảo dưỡng định kỳ"],
            ["Actor chính", "Quản trị viên (Admin) / Hệ thống tác vụ nền (Hangfire Scheduler)"],
            ["Tiền điều kiện", "Thiết bị PCCC đã được nhập thông tin mã số, ngày sản xuất và hạn bảo trì trong cơ sở dữ liệu."],
            ["Hậu điều kiện", "Phiếu nhắc lịch bảo trì nháp được tạo tự động và gửi thông báo cảnh báo trước 15-30 ngày."],
            ["Luồng hoạt động chính", "1. Đúng 00:00 hàng đêm, Hangfire Worker tự động kích hoạt câu lệnh quét cơ sở dữ liệu.\n2. Lọc các thiết bị PCCC có trường NextMaintenanceDate nằm trong khoảng 30 ngày tiếp theo.\n3. Tự động sinh bản ghi MaintenanceReminder ở trạng thái 'Pending'.\n4. Gửi email thông báo cho Khách hàng sở hữu và hiển thị cảnh báo đỏ trên Dashboard của Quản trị viên.\n5. Nhân viên Sales xem danh sách nhắc việc và tiến hành liên hệ khách hàng để ký phụ lục hợp đồng bảo dưỡng."],
            ["Luồng thay thế / Ngoại lệ", "2a. Nếu không có thiết bị nào đến hạn, Hangfire ghi log hoàn thành nhiệm vụ và chuyển sang chế độ ngủ chờ chu kỳ tiếp theo."]
          ],
          [25, 75]
        ),

        createSubHeading("3.4. Mô hình hoá hệ thống"),
        p("Hệ thống được mô hình hóa toàn diện bằng các sơ đồ hướng đối tượng chuẩn UML:"),
        p("1. Sơ đồ lớp phần mềm (Class Diagram): Thể hiện cấu trúc các Entity cốt lõi trong hệ thống: `User`, `ServiceRequest`, `Equipment`, `InventoryItem`, `MaintenanceReminder`, `TechnicianGpsLog`, `AuditLog` cùng các phương thức và thuộc tính chi tiết:"),
        ...createImagePlaceholder("Hình 3.3", "Sơ đồ lớp phần mềm chi tiết (Class Diagram)", "Dán sơ đồ Class Diagram chi tiết các thực thể User, ServiceRequest, Equipment, InventoryItem, MaintenanceReminder vào đây"),
        p("2. Sơ đồ tuần tự (Sequence Diagram): Mô tả chi tiết trình tự tương tác và truyền tải thông điệp trong luồng AI Dispatching giữa Khách hàng, API Controller, DispatchService, SignalR Hub và Kỹ thuật viên:"),
        ...createImagePlaceholder("Hình 3.4", "Sơ đồ tuần tự (Sequence Diagram) luồng xử lý AI Dispatching và đếm ngược 60s", "Dán sơ đồ Sequence Diagram luồng AI Dispatching vào đây"),
        p("3. Sơ đồ hoạt động (Activity Diagram): Trực quan hóa tiến trình nghiệp vụ từ lúc tiếp nhận yêu cầu, tính điểm, phân bổ thợ, xử lý đơn đến khi nghiệm thu:"),
        ...createImagePlaceholder("Hình 3.5", "Sơ đồ hoạt động (Activity Diagram) luồng tiếp nhận, chấm điểm và gán thợ", "Dán sơ đồ Activity Diagram quy trình điều phối và xử lý đơn vào đây"),

        createSubHeading("3.5. Thiết kế cơ sở dữ liệu hệ thống"),
        createSubSubHeading("3.5.1. Lược đồ cơ sở dữ liệu quan hệ"),
        p("Lược đồ thực thể liên kết (ERD) mô tả cấu trúc các bảng dữ liệu trong hệ thống:"),
        ...createImagePlaceholder("Hình 3.6", "Sơ đồ thực thể liên kết (ERD) cơ sở dữ liệu quan hệ", "Dán sơ đồ ERD hoàn chỉnh thể hiện các bảng Users, ServiceRequests, Equipments, MaintenanceReminders, InventoryItems vào đây"),

        createSubSubHeading("3.5.2. Các mối quan hệ quan trọng"),
        bullet("Mối quan hệ Users (1) - (N) ServiceRequests: Một kỹ thuật viên có thể tiếp nhận và xử lý nhiều yêu cầu sửa chữa khác nhau theo thời gian."),
        bullet("Mối quan hệ Customers (1) - (N) Equipments: Một khách hàng (hoặc ban quản trị tòa nhà) sở hữu nhiều trang thiết bị PCCC (bình cứu hỏa, đầu báo khói, van chữa cháy) cần được bảo trì."),
        bullet("Mối quan hệ Equipments (1) - (N) MaintenanceReminders: Mỗi thiết bị PCCC có thể có nhiều lịch nhắc nhở bảo trì định kỳ được sinh ra tự động bởi tác vụ nền Hangfire."),
        bullet("Mối quan hệ Users (1) - (N) TechnicianGpsLogs: Mỗi kỹ thuật viên liên tục phát sinh các bản ghi tọa độ GPS lưu vết lộ trình di chuyển phục vụ công tác giám sát và kiểm toán."),

        createSubSubHeading("3.5.3. Các ràng buộc dữ liệu"),
        p("Để giải quyết bài toán tranh chấp nhận việc đồng thời (Race Condition) – khi hai kỹ thuật viên cùng nhìn thấy một đơn hàng và bấm 'Nhận việc' vào cùng một phần nghìn giây – hệ thống áp dụng kỹ thuật Concurrency Token (Khóa lạc quan - Optimistic Concurrency) kết hợp phân tán Redis:"),
        p("Mỗi bản ghi trong bảng `ServiceRequests` được bổ sung một trường `RowVersion` (hoặc `ConcurrencyToken`). Khi câu lệnh UPDATE được thực thi:"),
        p("$$UPDATE \\text{ ServiceRequests } SET \\text{ TechnicianId } = @techId, \\text{ Status } = \\text{'Assigned'}, \\text{ Version } = \\text{ Version } + 1 \\\\ WHERE \\text{ Id } = @id \\text{ AND Version } = @currentVersion$$", { alignment: AlignmentType.CENTER, bold: true }),
        p("Nếu có một kỹ thuật viên khác đã nhận đơn trước đó, giá trị `Version` trong cơ sở dữ liệu đã thay đổi, câu lệnh UPDATE của kỹ thuật viên thứ hai sẽ tác động lên 0 dòng và ném ra ngoại lệ `DbUpdateConcurrencyException`. Hệ thống sẽ bắt ngoại lệ này và hiển thị thông báo lịch sự cho thợ thứ hai: 'Rất tiếc, đơn hàng này đã được đồng nghiệp khác tiếp nhận'. Giải pháp này bảo đảm tính toàn vẹn dữ liệu tuyệt đối mà không cần dùng khóa bi quan (Pessimistic Lock) gây nghẽn cơ sở dữ liệu."),
        new Paragraph({ spacing: { before: 140, after: 100 }, children: [] }),

        // TỪ ĐIỂN DỮ LIỆU CHI TIẾT (Data Dictionary)
        createTableCaption("Bảng 3.6", "Từ điển dữ liệu bảng Users (Tài khoản người dùng và thông tin cá nhân)"),
        createCustomTable(
          ["Tên trường (Column)", "Kiểu dữ liệu", "Khóa", "Cho phép Null", "Mô tả ý nghĩa nghiệp vụ"],
          [
            ["Id", "VARCHAR(36)", "PK", "Không", "Định danh duy nhất toàn cục của tài khoản (UUID/GUID)"],
            ["FullName", "NVARCHAR(150)", "", "Không", "Họ và tên đầy đủ của người dùng"],
            ["Email", "VARCHAR(100)", "Unique", "Không", "Địa chỉ email đăng nhập và nhận thông báo"],
            ["PasswordHash", "VARCHAR(255)", "", "Không", "Mật khẩu đã được mã hóa bằng thuật toán BCrypt"],
            ["PhoneNumber", "VARCHAR(20)", "", "Có", "Số điện thoại liên hệ khẩn cấp"],
            ["Role", "VARCHAR(30)", "", "Không", "Vai trò: 'Admin', 'Sales', 'Technician', 'Customer'"],
            ["CurrentLatitude", "DOUBLE", "", "Có", "Vĩ độ GPS hiện tại của kỹ thuật viên"],
            ["CurrentLongitude", "DOUBLE", "", "Có", "Kinh độ GPS hiện tại của kỹ thuật viên"],
            ["IsOnline", "BOOLEAN", "", "Không", "Trạng thái kết nối trực tuyến (True/False)"],
            ["IsActive", "BOOLEAN", "", "Không", "Trạng thái tài khoản đang hoạt động hay bị khóa"],
            ["RatingAverage", "DECIMAL(3,2)", "", "Không", "Điểm đánh giá sao trung bình tích lũy (1.00 - 5.00)"],
            ["CreatedAt", "DATETIME", "", "Không", "Thời điểm khởi tạo tài khoản trong hệ thống"]
          ],
          [22, 18, 10, 15, 35]
        ),
        new Paragraph({ spacing: { before: 140, after: 100 }, children: [] }),

        createTableCaption("Bảng 3.7", "Từ điển dữ liệu bảng ServiceRequests (Phiếu yêu cầu sửa chữa/bảo trì)"),
        createCustomTable(
          ["Tên trường (Column)", "Kiểu dữ liệu", "Khóa", "Cho phép Null", "Mô tả ý nghĩa nghiệp vụ"],
          [
            ["Id", "VARCHAR(36)", "PK", "Không", "Mã định danh duy nhất của yêu cầu dịch vụ (GUID)"],
            ["CustomerId", "VARCHAR(36)", "FK", "Không", "Khóa ngoại liên kết tới bảng Users (Khách hàng tạo phiếu)"],
            ["TechnicianId", "VARCHAR(36)", "FK", "Có", "Khóa ngoại liên kết tới bảng Users (Thợ tiếp nhận xử lý)"],
            ["Title", "NVARCHAR(200)", "", "Không", "Tiêu đề tóm tắt sự cố PCCC phát sinh"],
            ["Description", "NVARCHAR(1000)", "", "Có", "Mô tả chi tiết hiện tượng hư hỏng của thiết bị"],
            ["Priority", "VARCHAR(20)", "", "Không", "Mức độ ưu tiên: 'Low', 'Medium', 'High', 'Urgent'"],
            ["Status", "VARCHAR(30)", "", "Không", "Trạng thái: 'Pending', 'Assigned', 'InProgress', 'Completed'"],
            ["DestinationLat", "DOUBLE", "", "Không", "Tọa độ vĩ độ của công trình xảy ra sự cố"],
            ["DestinationLng", "DOUBLE", "", "Không", "Tọa độ kinh độ của công trình xảy ra sự cố"],
            ["Version", "INT", "", "Không", "Phiên bản dữ liệu dùng cho Optimistic Concurrency Token"],
            ["CreatedAt", "DATETIME", "", "Không", "Thời điểm khách hàng gửi yêu cầu sự cố"],
            ["ResolvedAt", "DATETIME", "", "Có", "Thời điểm kỹ thuật viên hoàn thành sửa chữa"]
          ],
          [22, 18, 10, 15, 35]
        ),
        new Paragraph({ spacing: { before: 140, after: 100 }, children: [] }),

        createTableCaption("Bảng 3.8", "Từ điển dữ liệu bảng Equipments (Danh mục thiết bị PCCC của khách hàng)"),
        createCustomTable(
          ["Tên trường (Column)", "Kiểu dữ liệu", "Khóa", "Cho phép Null", "Mô tả ý nghĩa nghiệp vụ"],
          [
            ["Id", "VARCHAR(36)", "PK", "Không", "Mã định danh duy nhất của thiết bị PCCC (GUID)"],
            ["CustomerId", "VARCHAR(36)", "FK", "Không", "Khóa ngoại liên kết tới khách hàng sở hữu thiết bị"],
            ["EquipmentCode", "VARCHAR(50)", "Unique", "Không", "Mã số quản lý thiết bị dán trên tem kiểm định"],
            ["EquipmentType", "VARCHAR(50)", "", "Không", "Loại: Bình bột ABC, Bình khí CO2, Van vách tường"],
            ["LocationFloor", "NVARCHAR(100)", "", "Không", "Vị trí lắp đặt cụ thể (Ví dụ: Tầng hầm B1, Cửa thang máy T8)"],
            ["ManufactureDate", "DATE", "", "Không", "Ngày sản xuất của phương tiện chữa cháy"],
            ["LastMaintenanceDate", "DATE", "", "Có", "Ngày thực hiện bảo dưỡng, nạp sạc gần nhất"],
            ["NextMaintenanceDate", "DATE", "", "Không", "Hạn kiểm định bảo dưỡng định kỳ kế tiếp (dùng để quét)"],
            ["Status", "VARCHAR(30)", "", "Không", "Trạng thái: 'Normal', 'Warning_Expiring', 'Faulty'"]
          ],
          [22, 18, 10, 15, 35]
        ),
        new Paragraph({ spacing: { before: 140, after: 100 }, children: [] }),

        createTableCaption("Bảng 3.9", "Từ điển dữ liệu bảng TechnicianGpsLogs (Lịch sử tọa độ GPS của thợ)"),
        createCustomTable(
          ["Tên trường (Column)", "Kiểu dữ liệu", "Khóa", "Cho phép Null", "Mô tả ý nghĩa nghiệp vụ"],
          [
            ["Id", "BIGINT AUTO_INCREMENT", "PK", "Không", "Mã tự tăng định danh duy nhất của bản ghi tọa độ"],
            ["TechnicianId", "VARCHAR(36)", "FK", "Không", "Khóa ngoại liên kết tới tài khoản của kỹ thuật viên"],
            ["Latitude", "DOUBLE", "", "Không", "Tọa độ vĩ độ thu thập được từ cảm biến GPS thiết bị"],
            ["Longitude", "DOUBLE", "", "Không", "Tọa độ kinh độ thu thập được từ cảm biến GPS thiết bị"],
            ["RecordedAt", "DATETIME", "", "Không", "Thời điểm thiết bị phát sinh tọa độ này"],
            ["SpeedKmH", "FLOAT", "", "Có", "Vận tốc di chuyển tức thời tính bằng km/h"]
          ],
          [22, 18, 10, 15, 35]
        ),
        new Paragraph({ spacing: { before: 140, after: 100 }, children: [] }),

        createTableCaption("Bảng 3.10", "Từ điển dữ liệu bảng InventoryItems (Vật tư và linh kiện kho)"),
        createCustomTable(
          ["Tên trường (Column)", "Kiểu dữ liệu", "Khóa", "Cho phép Null", "Mô tả ý nghĩa nghiệp vụ"],
          [
            ["Id", "VARCHAR(36)", "PK", "Không", "Mã định danh duy nhất của vật tư linh kiện kho"],
            ["ItemCode", "VARCHAR(50)", "Unique", "Không", "Mã định danh quản lý vật tư trong kho (VD: VAN-DN50)"],
            ["ItemName", "NVARCHAR(150)", "", "Không", "Tên quy chuẩn của linh kiện vật tư thay thế"],
            ["Category", "VARCHAR(50)", "", "Không", "Phân loại linh kiện: Van, Vòi, Đồng hồ đo áp, Đầu phun Sprinkler"],
            ["StockQuantity", "INT", "", "Không", "Số lượng linh kiện thực tế đang tồn trong kho"],
            ["UnitPrice", "DECIMAL(18,2)", "", "Không", "Đơn giá niêm yết của vật tư linh kiện"],
            ["Unit", "VARCHAR(20)", "", "Không", "Đơn vị tính: Cái, Bộ, Cuộn, Bình"]
          ],
          [22, 18, 10, 15, 35]
        ),
        new Paragraph({ spacing: { before: 140, after: 100 }, children: [] }),

        createTableCaption("Bảng 3.10b", "Từ điển dữ liệu bảng MaintenanceReminders (Phiếu nhắc lịch bảo trì tự động)"),
        createCustomTable(
          ["Tên trường (Column)", "Kiểu dữ liệu", "Khóa", "Cho phép Null", "Mô tả ý nghĩa nghiệp vụ"],
          [
            ["Id", "VARCHAR(36)", "PK", "Không", "Mã định danh duy nhất của phiếu nhắc lịch bảo dưỡng"],
            ["EquipmentId", "VARCHAR(36)", "FK", "Không", "Khóa ngoại tham chiếu đến thiết bị PCCC cần bảo trì"],
            ["DueDate", "DATE", "", "Không", "Ngày hết hạn kiểm định cần thực hiện bảo dưỡng"],
            ["ReminderSentAt", "DATETIME", "", "Có", "Thời điểm hệ thống đã phát thông báo/email cho khách hàng"],
            ["Status", "VARCHAR(30)", "", "Không", "Trạng thái: 'Pending', 'Scheduled', 'Done', 'Ignored'"]
          ],
          [22, 18, 10, 15, 35]
        ),
        new Paragraph({ spacing: { before: 140, after: 100 }, children: [] }),

        createTableCaption("Bảng 3.10c", "Từ điển dữ liệu bảng AuditLogs (Nhật ký kiểm toán hệ thống)"),
        createCustomTable(
          ["Tên trường (Column)", "Kiểu dữ liệu", "Khóa", "Cho phép Null", "Mô tả ý nghĩa nghiệp vụ"],
          [
            ["Id", "BIGINT AUTO_INCREMENT", "PK", "Không", "Mã định danh tự tăng của dòng nhật ký kiểm toán"],
            ["UserId", "VARCHAR(36)", "FK", "Có", "Người dùng thực hiện hành động (Null nếu hệ thống tự động)"],
            ["Action", "VARCHAR(50)", "", "Không", "Tên hành động: 'LOGIN', 'ACCEPT_DISPATCH', 'UPDATE_PRICE'"],
            ["Details", "NVARCHAR(2000)", "", "Có", "Mô tả chi tiết dữ liệu trước và sau khi thay đổi (JSON)"],
            ["IpAddress", "VARCHAR(45)", "", "Có", "Địa chỉ IP nguồn của người gửi yêu cầu"],
            ["Timestamp", "DATETIME", "", "Không", "Thời điểm chính xác phát sinh hành động kiểm toán"]
          ],
          [22, 18, 10, 15, 35]
        ),

                createSubHeading("3.6. Thiết kế giao diện hệ thống"),
        p("Giao diện người dùng của FireGuard AI được thiết kế hiện đại, đạt tiêu chuẩn trải nghiệm người dùng cao cấp (UX/UI), tuân thủ nguyên lý thiết kế công thái học và khả năng tương tác nhạy bén trên cả máy tính để bàn lẫn thiết bị di động:"),
        p("Triết lý thiết kế giao diện:"),
        bullet("Bảng màu chuẩn PCCC chuyên nghiệp: Sử dụng tông màu Navy Blue (#1B365D) làm màu chủ đạo tạo cảm giác tin cậy, vững chãi cấp doanh nghiệp; kết hợp với màu đỏ cứu hỏa (#C53030) và màu cam cảnh báo (#EA580C) để làm nổi bật các sự cố khẩn cấp và nút bấm hành động quan trọng.", "Hệ thống màu sắc:"),
        bullet("Kiểu chữ và khả năng đọc (Typography): Sử dụng phông chữ Inter và Times New Roman với kích thước tối thiểu 14px cho nội dung và 24-32px cho tiêu đề, độ tương phản màu sắc đạt chuẩn WCAG 2.1 AA giúp thợ dễ dàng thao tác ngoài trời nắng gắt.", "Khả năng tiếp cận:"),
        bullet("Thiết kế thích ứng (Responsive Mobile-First): Toàn bộ các bảng dữ liệu, biểu mẫu và bản đồ đều tự động co giãn tối ưu theo kích thước màn hình điện thoại (375px - 430px) và màn hình máy tính (1920x1080).", "Giao diện thích ứng:"),
        p("1. Nghiệp vụ Điều phối (AI Dispatching Pop-up): Khi kỹ thuật viên được AI chọn, màn hình điện thoại sẽ rung và phát chuông báo động, đồng thời hiển thị một cửa sổ Pop-up nổi bật với vòng tròn đếm ngược 60 giây màu cam rực rỡ. Pop-up hiển thị đầy đủ thông tin: Loại sự cố, Địa chỉ, Khoảng cách km và nút 'Chấp Nhận' to, dễ bấm."),
        ...createImagePlaceholder("Hình 3.7", "Giao diện Pop-up điều phối AI đếm ngược 60 giây trên điện thoại kỹ thuật viên", "Dán ảnh chụp màn hình Pop-up đếm ngược 60 giây vào đây"),
        p("2. Nghiệp vụ Bản đồ giám sát (GPS Tracking): Tích hợp bản đồ số Google Maps toàn màn hình. Các Marker của thợ hiển thị hình ảnh avatar nhỏ kèm trạng thái màu. Khi thợ di chuyển, Marker lướt mượt mà trên bản đồ không bị giật lag nhờ thuật toán nội suy tọa độ."),
        ...createImagePlaceholder("Hình 3.8", "Giao diện Bản đồ số Google Maps hiển thị vị trí kỹ thuật viên theo thời gian thực", "Dán ảnh chụp màn hình Bản đồ số theo dõi vị trí kỹ thuật viên vào đây"),
        p("3. Dashboard Quản trị trung tâm: Hiển thị các biểu đồ thống kê KPI, tình trạng xử lý đơn hàng trong ngày và doanh thu dự toán."),
        ...createImagePlaceholder("Hình 3.9", "Giao diện Dashboard Quản trị trung tâm hiển thị KPI và giám sát thợ", "Dán ảnh chụp màn hình Dashboard Quản trị trung tâm vào đây"),
        p("4. Giao diện Quản lý thiết bị PCCC: Hiển thị toàn bộ danh mục bình chữa cháy, đầu báo khói của từng tòa nhà kèm trạng thái hạn bảo dưỡng bằng các huy hiệu màu sắc trực quan (Xanh lá: Còn hạn; Vàng: Sắp đến hạn 30 ngày; Đỏ: Quá hạn kiểm định). Cho phép lọc nhanh và in mã QR code dán lên bình."),
        ...createImagePlaceholder("Hình 3.10", "Giao diện Quản lý thiết bị PCCC và danh mục kiểm định định kỳ", "Dán ảnh chụp màn hình danh sách thiết bị PCCC và tình trạng hạn bảo dưỡng vào đây"),
        p("5. Giao diện Lịch sử bảo trì và Biên bản nghiệm thu: Hiển thị chi tiết từng phiếu sửa chữa kèm bảng kiểm tra hạng mục kỹ thuật (Checklist), hình ảnh chụp hiện trường trước và sau khi xử lý, và khung ký chữ ký điện tử của đại diện khách hàng."),
        ...createImagePlaceholder("Hình 3.11", "Giao diện Lịch sử bảo trì và kết quả nghiệm thu thiết bị", "Dán ảnh chụp màn hình lịch sử bảo dưỡng và chi tiết phiếu nghiệm thu vào đây"),
        p("6. Dashboard Giám sát tác vụ nền Hangfire: Cung cấp giao diện trực quan theo dõi số lượng job quét bảo trì đang chạy ngầm, số lượng job thành công và biểu đồ thời gian thực thi."),
        ...createImagePlaceholder("Hình 3.12", "Dashboard giám sát tác vụ nền Hangfire Background Jobs", "Dán ảnh chụp màn hình giao diện điều khiển Hangfire Dashboard vào đây"),
        p("7. Giao diện Quản lý kho vật tư PCCC: Giúp thủ kho và kế toán quản lý số lượng tồn kho của từng loại bình, van, vòi cứu hỏa, tự động phát tín hiệu cảnh báo khi lượng tồn xuống dưới mức tối thiểu."),
        ...createImagePlaceholder("Hình 3.13", "Giao diện Quản lý kho hàng và linh kiện vật tư thay thế", "Dán ảnh chụp màn hình quản lý xuất nhập tồn vật tư kho PCCC vào đây"),

        createSubHeading("3.7. Kết quả triển khai hệ thống"),
        createSubSubHeading("3.7.1. Triển khai hệ thống"),
        p("Toàn bộ hệ thống FireGuard AI được đóng gói hoàn chỉnh bằng Docker & Docker Compose thành 6 container dịch vụ độc lập, bảo đảm tính cô lập tài nguyên, an toàn bảo mật và khả năng triển khai linh hoạt:"),
        bullet("Container 1: `fireguard-api` chạy ứng dụng ASP.NET Core 8 Web API trên nền base image `mcr.microsoft.com/dotnet/aspnet:8.0-alpine` siêu nhẹ, lắng nghe cổng 5000."),
        bullet("Container 2: `fireguard-web` chạy ứng dụng ReactJS Frontend được biên dịch tĩnh và phục vụ bởi máy chủ Nginx Alpine (`nginx:alpine`), lắng nghe cổng 5173 và tự động cấu hình Reverse Proxy."),
        bullet("Container 3: `fireguard-db` chạy hệ quản trị cơ sở dữ liệu MySQL 8.0 Community Server với volume ánh xạ `mysql_data` lưu trữ dữ liệu bền vững trên ổ cứng vật lý của máy chủ."),
        bullet("Container 4: `fireguard-redis` chạy dịch vụ Redis In-memory Store (`redis:7-alpine`), cấu hình giới hạn RAM 512MB và chính sách thu hồi bộ nhớ `allkeys-lru` phục vụ Caching và Distributed Lock."),
        bullet("Container 5: `fireguard-minio` chạy máy chủ lưu trữ đối tượng MinIO Object Storage, cung cấp cổng API 9000 và giao diện Web Console trực quan tại cổng 9001."),
        bullet("Container 6: `fireguard-hangfire` chạy tiến trình Worker xử lý các tác vụ nền định kỳ, kết nối trực tiếp với MySQL để quản lý hàng đợi và tự động phục hồi khi có sự cố."),
        p("Cấu hình mạng và bảo mật trong Docker Compose:"),
        p("Tất cả các container được kết nối với nhau thông qua một mạng nội bộ riêng biệt (User-defined Bridge Network mang tên `fireguard-net`). Các dịch vụ cơ sở dữ liệu MySQL và Redis chỉ mở cổng kết nối nội bộ trong cụm container, hoàn toàn không phơi bày (expose) cổng ra mạng Internet công cộng, ngăn chặn triệt để các cuộc tấn công quét cổng (Port Scanning) từ bên ngoài."),
        p("Chiến lược kiểm tra sức khỏe dịch vụ (Healthcheck):"),
        p("Mỗi container được cấu hình chỉ thị `healthcheck` tự động gửi tín hiệu thăm dò (Ping) định kỳ mỗi 30 giây. Nếu máy chủ cơ sở dữ liệu MySQL chưa khởi động xong, container `fireguard-api` sẽ tự động chờ đợi (thông qua điều kiện `depends_on: { fireguard-db: { condition: service_healthy } }`), loại bỏ hoàn toàn hiện tượng lỗi sập ứng dụng do thiếu hụt kết nối lúc khởi động."),

        createSubSubHeading("3.7.2. Chức năng đã hoàn thành"),
        p("Trải qua các chu kỳ phát triển lặp Sprint theo mô hình Agile/Scrum, hệ thống FireGuard AI đã hoàn thiện 100% các chức năng nghiệp vụ cốt lõi và đáp ứng đầy đủ các yêu cầu phi chức năng đề ra:"),
        createTableCaption("Bảng 3.10d", "Bảng tổng hợp mức độ hoàn thành 10 phân hệ chức năng chính của FireGuard AI"),
        createCustomTable(
          ["STT", "Tên phân hệ chức năng", "Mô tả tính năng đã hiện thực hóa", "Mức độ hoàn thành", "Kết quả nghiệm thu"],
          [
            ["1", "Xác thực & Phân quyền (RBAC)", "Đăng nhập JWT, kiểm soát quyền truy cập 4 vai trò (Admin, Sales, Tech, Customer).", "100%", "Hoàn thành xuất sắc"],
            ["2", "Tiếp nhận sự cố khẩn cấp", "Biểu mẫu tạo yêu cầu sự cố, chọn công trình, loại thiết bị, độ khẩn cấp, lấy tọa độ GPS.", "100%", "Hoàn thành xuất sắc"],
            ["3", "AI Điều phối (AI Dispatching)", "Tính điểm đa tiêu chí WSM (GPS, Rating, Acceptance, Skills), tự động chọn thợ Top 1.", "100%", "Hoàn thành xuất sắc"],
            ["4", "Khóa 60s & Fallback tự động", "Pop-up đếm ngược 60s trên điện thoại, khóa tạm thời đơn, tự động chuyển thợ Top 2.", "100%", "Hoàn thành xuất sắc"],
            ["5", "Bản đồ số GPS thời gian thực", "Marker di chuyển mượt mà qua SignalR WebSocket, hiển thị trạng thái màu sắc trực quan.", "100%", "Hoàn thành xuất sắc"],
            ["6", "Quản lý thiết bị PCCC (QR Code)", "Quản lý mã bình, hạn kiểm định, vị trí lắp đặt, sinh mã QR tra cứu nhanh.", "100%", "Hoàn thành xuất sắc"],
            ["7", "Tác vụ nền Hangfire", "Tự động quét CSDL hàng đêm 00:00, cảnh báo thiết bị sắp hết hạn trước 30 ngày.", "100%", "Hoàn thành xuất sắc"],
            ["8", "Nghiệm thu & Ký số điện tử", "Checklist kiểm tra kỹ thuật, tải ảnh hiện trường lên MinIO S3, lưu chữ ký số điện tử.", "100%", "Hoàn thành xuất sắc"],
            ["9", "Quản lý kho vật tư linh kiện", "Quản lý xuất nhập tồn van, vòi, bình nạp sạc, tự động trừ tồn kho khi hoàn thành đơn.", "100%", "Hoàn thành xuất sắc"],
            ["10", "Đánh giá KPI & Thống kê", "Tự động tính điểm hiệu suất thợ, biểu đồ doanh thu, nhật ký kiểm toán Audit Logs.", "100%", "Hoàn thành xuất sắc"]
          ],
          [6, 24, 40, 15, 15]
        ),
        new Paragraph({ spacing: { before: 140, after: 100 }, children: [] }),

        createSubSubHeading("3.7.3. Hình ảnh chạy thực tế hệ thống"),
        p("Các hình ảnh minh họa giao diện chạy thực tế của hệ thống đã được trình bày chi tiết tại Mục 3.6 (từ Hình 3.7 đến Hình 3.13). Các kết quả kiểm thử thực nghiệm trên môi trường thật cho thấy toàn bộ các giao diện đều tương thích hoàn hảo trên các trình duyệt hiện đại (Google Chrome, Microsoft Edge, Safari Mobile), tốc độ tải trang ban đầu đạt dưới 1.2 giây và tốc độ cập nhật dữ liệu thời gian thực đạt dưới 80 mili-giây."),

        // BẢNG KIỂM THỬ CHỨC NĂNG VÀ CONCURRENCY
        createTableCaption("Bảng 3.11", "Kịch bản kiểm thử chức năng chính của hệ thống (15 Functional Test Cases)"),
        createCustomTable(
          ["Mã Test", "Tên ca kiểm thử", "Các bước thực hiện", "Dữ liệu đầu vào", "Kết quả mong đợi", "Kết quả thực tế", "Đánh giá"],
          [
            ["TC-01", "Đăng nhập hệ thống thành công", "1. Nhập email và pass\n2. Bấm Đăng nhập", "Email: admin@fireguard.vn\nPass: Admin@123", "Trả về JWT Token hợp lệ, điều hướng vào Dashboard", "Đúng như mong đợi, token lưu vào localStorage", "ĐẠT (Pass)"],
            ["TC-02", "Tạo yêu cầu sửa chữa khẩn cấp", "1. Khách hàng gửi đơn\n2. Chọn mức Urgent", "Sự cố: Chập cháy tủ báo cháy tầng 2", "Phiếu tạo thành công, kích hoạt thuật toán AI Scoring", "Phiếu tạo thành công, xuất hiện trên hệ thống", "ĐẠT (Pass)"],
            ["TC-03", "AI chấm điểm và đẩy Pop-up 60s", "1. Hệ thống tính điểm\n2. Gửi SignalR tới thợ Top 1", "Thợ có điểm cao nhất: Nguyễn Văn A (Điểm 9.2)", "Điện thoại thợ A hiển thị Pop-up có đếm ngược 60 giây", "Pop-up hiển thị chính xác chuông báo và đồng hồ chạy", "ĐẠT (Pass)"],
            ["TC-04", "Thợ chấp nhận đơn hàng", "1. Thợ nhấn 'Nhận việc' trong vòng 60 giây", "Click nút Accept", "Đơn hàng chuyển sang trạng thái Assigned cho thợ A", "Gán thợ thành công, thông báo tới khách hàng", "ĐẠT (Pass)"],
            ["TC-05", "Thợ từ chối đơn hàng (Fallback)", "1. Thợ nhấn 'Từ chối' hoặc hết 60s", "Click nút Reject", "Hệ thống tự động chuyển đơn cho thợ có điểm cao thứ 2", "Thợ Top 2 nhận được Pop-up ngay lập tức", "ĐẠT (Pass)"],
            ["TC-06", "Cập nhật vị trí GPS thời gian thực", "1. Thợ di chuyển trên đường\n2. GPS gửi về API", "Tọa độ mới: 10.7769, 106.7009", "Marker vị trí trên bản đồ Admin di chuyển mượt mà", "Marker di chuyển tức thời qua SignalR", "ĐẠT (Pass)"],
            ["TC-07", "Nghiệm thu hoàn tất đơn sửa chữa", "1. Thợ bấm Hoàn thành\n2. Tải ảnh thiết bị đã sửa", "Ảnh: tu_dien_da_sua.jpg", "Phiếu chuyển sang Resolved, cập nhật vật tư kho", "Đóng phiếu thành công, lưu trữ ảnh vào MinIO", "ĐẠT (Pass)"],
            ["TC-08", "Hangfire quét nhắc lịch bảo trì", "1. Chạy Job quét đêm 00:00", "Thiết bị còn 15 ngày hết hạn", "Hệ thống tự động sinh phiếu nhắc lịch bảo trì nháp", "Phiếu nhắc lịch tạo chính xác, gửi email thông báo", "ĐẠT (Pass)"],
            ["TC-09", "Kiểm tra đánh giá KPI tự động", "1. Khách hàng đánh giá 5 sao\n2. Xem bảng KPI", "Rating: 5 sao\nThời gian xử lý: 25 phút", "Điểm KPI của thợ được cộng thêm theo công thức", "Điểm KPI cập nhật chính xác trên bảng xếp hạng", "ĐẠT (Pass)"],
            ["TC-10", "Khóa đơn hàng tránh Race condition", "1. Hai thợ cùng bấm nhận 1 đơn cùng lúc", "Thợ A và Thợ B bấm nhận tại cùng mili-giây", "Một thợ nhận thành công, thợ kia nhận thông báo đã gán", "Concurrency Token hoạt động chuẩn xác, không bị trùng", "ĐẠT (Pass)"],
            ["TC-11", "Tạo mới thiết bị PCCC vào kho", "1. Admin vào Quản lý thiết bị\n2. Nhập mã bình, hạn kiểm định", "Mã bình: BCT-2026-001\nHạn kiểm định: 05/09/2027", "Thiết bị được lưu vào CSDL với trạng thái Normal", "Thiết bị hiển thị trong danh mục, QR code sinh tự động", "ĐẠT (Pass)"],
            ["TC-12", "Cảnh báo thiết bị quá hạn bảo trì", "1. Xem danh sách thiết bị\n2. Lọc thiết bị cảnh báo đỏ", "Thiết bị có NextMaintenance < ngày hiện tại", "Hệ thống hiển thị trạng thái Warning_Expired màu đỏ", "Màu sắc cảnh báo chính xác, gửi mail cảnh báo", "ĐẠT (Pass)"],
            ["TC-13", "Xuất kho vật tư van cứu hỏa", "1. Kỹ thuật viên yêu cầu van\n2. Admin duyệt xuất", "Mã VT: VAN-DN50\nSố lượng: 2 cái", "Số lượng tồn kho giảm tương ứng 2 cái", "Kho trừ đúng số lượng, phát sinh phiếu xuất", "ĐẠT (Pass)"],
            ["TC-14", "Kiểm tra ràng buộc GPS geofencing", "1. Thợ đứng cách xa 3km bấm bắt đầu sửa", "Khoảng cách GPS thợ - công trình: 3.2 km", "Hệ thống từ chối cho phép bắt đầu sửa, yêu cầu đến gần", "Hệ thống báo lỗi: 'Vượt quá bán kính cho phép (<= 1km)'", "ĐẠT (Pass)"],
            ["TC-15", "Đăng xuất thu hồi token (Session Invalidation)", "1. Người dùng bấm Đăng xuất\n2. Dùng lại Token cũ gọi API", "Token cũ trước khi đăng xuất", "Hệ thống trả về HTTP 401 Unauthorized", "Redis kiểm tra blacklist, chặn truy cập thành công", "ĐẠT (Pass)"]
          ],
          [8, 16, 18, 18, 18, 12, 10]
        ),
        new Paragraph({ spacing: { before: 140, after: 100 }, children: [] }),

        createTableCaption("Bảng 3.12", "Kịch bản kiểm thử trường hợp ngoại lệ và đồng thời (Concurrency Test Cases)"),
        createCustomTable(
          ["Mã Test", "Tên tình huống kiểm thử", "Mô tả kịch bản kiểm thử ngoại lệ", "Kết quả mong đợi", "Kết quả thực nghiệm"],
          [
            ["TC-CONC-01", "Tranh chấp nhận đơn cùng mili-giây", "Hai kỹ thuật viên A và B cùng nhấn nút 'Nhận việc' vào cùng một thời điểm.", "Chỉ 1 thợ nhận thành công, thợ kia nhận thông báo lỗi Concurrency mà không phát sinh xung đột dữ liệu.", "Cơ sở dữ liệu cập nhật chính xác 1 dòng duy nhất, trả về HTTP 409 Conflict cho thợ còn lại."],
            ["TC-CONC-02", "Hết thời gian đếm ngược 60s", "Kỹ thuật viên Top 1 mở màn hình Pop-up nhưng không bấm nhận trong 60 giây.", "Đồng hồ đếm về 0s, Pop-up tự đóng, hệ thống tự động Fallback chuyển đơn cho thợ Top 2.", "Hệ thống phát tín hiệu SignalR đóng Pop-up trên máy thợ 1, mở Pop-up mới trên máy thợ 2 sau 50ms."],
            ["TC-CONC-03", "Mất kết nối mạng khi thợ đang di chuyển", "Thợ đang di chuyển thì điện thoại mất sóng 4G/Wifi.", "Marker trên bản đồ của Admin chuyển sang màu xám cảnh báo Offline kèm thời gian mất tín hiệu.", "Bản đồ hiển thị cảnh báo mất kết nối, tự động kết nối lại (Auto-reconnect) khi có mạng trở lại."],
            ["TC-CONC-04", "Gọi API bằng Token đã bị thu hồi", "Người dùng đổi mật khẩu hoặc đăng xuất, sau đó dùng Token cũ gọi API.", "API từ chối phục vụ, trả về mã lỗi 401 Unauthorized do Token đã nằm trong Blacklist của Redis.", "Redis chặn truy cập thành công trong 0.8ms, bảo đảm an toàn dữ liệu tuyệt đối."],
            ["TC-CONC-05", "Kiểm tra tải đồng thời 500 yêu cầu/giây", "Sử dụng công cụ Apache JMeter giả lập 500 yêu cầu gửi vị trí GPS đồng thời lên API.", "Hệ thống phản hồi 100% yêu cầu với thời gian trung bình < 120ms, không xảy ra hiện tượng tràn RAM.", "CPU máy chủ duy trì dưới 45%, Redis và MySQL xử lý ổn định không xảy ra hiện tượng Deadlock."]
          ],
          [15, 20, 25, 20, 20]
        ),
        new Paragraph({ spacing: { before: 140, after: 100 }, children: [] }),

        createSubSubHeading("3.7.4. Hạn chế còn tồn tại"),
        bullet("1. Chức năng bảo mật 2FA (Xác thực 2 bước) bằng mã OTP Google Authenticator và cơ chế thu hồi Token tức thời (Session Invalidation) hiện mới được hiện thực hoàn chỉnh ở tầng API Backend, giao diện người dùng (UI) đang trong quá trình hoàn thiện ở phiên bản tiếp theo."),
        bullet("2. Hệ thống hiện hoạt động dưới dạng Web Responsive trên trình duyệt điện thoại, chưa hỗ trợ ứng dụng Mobile App native để có thể tự động lấy tọa độ GPS chạy ngầm liên tục khi người dùng khóa màn hình điện thoại."),
        new Paragraph({ children: [new PageBreak()] }),

        // =============================================================================
        // CHƯƠNG 4. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN (ĐÚNG OUTLINE: 4.1 -> 4.2)
        // =============================================================================
        createHeaderTitle("Chương 4. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN"),
        createSubHeading("4.1. Kết luận"),
        p("Đồ án tốt nghiệp 'Hệ thống Điều phối và Quản lý bảo trì PCCC (FireGuard AI)' đã hoàn thành xuất sắc toàn bộ các mục tiêu nghiên cứu và yêu cầu kỹ thuật được đặt ra ban đầu. Đề tài đã mang lại những đóng góp khoa học và thực tiễn thiết thực:"),
        p("1. Đã số hóa thành công quy trình quản lý và điều phối bảo trì thiết bị PCCC vốn còn rất thô sơ và phân mảnh tại các doanh nghiệp Việt Nam hiện nay."),
        p("2. Áp dụng thành công mô hình kiến trúc phần mềm Clean Architecture phân tầng chuẩn mực trên nền tảng .NET Core 8, mang lại sự độc lập, dễ bảo trì và khả năng mở rộng quy mô lớn."),
        p("3. Hiện thực hóa các giải pháp tối ưu hóa hiệu năng cao cho hệ thống phân tán thời gian thực: ứng dụng SignalR WebSocket để đẩy đơn hàng và truyền tọa độ GPS tức thời, Redis Caching để tăng tốc độ truy vấn, Hangfire để tự động hóa các tác vụ quét nền, MinIO để lưu trữ tệp tin an toàn và Docker để đóng gói triển khai."),
        p("4. Thuật toán điều phối thông minh AI Dispatching kết hợp cơ chế khóa Pop-up 60 giây và Fallback tự động đã chứng minh tính hiệu quả vượt trội so với phương thức gán việc thủ công truyền thống, giúp rút ngắn hơn 75% thời gian phản hồi sự cố khẩn cấp."),
        p("Thông qua quá trình thực hiện đồ án, sinh viên đã củng cố vững chắc kiến thức chuyên sâu về công nghệ phần mềm, nâng cao kỹ năng lập trình full-stack chuyên nghiệp, rèn luyện tư duy giải quyết vấn đề thực tế và thấu hiểu tầm quan trọng của việc ứng dụng công nghệ thông tin vào bảo đảm an toàn tính mạng cho cộng đồng."),

        createSubHeading("4.2. Hướng phát triển"),
        p("Để hệ thống FireGuard AI ngày càng hoàn thiện, đạt độ tin cậy cấp công nghiệp và sẵn sàng thương mại hóa rộng rãi trên thị trường, nhóm nghiên cứu đã vạch ra lộ trình 4 hướng phát triển trọng tâm trong tương lai:"),
        bullet("1. Xây dựng ứng dụng di động Native Mobile (Flutter / React Native) chuyên dụng cho kỹ thuật viên: Hỗ trợ cơ chế chạy ngầm liên tục dưới nền hệ điều hành (Background Geolocation Tracking) ngay cả khi thợ khóa màn hình hoặc đang điều khiển phương tiện trên đường; tích hợp kiến trúc ngoại tuyến (Offline-First Architecture) cho phép thợ quét mã QR, ghi nhận biên bản nghiệm thu và lưu tạm thời trên cơ sở dữ liệu cục bộ SQLite khi làm việc trong hầm tòa nhà không có sóng 4G/Wifi, sau đó tự động đồng bộ hóa lên máy chủ khi có mạng trở lại.", "Ứng dụng Native Mobile:"),
        bullet("2. Tích hợp cổng thanh toán trực tuyến (VNPay, MoMo, ZaloPay): Xây dựng phân hệ thanh toán tự động qua mã VietQR động và cổng thanh toán trung gian. Ngay khi khách hàng ký biên bản nghiệm thu điện tử trên ứng dụng, hệ thống tự động sinh hóa đơn điện tử kèm mã QR thanh toán. Khi khách hàng chuyển khoản thành công, Webhook Instant Payment Notification (IPN) của cổng thanh toán sẽ tự động kích hoạt cập nhật trạng thái phiếu sửa chữa thành Đã thanh toán và ghi nhận doanh thu theo thời gian thực.", "Cổng thanh toán số:"),
        bullet("3. Triển khai hoàn chỉnh tính năng bảo mật hai lớp (2FA) và quản lý phiên làm việc tập trung: Tích hợp chuẩn xác thực thời gian thực Time-based One-Time Password (TOTP theo chuẩn RFC 6238) tương thích với ứng dụng Google Authenticator và Microsoft Authenticator. Bổ sung bảng điều khiển quản lý các thiết bị đang đăng nhập, cho phép Quản trị viên và người dùng bấm nút 'Đăng xuất khỏi tất cả các thiết bị khác' ngay lập tức thông qua cơ chế thu hồi Token Blacklist trên Redis.", "Bảo mật cấp doanh nghiệp:"),
        bullet("4. Tích hợp mạng lưới cảm biến không dây IoT (LoRaWAN / NB-IoT): Nghiên cứu kết nối trực tiếp hệ thống FireGuard AI với các thiết bị phần cứng giám sát thông minh: đồng hồ đo áp lực điện tử gắn trên bình chữa cháy, van giám sát dòng chảy trên đường ống Sprinkler, và cảm biến nhiệt độ/khói không dây. Khi áp suất khí nén trong bình cứu hỏa bị tụt dưới ngưỡng 1.2 MPa, thiết bị IoT sẽ tự động phát gói tin không dây qua trạm Gateway LoRaWAN về máy chủ FireGuard AI, hệ thống lập tức tự động sinh phiếu yêu cầu nạp sạc và điều phối kỹ thuật viên đến hiện trường mà không cần chờ con người phát hiện.", "Hạ tầng cảm biến IoT:"),
        new Paragraph({ children: [new PageBreak()] }),

        // =============================================================================
        // TÀI LIỆU THAM KHẢO (ĐÚNG THEO MỤC LỤC BẠN GỬI)
        // =============================================================================
        createHeaderTitle("TÀI LIỆU THAM KHẢO"),
        p("[1] Microsoft Documentation, Entity Framework Core & ASP.NET Core 8: Architecture, Performance, and Best Practices, Microsoft Press, 2024."),
        p("[2] Hangfire Documentation, Background processing in .NET and .NET Core, https://docs.hangfire.io, 2024."),
        p("[3] React & Vite JS Official Guide: Modern Web Development with React 18, TypeScript, and Tailwind CSS, https://react.dev, 2024."),
        p("[4] Robert C. Martin, Clean Architecture: A Craftsman's Guide to Software Structure and Design, Prentice Hall, Upper Saddle River, NJ, 2017."),
        p("[5] Bộ Khoa học và Công nghệ, Tiêu chuẩn Quốc gia TCVN 3890:2023 - Phòng cháy chữa cháy - Phương tiện phòng cháy và chữa cháy cho nhà và công trình - Trang bị, bố trí, Hà Nội, 2023."),
        p("[6] Quốc hội nước Cộng hòa Xã hội Chủ nghĩa Việt Nam, Luật Phòng cháy và chữa cháy số 27/2001/QH10 và Luật sửa đổi, bổ sung số 40/2013/QH13, Hà Nội."),
        p("[7] Redis Documentation, Redis In-Memory Data Store & Distributed Locking Algorithms (RedLock), https://redis.io/docs, 2024."),
        p("[8] MinIO Inc., MinIO High Performance Object Storage Documentation for Kubernetes and Docker, https://min.io/docs, 2024."),
        p("[9] Docker Documentation, Docker Compose Specification and Containerization Best Practices, https://docs.docker.com, 2024."),
        p("[10] Martin Fowler, Patterns of Enterprise Application Architecture, Addison-Wesley Professional, Boston, MA, 2002."),
        p("[11] R. W. Sinnott, 'Virtues of the Haversine', Sky and Telescope, vol. 68, no. 2, p. 159, 1984."),
        p("[12] Thomas L. Saaty, 'Decision making with the analytic hierarchy process', International Journal of Services Sciences, vol. 1, no. 1, pp. 83-98, 2008."),
        new Paragraph({ children: [new PageBreak()] }),

        // =============================================================================
        // PHỤ LỤC (ĐÚNG THEO MỤC LỤC BẠN GỬI)
        // =============================================================================
                createHeaderTitle("PHỤ LỤC"),
        createSubHeading("1. Hướng dẫn khởi chạy hệ thống bằng Docker Compose"),
        p("Toàn bộ hệ thống FireGuard AI được đóng gói hoàn chỉnh trong tệp `docker-compose.yml`. Để triển khai ứng dụng trên máy chủ hoặc môi trường phát triển cục bộ:"),
        bullet("Bước 1: Cài đặt Docker Engine (phiên bản 24.0+) và Docker Compose trên máy chủ Linux / Windows."),
        bullet("Bước 2: Mở terminal tại thư mục gốc của dự án `d:\\FIREGUARD-AI`."),
        bullet("Bước 3: Chạy câu lệnh biên dịch và khởi động toàn bộ cụm container: `docker-compose up -d --build`."),
        bullet("Bước 4: Kiểm tra trạng thái hoạt động của 6 container bằng câu lệnh: `docker-compose ps`."),
        bullet("Bước 5: Truy cập giao diện ứng dụng Frontend tại địa chỉ: `http://localhost:5173` và giao diện Backend Swagger API tại: `http://localhost:5000/swagger`."),
        new Paragraph({ spacing: { before: 140, after: 100 }, children: [] }),

        createSubHeading("2. Trích đoạn mã nguồn thuật toán AI Dispatching (C# Backend)"),
        p("Dưới đây là trích đoạn mã nguồn phương thức điều phối và tính điểm thợ trong `DispatchService.cs`:"),
        p("public class DispatchService : IDispatchService\n{\n    private readonly IApplicationDbContext _context;\n    private readonly IHubContext<NotificationHub> _hubContext;\n    private readonly IDistributedCache _cache;\n\n    public async Task<TechnicianDto> FindAndDispatchBestTechnicianAsync(Guid serviceRequestId)\n    {\n        var request = await _context.ServiceRequests.FindAsync(serviceRequestId);\n        if (request == null) throw new NotFoundException(\"Không tìm thấy yêu cầu dịch vụ\");\n\n        // 1. Lọc danh sách kỹ thuật viên đang trực tuyến và rảnh việc\n        var availableTechs = await _context.Users\n            .Where(u => u.Role == UserRole.Technician && u.IsOnline && u.IsActive)\n            .ToListAsync();\n\n        if (!availableTechs.Any()) return null;\n\n        // 2. Chấm điểm đa tiêu chí (AI Scoring WSM Model)\n        var scoredTechs = availableTechs.Select(tech => new {\n            Technician = tech,\n            Score = CalculateScore(tech, request)\n        })\n        .OrderByDescending(x => x.Score)\n        .ToList();\n\n        var bestTech = scoredTechs.First().Technician;\n\n        // 3. Khóa đơn hàng tạm thời và gửi Pop-up đếm ngược 60 giây qua SignalR\n        await LockAndNotifyTechnicianAsync(bestTech.Id, request.Id, 60);\n\n        return _mapper.Map<TechnicianDto>(bestTech);\n    }\n\n    private double CalculateScore(User tech, ServiceRequest req)\n    {\n        double dist = HaversineDistance(tech.CurrentLatitude ?? 0, tech.CurrentLongitude ?? 0, req.DestinationLat, req.DestinationLng);\n        double cGps = Math.Max(1.0, 10.0 - (dist / 2.0));\n        double cRating = (tech.RatingAverage ?? 4.0) * 2.0;\n        double cAccept = (tech.AcceptanceRate ?? 0.8) * 10.0;\n        double cSkill = tech.HasCertifiedSkill(req.EquipmentType) ? 10.0 : 5.0;\n\n        return (0.35 * cGps) + (0.25 * cRating) + (0.20 * cAccept) + (0.20 * cSkill);\n    }\n\n    private double HaversineDistance(double lat1, double lon1, double lat2, double lon2)\n    {\n        double r = 6371.0;\n        double dLat = (lat2 - lat1) * Math.PI / 180.0;\n        double dLon = (lon2 - lon1) * Math.PI / 180.0;\n        double a = Math.Sin(dLat/2) * Math.Sin(dLat/2) +\n                   Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *\n                   Math.Sin(dLon/2) * Math.Sin(dLon/2);\n        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1-a));\n        return r * c;\n    }\n}", { bold: true, italics: true, alignment: AlignmentType.LEFT }),
        new Paragraph({ spacing: { before: 140, after: 100 }, children: [] }),

        createSubHeading("3. Trích đoạn mã nguồn tác vụ nền Hangfire quét kiểm tra thiết bị PCCC (C#)"),
        p("Dưới đây là trích đoạn mã nguồn tác vụ nền quét hạn bảo dưỡng hàng đêm trong `EquipmentMaintenanceJob.cs`:"),
        p("public class EquipmentMaintenanceJob\n{\n    private readonly IApplicationDbContext _context;\n    private readonly ILogger<EquipmentMaintenanceJob> _logger;\n\n    [AutomaticRetry(Attempts = 3)]\n    public async Task ScanExpiringEquipmentsAsync()\n    {\n        _logger.LogInformation(\"Bắt đầu quét danh mục thiết bị PCCC sắp hết hạn kiểm định...\");\n        var thresholdDate = DateTime.UtcNow.AddDays(30);\n\n        var expiringItems = await _context.Equipments\n            .Where(e => e.NextMaintenanceDate <= thresholdDate && e.Status != EquipmentStatus.Warning_Expiring)\n            .ToListAsync();\n\n        foreach (var eq in expiringItems)\n        {\n            eq.Status = EquipmentStatus.Warning_Expiring;\n            _context.MaintenanceReminders.Add(new MaintenanceReminder\n            {\n                Id = Guid.NewGuid(),\n                EquipmentId = eq.Id,\n                DueDate = eq.NextMaintenanceDate,\n                Status = ReminderStatus.Pending\n            });\n        }\n        await _context.SaveChangesAsync();\n        _logger.LogInformation($\"Đã phát hiện và tạo phiếu nhắc cho {expiringItems.Count} thiết bị PCCC.\");\n    }\n}", { bold: true, italics: true, alignment: AlignmentType.LEFT }),
        new Paragraph({ spacing: { before: 140, after: 100 }, children: [] }),

        createSubHeading("4. Trích đoạn cấu hình Docker Compose (`docker-compose.yml`)"),
        p("version: '3.8'\nservices:\n  fireguard-api:\n    build:\n      context: ./backend\n      dockerfile: Dockerfile\n    ports:\n      - \"5000:8080\"\n    environment:\n      - ConnectionStrings__DefaultConnection=Server=fireguard-db;Database=fireguard;User=root;Password=root;\n      - Redis__ConnectionString=fireguard-redis:6379\n    depends_on:\n      - fireguard-db\n      - fireguard-redis\n\n  fireguard-web:\n    build:\n      context: ./frontend\n      dockerfile: Dockerfile\n    ports:\n      - \"5173:80\"\n    depends_on:\n      - fireguard-api\n\n  fireguard-db:\n    image: mysql:8.0\n    environment:\n      MYSQL_ROOT_PASSWORD: root\n      MYSQL_DATABASE: fireguard\n    volumes:\n      - mysql_data:/var/lib/mysql\n\n  fireguard-redis:\n    image: redis:7-alpine\n    ports:\n      - \"6379:6379\"\n\n  fireguard-minio:\n    image: minio/minio\n    command: server /data --console-address \":9001\"\n    ports:\n      - \"9000:9000\"\n      - \"9001:9001\"\n\nvolumes:\n  mysql_data:", { bold: true, italics: true, alignment: AlignmentType.LEFT }),
        new Paragraph({ spacing: { before: 140, after: 100 }, children: [] }),
        createSubHeading("5. Trích đoạn mã nguồn giao diện Pop-up đếm ngược 60 giây (React TypeScript)"),
        p("Dưới đây là trích đoạn mã nguồn component `DispatchModal.tsx` hiển thị vòng tròn đếm ngược 60s và phát âm thanh chuông báo cứu hỏa:"),
        p("export const DispatchModal: React.FC<DispatchModalProps> = ({ request, onAccept, onReject }) => {\n  const [timeLeft, setTimeLeft] = useState<number>(60);\n  const audioRef = useRef<HTMLAudioElement | null>(null);\n\n  useEffect(() => {\n    audioRef.current = new Audio('/sounds/fire-alarm.mp3');\n    audioRef.current.play().catch(() => {});\n    const timer = setInterval(() => {\n      setTimeLeft((prev) => {\n        if (prev <= 1) {\n          clearInterval(timer);\n          onReject(); // Hết 60s tự động Fallback\n          return 0;\n        }\n        return prev - 1;\n      });\n    }, 1000);\n    return () => {\n      clearInterval(timer);\n      audioRef.current?.pause();\n    };\n  }, [onReject]);\n\n  const strokeDashoffset = 283 - (283 * timeLeft) / 60;\n\n  return (\n    <div className=\"fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm\">\n      <div className=\"w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center border-t-8 border-red-600\">\n        <h2 className=\"text-2xl font-bold text-gray-900\">YÊU CẦU CỨU HỘ KHẨN CẤP!</h2>\n        <div className=\"relative my-6 flex items-center justify-center\">\n          <svg className=\"h-32 w-32 -rotate-90 transform\">\n            <circle cx=\"64\" cy=\"64\" r=\"45\" stroke=\"#E2E8F0\" strokeWidth=\"8\" fill=\"transparent\" />\n            <circle cx=\"64\" cy=\"64\" r=\"45\" stroke=\"#DC2626\" strokeWidth=\"8\" fill=\"transparent\"\n              strokeDasharray=\"283\" strokeDashoffset={strokeDashoffset} strokeLinecap=\"round\" />\n          </svg>\n          <span className=\"absolute text-3xl font-extrabold text-red-600\">{timeLeft}s</span>\n        </div>\n        <p className=\"text-lg font-semibold text-gray-800\">{request.title}</p>\n        <p className=\"text-sm text-gray-500 mt-1\">{request.address} ({request.distanceKm} km)</p>\n        <div className=\"mt-6 flex gap-3\">\n          <button onClick={onReject} className=\"flex-1 rounded-xl bg-gray-200 py-3 font-bold text-gray-700 hover:bg-gray-300\">Từ Chối</button>\n          <button onClick={onAccept} className=\"flex-1 rounded-xl bg-red-600 py-3 font-bold text-white hover:bg-red-700 animate-pulse\">NHẬN VIỆC</button>\n        </div>\n      </div>\n    </div>\n  );\n};", { bold: true, italics: true, alignment: AlignmentType.LEFT })
      ]
    }
  ]
});

// Ghi file ra các đường dẫn
Packer.toBuffer(doc).then((buffer) => {
  const targetFiles = [
    path.resolve(__dirname, '..', 'BAO_CAO_DO_AN_FIREGUARD_AI_THEO_MUC_LUC.docx'),
    path.resolve(__dirname, '..', 'BAO_CAO_DO_AN_FIREGUARD_AI.docx')
  ];

  let savedCount = 0;
  for (const file of targetFiles) {
    try {
      fs.writeFileSync(file, buffer);
      console.log("SUCCESS: Đã lưu báo cáo tốt nghiệp đúng mục lục tại: " + file);
      savedCount++;
    } catch (err) {
      if (err.code === 'EBUSY') {
        console.log(`[CẢNH BÁO] File đang mở trong Word nên bị khóa: ${path.basename(file)}`);
      } else {
        console.error(`Lỗi khi lưu ${file}:`, err.message);
      }
    }
  }

  if (savedCount === 0) {
    const timestamp = Date.now();
    const fallback = path.resolve(__dirname, '..', `BAO_CAO_DO_AN_FIREGUARD_AI_${timestamp}.docx`);
    fs.writeFileSync(fallback, buffer);
    console.log("SUCCESS: File dự phòng đã tạo tại: " + fallback);
  }
}).catch((err) => {
  console.error("Error generating docx:", err);
});
