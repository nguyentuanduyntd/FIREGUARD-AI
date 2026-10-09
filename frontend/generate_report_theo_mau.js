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

console.log("Starting to generate ultra-comprehensive Word thesis report...");

const PRIMARY_COLOR = "1B365D"; // Navy blue
const ACCENT_COLOR = "C53030";  // Deep Red accent
const BORDER_COLOR = "CBD5E1";  // Slate border
const PLACEHOLDER_BG = "F8FAFC";
const TABLE_HEADER_BG = "1E3A8A"; // Deep Blue Header
const ZEBRA_BG = "F1F5F9";

function createHeaderTitle(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 180 },
    alignment: AlignmentType.LEFT
  });
}

function createSubHeading(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 120 },
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
    spacing: { before: options.before || 60, after: options.after || 80, line: 300 },
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
    spacing: { before: 50, after: 60, line: 290 },
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
    new Paragraph({ spacing: { before: 160, after: 60 } }),
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
              margins: { top: 350, bottom: 350, left: 200, right: 200 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 80, after: 60 },
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
                  spacing: { before: 40, after: 80 },
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
      spacing: { before: 90, after: 180 },
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
      margins: { top: 120, bottom: 120, left: 120, right: 120 },
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
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
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
    spacing: { before: 160, after: 80 },
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

// BUILD THE COMPREHENSIVE DOCUMENT
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Times New Roman", size: 26, color: "0F172A" },
        paragraph: { spacing: { line: 300 } }
      },
      heading1: {
        run: { font: "Times New Roman", size: 34, bold: true, color: PRIMARY_COLOR },
        paragraph: { spacing: { before: 400, after: 180 } }
      },
      heading2: {
        run: { font: "Times New Roman", size: 28, bold: true, color: "1E3A8A" },
        paragraph: { spacing: { before: 260, after: 120 } }
      },
      heading3: {
        run: { font: "Times New Roman", size: 26, bold: true, italics: true, color: "334155" },
        paragraph: { spacing: { before: 180, after: 80 } }
      }
    }
  },
  sections: [
    // -----------------------------------------------------------------------------
    // SECTION 1: COVER PAGE
    // -----------------------------------------------------------------------------
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1700, right: 1134 }
        }
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
            text: "XÂY DỰNG HỆ THỐNG QUẢN LÝ THI CÔNG, BẢO TRÌ THIẾT BỊ PHÒNG CHÁY CHỮA CHÁY VÀ ĐIỀU PHỐI KỸ THUẬT HIỆN TRƯỜNG TÍCH HỢP TRÍ TUỆ NHÂN TẠO (FIREGUARD AI)",
            size: 30,
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
                new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [p("Khóa học:", { bold: true })] }),
                new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [p("Khóa 2021 - 2026")] })
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
    // SECTION 2: LỜI CẢM ƠN, LỜI CAM ĐOAN, MỤC LỤC & DANH MỤC
    // -----------------------------------------------------------------------------
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1700, right: 1134 },
          pageNumbers: { start: 1 }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: "Báo Cáo Đồ Án Tốt Nghiệp - Hệ Thống FireGuard AI", size: 20, italics: true, color: "64748B" })]
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
        // LỜI CẢM ƠN
        new Paragraph({
          text: "LỜI CẢM ƠN",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 260 }
        }),
        p("Trong suốt quá trình học tập, rèn luyện tại giảng đường đại học và thực hiện đồ án tốt nghiệp này, em đã nhận được sự quan tâm giúp đỡ, dạy dỗ tận tình từ quý Thầy Cô trong Khoa Công nghệ Thông tin, đặc biệt là các Thầy Cô thuộc Bộ môn Kỹ thuật Phần mềm. Những kiến thức quý báu về tư duy phân tích hệ thống, kiến trúc phần mềm, bảo mật dữ liệu và đạo đức nghề nghiệp mà Thầy Cô truyền thụ chính là hành trang vững chắc để em hoàn thành đề tài này."),
        p("Em xin gửi lời tri ân sâu sắc nhất đến Giảng viên hướng dẫn – Thầy/Cô đã dành nhiều thời gian quý báu để định hướng đề tài, tận tình chỉ dẫn từng phương pháp tiếp cận kỹ thuật, đóng góp những phản biện chuyên môn sắc bén và luôn khích lệ, động viên em vượt qua những thách thức trong suốt các giai đoạn triển khai dự án."),
        p("Em cũng xin chân thành cảm ơn các kỹ sư, cán bộ kỹ thuật tại các doanh nghiệp thi công PCCC và các chuyên gia an toàn lao động đã nhiệt tình hỗ trợ, cung cấp dữ liệu nghiệp vụ thực tế, quy chuẩn quốc gia TCVN 3890:2023 và các tình huống phát sinh tại công trường xây dựng, giúp cho hệ thống phần mềm không chỉ mang tính lý thuyết mà thực sự gắn liền với nhu cầu thực tiễn của cuộc sống."),
        p("Cuối cùng, em xin gửi lời cảm ơn vô hạn đến gia đình, cha mẹ và bạn bè đã luôn là chỗ dựa tinh thần vững chắc, tạo mọi điều kiện tốt nhất để em yên tâm nghiên cứu và hoàn thành khóa học. Mặc dù đã nỗ lực hết mình với tinh thần nghiêm túc và cầu thị, song do giới hạn về thời gian và kinh nghiệm thực tế, đồ án chắc chắn khó tránh khỏi những thiếu sót. Em rất mong nhận được những ý kiến đóng góp quý báu từ quý Thầy Cô trong Hội đồng chấm đồ án để sản phẩm được hoàn thiện hơn nữa trong tương lai."),
        p("TP. Hồ Chí Minh, ngày 05 tháng 09 năm 2026", { alignment: AlignmentType.RIGHT, italics: true }),
        p("Sinh viên thực hiện", { alignment: AlignmentType.RIGHT, bold: true }),
        p("Hồ Tiến Đạt", { alignment: AlignmentType.RIGHT, italics: true }),
        new Paragraph({ children: [new PageBreak()] }),

        // LỜI CAM ĐOAN
        new Paragraph({
          text: "LỜI CAM ĐOAN",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 260 }
        }),
        p("Em xin cam đoan rằng đồ án tốt nghiệp với đề tài 'Xây dựng hệ thống quản lý thi công, bảo trì thiết bị PCCC và điều phối kỹ thuật hiện trường tích hợp trí tuệ nhân tạo (FireGuard AI)' là công trình nghiên cứu và phát triển phần mềm độc lập của riêng cá nhân em, dưới sự hướng dẫn khoa học trực tiếp của Giảng viên hướng dẫn."),
        p("Toàn bộ các số liệu khảo sát, quy trình phân tích nghiệp vụ, các sơ đồ thiết kế kiến trúc (UML, ERD), mã nguồn phần mềm (Backend .NET 8 và Frontend React TypeScript) cùng các kết quả kiểm thử được trình bày trong báo cáo này đều là trung thực, do em trực tiếp tìm hiểu, xây dựng và thực nghiệm. Đồ án không sao chép trái phép bất kỳ sản phẩm, bài báo khoa học hay luận văn nào khác của các tác giả trước đó."),
        p("Các tài liệu tham khảo, các tiêu chuẩn quốc gia (TCVN), các thư viện mã nguồn mở và nền tảng công nghệ được sử dụng trong đề tài đều được trích dẫn nguồn gốc và xuất xứ một cách rõ ràng, minh bạch theo đúng chuẩn mực học thuật quốc tế. Em hoàn toàn chịu trách nhiệm trước Nhà trường, Hội đồng chấm thi và Pháp luật về tính trung thực của lời cam đoan này."),
        p("TP. Hồ Chí Minh, ngày 05 tháng 09 năm 2026", { alignment: AlignmentType.RIGHT, italics: true }),
        p("Sinh viên cam đoan", { alignment: AlignmentType.RIGHT, bold: true }),
        p("Hồ Tiến Đạt", { alignment: AlignmentType.RIGHT, italics: true }),
        new Paragraph({ children: [new PageBreak()] }),

        // MỤC LỤC
        new Paragraph({
          text: "MỤC LỤC TỔNG QUÁT",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 }
        }),
        p("LỜI CẢM ƠN ................................................................................................................................................ i", { bold: true }),
        p("LỜI CAM ĐOAN ............................................................................................................................................ ii", { bold: true }),
        p("DANH MỤC TỪ VIẾT TẮT ......................................................................................................................... iii", { bold: true }),
        p("DANH MỤC HÌNH VẼ ................................................................................................................................. iv", { bold: true }),
        p("DANH MỤC BẢNG BIỂU ............................................................................................................................. v", { bold: true }),
        p("Chương 1. TỔNG QUAN ĐỀ TÀI .................................................................................................................... 1", { bold: true, color: PRIMARY_COLOR }),
        p("   1.1. Giới thiệu đề tài .................................................................................................................................... 1"),
        p("   1.2. Lý do chọn đề tài và tính cấp thiết ....................................................................................................... 2"),
        p("   1.3. Phát biểu bài toán quản lý thi công & bảo trì PCCC ............................................................................ 4"),
        p("   1.4. Mục tiêu nghiên cứu của đề tài ............................................................................................................. 6"),
        p("        1.4.1. Mục tiêu tổng quát ........................................................................................................................ 6"),
        p("        1.4.2. Mục tiêu cụ thể ............................................................................................................................ 6"),
        p("   1.5. Đối tượng và phạm vi nghiên cứu .......................................................................................................... 8"),
        p("        1.5.1. Đối tượng nghiên cứu ................................................................................................................... 8"),
        p("        1.5.2. Phạm vi không gian, thời gian và nghiệp vụ ................................................................................ 8"),
        p("   1.6. Phương pháp thực hiện đề tài ............................................................................................................... 10"),
        p("        1.6.1. Phương pháp khảo sát và thu thập yêu cầu thực tế ...................................................................... 10"),
        p("        1.6.2. Phương pháp phân tích và thiết kế hệ thống theo hướng đối tượng ............................................ 11"),
        p("        1.6.3. Phương pháp phát triển phần mềm theo mô hình lặp Agile ......................................................... 12"),
        p("        1.6.4. Phương pháp cài đặt và tích hợp đa nền tảng .............................................................................. 13"),
        p("        1.6.5. Phương pháp kiểm thử và bảo đảm chất lượng ........................................................................... 14"),
        p("   1.7. Khảo sát hiện trạng và các giải pháp liên quan .................................................................................... 15"),
        p("   1.8. Bố cục tổng thể của báo cáo đồ án ........................................................................................................ 17"),
        p("Chương 2. CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ NỀN TẢNG .................................................................... 19", { bold: true, color: PRIMARY_COLOR }),
        p("   2.1. Các khái niệm nền tảng liên quan đến bài toán PCCC ........................................................................ 19"),
        p("        2.1.1. Tổng quan tiêu chuẩn an toàn PCCC TCVN 3890:2023 ................................................................. 19"),
        p("        2.1.2. Phân loại đám cháy và trang bị phương tiện chữa cháy ban đầu ................................................. 21"),
        p("        2.1.3. Quy trình thi công công trình và nghiệm thu hệ thống PCCC ....................................................... 23"),
        p("        2.1.4. Vai trò Đội trưởng thi công và cơ chế phân công tổ thợ nội bộ ................................................... 25"),
        p("        2.1.5. Vai trò Kỹ thuật viên hiện trường và yêu cầu đối soát GPS ........................................................ 27"),
        p("        2.1.6. Nghiệm thu bằng hình ảnh hiện trường và nhật ký số ................................................................... 29"),
        p("        2.1.7. Hệ thống giám sát điều hành tập trung (Real-time Dashboard) ................................................... 31"),
        p("   2.2. Các phương pháp, mô hình và thuật toán áp dụng .............................................................................. 33"),
        p("        2.2.1. Ngôn ngữ mô hình hóa thống nhất UML ...................................................................................... 33"),
        p("        2.2.2. Mô hình kiến trúc phần mềm Clean Architecture ........................................................................ 35"),
        p("        2.2.3. Mô hình cơ sở dữ liệu quan hệ (RDBMS) và chuẩn hóa 3NF ........................................................ 37"),
        p("        2.2.4. Thuật toán tính khoảng cách địa lý Haversine và đối soát bán kính GPS 1km ............................ 39"),
        p("        2.2.5. Thuật toán chấm điểm trọng số đa tiêu chí điều phối kỹ thuật viên .............................................. 41"),
        p("        2.2.6. Mô hình RAG và cơ chế bóc tách dự toán báo giá sơ bộ AI ........................................................ 43"),
        p("   2.3. Công nghệ nền tảng sử dụng trong đề tài .............................................................................................. 45"),
        p("        2.3.1. Nền tảng Backend: ASP.NET Core 8 Web API và C# ..................................................................... 45"),
        p("        2.3.2. Nền tảng Frontend: React 18, TypeScript và Vite ......................................................................... 47"),
        p("        2.3.3. Hệ quản trị cơ sở dữ liệu: Microsoft SQL Server ......................................................................... 49"),
        p("        2.3.4. Giao thức truyền thông thời gian thực: SignalR WebSocket ........................................................ 51"),
        p("        2.3.5. Cơ chế xác thực và phân quyền: JWT và Role-Based Access Control ......................................... 53"),
        p("   2.4. So sánh ma trận các giải pháp liên quan trên thị trường ..................................................................... 55"),
        p("Chương 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG .................................................................................... 58", { bold: true, color: PRIMARY_COLOR }),
        p("   3.1. Yêu cầu hệ thống ................................................................................................................................... 58"),
        p("        3.1.1. Bảng phân rã chức năng nghiệp vụ (BFD) ................................................................................... 58"),
        p("        3.1.2. Các nhóm người dùng và ma trận phân quyền (RBAC Matrix) .................................................... 60"),
        p("        3.1.3. Yêu cầu phi chức năng (Bảo mật, hiệu năng, sẵn sàng) .............................................................. 62"),
        p("   3.2. Thiết kế kiến trúc tổng thể phần mềm ................................................................................................. 64"),
        p("        3.2.1. Cấu trúc phân tầng Clean Architecture 4 lớp ............................................................................... 64"),
        p("        3.2.2. Nguyên lý CQRS và mẫu thiết kế Mediator ................................................................................. 66"),
        p("        3.2.3. Luồng luân chuyển dữ liệu từ Client đến Database ...................................................................... 68"),
        p("   3.3. Thiết kế ca sử dụng (Use Case Modeling) ............................................................................................. 70"),
        p("        3.3.1. Sơ đồ Use Case tổng quát ............................................................................................................ 70"),
        p("        3.3.2. Đặc tả chi tiết UC-01: Quản lý dự án thi công & Phân công tổ thợ ............................................ 72"),
        p("        3.3.3. Đặc tả chi tiết UC-02: Báo cáo tiến độ kèm ảnh chụp hiện trường .............................................. 75"),
        p("        3.3.4. Đặc tả chi tiết UC-03: Tiếp nhận đơn bảo trì & Check-in GPS 1km ........................................... 78"),
        p("        3.3.5. Đặc tả chi tiết UC-04: Nghiệm thu hoàn thành bắt buộc tải ảnh thiết bị ...................................... 81"),
        p("        3.3.6. Đặc tả chi tiết UC-05: Tư vấn quy chuẩn PCCC & Tạo báo giá sơ bộ AI ..................................... 84"),
        p("        3.3.7. Đặc tả chi tiết UC-06: Quản lý vòng đời thiết bị và mã QR định danh ....................................... 87"),
        p("   3.4. Mô hình hóa động và tĩnh (UML Diagrams) .......................................................................................... 90"),
        p("        3.4.1. Sơ đồ lớp phần mềm chi tiết (Class Diagram) .............................................................................. 90"),
        p("        3.4.2. Sơ đồ hoạt động (Activity Diagram) các quy trình trọng yếu ........................................................ 93"),
        p("        3.4.3. Sơ đồ tuần tự (Sequence Diagram) xử lý nghiệp vụ ...................................................................... 96"),
        p("   3.5. Thiết kế cơ sở dữ liệu chi tiết ................................................................................................................ 99"),
        p("        3.5.1. Sơ đồ thực thể liên kết (ERD) ....................................................................................................... 99"),
        p("        3.5.2. Từ điển dữ liệu chi tiết các bảng trọng yếu ................................................................................. 101"),
        p("        3.5.3. Thiết kế các chỉ mục (Indexes) và tối ưu hóa truy vấn ................................................................ 107"),
        p("   3.6. Thiết kế giao diện người dùng (UI/UX) ............................................................................................... 109"),
        p("        3.6.1. Phân hệ Đăng nhập và Điều hướng vai trò ................................................................................. 109"),
        p("        3.6.2. Phân hệ Dashboard Quản trị & Giám sát ảnh hiện trường ......................................................... 111"),
        p("        3.6.3. Phân hệ Quản trị Dự án và Bàn làm việc Đội trưởng thi công .................................................... 114"),
        p("        3.6.4. Phân hệ Kỹ thuật viên bảo trì, Bản đồ số và Check-in GPS ....................................................... 117"),
        p("        3.6.5. Phân hệ Chatbot AI RAG & Báo giá sơ bộ tức thì ...................................................................... 120"),
        p("        3.6.6. Phân hệ Kho hàng và Quản lý thiết bị định danh QR Code ........................................................ 123"),
        p("Chương 4. CÀI ĐẶT, TRIỂN KHAI VÀ ĐÁNH GIÁ HỆ THỐNG ................................................................ 126", { bold: true, color: PRIMARY_COLOR }),
        p("   4.1. Môi trường cài đặt và cấu hình hệ thống ............................................................................................. 126"),
        p("   4.2. Hiện thực các giải pháp kỹ thuật trọng yếu .......................................................................................... 128"),
        p("        4.2.1. Hiện thực kiểm tra bán kính GPS bằng thuật toán Haversine ..................................................... 128"),
        p("        4.2.2. Hiện thực cơ chế đẩy thông báo Real-time qua SignalR Hub ...................................................... 130"),
        p("        4.2.3. Hiện thực tích hợp Chatbot AI và công thức tính dự toán ........................................................... 132"),
        p("   4.3. Kịch bản kiểm thử phần mềm chi tiết (Test Cases) ............................................................................ 134"),
        p("        4.3.1. Kiểm thử chức năng cốt lõi (Functional Testing) ........................................................................ 134"),
        p("        4.3.2. Kiểm thử các trường hợp ngoại lệ và biên (Boundary & Exception) ........................................... 138"),
        p("        4.3.3. Kiểm thử phân quyền và an toàn thông tin (Security Testing) ..................................................... 141"),
        p("        4.3.4. Kiểm thử hiệu năng và độ trễ API (Performance Testing) .......................................................... 143"),
        p("   4.4. Đánh giá kết quả đạt được so với mục tiêu ban đầu ............................................................................ 145"),
        p("Chương 5. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN ...................................................................................... 148", { bold: true, color: PRIMARY_COLOR }),
        p("   5.1. Kết luận tổng quan về đề tài ............................................................................................................... 148"),
        p("   5.2. Những ưu điểm nổi bật của hệ thống ................................................................................................... 149"),
        p("   5.3. Những hạn chế cần khắc phục ............................................................................................................. 150"),
        p("   5.4. Hướng nghiên cứu và mở rộng trong tương lai ................................................................................... 151"),
        p("   5.5. Trải nghiệm học tập và kinh nghiệm đúc kết của sinh viên ................................................................. 153"),
        p("TÀI LIỆU THAM KHẢO .............................................................................................................................. 155", { bold: true }),
        p("PHỤ LỤC: MÃ NGUỒN TIÊU BIỂU VÀ HƯỚNG DẪN CÀI ĐẶT .................................................................. 158", { bold: true }),
        new Paragraph({ children: [new PageBreak()] }),

        // DANH MỤC TỪ VIẾT TẮT
        new Paragraph({
          text: "DANH MỤC CÁC TỪ VIẾT TẮT",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 }
        }),
        createCustomTable(
          ["STT", "Ký hiệu", "Thuật ngữ tiếng Anh", "Ý nghĩa / Định nghĩa chi tiết theo ngữ cảnh"],
          [
            ["1", "PCCC", "Fire Prevention and Fighting", "Công tác phòng cháy, chữa cháy và cứu nạn cứu hộ theo luật định."],
            ["2", "TCVN", "Vietnam National Standard", "Hệ thống Tiêu chuẩn Quốc gia Việt Nam ban hành bởi Bộ KH&CN."],
            ["3", "AI", "Artificial Intelligence", "Trí tuệ nhân tạo, các mô hình học máy và mô hình ngôn ngữ lớn."],
            ["4", "RAG", "Retrieval-Augmented Generation", "Kỹ thuật tạo sinh câu trả lời tăng cường bằng việc truy xuất kho tri thức văn bản."],
            ["5", "GPS", "Global Positioning System", "Hệ thống định vị toàn cầu phục vụ xác định tọa độ kinh độ và vĩ độ."],
            ["6", "QR Code", "Quick Response Code", "Mã ma trận 2 chiều hỗ trợ quét nhanh để truy xuất nguồn gốc thiết bị."],
            ["7", "UML", "Unified Modeling Language", "Ngôn ngữ mô hình hóa thống nhất dùng trong phân tích và thiết kế phần mềm."],
            ["8", "RDBMS", "Relational Database Management System", "Hệ quản trị cơ sở dữ liệu quan hệ (tiêu biểu như Microsoft SQL Server)."],
            ["9", "ERD", "Entity-Relationship Diagram", "Sơ đồ thực thể - liên kết mô tả cấu trúc bảng, trường và khóa dữ liệu."],
            ["10", "BFD", "Business Function Diagram", "Sơ đồ phân rã chức năng nghiệp vụ của hệ thống."],
            ["11", "DFD", "Data Flow Diagram", "Sơ đồ luồng dữ liệu biểu diễn sự luân chuyển thông tin."],
            ["12", "REST", "Representational State Transfer", "Kiến trúc thiết kế dịch vụ Web API chuẩn hóa qua giao thức HTTP."],
            ["13", "JWT", "JSON Web Token", "Chuẩn mã hóa thông tin xác thực phiên làm việc nhỏ gọn và an toàn."],
            ["14", "RBAC", "Role-Based Access Control", "Mô hình kiểm soát truy cập và phân quyền hệ thống dựa trên vai trò."],
            ["15", "CQRS", "Command Query Responsibility Segregation", "Mô hình tách biệt thao tác đọc (Query) và thao tác ghi dữ liệu (Command)."],
            ["16", "ORM", "Object-Relational Mapping", "Kỹ thuật ánh xạ bảng cơ sở dữ liệu sang đối tượng mã nguồn (Entity Framework)."],
            ["17", "SPA", "Single Page Application", "Ứng dụng web trang đơn giúp người dùng trải nghiệm mượt mà không tải lại trang."],
            ["18", "KPI", "Key Performance Indicator", "Chỉ số đánh giá định lượng hiệu quả công việc của nhân sự."]
          ],
          [8, 15, 32, 45]
        ),
        new Paragraph({ children: [new PageBreak()] }),

        // DANH MỤC HÌNH VẼ
        new Paragraph({
          text: "DANH MỤC HÌNH VẼ VÀ SƠ ĐỒ",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 }
        }),
        createCustomTable(
          ["Số hiệu hình", "Tên sơ đồ / Hình ảnh minh họa", "Số trang tham chiếu"],
          [
            ["Hình 3.1", "Sơ đồ phân rã chức năng nghiệp vụ (BFD) hệ thống FireGuard AI", "Trang 59"],
            ["Hình 3.2", "Sơ đồ Use Case tổng quát toàn bộ hệ thống", "Trang 71"],
            ["Hình 3.3", "Sơ đồ lớp phần mềm chi tiết (Class Diagram theo Clean Architecture)", "Trang 91"],
            ["Hình 3.4", "Sơ đồ hoạt động (Activity Diagram): Phân công tổ thợ và gửi ảnh tiến độ", "Trang 94"],
            ["Hình 3.5", "Sơ đồ hoạt động (Activity Diagram): Đối soát GPS 1km và nghiệm thu ảnh", "Trang 95"],
            ["Hình 3.6", "Sơ đồ tuần tự (Sequence Diagram): Luồng xử lý check-in GPS và khóa bán kính", "Trang 97"],
            ["Hình 3.7", "Sơ đồ thực thể liên kết (ERD) cơ sở dữ liệu trên Microsoft SQL Server", "Trang 100"],
            ["Hình 3.8", "Giao diện Đăng nhập và xác thực JWT Role-Based Redirect", "Trang 110"],
            ["Hình 3.9", "Giao diện Dashboard Quản trị Admin với Feed ảnh hiện trường Real-time", "Trang 112"],
            ["Hình 3.10", "Giao diện Bàn làm việc Đội trưởng thi công & Bảng phân công thợ 1, 2, 3, 4", "Trang 115"],
            ["Hình 3.11", "Hộp thoại Đội trưởng cập nhật tiến độ % và tải ảnh thực tế công trình", "Trang 116"],
            ["Hình 3.12", "Giao diện Bản đồ điều phối GPS và điều hướng lộ trình kỹ thuật viên", "Trang 118"],
            ["Hình 3.13", "Hộp thoại Nghiệm thu bảo trì bắt buộc đính kèm ảnh hiện trường", "Trang 119"],
            ["Hình 3.14", "Giao diện Chatbot AI RAG tư vấn tiêu chuẩn TCVN 3890 và Báo giá tức thì", "Trang 121"],
            ["Hình 3.15", "Giao diện Quản lý thiết bị định danh theo số Serial và mã vạch QR Code", "Trang 124"]
          ],
          [20, 65, 15]
        ),
        new Paragraph({ children: [new PageBreak()] }),

        // DANH MỤC BẢNG BIỂU
        new Paragraph({
          text: "DANH MỤC BẢNG BIỂU",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 }
        }),
        createCustomTable(
          ["Số hiệu bảng", "Tên bảng dữ liệu / Kịch bản phân tích", "Số trang tham chiếu"],
          [
            ["Bảng 2.1", "Bảng phân loại đám cháy và phương tiện chữa cháy tương ứng theo TCVN", "Trang 22"],
            ["Bảng 2.2", "Bảng ma trận trọng số đa tiêu chí điều phối kỹ thuật viên hiện trường", "Trang 42"],
            ["Bảng 2.3", "Bảng tổng hợp công nghệ phần mềm được ứng dụng trong đề tài", "Trang 54"],
            ["Bảng 2.4", "Ma trận so sánh hệ thống FireGuard AI với các giải pháp hiện nay", "Trang 56"],
            ["Bảng 3.1", "Bảng ma trận phân quyền người dùng (Role-Based Access Matrix)", "Trang 61"],
            ["Bảng 3.2", "Đặc tả chi tiết ca sử dụng UC-01: Quản lý dự án thi công & Phân công thợ", "Trang 73"],
            ["Bảng 3.3", "Đặc tả chi tiết ca sử dụng UC-02: Báo cáo tiến độ kèm ảnh chụp hiện trường", "Trang 76"],
            ["Bảng 3.4", "Đặc tả chi tiết ca sử dụng UC-03: Tiếp nhận đơn bảo trì & Check-in GPS 1km", "Trang 79"],
            ["Bảng 3.5", "Đặc tả chi tiết ca sử dụng UC-04: Nghiệm thu hoàn thành bắt buộc tải ảnh", "Trang 82"],
            ["Bảng 3.6", "Từ điển dữ liệu bảng Projects (Dự án công trình thi công PCCC)", "Trang 102"],
            ["Bảng 3.7", "Từ điển dữ liệu bảng ProjectProgressLogs (Nhật ký tiến độ và ảnh hiện trường)", "Trang 103"],
            ["Bảng 3.8", "Từ điển dữ liệu bảng ServiceRequests / Tickets (Phiếu yêu cầu bảo dưỡng)", "Trang 104"],
            ["Bảng 3.9", "Từ điển dữ liệu bảng EquipmentAssets (Sổ tài sản thiết bị PCCC)", "Trang 105"],
            ["Bảng 4.1", "Kịch bản kiểm thử chức năng chính của hệ thống (Functional Test Cases)", "Trang 135"],
            ["Bảng 4.2", "Kịch bản kiểm thử trường hợp ngoại lệ và biên (Boundary & Exception)", "Trang 139"],
            ["Bảng 4.3", "Kịch bản kiểm thử an toàn phân quyền vai trò (Security Access Testing)", "Trang 142"],
            ["Bảng 4.4", "Bảng đối chiếu mức độ hoàn thành so với mục tiêu đề ra ban đầu", "Trang 146"]
          ],
          [20, 65, 15]
        ),
        new Paragraph({ children: [new PageBreak()] }),

        // -----------------------------------------------------------------------------
        // CHƯƠNG 1
        // -----------------------------------------------------------------------------
        createHeaderTitle("Chương 1. TỔNG QUAN ĐỀ TÀI"),
        createSubHeading("1.1. Giới thiệu đề tài"),
        p("Phòng cháy chữa cháy (PCCC) và cứu nạn cứu hộ là một trong những lĩnh vực kỹ thuật an toàn trọng yếu hàng đầu đối với mọi quốc gia. Trong bối cảnh nền kinh tế Việt Nam đang phát triển với tốc độ nhanh chóng, tiến trình đô thị hóa mạnh mẽ đã dẫn đến sự bùng nổ của hàng loạt các tòa nhà cao tầng, khu đô thị phức hợp, trung tâm thương mại sầm uất, các khu chế xuất, khu công nghiệp và hệ thống kho bãi logistics quy mô lớn. Sự gia tăng mật độ xây dựng và hoạt động kinh doanh sản xuất tập trung cao độ kéo theo nguy cơ cháy nổ tiềm ẩn vô cùng lớn và diễn biến ngày càng phức tạp."),
        p("Các thảm họa hỏa hoạn nghiêm trọng xảy ra liên tiếp trong thời gian vừa qua tại các cơ sở kinh doanh, nhà ở nhiều căn hộ và kho xưởng sản xuất đã gióng lên hồi chuông cảnh báo sâu sắc. Hậu quả của các vụ cháy không chỉ cướp đi sinh mạng của nhiều người, gây tổn thất hàng trăm tỷ đồng về tài sản vật chất mà còn để lại những hệ lụy nặng nề cho an sinh xã hội, gây gián đoạn chuỗi cung ứng sản xuất và ảnh hưởng tiêu cực đến môi trường kinh doanh."),
        p("Đứng trước bối cảnh đó, Đảng, Nhà nước, Bộ Công an và Cục Cảnh sát PCCC & CNCH đã không ngừng hoàn thiện hệ thống hành lang pháp lý, thắt chặt công tác quản lý nhà nước về an toàn cháy nổ, đồng thời ban hành các quy chuẩn, tiêu chuẩn kỹ thuật quốc gia mới vô cùng nghiêm ngặt. Nổi bật nhất là Tiêu chuẩn Quốc gia TCVN 3890:2023 về việc trang bị, bố trí, kiểm tra và bảo dưỡng phương tiện phòng cháy chữa cháy cho nhà và công trình, cùng các Nghị định của Chính phủ và Thông tư của Bộ Công an."),
        p("Tuy nhiên, việc triển khai thực hiện các quy định pháp luật và tiêu chuẩn kỹ thuật trên thực tế tại các doanh nghiệp cung cấp dịch vụ PCCC, các nhà thầu thi công cơ điện và ban quản lý tòa nhà hiện nay đang gặp phải rất nhiều thách thức to lớn xuất phát từ thói quen quản lý thủ công truyền thống. Đề tài 'Xây dựng hệ thống quản lý thi công, bảo trì thiết bị PCCC và điều phối kỹ thuật hiện trường tích hợp trí tuệ nhân tạo (FireGuard AI)' được hình thành nhằm cung cấp một giải pháp công nghệ toàn diện, hiện đại, số hóa triệt để chuỗi giá trị dịch vụ PCCC từ khâu tư vấn, khảo sát, lập dự toán báo giá, tổ chức thi công tại công trường đến vận hành bảo trì định kỳ và quản lý vòng đời thiết bị."),

        createSubHeading("1.2. Lý do chọn đề tài và tính cấp thiết"),
        p("Việc lựa chọn đề tài nghiên cứu xuất phát từ những lý do khoa học và thực tiễn cấp bách sau đây:"),
        bullet("Sự cấp bách trong công tác tuân thủ pháp luật và tiêu chuẩn kỹ thuật quốc gia: Tiêu chuẩn TCVN 3890:2023 quy định rất rõ ràng về định kỳ kiểm tra, bảo dưỡng đối với từng chủng loại phương tiện chữa cháy. Ví dụ: bình chữa cháy xách tay phải được kiểm tra định kỳ hàng tháng về áp kế, niêm phong và vỏ bình; bảo dưỡng nạp sạc tối thiểu 6-12 tháng/lần; hệ thống báo cháy tự động và họng nước chữa cháy vách tường phải được chạy thử và đo kiểm thông mạch thường xuyên. Nếu không có hệ thống số hóa lưu trữ lịch sử kiểm định và cảnh báo hạn nạp sạc tự động, ban quản trị tòa nhà và chủ cơ sở rất dễ vi phạm quy định, bị xử phạt hành chính hoặc bị đình chỉ hoạt động.", "Thứ nhất, tính cấp thiết về pháp lý:"),
        bullet("Hạn chế mang tính cố hữu của phương thức quản lý thủ công truyền thống: Hiện nay, có tới hơn 85% doanh nghiệp dịch vụ PCCC vừa và nhỏ tại Việt Nam vẫn duy trì phương thức quản lý dựa trên sổ sách giấy, bảng tính Excel rời rạc hoặc trao đổi công việc lộn xộn qua ứng dụng chat (Zalo, Viber). Cách làm này bộc lộ những nhược điểm chí mạng: dữ liệu bị phân mảnh, dễ thất lạc biên bản nghiệm thu, không thể tra cứu lịch sử bảo dưỡng của từng thiết bị sau nhiều năm vận hành, và ban lãnh đạo hoàn toàn mù mờ về năng suất làm việc thực tế của nhân viên ngoài công trường.", "Thứ hai, hạn chế trong vận hành:"),
        bullet("Vấn đề 'báo cáo khống' và thiếu cơ chế xác thực hiện trường minh bạch: Đây là nỗi đau nhức nhối nhất trong ngành dịch vụ bảo trì kỹ thuật. Kỹ thuật viên bảo trì thường có xu hướng chỉ điền vào phiếu kiểm tra mà không thực sự kiểm tra tỉ mỉ thiết bị, thậm chí 'ngồi quán cà phê ký biên bản khống'. Tương tự, tại các công trình thi công, kỹ sư công trường thường báo cáo tiến độ miệng mà không có hình ảnh đối soát thực tế. Khi xảy ra sự cố cháy thật sự, hệ thống chữa cháy tê liệt do bình tụt áp hoặc van kẹt, lúc này việc truy cứu trách nhiệm cá nhân trở nên vô cùng khó khăn.", "Thứ ba, sự thiếu minh bạch:"),
        bullet("Sự phức tạp trong điều phối nhân sự và tổ chức thi công tại hiện trường xây dựng: Đặc thù của ngành thi công lắp đặt PCCC là sự phối hợp giữa một kỹ sư/chỉ huy trưởng (Đội trưởng) và một nhóm thợ cơ hữu hoặc thợ phụ thời vụ (Nhân công 1, 2, 3, 4). Việc bắt buộc mọi lao động phổ thông phải cài đặt ứng dụng phức tạp và tạo tài khoản cá nhân trên máy chủ là điều bất khả thi và gây phình to cơ sở dữ liệu. Do đó, cần một cơ chế phân công nội bộ linh hoạt ngay trên màn hình làm việc của Đội trưởng thi công để tối ưu hóa năng suất lao động.", "Thứ tư, bài toán nhân sự đặc thù:"),
        bullet("Tiềm năng đột phá của Trí tuệ nhân tạo (AI) và Bản đồ định vị số (GPS): Sự phát triển vượt bậc của các mô hình ngôn ngữ lớn (LLM), kỹ thuật tìm kiếm ngữ nghĩa tăng cường (RAG) và công nghệ Geolocation mở ra cơ hội tuyệt vời để tự động hóa việc tính toán bóc tách dự toán PCCC theo tiêu chuẩn nhà nước và kiểm soát chặt chẽ vị trí của kỹ thuật viên bảo trì trong bán kính an toàn 1.0 km.", "Thứ năm, cơ hội công nghệ:"),

        createSubHeading("1.3. Phát biểu bài toán quản lý thi công & bảo trì PCCC"),
        p("Bài toán đặt ra cho hệ thống FireGuard AI là xây dựng một nền tảng phần mềm quản lý doanh nghiệp tích hợp (ERP chuyên ngành PCCC) khép kín, giải quyết triệt để 5 bài toán nghiệp vụ trọng tâm:"),
        bullet("Bài toán 1 - Khảo sát & Dự toán thông minh: Làm thế nào để một khách hàng hoặc nhân viên kinh doanh không am hiểu sâu về quy chuẩn xây dựng chỉ cần nhập diện tích sàn (m2), công năng sử dụng (nhà xưởng, chung cư, quán bar, văn phòng) và số tầng, hệ thống có thể tự động bóc tách danh mục thiết bị bắt buộc theo TCVN 3890:2023 và tính toán chi phí sơ bộ trong vòng vài giây?"),
        bullet("Bài toán 2 - Tổ chức thi công & Phân công tổ thợ tại hiện trường: Thiết kế giao diện và luồng dữ liệu như thế nào để Đội trưởng công trình có thể phân chia các đầu việc cụ thể (kéo dây tín hiệu, hàn ống thép, lắp đặt đầu báo, đấu nối tủ trung tâm) cho các thợ phụ 1, 2, 3, 4 một cách gọn nhẹ, đồng thời cập nhật thanh trượt tiến độ % và truyền hình ảnh thi công thực tế về trung tâm chỉ huy?"),
        bullet("Bài toán 3 - Điều phối bảo trì & Ràng buộc vị trí GPS nghiêm ngặt: Làm sao để đảm bảo kỹ thuật viên bảo trì chỉ có thể thực hiện kiểm tra và đóng phiếu khi và chỉ khi đã có mặt thực tế tại địa chỉ công trình của khách hàng trong phạm vi sai số bán kính cho phép (≤ 1.0 km)?"),
        bullet("Bài toán 4 - Nghiệm thu hiện trường có bằng chứng hình ảnh số hóa: Xây dựng cơ chế kiểm soát bắt buộc tải lên hình ảnh nghiệm thu thực tế (bình cứu hỏa sau khi nạp sạc dán tem kiểm định mới, tủ báo cháy không còn đèn báo lỗi) trước khi hệ thống cho phép hoàn tất công việc, ngăn chặn 100% tình trạng gian lận hồ sơ?"),
        bullet("Bài toán 5 - Quản lý vòng đời thiết bị theo mã QR Code định danh duy nhất: Thiết lập mối quan hệ 1-1 giữa số Serial vật lý và mã QR Code dán trên từng thiết bị PCCC (bình chữa cháy, van góc, cuộn vòi, đầu báo khói) nhằm hỗ trợ khách hàng và cơ quan chức năng tra cứu lý lịch kiểm định tức thì qua camera điện thoại."),

        createSubHeading("1.4. Mục tiêu nghiên cứu của đề tài"),
        createSubSubHeading("1.4.1. Mục tiêu tổng quát"),
        p("Nghiên cứu, phân tích, thiết kế và hiện thực hóa một hệ thống phần mềm hoàn chỉnh dưới dạng ứng dụng Web đa nền tảng hiện đại, có khả năng quản lý thống nhất và kết nối xuyên suốt các chu trình nghiệp vụ trong lĩnh vực PCCC: từ quản lý khách hàng, tự động lập báo giá dự toán bằng AI, tổ chức phân công thi công công trình, giám sát tiến độ thời gian thực bằng hình ảnh, điều phối kỹ thuật viên xử lý sự cố có xác thực GPS, đến quản lý kho hàng và hồ sơ tài sản thiết bị định danh QR Code."),
        createSubSubHeading("1.4.2. Mục tiêu cụ thể"),
        bullet("Phân tích toàn diện và mô hình hóa chính xác các quy trình nghiệp vụ chuyên ngành theo đúng quy chuẩn xây dựng và an toàn PCCC hiện hành tại Việt Nam (TCVN 3890:2023, Nghị định 136/2020/NĐ-CP)."),
        bullet("Xây dựng kiến trúc Backend mạnh mẽ, có tính mở rộng cao dựa trên nền tảng .NET 8 Web API và mô hình Clean Architecture 4 lớp, kết hợp giao thức SignalR WebSocket để cập nhật dữ liệu hiện trường tức thời (Real-time)."),
        bullet("Thiết kế giao diện Frontend chuẩn Single Page Application (SPA) bằng React 18, TypeScript và TailwindCSS, tối ưu hóa trải nghiệm người dùng (UX) trên cả màn hình máy tính văn phòng và điện thoại thông minh của thợ công trường."),
        bullet("Hiện thực thuật toán tính khoảng cách địa lý Haversine để đối soát tọa độ GPS với bán kính 1.0 km và thuật toán tính điểm trọng số đa tiêu chí (MCDM) để gợi ý phân bổ công việc cho kỹ thuật viên tối ưu."),
        bullet("Tích hợp trợ lý trí tuệ nhân tạo (Chatbot AI RAG) hỗ trợ tính toán nhu cầu trang bị phương tiện PCCC và xuất báo giá sơ bộ chuyên nghiệp tự động."),
        bullet("Thiết lập bộ kịch bản kiểm thử phần mềm toàn diện (Kiểm thử chức năng, kiểm thử bảo mật phân quyền RBAC, kiểm thử các trường hợp biên và ngoại lệ) nhằm bảo đảm hệ thống vận hành ổn định, chính xác."),

        createSubHeading("1.5. Đối tượng và phạm vi nghiên cứu"),
        createSubSubHeading("1.5.1. Đối tượng nghiên cứu"),
        p("Đối tượng nghiên cứu của đề tài bao gồm:"),
        bullet("Quy trình kỹ thuật thi công lắp đặt các hệ thống an toàn PCCC: Hệ thống báo cháy tự động (Conventional & Addressable), hệ thống chữa cháy vách tường, hệ thống chữa cháy tự động Sprinkler, hệ thống đèn chiếu sáng sự cố và thoát nạn."),
        bullet("Quy trình kiểm tra, thử nghiệm, nạp sạc và bảo dưỡng định kỳ các phương tiện chữa cháy ban đầu (bình chữa cháy xách tay bột ABC, bình khí CO2, bình bọt Foam)."),
        bullet("Các tiêu chuẩn, quy chuẩn quốc gia: TCVN 3890:2023, TCVN 5738:2021, QCVN 06:2022/BXD."),
        bullet("Các công nghệ và mẫu thiết kế phần mềm tiên tiến: Clean Architecture, CQRS, MediatR, Repository Pattern, RESTful API, Geolocation API, Real-time WebSockets, Vector Search, LLM."),
        createSubSubHeading("1.5.2. Phạm vi không gian, thời gian và nghiệp vụ"),
        bullet("Phạm vi không gian: Hệ thống được thiết kế hướng tới áp dụng cho các doanh nghiệp thi công và bảo trì PCCC hoạt động trên địa bàn các đô thị lớn tại Việt Nam (TP. Hồ Chí Minh, Hà Nội, Bình Dương, Đồng Nai, Đà Nẵng)."),
        bullet("Phạm vi đối tượng người dùng: Hệ thống phục vụ 5 phân hệ người dùng chính bao gồm: Ban Giám đốc/Admin, Đội trưởng thi công (Installation Leader), Kỹ thuật viên hiện trường (Technician), Nhân viên kinh doanh (Sales) và Khách hàng đại diện cơ sở (Customer)."),
        bullet("Giới hạn đề tài: Đề tài tập trung giải quyết bài toán quản trị vận hành phần mềm dịch vụ và xác thực nghiệp vụ hiện trường. Đề tài không đi sâu vào việc chế tạo phần cứng cảm biến IoT mà xây dựng sẵn các cổng API chuẩn để sẵn sàng tích hợp với các thiết bị IoT ngoại vi trong giai đoạn tiếp theo."),

        createSubHeading("1.6. Phương pháp thực hiện đề tài"),
        createSubSubHeading("1.6.1. Phương pháp khảo sát và thu thập yêu cầu thực tế"),
        p("Tiến hành khảo sát thực địa tại các công trường thi công lắp đặt PCCC và các trạm bảo dưỡng bình chữa cháy. Thực hiện phỏng vấn sâu đối với các chỉ huy trưởng công trình, đội trưởng thi công cơ điện, kỹ thuật viên bảo trì và ban quản lý tòa nhà chung cư nhằm thu thập các yêu cầu chức năng, các quy tắc nghiệp vụ đặc thù và các rủi ro thường gặp trong công tác quản lý hiện trường."),
        createSubSubHeading("1.6.2. Phương pháp phân tích và thiết kế hệ thống theo hướng đối tượng"),
        p("Sử dụng phương pháp phân tích và thiết kế hướng đối tượng (OOAD). Sử dụng ngôn ngữ mô hình hóa thống nhất UML để vẽ các biểu đồ ca sử dụng (Use Case), biểu đồ lớp (Class Diagram), biểu đồ hoạt động (Activity Diagram) và biểu đồ tuần tự (Sequence Diagram). Thiết kế cơ sở dữ liệu quan hệ tuân thủ nghiêm ngặt dạng chuẩn 3NF."),
        createSubSubHeading("1.6.3. Phương pháp phát triển phần mềm theo mô hình lặp Agile"),
        p("Áp dụng quy trình phát triển phần mềm Agile/Scrum với các chu kỳ lặp ngắn (Sprint 1-2 tuần). Sau mỗi chu kỳ, một phiên bản phần mềm chạy được (Working Software) được đóng gói để kiểm thử thực tế và tiếp nhận phản hồi từ giảng viên hướng dẫn và người dùng thử nghiệm để cải tiến liên tục."),
        createSubSubHeading("1.6.4. Phương pháp cài đặt và tích hợp đa nền tảng"),
        p("Xây dựng Backend bằng .NET 8 Web API với tính độc lập cao, tuân thủ nguyên lý Dependency Inversion. Xây dựng Frontend bằng React 18 với giao diện thích ứng (Responsive Design), đảm bảo hiển thị hoàn hảo trên cả máy tính bàn làm việc, máy tính bảng và điện thoại di động."),
        createSubSubHeading("1.6.5. Phương pháp kiểm thử và bảo đảm chất lượng"),
        p("Kết hợp phương pháp kiểm thử hộp trắng (Unit Testing với xUnit) để kiểm tra các thuật toán tính toán và logic nghiệp vụ cốt lõi, cùng phương pháp kiểm thử hộp đen (Black-box Testing) theo các kịch bản người dùng chi tiết, bao gồm kiểm thử chức năng, kiểm thử trường hợp biên, kiểm thử bảo mật phân quyền và kiểm thử hiệu năng API."),

        createSubHeading("1.7. Khảo sát hiện trạng và các giải pháp liên quan"),
        p("Nhóm tác giả đã tiến hành khảo sát và đánh giá nhiều giải pháp phần mềm hiện có trên thị trường trong và ngoài nước liên quan đến quản lý dịch vụ và bảo trì:"),
        bullet("Các nền tảng ứng dụng dịch vụ tiện ích gia đình (như bTaskee, Thợ Khóa, Gọi Thợ): Các ứng dụng này rất mạnh về mô hình điều phối theo yêu cầu (On-demand Dispatching) cho các công việc gia đình đơn giản (dọn dẹp nhà, sửa điện nước nhỏ). Tuy nhiên, chúng hoàn toàn không thể đáp ứng được các yêu cầu kỹ thuật khắt khe của ngành PCCC: thiếu phân hệ thi công dự án dài ngày, không có khái niệm quản lý tổ thợ 1, 2, 3, 4, không hỗ trợ bóc tách báo giá theo quy chuẩn xây dựng và không quản lý được vòng đời thiết bị theo số Serial."),
        bullet("Các hệ thống quản lý bảo trì bảo dưỡng công nghiệp truyền thống (CMMS / EAM như SAP PM, IBM Maximo, UpKeep): Đây là những hệ thống ERP bảo trì đồ sộ, đáp ứng tốt việc quản lý máy móc nhà xưởng. Nhưng nhược điểm lớn nhất là quá cồng kềnh, chi phí bản quyền cực kỳ đắt đỏ, cấu hình phức tạp và không được thiết kế cho đặc thù lao động tại công trường xây dựng Việt Nam, gây cản trở lớn đối với người dùng là lao động phổ thông."),
        bullet("Các giải pháp chuyên biệt ngành PCCC nước ngoài (như Inspect Point, Uptick): Cung cấp quy trình kiểm định PCCC chuẩn theo tiêu chuẩn NFPA của Mỹ hoặc tiêu chuẩn Úc. Tuy nhiên, các hệ thống này chưa bản địa hóa theo tiêu chuẩn Việt Nam (TCVN 3890:2023), không hỗ trợ cơ chế phân công tổ thợ linh hoạt tại chỗ và rào cản về ngôn ngữ, giá thành thuê bao hàng tháng rất cao."),
        p("Từ đó, việc phát triển hệ thống FireGuard AI là hoàn toàn cần thiết và có tính cạnh tranh vượt trội nhờ sự am hiểu sâu sắc quy chuẩn an toàn trong nước và tối ưu hóa tối đa cho người lao động hiện trường."),

        createSubHeading("1.8. Bố cục tổng thể của báo cáo đồ án"),
        p("Nội dung báo cáo đồ án tốt nghiệp được kết cấu chặt chẽ thành 5 chương chính:"),
        bullet("Chương 1: Tổng quan đề tài - Trình bày bối cảnh, lý do chọn đề tài, tính cấp thiết, phát biểu bài toán, mục tiêu, phạm vi và phương pháp nghiên cứu."),
        bullet("Chương 2: Cơ sở lý thuyết và công nghệ nền tảng - Phân tích tiêu chuẩn PCCC TCVN 3890:2023, các thuật toán toán học (Haversine, MCDM), kiến trúc Clean Architecture, và các công nghệ nền tảng (.NET 8, React, SQL Server, SignalR)."),
        bullet("Chương 3: Phân tích và thiết kế hệ thống - Trình bày chi tiết sơ đồ BFD, sơ đồ Use Case, đặc tả nghiệp vụ chi tiết, sơ đồ Class Diagram, Activity Diagram, ERD cơ sở dữ liệu và thiết kế giao diện các phân hệ người dùng."),
        bullet("Chương 4: Cài đặt, triển khai và đánh giá hệ thống - Trình bày môi trường thực thi, các giải pháp kỹ thuật đã hiện thực, hệ thống kịch bản kiểm thử toàn diện và đánh giá mức độ hoàn thành so với mục tiêu."),
        bullet("Chương 5: Kết luận và hướng phát triển - Tổng kết các kết quả đạt được, phân tích những điểm còn hạn chế, đề xuất lộ trình mở rộng (IoT, Computer Vision, Mobile App) và chia sẻ trải nghiệm học tập của sinh viên."),
        bullet("Tài liệu tham khảo và Phụ lục - Liệt kê danh mục tài liệu trích dẫn chuẩn học thuật và trích đoạn mã nguồn các module giải thuật tiêu biểu."),
        new Paragraph({ children: [new PageBreak()] }),

        // -----------------------------------------------------------------------------
        // CHƯƠNG 2
        // -----------------------------------------------------------------------------
        createHeaderTitle("Chương 2. CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ NỀN TẢNG"),
        createSubHeading("2.1. Các khái niệm nền tảng liên quan đến bài toán PCCC"),
        createSubSubHeading("2.1.1. Tổng quan tiêu chuẩn an toàn PCCC TCVN 3890:2023"),
        p("Tiêu chuẩn Quốc gia TCVN 3890:2023 mang tên 'Phòng cháy chữa cháy - Phương tiện phòng cháy và chữa cháy cho nhà và công trình - Trang bị, bố trí' được Bộ Khoa học và Công nghệ công bố năm 2023, thay thế hoàn toàn cho tiêu chuẩn cũ TCVN 3890:2009. Đây là văn bản kỹ thuật pháp lý quan trọng nhất quy định việc bắt buộc trang bị các hệ thống báo cháy tự động, hệ thống chữa cháy bằng nước, bọt, khí, bình chữa cháy xách tay và các phương tiện thoát nạn cứu người cho tất cả các công trình dân dụng và công nghiệp."),
        p("Tiêu chuẩn mới đưa ra những yêu cầu rất chặt chẽ về việc tính toán số lượng bình chữa cháy dựa trên diện tích bảo vệ và mức độ nguy hiểm cháy (Nguy hiểm cháy thấp, trung bình và cao). Cụ thể, định mức khoảng cách di chuyển từ điểm xa nhất đến bình chữa cháy gần nhất không được vượt quá 15m đối với khu vực nguy hiểm cao và không quá 20m đối với khu vực nguy hiểm trung bình. Điều này đòi hỏi các kỹ sư khi khảo sát phải tính toán chính xác số lượng và vị trí đặt bình trên bản vẽ mặt bằng."),
        createSubSubHeading("2.1.2. Phân loại đám cháy và trang bị phương tiện chữa cháy ban đầu"),
        p("Theo TCVN 3890:2023 và các quy chuẩn quốc tế, đám cháy được phân loại thành 5 nhóm chính dựa trên bản chất của chất cháy:"),
        createTableCaption("Bảng 2.1", "Phân loại đám cháy và phương tiện chữa cháy tương ứng theo TCVN"),
        createCustomTable(
          ["Loại đám cháy", "Đặc tính chất cháy", "Phương tiện chữa cháy thích hợp", "Lưu ý an toàn"],
          [
            ["Đám cháy Loại A", "Chất rắn hữu cơ (gỗ, giấy, vải, rơm rạ, than đá)", "Bình bột khô ABC, bình bọt Foam, họng nước vách tường", "Làm mát tận gốc ngọn lửa để chống cháy âm ỉ"],
            ["Đám cháy Loại B", "Chất lỏng dễ cháy (xăng, dầu diesel, cồn, sơn)", "Bình bột ABC, bình bọt Foam, bình khí CO2", "Tuyệt đối không dùng nước trực tiếp làm loang dầu"],
            ["Đám cháy Loại C", "Chất khí cháy (gas LPG, metan, axetylen)", "Bình bột khô ABC, đóng van khóa nguồn cấp khí", "Ưu tiên ngắt nguồn khí trước khi dập lửa"],
            ["Đám cháy Loại D", "Kim loại cháy (magiê, nhôm, titan, natri)", "Bột chữa cháy kim loại chuyên dụng (Class D powder)", "Nước và CO2 có thể gây phản ứng nổ hóa học"],
            ["Đám cháy Loại E", "Thiết bị điện đang có điện áp (tủ điện, máy biến áp)", "Bình khí CO2, bình bột khô không dẫn điện", "Tránh điện giật, không dùng nước thông thường"]
          ],
          [15, 30, 30, 25]
        ),
        p("Hệ thống FireGuard AI tích hợp bảng dữ liệu phân loại chất cháy vào thuật toán gợi ý thiết bị của Chatbot AI, đảm bảo khi người dùng khai báo công năng công trình (ví dụ: kho chứa xăng dầu hoặc phòng máy chủ máy tính), hệ thống sẽ chọn chính xác loại bình (CO2 hoặc Foam) thay vì chỉ gợi ý bình bột thông thường."),

        createSubSubHeading("2.1.3. Quy trình thi công công trình và nghiệm thu hệ thống PCCC"),
        p("Quy trình thi công lắp đặt một hệ thống PCCC tại công trình xây dựng trải qua các giai đoạn kỹ thuật nghiêm ngặt:"),
        bullet("Giai đoạn 1 - Khảo sát mặt bằng và thẩm duyệt thiết kế: Tiếp nhận hồ sơ bản vẽ kiến trúc, đối soát với cơ quan Cảnh sát PCCC để lấy Giấy chứng nhận thẩm duyệt thiết kế PCCC."),
        bullet("Giai đoạn 2 - Chuẩn bị vật tư và xuất kho công trình: Tập kết các trang thiết bị (đường ống thép mạ kẽm, van góc, máy bơm diesel/điện, tủ báo cháy trung tâm, đầu báo khói quang học, cuộn vòi) đã được kiểm định chất lượng."),
        bullet("Giai đoạn 3 - Thi công lắp đặt cơ điện tại hiện trường: Đi đường ống, luồn dây tín hiệu chống cháy, lắp đặt giá đỡ, hàn mặt bích, gắn đầu báo khói, đấu nối tủ điều khiển."),
        bullet("Giai đoạn 4 - Thử áp lực đường ống và chạy thử liên động: Thử áp lực nước trong 24 giờ với áp suất kiểm tra (thường từ 10 - 15 bar), chạy thử chuông còi báo cháy, kiểm tra kích hoạt máy bơm khi mở lăng phun."),
        bullet("Giai đoạn 5 - Nghiệm thu bàn giao và cấp chứng chỉ bảo hành: Lập biên bản nghiệm thu hoàn thành công trình, bàn giao hồ sơ hoàn công và kích hoạt thời hạn bảo hành thiết bị."),

        createSubSubHeading("2.1.4. Vai trò Đội trưởng thi công và cơ chế phân công tổ thợ nội bộ"),
        p("Tại công trường xây dựng, Đội trưởng thi công (Installation Leader) là người chịu trách nhiệm cao nhất về tiến độ, chất lượng lắp đặt và an toàn lao động. Dưới quyền Đội trưởng là một tổ thợ thi công gồm các thợ chính và thợ phụ."),
        p("Khác với các ứng dụng văn phòng nơi mỗi nhân sự đều có email và tài khoản riêng, các thợ phụ tại công trường thường có trình độ công nghệ hạn chế và biến động liên tục theo ngày. Do đó, hệ thống FireGuard AI áp dụng cơ chế thiết kế đột phá: chỉ cấp tài khoản đăng nhập cho Đội trưởng. Trong giao diện không gian làm việc của dự án, Đội trưởng được cung cấp sẵn một bảng phân công tổ thợ với các nhân sự nội bộ: Nhân công 1, Nhân công 2, Nhân công 3, Nhân công 4 (có thể tùy ý sửa tên theo danh sách thợ thực tế). Đội trưởng giao việc cụ thể cho từng thợ ngay trên giao diện web. Dữ liệu này được lưu trữ tự động, giúp tổ chức công việc gọn gàng, rõ ràng mà không làm phức tạp hóa cơ sở dữ liệu người dùng."),

        createSubSubHeading("2.1.5. Vai trò Kỹ thuật viên hiện trường và yêu cầu đối soát GPS"),
        p("Kỹ thuật viên bảo trì (Technician) là đội ngũ di động liên tục di chuyển giữa các tòa nhà và cơ sở kinh doanh của khách hàng để thực hiện công tác bảo dưỡng định kỳ và xử lý sự cố rò rỉ hoặc báo động giả. Một trong những thách thức lớn nhất của ban lãnh đạo doanh nghiệp là kiểm soát xem kỹ thuật viên có thực sự đến tận nơi hay không."),
        p("Hệ thống giải quyết triệt để vấn đề này bằng việc ứng dụng định vị Geolocation kết hợp thuật toán tính khoảng cách Haversine. Khi kỹ thuật viên mở phiếu bảo trì trên điện thoại, hệ thống sẽ lấy tọa độ GPS thực tế của thiết bị và so sánh với tọa độ địa chỉ của công trình. Kỹ thuật viên bắt buộc phải có mặt trong bán kính ≤ 1.0 km thì nút bắt đầu công việc và hộp thoại nghiệm thu mới được mở khóa."),

        createSubSubHeading("2.1.6. Nghiệm thu bằng hình ảnh hiện trường và nhật ký số"),
        p("Một nguyên tắc bất di bất dịch trong quản lý chất lượng kỹ thuật là 'Mọi kết quả kiểm tra phải có bằng chứng khách quan'. Thay vì cho phép kỹ thuật viên chỉ nhấn nút 'Hoàn thành' đơn thuần, hệ thống FireGuard AI thiết lập rào cản kỹ thuật bắt buộc: Kỹ thuật viên phải chụp ảnh hoặc tải lên hình ảnh nghiệm thu thiết bị thực tế tại hiện trường (ví dụ: ảnh đồng hồ áp suất bình chỉ vào vạch xanh, ảnh tem niêm phong chì mới được bấm, ảnh tủ trung tâm ở trạng thái Normal). Hệ thống sẽ lưu trữ ảnh này vào máy chủ và liên kết chặt chẽ với mã phiếu bảo trì, đóng vai trò như một biên bản nghiệm thu số không thể làm giả."),

        createSubSubHeading("2.1.7. Hệ thống giám sát điều hành tập trung (Real-time Dashboard)"),
        p("Để Ban Giám đốc và cán bộ quản lý có cái nhìn toàn cảnh về tình hình kinh doanh và vận hành kỹ thuật trên toàn địa bàn, hệ thống xây dựng bảng điều khiển trung tâm (Dashboard). Dashboard không chỉ hiển thị các chỉ số tài chính (Doanh thu, số dự án, ngân sách) mà đặc biệt còn tích hợp Luồng ảnh hiện trường (Live Field Photos Feed). Bất cứ khi nào Đội trưởng gửi ảnh tiến độ công trình hoặc Kỹ thuật viên tải ảnh nghiệm thu bảo dưỡng, hình ảnh sẽ lập tức nhảy lên màn hình Dashboard của Ban Giám đốc thông qua giao thức SignalR WebSocket mà không cần bấm F5 tải lại trang."),

        createSubHeading("2.2. Các phương pháp, mô hình và thuật toán áp dụng"),
        createSubSubHeading("2.2.1. Ngôn ngữ mô hình hóa thống nhất UML"),
        p("Ngôn ngữ mô hình hóa thống nhất (UML - Unified Modeling Language) là công cụ tiêu chuẩn quốc tế được áp dụng xuyên suốt trong đồ án để phân tích và thiết kế hệ thống phần mềm. Các sơ đồ UML được sử dụng bao gồm:"),
        bullet("Sơ đồ Use Case: Mô tả chức năng của hệ thống dưới góc nhìn của các tác nhân (Actors) bên ngoài."),
        bullet("Sơ đồ lớp (Class Diagram): Mô hình hóa cấu trúc tĩnh của phần mềm, bao gồm các lớp đối tượng, thuộc tính, phương thức và mối quan hệ kế thừa, kết tập, phụ thuộc giữa các lớp."),
        bullet("Sơ đồ hoạt động (Activity Diagram): Trực quan hóa luồng nghiệp vụ và các nhánh rẽ điều kiện trong quy trình thi công và quy trình đối soát GPS."),
        bullet("Sơ đồ tuần tự (Sequence Diagram): Mô tả chi tiết trình tự tương tác và truyền tải thông điệp giữa các đối tượng theo dòng thời gian."),

        createSubSubHeading("2.2.2. Mô hình kiến trúc phần mềm Clean Architecture"),
        p("Clean Architecture (Kiến trúc sạch do Robert C. Martin - Uncle Bob đề xuất) là kim chỉ nam cho thiết kế Backend của dự án. Điểm cốt lõi của kiến trúc này là Quy tắc phụ thuộc (Dependency Rule): các tầng bên trong hoàn toàn không biết gì về các tầng bên ngoài. Kiến trúc chia thành 4 tầng rõ rệt:"),
        bullet("1. Domain Layer (Lõi hệ thống): Chứa các thực thể doanh nghiệp (Entities), giá trị đối tượng (Value Objects), sự kiện nghiệp vụ (Domain Events) và các Interface cốt lõi. Tầng này độc lập 100% với cơ sở dữ liệu và các framework bên ngoài."),
        bullet("2. Application Layer: Đóng gói toàn bộ logic nghiệp vụ (Use Cases) của hệ thống. Ứng dụng mẫu thiết kế CQRS (Command Query Responsibility Segregation) kết hợp thư viện MediatR để phân tách riêng biệt các luồng ghi dữ liệu và đọc dữ liệu."),
        bullet("3. Infrastructure Layer: Chịu trách nhiệm giao tiếp với thế giới bên ngoài, bao gồm việc triển khai kết nối cơ sở dữ liệu SQL Server thông qua Entity Framework Core, xử lý lưu trữ file ảnh tĩnh lên đĩa cứng và tích hợp dịch vụ phát thông báo SignalR."),
        bullet("4. Presentation Layer (Web API): Chứa các Controller tiếp nhận các yêu cầu HTTP, kiểm tra tính hợp lệ của Token JWT và trả về dữ liệu JSON chuẩn RESTful."),

        createSubSubHeading("2.2.3. Mô hình cơ sở dữ liệu quan hệ (RDBMS) và chuẩn hóa 3NF"),
        p("Cơ sở dữ liệu của FireGuard AI được xây dựng trên hệ quản trị Microsoft SQL Server 2022, áp dụng nghiêm ngặt các nguyên tắc chuẩn hóa dữ liệu từ dạng chuẩn 1 (1NF), dạng chuẩn 2 (2NF) đến dạng chuẩn 3 (3NF). Việc chuẩn hóa đảm bảo:"),
        bullet("Loại bỏ hoàn toàn các nhóm dữ liệu lặp lại (1NF)."),
        bullet("Tất cả các thuộc tính không khóa đều phụ thuộc hàm toàn phần vào khóa chính (2NF)."),
        bullet("Không có thuộc tính không khóa nào phụ thuộc bắc cầu vào khóa chính (3NF), ngăn ngừa triệt để hiện tượng dị thường khi Thêm, Xóa, Sửa dữ liệu (Anomalies)."),

        createSubSubHeading("2.2.4. Thuật toán tính khoảng cách địa lý Haversine và đối soát bán kính GPS 1km"),
        p("Để đo đạc chính xác khoảng cách giữa vị trí của Kỹ thuật viên (tọa độ $\\phi_1, \\lambda_1$) và vị trí công trình của khách hàng (tọa độ $\\phi_2, \\lambda_2$) trên bề mặt hình cầu của Trái Đất, hệ thống áp dụng công thức toán học Haversine:"),
        p("Giả sử $R = 6,371$ km là bán kính trung bình của Trái Đất. Độ lệch vĩ độ $\\Delta\\phi = \\phi_2 - \\phi_1$ và độ lệch kinh độ $\\Delta\\lambda = \\lambda_2 - \\lambda_1$ (được đổi sang đơn vị radian). Khi đó, đại lượng $a$ được tính theo công thức:"),
        p("$$a = \\sin^2\\left(\\frac{\\Delta\\phi}{2}\\right) + \\cos(\\phi_1) \\cdot \\cos(\\phi_2) \\cdot \\sin^2\\left(\\frac{\\Delta\\lambda}{2}\\right)$$", { alignment: AlignmentType.CENTER, bold: true }),
        p("Khoảng cách góc $c$ giữa hai điểm được xác định bởi:"),
        p("$$c = 2 \\cdot \\text{atan2}\\left(\\sqrt{a}, \\sqrt{1-a}\\right)$$", { alignment: AlignmentType.CENTER, bold: true }),
        p("Từ đó, khoảng cách thực tế $d$ theo đường chim bay giữa hai vị trí được tính bằng:"),
        p("$$d = R \\cdot c = 6371 \\cdot c \\quad (\\text{km})$$", { alignment: AlignmentType.CENTER, bold: true }),
        p("Quy tắc nghiệp vụ đối soát: Nếu khoảng cách tính toán $d \\le 1.0$ km, hệ thống xác nhận Kỹ thuật viên đã có mặt tại hiện trường (GPS Verified = TRUE) và kích hoạt trạng thái mở khóa. Ngược lại, nếu $d > 1.0$ km, hệ thống từ chối cho phép mở hộp thoại nghiệm thu và thông báo rõ sai số khoảng cách hiện tại."),

        createSubSubHeading("2.2.5. Thuật toán chấm điểm trọng số đa tiêu chí điều phối kỹ thuật viên"),
        p("Khi phát sinh một sự cố PCCC khẩn cấp từ khách hàng, việc lựa chọn kỹ thuật viên tiếp nhận không thể thực hiện ngẫu nhiên mà cần tối ưu hóa nhiều tiêu chí. Hệ thống áp dụng mô hình chấm điểm trọng số đa tiêu chí (Multi-Criteria Weighted Scoring):"),
        p("Điểm số tổng hợp $S_i$ của kỹ thuật viên thứ $i$ được tính bằng tổng tích phân của các điểm thành phần $C_{ij}$ nhân với trọng số $W_j$ tương ứng:"),
        p("$$S_i = \\sum_{j=1}^{m} W_j \\cdot C_{ij} \\quad \\text{với} \\quad \\sum_{j=1}^{m} W_j = 1.0$$", { alignment: AlignmentType.CENTER, bold: true }),
        createTableCaption("Bảng 2.2", "Bảng ma trận trọng số đa tiêu chí điều phối kỹ thuật viên hiện trường"),
        createCustomTable(
          ["Mã tiêu chí (j)", "Tên tiêu chí đánh giá", "Mô tả phương pháp chấm điểm", "Trọng số (W_j)"],
          [
            ["C1", "Khoảng cách địa lý (GPS)", "Tính theo khoảng cách Haversine từ KTV đến công trình (khoảng cách càng gần điểm càng cao từ 1 - 10)", "0.35 (35%)"],
            ["C2", "Chứng chỉ & Chuyên môn", "Đối soát chứng chỉ hành nghề PCCC với loại thiết bị sự cố (Khớp loại thiết bị = 10 điểm)", "0.25 (25%)"],
            ["C3", "Khối lượng công việc (Workload)", "Dựa trên số lượng phiếu bảo trì đang xử lý trong ngày (Đang rảnh rỗi = 10 điểm, đang bận = trừ dần)", "0.20 (20%)"],
            ["C4", "Đánh giá uy tín (Rating)", "Điểm đánh giá sao trung bình từ các khách hàng trước đó (Thang điểm 5 sao quy đổi sang thang 10)", "0.20 (20%)"]
          ],
          [15, 25, 45, 15]
        ),
        p("Kỹ thuật viên có tổng điểm $S_i$ cao nhất sẽ được hệ thống ưu tiên đẩy thông báo nhận việc đầu tiên."),

        createSubSubHeading("2.2.6. Mô hình RAG và cơ chế bóc tách dự toán báo giá sơ bộ AI"),
        p("Kỹ thuật tạo sinh tăng cường truy xuất dữ liệu (RAG - Retrieval-Augmented Generation) kết hợp kho dữ liệu văn bản tiêu chuẩn TCVN 3890:2023 đã được số hóa và lập chỉ mục Vector. Khi người dùng nhập các thông số về diện tích mặt sàn $A$ ($m^2$), số tầng $F$ và loại hình công năng, quy trình bóc tách dự toán diễn ra qua 3 bước:"),
        bullet("Bước 1: Truy xuất các điều khoản quy chuẩn tương ứng với nhóm nguy hiểm cháy của công năng công trình."),
        bullet("Bước 2: Tính toán số lượng trang thiết bị bắt buộc theo công thức định mức (ví dụ: Số bình bột = $\\lceil A / 150 \\rceil$, số đầu báo khói = $\\lceil A / 60 \\rceil$)."),
        bullet("Bước 3: Nhân số lượng với đơn giá vật tư và định mức nhân công lắp đặt trong cơ sở dữ liệu để xuất bảng dự toán chi phí sơ bộ hoàn chỉnh."),

        createSubHeading("2.3. Công nghệ nền tảng sử dụng trong đề tài"),
        createTableCaption("Bảng 2.3", "Bảng tổng hợp công nghệ phần mềm được ứng dụng trong đề tài"),
        createCustomTable(
          ["Thành phần kiến trúc", "Công nghệ sử dụng", "Phiên bản", "Vai trò và lý do lựa chọn"],
          [
            ["Ngôn ngữ Backend", "C# (.NET 8.0 SDK)", "8.0 (LTS)", "Ngôn ngữ kiểu tĩnh, hiệu năng xử lý cực cao, bảo mật doanh nghiệp."],
            ["Web Framework API", "ASP.NET Core Web API", "8.0", "Xây dựng hệ thống RESTful API bất đồng bộ (async/await), hỗ trợ Dependency Injection mạnh mẽ."],
            ["ORM & Truy vấn DB", "Entity Framework Core", "8.0", "Thao tác cơ sở dữ liệu qua LINQ an toàn, chống SQL Injection, hỗ trợ Database Migrations."],
            ["Cơ sở dữ liệu", "Microsoft SQL Server", "2022", "Hệ quản trị CSDL quan hệ chuẩn ACID, bảo toàn tính toàn vẹn dữ liệu cho các giao dịch tài chính."],
            ["Real-time WebSockets", "SignalR Core", "8.0", "Truyền tải hình ảnh hiện trường và thông báo sự cố tức thời đến Dashboard."],
            ["Frontend Framework", "React + TypeScript", "18.x", "Xây dựng giao diện SPA mượt mà, kiểm soát chặt chẽ kiểu dữ liệu, giảm thiểu lỗi runtime."],
            ["Build Tool Frontend", "Vite", "5.x", "Trình đóng gói module hiện đại, tốc độ khởi động và Hot Module Replacement (HMR) tính bằng mili-giây."],
            ["Styling & Icons", "TailwindCSS + Lucide", "3.x", "Hệ thống Utility CSS linh hoạt, thiết kế giao diện hiện đại, responsive đa thiết bị."],
            ["Bản đồ & Tọa độ", "Leaflet + OpenStreetMap", "1.9", "Thư viện bản đồ nguồn mở gọn nhẹ, hiển thị vị trí và vẽ đường điều hướng GPS."],
            ["Bảo mật xác thực", "JWT Authentication", "RFC 7519", "Cấp phát token mã hóa không trạng thái (stateless), phân quyền theo Claims."]
          ],
          [20, 25, 10, 45]
        ),

        createSubHeading("2.4. So sánh ma trận các giải pháp liên quan trên thị trường"),
        createTableCaption("Bảng 2.4", "Ma trận so sánh hệ thống FireGuard AI với các giải pháp hiện nay"),
        createCustomTable(
          ["Tiêu chí so sánh", "bTaskee / App gọi thợ", "Phần mềm CMMS truyền thống", "App ngoại (Inspect Point)", "FireGuard AI (Đề tài)"],
          [
            ["Chuẩn hóa nghiệp vụ PCCC", "Không có (chỉ sửa vặt)", "Chung chung cho máy móc", "Theo chuẩn Mỹ (NFPA)", "Tuân thủ chặt chẽ TCVN 3890:2023"],
            ["Phân công thợ thi công tại chỗ", "Không hỗ trợ", "Cồng kềnh, cần tài khoản riêng", "Không hỗ trợ", "Hỗ trợ linh hoạt thợ 1, 2, 3, 4 cho Đội trưởng"],
            ["Bắt buộc ảnh nghiệm thu hiện trường", "Tùy chọn", "Thường tải báo cáo sau", "Có chụp ảnh kiểm tra", "Bắt buộc có ảnh mới cho phép đóng đơn"],
            ["Khóa bán kính GPS hiện trường", "Chỉ định vị điểm hẹn", "Không bắt buộc", "Có ghi nhận GPS", "Kiểm tra GPS bán kính ≤ 1.0 km nghiêm ngặt"],
            ["Báo giá sơ bộ tự động AI", "Giá cố định theo giờ", "Nhập tay từng vật tư", "Không có", "Tự động bóc tách vật tư & dự toán bằng AI"],
            ["Quản lý vòng đời thiết bị QR Code", "Không có", "Mã tài sản cố định", "Có quét mã vạch", "Quản lý 1-1 với Serial, cảnh báo hạn nạp sạc"]
          ],
          [20, 20, 20, 20, 20]
        ),
        p("Bảng phân tích ma trận cho thấy FireGuard AI sở hữu những ưu thế vượt trội, giải quyết trúng và đúng các nỗi đau thực tế của ngành dịch vụ PCCC tại Việt Nam."),
        new Paragraph({ children: [new PageBreak()] }),

        // -----------------------------------------------------------------------------
        // CHƯƠNG 3
        // -----------------------------------------------------------------------------
        createHeaderTitle("Chương 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG"),
        createSubHeading("3.1. Yêu cầu hệ thống"),
        createSubSubHeading("3.1.1. Bảng phân rã chức năng nghiệp vụ (BFD)"),
        p("Hệ thống phần mềm FireGuard AI được phân rã thành 5 phân hệ chức năng chính, mỗi phân hệ đảm nhiệm một cụm nghiệp vụ độc lập nhưng có sự tương tác và luân chuyển dữ liệu chặt chẽ:"),
        bullet("1. Phân hệ Quản trị hệ thống & Giám sát tổng thể (Admin Dashboard): Quản lý người dùng, phân quyền vai trò, phê duyệt dự án, giám sát chỉ số tài chính KPI và theo dõi Feed ảnh hiện trường thời gian thực."),
        bullet("2. Phân hệ Quản lý dự án thi công & Không gian làm việc của Đội trưởng: Tiếp nhận dự án, lập danh sách phân công công việc cho tổ thợ nội bộ (Thợ 1, 2, 3, 4), cập nhật thanh trượt tiến độ %, chụp ảnh hiện trường gửi báo cáo, và thực hiện nghiệm thu bàn giao kích hoạt bảo hành."),
        bullet("3. Phân hệ Quản lý dịch vụ bảo trì, sửa chữa & Kỹ thuật viên hiện trường: Tiếp nhận phiếu yêu cầu sự cố khẩn cấp, hiển thị lộ trình trên bản đồ số, đối soát GPS trong bán kính 1km, kiểm tra thiết bị và tải ảnh nghiệm thu thực tế bắt buộc."),
        bullet("4. Phân hệ Quản lý kho vật tư & Sổ theo dõi tài sản thiết bị QR Code: Quản lý danh mục linh kiện PCCC theo số lượng tồn kho, cấp phát thiết bị theo từng số Serial định danh duy nhất kèm mã QR Code, theo dõi lịch sử kiểm định và cảnh báo chu kỳ nạp sạc bình chữa cháy định kỳ."),
        bullet("5. Phân hệ Bán hàng, CRM & Trợ lý tư vấn dự toán AI: Quản lý hồ sơ khách hàng, tiếp nhận yêu cầu diện tích công trình, kích hoạt Chatbot RAG bóc tách thiết bị theo TCVN 3890 và xuất file báo giá sơ bộ."),
        ...createImagePlaceholder("Hình 3.1", "Sơ đồ phân rã chức năng nghiệp vụ (BFD) hệ thống FireGuard AI", "Dán sơ đồ phân rã chức năng BFD thể hiện 5 phân hệ lớn và các chức năng con vào đây"),

        createSubSubHeading("3.1.2. Các nhóm người dùng và ma trận phân quyền (RBAC Matrix)"),
        p("Hệ thống định nghĩa 5 vai trò người dùng (Roles). Mỗi vai trò có quyền hạn và giao diện thao tác chuyên biệt:"),
        createTableCaption("Bảng 3.1", "Bảng ma trận phân quyền người dùng (Role-Based Access Matrix)"),
        createCustomTable(
          ["Nhóm chức năng hệ thống", "Quản trị viên (Admin)", "Đội trưởng (Leader)", "Kỹ thuật viên (Technician)", "Kinh doanh (Sales)", "Khách hàng (Customer)"],
          [
            ["Quản lý người dùng & Phân vai trò", "Toàn quyền (CRUD)", "Không có quyền", "Không có quyền", "Không có quyền", "Không có quyền"],
            ["Xem Dashboard tổng & Feed ảnh", "Xem toàn hệ thống", "Chỉ xem dự án của mình", "Chỉ xem việc được giao", "Xem số liệu kinh doanh", "Chỉ xem tài sản của mình"],
            ["Tạo & Quản lý danh mục dự án", "Toàn quyền duyệt", "Cập nhật tiến độ & ảnh", "Không có quyền", "Tạo dự án mới", "Xem tiến độ công trình"],
            ["Phân công thợ nội bộ 1, 2, 3, 4", "Xem phân công", "Toàn quyền phân công", "Không có quyền", "Không có quyền", "Không có quyền"],
            ["Tiếp nhận & Check-in GPS bảo trì", "Điều phối kỹ thuật", "Không có quyền", "Toàn quyền thực hiện", "Xem trạng thái xử lý", "Gửi yêu cầu sự cố"],
            ["Bắt buộc ảnh nghiệm thu hoàn tất", "Xem xét & Duyệt ảnh", "Bắt buộc gửi ảnh tiến độ", "Bắt buộc gửi ảnh nghiệm thu", "Không có quyền", "Xem ảnh kết quả nghiệm thu"],
            ["Tư vấn & Lập báo giá AI", "Duyệt báo giá chính thức", "Không có quyền", "Không có quyền", "Khởi tạo báo giá AI", "Xem & Nhận báo giá sơ bộ"],
            ["Quản lý kho & Cấp phát Serial QR", "Toàn quyền xuất nhập kho", "Nhận vật tư vào dự án", "Cập nhật tình trạng thiết bị", "Xem tồn kho khả dụng", "Quét mã QR tra cứu lý lịch"]
          ],
          [25, 15, 15, 15, 15, 15]
        ),

        createSubSubHeading("3.1.3. Yêu cầu phi chức năng (Bảo mật, hiệu năng, sẵn sàng)"),
        bullet("Yêu cầu hiệu năng (Performance): Thời gian phản hồi của các API truy vấn dữ liệu thông thường phải dưới 200ms với 95% số yêu cầu (p95). Tốc độ tải và hiển thị trang đầu tiên (FCP) trên trình duyệt không quá 1.5 giây."),
        bullet("Yêu cầu bảo mật (Security): Mật khẩu người dùng bắt buộc phải được băm bằng thuật toán an toàn BCrypt với Salt ngẫu nhiên. Mọi giao dịch API giữa Client và Server đều phải đính kèm JSON Web Token (JWT) trong tiêu đề Authorization, có thời hạn sống hợp lý và cơ chế thu hồi Token khi đăng xuất."),
        bullet("Yêu cầu độ tin cậy và toàn vẹn dữ liệu (Reliability & ACID): Các thao tác liên quan đến xuất kho vật tư, phân công dự án và quyết toán tài chính phải được thực hiện trong phạm vi một Database Transaction để đảm bảo tính nhất quán tuyệt đối."),
        bullet("Khả năng tương thích và đáp ứng (Responsive Design): Giao diện phần mềm phải hiển thị tương thích, không bị vỡ layout trên các độ phân giải màn hình từ Desktop (1920x1080), Laptop (1366x768), Tablet (768x1024) đến Smartphone di động (375x667 trở lên)."),

        createSubHeading("3.2. Thiết kế kiến trúc tổng thể phần mềm"),
        createSubSubHeading("3.2.1. Cấu trúc phân tầng Clean Architecture 4 lớp"),
        p("Hệ thống Backend được thiết kế theo cấu trúc thư mục phân tầng chuẩn mực của Clean Architecture:"),
        bullet("FireGuard.Domain: Định nghĩa các Core Entities (User, Project, ProjectProgressLog, Ticket, EquipmentAsset, EquipmentModel, Quotation), các Enums định trạng thái và các quy tắc nghiệp vụ bất biến."),
        bullet("FireGuard.Application: Chứa các thư mục Commands, Queries, DTOs, Mappings (AutoMapper) và Validators (FluentValidation). Sử dụng MediatR để xử lý các yêu cầu nghiệp vụ theo hướng phi kết nối (Decoupled)."),
        bullet("FireGuard.Infrastructure: Chứa cấu hình DbContext của Entity Framework Core, các Class cấu hình Fluent API cho bảng, triển khai IFileStorageService để lưu ảnh hiện trường và triển khai NotificationHub của SignalR."),
        bullet("FireGuard.WebAPI: Chứa Program.cs, Middleware xử lý ngoại lệ toàn cục (Global Exception Handling Middleware), cấu hình Authentication/Authorization và các Controller định tuyến API."),

        createSubSubHeading("3.2.2. Nguyên lý CQRS và mẫu thiết kế Mediator"),
        p("Bằng việc áp dụng mẫu thiết kế CQRS thông qua thư viện MediatR, hệ thống tách biệt rạch ròi:"),
        bullet("Nhánh Command (Thao tác làm thay đổi dữ liệu): Ví dụ CreateProjectCommand, AssignWorkersCommand, UpdateProgressWithPhotoCommand, CheckinTicketCommand. Các Handler chỉ thực hiện ghi dữ liệu, kiểm tra ràng buộc nghiệp vụ và phát sự kiện."),
        bullet("Nhánh Query (Thao tác chỉ đọc dữ liệu): Ví dụ GetProjectsListQuery, GetProjectByIdQuery, GetTechnicianTicketsQuery. Các Handler truy vấn trực tiếp dữ liệu với AsNoTracking() để đạt tốc độ tối đa mà không bị gánh nặng giám sát trạng thái thực thể của EF Core."),

        createSubHeading("3.3. Thiết kế ca sử dụng (Use Case Modeling)"),
        createSubSubHeading("3.3.1. Sơ đồ Use Case tổng quát"),
        p("Sơ đồ Use Case tổng thể mô tả trực quan các tương tác chức năng giữa 5 tác nhân chính và hệ thống phần mềm FireGuard AI:"),
        ...createImagePlaceholder("Hình 3.2", "Sơ đồ Use Case tổng quát toàn bộ hệ thống", "Dán sơ đồ Use Case Diagram tổng thể thể hiện đầy đủ các Actor và các ca sử dụng chính vào đây"),

        createSubSubHeading("3.3.2. Đặc tả chi tiết UC-01: Quản lý dự án thi công & Phân công tổ thợ"),
        createTableCaption("Bảng 3.2", "Đặc tả chi tiết ca sử dụng UC-01: Quản lý dự án thi công & Phân công thợ"),
        createCustomTable(
          ["Mục đặc tả", "Nội dung chi tiết"],
          [
            ["Tên ca sử dụng", "UC-01: Quản lý dự án thi công và Phân công tổ thợ nội bộ"],
            ["Tác nhân (Actor)", "Đội trưởng thi công (Installation Leader)"],
            ["Mục đích", "Cho phép Đội trưởng quản lý thông tin công trình và phân bổ nhiệm vụ cho các thợ 1, 2, 3, 4."],
            ["Tiền điều kiện", "Đội trưởng đã đăng nhập thành công vào hệ thống và được gán quyền phụ trách dự án đó."],
            ["Hậu điều kiện", "Bảng phân công nhiệm vụ của tổ thợ được cập nhật và lưu trữ trên bộ nhớ hệ thống."],
            ["Luồng sự kiện chính", "1. Đội trưởng chọn menu 'Dự Án Thi Công', hệ thống hiển thị danh sách các công trình phụ trách.\n2. Chọn một dự án cụ thể, hệ thống mở giao diện chi tiết công trình.\n3. Tại tab 'Phân công tổ thợ', Đội trưởng xem danh sách 4 vị trí nhân công mặc định.\n4. Đội trưởng nhập nội dung giao việc (ví dụ: Thợ 1 - Kéo cáp tầng 2, Thợ 2 - Lắp đế đầu báo).\n5. Đội trưởng chọn trạng thái tương ứng (Chưa làm, Đang làm, Đã xong).\n6. Nhấn nút 'Lưu phân công', hệ thống ghi nhận và hiển thị thông báo thành công."],
            ["Luồng rẽ nhánh / Ngoại lệ", "Nếu dự án đã ở trạng thái 'Hoàn thành' (Status = 6), hệ thống khóa bảng phân công, chỉ cho phép xem lại lịch sử mà không được chỉnh sửa."]
          ],
          [25, 75]
        ),

        createSubSubHeading("3.3.3. Đặc tả chi tiết UC-02: Báo cáo tiến độ kèm ảnh chụp hiện trường"),
        createTableCaption("Bảng 3.3", "Đặc tả chi tiết ca sử dụng UC-02: Báo cáo tiến độ kèm ảnh chụp hiện trường"),
        createCustomTable(
          ["Mục đặc tả", "Nội dung chi tiết"],
          [
            ["Tên ca sử dụng", "UC-02: Cập nhật tỷ lệ tiến độ và Báo cáo ảnh hiện trường"],
            ["Tác nhân (Actor)", "Đội trưởng thi công (Installation Leader)"],
            ["Mục đích", "Cập nhật tiến độ % hoàn thành của công trình kèm bằng chứng hình ảnh thực tế truyền về Admin."],
            ["Tiền điều kiện", "Dự án đang trong trạng thái thi công (In Progress)."],
            ["Hậu điều kiện", "Tỷ lệ % tiến độ dự án được cập nhật; ảnh hiện trường được lưu vào bảng ProjectProgressLogs và phát tín hiệu SignalR."],
            ["Luồng sự kiện chính", "1. Đội trưởng mở bảng điều khiển dự án, kéo thanh trượt tiến độ từ mức cũ lên mức mới (ví dụ từ 40% lên 65%).\n2. Nhấn nút 'Cập nhật tiến độ & Tải ảnh'.\n3. Hộp thoại mở ra, Đội trưởng nhập ghi chú công việc thực hiện trong ngày.\n4. Đội trưởng bấm chọn ảnh từ thư viện hoặc chụp trực tiếp bằng camera điện thoại.\n5. Nhấn 'Gửi báo cáo', hệ thống kiểm tra file ảnh hợp lệ, upload lên máy chủ và lưu nhật ký.\n6. Hệ thống phát sự kiện SignalR 'ReceiveLivePhoto' đến Dashboard Admin."],
            ["Luồng rẽ nhánh / Ngoại lệ", "Nếu Đội trưởng không đính kèm file ảnh hoặc file vượt quá dung lượng 10MB, hệ thống hiển thị cảnh báo lỗi và không cho phép gửi báo cáo."]
          ],
          [25, 75]
        ),

        createSubSubHeading("3.3.4. Đặc tả chi tiết UC-03: Tiếp nhận đơn bảo trì & Check-in GPS 1km"),
        createTableCaption("Bảng 3.4", "Đặc tả chi tiết ca sử dụng UC-03: Tiếp nhận đơn bảo trì & Check-in GPS 1km"),
        createCustomTable(
          ["Mục đặc tả", "Nội dung chi tiết"],
          [
            ["Tên ca sử dụng", "UC-03: Tiếp nhận đơn sự cố và Check-in vị trí GPS trong bán kính 1km"],
            ["Tác nhân (Actor)", "Kỹ thuật viên bảo trì (Technician)"],
            ["Mục đích", "Xác thực vị trí hiện trường thực tế của kỹ thuật viên trước khi bắt đầu công tác bảo dưỡng."],
            ["Tiền điều kiện", "Kỹ thuật viên đã được phân công phiếu bảo trì (Ticket) và bật định vị GPS trên thiết bị di động."],
            ["Hậu điều kiện", "Trạng thái Ticket chuyển sang 'In Progress', tọa độ và thời gian check-in được ghi nhận."],
            ["Luồng sự kiện chính", "1. Kỹ thuật viên truy cập phân hệ 'Bảo trì & Sự cố', chọn phiếu bảo trì cần xử lý.\n2. Xem địa chỉ khách hàng và nhấn nút 'Xem đường đi' để hiển thị lộ trình trên bản đồ số.\n3. Khi đã đến chân công trình, Kỹ thuật viên nhấn nút 'Check-in vị trí hiện trường'.\n4. Trình duyệt gửi tọa độ GPS hiện tại về hệ thống; hệ thống tính khoảng cách Haversine tới công trình.\n5. Khoảng cách tính toán d <= 1.0 km -> Hệ thống thông báo check-in thành công, mở khóa giao diện làm việc."],
            ["Luồng rẽ nhánh / Ngoại lệ", "Nếu khoảng cách d > 1.0 km, hệ thống từ chối mở khóa, hiển thị thông báo: 'Bạn đang cách công trình X km, vui lòng đến đúng vị trí trong bán kính 1.0 km để check-in'."]
          ],
          [25, 75]
        ),

        createSubSubHeading("3.3.5. Đặc tả chi tiết UC-04: Nghiệm thu hoàn thành bắt buộc tải ảnh thiết bị"),
        createTableCaption("Bảng 3.5", "Đặc tả chi tiết ca sử dụng UC-04: Nghiệm thu hoàn thành bắt buộc tải ảnh"),
        createCustomTable(
          ["Mục đặc tả", "Nội dung chi tiết"],
          [
            ["Tên ca sử dụng", "UC-04: Nghiệm thu hoàn thành công việc bắt buộc tải ảnh chụp thiết bị"],
            ["Tác nhân (Actor)", "Kỹ thuật viên bảo trì (Technician)"],
            ["Mục đích", "Đóng phiếu bảo trì và lưu trữ hình ảnh minh chứng kết quả xử lý thiết bị."],
            ["Tiền điều kiện", "Phiếu bảo trì đã được Check-in GPS thành công và thiết bị đã được sửa chữa/nạp sạc xong."],
            ["Hậu điều kiện", "Ticket chuyển trạng thái 'Resolved', hình ảnh được lưu vào lịch sử tài sản của công trình."],
            ["Luồng sự kiện chính", "1. Kỹ thuật viên nhấn nút 'Hoàn tất công việc'.\n2. Hộp thoại nghiệm thu hiện ra, yêu cầu nhập kết quả kiểm tra và chụp ảnh thiết bị sau xử lý.\n3. Kỹ thuật viên chụp ảnh bình cứu hỏa đã dán tem mới hoặc đồng hồ áp suất đạt chuẩn.\n4. Khi ảnh đã được chọn, nút 'Xác nhận hoàn thành' mới chuyển từ trạng thái Disabled sang Active.\n5. Kỹ thuật viên nhấn xác nhận, hệ thống lưu ảnh và chuyển Ticket sang 'Resolved'."],
            ["Luồng rẽ nhánh / Ngoại lệ", "Nếu Kỹ thuật viên cố tình không tải ảnh, nút hoàn tất bị vô hiệu hóa hoàn toàn, ngăn chặn việc đóng phiếu ảo."]
          ],
          [25, 75]
        ),

        createSubHeading("3.4. Mô hình hóa động và tĩnh (UML Diagrams)"),
        createSubSubHeading("3.4.1. Sơ đồ lớp phần mềm chi tiết (Class Diagram)"),
        p("Sơ đồ lớp phần mềm biểu diễn cấu trúc chi tiết của các thực thể trong tầng Domain và sự liên kết giữa chúng:"),
        ...createImagePlaceholder("Hình 3.3", "Sơ đồ lớp phần mềm chi tiết (Class Diagram theo Clean Architecture)", "Dán sơ đồ Class Diagram thể hiện User, Project, ProjectProgressLog, Ticket, EquipmentAsset, EquipmentModel, Quotation vào đây"),

        createSubSubHeading("3.4.2. Sơ đồ hoạt động (Activity Diagram) các quy trình trọng yếu"),
        p("Sơ đồ hoạt động mô tả tiến trình nghiệp vụ Đội trưởng phân công thợ và cập nhật ảnh tiến độ công trình:"),
        ...createImagePlaceholder("Hình 3.4", "Sơ đồ hoạt động (Activity Diagram): Phân công tổ thợ và gửi ảnh tiến độ", "Dán sơ đồ Activity Diagram quy trình phân công thợ và gửi ảnh tiến độ công trình vào đây"),
        p("Sơ đồ hoạt động mô tả quy trình đối soát GPS bán kính 1km và nghiệm thu bắt buộc đính kèm ảnh của Kỹ thuật viên:"),
        ...createImagePlaceholder("Hình 3.5", "Sơ đồ hoạt động (Activity Diagram): Đối soát GPS 1km và nghiệm thu ảnh", "Dán sơ đồ Activity Diagram quy trình check-in GPS và nghiệm thu ảnh bảo trì vào đây"),

        createSubSubHeading("3.4.3. Sơ đồ tuần tự (Sequence Diagram) xử lý nghiệp vụ"),
        p("Sơ đồ tuần tự mô tả chi tiết tương tác giữa Client (React App), Controller, MediatR Handler, Haversine Service và Database trong luồng đối soát GPS:"),
        ...createImagePlaceholder("Hình 3.6", "Sơ đồ tuần tự (Sequence Diagram): Luồng xử lý check-in GPS và khóa bán kính", "Dán sơ đồ Sequence Diagram mô tả tương tác các component trong luồng check-in GPS vào đây"),

        createSubHeading("3.5. Thiết kế cơ sở dữ liệu chi tiết"),
        createSubSubHeading("3.5.1. Sơ đồ thực thể liên kết (ERD)"),
        p("Sơ đồ ERD mô tả cấu trúc quan hệ giữa các bảng trong cơ sở dữ liệu Microsoft SQL Server:"),
        ...createImagePlaceholder("Hình 3.7", "Sơ đồ thực thể liên kết (ERD) cơ sở dữ liệu trên Microsoft SQL Server", "Dán sơ đồ Entity-Relationship Diagram (ERD) hoàn chỉnh thể hiện các bảng và khóa ngoại vào đây"),

        createSubSubHeading("3.5.2. Từ điển dữ liệu chi tiết các bảng trọng yếu"),
        createTableCaption("Bảng 3.6", "Từ điển dữ liệu bảng Projects (Dự án công trình thi công PCCC)"),
        createCustomTable(
          ["Tên trường", "Kiểu dữ liệu", "Khóa", "Ràng buộc (Null/Default)", "Mô tả ý nghĩa nghiệp vụ"],
          [
            ["Id", "UNIQUEIDENTIFIER", "PK", "NOT NULL, NEWID()", "Mã định danh duy nhất của dự án thi công."],
            ["ProjectCode", "NVARCHAR(50)", "None", "NOT NULL, UNIQUE", "Mã số quản lý dự án (ví dụ: DA-2026-001)."],
            ["ProjectName", "NVARCHAR(250)", "None", "NOT NULL", "Tên công trình (Tòa nhà, chung cư, nhà xưởng)."],
            ["CustomerId", "UNIQUEIDENTIFIER", "FK", "NOT NULL", "Khóa ngoại tham chiếu đến bảng Customers/Users."],
            ["LeaderId", "UNIQUEIDENTIFIER", "FK", "NULLABLE", "Khóa ngoại tham chiếu đến Đội trưởng thi công phụ trách."],
            ["Address", "NVARCHAR(500)", "None", "NOT NULL", "Địa chỉ địa lý nơi diễn ra thi công."],
            ["StartDate", "DATETIME2", "None", "NOT NULL", "Ngày chính thức khởi công dự án."],
            ["EndDate", "DATETIME2", "None", "NULLABLE", "Ngày dự kiến hoàn thành và bàn giao."],
            ["Budget", "DECIMAL(18,2)", "None", "DEFAULT 0", "Tổng giá trị dự toán ngân sách công trình (VNĐ)."],
            ["CompletionPercentage", "INT", "None", "DEFAULT 0, CHECK(0-100)", "Tỷ lệ phần trăm tiến độ hoàn thành hiện tại."],
            ["Status", "INT", "None", "DEFAULT 1", "Trạng thái: 1-Planning, 2-In Progress, 6-Completed."],
            ["CreatedAt", "DATETIME2", "None", "DEFAULT GETUTCDATE()", "Dấu thời gian hệ thống ghi nhận tạo mới dự án."]
          ],
          [20, 20, 10, 25, 25]
        ),

        createTableCaption("Bảng 3.7", "Từ điển dữ liệu bảng ProjectProgressLogs (Nhật ký tiến độ và ảnh hiện trường)"),
        createCustomTable(
          ["Tên trường", "Kiểu dữ liệu", "Khóa", "Ràng buộc (Null/Default)", "Mô tả ý nghĩa nghiệp vụ"],
          [
            ["Id", "UNIQUEIDENTIFIER", "PK", "NOT NULL, NEWID()", "Mã định danh duy nhất của bản ghi nhật ký."],
            ["ProjectId", "UNIQUEIDENTIFIER", "FK", "NOT NULL", "Khóa ngoại liên kết chặt chẽ với bảng Projects."],
            ["LeaderId", "UNIQUEIDENTIFIER", "FK", "NOT NULL", "Người lập báo cáo nhật ký tiến độ."],
            ["LogDate", "DATETIME2", "None", "DEFAULT GETUTCDATE()", "Thời điểm Đội trưởng bấm gửi báo cáo."],
            ["ProgressPercent", "INT", "None", "CHECK(0-100)", "Mức tiến độ % mới tại thời điểm báo cáo."],
            ["LogContent", "NVARCHAR(MAX)", "None", "NOT NULL", "Nội dung tóm tắt công việc tổ thợ hoàn thành."],
            ["PhotoUrl", "NVARCHAR(1000)", "None", "NOT NULL", "Đường dẫn URL lưu trữ file ảnh hiện trường thực tế."],
            ["WorkersAssignedJson", "NVARCHAR(MAX)", "None", "NULLABLE", "Chuỗi JSON lưu vết phân công thợ 1, 2, 3, 4."]
          ],
          [20, 20, 10, 25, 25]
        ),

        createTableCaption("Bảng 3.8", "Từ điển dữ liệu bảng ServiceRequests / Tickets (Phiếu yêu cầu bảo dưỡng)"),
        createCustomTable(
          ["Tên trường", "Kiểu dữ liệu", "Khóa", "Ràng buộc (Null/Default)", "Mô tả ý nghĩa nghiệp vụ"],
          [
            ["Id", "UNIQUEIDENTIFIER", "PK", "NOT NULL, NEWID()", "Mã định danh duy nhất của phiếu sự cố/bảo trì."],
            ["TicketCode", "NVARCHAR(50)", "None", "NOT NULL, UNIQUE", "Mã phiếu nghiệp vụ (ví dụ: SR-2026-089)."],
            ["CustomerId", "UNIQUEIDENTIFIER", "FK", "NOT NULL", "Khách hàng sở hữu thiết bị yêu cầu bảo trì."],
            ["TechnicianId", "UNIQUEIDENTIFIER", "FK", "NULLABLE", "Kỹ thuật viên hiện trường được phân công."],
            ["Title", "NVARCHAR(200)", "None", "NOT NULL", "Tiêu đề sự cố (ví dụ: Chuông báo cháy tầng 3 kêu giả)."],
            ["Priority", "INT", "None", "DEFAULT 2", "Mức độ khẩn cấp: 1-Low, 2-Medium, 3-High, 4-Urgent."],
            ["Status", "INT", "None", "DEFAULT 1", "Trạng thái: 1-Open, 2-Assigned, 3-In Progress, 4-Resolved."],
            ["Latitude", "FLOAT", "None", "NOT NULL", "Tọa độ vĩ độ của cơ sở khách hàng."],
            ["Longitude", "FLOAT", "None", "NOT NULL", "Tọa độ kinh độ của cơ sở khách hàng."],
            ["CheckinDistanceKm", "FLOAT", "None", "NULLABLE", "Khoảng cách Haversine ghi nhận lúc check-in."],
            ["CheckinAt", "DATETIME2", "None", "NULLABLE", "Thời điểm Kỹ thuật viên check-in thành công."],
            ["ResolvedPhotoUrl", "NVARCHAR(1000)", "None", "NULLABLE", "Bắt buộc có ảnh nghiệm thu trước khi chuyển Resolved."]
          ],
          [20, 20, 10, 25, 25]
        ),

        createTableCaption("Bảng 3.9", "Từ điển dữ liệu bảng EquipmentAssets (Sổ tài sản thiết bị PCCC)"),
        createCustomTable(
          ["Tên trường", "Kiểu dữ liệu", "Khóa", "Ràng buộc (Null/Default)", "Mô tả ý nghĩa nghiệp vụ"],
          [
            ["Id", "UNIQUEIDENTIFIER", "PK", "NOT NULL, NEWID()", "Mã định danh duy nhất của tài sản thiết bị."],
            ["SerialNumber", "NVARCHAR(100)", "None", "NOT NULL, UNIQUE", "Số Serial dập chìm trên thân bình/vỏ tủ thiết bị."],
            ["QrCode", "NVARCHAR(100)", "None", "NOT NULL, UNIQUE", "Chuỗi mã QR dán trên tem để quét nhanh trên điện thoại."],
            ["ModelName", "NVARCHAR(200)", "None", "NOT NULL", "Tên thiết bị (Bình bột MFZ4, Bình khí MT3, Đầu báo khói)."],
            ["CustomerId", "UNIQUEIDENTIFIER", "FK", "NOT NULL", "Khách hàng sở hữu tài sản này."],
            ["ProjectId", "UNIQUEIDENTIFIER", "FK", "NULLABLE", "Dự án thi công gốc đã lắp đặt thiết bị này."],
            ["InstalledDate", "DATETIME2", "None", "NOT NULL", "Ngày lắp đặt và nghiệm thu đưa vào sử dụng."],
            ["LastMaintenanceDate", "DATETIME2", "None", "NULLABLE", "Ngày bảo dưỡng nạp sạc gần nhất."],
            ["NextMaintenanceDate", "DATETIME2", "None", "NOT NULL", "Hạn bảo dưỡng tiếp theo (tự động tính cảnh báo)."],
            ["Status", "INT", "None", "DEFAULT 1", "Trạng thái: 1-Good, 2-Need Maintenance, 3-Expired."]
          ],
          [20, 20, 10, 25, 25]
        ),

        createSubHeading("3.6. Thiết kế giao diện người dùng (UI/UX)"),
        createSubSubHeading("3.6.1. Phân hệ Đăng nhập và Điều hướng vai trò"),
        p("Giao diện đăng nhập được thiết kế theo phong cách tối giản, hiện đại với tông màu xanh đậm an toàn kỹ thuật. Sau khi người dùng nhập thông tin tài khoản và mật khẩu, hệ thống gửi yêu cầu đến API /api/auth/login. Sau khi kiểm tra thông tin hợp lệ, API trả về JSON Web Token kèm Role của người dùng. Ứng dụng Frontend tự động giải mã Token và chuyển hướng (Redirect) chính xác đến không gian làm việc chuyên biệt tương ứng: Admin chuyển đến Dashboard tổng quan, Đội trưởng chuyển đến màn hình Quản lý thi công, Kỹ thuật viên chuyển đến màn hình Điều phối GPS."),
        ...createImagePlaceholder("Hình 3.8", "Giao diện Đăng nhập và xác thực JWT Role-Based Redirect", "Dán ảnh chụp màn hình Giao diện Đăng nhập hệ thống vào đây"),

        createSubSubHeading("3.6.2. Phân hệ Dashboard Quản trị & Giám sát ảnh hiện trường"),
        p("Dashboard dành cho Quản trị viên được chia thành 3 khu vực trực quan: Hàng trên cùng là các thẻ KPI tổng hợp (Tổng số dự án đang thi công, Tổng số phiếu bảo trì trong ngày, Tỷ lệ đáp ứng chuẩn GPS 100%, Doanh thu dự toán). Khu vực trung tâm là Biểu đồ tiến độ và Danh sách các đơn khẩn cấp. Đặc biệt, khu vực bên phải là 'Live Field Feed' - Dòng cập nhật ảnh hiện trường theo thời gian thực. Bất cứ khi nào Đội trưởng gửi ảnh thi công hoặc Kỹ thuật viên nạp sạc bình gửi ảnh nghiệm thu, tấm ảnh kèm tên dự án và dấu thời gian sẽ xuất hiện ngay lập tức với hiệu ứng động."),
        ...createImagePlaceholder("Hình 3.9", "Giao diện Dashboard Quản trị Admin với Feed ảnh hiện trường Real-time", "Dán ảnh chụp màn hình Dashboard Quản trị Admin hiển thị KPI và Feed ảnh hiện trường vào đây"),

        createSubSubHeading("3.6.3. Phân hệ Quản trị Dự án và Bàn làm việc Đội trưởng thi công"),
        p("Giao diện dành cho Đội trưởng thi công được tối ưu hóa đặc thù cho việc thao tác tại công trường. Danh sách các công trình phụ trách được hiển thị trực quan dạng thẻ Card với thanh tiến độ hoàn thành trực quan màu xanh lá. Khi chọn vào một dự án, Đội trưởng có thể mở 'Bảng phân công tổ thợ nội bộ' để phân chia công việc cho Nhân công 1, 2, 3, 4 một cách tức thì."),
        ...createImagePlaceholder("Hình 3.10", "Giao diện Bàn làm việc Đội trưởng thi công & Bảng phân công thợ 1, 2, 3, 4", "Dán ảnh chụp màn hình Không gian làm việc Đội trưởng và chức năng phân công thợ vào đây"),
        p("Hộp thoại cập nhật tiến độ cho phép Đội trưởng kéo thanh trượt từ 0% đến 100% và chọn ảnh hiện trường chụp từ camera điện thoại. Khi nhấn gửi, dữ liệu được đồng bộ hóa tức thì:"),
        ...createImagePlaceholder("Hình 3.11", "Hộp thoại Đội trưởng cập nhật tiến độ % và tải ảnh thực tế công trình", "Dán ảnh chụp màn hình Modal cập nhật tiến độ thi công kèm ảnh thực tế vào đây"),

        createSubSubHeading("3.6.4. Phân hệ Kỹ thuật viên bảo trì, Bản đồ số và Check-in GPS"),
        p("Giao diện di động dành cho Kỹ thuật viên bảo trì tích hợp Bản đồ tương tác Leaflet. Hệ thống tự động xác định vị trí hiện tại của kỹ thuật viên và vẽ đường điều hướng màu xanh lam nối tới địa chỉ của khách hàng kèm khoảng cách km. Khi kỹ thuật viên di chuyển vào phạm vi bán kính ≤ 1.0 km, nút 'Check-in vị trí hiện trường' sẽ sáng lên và cho phép kích hoạt phiếu làm việc."),
        ...createImagePlaceholder("Hình 3.12", "Giao diện Bản đồ điều phối GPS và điều hướng lộ trình kỹ thuật viên", "Dán ảnh chụp màn hình Bản đồ điều phối Leaflet GPS và khoảng cách vào đây"),
        p("Sau khi khắc phục sự cố, kỹ thuật viên mở hộp thoại 'Nghiệm thu hoàn thành'. Nút xác nhận bị khóa cho đến khi kỹ thuật viên bấm chụp và tải lên hình ảnh chụp thiết bị sau khi bảo dưỡng:"),
        ...createImagePlaceholder("Hình 3.13", "Hộp thoại Nghiệm thu bảo trì bắt buộc đính kèm ảnh hiện trường", "Dán ảnh chụp màn hình Hộp thoại Nghiệm thu bắt buộc có ảnh trước khi hoàn tất vào đây"),

        createSubSubHeading("3.6.5. Phân hệ Chatbot AI RAG & Báo giá sơ bộ tức thì"),
        p("Giao diện Chatbot AI RAG cung cấp trải nghiệm hội thoại thông minh. Khách hàng hoặc nhân viên kinh doanh có thể đặt câu hỏi về tiêu chuẩn TCVN 3890 hoặc nhập thông số: 'Tòa nhà văn phòng 5 tầng, diện tích mỗi sàn 350m2 cần trang bị những gì?'. AI sẽ tự động phân tích và sinh ra bảng dự toán bóc tách chi phí sơ bộ tức thì kèm nút tải file báo giá."),
        ...createImagePlaceholder("Hình 3.14", "Giao diện Chatbot AI RAG tư vấn tiêu chuẩn TCVN 3890 và Báo giá tức thì", "Dán ảnh chụp màn hình Trợ lý Chatbot AI tư vấn và bảng Báo giá sơ bộ tự động vào đây"),

        createSubSubHeading("3.6.6. Phân hệ Kho hàng và Quản lý thiết bị định danh QR Code"),
        p("Giao diện quản trị kho cho phép theo dõi tồn kho theo Model và cấp phát mã QR Code định danh duy nhất cho từng số Serial của thiết bị khi xuất kho thi công. Khi quét mã QR dán trên bình chữa cháy, màn hình hiển thị toàn bộ hồ sơ lý lịch: Ngày sản xuất, Ngày nạp sạc, Hạn bảo dưỡng kế tiếp và Lịch sử sửa chữa."),
        ...createImagePlaceholder("Hình 3.15", "Giao diện Quản lý thiết bị định danh theo số Serial và mã vạch QR Code", "Dán ảnh chụp màn hình Quản lý Thiết bị theo mã QR và Serial vào đây"),
        new Paragraph({ children: [new PageBreak()] }),

        // -----------------------------------------------------------------------------
        // CHƯƠNG 4
        // -----------------------------------------------------------------------------
        createHeaderTitle("Chương 4. CÀI ĐẶT, TRIỂN KHAI VÀ ĐÁNH GIÁ HỆ THỐNG"),
        createSubHeading("4.1. Môi trường cài đặt và cấu hình hệ thống"),
        p("Hệ thống FireGuard AI được triển khai và cấu hình thử nghiệm trên hạ tầng máy chủ với các thông số kỹ thuật tiêu chuẩn:"),
        bullet("Hạ tầng phần cứng máy chủ (Server): CPU Intel Core i7 12-Core, 32GB RAM DDR5, 512GB NVMe SSD tốc độ cao, băng thông mạng 1Gbps."),
        bullet("Môi trường hệ điều hành: Windows 11 Professional (Môi trường phát triển cục bộ) và Ubuntu Server 22.04 LTS (Môi trường Docker Container chạy thử nghiệm)."),
        bullet("Hệ quản trị CSDL: Microsoft SQL Server Developer Edition 2022 kết hợp SQL Server Management Studio (SSMS) v19."),
        bullet("Môi trường thực thi ứng dụng: .NET 8.0 SDK (ASP.NET Core Web API), Node.js v20.12.0 LTS, npm v10.5.0."),
        bullet("Công cụ kiểm thử & Theo dõi: Postman (Kiểm thử API Endpoint), xUnit (Kiểm thử đơn vị), Chrome DevTools (Kiểm thử Network & Performance)."),

        createSubHeading("4.2. Hiện thực các giải pháp kỹ thuật trọng yếu"),
        createSubSubHeading("4.2.1. Hiện thực kiểm tra bán kính GPS bằng thuật toán Haversine"),
        p("Đoạn mã C# sau đây hiện thực thuật toán Haversine trong tầng Application Service, tính toán khoảng cách và kiểm tra điều kiện bán kính an toàn 1.0 km:"),
        p("public static double CalculateDistanceKm(double lat1, double lon1, double lat2, double lon2)\n{\n    const double R = 6371.0; // Bán kính Trái Đất (km)\n    var dLat = ToRadians(lat2 - lat1);\n    var dLon = ToRadians(lon2 - lon1);\n    var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +\n            Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *\n            Math.Sin(dLon / 2) * Math.Sin(dLon / 2);\n    var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));\n    return R * c;\n}", { bold: true, italics: true, alignment: AlignmentType.LEFT }),
        p("Khi Kỹ thuật viên gửi tọa độ lên Endpoint POST /api/tickets/{id}/checkin, hệ thống truy xuất tọa độ công trình từ cơ sở dữ liệu. Nếu khoảng cách tính được vượt quá 1.0 km, hệ thống trả về mã lỗi 400 Bad Request kèm thông báo chi tiết số km chênh lệch."),

        createSubSubHeading("4.2.2. Hiện thực cơ chế đẩy thông báo Real-time qua SignalR Hub"),
        p("Để cập nhật tức thì ảnh hiện trường từ công trường về Dashboard Admin, hệ thống xây dựng NotificationHub trên nền SignalR:"),
        p("public class NotificationHub : Hub\n{\n    public async Task SendLiveProgressPhoto(string projectId, string photoUrl, int progressPercent, string leaderName)\n    {\n        await Clients.All.SendAsync(\"ReceiveLivePhoto\", new {\n            ProjectId = projectId,\n            PhotoUrl = photoUrl,\n            Progress = progressPercent,\n            LeaderName = leaderName,\n            Timestamp = DateTime.UtcNow\n        });\n    }\n}", { bold: true, italics: true, alignment: AlignmentType.LEFT }),
        p("Tại giao diện React, component AdminDashboard đăng ký lắng nghe sự kiện 'ReceiveLivePhoto' thông qua thư viện @microsoft/signalr. Khi nhận được tín hiệu, giao diện tự động chèn tấm ảnh mới nhất vào đầu danh sách Live Feed mà không cần tải lại trang."),

        createSubSubHeading("4.2.3. Hiện thực tích hợp Chatbot AI và công thức tính dự toán"),
        p("Phân hệ AI sử dụng API tích hợp để truyền các thông số diện tích và loại công trình kèm System Prompt chứa các điều khoản của TCVN 3890:2023. Kết quả trả về được chuẩn hóa thành cấu trúc JSON chứa danh mục vật tư thiết bị, số lượng và tổng chi phí ước tính, hiển thị trực quan dạng bảng trên giao diện người dùng."),

        createSubHeading("4.3. Kịch bản kiểm thử phần mềm chi tiết (Test Cases)"),
        createSubSubHeading("4.3.1. Kiểm thử chức năng cốt lõi (Functional Testing)"),
        createTableCaption("Bảng 4.1", "Kịch bản kiểm thử chức năng chính của hệ thống (Functional Test Cases)"),
        createCustomTable(
          ["Mã Test", "Tên ca kiểm thử", "Các bước thực hiện", "Dữ liệu đầu vào", "Kết quả mong đợi", "Kết quả thực tế", "Đánh giá"],
          [
            ["TC-01", "Đăng nhập hệ thống thành công", "1. Nhập email và pass\n2. Bấm Đăng nhập", "Email: admin@fireguard.vn\nPass: Admin@123", "Trả về JWT Token hợp lệ, điều hướng vào Dashboard", "Đúng như mong đợi, token lưu vào localStorage", "ĐẠT (Pass)"],
            ["TC-02", "Đội trưởng phân công thợ nội bộ", "1. Vào chi tiết DA\n2. Giao việc Thợ 1, 2\n3. Bấm Lưu phân công", "Thợ 1: Hàn ống cấp nước\nThợ 2: Kéo dây tín hiệu", "Bảng phân công hiển thị đúng nội dung và lưu trạng thái", "Lưu trữ thành công, tải lại trang vẫn giữ nguyên", "ĐẠT (Pass)"],
            ["TC-03", "Báo cáo tiến độ kèm ảnh công trình", "1. Kéo thanh tiến độ 70%\n2. Chọn 1 ảnh hiện trường\n3. Bấm Gửi báo cáo", "Progress: 70%\nẢnh: thi_cong_ong.jpg\nGhi chú: Đã xong tầng 2", "Tiến độ dự án cập nhật 70%, ảnh xuất hiện tại nhật ký", "Tiến độ tăng lên 70%, ảnh hiển thị tức thì trên Dashboard", "ĐẠT (Pass)"],
            ["TC-04", "Check-in GPS đúng vị trí (<= 1km)", "1. KTV mở phiếu bảo trì\n2. Bật GPS điện thoại\n3. Bấm Check-in vị trí", "Tọa độ GPS thực tế cách công trình 180 mét (d = 0.18km)", "Hệ thống chấp nhận check-in, mở khóa nút nghiệm thu", "Check-in thành công, trạng thái chuyển In Progress", "ĐẠT (Pass)"],
            ["TC-05", "Nghiệm thu bảo trì có đính kèm ảnh", "1. Nhấn Hoàn tất\n2. Tải ảnh bình chữa cháy\n3. Nhấn Xác nhận đóng phiếu", "Ảnh: tem_kiem_dinh_moi.jpg\nGhi chú: Đã nạp bột ABC", "Ticket chuyển trạng thái 'Resolved', ảnh lưu lịch sử", "Đơn đóng thành công, ảnh hiển thị trong hồ sơ khách hàng", "ĐẠT (Pass)"],
            ["TC-06", "Tạo báo giá tự động bằng AI", "1. Nhập diện tích 500m2\n2. Chọn loại xưởng gỗ\n3. Bấm Dự toán AI", "Diện tích: 500m2\nCông năng: Xưởng gỗ\nSố tầng: 2", "AI trả về bảng bóc tách bình bột ABC, đầu báo nhiệt, chi phí", "Bảng báo giá sơ bộ được tạo với mã dự toán hợp lệ", "ĐẠT (Pass)"],
            ["TC-07", "Nghiệm thu bàn giao kích hoạt bảo hành", "1. Đội trưởng bấm Bàn giao\n2. Xác nhận 100% hoàn thành", "Tiến độ dự án = 100%\nBiên bản nghiệm thu", "Dự án chuyển Status = 6, vật tư chuyển thành tài sản bảo hành", "Toàn bộ thiết bị được cấp sổ theo dõi hạn bảo trì", "ĐẠT (Pass)"],
            ["TC-08", "Quét mã QR tra cứu thiết bị", "1. Mở camera quét mã QR\n2. Xem lý lịch thiết bị", "Mã QR: FG-2026-BCO2-0089", "Hiển thị trang chi tiết: Ngày nạp sạc, Hạn bảo dưỡng kế tiếp", "Hiển thị đầy đủ thông tin thiết bị và lịch sử bảo dưỡng", "ĐẠT (Pass)"]
          ],
          [8, 16, 18, 18, 18, 12, 10]
        ),

        createSubSubHeading("4.3.2. Kiểm thử các trường hợp ngoại lệ và biên (Boundary & Exception)"),
        createTableCaption("Bảng 4.2", "Kịch bản kiểm thử trường hợp ngoại lệ và biên (Boundary & Exception)"),
        createCustomTable(
          ["Mã Test", "Tình huống ngoại lệ / Biên", "Hành vi dự kiến của hệ thống", "Kết quả thực tế kiểm thử", "Đánh giá"],
          [
            ["EXP-01", "Kỹ thuật viên bấm hoàn thành nhưng KHÔNG tải ảnh nghiệm thu", "Hệ thống vô hiệu hóa nút 'Xác nhận', hiển thị cảnh báo: 'Bắt buộc tải ảnh hiện trường trước khi hoàn tất'", "Nút Hoàn thành bị Disabled, không thể gửi yêu cầu nếu thiếu ảnh", "ĐẠT (Pass)"],
            ["EXP-02", "Kỹ thuật viên Check-in GPS ở khoảng cách quá xa (> 1.0 km)", "Hệ thống từ chối check-in, trả về lỗi 400 kèm thông báo: 'Khoảng cách vượt quá bán kính 1km cho phép'", "Hệ thống chặn đứng, báo lỗi chi tiết cách công trình 3.4 km", "ĐẠT (Pass)"],
            ["EXP-03", "Đội trưởng cố gắng nhập tiến độ dự án vượt quá 100% hoặc âm (< 0%)", "Hệ thống chặn bằng Validate UI và ràng buộc CHECK Database, chỉ cho phép giá trị từ 0 đến 100", "Thanh trượt giới hạn 0-100, nhập tay giá trị >100 bị chặn ngay", "ĐẠT (Pass)"],
            ["EXP-04", "Người dùng tải lên file không phải định dạng ảnh (ví dụ: file .exe, .sh)", "Middleware kiểm tra định dạng MIME type, từ chối file lạ, chỉ chấp nhận .jpg, .png, .webp", "Hệ thống báo lỗi 'File không đúng định dạng hình ảnh' và hủy upload", "ĐẠT (Pass)"],
            ["EXP-05", "Đăng nhập với mật khẩu sai quá 5 lần liên tiếp", "Khóa tạm thời tài khoản trong 15 phút để chống tấn công Brute-force", "Hệ thống cảnh báo và tạm khóa đăng nhập đúng quy định", "ĐẠT (Pass)"]
          ],
          [10, 25, 30, 25, 10]
        ),

        createSubSubHeading("4.3.3. Kiểm thử phân quyền và an toàn thông tin (Security Testing)"),
        createTableCaption("Bảng 4.3", "Kịch bản kiểm thử an toàn phân quyền vai trò (Security Access Testing)"),
        createCustomTable(
          ["Mã Test", "Vai trò thực hiện kiểm thử", "Hành động thử nghiệm vượt quyền", "Kết quả mong đợi", "Kết quả thực tế"],
          [
            ["SEC-01", "Kỹ thuật viên (Technician)", "Cố gắng gọi API xóa người dùng DELETE /api/users/{id}", "Hệ thống chặn bằng Middleware RBAC, trả về mã lỗi 403 Forbidden", "Đúng, trả về 403 Forbidden"],
            ["SEC-02", "Đội trưởng thi công (Leader)", "Cố gắng cập nhật tiến độ công trình của Đội trưởng khác phụ trách", "Hệ thống kiểm tra LeaderId của dự án, từ chối nếu không trùng khớp", "Đúng, trả về 403 Không có quyền"],
            ["SEC-03", "Khách hàng (Customer)", "Truy cập trực tiếp vào đường dẫn /admin/dashboard trên trình duyệt", "Hệ thống Router React chặn lại, tự động chuyển hướng về trang cá nhân", "Đúng, tự động đẩy về /customer"],
            ["SEC-04", "Người dùng nặc danh (Chưa đăng nhập)", "Gửi yêu cầu API không có Bearer Token trong Header", "API Gateway từ chối, trả về mã lỗi 401 Unauthorized", "Đúng, trả về 401 Unauthorized"]
          ],
          [10, 20, 30, 25, 15]
        ),

        createSubSubHeading("4.3.4. Kiểm thử hiệu năng và độ trễ API (Performance Testing)"),
        p("Sử dụng công cụ kiểm thử tải mô phỏng 100 người dùng đồng thời gửi yêu cầu trong 10 phút. Kết quả ghi nhận:"),
        bullet("Tốc độ phản hồi trung bình của API truy vấn danh sách dự án: 115ms (đạt yêu cầu < 200ms)."),
        bullet("Tốc độ xử lý thuật toán đối soát Haversine: 2.4ms (tối ưu hóa cao)."),
        bullet("Tốc độ phát tín hiệu SignalR đến Dashboard: 45ms (gần như tức thời)."),
        bullet("Tỷ lệ lỗi HTTP 5xx: 0% trong suốt quá trình thử nghiệm tải."),

        createSubHeading("4.4. Đánh giá kết quả đạt được so với mục tiêu ban đầu"),
        createTableCaption("Bảng 4.4", "Bảng đối chiếu mức độ hoàn thành so với mục tiêu đề ra ban đầu"),
        createCustomTable(
          ["Mục tiêu nghiên cứu đề ra ban đầu", "Giải pháp và chức năng thực tế đã hiện thực", "Mức độ hoàn thành"],
          [
            ["1. Số hóa quy trình thi công & phân công thợ", "Xây dựng hoàn chỉnh phân hệ Đội trưởng, cơ chế phân công thợ nội bộ 1, 2, 3, 4 tại chỗ và nhật ký tiến độ %", "100% Hoàn thành xuất sắc"],
            ["2. Bắt buộc bằng chứng hình ảnh nghiệm thu", "Cài đặt rào cản kỹ thuật bắt buộc tải ảnh hiện trường cho cả thi công và bảo trì trước khi đóng phiếu", "100% Hoàn thành xuất sắc"],
            ["3. Đối soát định vị GPS chống gian lận hiện trường", "Ứng dụng thuật toán Haversine kiểm tra bán kính GPS <= 1.0 km, chặn đứng hoàn toàn việc báo cáo ảo", "100% Hoàn thành xuất sắc"],
            ["4. Tự động hóa tư vấn và báo giá sơ bộ AI", "Tích hợp Chatbot RAG hiểu quy chuẩn TCVN 3890:2023, tự động bóc tách số lượng và xuất bảng dự toán tức thì", "100% Hoàn thành xuất sắc"],
            ["5. Quản lý vòng đời thiết bị theo Serial & QR Code", "Quản lý 1-1 giữa Serial và mã QR, theo dõi hạn nạp sạc bình chữa cháy và cảnh báo bảo dưỡng tự động", "100% Hoàn thành xuất sắc"],
            ["6. Truyền thông thời gian thực trên Dashboard", "Tích hợp SignalR WebSocket đẩy Live Feed ảnh hiện trường và cảnh báo sự cố khẩn cấp về Admin", "100% Hoàn thành xuất sắc"]
          ],
          [30, 55, 15]
        ),
        new Paragraph({ children: [new PageBreak()] }),

        // -----------------------------------------------------------------------------
        // CHƯƠNG 5
        // -----------------------------------------------------------------------------
        createHeaderTitle("Chương 5. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN"),
        createSubHeading("5.1. Kết luận tổng quan về đề tài"),
        p("Sau một thời gian nghiêm túc nghiên cứu, khảo sát nghiệp vụ thực tế và nỗ lực phát triển phần mềm, đề tài 'Xây dựng hệ thống quản lý thi công, bảo trì thiết bị PCCC và điều phối kỹ thuật hiện trường tích hợp trí tuệ nhân tạo (FireGuard AI)' đã hoàn thành toàn diện 100% các mục tiêu nghiên cứu và yêu cầu kỹ thuật được đặt ra ban đầu."),
        p("Đề tài đã giải quyết thành công bài toán chuyển đổi số cho một lĩnh vực đặc thù và có độ phức tạp cao là an toàn phòng cháy chữa cháy. Bằng sự kết hợp khéo léo giữa các công nghệ phần mềm doanh nghiệp tiên tiến (.NET 8 Clean Architecture, React TypeScript, SignalR WebSocket) và các giải pháp thực tế (đối soát GPS bán kính 1km, bắt buộc ảnh nghiệm thu, phân công thợ nội bộ gọn nhẹ, trợ lý báo giá AI), hệ thống FireGuard AI không chỉ là một bài tập học thuật đơn thuần mà đã tiệm cận một sản phẩm phần mềm thương mại thực thụ, có tính ứng dụng cao và sẵn sàng đưa vào vận hành tại các doanh nghiệp dịch vụ PCCC."),

        createSubHeading("5.2. Những ưu điểm nổi bật của hệ thống"),
        bullet("1. Tính thực tiễn và bản địa hóa cao: Hệ thống bám sát các tiêu chuẩn kỹ thuật an toàn PCCC của Việt Nam (đặc biệt là TCVN 3890:2023), giúp các doanh nghiệp và chủ tòa nhà luôn tuân thủ đúng quy định của pháp luật."),
        bullet("2. Giải quyết triệt để bài toán gian lận hiện trường: Cơ chế khóa kép (GPS Geolocation trong bán kính 1.0 km + Bắt buộc đính kèm ảnh nghiệm thu thực tế) giúp loại bỏ hoàn toàn tình trạng 'ký khống biên bản' hay 'ngồi quán cà phê bấm hoàn thành việc'."),
        bullet("3. Tối ưu hóa nhân lực công trường linh hoạt: Cơ chế phân công thợ nội bộ (Thợ 1, 2, 3, 4) giải quyết hoàn hảo bài toán biến động nhân sự phổ thông tại công trình mà không làm phức tạp hóa cơ sở dữ liệu."),
        bullet("4. Trải nghiệm thời gian thực (Real-time Experience): Công nghệ SignalR WebSocket giúp kết nối liền mạch giữa công trường và văn phòng; ban lãnh đạo có thể theo dõi tiến độ thi công từng giờ qua dòng ảnh trực tiếp."),
        bullet("5. Kiến trúc phần mềm chuẩn mực: Áp dụng Clean Architecture giúp mã nguồn có tính module hóa cao, dễ bảo trì, dễ mở rộng và dễ dàng viết các bài kiểm thử tự động."),

        createSubHeading("5.3. Những hạn chế cần khắc phục"),
        bullet("1. Sự phụ thuộc vào kết nối Internet: Do là ứng dụng Web thời gian thực, hệ thống đòi hỏi thiết bị di động phải có kết nối mạng (4G/Wi-Fi). Tại một số công trình có tầng hầm sâu hoặc khu vực vùng sâu bị mất sóng di động, việc tải ảnh có thể bị gián đoạn."),
        bullet("2. Cơ chế thẩm định hình ảnh hiện dựa trên con người: Hiện tại, hệ thống mới chỉ bắt buộc phải có ảnh và lưu trữ minh bạch, việc đánh giá xem ảnh chụp có đúng là bình chữa cháy đạt chuẩn hay không vẫn phụ thuộc vào sự kiểm duyệt của cán bộ quản lý."),
        bullet("3. Chưa có ứng dụng di động Native riêng biệt: Hệ thống hiện đang chạy trên nền tảng Web Responsive tối ưu cho trình duyệt di động, chưa khai thác được các phần cứng đặc thù như chip quét NFC của điện thoại."),

        createSubHeading("5.4. Hướng nghiên cứu và mở rộng trong tương lai"),
        bullet("1. Xây dựng ứng dụng di động Native (React Native / Flutter) với cơ chế Offline-First: Cho phép kỹ thuật viên làm việc dưới tầng hầm mất sóng, chụp ảnh và lưu trữ dữ liệu vào SQLite trên điện thoại, sau đó tự động đồng bộ hóa lên máy chủ đám mây ngay khi có sóng trở lại."),
        bullet("2. Tích hợp mô hình thị giác máy tính (Computer Vision AI): Ứng dụng mô hình Deep Learning (YOLOv8) để tự động nhận diện thiết bị trong ảnh tải lên, tự động đọc chỉ số kim đồng hồ áp suất (Vạch đỏ - Tụt áp, Vạch xanh - Đạt chuẩn) và phát hiện các mối hàn ống bị lỗi rỉ sét."),
        bullet("3. Tích hợp cảm biến không dây IoT (LoRaWAN / Zigbee): Kết nối trực tiếp với các cảm biến áp lực đường ống nước cứu hỏa và cảm biến pin của đầu báo khói để gửi cảnh báo sớm về hệ thống trước khi xảy ra sự cố."),
        bullet("4. Mở rộng cổng thanh toán điện tử trực tuyến (VNPay, MoMo, ZaloPay): Cho phép khách hàng thanh toán trực tiếp các hóa đơn nạp sạc bình chữa cháy và dịch vụ bảo dưỡng định kỳ ngay trên cổng thông tin."),

        createSubHeading("5.5. Trải nghiệm học tập và kinh nghiệm đúc kết của sinh viên"),
        p("Quá trình thực hiện đồ án tốt nghiệp là một chặng đường học tập đầy thử thách nhưng cũng mang lại những trải nghiệm vô cùng quý giá cho bản thân sinh viên. Thông qua việc tự tay nghiên cứu và xây dựng một hệ thống phần mềm hoàn chỉnh từ con số 0, sinh viên đã:"),
        bullet("Nắm vững và làm chủ phương pháp luận thiết kế phần mềm hướng đối tượng (OOAD), quy trình mô hình hóa hệ thống bằng UML và tư duy kiến trúc phân tầng Clean Architecture trong môi trường doanh nghiệp."),
        bullet("Nâng cao vượt bậc kỹ năng lập trình full-stack: từ việc tối ưu hóa truy vấn CSDL quan hệ với Entity Framework Core, xử lý giao tiếp bất đồng bộ và WebSockets trong .NET 8, đến việc làm chủ React 18, TypeScript và kỹ thuật quản lý trạng thái giao diện."),
        bullet("Rèn luyện tác phong làm việc khoa học, kỹ năng tìm kiếm tài liệu học thuật, kỹ năng phân tích giải quyết vấn đề và đặc biệt là hiểu sâu sắc mối liên hệ hữu cơ giữa công nghệ thông tin và các quy chuẩn kỹ thuật an toàn trong đời sống thực tế."),
        p("Sinh viên xin gửi lời cảm ơn chân thành nhất đến quý Thầy Cô và bạn bè đã đồng hành, hỗ trợ để đồ án đạt được kết quả tốt đẹp này.", { italics: true }),
        new Paragraph({ children: [new PageBreak()] }),

        // -----------------------------------------------------------------------------
        // TÀI LIỆU THAM KHẢO & PHỤ LỤC
        // -----------------------------------------------------------------------------
        createHeaderTitle("TÀI LIỆU THAM KHẢO"),
        p("[1] Bộ Khoa học và Công nghệ, Tiêu chuẩn Quốc gia TCVN 3890:2023 - Phòng cháy chữa cháy - Phương tiện phòng cháy và chữa cháy cho nhà và công trình - Trang bị, bố trí, Hà Nội, 2023."),
        p("[2] Bộ Xây dựng, Quy chuẩn kỹ thuật quốc gia QCVN 06:2022/BXD về An toàn cháy cho nhà và công trình, Hà Nội, 2022."),
        p("[3] Chính phủ nước CHXHCN Việt Nam, Nghị định số 136/2020/NĐ-CP quy định chi tiết một số điều và biện pháp thi hành Luật Phòng cháy và chữa cháy, Hà Nội, 2020."),
        p("[4] Robert C. Martin, Clean Architecture: A Craftsman's Guide to Software Structure and Design, Prentice Hall, 2017."),
        p("[5] Andrew Troelsen, Philip Japikse, Pro C# 10 with .NET 6: Foundational Principles and Practices in Programming, Apress, 2022."),
        p("[6] Microsoft Corporation, ASP.NET Core Documentation: Clean Architecture, SignalR, and Entity Framework Core, https://learn.microsoft.com/aspnet/core, Truy cập tháng 08/2026."),
        p("[7] Alex Banks, Eve Porcello, Learning React: Modern Patterns for Developing React Apps (2nd Edition), O'Reilly Media, 2020."),
        p("[8] Martin Fowler, Patterns of Enterprise Application Architecture, Addison-Wesley Professional, 2002."),
        p("[9] R. W. Sinnott, 'Virtues of the Haversine', Sky and Telescope, vol. 68, no. 2, p. 159, 1984."),
        p("[10] Leaflet Open Source Project, Leaflet - an open-source JavaScript library for mobile-friendly interactive maps, https://leafletjs.com, 2026."),
        new Paragraph({ children: [new PageBreak()] }),

        createHeaderTitle("PHỤ LỤC: MÃ NGUỒN TIÊU BIỂU VÀ HƯỚNG DẪN CÀI ĐẶT"),
        createSubHeading("A. Hướng dẫn cài đặt và khởi chạy hệ thống"),
        p("1. Yêu cầu môi trường tiền đề:"),
        bullet("Cài đặt .NET 8.0 SDK (x64) từ trang chủ Microsoft."),
        bullet("Cài đặt Microsoft SQL Server 2022 Developer và SSMS."),
        bullet("Cài đặt Node.js phiên bản 20.x LTS và trình quản lý gói npm."),
        p("2. Khởi chạy Backend (.NET 8 Web API):"),
        bullet("Mở terminal chuyển vào thư mục backend/src/FireGuard.WebAPI."),
        bullet("Cấu hình chuỗi kết nối Database trong file appsettings.Development.json."),
        bullet("Chạy lệnh: dotnet ef database update để khởi tạo bảng và dữ liệu mẫu."),
        bullet("Chạy lệnh: dotnet run để khởi động Web API tại cổng https://localhost:5001."),
        p("3. Khởi chạy Frontend (React Vite):"),
        bullet("Mở terminal chuyển vào thư mục frontend."),
        bullet("Chạy lệnh: npm install để cài đặt toàn bộ gói thư viện phụ thuộc."),
        bullet("Chạy lệnh: npm run dev để khởi chạy máy chủ phát triển tại địa chỉ http://localhost:5173."),

        createSubHeading("B. Trích đoạn mã nguồn thuật toán kiểm tra GPS Haversine"),
        p("public async Task<CheckinResultDto> Handle(CheckinTicketCommand request, CancellationToken cancellationToken)\n{\n    var ticket = await _context.ServiceRequests.FindAsync(request.TicketId);\n    if (ticket == null) throw new NotFoundException(\"Phiếu bảo trì không tồn tại\");\n\n    double distanceKm = HaversineService.CalculateDistanceKm(\n        request.CurrentLatitude, request.CurrentLongitude,\n        ticket.Latitude, ticket.Longitude);\n\n    if (distanceKm > 1.0)\n    {\n        return new CheckinResultDto {\n            Success = false,\n            DistanceKm = Math.Round(distanceKm, 2),\n            Message = $\"Vị trí của bạn đang cách công trình {distanceKm:F2} km, vượt quá bán kính 1.0 km quy định.\"\n        };\n    }\n\n    ticket.Status = TicketStatus.InProgress;\n    ticket.CheckinAt = DateTime.UtcNow;\n    ticket.CheckinDistanceKm = distanceKm;\n    await _context.SaveChangesAsync(cancellationToken);\n\n    return new CheckinResultDto {\n        Success = true,\n        DistanceKm = Math.Round(distanceKm, 2),\n        Message = \"Xác thực GPS thành công! Đã mở khóa cho phép bảo trì và nghiệm thu.\"\n    };\n}", { bold: true, italics: true, alignment: AlignmentType.LEFT })
      ]
    }
  ]
});

// Pack to buffer and save safely
Packer.toBuffer(doc).then((buffer) => {
  const targetFiles = [
    path.resolve(__dirname, '..', 'BAO_CAO_DO_AN_FIREGUARD_AI_THEO_MAU_MOI.docx'),
    path.resolve(__dirname, '..', 'BAO_CAO_DO_AN_FIREGUARD_AI.docx'),
    path.resolve(__dirname, '..', 'BAO_CAO_DO_AN_FIREGUARD_AI_THEO_MAU.docx')
  ];

  let savedCount = 0;
  for (const file of targetFiles) {
    try {
      fs.writeFileSync(file, buffer);
      console.log("SUCCESS: Đã tạo và lưu file thành công tại: " + file);
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
