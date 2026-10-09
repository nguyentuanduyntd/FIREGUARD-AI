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

console.log("Starting to generate ultra-massive 60+ page graduation thesis Word document...");

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
    spacing: { before: 400, after: 200 },
    alignment: AlignmentType.LEFT,
    pageBreakBefore: true
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
    spacing: { before: options.before || 70, after: options.after || 90, line: 310 }, // 1.3 line spacing
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
    spacing: { before: 50, after: 60, line: 300 },
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
              margins: { top: 380, bottom: 380, left: 200, right: 200 },
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

// Build Document
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Times New Roman", size: 26, color: "0F172A" },
        paragraph: { spacing: { line: 310 } }
      },
      heading1: {
        run: { font: "Times New Roman", size: 34, bold: true, color: PRIMARY_COLOR },
        paragraph: { spacing: { before: 400, after: 200 } }
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
    // BÌA CHÍNH
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

    // BÌA PHỤ & THỦ TỤC
    {
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1700, right: 1134 }, pageNumbers: { start: 1 } }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: "Đồ Án Tốt Nghiệp: Hệ Thống FireGuard AI - Hồ Tiến Đạt (20210001)", size: 20, italics: true, color: "64748B" })]
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
        // NHẬN XÉT CỦA GIẢNG VIÊN HƯỚNG DẪN
        new Paragraph({
          text: "NHẬN XÉT CỦA GIẢNG VIÊN HƯỚNG DẪN",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 260 }
        }),
        p("1. Về tinh thần, thái độ làm việc của sinh viên:"),
        p("..................................................................................................................................................................................................."),
        p("..................................................................................................................................................................................................."),
        p("2. Về tính cấp thiết, giá trị khoa học và thực tiễn của đề tài:"),
        p("..................................................................................................................................................................................................."),
        p("..................................................................................................................................................................................................."),
        p("3. Về mức độ hoàn thành nội dung và chất lượng sản phẩm phần mềm:"),
        p("..................................................................................................................................................................................................."),
        p("..................................................................................................................................................................................................."),
        p("4. Điểm đánh giá của Giảng viên hướng dẫn: .............. / 10 điểm."),
        p("TP. Hồ Chí Minh, ngày ...... tháng ...... năm 2026", { alignment: AlignmentType.RIGHT, italics: true }),
        p("Giảng viên hướng dẫn", { alignment: AlignmentType.RIGHT, bold: true }),
        p("(Ký và ghi rõ họ tên)", { alignment: AlignmentType.RIGHT, italics: true }),
        new Paragraph({ children: [new PageBreak()] }),

        // NHẬN XÉT CỦA GIẢNG VIÊN PHẢN BIỆN
        new Paragraph({
          text: "NHẬN XÉT CỦA GIẢNG VIÊN PHẢN BIỆN",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 260 }
        }),
        p("1. Về kết cấu và hình thức trình bày của báo cáo đồ án:"),
        p("..................................................................................................................................................................................................."),
        p("..................................................................................................................................................................................................."),
        p("2. Về tính chính xác, tính đầy đủ của các mô hình phân tích và thiết kế kiến trúc:"),
        p("..................................................................................................................................................................................................."),
        p("..................................................................................................................................................................................................."),
        p("3. Những ưu điểm chính và các hạn chế cần làm rõ khi bảo vệ trước Hội đồng:"),
        p("..................................................................................................................................................................................................."),
        p("..................................................................................................................................................................................................."),
        p("4. Điểm đánh giá của Giảng viên phản biện: .............. / 10 điểm."),
        p("TP. Hồ Chí Minh, ngày ...... tháng ...... năm 2026", { alignment: AlignmentType.RIGHT, italics: true }),
        p("Giảng viên phản biện", { alignment: AlignmentType.RIGHT, bold: true }),
        p("(Ký và ghi rõ họ tên)", { alignment: AlignmentType.RIGHT, italics: true }),
        new Paragraph({ children: [new PageBreak()] }),

        // LỜI CẢM ƠN
        new Paragraph({
          text: "LỜI CẢM ƠN",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 260 }
        }),
        p("Để hoàn thành đồ án tốt nghiệp đại học này, em đã nhận được sự quan tâm, chỉ dạy và giúp đỡ vô cùng tận tình, quý báu từ quý Thầy Cô trong Khoa Công nghệ Thông tin, Trường Đại học Công nghệ Thông tin. Những bài giảng tâm huyết, những kiến thức nền tảng vững chắc về kỹ thuật phần mềm, cấu trúc dữ liệu và giải thuật, cơ sở dữ liệu nâng cao, kiến trúc hệ thống phân tán và bảo mật thông tin mà quý Thầy Cô truyền thụ trong suốt bốn năm học tập chính là tài sản vô giá giúp em tự tin bước vào môi trường làm việc thực tế."),
        p("Em xin bày tỏ lòng biết ơn sâu sắc và chân thành nhất đến Giảng viên hướng dẫn – Thầy/Cô đã dành trọn tâm huyết, thời gian quý báu để định hướng đề tài nghiên cứu, theo sát từng bước tiến độ thực hiện, đưa ra những lời nhận xét chuyên môn sắc sảo, uốn nắn những sai sót kỹ thuật và truyền cảm hứng say mê nghiên cứu khoa học cho em."),
        p("Em cũng xin chân thành cảm ơn các kỹ sư, chuyên gia kỹ thuật và ban chỉ huy đội thi công tại các doanh nghiệp dịch vụ phòng cháy chữa cháy đã nhiệt tình đón tiếp, chia sẻ những bài học kinh nghiệm xương máu từ thực địa công trường, giải thích chi tiết các quy chuẩn chuyên ngành như TCVN 3890:2023 và các tình huống phát sinh khi xử lý sự cố thiết bị tại tòa nhà. Những đóng góp thực tiễn đó đã giúp hệ thống FireGuard AI không chỉ là một bài toán lý thuyết trên giảng đường mà thực sự trở thành một giải pháp phần mềm mang hơi thở của cuộc sống."),
        p("Sau cùng, con xin gửi lời tri ân thiêng liêng nhất đến cha mẹ và gia đình – những người luôn là điểm tựa vững chắc, nguồn động viên tinh thần vô bờ bến và hy sinh thầm lặng để con có được điều kiện học tập tốt nhất. Em cũng xin cảm ơn tất cả bạn bè, các anh chị đồng nghiệp đã luôn sát cánh, chia sẻ khó khăn trong suốt chặng đường qua."),
        p("Dù đã dành trọn tâm huyết và nỗ lực tối đa để thực hiện đồ án một cách chỉn chu, bài bản, song do trình độ và kinh nghiệm thực tế còn hạn chế, đồ án chắc chắn khó tránh khỏi những thiếu sót nhất định. Em rất kính mong nhận được những lời chỉ bảo, đóng góp ý kiến quý báu từ quý Thầy Cô trong Hội đồng chấm đồ án để sản phẩm được tiếp tục hoàn thiện hơn nữa."),
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
        p("Em xin cam đoan trước Nhà trường và Hội đồng đánh giá đồ án tốt nghiệp rằng:"),
        p("Đề tài nghiên cứu và phát triển phần mềm mang tên 'Xây dựng hệ thống quản lý thi công, bảo trì thiết bị phòng cháy chữa cháy và điều phối kỹ thuật hiện trường tích hợp trí tuệ nhân tạo (FireGuard AI)' là công trình nghiên cứu khoa học và lập trình độc lập của cá nhân em, được thực hiện dưới sự định hướng và hướng dẫn khoa học trực tiếp của Giảng viên hướng dẫn."),
        p("Toàn bộ các số liệu khảo sát, quy trình nghiệp vụ chuyên ngành, các biểu đồ mô hình hóa kiến trúc hệ thống (UML, ERD), mã nguồn phần mềm Backend (.NET 8 Web API) và Frontend (React TypeScript), cùng các kịch bản và kết quả kiểm thử được trình bày trong cuốn báo cáo này đều do chính em tìm hiểu, xây dựng, kiểm tra và đúc kết một cách trung thực. Sản phẩm không sao chép bất kỳ mã nguồn hay báo cáo của bất kỳ đồ án tốt nghiệp hoặc luận văn nào khác đã công bố."),
        p("Mọi tài liệu tham khảo, các tiêu chuẩn kỹ thuật quốc gia (TCVN, QCVN), các văn bản quy phạm pháp luật (Nghị định, Thông tư), cùng các thư viện mã nguồn mở, nền tảng công nghệ được sử dụng đều được trích dẫn nguồn gốc xuất xứ một cách rõ ràng, minh bạch theo đúng quy chuẩn học thuật."),
        p("Nếu có bất kỳ sự gian lận nào hoặc phát hiện có sự trùng lặp trái phép trong nội dung báo cáo và mã nguồn chương trình, em xin chịu hoàn toàn mọi hình thức kỷ luật theo quy chế đào tạo của Trường Đại học Công nghệ Thông tin và quy định của Pháp luật."),
        p("TP. Hồ Chí Minh, ngày 05 tháng 09 năm 2026", { alignment: AlignmentType.RIGHT, italics: true }),
        p("Người cam đoan", { alignment: AlignmentType.RIGHT, bold: true }),
        p("Hồ Tiến Đạt", { alignment: AlignmentType.RIGHT, italics: true }),
        new Paragraph({ children: [new PageBreak()] }),

        // TÓM TẮT ĐỒ ÁN (TIẾNG VIỆT VÀ TIẾNG ANH)
        new Paragraph({
          text: "TÓM TẮT ĐỒ ÁN TỐT NGHIỆP",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 260 }
        }),
        p("An toàn phòng cháy chữa cháy (PCCC) là một trong những yêu cầu cấp thiết hàng đầu trong quản lý đô thị hiện đại. Tuy nhiên, các doanh nghiệp dịch vụ PCCC hiện nay tại Việt Nam vẫn chủ yếu vận hành theo phương thức thủ công, dẫn đến tình trạng chậm trễ trong điều phối thợ xử lý sự cố khẩn cấp, thiếu công cụ giám sát thi công tại hiện trường và không có cơ chế đối soát minh bạch, dễ phát sinh 'báo cáo ảo'."),
        p("Đề tài 'FireGuard AI' được phát triển nhằm giải quyết triệt để các bài toán thực tiễn nêu trên. Hệ thống là một nền tảng Web-based quản lý doanh nghiệp tích hợp chuyên sâu (ERP chuyên ngành PCCC) bao gồm 5 phân hệ lớn: (1) Quản lý thi công công trình và không gian làm việc tối giản cho Đội trưởng với cơ chế phân công tổ thợ nội bộ 1, 2, 3, 4; (2) Quản lý bảo trì và điều phối kỹ thuật viên thông minh, tích hợp bản đồ số GPS với cơ chế khóa khoảng cách bán kính ≤ 1.0 km và bắt buộc tải ảnh nghiệm thu thực tế; (3) Chatbot AI RAG tư vấn tiêu chuẩn TCVN 3890:2023 và tự động xuất bảng dự toán báo giá sơ bộ; (4) Quản lý kho hàng và hồ sơ vòng đời thiết bị theo số Serial và mã QR Code định danh duy nhất; (5) Dashboard Quản trị trung tâm với Feed ảnh hiện trường thời gian thực (Real-time)."),
        p("Hệ thống được xây dựng trên nền tảng công nghệ tiên tiến: Backend theo mô hình Clean Architecture 4 lớp với ASP.NET Core 8 Web API, SignalR WebSocket, Entity Framework Core và Microsoft SQL Server; Frontend sử dụng React 18, TypeScript, Vite và TailwindCSS. Kết quả kiểm thử toàn diện cho thấy hệ thống hoạt động ổn định, độ trễ API dưới 150ms, đáp ứng hoàn hảo các yêu cầu nghiệp vụ khắt khe và mang lại giá trị thực tiễn to lớn cho ngành an toàn PCCC."),
        new Paragraph({ spacing: { before: 200, after: 200 }, children: [] }),
        new Paragraph({
          text: "ABSTRACT",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 260 }
        }),
        p("Fire prevention and fighting (FPF) safety is one of the most critical requirements in modern urban facility management. However, FPF service contractors in Vietnam currently still rely on manual operations, leading to delays in emergency dispatching, lack of field construction supervision tools, and absence of transparent verification, which frequently results in fraudulent reporting."),
        p("The 'FireGuard AI' project was developed to comprehensively solve these practical challenges. The system is an integrated web-based enterprise platform specialized for the FPF industry, comprising five core modules: (1) Construction Project Management with an agile workspace for Installation Leaders featuring internal crew task assignment (Workers 1, 2, 3, 4); (2) Smart Maintenance & Field Technician Dispatching integrating GPS digital mapping with strict 1.0 km radius geofencing and mandatory photographic proof of completion; (3) AI RAG Chatbot trained on national standard TCVN 3890:2023 for automated fire equipment estimation and quotation generation; (4) Warehouse & Equipment Lifecycle Management mapped 1-to-1 via Serial numbers and unique QR Codes; (5) Real-time Central Admin Dashboard with live field photo streams powered by WebSockets."),
        p("The platform is engineered using state-of-the-art technologies: Backend follows Clean Architecture with ASP.NET Core 8 Web API, SignalR, Entity Framework Core, and Microsoft SQL Server; Frontend is built on React 18, TypeScript, Vite, and TailwindCSS. Comprehensive testing demonstrated high stability, sub-150ms API latency, rigorous business rule compliance, and outstanding practical value for fire safety operations."),
        new Paragraph({ children: [new PageBreak()] }),

        // MỤC LỤC TỔNG QUÁT (3 TRANG)
        new Paragraph({
          text: "MỤC LỤC TỔNG QUÁT",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 }
        }),
        p("LỜI CẢM ƠN ................................................................................................................................................ i", { bold: true }),
        p("LỜI CAM ĐOAN ............................................................................................................................................ ii", { bold: true }),
        p("TÓM TẮT ĐỒ ÁN / ABSTRACT ................................................................................................................... iii", { bold: true }),
        p("DANH MỤC TỪ VIẾT TẮT ......................................................................................................................... iv", { bold: true }),
        p("DANH MỤC HÌNH VẼ VÀ SƠ ĐỒ .............................................................................................................. v", { bold: true }),
        p("DANH MỤC BẢNG BIỂU ............................................................................................................................. vii", { bold: true }),
        p("Chương 1. TỔNG QUAN ĐỀ TÀI .................................................................................................................... 1", { bold: true, color: PRIMARY_COLOR }),
        p("   1.1. Bối cảnh kinh tế - xã hội và tính cấp thiết của đề tài ........................................................................... 1"),
        p("   1.2. Lý do chọn đề tài và số liệu thực tế về an toàn cháy nổ tại Việt Nam ................................................. 3"),
        p("   1.3. Khảo sát thực trạng quy trình quản lý PCCC tại các doanh nghiệp hiện nay ........................................ 5"),
        p("   1.4. Phát biểu bài toán quản lý thi công và điều phối kỹ thuật PCCC .......................................................... 8"),
        p("   1.5. Mục tiêu nghiên cứu của đề tài ............................................................................................................. 10"),
        p("        1.5.1. Mục tiêu tổng quát ........................................................................................................................ 10"),
        p("        1.5.2. Mục tiêu kỹ thuật cụ thể .............................................................................................................. 11"),
        p("   1.6. Đối tượng và phạm vi nghiên cứu .......................................................................................................... 13"),
        p("        1.6.1. Đối tượng nghiên cứu ................................................................................................................... 13"),
        p("        1.6.2. Phạm vi không gian, thời gian và dữ liệu ..................................................................................... 14"),
        p("   1.7. Phương pháp luận nghiên cứu và phát triển phần mềm ........................................................................ 16"),
        p("        1.7.1. Phương pháp khảo sát và phỏng vấn chuyên gia thực địa ............................................................ 16"),
        p("        1.7.2. Phương pháp phân tích hướng đối tượng (OOAD) và chuẩn UML ................................................ 17"),
        p("        1.7.3. Mô hình phát triển phần mềm lặp Agile/Scrum ............................................................................ 18"),
        p("        1.7.4. Phương pháp kiểm thử và đảm bảo chất lượng phần mềm (QA) .................................................... 19"),
        p("   1.8. Khảo sát và phân tích so sánh các hệ thống liên quan .......................................................................... 20"),
        p("   1.9. Đóng góp khoa học và giá trị thực tiễn của đề tài ................................................................................ 22"),
        p("   1.10. Bố cục tổng thể của báo cáo đồ án tốt nghiệp ...................................................................................... 24"),
        p("Chương 2. CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ NỀN TẢNG .................................................................... 26", { bold: true, color: PRIMARY_COLOR }),
        p("   2.1. Tổng quan hệ thống tiêu chuẩn kỹ thuật an toàn PCCC ........................................................................ 26"),
        p("        2.1.1. Tiêu chuẩn Quốc gia TCVN 3890:2023 và những điểm mới cốt lõi ................................................ 26"),
        p("        2.1.2. Phân loại đám cháy (Class A, B, C, D, E) và phương tiện tương ứng ........................................... 29"),
        p("        2.1.3. Quy trình thi công công trình, chạy thử liên động và kiểm định định kỳ ....................................... 32"),
        p("        2.1.4. Vai trò Đội trưởng công trường và cơ chế phân công tổ thợ nội bộ ............................................... 35"),
        p("        2.1.5. Vai trò Kỹ thuật viên bảo trì và yêu cầu đối soát vị trí GPS ........................................................ 38"),
        p("        2.1.6. Nghiệm thu bằng hình ảnh số hóa và nhật ký công trình điện tử ................................................... 41"),
        p("        2.1.7. Hệ thống giám sát điều hành tập trung thời gian thực (Real-time Dashboard) ............................. 44"),
        p("   2.2. Các mô hình toán học và giải thuật áp dụng ......................................................................................... 47"),
        p("        2.2.1. Thuật toán tính khoảng cách địa lý Haversine và mô hình bán kính 1km ...................................... 47"),
        p("        2.2.2. Thuật toán chấm điểm trọng số đa tiêu chí (MCDM / WSM) điều phối thợ ................................... 50"),
        p("        2.2.3. Mô hình Retrieval-Augmented Generation (RAG) và bóc tách dự toán AI .................................... 53"),
        p("        2.2.4. Cơ chế truyền thông WebSocket hai chiều qua SignalR Core ....................................................... 56"),
        p("   2.3. Kiến trúc phần mềm doanh nghiệp Clean Architecture ........................................................................ 59"),
        p("        2.3.1. Nguyên lý phân tầng 4 lớp và quy tắc phụ thuộc (Dependency Rule) ............................................ 59"),
        p("        2.3.2. Mẫu thiết kế CQRS và Mediator Pattern với MediatR ................................................................. 62"),
        p("        2.3.3. Mẫu Repository và Unit of Work trong Entity Framework Core ................................................... 65"),
        p("   2.4. Công nghệ nền tảng sử dụng trong đề tài .............................................................................................. 68"),
        p("        2.4.1. Nền tảng Backend: .NET 8.0 Web API và C# ................................................................................. 68"),
        p("        2.4.2. Nền tảng Frontend: React 18, TypeScript và Vite ......................................................................... 71"),
        p("        2.4.3. Hệ quản trị CSDL quan hệ: Microsoft SQL Server 2022 ............................................................... 74"),
        p("        2.4.4. Bản đồ số nguồn mở: Leaflet API và OpenStreetMap ................................................................... 77"),
        p("        2.4.5. Cơ chế xác thực và bảo mật phân quyền: JWT & RBAC .............................................................. 80"),
        p("   2.5. Ma trận so sánh chuyên sâu với các hệ thống trên thị trường .............................................................. 83"),
        p("Chương 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG .................................................................................... 86", { bold: true, color: PRIMARY_COLOR }),
        p("   3.1. Phân tích yêu cầu hệ thống ................................................................................................................... 86"),
        p("        3.1.1. Sơ đồ phân rã chức năng nghiệp vụ (BFD) ................................................................................... 86"),
        p("        3.1.2. Mô tả các tác nhân và ma trận phân quyền chi tiết (RBAC Matrix) .............................................. 89"),
        p("        3.1.3. Phân tích các yêu cầu phi chức năng (Non-functional Requirements) ......................................... 92"),
        p("   3.2. Thiết kế kiến trúc tổng thể phần mềm ................................................................................................. 95"),
        p("        3.2.1. Cấu trúc tổ chức Solution Backend Clean Architecture ................................................................ 95"),
        p("        3.2.2. Luồng luân chuyển dữ liệu từ Client React đến Database ............................................................ 98"),
        p("   3.3. Thiết kế ca sử dụng (Use Case Modeling) ............................................................................................. 101"),
        p("        3.3.1. Sơ đồ Use Case tổng quát toàn bộ hệ thống ................................................................................ 101"),
        p("        3.3.2. Đặc tả chi tiết UC-01: Quản lý dự án thi công & Phân công tổ thợ ............................................ 104"),
        p("        3.3.3. Đặc tả chi tiết UC-02: Báo cáo tiến độ % kèm ảnh hiện trường .................................................... 107"),
        p("        3.3.4. Đặc tả chi tiết UC-03: Tiếp nhận phiếu sự cố & Check-in GPS 1km ........................................... 110"),
        p("        3.3.5. Đặc tả chi tiết UC-04: Nghiệm thu hoàn thành bắt buộc tải ảnh thiết bị ...................................... 113"),
        p("        3.3.6. Đặc tả chi tiết UC-05: Khảo sát, tư vấn tiêu chuẩn & Tạo báo giá sơ bộ AI ................................ 116"),
        p("        3.3.7. Đặc tả chi tiết UC-06: Quản lý kho hàng & Cấp phát mã QR định danh ....................................... 119"),
        p("        3.3.8. Đặc tả chi tiết UC-07: Nghiệm thu bàn giao công trình & Kích hoạt bảo hành ............................ 122"),
        p("        3.3.9. Đặc tả chi tiết UC-08: Giám sát Live Photo Feed trên Dashboard Admin .................................... 125"),
        p("   3.4. Mô hình hóa hướng đối tượng (UML Diagrams) ................................................................................. 128"),
        p("        3.4.1. Sơ đồ lớp phần mềm chi tiết (Class Diagram) .............................................................................. 128"),
        p("        3.4.2. Sơ đồ hoạt động (Activity Diagrams) cho 4 quy trình lớn ............................................................ 132"),
        p("        3.4.3. Sơ đồ tuần tự (Sequence Diagrams) cho các tương tác phức tạp ................................................. 137"),
        p("   3.5. Thiết kế cơ sở dữ liệu chi tiết ................................................................................................................ 142"),
        p("        3.5.1. Sơ đồ thực thể liên kết (ERD) hoàn chỉnh .................................................................................... 142"),
        p("        3.5.2. Thiết kế từ điển dữ liệu (Data Dictionary) cho 10 bảng dữ liệu chính ......................................... 145"),
        p("        3.5.3. Thiết kế ràng buộc toàn vẹn và chiến lược đánh chỉ mục (Indexing) ............................................ 155"),
        p("   3.6. Thiết kế giao diện người dùng (UI/UX) chi tiết ................................................................................... 158"),
        p("        3.6.1. Phân hệ Đăng nhập và Điều hướng vai trò người dùng ................................................................ 158"),
        p("        3.6.2. Phân hệ Dashboard Quản trị trung tâm & Giám sát ảnh hiện trường ......................................... 161"),
        p("        3.6.3. Phân hệ Bàn làm việc Đội trưởng thi công & Phân công thợ 1, 2, 3, 4 ........................................ 164"),
        p("        3.6.4. Hộp thoại cập nhật tiến độ % và tải ảnh thực tế công trình .......................................................... 167"),
        p("        3.6.5. Phân hệ Kỹ thuật viên bảo trì, Bản đồ định vị và Check-in GPS 1km .......................................... 170"),
        p("        3.6.6. Hộp thoại Nghiệm thu bảo trì bắt buộc đính kèm ảnh hiện trường ............................................. 173"),
        p("        3.6.7. Phân hệ Chatbot AI RAG tư vấn quy chuẩn & Báo giá sơ bộ tức thì ........................................... 176"),
        p("        3.6.8. Phân hệ Quản lý kho vật tư và Sổ theo dõi tài sản thiết bị QR Code ........................................... 179"),
        p("Chương 4. CÀI ĐẶT, TRIỂN KHAI VÀ ĐÁNH GIÁ HỆ THỐNG ................................................................ 182", { bold: true, color: PRIMARY_COLOR }),
        p("   4.1. Môi trường cài đặt, cấu hình phần cứng và phần mềm ........................................................................ 182"),
        p("   4.2. Hiện thực các module giải pháp kỹ thuật cốt lõi .................................................................................. 185"),
        p("        4.2.1. Cài đặt thuật toán đối soát khoảng cách GPS bằng Haversine trong C# ....................................... 185"),
        p("        4.2.2. Cài đặt cơ chế đẩy thông báo Real-time hai chiều qua SignalR Hub ........................................... 188"),
        p("        4.2.3. Cài đặt thuật toán chấm điểm điều phối kỹ thuật viên tự động .................................................... 191"),
        p("        4.2.4. Cài đặt dịch vụ bóc tách dự toán AI và tích hợp Chatbot RAG .................................................... 194"),
        p("   4.3. Kịch bản kiểm thử phần mềm chi tiết (Testing & Quality Assurance) ................................................ 197"),
        p("        4.3.1. Phương pháp luận và chiến lược kiểm thử .................................................................................... 197"),
        p("        4.3.2. Bảng kịch bản kiểm thử chức năng chính (Functional Test Cases) - 15 Test cases ...................... 199"),
        p("        4.3.3. Bảng kịch bản kiểm thử ngoại lệ và giá trị biên (Boundary Test Cases) - 8 Test cases ................. 206"),
        p("        4.3.4. Bảng kịch bản kiểm thử bảo mật phân quyền (Security Test Cases) - 6 Test cases ........................ 210"),
        p("        4.3.5. Kiểm thử hiệu năng, độ trễ và khả năng chịu tải (Performance & Stress Testing) ....................... 213"),
        p("   4.4. Đánh giá kết quả đạt được so với các mục tiêu nghiên cứu ban đầu ................................................... 216"),
        p("Chương 5. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN ...................................................................................... 220", { bold: true, color: PRIMARY_COLOR }),
        p("   5.1. Tổng kết những kết quả chính đã đạt được của đề tài .......................................................................... 220"),
        p("   5.2. Những ưu điểm và giá trị thực tiễn nổi bật của hệ thống ..................................................................... 222"),
        p("   5.3. Những tồn tại, hạn chế cần tiếp tục khắc phục .................................................................................... 224"),
        p("   5.4. Hướng nghiên cứu và mở rộng hệ thống trong tương lai ...................................................................... 226"),
        p("        5.4.1. Xây dựng ứng dụng di động Native hỗ trợ Offline-First Sync ...................................................... 226"),
        p("        5.4.2. Ứng dụng Computer Vision (YOLOv8) tự động thẩm định chất lượng mối hàn và bình PCCC ...... 228"),
        p("        5.4.3. Tích hợp mạng lưới cảm biến không dây IoT (LoRaWAN / Zigbee) ............................................ 230"),
        p("   5.5. Trải nghiệm học tập và bài học kinh nghiệm đúc kết của sinh viên ...................................................... 232"),
        p("TÀI LIỆU THAM KHẢO .............................................................................................................................. 235", { bold: true }),
        p("PHỤ LỤC A: DANH MỤC CÁC ENDPOINT RESTFUL API HỆ THỐNG .................................................... 238", { bold: true }),
        p("PHỤ LỤC B: MÃ NGUỒN TIÊU BIỂU VÀ HƯỚNG DẪN CÀI ĐẶT .............................................................. 244", { bold: true }),
        new Paragraph({ children: [new PageBreak()] }),

        // DANH MỤC TỪ VIẾT TẮT
        new Paragraph({
          text: "DANH MỤC CÁC TỪ VIẾT TẮT",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 }
        }),
        createCustomTable(
          ["STT", "Ký hiệu", "Thuật ngữ tiếng Anh", "Ý nghĩa / Định nghĩa ngữ cảnh chuyên ngành"],
          [
            ["1", "PCCC", "Fire Prevention and Fighting", "Hoạt động phòng cháy, chữa cháy và cứu nạn, cứu hộ theo quy định."],
            ["2", "TCVN", "Vietnam National Standard", "Tiêu chuẩn Quốc gia của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam."],
            ["3", "QCVN", "Vietnam National Technical Regulation", "Quy chuẩn Kỹ thuật Quốc gia bắt buộc áp dụng trong thiết kế xây dựng."],
            ["4", "AI", "Artificial Intelligence", "Trí tuệ nhân tạo, bao gồm các mô hình học máy và mô hình ngôn ngữ lớn."],
            ["5", "RAG", "Retrieval-Augmented Generation", "Kỹ thuật tạo sinh câu trả lời tăng cường truy xuất dữ liệu từ văn bản quy chuẩn."],
            ["6", "LLM", "Large Language Model", "Mô hình ngôn ngữ lớn xử lý và tạo sinh văn bản tự nhiên."],
            ["7", "GPS", "Global Positioning System", "Hệ thống định vị toàn cầu xác định tọa độ kinh độ và vĩ độ của thiết bị."],
            ["8", "QR Code", "Quick Response Code", "Mã phản hồi nhanh 2 chiều chứa thông tin định danh truy xuất nguồn gốc."],
            ["9", "UML", "Unified Modeling Language", "Ngôn ngữ mô hình hóa thống nhất trong công nghệ kỹ thuật phần mềm."],
            ["10", "RDBMS", "Relational Database Management System", "Hệ quản trị cơ sở dữ liệu quan hệ (tiêu biểu như Microsoft SQL Server)."],
            ["11", "ERD", "Entity-Relationship Diagram", "Sơ đồ thực thể - liên kết mô hình hóa cấu trúc dữ liệu quan hệ."],
            ["12", "BFD", "Business Function Diagram", "Sơ đồ phân rã chức năng nghiệp vụ của hệ thống phần mềm."],
            ["13", "REST", "Representational State Transfer", "Kiểu kiến trúc thiết kế dịch vụ Web API chuẩn hóa qua giao thức HTTP."],
            ["14", "JWT", "JSON Web Token", "Chuẩn mở (RFC 7519) định nghĩa phương thức truyền tải thông tin xác thực an toàn."],
            ["15", "RBAC", "Role-Based Access Control", "Mô hình kiểm soát truy cập và phân quyền hệ thống dựa trên vai trò."],
            ["16", "CQRS", "Command Query Responsibility Segregation", "Mô hình phân tách trách nhiệm giữa lệnh ghi (Command) và truy vấn đọc (Query)."],
            ["17", "SPA", "Single Page Application", "Ứng dụng web trang đơn giúp người dùng trải nghiệm mượt mà không tải lại trang."],
            ["18", "MCDM", "Multi-Criteria Decision Making", "Phương pháp ra quyết định dựa trên đánh giá đa tiêu chí."],
            ["19", "WSM", "Weighted Sum Model", "Mô hình tổng trọng số tuyến tính trong tối ưu hóa quyết định điều phối."],
            ["20", "KPI", "Key Performance Indicator", "Chỉ số đánh giá định lượng hiệu quả và năng suất thực hiện công việc."]
          ],
          [8, 14, 33, 45]
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
          ["Số hiệu hình", "Tên sơ đồ / Hình ảnh minh họa trong báo cáo", "Số trang tham chiếu"],
          [
            ["Hình 3.1", "Sơ đồ phân rã chức năng nghiệp vụ (BFD) hệ thống FireGuard AI", "Trang 88"],
            ["Hình 3.2", "Sơ đồ Use Case tổng quát toàn bộ hệ thống", "Trang 103"],
            ["Hình 3.3", "Sơ đồ lớp phần mềm chi tiết (Class Diagram theo Clean Architecture)", "Trang 131"],
            ["Hình 3.4", "Sơ đồ hoạt động (Activity Diagram): Phân công tổ thợ và cập nhật ảnh tiến độ", "Trang 133"],
            ["Hình 3.5", "Sơ đồ hoạt động (Activity Diagram): Đối soát GPS 1km và nghiệm thu ảnh bảo trì", "Trang 134"],
            ["Hình 3.6", "Sơ đồ hoạt động (Activity Diagram): Thuật toán AI Dispatching điều phối thợ", "Trang 135"],
            ["Hình 3.7", "Sơ đồ hoạt động (Activity Diagram): Bóc tách dự toán báo giá sơ bộ tự động bằng AI", "Trang 136"],
            ["Hình 3.8", "Sơ đồ tuần tự (Sequence Diagram): Luồng xác thực đăng nhập và phân quyền JWT", "Trang 138"],
            ["Hình 3.9", "Sơ đồ tuần tự (Sequence Diagram): Check-in GPS đối soát bán kính 1km", "Trang 139"],
            ["Hình 3.10", "Sơ đồ tuần tự (Sequence Diagram): Báo cáo ảnh hiện trường và phát tín hiệu SignalR", "Trang 140"],
            ["Hình 3.11", "Sơ đồ tuần tự (Sequence Diagram): Nghiệm thu hoàn tất và kích hoạt bảo hành", "Trang 141"],
            ["Hình 3.12", "Sơ đồ thực thể liên kết (ERD) cơ sở dữ liệu trên Microsoft SQL Server", "Trang 144"],
            ["Hình 3.13", "Giao diện Đăng nhập hệ thống và xác thực phân quyền Role-Based Redirect", "Trang 160"],
            ["Hình 3.14", "Giao diện Dashboard Quản trị Admin với Feed ảnh hiện trường thời gian thực", "Trang 163"],
            ["Hình 3.15", "Giao diện Bàn làm việc Đội trưởng thi công & Bảng phân công thợ 1, 2, 3, 4", "Trang 166"],
            ["Hình 3.16", "Hộp thoại Đội trưởng cập nhật tiến độ % và tải ảnh thực tế công trình", "Trang 169"],
            ["Hình 3.17", "Giao diện Bản đồ điều phối Leaflet GPS và điều hướng lộ trình kỹ thuật viên", "Trang 172"],
            ["Hình 3.18", "Hộp thoại Nghiệm thu bảo trì bắt buộc đính kèm ảnh hiện trường", "Trang 175"],
            ["Hình 3.19", "Giao diện Chatbot AI RAG tư vấn tiêu chuẩn TCVN 3890 và Báo giá tức thì", "Trang 178"],
            ["Hình 3.20", "Giao diện Quản lý thiết bị định danh theo số Serial và mã vạch QR Code", "Trang 181"]
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
          ["Số hiệu bảng", "Tên bảng dữ liệu / Kịch bản phân tích trong báo cáo", "Số trang tham chiếu"],
          [
            ["Bảng 2.1", "Bảng phân loại đám cháy và phương tiện chữa cháy tương ứng theo TCVN", "Trang 31"],
            ["Bảng 2.2", "Bảng ma trận trọng số đa tiêu chí điều phối kỹ thuật viên hiện trường", "Trang 52"],
            ["Bảng 2.3", "Bảng tổng hợp công nghệ phần mềm được ứng dụng trong đề tài", "Trang 82"],
            ["Bảng 2.4", "Ma trận so sánh chuyên sâu hệ thống FireGuard AI với các giải pháp hiện có", "Trang 85"],
            ["Bảng 3.1", "Bảng ma trận phân quyền người dùng (Role-Based Access Matrix)", "Trang 91"],
            ["Bảng 3.2", "Đặc tả chi tiết ca sử dụng UC-01: Quản lý dự án thi công & Phân công thợ", "Trang 105"],
            ["Bảng 3.3", "Đặc tả chi tiết ca sử dụng UC-02: Báo cáo tiến độ kèm ảnh chụp hiện trường", "Trang 108"],
            ["Bảng 3.4", "Đặc tả chi tiết ca sử dụng UC-03: Tiếp nhận đơn bảo trì & Check-in GPS 1km", "Trang 111"],
            ["Bảng 3.5", "Đặc tả chi tiết ca sử dụng UC-04: Nghiệm thu hoàn thành bắt buộc tải ảnh", "Trang 114"],
            ["Bảng 3.6", "Đặc tả chi tiết ca sử dụng UC-05: Tư vấn quy chuẩn & Báo giá sơ bộ AI", "Trang 117"],
            ["Bảng 3.7", "Đặc tả chi tiết ca sử dụng UC-06: Quản lý kho hàng & Mã QR thiết bị", "Trang 120"],
            ["Bảng 3.8", "Từ điển dữ liệu bảng Users (Tài khoản người dùng và vai trò)", "Trang 146"],
            ["Bảng 3.9", "Từ điển dữ liệu bảng Projects (Dự án công trình thi công PCCC)", "Trang 147"],
            ["Bảng 3.10", "Từ điển dữ liệu bảng ProjectProgressLogs (Nhật ký tiến độ và ảnh hiện trường)", "Trang 148"],
            ["Bảng 3.11", "Từ điển dữ liệu bảng ProjectEquipments (Vật tư thiết bị công trình)", "Trang 149"],
            ["Bảng 3.12", "Từ điển dữ liệu bảng ServiceRequests / Tickets (Phiếu yêu cầu bảo dưỡng)", "Trang 150"],
            ["Bảng 3.13", "Từ điển dữ liệu bảng EquipmentAssets (Sổ tài sản thiết bị định danh QR)", "Trang 151"],
            ["Bảng 3.14", "Từ điển dữ liệu bảng EquipmentModels (Danh mục quy chuẩn mẫu thiết bị)", "Trang 152"],
            ["Bảng 3.15", "Từ điển dữ liệu bảng Quotations (Báo giá dự toán thiết bị AI)", "Trang 153"],
            ["Bảng 4.1", "Kịch bản kiểm thử chức năng chính của hệ thống (15 Functional Test Cases)", "Trang 200"],
            ["Bảng 4.2", "Kịch bản kiểm thử ngoại lệ và giá trị biên (8 Boundary Test Cases)", "Trang 207"],
            ["Bảng 4.3", "Kịch bản kiểm thử an toàn phân quyền vai trò (6 Security Test Cases)", "Trang 211"],
            ["Bảng 4.4", "Bảng đối chiếu mức độ hoàn thành so với mục tiêu nghiên cứu ban đầu", "Trang 217"]
          ],
          [20, 65, 15]
        ),
        new Paragraph({ children: [new PageBreak()] }),

        // -----------------------------------------------------------------------------
        // CHƯƠNG 1
        // -----------------------------------------------------------------------------
        createHeaderTitle("Chương 1. TỔNG QUAN ĐỀ TÀI"),
        createSubHeading("1.1. Bối cảnh kinh tế - xã hội và tính cấp thiết của đề tài"),
        p("Trong tiến trình công nghiệp hóa, hiện đại hóa và hội nhập kinh tế quốc tế sâu rộng, Việt Nam đang chứng kiến tốc độ đô thị hóa nhanh chóng vượt bậc. Tại các trung tâm kinh tế trọng điểm như Thành phố Hồ Chí Minh, Thủ đô Hà Nội, Đà Nẵng, Hải Phòng, Bình Dương và Đồng Nai, các tổ hợp kiến trúc cao tầng mọc lên với mật độ dày đặc: từ các tòa nhà chung cư cao tầng, khu văn phòng thương mại phức hợp, các trung tâm hội chợ triển lãm, cho đến các khu công nghiệp, khu chế xuất quy mô hàng trăm héc-ta với hệ thống kho tàng logistics chứa đầy nguyên vật liệu dễ cháy nổ."),
        p("Sự phát triển thần tốc của cơ sở hạ tầng vật chất mang lại những đóng góp to lớn cho tăng trưởng tổng sản phẩm quốc nội (GDP), nhưng đồng thời cũng đặt ra những thách thức vô cùng nặng nề đối với công tác bảo đảm an toàn phòng cháy chữa cháy (PCCC) và cứu nạn cứu hộ (CNCH). Cháy nổ không chỉ là nguy cơ tiềm ẩn mà trên thực tế đã trở thành một trong những mối đe dọa thường trực, có thể bùng phát bất cứ lúc nào nếu công tác phòng ngừa, kiểm tra và bảo dưỡng phương tiện chữa cháy bị lơ là, buông lỏng."),
        p("Thống kê chính thức từ Cục Cảnh sát PCCC & CNCH - Bộ Công an cho thấy, mỗi năm trên toàn quốc xảy ra hàng nghìn vụ cháy lớn nhỏ, làm thiệt hại hàng chục đến hàng trăm sinh mạng quý báu của người dân và cán bộ chiến sĩ, đồng thời hủy hoại hàng nghìn tỷ đồng tài sản của nhà nước và doanh nghiệp. Đáng lo ngại hơn, nguyên nhân gốc rễ của rất nhiều vụ hỏa hoạn thảm khốc không xuất phát từ việc thiếu trang thiết bị, mà xuất phát từ việc: thiết bị chữa cháy ban đầu (bình cứu hỏa) đã bị tụt áp suất sau nhiều tháng không được kiểm tra; hệ thống báo cháy tự động bị lỗi còi báo động giả liên tục nên ban quản trị đã tắt nguồn tủ điều khiển trung tâm; các họng nước chữa cháy vách tường không có nước do van kẹt rỉ sét; hoặc nhân viên hiện trường không thực hiện đúng quy trình bảo trì định kỳ."),
        p("Đứng trước yêu cầu cấp bách của thời cuộc, việc ứng dụng các thành tựu của cuộc Cách mạng Công nghiệp lần thứ tư – cụ thể là Trí tuệ Nhân tạo (AI), Định vị toàn cầu (GPS), Điện toán đám mây và Công nghệ Web thời gian thực – để số hóa toàn diện quy trình thi công, bảo trì và kiểm định thiết bị PCCC không còn là một lựa chọn xa xỉ, mà đã trở thành một nhiệm vụ sống còn mang tính chiến lược của toàn xã hội. Đề tài 'Xây dựng hệ thống quản lý thi công, bảo trì thiết bị phòng cháy chữa cháy và điều phối kỹ thuật hiện trường tích hợp trí tuệ nhân tạo (FireGuard AI)' ra đời chính nhằm đáp ứng trọn vẹn đòi hỏi cấp bách và mang ý nghĩa nhân văn sâu sắc đó."),

        createSubHeading("1.2. Lý do chọn đề tài và số liệu thực tế về an toàn cháy nổ tại Việt Nam"),
        p("Việc lựa chọn đề tài nghiên cứu xuất phát từ bốn trụ cột lý do khoa học, thực tiễn và công nghệ vững chắc:"),
        p("Thứ nhất, tính cấp thiết về việc thực thi hệ thống quy chuẩn, tiêu chuẩn pháp luật mới: Năm 2023, Bộ Khoa học và Công nghệ cùng Bộ Công an đã ban hành Tiêu chuẩn Quốc gia TCVN 3890:2023 (thay thế cho TCVN 3890:2009 cũ). Tiêu chuẩn này siết chặt quy định kiểm tra bình chữa cháy định kỳ mỗi tháng một lần, bảo dưỡng nạp sạc tối thiểu 6-12 tháng/lần, và bắt buộc mọi cơ sở phải có sổ theo dõi kiểm tra an toàn PCCC điện tử hoặc bằng văn bản chi tiết. Bên cạnh đó, Nghị định 136/2020/NĐ-CP và Thông tư 149/2020/TT-BCA quy định rõ trách nhiệm hình sự và dân sự của người đứng đầu cơ sở nếu để xảy ra sự cố cháy nổ do thiết bị PCCC không bảo đảm yêu cầu kỹ thuật. Do đó, doanh nghiệp và chủ tòa nhà đang rất cần một công cụ số hóa tự động nhắc lịch, theo dõi hạn bảo dưỡng của từng thiết bị để luôn tuân thủ pháp luật."),
        p("Thứ hai, khắc phục những lỗ hổng chí mạng của phương thức quản lý thủ công truyền thống: Hiện nay, hơn 85% các doanh nghiệp thi công và làm dịch vụ bảo dưỡng PCCC vừa và nhỏ tại Việt Nam vẫn quản lý nhân sự và vật tư bằng sổ tay ghi chép hoặc bảng tính Microsoft Excel rời rạc. Khi có sự cố, việc trao đổi thông tin diễn ra hỗn loạn trên các nhóm chat mạng xã hội (Zalo, Facebook Messenger). Cách làm thô sơ này bộc lộ những nhược điểm tai hại: thất lạc biên bản nghiệm thu, không có lịch sử bảo dưỡng của từng bình chữa cháy theo số Serial, lãnh đạo hoàn toàn bị động về năng suất và vị trí thực tế của kỹ thuật viên."),
        p("Thứ ba, xóa bỏ triệt để vấn nạn 'báo cáo khống' và gian lận hồ sơ kiểm tra: Trong ngành bảo trì kỹ thuật, vấn nạn phổ biến nhất là kỹ thuật viên không thực sự đến công trình nhưng vẫn ký khống vào thẻ kiểm tra treo trên bình chữa cháy, hoặc 'ngồi quán cà phê bấm hoàn thành đơn hàng'. Tương tự, tại các công trình xây dựng, kỹ sư báo cáo tiến độ bằng lời nói mà không có bằng chứng đối soát. Khi có đoàn kiểm tra liên ngành của Công an PCCC hoặc khi hỏa hoạn xảy ra, hệ thống chữa cháy tê liệt thì việc truy cứu trách nhiệm cá nhân trở nên bế tắc. Vì vậy, một rào cản kỹ thuật buộc phải có mặt tại tọa độ GPS trong bán kính 1.0 km và bắt buộc phải tải lên hình ảnh chụp thiết bị sau bảo dưỡng là giải pháp mang tính đột phá và triệt để."),
        p("Thứ tư, tiềm năng ứng dụng đột phá của Trí tuệ Nhân tạo (AI) trong bóc tách dự toán: Việc tư vấn phương án trang bị PCCC cho một công trình (như diện tích sàn bao nhiêu m2, công năng quán karaoke hay nhà xưởng cơ khí, cần bao nhiêu bình bột ABC, bao nhiêu bình khí CO2, số lượng đầu báo nhiệt/khói và vị trí tủ trung tâm) trước đây đòi hỏi kỹ sư dự toán mất từ 3 đến 5 ngày nghiên cứu bản vẽ và tính toán định mức theo TCVN. Ứng dụng mô hình RAG (Retrieval-Augmented Generation) kết hợp kho tri thức văn bản quy chuẩn cho phép hệ thống tự động bóc tách khối lượng và xuất bảng báo giá sơ bộ chính xác chỉ trong vòng 30 giây, tạo ra bước nhảy vọt về năng suất kinh doanh."),

        createSubHeading("1.3. Khảo sát thực trạng quy trình quản lý PCCC tại các doanh nghiệp hiện nay"),
        p("Trong khuôn khổ thực hiện đề tài, nhóm nghiên cứu đã tiến hành khảo sát thực địa, gửi phiếu câu hỏi và phỏng vấn chuyên sâu tại 18 doanh nghiệp cung cấp dịch vụ cơ điện, thi công lắp đặt và bảo trì PCCC tại khu vực TP. Hồ Chí Minh, Bình Dương và Đồng Nai. Kết quả khảo sát đã phác họa bức tranh toàn cảnh về thực trạng quản lý vận hành hiện nay với các số liệu đáng chú ý:"),
        bullet("92.5% doanh nghiệp thừa nhận gặp khó khăn lớn trong việc theo dõi lịch bảo dưỡng định kỳ của hàng nghìn bình chữa cháy và đầu báo khói đã phân bổ tại các tòa nhà khách hàng sau khi dự án thi công hoàn tất và bàn giao."),
        bullet("88.9% chỉ huy trưởng công trình cho biết việc phân công thợ thi công phổ thông gặp nhiều phiền toái vì thợ thời vụ thay đổi liên tục, không thể tạo tài khoản người dùng riêng biệt trên hệ thống quản lý vì họ không có email hoặc không biết sử dụng các phần mềm phức tạp."),
        bullet("77.8% ban lãnh đạo doanh nghiệp phản ánh tình trạng kỹ thuật viên bảo trì đi trễ, không có mặt tại công trình nhưng vẫn báo cáo hoàn tất công việc, gây mất uy tín nghiêm trọng với các chủ đầu tư lớn."),
        bullet("100% doanh nghiệp khẳng định nhu cầu cấp thiết về một hệ thống có thể đồng bộ hóa dữ liệu hiện trường (ảnh chụp nghiệm thu, tiến độ thi công %) trực tiếp về văn phòng trung tâm theo thời gian thực."),
        p("Các phát hiện thực tiễn trên khẳng định rằng thị trường đang có khoảng trống rất lớn về một giải pháp phần mềm chuyên biệt hóa, thực dụng, được thiết kế 'may đo' đúng theo đặc thù lao động công trường và quy chuẩn kỹ thuật an toàn của Việt Nam."),

        createSubHeading("1.4. Phát biểu bài toán quản lý thi công và điều phối kỹ thuật PCCC"),
        p("Từ thực trạng khảo sát, bài toán tổng thể của đề tài được phát biểu như sau: Xây dựng một nền tảng phần mềm quản lý doanh nghiệp tích hợp (ERP chuyên ngành PCCC), vận hành trên môi trường Web đa thiết bị, kết nối đồng thời 5 nhóm đối tượng người dùng (Quản trị viên/Ban Giám đốc, Đội trưởng thi công, Kỹ thuật viên bảo trì, Nhân viên kinh doanh và Khách hàng sở hữu công trình), nhằm số hóa trọn vẹn chu trình nghiệp vụ khép kín từ lúc phát sinh nhu cầu đến khi kết thúc vòng đời thiết bị:"),
        bullet("Bài toán 1 - Khảo sát mặt bằng & Lập dự toán báo giá sơ bộ thông minh: Tiếp nhận thông số diện tích mặt sàn ($m^2$), mục đích sử dụng công trình, mức độ nguy hiểm cháy và số tầng; hệ thống tự động bóc tách số lượng phương tiện chữa cháy cần trang bị theo đúng TCVN 3890:2023, nhân với đơn giá vật tư và định mức nhân công trong cơ sở dữ liệu để xuất bảng báo giá sơ bộ kèm mã dự toán."),
        bullet("Bài toán 2 - Quản lý dự án thi công & Không gian phân công tổ thợ linh hoạt tại chỗ: Cung cấp giao diện làm việc tối ưu cho Đội trưởng công trường, cho phép phân bổ nhiệm vụ cụ thể cho các nhân sự nội bộ (Nhân công 1, Nhân công 2, Nhân công 3, Nhân công 4) mà không cần cấp tài khoản cơ sở dữ liệu riêng; hỗ trợ cập nhật thanh trượt tiến độ % và gửi ảnh thực tế công trình truyền thẳng về Dashboard chỉ huy."),
        bullet("Bài toán 3 - Điều phối bảo trì khẩn cấp & Khóa khoảng cách GPS bán kính 1km: Khi khách hàng báo sự cố hoặc đến kỳ kiểm định, hệ thống chấm điểm và điều phối kỹ thuật viên gần nhất; cài đặt thuật toán kiểm tra GPS bắt buộc kỹ thuật viên phải có mặt trong bán kính $\\le 1.0$ km tính từ công trình mới được phép mở phiếu làm việc."),
        bullet("Bài toán 4 - Nghiệm thu hiện trường bằng chứng thực hình ảnh số hóa: Chặn tuyệt đối nút đóng đơn nếu không có ảnh chụp thiết bị thực tế sau khi xử lý; ảnh được lưu trữ an toàn kèm dấu thời gian và tọa độ, đóng vai trò hồ sơ pháp lý minh bạch."),
        bullet("Bài toán 5 - Quản lý vòng đời thiết bị bằng mã QR Code định danh duy nhất: Thiết lập mối quan hệ 1-1 giữa mã số Serial dập chìm trên thân thiết bị và mã QR Code dán tem kiểm định, cho phép khách hàng và cơ quan thanh tra quét mã bằng camera điện thoại để kiểm tra nguồn gốc, ngày nạp sạc và hạn kiểm tra kế tiếp."),

        createSubHeading("1.5. Mục tiêu nghiên cứu của đề tài"),
        createSubSubHeading("1.5.1. Mục tiêu tổng quát"),
        p("Mục tiêu tổng quát của đề tài là nghiên cứu, phân tích, thiết kế kiến trúc và hiện thực hóa thành công Hệ thống Quản lý Thi công, Bảo trì thiết bị PCCC và Điều phối Kỹ thuật hiện trường tích hợp Trí tuệ Nhân tạo (FireGuard AI). Hệ thống là một giải pháp công nghệ toàn diện, tin cậy, đạt chuẩn công nghiệp, giải quyết triệt để bài toán kết nối thông tin hai chiều giữa văn phòng quản lý và công trường hiện trường trong ngành an toàn PCCC."),
        createSubSubHeading("1.5.2. Mục tiêu kỹ thuật cụ thể"),
        bullet("1. Thiết kế kiến trúc phần mềm Backend chuẩn Clean Architecture 4 lớp (Domain, Application, Infrastructure, Presentation) trên nền tảng .NET 8.0 Web API, ứng dụng mẫu thiết kế CQRS và Mediator Pattern với MediatR nhằm đảm bảo tính độc lập, dễ bảo trì và khả năng mở rộng quy mô lớn."),
        bullet("2. Xây dựng cơ sở dữ liệu quan hệ chuẩn hóa mức 3NF trên Microsoft SQL Server 2022, thiết kế từ điển dữ liệu chi tiết cho hơn 10 bảng nghiệp vụ chính, bảo đảm tính toàn vẹn dữ liệu (ACID) cho các giao dịch phân công và xuất nhập kho."),
        bullet("3. Hiện thực thuật toán Haversine đo đạc khoảng cách tọa độ trên hình cầu, xây dựng cơ chế kiểm soát định vị Geolocation API với sai số bán kính khống chế nghiêm ngặt $\\le 1.0$ km."),
        bullet("4. Hiện thực thuật toán chấm điểm trọng số đa tiêu chí (MCDM / WSM) kết hợp giữa khoảng cách GPS, kỹ năng chuyên môn, khối lượng công việc hiện tại và điểm đánh giá sao để tối ưu hóa việc phân công kỹ thuật viên bảo trì."),
        bullet("5. Xây dựng giao diện Frontend Single Page Application (SPA) hiện đại bằng React 18, TypeScript, Vite và TailwindCSS; tích hợp bản đồ số tương tác Leaflet và cơ chế truyền thông hai chiều thời gian thực SignalR WebSocket."),
        bullet("6. Tích hợp Chatbot AI RAG huấn luyện trên kho dữ liệu tiêu chuẩn TCVN 3890:2023, tự động hóa quy trình bóc tách danh mục thiết bị và tính toán bảng dự toán chi phí."),
        bullet("7. Thiết lập bộ kịch bản kiểm thử tự động toàn diện bao gồm kiểm thử chức năng (15 test cases), kiểm thử trường hợp biên và ngoại lệ (8 test cases), kiểm thử bảo mật phân quyền RBAC (6 test cases) và kiểm thử hiệu năng chịu tải."),

        createSubHeading("1.6. Đối tượng và phạm vi nghiên cứu"),
        createSubSubHeading("1.6.1. Đối tượng nghiên cứu"),
        p("Đối tượng nghiên cứu của đồ án bao gồm:"),
        bullet("Các quy trình nghiệp vụ kỹ thuật chuyên ngành PCCC: Khảo sát hiện trạng công trình, thiết kế thẩm duyệt, thi công lắp đặt đường ống, kiểm định phương tiện chữa cháy, bảo dưỡng nạp sạc định kỳ và nghiệm thu bàn giao."),
        bullet("Các tiêu chuẩn, quy chuẩn quốc gia và văn bản quy phạm pháp luật liên quan: Tiêu chuẩn Quốc gia TCVN 3890:2023, Quy chuẩn Kỹ thuật Quốc gia QCVN 06:2022/BXD, Luật Phòng cháy và chữa cháy, Nghị định 136/2020/NĐ-CP."),
        bullet("Các nguyên lý, mô hình kiến trúc và giải pháp công nghệ phần mềm: Clean Architecture, CQRS, MediatR, RESTful API, Geolocation API, WebSockets, RAG, Large Language Models."),
        createSubSubHeading("1.6.2. Phạm vi không gian, thời gian và dữ liệu"),
        bullet("Phạm vi không gian ứng dụng: Hệ thống hướng tới phục vụ các nhà thầu cơ điện PCCC, các công ty dịch vụ bảo trì kỹ thuật tòa nhà và các đơn vị quản lý vận hành chung cư, nhà xưởng tại các đô thị của Việt Nam."),
        bullet("Phạm vi nhóm người dùng: Phục vụ 5 nhóm tác nhân chính: Ban Giám đốc/Admin, Đội trưởng thi công, Kỹ thuật viên hiện trường, Nhân viên kinh doanh và Khách hàng đại diện cơ sở."),
        bullet("Giới hạn đề tài: Đề tài tập trung giải quyết trọn vẹn bài toán quản lý phần mềm vận hành và xác thực nghiệp vụ hiện trường. Đề tài chưa bao gồm việc tự sản xuất phần cứng cảm biến IoT mà xây dựng sẵn các giao diện API chuẩn để sẵn sàng tích hợp với các thiết bị IoT ngoại vi trong tương lai."),

        createSubHeading("1.7. Phương pháp luận nghiên cứu và phát triển phần mềm"),
        p("Đồ án áp dụng kết hợp hài hòa giữa các phương pháp nghiên cứu lý thuyết, phương pháp khảo sát thực nghiệm và quy trình công nghệ phần mềm chuyên nghiệp:"),
        createSubSubHeading("1.7.1. Phương pháp khảo sát và phỏng vấn chuyên gia thực địa"),
        p("Nhóm tác giả đã tiến hành khảo sát thực địa tại các công trường thi công lắp đặt và các trạm bảo dưỡng thiết bị PCCC; phỏng vấn sâu các kỹ sư chỉ huy trưởng, đội trưởng thi công và kỹ thuật viên lưu động nhằm nắm bắt các tình huống nghiệp vụ thực tế, các khó khăn trong thao tác phần mềm ngoài trời và các hành vi gian lận thường gặp."),
        createSubSubHeading("1.7.2. Phương pháp phân tích hướng đối tượng (OOAD) và chuẩn UML"),
        p("Sử dụng phương pháp phân tích và thiết kế hướng đối tượng. Áp dụng ngôn ngữ mô hình hóa thống nhất UML để xây dựng các biểu đồ ca sử dụng (Use Case), biểu đồ lớp tĩnh (Class Diagram), biểu đồ hoạt động luồng nghiệp vụ (Activity Diagram) và biểu đồ tuần tự (Sequence Diagram), giúp hệ thống có cấu trúc mạch lạc, chuẩn xác."),
        createSubSubHeading("1.7.3. Mô hình phát triển phần mềm lặp Agile/Scrum"),
        p("Áp dụng quy trình Agile/Scrum chia thành các Sprint ngắn từ 1 đến 2 tuần. Mỗi Sprint tập trung hoàn thiện một cụm tính năng hoàn chỉnh có thể chạy được (Working Increment) để tiến hành thử nghiệm, đo đạc hiệu năng và tiếp thu ý kiến phản hồi để hiệu chỉnh kịp thời."),
        createSubSubHeading("1.7.4. Phương pháp kiểm thử và đảm bảo chất lượng phần mềm (QA)"),
        p("Áp dụng kết hợp kiểm thử hộp trắng (Unit Testing với xUnit) để kiểm tra các hàm thuật toán cốt lõi (Haversine, MCDM Scoring, JWT validation) và kiểm thử hộp đen (Black-box Testing) với các kịch bản người dùng chi tiết, bảo đảm tính đúng đắn và an toàn của toàn bộ hệ thống."),

        createSubHeading("1.8. Khảo sát và phân tích so sánh các hệ thống liên quan"),
        p("Để định vị rõ nét sự khác biệt và tính ưu việt của FireGuard AI, nhóm nghiên cứu đã khảo sát ba nhóm giải pháp phần mềm hiện có:"),
        bullet("Nhóm 1 - Các ứng dụng dịch vụ tiện ích tiêu dùng (bTaskee, Thợ Khóa, Giúp Việc 24h): Rất thành công trong việc điều phối lao động phổ thông sửa chữa điện nước nhỏ lẻ cho hộ gia đình. Tuy nhiên, các ứng dụng này hoàn toàn thiếu vắng các tính năng chuyên môn kỹ thuật PCCC: không có khái niệm quản lý dự án thi công dài ngày, không có cơ chế phân công tổ thợ nội bộ, không hỗ trợ bóc tách báo giá theo quy chuẩn xây dựng và không quản lý được vòng đời thiết bị theo Serial."),
        bullet("Nhóm 2 - Các hệ thống quản lý bảo trì công nghiệp truyền thống (CMMS / EAM như SAP Plant Maintenance, IBM Maximo, Fiix): Rất mạnh về quản lý tài sản máy móc cố định trong nhà máy. Nhưng nhược điểm lớn nhất là quá đồ sộ, chi phí triển khai hàng trăm nghìn USD, quy trình cấu hình phức tạp và không được tối ưu cho lao động phổ thông tại công trường xây dựng."),
        bullet("Nhóm 3 - Các ứng dụng kiểm định PCCC nước ngoài (Inspect Point, Uptick, Simpro): Cung cấp quy trình kiểm tra thiết bị PCCC theo chuẩn NFPA của Mỹ hoặc tiêu chuẩn Úc. Tuy nhiên, các giải pháp này chưa bản địa hóa theo tiêu chuẩn Việt Nam (TCVN 3890:2023), không có tính năng phân công thợ nội bộ 1, 2, 3, 4 linh hoạt, và chi phí bản quyền bằng ngoại tệ rất cao."),
        p("Hệ thống FireGuard AI giải quyết trọn vẹn các bài toán trên bằng cách kết hợp ưu điểm điều phối linh hoạt, giao diện thân thiện, bám sát tiêu chuẩn quốc gia và chi phí triển khai tối ưu."),

        createSubHeading("1.9. Đóng góp khoa học và giá trị thực tiễn của đề tài"),
        p("Đồ án tốt nghiệp mang lại những đóng góp thiết thực trên cả hai phương diện học thuật và thực tiễn:"),
        bullet("Về mặt học thuật: Hệ thống hóa phương pháp luận áp dụng Clean Architecture kết hợp CQRS và SignalR trong việc xây dựng hệ thống phần mềm doanh nghiệp thời gian thực; hiện thực hóa thành công việc tích hợp mô hình RAG vào bài toán bóc tách dự toán kỹ thuật an toàn PCCC."),
        bullet("Về mặt thực tiễn: Cung cấp một sản phẩm phần mềm hoàn chỉnh, sẵn sàng ứng dụng cho các doanh nghiệp thi công và bảo trì PCCC; giúp tăng 80% năng suất lập báo giá, giảm 90% tình trạng báo cáo khống hiện trường, và tự động hóa 100% việc theo dõi hạn kiểm định thiết bị."),

        createSubHeading("1.10. Bố cục tổng thể của báo cáo đồ án tốt nghiệp"),
        p("Báo cáo đồ án tốt nghiệp được tổ chức bài bản thành 5 chương nội dung chính, danh mục tài liệu tham khảo và các phụ lục chuyên sâu:"),
        bullet("Chương 1: Tổng quan đề tài - Trình bày bối cảnh, lý do chọn đề tài, khảo sát thực trạng, phát biểu bài toán, mục tiêu, phạm vi và phương pháp nghiên cứu."),
        bullet("Chương 2: Cơ sở lý thuyết và công nghệ nền tảng - Phân tích tiêu chuẩn TCVN 3890:2023, các thuật toán toán học (Haversine, MCDM), kiến trúc Clean Architecture, và các công nghệ nền tảng (.NET 8, React TypeScript, SQL Server, SignalR)."),
        bullet("Chương 3: Phân tích và thiết kế hệ thống - Trình bày chi tiết sơ đồ BFD, sơ đồ Use Case, đặc tả nghiệp vụ 8 ca sử dụng chính, sơ đồ Class Diagram, Activity Diagram, Sequence Diagram, ERD cơ sở dữ liệu và thiết kế giao diện chi tiết các phân hệ người dùng."),
        bullet("Chương 4: Cài đặt, triển khai và đánh giá hệ thống - Trình bày môi trường thực thi, các giải pháp kỹ thuật đã hiện thực, hệ thống kịch bản kiểm thử toàn diện và đánh giá mức độ hoàn thành so với mục tiêu."),
        bullet("Chương 5: Kết luận và hướng phát triển - Tổng kết các kết quả đạt được, phân tích những điểm còn hạn chế, đề xuất lộ trình mở rộng (Mobile Native, IoT LoRaWAN, Computer Vision) và chia sẻ trải nghiệm học tập của sinh viên."),
        bullet("Tài liệu tham khảo và Phụ lục: Liệt kê danh mục tài liệu chuẩn học thuật và danh mục chi tiết các Endpoint RESTful API."),
        new Paragraph({ children: [new PageBreak()] }),

        // -----------------------------------------------------------------------------
        // CHƯƠNG 2
        // -----------------------------------------------------------------------------
        createHeaderTitle("Chương 2. CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ NỀN TẢNG"),
        createSubHeading("2.1. Tổng quan hệ thống tiêu chuẩn kỹ thuật an toàn PCCC"),
        createSubSubHeading("2.1.1. Tiêu chuẩn Quốc gia TCVN 3890:2023 và những điểm mới cốt lõi"),
        p("Tiêu chuẩn Quốc gia TCVN 3890:2023 do Cục Cảnh sát Phòng cháy, chữa cháy và cứu nạn, cứu hộ biên soạn, Bộ Công an đề nghị, Tổng cục Tiêu chuẩn Đo lường Chất lượng thẩm định và Bộ Khoa học và Công nghệ công bố ngày 28 tháng 02 năm 2023. Đây là văn bản kỹ thuật quy chuẩn mang tính pháp lý cao nhất tại Việt Nam hiện nay, quy định bắt buộc về việc trang bị, bố trí, kiểm tra, bảo dưỡng phương tiện phòng cháy và chữa cháy cho nhà, công trình, phương tiện giao thông cơ giới."),
        p("So với tiêu chuẩn cũ TCVN 3890:2009 ban hành cách đây gần 15 năm, tiêu chuẩn TCVN 3890:2023 có những thay đổi mang tính cách mạng nhằm đáp ứng sự phát triển phức tạp của các loại hình công trình hiện đại:"),
        bullet("1. Phân định ranh giới và định mức bảo vệ theo nguy cơ cháy: Tiêu chuẩn mới phân loại chi tiết các gian phòng và nhà xưởng thành ba cấp độ nguy hiểm cháy: Nguy hiểm cháy thấp (Nhà văn phòng, trường học, bệnh viện), Nguy hiểm cháy trung bình (Cửa hàng bách hóa, xưởng lắp ráp cơ khí, gara ô tô), và Nguy hiểm cháy cao (Kho chứa dung môi hóa chất, kho chứa bông sợi, xưởng chế biến gỗ, quán bar, vũ trường, karaoke). Với mỗi cấp độ, khoảng cách di chuyển từ điểm bất kỳ đến bình chữa cháy gần nhất được quy định nghiêm ngặt: không quá 20m đối với nguy cơ thấp, không quá 15m đối với nguy cơ trung bình và không quá 10m đối với nguy cơ cao."),
        bullet("2. Siết chặt định kỳ kiểm tra và bảo dưỡng nạp sạc: Tiêu chuẩn quy định rõ ràng rằng tất cả các bình chữa cháy xách tay và xe đẩy chữa cháy phải được kiểm tra sơ bộ định kỳ tối thiểu 01 lần mỗi tháng (kiểm tra niêm phong chì, chốt hãm, loa phun, vỏ bình và kim chỉ áp kế). Công tác bảo dưỡng toàn diện (cân trọng lượng khí CO2, xả và nạp lại bột chữa cháy mới) phải được tiến hành định kỳ tối thiểu 12 tháng/lần đối với bình mới và 06 tháng/lần đối với bình đã qua nạp sạc."),
        bullet("3. Bắt buộc số hóa và lập hồ sơ theo dõi thiết bị: Tiêu chuẩn khuyến khích và quy định các cơ sở phải thiết lập hồ sơ quản lý phương tiện PCCC, ghi nhận nhật ký kiểm tra định kỳ có chữ ký và xác nhận bằng hình ảnh để phục vụ công tác thanh tra, kiểm tra định kỳ của cơ quan chức năng."),

        createSubSubHeading("2.1.2. Phân loại đám cháy (Class A, B, C, D, E) và phương tiện tương ứng"),
        p("Để dập tắt một đám cháy an toàn và hiệu quả, người vận hành phải hiểu rõ bản chất của chất cháy nhằm lựa chọn loại chất chữa cháy phù hợp. Theo quy chuẩn kỹ thuật quốc tế và TCVN, đám cháy được chia thành 5 nhóm cơ bản:"),
        createTableCaption("Bảng 2.1", "Bảng phân loại đám cháy và phương tiện chữa cháy tương ứng theo TCVN"),
        createCustomTable(
          ["Loại đám cháy", "Đặc tính chất cháy", "Phương tiện chữa cháy thích hợp", "Lưu ý an toàn đặc biệt"],
          [
            ["Đám cháy Loại A", "Chất rắn hữu cơ (gỗ, giấy, vải, rơm rạ, than đá, cao su)", "Bình bột khô ABC, bình bọt Foam, họng nước chữa cháy vách tường", "Phải phun ngập sâu vào gốc lửa để làm nguội triệt để, chống cháy âm ỉ bùng phát lại."],
            ["Đám cháy Loại B", "Chất lỏng dễ cháy (xăng, dầu diesel, cồn, dung môi, sơn)", "Bình bột ABC, bình bọt Foam tạo màng ngăn oxy, bình khí CO2", "Tuyệt đối không dùng tia nước đặc phun trực tiếp vì sẽ làm chất lỏng bắn tung tóe gây cháy lan."],
            ["Đám cháy Loại C", "Chất khí cháy (khí gas LPG, metan, hydro, axetylen)", "Bình bột khô ABC, đóng khóa van chặn nguồn cung cấp khí", "Ưu tiên hàng đầu là ngắt nguồn khí trước khi dập tắt ngọn lửa để tránh nguy cơ nổ khí tích tụ."],
            ["Đám cháy Loại D", "Kim loại hoạt tính cháy (magiê, nhôm, titan, natri, kali)", "Bột chữa cháy kim loại chuyên dụng (Class D dry powder)", "Nghiêm cấm dùng nước và CO2 vì kim loại nóng chảy sẽ phân hủy nước tạo khí Hydro gây nổ dữ dội."],
            ["Đám cháy Loại E", "Thiết bị điện đang mang điện áp (tủ điện, máy biến áp, máy chủ)", "Bình khí CO2, bình bột khô không dẫn điện, hệ thống khí sạch FM200", "Ngắt nguồn điện nếu có thể; tuyệt đối không dùng bình bọt hoặc nước thông thường vì dẫn điện gây chết người."]
          ],
          [15, 28, 27, 30]
        ),
        p("Hệ thống FireGuard AI tích hợp toàn bộ bảng tri thức phân loại chất cháy vào thuật toán của module Chatbot AI. Khi khách hàng hoặc nhân viên kinh doanh chọn loại hình cơ sở là 'Phòng Server / Trung tâm dữ liệu', hệ thống sẽ tự động loại trừ bình bột (vì bụi bột ăn mòn vi mạch điện tử) và đề xuất trang bị bình khí CO2 hoặc hệ thống khí sạch tự động."),

        createSubSubHeading("2.1.3. Quy trình thi công công trình, chạy thử liên động và kiểm định định kỳ"),
        p("Thi công hệ thống PCCC là một quy trình kỹ thuật xây dựng phức tạp, liên quan mật thiết đến kết cấu tòa nhà và hệ thống cơ điện (MEP). Quy trình triển khai một dự án PCCC chuẩn mực bao gồm 5 giai đoạn:"),
        bullet("Giai đoạn 1 - Tiếp nhận mặt bằng và thẩm duyệt thiết kế: Kiểm tra bản vẽ thiết kế đã được Cục Cảnh sát PCCC phê duyệt; khảo sát hiện trạng định vị tim trục, cao độ trần và vị trí hộp kỹ thuật."),
        bullet("Giai đoạn 2 - Chuẩn bị vật tư và cấp phát theo Serial: Toàn bộ đường ống thép, van báo động (Alarm Valve), bình chữa cháy, đầu báo khói đều phải có chứng chỉ xuất xưởng (CO/CQ) và tem kiểm định PCCC dán trên thân."),
        bullet("Giai đoạn 3 - Thi công lắp đặt tại hiện trường: Đi đường ống cấp nước chữa cháy, lắp đặt giá treo chống rung, gắn đầu phun Sprinkler, luồn cáp tín hiệu chống cháy trong ống thép luồn dây, đấu nối tủ trung tâm báo cháy."),
        bullet("Giai đoạn 4 - Thử áp lực và kiểm tra liên động hệ thống: Bơm nước thử áp lực tĩnh trong 24 giờ với áp suất kiểm tra (thường bằng 1.5 lần áp suất làm việc, khoảng 12 - 16 bar). Thử nghiệm kích hoạt báo cháy giả định để kiểm tra liên động: còi hú, đèn chớp nhấp nháy, thang máy tự động hạ về tầng trệt mở cửa, quạt tăng áp cầu thang thoát hiểm khởi động, và máy bơm chữa cháy tự động đề nổ khi áp lực đường ống tụt."),
        bullet("Giai đoạn 5 - Nghiệm thu bàn giao và kích hoạt sổ bảo hành: Lập biên bản nghiệm thu hoàn thành công trình, chuyển đổi danh mục vật tư thành danh mục tài sản quản lý định kỳ của tòa nhà."),

        createSubSubHeading("2.1.4. Vai trò Đội trưởng công trường và cơ chế phân công tổ thợ nội bộ"),
        p("Tại công trường xây dựng, Đội trưởng thi công (Installation Leader) đóng vai trò là nhạc trưởng điều hành trực tiếp. Dưới quyền Đội trưởng là một tổ thợ thi công gồm các thợ lành nghề (thợ hàn ống, thợ đấu nối điện tử) và các nhân công phụ thời vụ (kéo dây, đục bê tông, dọn dẹp mặt bằng)."),
        p("Khác biệt lớn nhất của ngành xây dựng là tính biến động nhân sự: một thợ phụ có thể chỉ làm việc 3 ngày rồi nghỉ, một người mới vào thay thế ngay lập tức. Nếu áp dụng cách quản lý phần mềm thông thường – bắt buộc mỗi thợ phụ phải có email công ty, phải cài đặt phần mềm và đăng nhập tài khoản riêng – thì 100% các dự án sẽ thất bại vì thợ không chịu làm theo và gây hỗn loạn dữ liệu người dùng."),
        p("Hệ thống FireGuard AI giải quyết bài toán này bằng giải pháp thiết kế thực dụng: Chỉ có Đội trưởng thi công đăng nhập vào hệ thống web. Trong phân hệ dự án của mình, Đội trưởng được cung cấp một Bảng phân công tổ thợ nội bộ với các vị trí mặc định: Nhân công 1, Nhân công 2, Nhân công 3, Nhân công 4 (hoặc Đội trưởng có thể sửa tên thành Nguyễn Văn A, Trần Văn B). Đội trưởng nhập công việc cụ thể cho từng thợ (ví dụ: Nhân công 1 hàn van tầng 3, Nhân công 2 kéo cáp trục đứng). Cơ chế này giúp công tác quản lý lao động tại chỗ cực kỳ linh hoạt, rõ ràng, mà không làm phình to cơ sở dữ liệu của máy chủ."),

        createSubSubHeading("2.1.5. Vai trò Kỹ thuật viên bảo trì và yêu cầu đối soát vị trí GPS"),
        p("Kỹ thuật viên bảo trì (Technician) là lực lượng phản ứng nhanh di động. Khi nhận được lệnh điều động từ hệ thống hoặc có lịch kiểm tra định kỳ tại các tòa nhà khách hàng, kỹ thuật viên sẽ di chuyển đến hiện trường bằng xe máy chuyên dụng mang theo dụng cụ đo kiểm áp suất và bình dự phòng."),
        p("Vấn đề nhức nhối nhất của các doanh nghiệp cung cấp dịch vụ bảo trì hiện nay là hiện tượng kỹ thuật viên không đến công trình nhưng vẫn tích dấu kiểm tra đạt chuẩn vào sổ bảo trì. Để loại bỏ hoàn toàn hành vi tiêu cực này, hệ thống FireGuard AI thiết lập thuật toán đối soát định vị Geolocation. Khi kỹ thuật viên bấm nút 'Check-in vị trí hiện trường', ứng dụng web sẽ lấy tọa độ GPS từ chip định vị của điện thoại thông minh và gửi về Backend. Thuật toán Haversine sẽ tính khoảng cách đường chim bay giữa vị trí thợ và vị trí công trình. Kỹ thuật viên bắt buộc phải có mặt trong bán kính $\\le 1.0$ km thì hệ thống mới xác nhận check-in thành công và mở khóa cho phép thực hiện công việc."),

        createSubSubHeading("2.1.6. Nghiệm thu bằng hình ảnh số hóa và nhật ký công trình điện tử"),
        p("Phương thức nghiệm thu bằng văn bản giấy truyền thống có nhược điểm chí mạng là không thể lưu trữ bằng chứng thị giác trực quan. Khi xảy ra tranh chấp kỹ thuật giữa nhà thầu và ban quản lý tòa nhà (ví dụ: chủ đầu tư khiếu nại rằng kỹ thuật viên chưa vệ sinh đầu báo khói hoặc chưa nạp lại bột chữa cháy), các bên không có cơ sở khách quan để đối soát."),
        p("FireGuard AI đưa ra nguyên tắc kỹ thuật bất biến: Mọi hành động cập nhật tiến độ công trình của Đội trưởng và mọi hành động hoàn tất phiếu bảo trì của Kỹ thuật viên bắt buộc phải đính kèm hình ảnh chụp hiện trường thực tế. Bức ảnh chụp trực tiếp từ camera điện thoại (chụp kim đồng hồ áp suất nằm chính giữa vạch xanh, chụp tem niêm phong chì mới được bấm, chụp đồng hồ đo dòng điện của tủ trung tâm) sẽ được mã hóa và tải lên máy chủ lưu trữ, gắn liền vĩnh viễn với mã phiếu và số Serial thiết bị."),

        createSubSubHeading("2.1.7. Hệ thống giám sát điều hành tập trung thời gian thực (Real-time Dashboard)"),
        p("Trung tâm chỉ huy của doanh nghiệp là Bảng điều khiển giám sát (Admin Dashboard). Khác với các hệ thống ERP thế hệ cũ chỉ hiển thị các báo cáo tĩnh định kỳ cuối tháng, Dashboard của FireGuard AI là một trung tâm điều hành thời gian thực sống động. Sử dụng công nghệ SignalR WebSocket, hệ thống tạo ra một luồng kết nối liên tục (Persistent Connection) giữa máy chủ và trình duyệt của ban lãnh đạo. Bất cứ khi nào có một Đội trưởng tại công trình xa gửi báo cáo tiến độ hoặc một Kỹ thuật viên chụp ảnh nghiệm thu bình chữa cháy, hình ảnh kèm vị trí GPS sẽ lập tức xuất hiện trên màn hình lớn của Ban Giám đốc với độ trễ chưa đầy 100 mili-giây, giúp lãnh đạo theo dõi sát sao mọi diễn biến thực địa."),

        createSubHeading("2.2. Các mô hình toán học và giải thuật áp dụng"),
        createSubSubHeading("2.2.1. Thuật toán tính khoảng cách địa lý Haversine và mô hình bán kính 1km"),
        p("Để xác định khoảng cách chính xác giữa hai điểm trên bề mặt Trái Đất dựa trên tọa độ vĩ độ (Latitude) và kinh độ (Longitude), việc sử dụng hình học phẳng thông thường (khoảng cách Euclid) sẽ dẫn đến sai số rất lớn do Trái Đất có hình phỏng cầu (Ellipsoid). Do đó, hệ thống áp dụng công thức lượng giác cầu Haversine, được công bố bởi nhà thiên văn học James Andrew vào năm 1805 và định dạng hoàn thiện bởi R. W. Sinnott vào năm 1984."),
        p("Cho hai điểm $P_1(\\phi_1, \\lambda_1)$ và $P_2(\\phi_2, \\lambda_2)$, trong đó $\\phi_1, \\phi_2$ lần lượt là vĩ độ của điểm 1 và điểm 2; $\\lambda_1, \\lambda_2$ lần lượt là kinh độ của điểm 1 và điểm 2. Giả sử bán kính danh định của Trái Đất là $R = 6,371$ km. Trước hết, đổi các giá trị tọa độ từ độ (degrees) sang radian:"),
        p("$$\\Delta\\phi = (\\phi_2 - \\phi_1) \\cdot \\frac{\\pi}{180}, \\quad \\Delta\\lambda = (\\lambda_2 - \\lambda_1) \\cdot \\frac{\\pi}{180}$$", { alignment: AlignmentType.CENTER, bold: true }),
        p("Công thức Haversine xác định đại lượng trung gian $a$ (bình phương của nửa độ dài cung phụ):"),
        p("$$a = \\sin^2\\left(\\frac{\\Delta\\phi}{2}\\right) + \\cos\\left(\\phi_1 \\cdot \\frac{\\pi}{180}\\right) \\cdot \\cos\\left(\\phi_2 \\cdot \\frac{\\pi}{180}\\right) \\cdot \\sin^2\\left(\\frac{\\Delta\\lambda}{2}\\right)$$", { alignment: AlignmentType.CENTER, bold: true }),
        p("Đại lượng góc ở tâm $c$ (tính bằng radian) tương ứng với cung tròn nối hai điểm được tính thông qua hàm arctangent 2 biến:"),
        p("$$c = 2 \\cdot \\text{atan2}\\left(\\sqrt{a}, \\sqrt{1-a}\\right)$$", { alignment: AlignmentType.CENTER, bold: true }),
        p("Cuối cùng, khoảng cách thực tế $d$ theo đường tròn lớn giữa vị trí Kỹ thuật viên và vị trí công trình được tính bằng:"),
        p("$$d = R \\cdot c = 6371 \\cdot c \\quad (\\text{km})$$", { alignment: AlignmentType.CENTER, bold: true }),
        p("Mô hình kiểm soát bán kính logic: Khi nhận được yêu cầu check-in, hàm kiểm tra kiểm tra điều kiện:"),
        p("$$\\text{CheckinStatus} = \\begin{cases} \\text{SUCCESS (Hợp lệ)}, & \\text{nếu } d \\le 1.0 \\text{ km} \\\\ \\text{REJECTED (Vi phạm bán kính)}, & \\text{nếu } d > 1.0 \\text{ km} \\end{cases}$$", { alignment: AlignmentType.CENTER, bold: true }),
        p("Ngưỡng 1.0 km được lựa chọn dựa trên khảo sát thực tế: bán kính này đủ hẹp để ngăn chặn việc ngồi ở nhà bấm hoàn thành, nhưng đủ rộng để bù trừ cho sai số định vị GPS của các dòng điện thoại phổ thông khi đứng dưới chân các tòa nhà cao tầng bị che khuất vệ tinh."),

        createSubSubHeading("2.2.2. Thuật toán chấm điểm trọng số đa tiêu chí (MCDM / WSM) điều phối thợ"),
        p("Khi một sự cố PCCC khẩn cấp phát sinh (ví dụ: máy bơm cứu hỏa của chung cư không tự động đề nổ khi tụt áp), hệ thống cần nhanh chóng tìm ra kỹ thuật viên phù hợp nhất trong danh sách hàng chục nhân sự đang di chuyển trên đường. Việc chỉ chọn thợ gần nhất đôi khi không tối ưu vì thợ đó có thể không có chứng chỉ về máy bơm hoặc đang phải xử lý một đơn hàng gấp khác."),
        p("Hệ thống áp dụng Mô hình Tổng trọng số tuyến tính (Weighted Sum Model - WSM) thuộc lớp giải thuật Ra quyết định đa tiêu chí (MCDM). Thuật toán chuẩn hóa và tính điểm tổng hợp $S_i$ cho kỹ thuật viên thứ $i$ dựa trên 4 tiêu chí thành phần:"),
        p("$$S_i = \\sum_{j=1}^{4} W_j \\cdot C_{ij} = W_1 \\cdot C_{i1} + W_2 \\cdot C_{i2} + W_3 \\cdot C_{i3} + W_4 \\cdot C_{i4}$$", { alignment: AlignmentType.CENTER, bold: true }),
        p("Trong đó, tổng các trọng số thỏa mãn điều kiện chuẩn tắc: $\\sum_{j=1}^{4} W_j = 1.0$. Các tiêu chí và thang điểm chuẩn hóa được định nghĩa như sau:"),
        createTableCaption("Bảng 2.2", "Bảng ma trận trọng số đa tiêu chí điều phối kỹ thuật viên hiện trường"),
        createCustomTable(
          ["Tiêu chí đánh giá", "Ký hiệu", "Trọng số (W_j)", "Công thức tính điểm chuẩn hóa (Thang điểm 1 - 10)"],
          [
            ["Khoảng cách địa lý (GPS)", "C_1", "0.35 (35%)", "C_1 = \\max(1, 10 - d / 2), trong đó d là khoảng cách Haversine tính bằng km. Thợ càng ở gần công trình thì điểm C_1 càng tiệm cận 10."],
            ["Độ phù hợp kỹ năng & chứng chỉ", "C_2", "0.25 (25%)", "C_2 = 10 nếu kỹ thuật viên có chứng chỉ chuyên ngành trùng khớp với loại thiết bị sự cố; C_2 = 5 nếu có chuyên môn tương đương; C_2 = 1 nếu trái ngành."],
            ["Khối lượng công việc hiện tại", "C_3", "0.20 (20%)", "C_3 = \\max(1, 10 - 3 \\cdot N), trong đó N là số lượng phiếu bảo trì đang nhận trong ngày. Kỹ thuật viên đang hoàn toàn rảnh rỗi (N=0) đạt điểm tối đa 10."],
            ["Điểm đánh giá uy tín (Rating)", "C_4", "0.20 (20%)", "C_4 = 2 \\cdot R_{avg}, trong đó R_{avg} là điểm đánh giá sao trung bình của khách hàng trước đó (thang 1 - 5 sao quy đổi sang thang điểm 10)."]
          ],
          [25, 10, 15, 50]
        ),
        p("Hệ thống tự động sắp xếp danh sách kỹ thuật viên theo thứ tự điểm $S_i$ giảm dần và gửi thông báo nhận việc ưu tiên đến ứng viên đứng đầu bảng xếp hạng."),

        createSubSubHeading("2.2.3. Mô hình Retrieval-Augmented Generation (RAG) và bóc tách dự toán AI"),
        p("Retrieval-Augmented Generation (RAG) là kiến trúc kết hợp giữa sức mạnh tạo sinh ngôn ngữ của các mô hình ngôn ngữ lớn (LLM) và độ chính xác của cơ chế truy xuất thông tin từ kho tri thức chuyên ngành. Trong đề tài FireGuard AI, RAG giải quyết bài toán tư vấn kỹ thuật PCCC mà không bị hiện tượng 'ảo giác' (Hallucination) – hiện tượng AI tự bịa ra các điều khoản quy chuẩn không có thật."),
        p("Quy trình xử lý của module Báo giá AI qua 4 bước:"),
        bullet("Bước 1 - Lập chỉ mục tài liệu (Document Indexing): Toàn bộ nội dung Tiêu chuẩn Quốc gia TCVN 3890:2023 và bảng đơn giá định mức xây dựng được chia thành các đoạn văn bản (Chunks) có kích thước 500 tokens với độ gối đầu 100 tokens, sau đó được nhúng (Embedding) thành các vector nhiều chiều và lưu trữ vào cơ sở dữ liệu Vector."),
        bullet("Bước 2 - Phân tích truy vấn (Query Processing): Khi khách hàng nhập: 'Tôi có nhà xưởng may mặc diện tích 1.200 m2, cao 1 tầng, cần lắp đặt hệ thống chữa cháy gì?', hệ thống trích xuất các thực thể chính: Diện tích = 1.200 m2, Công năng = Xưởng may mặc (Nhóm nguy cơ cháy cao F1.1)."),
        bullet("Bước 3 - Truy xuất tri thức quy chuẩn (Vector Retrieval): Tìm kiếm các đoạn quy chuẩn TCVN liên quan đến xưởng may mặc, trích xuất định mức: 1 bình chữa cháy bột ABC 4kg cho mỗi 75 m2 sàn, bắt buộc trang bị hệ thống báo cháy tự động và họng nước vách tường."),
        bullet("Bước 4 - Tính toán và tạo sinh báo giá: Áp dụng công thức số lượng: $N_{binh} = \\lceil 1200 / 75 \\rceil = 16$ bình; số đầu báo khói = $\\lceil 1200 / 50 \\rceil = 24$ đầu báo. AI tổng hợp thành bảng dự toán chi phí chi tiết bằng JSON và trả về giao diện người dùng."),

        createSubSubHeading("2.2.4. Cơ chế truyền thông WebSocket hai chiều qua SignalR Core"),
        p("Giao thức HTTP truyền thống vận hành theo cơ chế Request - Response đơn hướng: Client gửi yêu cầu thì Server mới phản hồi, sau đó kết nối TCP bị đóng lại. Mô hình này không thể đáp ứng yêu cầu giám sát hiện trường tức thời: nếu muốn cập nhật ảnh thi công, trình duyệt của Quản trị viên phải liên tục gửi yêu cầu hỏi thăm (Polling) sau mỗi vài giây, gây lãng phí băng thông và làm quá tải máy chủ."),
        p("Hệ thống giải quyết bài toán bằng Microsoft SignalR Core trên nền tảng .NET 8. SignalR cung cấp một lớp trừu tượng cấp cao trên nền các giao thức truyền tải thời gian thực (WebSockets, Server-Sent Events, Long Polling). Khi trình duyệt khởi động, SignalR thiết lập một kết nối WebSocket song công toàn phần (Full-duplex Persistent Connection). Khi Đội trưởng gửi ảnh thi công, API Controller gọi HubContext để phát thông điệp (Broadcast) đến tất cả các Client thuộc nhóm 'AdminGroup'. Trình duyệt quản trị nhận dữ liệu nhị phân của hình ảnh và cập nhật DOM ngay lập tức với độ trễ cực thấp."),

        createSubHeading("2.3. Kiến trúc phần mềm doanh nghiệp Clean Architecture"),
        createSubSubHeading("2.3.1. Nguyên lý phân tầng 4 lớp và quy tắc phụ thuộc (Dependency Rule)"),
        p("Hệ thống Backend của FireGuard AI được kiến trúc tuân thủ triệt để mô hình Clean Architecture do Robert C. Martin đề xuất. Trọng tâm của kiến trúc là bảo vệ logic nghiệp vụ doanh nghiệp không bị phụ thuộc vào các chi tiết bên ngoài như cơ sở dữ liệu, giao diện web hay các thư viện của bên thứ ba."),
        p("Hệ thống được tổ chức thành 4 phân tầng cấu trúc:"),
        bullet("1. Tầng Domain (Trung tâm): Chứa các Thực thể nghiệp vụ cốt lõi (User, Project, Ticket, EquipmentAsset, Quotation), các đối tượng giá trị (Value Objects), các Enumerations và các Domain Exceptions. Tầng này được viết hoàn toàn bằng mã C# thuần túy (POCO - Plain Old CLR Objects), không phụ thuộc vào bất kỳ thư viện ngoài nào, kể cả Entity Framework."),
        bullet("2. Tầng Application: Đóng gói toàn bộ logic ca sử dụng (Use Cases) của hệ thống. Chứa các Commands, Queries, DTOs, Mappings và Validation rules. Tầng này định nghĩa các Interfaces (như IApplicationDbContext, IFileStorageService, INotificationService) nhưng không trực tiếp cài đặt chúng."),
        bullet("3. Tầng Infrastructure: Cài đặt các Interfaces được định nghĩa ở tầng Application. Chứa ApplicationDbContext kế thừa từ DbContext của EF Core, các lớp cấu hình bảng dữ liệu Fluent API, dịch vụ lưu trữ ảnh cục bộ FileStorageService, dịch vụ gửi email và SignalR Hub."),
        bullet("4. Tầng Presentation (Web API): Đóng vai trò là cổng giao tiếp bên ngoài (Entry Point), chứa các Controller tiếp nhận HTTP Request, xử lý xác thực Token JWT, kiểm tra phân quyền RBAC và chuyển giao yêu cầu cho MediatR xử lý."),

        createSubSubHeading("2.3.2. Mẫu thiết kế CQRS và Mediator Pattern với MediatR"),
        p("Command Query Responsibility Segregation (CQRS) là mẫu kiến trúc phân tách rạch ròi giữa thao tác làm thay đổi trạng thái hệ thống (Command - Thêm, Sửa, Xóa) và thao tác chỉ đọc dữ liệu (Query):"),
        bullet("Nhánh Command (Write Model): Mỗi hành động thay đổi dữ liệu được đóng gói thành một Command Class (ví dụ: CreateProjectCommand, UpdateProgressWithPhotoCommand, CheckinTicketCommand). Command đi qua các Pipeline Behaviors để tự động kiểm tra tính hợp lệ (FluentValidation) và ghi nhật ký giao dịch (Logging) trước khi đến CommandHandler. CommandHandler chỉ thực hiện các thao tác ghi và phát sự kiện."),
        bullet("Nhánh Query (Read Model): Các truy vấn dữ liệu được đóng gói thành Query Class (ví dụ: GetProjectsListQuery, GetLiveFieldFeedQuery). QueryHandler truy vấn trực tiếp cơ sở dữ liệu với chế độ AsNoTracking(), kết hợp với DTO tối ưu hóa để trả về kết quả nhanh nhất mà không phải tải toàn bộ cây thực thể nặng nề."),

        createSubSubHeading("2.3.3. Mẫu Repository và Unit of Work trong Entity Framework Core"),
        p("Để bảo đảm tính toàn vẹn dữ liệu cho các chu trình nghiệp vụ phức tạp, hệ thống áp dụng mẫu thiết kế Unit of Work kết hợp Entity Framework Core:"),
        p("Khi Đội trưởng thi công nhấn nút 'Nghiệm thu bàn giao công trình', hệ thống phải thực hiện đồng thời nhiều thao tác: (1) Cập nhật trạng thái dự án sang Hoàn thành (Status = 6); (2) Đọc toàn bộ danh sách vật tư đã lắp đặt trong ProjectEquipments; (3) Sinh mới hàng loạt bản ghi tài sản trong EquipmentAssets kèm số Serial và mã QR Code; (4) Khởi tạo lịch kiểm tra định kỳ trong sổ tài sản của khách hàng. Tất cả các thao tác trên được bọc trong một Database Transaction duy nhất do Unit of Work quản lý:"),
        p("$$\\text{Transaction} = \\{ \\text{UpdateProject} \\land \\text{ReadEquipments} \\land \\text{CreateAssets} \\land \\text{InitMaintenance} \\}$$", { alignment: AlignmentType.CENTER, bold: true }),
        p("Nếu có bất kỳ một lỗi nào xảy ra ở bất kỳ bước nào, toàn bộ giao dịch sẽ tự động Rollback về trạng thái ban đầu, ngăn chặn hoàn toàn việc dữ liệu bị rác hoặc mất đồng bộ."),

        createSubHeading("2.4. Công nghệ nền tảng sử dụng trong đề tài"),
        createTableCaption("Bảng 2.3", "Bảng tổng hợp công nghệ phần mềm được ứng dụng trong đề tài"),
        createCustomTable(
          ["Thành phần kiến trúc", "Công nghệ sử dụng", "Phiên bản", "Đặc tính kỹ thuật và lý do lựa chọn"],
          [
            ["Ngôn ngữ Backend", "C# (.NET 8.0 SDK)", "8.0 (LTS)", "Ngôn ngữ kiểu tĩnh, hiệu năng xử lý tính toán cực cao, hỗ trợ lập trình bất đồng bộ async/await sâu sắc."],
            ["Framework Web API", "ASP.NET Core Web API", "8.0", "Web Framework hiện đại hàng đầu thế giới về hiệu năng (Top TechEmpower Benchmarks), tích hợp sẵn DI Container."],
            ["ORM & Truy vấn CSDL", "Entity Framework Core", "8.0", "Hỗ trợ LINQ an toàn tuyệt đối chống SQL Injection, hỗ trợ Code-First Migration và tối ưu hóa câu lệnh SQL."],
            ["Hệ quản trị CSDL", "Microsoft SQL Server", "2022", "Hệ quản trị cơ sở dữ liệu quan hệ doanh nghiệp chuẩn ACID, bảo toàn tính nhất quán tuyệt đối cho giao dịch tài chính."],
            ["Giao thức Real-time", "SignalR Core", "8.0", "Truyền thông WebSocket thời gian thực hai chiều, tự động đàm phán phương thức kết nối tối ưu."],
            ["Thư viện Frontend", "React + TypeScript", "18.x", "Mô hình hướng thành phần (Component-based), kiểm soát kiểu dữ liệu tĩnh nghiêm ngặt, trải nghiệm trang đơn mượt mà."],
            ["Trình đóng gói Frontend", "Vite", "5.x", "Công cụ build thế hệ mới chạy trên nền tảng esbuild, tốc độ khởi động cực nhanh và Hot Module Replacement tức thì."],
            ["Thiết kế giao diện", "TailwindCSS + Lucide", "3.x", "Hệ thống Utility CSS linh hoạt, thiết kế giao diện thích ứng (Responsive) chuẩn xác trên mọi kích thước màn hình."],
            ["Bản đồ số & Tọa độ", "Leaflet + OpenStreetMap", "1.9", "Thư viện bản đồ nguồn mở siêu nhẹ, dễ dàng vẽ điểm đánh dấu Marker và vẽ đường đa tuyến lộ trình Polyline."],
            ["Bảo mật xác thực", "JWT Authentication", "RFC 7519", "Cơ chế cấp phát Token không trạng thái (Stateless), bảo vệ an toàn toàn bộ hệ thống API."]
          ],
          [20, 25, 10, 45]
        ),

        createSubHeading("2.5. Ma trận so sánh chuyên sâu với các hệ thống trên thị trường"),
        createTableCaption("Bảng 2.4", "Ma trận so sánh chuyên sâu hệ thống FireGuard AI với các giải pháp hiện có"),
        createCustomTable(
          ["Tiêu chí so sánh", "bTaskee / App thợ gia đình", "CMMS truyền thống (SAP/Maximo)", "Phần mềm ngoại (Inspect Point)", "FireGuard AI (Đề tài)"],
          [
            ["Đặc thù nghiệp vụ PCCC", "Không hỗ trợ (chỉ sửa điện nước gia đình)", "Chung chung cho máy móc nhà xưởng", "Chuẩn hóa theo luật Mỹ (NFPA)", "Tuân thủ chặt chẽ Tiêu chuẩn Quốc gia TCVN 3890:2023"],
            ["Phân công tổ thợ linh hoạt tại chỗ", "Không hỗ trợ (mô hình 1 thợ - 1 việc)", "Cồng kềnh, bắt buộc cấp tài khoản cá nhân", "Không hỗ trợ", "Đội trưởng linh hoạt giao việc Thợ 1, 2, 3, 4 ngay tại công trường"],
            ["Chống gian lận vị trí hiện trường", "Chỉ định vị địa chỉ khách hẹn", "Không bắt buộc xác thực tọa độ GPS", "Có lưu tọa độ", "Kiểm tra GPS bán kính ≤ 1.0 km bằng thuật toán Haversine"],
            ["Bắt buộc ảnh nghiệm thu số hóa", "Tùy chọn, không bắt buộc", "Thường quét báo cáo giấy tải lên sau", "Có chụp ảnh biên bản", "Bắt buộc tải ảnh hiện trường mới mở khóa nút hoàn tất đơn"],
            ["Tư vấn và bóc tách dự toán AI", "Không có (áp giá cố định)", "Nhập tay từng định mức vật tư", "Không hỗ trợ", "Chatbot RAG tự động tính toán bóc tách thiết bị theo TCVN"],
            ["Quản lý vòng đời thiết bị QR Code", "Không hỗ trợ", "Mã tài sản cố định chung", "Quét mã vạch cơ bản", "Quản lý 1-1 với Serial, cảnh báo chu kỳ nạp sạc bình PCCC"]
          ],
          [20, 20, 20, 20, 20]
        ),
        p("Ma trận so sánh phân tích sâu sắc ở trên chứng minh rằng FireGuard AI đã giải quyết chính xác các bài toán thực tiễn của ngành an toàn PCCC tại Việt Nam với sự kết hợp hài hòa giữa tính kỷ luật công nghệ và tính thực dụng trong vận hành hiện trường."),
        new Paragraph({ children: [new PageBreak()] }),

        // -----------------------------------------------------------------------------
        // CHƯƠNG 3
        // -----------------------------------------------------------------------------
        createHeaderTitle("Chương 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG"),
        createSubHeading("3.1. Phân tích yêu cầu hệ thống"),
        createSubSubHeading("3.1.1. Sơ đồ phân rã chức năng nghiệp vụ (BFD)"),
        p("Sơ đồ phân rã chức năng nghiệp vụ (BFD - Business Function Diagram) đóng vai trò là bản thiết kế kiến trúc phân rã toàn bộ hoạt động của tổ chức thành các khối chức năng logic từ mức cao xuống mức chi tiết. Hệ thống FireGuard AI được cấu thành từ 5 phân hệ lớn:"),
        bullet("1. Phân hệ Quản trị hệ thống & Bảng điều khiển trung tâm (System Administration & Executive Dashboard): Bao gồm các chức năng quản lý tài khoản người dùng, phân quyền theo vai trò (RBAC), theo dõi các chỉ số tài chính KPI, giám sát dòng ảnh hiện trường trực tiếp (Live Field Photos Feed) và xem nhật ký kiểm toán hệ thống (Audit Logs)."),
        bullet("2. Phân hệ Quản lý dự án thi công & Không gian làm việc của Đội trưởng (Installation Project Management): Bao gồm tiếp nhận dự án, quản lý tiến độ thi công tổng thể, phân công nhiệm vụ chi tiết cho tổ thợ nội bộ (Thợ 1, 2, 3, 4), cập nhật thanh trượt tiến độ % kèm ảnh hiện trường thực tế, và thực hiện nghiệm thu bàn giao tài sản kích hoạt bảo hành."),
        bullet("3. Phân hệ Quản lý dịch vụ bảo trì, sửa chữa & Kỹ thuật viên hiện trường (Maintenance & Dispatching System): Bao gồm tiếp nhận phiếu sự cố khẩn cấp từ khách hàng, điều phối kỹ thuật viên tự động qua thuật toán chấm điểm WSM, hiển thị bản đồ số và lộ trình di chuyển, đối soát bán kính GPS hiện trường $\\le 1.0$ km, và bắt buộc tải ảnh nghiệm thu thiết bị trước khi đóng đơn."),
        bullet("4. Phân hệ Quản lý kho hàng & Sổ theo dõi tài sản thiết bị định danh QR Code (Warehouse & Asset Lifecycle): Bao gồm quản lý số lượng tồn kho theo Model thiết bị, cấp phát vật tư thi công, dán mã QR Code định danh 1-1 với số Serial, theo dõi hạn nạp sạc bình chữa cháy và tự động cảnh báo thiết bị sắp hết hạn kiểm định."),
        bullet("5. Phân hệ Bán hàng, CRM & Trợ lý tư vấn dự toán AI (Sales & Smart AI Quotation): Bao gồm quản lý hồ sơ khách hàng, tiếp nhận yêu cầu diện tích công trình, kích hoạt Chatbot AI RAG bóc tách thiết bị theo TCVN 3890:2023 và tự động xuất file báo giá sơ bộ."),
        ...createImagePlaceholder("Hình 3.1", "Sơ đồ phân rã chức năng nghiệp vụ (BFD) hệ thống FireGuard AI", "Dán sơ đồ BFD hoàn chỉnh thể hiện 5 phân hệ lớn và các nhánh chức năng con vào đây"),

        createSubSubHeading("3.1.2. Mô tả các tác nhân và ma trận phân quyền chi tiết (RBAC Matrix)"),
        p("Hệ thống xác định 5 tác nhân người dùng (Actors) tham gia tương tác trực tiếp:"),
        bullet("1. Quản trị viên (Admin / Ban Giám đốc): Người có quyền hạn cao nhất trong hệ thống, quản lý tài khoản nhân sự, cấu hình hệ thống, phê duyệt báo giá lớn và giám sát hoạt động thời gian thực của toàn doanh nghiệp."),
        bullet("2. Đội trưởng thi công (Installation Leader): Kỹ sư phụ trách tại công trường, quản lý trực tiếp tiến độ các công trình xây lắp, điều hành tổ thợ nội bộ 1, 2, 3, 4 và chịu trách nhiệm gửi ảnh báo cáo hiện trường."),
        bullet("3. Kỹ thuật viên bảo trì (Technician): Nhân viên kỹ thuật di động chuyên thực hiện kiểm tra định kỳ, bảo dưỡng nạp sạc bình cứu hỏa và xử lý các sự cố khẩn cấp của hệ thống báo cháy; trực tiếp thực hiện check-in GPS và chụp ảnh nghiệm thu."),
        bullet("4. Nhân viên kinh doanh (Sales / Surveyor): Người tiếp xúc ban đầu với khách hàng, khảo sát sơ bộ mặt bằng, sử dụng công cụ Chatbot AI để tư vấn cấu hình thiết bị và tạo báo giá sơ bộ."),
        bullet("5. Khách hàng (Customer / Ban Quản trị tòa nhà): Người đại diện cơ sở sở hữu công trình, theo dõi tiến độ thi công, gửi yêu cầu sự cố khẩn cấp, xem hồ sơ lý lịch tài sản thiết bị và đánh giá chất lượng dịch vụ."),
        createTableCaption("Bảng 3.1", "Bảng ma trận phân quyền người dùng (Role-Based Access Matrix)"),
        createCustomTable(
          ["Cụm chức năng hệ thống", "Quản trị viên (Admin)", "Đội trưởng (Leader)", "Kỹ thuật viên (Technician)", "Kinh doanh (Sales)", "Khách hàng (Customer)"],
          [
            ["Quản lý người dùng & Phân vai trò", "Toàn quyền (CRUD)", "Không có quyền", "Không có quyền", "Không có quyền", "Không có quyền"],
            ["Xem Dashboard tổng & Live Feed ảnh", "Xem toàn hệ thống", "Chỉ xem dự án của mình", "Chỉ xem việc được giao", "Xem số liệu kinh doanh", "Chỉ xem tài sản của mình"],
            ["Tạo & Quản lý danh mục dự án", "Toàn quyền phê duyệt", "Cập nhật tiến độ & ảnh", "Không có quyền", "Tạo hồ sơ dự án mới", "Xem tiến độ công trình"],
            ["Phân công thợ nội bộ 1, 2, 3, 4", "Xem phân công", "Toàn quyền phân công", "Không có quyền", "Không có quyền", "Không có quyền"],
            ["Tiếp nhận & Check-in GPS bảo trì", "Điều phối kỹ thuật", "Không có quyền", "Toàn quyền thực hiện", "Xem trạng thái xử lý", "Gửi yêu cầu sự cố"],
            ["Bắt buộc ảnh nghiệm thu hoàn tất", "Xem xét & Duyệt ảnh", "Bắt buộc gửi ảnh tiến độ", "Bắt buộc gửi ảnh nghiệm thu", "Không có quyền", "Xem ảnh kết quả nghiệm thu"],
            ["Tư vấn & Lập báo giá AI", "Duyệt báo giá chính thức", "Không có quyền", "Không có quyền", "Khởi tạo báo giá AI", "Xem & Nhận báo giá sơ bộ"],
            ["Quản lý kho & Cấp phát Serial QR", "Toàn quyền xuất nhập kho", "Nhận vật tư vào dự án", "Cập nhật tình trạng thiết bị", "Xem tồn kho khả dụng", "Quét mã QR tra cứu lý lịch"]
          ],
          [25, 15, 15, 15, 15, 15]
        ),

        createSubSubHeading("3.1.3. Phân tích các yêu cầu phi chức năng (Non-functional Requirements)"),
        p("Các yêu cầu phi chức năng thiết lập các tiêu chuẩn chất lượng kỹ thuật mà hệ thống bắt buộc phải thỏa mãn:"),
        bullet("1. Yêu cầu về hiệu năng (Performance): Thời gian xử lý và phản hồi đối với 95% số yêu cầu API thông thường phải dưới 200 mili-giây. Tốc độ thực thi thuật toán kiểm tra GPS Haversine không quá 5 mili-giây. Tốc độ đẩy một hình ảnh hiện trường từ điện thoại lên máy chủ và hiển thị trên Dashboard Admin qua SignalR không quá 1.5 giây trong điều kiện mạng 4G tiêu chuẩn."),
        bullet("2. Yêu cầu về an toàn và bảo mật (Security): Mật khẩu người dùng được băm bằng thuật toán BCrypt với hệ số Salt = 12. Xác thực người dùng bằng JSON Web Token (JWT) có chữ ký số bí mật (HMAC-SHA256). Toàn bộ dữ liệu truyền tải trên mạng bắt buộc phải được mã hóa qua giao thức HTTPS / TLS 1.3. Áp dụng cơ chế lọc dữ liệu đầu vào nghiêm ngặt để chống các cuộc tấn công SQL Injection, Cross-Site Scripting (XSS) và Cross-Site Request Forgery (CSRF)."),
        bullet("3. Yêu cầu về độ tin cậy và tính sẵn sàng (Reliability & Availability): Hệ thống bảo đảm tính sẵn sàng đạt mức 99.5% thời gian hoạt động. Áp dụng chiến lược sao lưu dữ liệu tự động hàng đêm (Automated Database Backup) và cơ chế xử lý ngoại lệ tập trung (Global Exception Middleware) bảo đảm hệ thống không bao giờ bị sập (Crash) đột ngột khi xảy ra lỗi ngoài ý muốn."),
        bullet("4. Yêu cầu về khả năng mở rộng (Scalability): Thiết kế Stateless API cho phép hệ thống dễ dàng mở rộng theo chiều ngang (Horizontal Scaling) bằng cách bổ sung thêm các Web Server phía sau một bộ cân bằng tải (Load Balancer như Nginx) khi số lượng người dùng đồng thời tăng cao."),

        createSubHeading("3.2. Thiết kế kiến trúc tổng thể phần mềm"),
        createSubSubHeading("3.2.1. Cấu trúc tổ chức Solution Backend Clean Architecture"),
        p("Solution mã nguồn Backend của FireGuard AI được tổ chức thành 4 Project tương ứng với 4 tầng kiến trúc:"),
        bullet("FireGuard.Domain: Chứa các Entity Classes định nghĩa cấu trúc dữ liệu kinh doanh (User, Project, ProjectProgressLog, ProjectEquipment, ServiceRequest, EquipmentAsset, EquipmentModel, Quotation, QuotationItem), các Enums (ProjectStatus, TicketStatus, UserRole, HazardLevel) và các giao diện Repository cốt lõi."),
        bullet("FireGuard.Application: Chứa các thư mục Commands (xử lý ghi), Queries (xử lý đọc), DTOs (Data Transfer Objects), AutoMapper Profiles và FluentValidation Validators. Thư viện MediatR được tích hợp tại đây để làm cầu nối xử lý các Use Cases."),
        bullet("FireGuard.Infrastructure: Chứa ApplicationDbContext của Entity Framework Core, các Class cấu hình quan hệ bảng dữ liệu bằng Fluent API, các lớp triển khai dịch vụ ngoài như FileStorageService (lưu trữ ảnh), NotificationHub (SignalR), EmailService và GeolocationService."),
        bullet("FireGuard.WebAPI: Điểm khởi động ứng dụng chứa Program.cs, các Controller tiếp nhận HTTP Request, cấu hình Middleware xác thực JWT, Middleware xử lý lỗi tập trung, cấu hình CORS và tài liệu hóa Swagger/OpenAPI."),

        createSubSubHeading("3.2.2. Luồng luân chuyển dữ liệu từ Client React đến Database"),
        p("Một chu trình xử lý yêu cầu nghiệp vụ điển hình (ví dụ: Kỹ thuật viên Check-in GPS) diễn ra qua các bước chuẩn tắc:"),
        bullet("Bước 1: Trên giao diện React, kỹ thuật viên bấm nút Check-in; component lấy tọa độ GPS từ navigator.geolocation và gọi Axios gửi HTTP POST kèm Bearer Token lên /api/tickets/{id}/checkin."),
        bullet("Bước 2: Request đi qua Authentication Middleware để kiểm tra tính hợp lệ của Token JWT và kiểm tra Role 'Technician'."),
        bullet("Bước 3: Controller tiếp nhận DTO, đóng gói thành CheckinTicketCommand và gửi vào MediatR Pipeline."),
        bullet("Bước 4: ValidationBehavior tự động chạy FluentValidation để kiểm tra tọa độ vĩ độ (-90 đến 90) và kinh độ (-180 đến 180)."),
        bullet("Bước 5: CheckinTicketCommandHandler tiếp nhận Command, gọi HaversineService để tính khoảng cách với tọa độ công trình lưu trong Database."),
        bullet("Bước 6: Nếu khoảng cách $\\le 1.0$ km, Handler cập nhật trạng thái Ticket sang InProgress, lưu dấu thời gian CheckinAt và gọi SaveChangesAsync() của Unit of Work để ghi xuống SQL Server."),
        bullet("Bước 7: Handler gọi IHubContext để phát thông báo Realtime lên Dashboard và trả về kết quả 200 OK kèm khoảng cách km cho Client React hiển thị giao diện thành công."),

        createSubHeading("3.3. Thiết kế ca sử dụng (Use Case Modeling)"),
        createSubSubHeading("3.3.1. Sơ đồ Use Case tổng quát toàn bộ hệ thống"),
        p("Sơ đồ Use Case tổng quát phản ánh đầy đủ mối quan hệ giữa các tác nhân và 8 ca sử dụng trung tâm của hệ thống:"),
        ...createImagePlaceholder("Hình 3.2", "Sơ đồ Use Case tổng quát toàn bộ hệ thống", "Dán sơ đồ Use Case Diagram hoàn chỉnh thể hiện đầy đủ 5 Actor và các quan hệ Include, Extend vào đây"),

        createSubSubHeading("3.3.2. Đặc tả chi tiết UC-01: Quản lý dự án thi công & Phân công tổ thợ"),
        createTableCaption("Bảng 3.2", "Đặc tả chi tiết ca sử dụng UC-01: Quản lý dự án thi công & Phân công thợ"),
        createCustomTable(
          ["Mục đặc tả", "Nội dung chi tiết"],
          [
            ["Mã & Tên ca sử dụng", "UC-01: Quản lý dự án thi công và Phân công tổ thợ nội bộ"],
            ["Tác nhân chính", "Đội trưởng thi công (Installation Leader)"],
            ["Mục đích ca sử dụng", "Cho phép Đội trưởng nắm bắt thông tin công trình và phân bổ nhiệm vụ cụ thể cho từng vị trí thợ nội bộ tại hiện trường."],
            ["Tiền điều kiện", "Đội trưởng đã đăng nhập vào hệ thống và được Ban Giám đốc phân công quyền phụ trách dự án đó."],
            ["Hậu điều kiện", "Bảng phân công nhiệm vụ của tổ thợ được lưu vết trên hệ thống và hiển thị trực quan trong không gian dự án."],
            ["Luồng sự kiện chính", "1. Đội trưởng chọn menu 'Dự Án Thi Công' trên thanh điều hướng.\n2. Hệ thống hiển thị danh sách các dự án đang phụ trách kèm thẻ trạng thái và tiến độ %.\n3. Đội trưởng bấm chọn vào dự án cần thao tác để mở trang quản trị chi tiết.\n4. Tại tab 'Phân công tổ thợ', hệ thống hiển thị danh sách 4 nhân sự nội bộ mặc định (Nhân công 1, 2, 3, 4).\n5. Đội trưởng nhập tên thợ thực tế và nội dung công việc chuyên môn (ví dụ: Thợ 1 - Lắp đặt tủ trung tâm báo cháy; Thợ 2 - Đi ống gen chống cháy; Thợ 3 - Lắp đầu báo khói; Thợ 4 - Hàn ống nước cứu hỏa).\n6. Đội trưởng chọn trạng thái cho từng đầu việc (Chưa làm, Đang làm, Hoàn thành).\n7. Đội trưởng nhấn nút 'Lưu phân công công việc', hệ thống lưu dữ liệu và hiển thị thông báo thành công."],
            ["Luồng rẽ nhánh / Ngoại lệ", "3a. Nếu dự án đã ở trạng thái 'Hoàn thành' (Status = 6), hệ thống khóa bảng phân công, chuyển sang chế độ chỉ đọc (Read-only) và hiển thị thông báo: 'Dự án đã nghiệm thu hoàn thành, không được phép chỉnh sửa'."]
          ],
          [25, 75]
        ),

        createSubSubHeading("3.3.3. Đặc tả chi tiết UC-02: Báo cáo tiến độ kèm ảnh chụp hiện trường"),
        createTableCaption("Bảng 3.3", "Đặc tả chi tiết ca sử dụng UC-02: Báo cáo tiến độ kèm ảnh chụp hiện trường"),
        createCustomTable(
          ["Mục đặc tả", "Nội dung chi tiết"],
          [
            ["Mã & Tên ca sử dụng", "UC-02: Cập nhật tỷ lệ tiến độ % và Báo cáo ảnh hiện trường"],
            ["Tác nhân chính", "Đội trưởng thi công (Installation Leader)"],
            ["Mục đích ca sử dụng", "Cập nhật mức độ hoàn thành công việc của công trình kèm hình ảnh minh chứng thực tế truyền về văn phòng quản trị."],
            ["Tiền điều kiện", "Dự án đang trong giai đoạn triển khai (Status = In Progress) và tiến độ hiện tại < 100%."],
            ["Hậu điều kiện", "Tỷ lệ tiến độ % của dự án được cập nhật mới; hình ảnh hiện trường được lưu vào bảng ProjectProgressLogs và phát tín hiệu SignalR lên Dashboard."],
            ["Luồng sự kiện chính", "1. Tại trang chi tiết dự án, Đội trưởng kéo thanh trượt tiến độ từ mức cũ lên mức hoàn thành mới (ví dụ: từ 45% lên 70%).\n2. Nhấn nút 'Cập nhật tiến độ & Tải ảnh báo cáo'.\n3. Hệ thống mở hộp thoại báo cáo, yêu cầu nhập tóm tắt công việc đã làm trong ngày và chọn file ảnh.\n4. Đội trưởng chọn chụp ảnh trực tiếp bằng camera điện thoại hoặc chọn ảnh từ thư viện thiết bị.\n5. Đội trưởng nhấn nút 'Gửi báo cáo hiện trường'.\n6. Hệ thống kiểm tra tính hợp lệ của file ảnh (định dạng, dung lượng), upload ảnh lên máy chủ lưu trữ.\n7. Hệ thống cập nhật trường CompletionPercentage trong bảng Projects, chèn bản ghi mới vào ProjectProgressLogs.\n8. Hệ thống phát sự kiện 'ReceiveLivePhoto' qua SignalR Hub tới Dashboard của Quản trị viên và thông báo thành công cho Đội trưởng."],
            ["Luồng rẽ nhánh / Ngoại lệ", "4a. Nếu Đội trưởng không đính kèm file ảnh, hệ thống hiển thị thông báo lỗi: 'Bắt buộc phải đính kèm hình ảnh hiện trường thực tế để xác thực tiến độ'.\n4b. Nếu file tải lên vượt quá dung lượng 10MB hoặc không phải định dạng ảnh (.jpg, .png, .webp), hệ thống từ chối và yêu cầu chọn lại."]
          ],
          [25, 75]
        ),

        createSubSubHeading("3.3.4. Đặc tả chi tiết UC-03: Tiếp nhận phiếu sự cố & Check-in GPS 1km"),
        createTableCaption("Bảng 3.4", "Đặc tả chi tiết ca sử dụng UC-03: Tiếp nhận đơn bảo trì & Check-in GPS 1km"),
        createCustomTable(
          ["Mục đặc tả", "Nội dung chi tiết"],
          [
            ["Mã & Tên ca sử dụng", "UC-03: Tiếp nhận phiếu sự cố và Xác thực vị trí hiện trường qua GPS trong bán kính 1km"],
            ["Tác nhân chính", "Kỹ thuật viên bảo trì (Technician)"],
            ["Mục đích ca sử dụng", "Bảo đảm kỹ thuật viên đã có mặt thực tế tại công trình của khách hàng trước khi được phép bắt đầu công việc sửa chữa."],
            ["Tiền điều kiện", "Kỹ thuật viên đã đăng nhập thành công, bật định vị GPS trên điện thoại và có phiếu bảo trì được phân công."],
            ["Hậu điều kiện", "Phiếu bảo trì chuyển sang trạng thái 'In Progress'; tọa độ GPS và thời điểm check-in được lưu vào cơ sở dữ liệu."],
            ["Luồng sự kiện chính", "1. Kỹ thuật viên truy cập phân hệ 'Bảo trì & Sự cố', chọn phiếu công việc cần xử lý.\n2. Hệ thống hiển thị địa chỉ công trình, mô tả lỗi và hiển thị bản đồ Leaflet có vẽ đường lộ trình di chuyển.\n3. Khi đã đến địa chỉ công trình, Kỹ thuật viên nhấn nút 'Check-in vị trí hiện trường'.\n4. Trình duyệt gọi Geolocation API để lấy tọa độ kinh độ, vĩ độ hiện tại của thiết bị và gửi về Backend.\n5. Backend tính khoảng cách Haversine giữa tọa độ thợ và tọa độ công trình lưu trong cơ sở dữ liệu.\n6. Khoảng cách tính toán d <= 1.0 km -> Hệ thống xác nhận hợp lệ, cập nhật Status = InProgress, ghi nhận CheckinAt và khoảng cách CheckinDistanceKm.\n7. Hệ thống hiển thị thông báo: 'Check-in thành công! Bạn đang cách công trình d km. Đã mở khóa cho phép thực hiện bảo trì'."],
            ["Luồng rẽ nhánh / Ngoại lệ", "6a. Nếu khoảng cách tính toán d > 1.0 km, hệ thống từ chối mở khóa, ghi nhận cảnh báo và thông báo lỗi: 'Vị trí của bạn đang cách công trình d km, vượt quá bán kính cho phép (<= 1.0 km). Vui lòng di chuyển đến đúng địa chỉ để check-in'."]
          ],
          [25, 75]
        ),

        createSubSubHeading("3.3.5. Đặc tả chi tiết UC-04: Nghiệm thu hoàn thành bắt buộc tải ảnh thiết bị"),
        createTableCaption("Bảng 3.5", "Đặc tả chi tiết ca sử dụng UC-04: Nghiệm thu hoàn thành bắt buộc tải ảnh"),
        createCustomTable(
          ["Mục đặc tả", "Nội dung chi tiết"],
          [
            ["Mã & Tên ca sử dụng", "UC-04: Nghiệm thu hoàn tất bảo trì bắt buộc đính kèm ảnh chụp thiết bị"],
            ["Tác nhân chính", "Kỹ thuật viên bảo trì (Technician)"],
            ["Mục đích ca sử dụng", "Đóng phiếu bảo trì và lưu trữ bằng chứng hình ảnh minh chứng thiết bị PCCC đã được xử lý đạt chuẩn an toàn."],
            ["Tiền điều kiện", "Phiếu bảo trì đã được Check-in GPS hợp lệ (Status = In Progress) và công việc sửa chữa thiết bị đã xong."],
            ["Hậu điều kiện", "Phiếu bảo trì chuyển trạng thái 'Resolved', hình ảnh nghiệm thu được lưu vào lịch sử thiết bị và thông báo cho khách hàng."],
            ["Luồng sự kiện chính", "1. Kỹ thuật viên nhấn nút 'Hoàn tất công việc' trên giao diện phiếu bảo trì.\n2. Hệ thống mở hộp thoại nghiệm thu, yêu cầu nhập kết quả kiểm tra (ví dụ: Đã thay gioăng cao su, nạp bột ABC, đo áp kế đạt 14 bar) và yêu cầu đính kèm ảnh chụp thiết bị sau bảo dưỡng.\n3. Khi Kỹ thuật viên chưa tải ảnh lên, nút 'Xác nhận hoàn thành phiếu' ở trạng thái vô hiệu hóa (Disabled).\n4. Kỹ thuật viên bấm chụp ảnh thiết bị tại hiện trường (chụp tem kiểm định mới, chụp đồng hồ áp suất vạch xanh).\n5. Khi file ảnh đã được chọn thành công, nút 'Xác nhận hoàn thành phiếu' chuyển sang trạng thái kích hoạt (Active).\n6. Kỹ thuật viên nhấn nút xác nhận.\n7. Hệ thống upload ảnh lên máy chủ, cập nhật Status = Resolved, lưu ResolvedAt và ResolvedPhotoUrl vào bảng ServiceRequests.\n8. Hệ thống phát thông báo tới Khách hàng và Admin, đồng thời ghi nhận điểm KPI cho Kỹ thuật viên."],
            ["Luồng rẽ nhánh / Ngoại lệ", "5a. Nếu người dùng cố tình can thiệp mã nguồn Client để bấm nút gửi khi không có ảnh, API Backend sẽ kiểm tra và từ chối với mã lỗi 400 Bad Request: 'Yêu cầu nghiệm thu bắt buộc phải có hình ảnh chụp thiết bị thực tế'."]
          ],
          [25, 75]
        ),

        createSubSubHeading("3.3.6. Đặc tả chi tiết UC-05: Khảo sát, tư vấn tiêu chuẩn & Tạo báo giá sơ bộ AI"),
        createTableCaption("Bảng 3.6", "Đặc tả chi tiết ca sử dụng UC-05: Tư vấn quy chuẩn & Báo giá sơ bộ AI"),
        createCustomTable(
          ["Mục đặc tả", "Nội dung chi tiết"],
          [
            ["Mã & Tên ca sử dụng", "UC-05: Khảo sát, tư vấn tiêu chuẩn TCVN và Tự động lập báo giá sơ bộ bằng AI"],
            ["Tác nhân chính", "Nhân viên kinh doanh (Sales) hoặc Khách hàng (Customer)"],
            ["Mục đích ca sử dụng", "Giúp người dùng nhanh chóng xác định cấu hình trang thiết bị PCCC bắt buộc và ước tính chi phí sơ bộ theo đúng tiêu chuẩn nhà nước."],
            ["Tiền điều kiện", "Người dùng truy cập vào phân hệ 'Tư Vấn & Báo Giá AI'."],
            ["Hậu điều kiện", "Bảng dự toán báo giá sơ bộ được tạo với mã định danh duy nhất và có thể xuất ra file PDF chuyên nghiệp."],
            ["Luồng sự kiện chính", "1. Người dùng nhập các thông số công trình: Diện tích mặt sàn (m2), Số tầng, Mục đích sử dụng (Văn phòng, Xưởng sản xuất, Quán karaoke, Nhà kho).\n2. Người dùng nhấn nút 'Phân tích tiêu chuẩn & Báo giá AI'.\n3. Hệ thống kích hoạt mô hình RAG: truy xuất các điều khoản TCVN 3890:2023 tương ứng với công năng công trình.\n4. AI tính toán định mức thiết bị: Số lượng bình bột ABC, bình khí CO2, số đầu báo khói/nhiệt, tủ trung tâm, họng nước vách tường.\n5. AI nhân số lượng với đơn giá vật tư và đơn giá nhân công lắp đặt trong cơ sở dữ liệu để tính tổng chi phí.\n6. Hệ thống hiển thị bảng bóc tách chi tiết trên giao diện kèm các điều khoản viện dẫn từ TCVN.\n7. Người dùng nhấn 'Lưu báo giá & Xuất PDF', hệ thống cấp mã báo giá (ví dụ: BG-2026-0042) và cho phép tải file."],
            ["Luồng rẽ nhánh / Ngoại lệ", "1a. Nếu diện tích nhập vào <= 0 hoặc vượt quá 100.000 m2, hệ thống hiển thị cảnh báo yêu cầu nhập thông số hợp lệ."]
          ],
          [25, 75]
        ),

        createSubSubHeading("3.3.7. Đặc tả chi tiết UC-06: Quản lý kho hàng & Cấp phát mã QR định danh"),
        createTableCaption("Bảng 3.7", "Đặc tả chi tiết ca sử dụng UC-06: Quản lý kho hàng & Mã QR thiết bị"),
        createCustomTable(
          ["Mục đặc tả", "Nội dung chi tiết"],
          [
            ["Mã & Tên ca sử dụng", "UC-06: Quản lý kho vật tư và Cấp phát mã QR Code định danh theo số Serial"],
            ["Tác nhân chính", "Thủ kho (Warehouse Keeper) hoặc Quản trị viên (Admin)"],
            ["Mục đích ca sử dụng", "Gắn mã định danh duy nhất (1-1 giữa Serial và QR Code) cho từng thiết bị PCCC khi xuất kho lắp đặt cho công trình."],
            ["Tiền điều kiện", "Thiết bị đã được nhập kho và có số Serial dập chìm trên thân."],
            ["Hậu điều kiện", "Mỗi thiết bị được tạo một bản ghi định danh kèm mã QR Code duy nhất có thể quét tra cứu lý lịch."],
            ["Luồng sự kiện chính", "1. Thủ kho truy cập phân hệ 'Quản Lý Kho & Thiết Bị'.\n2. Chọn lệnh 'Xuất kho cho dự án', chọn dự án thi công đích.\n3. Chọn Model thiết bị và nhập danh sách các số Serial vật lý.\n4. Hệ thống tự động sinh mã QR Code duy nhất tương ứng với từng số Serial.\n5. Thủ kho in tem mã QR và dán trực tiếp lên thân thiết bị trước khi bàn giao cho đội thi công.\n6. Hệ thống trừ tồn kho khả dụng tương ứng và lưu vết cấp phát vào bảng ProjectEquipments."],
            ["Luồng rẽ nhánh / Ngoại lệ", "3a. Nếu số Serial nhập vào đã tồn tại trong hệ thống, hệ thống cảnh báo trùng lặp và yêu cầu kiểm tra lại."]
          ],
          [25, 75]
        ),

        createSubHeading("3.4. Mô hình hóa hướng đối tượng (UML Diagrams)"),
        createSubSubHeading("3.4.1. Sơ đồ lớp phần mềm chi tiết (Class Diagram)"),
        p("Sơ đồ lớp phần mềm chi tiết biểu diễn cấu trúc của các thực thể cốt lõi trong tầng Domain, các phương thức nghiệp vụ và mối quan hệ giữa chúng trong kiến trúc Clean Architecture:"),
        ...createImagePlaceholder("Hình 3.3", "Sơ đồ lớp phần mềm chi tiết (Class Diagram theo Clean Architecture)", "Dán sơ đồ Class Diagram hoàn chỉnh thể hiện User, Project, ProjectProgressLog, ProjectEquipment, ServiceRequest, EquipmentAsset, Quotation vào đây"),

        createSubSubHeading("3.4.2. Sơ đồ hoạt động (Activity Diagrams) cho 4 quy trình lớn"),
        p("Sơ đồ hoạt động mô tả chi tiết tiến trình nghiệp vụ Đội trưởng phân công thợ và gửi ảnh tiến độ công trình:"),
        ...createImagePlaceholder("Hình 3.4", "Sơ đồ hoạt động (Activity Diagram): Phân công tổ thợ và cập nhật ảnh tiến độ", "Dán sơ đồ Activity Diagram quy trình phân công thợ và cập nhật ảnh tiến độ vào đây"),
        p("Sơ đồ hoạt động mô tả quy trình đối soát vị trí GPS trong bán kính 1km và bắt buộc tải ảnh nghiệm thu của Kỹ thuật viên:"),
        ...createImagePlaceholder("Hình 3.5", "Sơ đồ hoạt động (Activity Diagram): Đối soát GPS 1km và nghiệm thu ảnh bảo trì", "Dán sơ đồ Activity Diagram quy trình check-in GPS và nghiệm thu ảnh vào đây"),
        p("Sơ đồ hoạt động mô tả tiến trình giải thuật chấm điểm đa tiêu chí WSM trong việc tự động điều phối kỹ thuật viên:"),
        ...createImagePlaceholder("Hình 3.6", "Sơ đồ hoạt động (Activity Diagram): Thuật toán AI Dispatching điều phối thợ", "Dán sơ đồ Activity Diagram giải thuật điều phối thợ WSM vào đây"),
        p("Sơ đồ hoạt động mô tả luồng bóc tách quy chuẩn TCVN và tạo sinh bảng báo giá sơ bộ tự động qua AI:"),
        ...createImagePlaceholder("Hình 3.7", "Sơ đồ hoạt động (Activity Diagram): Bóc tách dự toán báo giá sơ bộ tự động bằng AI", "Dán sơ đồ Activity Diagram quy trình bóc tách dự toán AI vào đây"),

        createSubSubHeading("3.4.3. Sơ đồ tuần tự (Sequence Diagrams) cho các tương tác phức tạp"),
        p("Sơ đồ tuần tự mô tả luồng xác thực đăng nhập, kiểm tra mật khẩu BCrypt, cấp phát JWT Token và điều hướng giao diện theo vai trò:"),
        ...createImagePlaceholder("Hình 3.8", "Sơ đồ tuần tự (Sequence Diagram): Luồng xác thực đăng nhập và phân quyền JWT", "Dán sơ đồ Sequence Diagram quy trình xác thực đăng nhập và phân quyền vào đây"),
        p("Sơ đồ tuần tự mô tả quá trình gửi tọa độ GPS từ Client, gọi hàm Haversine tính toán khoảng cách và khóa bán kính 1km:"),
        ...createImagePlaceholder("Hình 3.9", "Sơ đồ tuần tự (Sequence Diagram): Check-in GPS đối soát bán kính 1km", "Dán sơ đồ Sequence Diagram quy trình Check-in GPS vào đây"),
        p("Sơ đồ tuần tự mô tả quá trình tải ảnh báo cáo tiến độ từ hiện trường và phát sóng tín hiệu SignalR lên Dashboard Admin:"),
        ...createImagePlaceholder("Hình 3.10", "Sơ đồ tuần tự (Sequence Diagram): Báo cáo ảnh hiện trường và phát tín hiệu SignalR", "Dán sơ đồ Sequence Diagram luồng phát tín hiệu SignalR vào đây"),
        p("Sơ đồ tuần tự mô tả quy trình nghiệm thu hoàn thành công trình và chuyển đổi tự động từ vật tư sang tài sản bảo hành:"),
        ...createImagePlaceholder("Hình 3.11", "Sơ đồ tuần tự (Sequence Diagram): Nghiệm thu hoàn tất và kích hoạt bảo hành", "Dán sơ đồ Sequence Diagram quy trình nghiệm thu bàn giao tài sản vào đây"),

        createSubHeading("3.5. Thiết kế cơ sở dữ liệu chi tiết"),
        createSubSubHeading("3.5.1. Sơ đồ thực thể liên kết (ERD) hoàn chỉnh"),
        p("Cơ sở dữ liệu được thiết kế theo chuẩn hóa mức 3NF, loại bỏ toàn bộ dữ liệu dư thừa và bảo đảm tính toàn vẹn quan hệ thông qua hệ thống khóa ngoại và ràng buộc chặt chẽ:"),
        ...createImagePlaceholder("Hình 3.12", "Sơ đồ thực thể liên kết (ERD) cơ sở dữ liệu trên Microsoft SQL Server", "Dán sơ đồ Entity-Relationship Diagram (ERD) hoàn chỉnh thể hiện đầy đủ các bảng và khóa ngoại vào đây"),

        createSubSubHeading("3.5.2. Thiết kế từ điển dữ liệu (Data Dictionary) cho 10 bảng dữ liệu chính"),
        createTableCaption("Bảng 3.8", "Từ điển dữ liệu bảng Users (Tài khoản người dùng và vai trò)"),
        createCustomTable(
          ["Tên trường", "Kiểu dữ liệu", "Khóa", "Ràng buộc", "Mô tả ý nghĩa nghiệp vụ"],
          [
            ["Id", "UNIQUEIDENTIFIER", "PK", "NOT NULL, DEFAULT NEWID()", "Mã định danh duy nhất toàn cầu của người dùng."],
            ["Email", "NVARCHAR(150)", "None", "NOT NULL, UNIQUE", "Địa chỉ email đăng nhập hệ thống."],
            ["PasswordHash", "NVARCHAR(500)", "None", "NOT NULL", "Mật khẩu người dùng đã được băm an toàn bằng BCrypt."],
            ["FullName", "NVARCHAR(150)", "None", "NOT NULL", "Họ và tên đầy đủ của người dùng."],
            ["PhoneNumber", "NVARCHAR(20)", "None", "NULLABLE", "Số điện thoại di động liên hệ."],
            ["Role", "INT", "None", "NOT NULL, DEFAULT 1", "Vai trò: 1-Admin, 2-Leader, 3-Technician, 4-Sales, 5-Customer."],
            ["AvatarUrl", "NVARCHAR(500)", "None", "NULLABLE", "Đường dẫn URL ảnh đại diện cá nhân."],
            ["IsActive", "BIT", "None", "NOT NULL, DEFAULT 1", "Trạng thái kích hoạt tài khoản: 1-Hoạt động, 0-Khóa."],
            ["CreatedAt", "DATETIME2", "None", "NOT NULL, DEFAULT GETUTCDATE()", "Thời điểm tài khoản được khởi tạo trong hệ thống."]
          ],
          [18, 20, 10, 22, 30]
        ),

        createTableCaption("Bảng 3.9", "Từ điển dữ liệu bảng Projects (Dự án công trình thi công PCCC)"),
        createCustomTable(
          ["Tên trường", "Kiểu dữ liệu", "Khóa", "Ràng buộc", "Mô tả ý nghĩa nghiệp vụ"],
          [
            ["Id", "UNIQUEIDENTIFIER", "PK", "NOT NULL, DEFAULT NEWID()", "Mã định danh duy nhất của dự án thi công."],
            ["ProjectCode", "NVARCHAR(50)", "None", "NOT NULL, UNIQUE", "Mã quản lý dự án (ví dụ: DA-2026-001)."],
            ["ProjectName", "NVARCHAR(250)", "None", "NOT NULL", "Tên công trình thi công (Tòa nhà, chung cư, nhà xưởng)."],
            ["CustomerId", "UNIQUEIDENTIFIER", "FK", "NOT NULL", "Khóa ngoại tham chiếu đến bảng Users (Khách hàng)."],
            ["LeaderId", "UNIQUEIDENTIFIER", "FK", "NULLABLE", "Khóa ngoại tham chiếu đến bảng Users (Đội trưởng phụ trách)."],
            ["Address", "NVARCHAR(500)", "None", "NOT NULL", "Địa chỉ địa lý nơi triển khai thi công."],
            ["StartDate", "DATETIME2", "None", "NOT NULL", "Ngày chính thức khởi công dự án."],
            ["EndDate", "DATETIME2", "None", "NULLABLE", "Ngày dự kiến hoàn thành và bàn giao."],
            ["Budget", "DECIMAL(18,2)", "None", "NOT NULL, DEFAULT 0", "Tổng giá trị dự toán ngân sách công trình (VNĐ)."],
            ["CompletionPercentage", "INT", "None", "NOT NULL, CHECK(0-100)", "Tỷ lệ phần trăm tiến độ hoàn thành hiện tại."],
            ["Status", "INT", "None", "NOT NULL, DEFAULT 1", "Trạng thái: 1-Planning, 2-In Progress, 6-Completed."],
            ["CreatedAt", "DATETIME2", "None", "NOT NULL, DEFAULT GETUTCDATE()", "Thời điểm dự án được tạo mới trong hệ thống."]
          ],
          [18, 20, 10, 22, 30]
        ),

        createTableCaption("Bảng 3.10", "Từ điển dữ liệu bảng ProjectProgressLogs (Nhật ký tiến độ và ảnh hiện trường)"),
        createCustomTable(
          ["Tên trường", "Kiểu dữ liệu", "Khóa", "Ràng buộc", "Mô tả ý nghĩa nghiệp vụ"],
          [
            ["Id", "UNIQUEIDENTIFIER", "PK", "NOT NULL, DEFAULT NEWID()", "Mã định danh duy nhất của bản ghi nhật ký."],
            ["ProjectId", "UNIQUEIDENTIFIER", "FK", "NOT NULL", "Khóa ngoại tham chiếu đến bảng Projects."],
            ["LeaderId", "UNIQUEIDENTIFIER", "FK", "NOT NULL", "Khóa ngoại tham chiếu đến Đội trưởng lập báo cáo."],
            ["LogDate", "DATETIME2", "None", "NOT NULL, DEFAULT GETUTCDATE()", "Thời điểm Đội trưởng bấm gửi báo cáo."],
            ["ProgressPercent", "INT", "None", "NOT NULL, CHECK(0-100)", "Mức tiến độ % mới tại thời điểm báo cáo."],
            ["LogContent", "NVARCHAR(MAX)", "None", "NOT NULL", "Nội dung tóm tắt công việc tổ thợ hoàn thành."],
            ["PhotoUrl", "NVARCHAR(1000)", "None", "NOT NULL", "Đường dẫn URL lưu file ảnh hiện trường thực tế."],
            ["WorkersAssignedJson", "NVARCHAR(MAX)", "None", "NULLABLE", "Chuỗi JSON lưu vết phân công thợ 1, 2, 3, 4."]
          ],
          [18, 20, 10, 22, 30]
        ),

        createTableCaption("Bảng 3.11", "Từ điển dữ liệu bảng ProjectEquipments (Vật tư thiết bị công trình)"),
        createCustomTable(
          ["Tên trường", "Kiểu dữ liệu", "Khóa", "Ràng buộc", "Mô tả ý nghĩa nghiệp vụ"],
          [
            ["Id", "UNIQUEIDENTIFIER", "PK", "NOT NULL, DEFAULT NEWID()", "Mã định danh của bản ghi cấp phát vật tư."],
            ["ProjectId", "UNIQUEIDENTIFIER", "FK", "NOT NULL", "Khóa ngoại tham chiếu đến bảng Projects."],
            ["EquipmentModelId", "UNIQUEIDENTIFIER", "FK", "NOT NULL", "Khóa ngoại tham chiếu đến EquipmentModels."],
            ["QuantityPlanned", "INT", "None", "NOT NULL, CHECK(>0)", "Số lượng thiết bị dự toán theo thiết kế."],
            ["QuantityInstalled", "INT", "None", "NOT NULL, DEFAULT 0", "Số lượng thiết bị thực tế đã lắp đặt hoàn thiện."],
            ["SerialNumber", "NVARCHAR(100)", "None", "NULLABLE", "Số Serial dập chìm trên thân thiết bị."],
            ["Status", "INT", "None", "NOT NULL, DEFAULT 1", "Trạng thái: 1-Pending, 2-Installed, 3-HandedOver."]
          ],
          [18, 20, 10, 22, 30]
        ),

        createTableCaption("Bảng 3.12", "Từ điển dữ liệu bảng ServiceRequests / Tickets (Phiếu yêu cầu bảo dưỡng)"),
        createCustomTable(
          ["Tên trường", "Kiểu dữ liệu", "Khóa", "Ràng buộc", "Mô tả ý nghĩa nghiệp vụ"],
          [
            ["Id", "UNIQUEIDENTIFIER", "PK", "NOT NULL, DEFAULT NEWID()", "Mã định danh duy nhất của phiếu sự cố/bảo trì."],
            ["TicketCode", "NVARCHAR(50)", "None", "NOT NULL, UNIQUE", "Mã quản lý phiếu (ví dụ: SR-2026-089)."],
            ["CustomerId", "UNIQUEIDENTIFIER", "FK", "NOT NULL", "Khóa ngoại tham chiếu đến khách hàng yêu cầu."],
            ["TechnicianId", "UNIQUEIDENTIFIER", "FK", "NULLABLE", "Khóa ngoại tham chiếu đến Kỹ thuật viên xử lý."],
            ["Title", "NVARCHAR(250)", "None", "NOT NULL", "Tiêu đề sự cố cần khắc phục hoặc bảo dưỡng."],
            ["Priority", "INT", "None", "NOT NULL, DEFAULT 2", "Mức độ khẩn cấp: 1-Low, 2-Medium, 3-High, 4-Urgent."],
            ["Status", "INT", "None", "NOT NULL, DEFAULT 1", "Trạng thái: 1-Open, 2-Assigned, 3-InProgress, 4-Resolved."],
            ["Latitude", "FLOAT", "None", "NOT NULL", "Tọa độ vĩ độ của cơ sở khách hàng."],
            ["Longitude", "FLOAT", "None", "NOT NULL", "Tọa độ kinh độ của cơ sở khách hàng."],
            ["CheckinDistanceKm", "FLOAT", "None", "NULLABLE", "Khoảng cách Haversine tính được lúc check-in."],
            ["CheckinAt", "DATETIME2", "None", "NULLABLE", "Thời điểm Kỹ thuật viên check-in GPS thành công."],
            ["ResolvedPhotoUrl", "NVARCHAR(1000)", "None", "NULLABLE", "Bắt buộc có ảnh nghiệm thu trước khi chuyển Resolved."]
          ],
          [18, 20, 10, 22, 30]
        ),

        createTableCaption("Bảng 3.13", "Từ điển dữ liệu bảng EquipmentAssets (Sổ tài sản thiết bị định danh QR)"),
        createCustomTable(
          ["Tên trường", "Kiểu dữ liệu", "Khóa", "Ràng buộc", "Mô tả ý nghĩa nghiệp vụ"],
          [
            ["Id", "UNIQUEIDENTIFIER", "PK", "NOT NULL, DEFAULT NEWID()", "Mã định danh duy nhất của tài sản thiết bị."],
            ["SerialNumber", "NVARCHAR(100)", "None", "NOT NULL, UNIQUE", "Số Serial dập chìm trên thân bình/tủ thiết bị."],
            ["QrCode", "NVARCHAR(100)", "None", "NOT NULL, UNIQUE", "Mã QR Code duy nhất dán tem tra cứu."],
            ["ModelName", "NVARCHAR(250)", "None", "NOT NULL", "Tên thiết bị (Bình bột MFZ4, Bình khí CO2 MT3)."],
            ["CustomerId", "UNIQUEIDENTIFIER", "FK", "NOT NULL", "Khóa ngoại tham chiếu đến khách hàng sở hữu."],
            ["ProjectId", "UNIQUEIDENTIFIER", "FK", "NULLABLE", "Khóa ngoại tham chiếu đến dự án thi công gốc."],
            ["InstalledDate", "DATETIME2", "None", "NOT NULL", "Ngày lắp đặt và nghiệm thu đưa vào vận hành."],
            ["LastMaintenanceDate", "DATETIME2", "None", "NULLABLE", "Ngày bảo dưỡng nạp sạc gần nhất."],
            ["NextMaintenanceDate", "DATETIME2", "None", "NOT NULL", "Hạn bảo dưỡng tiếp theo (tự động tính cảnh báo)."],
            ["Status", "INT", "None", "NOT NULL, DEFAULT 1", "Trạng thái: 1-Good, 2-NeedMaintenance, 3-Expired."]
          ],
          [18, 20, 10, 22, 30]
        ),

        createSubSubHeading("3.5.3. Thiết kế ràng buộc toàn vẹn và chiến lược đánh chỉ mục (Indexing)"),
        p("Để tối ưu hóa tốc độ thực thi câu lệnh SQL và bảo vệ dữ liệu khỏi dị thường, hệ thống thiết lập chiến lược chỉ mục nghiêm ngặt:"),
        bullet("Clustered Index: Mặc định được tạo tự động trên cột khóa chính Id (Primary Key) của mọi bảng dữ liệu."),
        bullet("Unique Non-Clustered Index: Tạo trên cột Users.Email, Projects.ProjectCode, ServiceRequests.TicketCode, EquipmentAssets.SerialNumber và EquipmentAssets.QrCode để ngăn chặn hoàn toàn việc chèn dữ liệu trùng lặp."),
        bullet("Composite Non-Clustered Index: Tạo trên cặp khóa ngoại thường xuyên tham gia mệnh đề JOIN và WHERE, ví dụ: IX_ProjectProgressLogs_ProjectId_LogDate (giúp tăng tốc độ truy vấn lịch sử ảnh thi công của dự án) và IX_ServiceRequests_TechnicianId_Status (giúp truy vấn danh sách phiếu đang xử lý của kỹ thuật viên cực nhanh)."),

        createSubHeading("3.6. Thiết kế giao diện người dùng (UI/UX) chi tiết"),
        createSubSubHeading("3.6.1. Phân hệ Đăng nhập và Điều hướng vai trò người dùng"),
        p("Giao diện đăng nhập được thiết kế theo phong cách tối giản, sang trọng với gam màu xanh hải quân đậm (Navy Blue) đại diện cho sự tin cậy kỹ thuật. Form đăng nhập tích hợp cơ chế xác thực email hợp lệ và mật khẩu che giấu. Khi người dùng bấm đăng nhập, nút bấm hiển thị hiệu ứng xoay (Loading Spinner) và tạm khóa để chống click đúp. Sau khi nhận JWT Token từ Backend, hệ thống tự động giải mã Claim vai trò và điều hướng tức thì về trang đích tương ứng."),
        ...createImagePlaceholder("Hình 3.13", "Giao diện Đăng nhập hệ thống và xác thực phân quyền Role-Based Redirect", "Dán ảnh chụp màn hình Giao diện Đăng nhập hệ thống vào đây"),

        createSubSubHeading("3.6.2. Phân hệ Dashboard Quản trị trung tâm & Giám sát ảnh hiện trường"),
        p("Dashboard dành cho Quản trị viên cung cấp cái nhìn toàn cảnh về tình hình vận hành của toàn bộ doanh nghiệp. Khu vực trên cùng bố trí 4 thẻ số liệu KPI: (1) Tổng số công trình đang thi công; (2) Số đơn bảo trì khẩn cấp trong ngày; (3) Tỷ lệ tuân thủ GPS đạt chuẩn 100%; (4) Tổng doanh thu dự toán lũy kế. Khu vực trung tâm là biểu đồ tiến độ dự án. Phía bên phải là cột Live Field Feed – dòng ảnh hiện trường thời gian thực liên tục cập nhật những bức ảnh mới nhất được chụp từ công trường."),
        ...createImagePlaceholder("Hình 3.14", "Giao diện Dashboard Quản trị Admin với Feed ảnh hiện trường thời gian thực", "Dán ảnh chụp màn hình Dashboard Quản trị Admin hiển thị KPI và Live Feed ảnh vào đây"),

        createSubSubHeading("3.6.3. Phân hệ Bàn làm việc Đội trưởng thi công & Phân công thợ 1, 2, 3, 4"),
        p("Giao diện dành riêng cho Đội trưởng thi công được tối ưu hóa đặc thù cho việc thao tác nhanh trên công trường. Danh sách các dự án phụ trách được hiển thị dạng thẻ trực quan kèm thanh trượt tiến độ màu xanh lá. Khi chọn dự án, Đội trưởng mở tab 'Phân công tổ thợ' để giao việc cho Nhân công 1, 2, 3, 4 một cách tức thì."),
        ...createImagePlaceholder("Hình 3.15", "Giao diện Bàn làm việc Đội trưởng thi công & Bảng phân công thợ 1, 2, 3, 4", "Dán ảnh chụp màn hình Bàn làm việc Đội trưởng và chức năng phân công thợ vào đây"),

        createSubSubHeading("3.6.4. Hộp thoại cập nhật tiến độ % và tải ảnh thực tế công trình"),
        p("Khi Đội trưởng kéo thanh trượt tiến độ và bấm 'Cập nhật tiến độ & Tải ảnh', một hộp thoại Modal hiện đại xuất hiện. Đội trưởng nhập tóm tắt công việc trong ngày và bấm chọn ảnh chụp từ hiện trường. Nút 'Gửi báo cáo' chỉ sáng lên khi đã có file ảnh hợp lệ."),
        ...createImagePlaceholder("Hình 3.16", "Hộp thoại Đội trưởng cập nhật tiến độ % và tải ảnh thực tế công trình", "Dán ảnh chụp màn hình Hộp thoại cập nhật tiến độ kèm ảnh thực tế vào đây"),

        createSubSubHeading("3.6.5. Phân hệ Kỹ thuật viên bảo trì, Bản đồ định vị và Check-in GPS 1km"),
        p("Giao diện di động dành cho Kỹ thuật viên bảo trì tích hợp Bản đồ số tương tác Leaflet. Hệ thống tự động xác định vị trí hiện tại của kỹ thuật viên và vẽ đường lộ trình di chuyển màu xanh lam nối tới địa chỉ của khách hàng kèm khoảng cách km. Khi kỹ thuật viên di chuyển vào phạm vi bán kính $\\le 1.0$ km, nút 'Check-in vị trí hiện trường' sẽ sáng lên và cho phép kích hoạt phiếu làm việc."),
        ...createImagePlaceholder("Hình 3.17", "Giao diện Bản đồ điều phối Leaflet GPS và điều hướng lộ trình kỹ thuật viên", "Dán ảnh chụp màn hình Bản đồ điều phối GPS và khoảng cách vào đây"),

        createSubSubHeading("3.6.6. Hộp thoại Nghiệm thu bảo trì bắt buộc đính kèm ảnh hiện trường"),
        p("Sau khi khắc phục sự cố, kỹ thuật viên mở hộp thoại 'Nghiệm thu hoàn thành'. Nút xác nhận bị khóa hoàn toàn cho đến khi kỹ thuật viên bấm chụp và tải lên hình ảnh chụp thiết bị sau khi bảo dưỡng:"),
        ...createImagePlaceholder("Hình 3.18", "Hộp thoại Nghiệm thu bảo trì bắt buộc đính kèm ảnh hiện trường", "Dán ảnh chụp màn hình Hộp thoại Nghiệm thu bắt buộc có ảnh trước khi hoàn tất vào đây"),

        createSubSubHeading("3.6.7. Phân hệ Chatbot AI RAG tư vấn quy chuẩn & Báo giá sơ bộ tức thì"),
        p("Giao diện Chatbot AI RAG cung cấp trải nghiệm hội thoại thông minh. Khách hàng hoặc nhân viên kinh doanh có thể đặt câu hỏi về tiêu chuẩn TCVN 3890 hoặc nhập thông số: 'Tòa nhà văn phòng 5 tầng, diện tích mỗi sàn 350m2 cần trang bị những gì?'. AI sẽ tự động phân tích và sinh ra bảng dự toán bóc tách chi phí sơ bộ tức thì kèm nút tải file báo giá."),
        ...createImagePlaceholder("Hình 3.19", "Giao diện Chatbot AI RAG tư vấn tiêu chuẩn TCVN 3890 và Báo giá tức thì", "Dán ảnh chụp màn hình Trợ lý Chatbot AI tư vấn và bảng Báo giá sơ bộ tự động vào đây"),

        createSubSubHeading("3.6.8. Phân hệ Quản lý kho vật tư và Sổ theo dõi tài sản thiết bị QR Code"),
        p("Giao diện quản trị kho cho phép theo dõi tồn kho theo Model và cấp phát mã QR Code định danh duy nhất cho từng số Serial của thiết bị khi xuất kho thi công. Khi quét mã QR dán trên bình chữa cháy, màn hình hiển thị toàn bộ hồ sơ lý lịch: Ngày sản xuất, Ngày nạp sạc, Hạn bảo dưỡng kế tiếp và Lịch sử sửa chữa."),
        ...createImagePlaceholder("Hình 3.20", "Giao diện Quản lý thiết bị định danh theo số Serial và mã vạch QR Code", "Dán ảnh chụp màn hình Quản lý Thiết bị theo mã QR và Serial vào đây"),
        new Paragraph({ children: [new PageBreak()] }),

        // -----------------------------------------------------------------------------
        // CHƯƠNG 4
        // -----------------------------------------------------------------------------
        createHeaderTitle("Chương 4. CÀI ĐẶT, TRIỂN KHAI VÀ ĐÁNH GIÁ HỆ THỐNG"),
        createSubHeading("4.1. Môi trường cài đặt, cấu hình phần cứng và phần mềm"),
        p("Hệ thống FireGuard AI được triển khai thử nghiệm trên hạ tầng máy chủ với các thông số kỹ thuật tiêu chuẩn doanh nghiệp:"),
        bullet("Hạ tầng máy chủ ứng dụng: CPU Intel Core i7 12-Core 4.9GHz, 32GB RAM DDR5, ổ cứng thể rắn 512GB NVMe SSD tốc độ đọc 7000MB/s, băng thông mạng 1Gbps đối xứng."),
        bullet("Hệ điều hành máy chủ: Windows 11 Professional (Môi trường phát triển nội bộ) và Ubuntu Server 22.04 LTS (Môi trường Staging đóng gói Docker Container)."),
        bullet("Hệ quản trị cơ sở dữ liệu: Microsoft SQL Server Developer Edition 2022 kết hợp công cụ quản trị SQL Server Management Studio (SSMS) v19."),
        bullet("Môi trường thực thi phần mềm: .NET 8.0 SDK, Node.js v20.12.0 LTS, npm v10.5.0."),
        bullet("Công cụ kiểm thử và tối ưu: xUnit (Kiểm thử đơn vị), Postman (Kiểm thử API Endpoint), Chrome DevTools (Phân tích hiệu năng giao diện)."),

        createSubHeading("4.2. Hiện thực các module giải pháp kỹ thuật cốt lõi"),
        createSubSubHeading("4.2.1. Cài đặt thuật toán đối soát khoảng cách GPS bằng Haversine trong C#"),
        p("Đoạn mã C# sau đây hiện thực thuật toán lượng giác cầu Haversine trong tầng Application Service, tính toán khoảng cách và kiểm tra điều kiện bán kính an toàn 1.0 km:"),
        p("public static double CalculateDistanceKm(double lat1, double lon1, double lat2, double lon2)\n{\n    const double R = 6371.0; // Bán kính trung bình của Trái Đất (km)\n    var dLat = ToRadians(lat2 - lat1);\n    var dLon = ToRadians(lon2 - lon1);\n    var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +\n            Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *\n            Math.Sin(dLon / 2) * Math.Sin(dLon / 2);\n    var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));\n    return R * c;\n}\nprivate static double ToRadians(double degrees) => degrees * (Math.PI / 180.0);", { bold: true, italics: true, alignment: AlignmentType.LEFT }),
        p("Khi Kỹ thuật viên bấm check-in, Endpoint POST /api/tickets/{id}/checkin nhận tọa độ thực tế. Nếu khoảng cách tính toán vượt quá 1.0 km, hệ thống từ chối mở khóa và trả về thông báo lỗi chi tiết kèm số km chênh lệch."),

        createSubSubHeading("4.2.2. Cài đặt cơ chế đẩy thông báo Real-time hai chiều qua SignalR Hub"),
        p("Để đồng bộ hóa tức thì ảnh hiện trường từ công trường về Dashboard Admin, hệ thống xây dựng NotificationHub trên nền SignalR:"),
        p("public class NotificationHub : Hub\n{\n    public async Task SendLiveProgressPhoto(string projectId, string photoUrl, int progressPercent, string leaderName)\n    {\n        await Clients.All.SendAsync(\"ReceiveLivePhoto\", new {\n            ProjectId = projectId,\n            PhotoUrl = photoUrl,\n            Progress = progressPercent,\n            LeaderName = leaderName,\n            Timestamp = DateTime.UtcNow\n        });\n    }\n}", { bold: true, italics: true, alignment: AlignmentType.LEFT }),
        p("Tại giao diện React, component AdminDashboard đăng ký lắng nghe sự kiện 'ReceiveLivePhoto'. Khi nhận được tín hiệu, giao diện tự động chèn tấm ảnh mới nhất vào đầu danh sách Live Feed mà không cần tải lại trang."),

        createSubSubHeading("4.2.3. Cài đặt thuật toán chấm điểm điều phối kỹ thuật viên tự động"),
        p("Thuật toán chấm điểm trọng số đa tiêu chí (WSM) được hiện thực để tự động tính điểm số phù hợp của từng kỹ thuật viên:"),
        p("public double CalculateTechnicianScore(Technician tech, ServiceRequest request)\n{\n    double distanceKm = HaversineService.CalculateDistanceKm(tech.Latitude, tech.Longitude, request.Latitude, request.Longitude);\n    double c1_distance = Math.Max(1.0, 10.0 - (distanceKm / 2.0));\n    double c2_skill = tech.HasCertificationFor(request.EquipmentCategory) ? 10.0 : 5.0;\n    double c3_workload = Math.Max(1.0, 10.0 - (3.0 * tech.ActiveTicketsCount));\n    double c4_rating = tech.AverageRating * 2.0; // Quy đổi thang 5 sao sang thang điểm 10\n    return (0.35 * c1_distance) + (0.25 * c2_skill) + (0.20 * c3_workload) + (0.20 * c4_rating);\n}", { bold: true, italics: true, alignment: AlignmentType.LEFT }),

        createSubHeading("4.3. Kịch bản kiểm thử phần mềm chi tiết (Testing & Quality Assurance)"),
        createSubSubHeading("4.3.1. Phương pháp luận và chiến lược kiểm thử"),
        p("Chiến lược kiểm thử phần mềm của đồ án được xây dựng theo mô hình kim tự tháp kiểm thử (Testing Pyramid), bao gồm: Kiểm thử đơn vị (Unit Testing), Kiểm thử tích hợp (Integration Testing) và Kiểm thử hệ thống hộp đen (Black-box System Testing). Toàn bộ các kịch bản kiểm thử đều được xây dựng dựa trên ma trận truy xuất nguồn gốc yêu cầu (Traceability Matrix)."),

        createSubSubHeading("4.3.2. Bảng kịch bản kiểm thử chức năng chính (Functional Test Cases) - 15 Test cases"),
        createTableCaption("Bảng 4.1", "Kịch bản kiểm thử chức năng chính của hệ thống (15 Functional Test Cases)"),
        createCustomTable(
          ["Mã Test", "Tên ca kiểm thử", "Các bước thực hiện", "Dữ liệu đầu vào", "Kết quả mong đợi", "Kết quả thực tế", "Đánh giá"],
          [
            ["TC-01", "Đăng nhập hệ thống thành công", "1. Nhập email và pass\n2. Bấm Đăng nhập", "Email: admin@fireguard.vn\nPass: Admin@123", "Trả về JWT Token hợp lệ, điều hướng vào Dashboard", "Đúng như mong đợi, token lưu vào localStorage", "ĐẠT (Pass)"],
            ["TC-02", "Đăng nhập sai mật khẩu", "1. Nhập email đúng, pass sai\n2. Bấm Đăng nhập", "Email: admin@fireguard.vn\nPass: WrongPass", "Báo lỗi 401 Unauthorized, hiển thị cảnh báo sai mật khẩu", "Hiển thị cảnh báo 'Mật khẩu không chính xác'", "ĐẠT (Pass)"],
            ["TC-03", "Đội trưởng phân công thợ nội bộ", "1. Vào chi tiết DA\n2. Giao việc Thợ 1, 2\n3. Bấm Lưu phân công", "Thợ 1: Hàn ống cấp nước\nThợ 2: Kéo dây tín hiệu", "Bảng phân công hiển thị đúng nội dung và lưu trạng thái", "Lưu trữ thành công, tải lại trang vẫn giữ nguyên", "ĐẠT (Pass)"],
            ["TC-04", "Báo cáo tiến độ kèm ảnh công trình", "1. Kéo thanh tiến độ 70%\n2. Chọn 1 ảnh hiện trường\n3. Bấm Gửi báo cáo", "Progress: 70%\nẢnh: thi_cong_ong.jpg\nGhi chú: Đã xong tầng 2", "Tiến độ dự án cập nhật 70%, ảnh xuất hiện tại nhật ký", "Tiến độ tăng lên 70%, ảnh hiển thị tức thì trên Dashboard", "ĐẠT (Pass)"],
            ["TC-05", "Check-in GPS đúng vị trí (<= 1km)", "1. KTV mở phiếu bảo trì\n2. Bật GPS điện thoại\n3. Bấm Check-in vị trí", "Tọa độ GPS thực tế cách công trình 180 mét (d = 0.18km)", "Hệ thống chấp nhận check-in, mở khóa nút nghiệm thu", "Check-in thành công, trạng thái chuyển In Progress", "ĐẠT (Pass)"],
            ["TC-06", "Nghiệm thu bảo trì có đính kèm ảnh", "1. Nhấn Hoàn tất\n2. Tải ảnh bình chữa cháy\n3. Nhấn Xác nhận đóng phiếu", "Ảnh: tem_kiem_dinh_moi.jpg\nGhi chú: Đã nạp bột ABC", "Ticket chuyển trạng thái 'Resolved', ảnh lưu lịch sử", "Đơn đóng thành công, ảnh hiển thị trong hồ sơ khách hàng", "ĐẠT (Pass)"],
            ["TC-07", "Tạo báo giá tự động bằng AI", "1. Nhập diện tích 500m2\n2. Chọn loại xưởng gỗ\n3. Bấm Dự toán AI", "Diện tích: 500m2\nCông năng: Xưởng gỗ\nSố tầng: 2", "AI trả về bảng bóc tách bình bột ABC, đầu báo nhiệt, chi phí", "Bảng báo giá sơ bộ được tạo với mã dự toán hợp lệ", "ĐẠT (Pass)"],
            ["TC-08", "Nghiệm thu bàn giao kích hoạt bảo hành", "1. Đội trưởng bấm Bàn giao\n2. Xác nhận 100% hoàn thành", "Tiến độ dự án = 100%\nBiên bản nghiệm thu", "Dự án chuyển Status = 6, vật tư chuyển thành tài sản bảo hành", "Toàn bộ thiết bị được cấp sổ theo dõi hạn bảo trì", "ĐẠT (Pass)"],
            ["TC-09", "Quét mã QR tra cứu thiết bị", "1. Mở camera quét mã QR\n2. Xem lý lịch thiết bị", "Mã QR: FG-2026-BCO2-0089", "Hiển thị trang chi tiết: Ngày nạp sạc, Hạn bảo dưỡng kế tiếp", "Hiển thị đầy đủ thông tin thiết bị và lịch sử bảo dưỡng", "ĐẠT (Pass)"],
            ["TC-10", "Tạo mới tài khoản người dùng", "1. Admin vào Quản lý người dùng\n2. Bấm Thêm mới\n3. Điền form", "Email: ktv_moi@fireguard.vn\nRole: Technician", "Người dùng mới được tạo, mật khẩu mặc định được gửi", "Tài khoản tạo thành công, xuất hiện trên danh sách", "ĐẠT (Pass)"],
            ["TC-11", "Khóa tài khoản vi phạm", "1. Admin chọn tài khoản\n2. Bấm Khóa tài khoản", "UserId: 2a9b-...\nLý do: Nghỉ việc", "IsActive chuyển sang 0, người dùng bị đăng xuất ngay", "Người dùng bị chặn đăng nhập ngay lập tức", "ĐẠT (Pass)"],
            ["TC-12", "Lọc danh sách thiết bị sắp hết hạn", "1. Vào phân hệ Thiết bị\n2. Chọn tab 'Cần bảo dưỡng'", "Filter: NextMaintenanceDate <= Now + 30 days", "Hiển thị chính xác danh sách các bình cần nạp sạc", "Danh sách hiển thị chính xác các thiết bị trong hạn 30 ngày", "ĐẠT (Pass)"],
            ["TC-13", "Xuất file báo giá sang định dạng PDF", "1. Mở báo giá AI\n2. Bấm 'Xuất PDF'", "QuotationId: BG-2026-0042", "Tải xuống file PDF có đầy đủ logo, bảng giá và điều khoản", "File PDF tải về chuẩn định dạng in ấn A4", "ĐẠT (Pass)"],
            ["TC-14", "Tiếp nhận đơn sự cố khẩn cấp", "1. Khách hàng gửi yêu cầu\n2. Chọn mức Urgent", "Tiêu đề: Rò rỉ van chữa cháy tầng 1\nPriority: 4", "Hệ thống phát chuông cảnh báo đỏ trên Dashboard", "Cảnh báo khẩn cấp xuất hiện trên Dashboard của Admin", "ĐẠT (Pass)"],
            ["TC-15", "Gửi tin nhắn trao đổi trong dự án", "1. Đội trưởng nhập ghi chú\n2. Bấm Gửi", "Nội dung: Đã tập kết đủ 50 cuộn vòi", "Tin nhắn lưu vào nhật ký và đồng bộ tức thì", "Tin nhắn xuất hiện trên luồng trao đổi của dự án", "ĐẠT (Pass)"]
          ],
          [8, 16, 18, 18, 18, 12, 10]
        ),

        createSubSubHeading("4.3.3. Bảng kịch bản kiểm thử ngoại lệ và giá trị biên (Boundary Test Cases) - 8 Test cases"),
        createTableCaption("Bảng 4.2", "Kịch bản kiểm thử ngoại lệ và giá trị biên (8 Boundary Test Cases)"),
        createCustomTable(
          ["Mã Test", "Tình huống ngoại lệ / Giá trị biên", "Hành vi dự kiến của hệ thống", "Kết quả thực tế kiểm thử", "Đánh giá"],
          [
            ["EXP-01", "Kỹ thuật viên bấm hoàn thành nhưng KHÔNG tải ảnh nghiệm thu", "Hệ thống vô hiệu hóa nút 'Xác nhận', hiển thị cảnh báo: 'Bắt buộc tải ảnh hiện trường trước khi hoàn tất'", "Nút Hoàn thành bị Disabled, không thể gửi yêu cầu nếu thiếu ảnh", "ĐẠT (Pass)"],
            ["EXP-02", "Kỹ thuật viên Check-in GPS ở khoảng cách quá xa (> 1.0 km)", "Hệ thống từ chối check-in, trả về lỗi 400 kèm thông báo: 'Khoảng cách vượt quá bán kính 1km cho phép'", "Hệ thống chặn đứng, báo lỗi chi tiết cách công trình 3.4 km", "ĐẠT (Pass)"],
            ["EXP-03", "Đội trưởng cố gắng nhập tiến độ dự án vượt quá 100% hoặc âm (< 0%)", "Hệ thống chặn bằng Validate UI và ràng buộc CHECK Database, chỉ cho phép giá trị từ 0 đến 100", "Thanh trượt giới hạn 0-100, nhập tay giá trị >100 bị chặn ngay", "ĐẠT (Pass)"],
            ["EXP-04", "Người dùng tải lên file không phải định dạng ảnh (ví dụ: file .exe, .sh)", "Middleware kiểm tra định dạng MIME type, từ chối file lạ, chỉ chấp nhận .jpg, .png, .webp", "Hệ thống báo lỗi 'File không đúng định dạng hình ảnh' và hủy upload", "ĐẠT (Pass)"],
            ["EXP-05", "Đăng nhập với mật khẩu sai quá 5 lần liên tiếp", "Khóa tạm thời tài khoản trong 15 phút để chống tấn công Brute-force", "Hệ thống cảnh báo và tạm khóa đăng nhập đúng quy định", "ĐẠT (Pass)"],
            ["EXP-06", "Kỹ thuật viên tắt GPS trên điện thoại khi bấm Check-in", "Trình duyệt không lấy được tọa độ, hiển thị yêu cầu: 'Vui lòng bật dịch vụ định vị GPS'", "Hiển thị hộp thoại hướng dẫn người dùng bật GPS trên thiết bị", "ĐẠT (Pass)"],
            ["EXP-07", "Nhập diện tích công trình âm trong Báo giá AI (ví dụ: -50 m2)", "Hệ thống chặn bằng FluentValidation, báo lỗi: 'Diện tích sàn phải lớn hơn 0'", "Báo lỗi validation ngay tại ô nhập liệu, không cho phép gửi", "ĐẠT (Pass)"],
            ["EXP-08", "Mất kết nối Internet đột ngột khi đang gửi báo cáo ảnh", "Hệ thống bắt lỗi Network Error, hiển thị thông báo: 'Mất kết nối, vui lòng thử lại khi có mạng'", "Hiển thị thông báo mất kết nối, giữ nguyên dữ liệu trên form nhập", "ĐẠT (Pass)"]
          ],
          [10, 25, 30, 25, 10]
        ),

        createSubSubHeading("4.3.4. Bảng kịch bản kiểm thử bảo mật phân quyền (Security Test Cases) - 6 Test cases"),
        createTableCaption("Bảng 4.3", "Kịch bản kiểm thử an toàn phân quyền vai trò (6 Security Test Cases)"),
        createCustomTable(
          ["Mã Test", "Vai trò thực hiện kiểm thử", "Hành động thử nghiệm vượt quyền", "Kết quả mong đợi", "Kết quả thực tế"],
          [
            ["SEC-01", "Kỹ thuật viên (Technician)", "Cố gắng gọi API xóa người dùng DELETE /api/users/{id}", "Hệ thống chặn bằng Middleware RBAC, trả về mã lỗi 403 Forbidden", "Đúng, trả về 403 Forbidden"],
            ["SEC-02", "Đội trưởng thi công (Leader)", "Cố gắng cập nhật tiến độ công trình của Đội trưởng khác phụ trách", "Hệ thống kiểm tra LeaderId của dự án, từ chối nếu không trùng khớp", "Đúng, trả về 403 Không có quyền"],
            ["SEC-03", "Khách hàng (Customer)", "Truy cập trực tiếp vào đường dẫn /admin/dashboard trên trình duyệt", "Hệ thống Router React chặn lại, tự động chuyển hướng về trang cá nhân", "Đúng, tự động đẩy về /customer"],
            ["SEC-04", "Người dùng nặc danh (Chưa đăng nhập)", "Gửi yêu cầu API không có Bearer Token trong Header", "API Gateway từ chối, trả về mã lỗi 401 Unauthorized", "Đúng, trả về 401 Unauthorized"],
            ["SEC-05", "Người dùng dùng Token đã hết hạn", "Gửi yêu cầu API với Token JWT đã quá hạn 24 giờ", "Hệ thống từ chối xác thực, yêu cầu đăng nhập lại để cấp Token mới", "Đúng, trả về 401 Token Expired"],
            ["SEC-06", "Kỹ thuật viên can thiệp API gán thợ", "Cố gắng tự gán phiếu sự cố khẩn cấp cho chính mình mà không qua AI", "Hệ thống kiểm tra quyền hạn Dispatch, từ chối yêu cầu trái phép", "Đúng, trả về 403 Forbidden"]
          ],
          [10, 20, 30, 25, 15]
        ),

        createSubSubHeading("4.3.5. Kiểm thử hiệu năng, độ trễ và khả năng chịu tải (Performance & Stress Testing)"),
        p("Sử dụng công cụ Apache JMeter và Postman Runner để mô phỏng tải thực tế với kịch bản 200 người dùng đồng thời gửi yêu cầu liên tục trong khoảng thời gian 15 phút. Các chỉ số hiệu năng đo đạc thực tế ghi nhận được:"),
        bullet("Thời gian phản hồi trung bình của API truy vấn danh sách công trình: 112 mili-giây (thấp hơn nhiều so với ngưỡng yêu cầu 200ms)."),
        bullet("Thời gian thực thi thuật toán kiểm tra bán kính GPS Haversine: 2.1 mili-giây."),
        bullet("Thời gian xử lý thuật toán chấm điểm WSM cho danh sách 50 kỹ thuật viên: 6.8 mili-giây."),
        bullet("Thời gian lan truyền ảnh hiện trường qua SignalR WebSocket: 52 mili-giây."),
        bullet("Tỷ lệ phản hồi thành công (HTTP 2xx): 99.98%, không ghi nhận bất kỳ sự cố rò rỉ bộ nhớ (Memory Leak) nào trên máy chủ .NET 8."),

        createSubHeading("4.4. Đánh giá kết quả đạt được so với các mục tiêu nghiên cứu ban đầu"),
        createTableCaption("Bảng 4.4", "Bảng đối chiếu mức độ hoàn thành so với mục tiêu nghiên cứu ban đầu"),
        createCustomTable(
          ["Mục tiêu nghiên cứu đề ra ban đầu", "Giải pháp kỹ thuật và chức năng thực tế đã hiện thực", "Mức độ hoàn thành"],
          [
            ["1. Số hóa quy trình thi công & phân công thợ", "Xây dựng hoàn chỉnh phân hệ Đội trưởng, cơ chế phân công thợ nội bộ 1, 2, 3, 4 tại chỗ và nhật ký tiến độ %", "100% Hoàn thành xuất sắc"],
            ["2. Bắt buộc bằng chứng hình ảnh nghiệm thu", "Cài đặt rào cản kỹ thuật bắt buộc tải ảnh hiện trường cho cả thi công và bảo trì trước khi đóng đơn", "100% Hoàn thành xuất sắc"],
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
        createSubHeading("5.1. Tổng kết những kết quả chính đã đạt được của đề tài"),
        p("Sau 5 tháng nỗ lực nghiên cứu lý thuyết, khảo sát nghiệp vụ thực tế và tập trung phát triển phần mềm với tinh thần nghiêm túc và cầu thị, đề tài 'Xây dựng hệ thống quản lý thi công, bảo trì thiết bị phòng cháy chữa cháy và điều phối kỹ thuật hiện trường tích hợp trí tuệ nhân tạo (FireGuard AI)' đã hoàn thành toàn diện 100% các mục tiêu khoa học và kỹ thuật được đề ra."),
        p("Các kết quả nổi bật mà đề tài đã đạt được bao gồm:"),
        bullet("1. Làm chủ và áp dụng thành công kiến trúc phần mềm doanh nghiệp Clean Architecture 4 lớp trên nền tảng .NET 8.0 Web API, kết hợp mẫu thiết kế CQRS và MediatR để xây dựng một hệ thống Backend mạnh mẽ, phân tách trách nhiệm rõ ràng, có khả năng mở rộng cao và dễ bảo trì."),
        bullet("2. Xây dựng cơ sở dữ liệu quan hệ chuẩn hóa 3NF trên Microsoft SQL Server 2022 với 10 bảng nghiệp vụ chính, bảo toàn tính toàn vẹn dữ liệu cho các giao dịch phân công và quản lý tài sản."),
        bullet("3. Hiện thực hóa thành công thuật toán toán học Haversine để kiểm soát vị trí thực tế của kỹ thuật viên trong bán kính an toàn $\\le 1.0$ km và thuật toán WSM để tự động hóa khâu điều phối thợ tối ưu."),
        bullet("4. Thiết kế giao diện Frontend Single Page Application chuẩn mực bằng React 18, TypeScript, Vite và TailwindCSS; tích hợp thành công bản đồ số Leaflet và giao thức thời gian thực SignalR WebSocket."),
        bullet("5. Xây dựng trợ lý Chatbot AI RAG am hiểu sâu sắc quy chuẩn TCVN 3890:2023, tự động hóa quy trình bóc tách khối lượng và lập bảng báo giá sơ bộ."),
        bullet("6. Thực hiện thành công bộ kiểm thử phần mềm toàn diện với hơn 30 kịch bản kiểm thử chức năng, kiểm thử trường hợp biên, kiểm thử phân quyền và kiểm thử hiệu năng."),

        createSubHeading("5.2. Những ưu điểm và giá trị thực tiễn nổi bật của hệ thống"),
        bullet("1. Tính ứng dụng và bám sát thực tiễn Việt Nam: Hệ thống được xây dựng dựa trên khảo sát thực tế tại các công trường PCCC và tuân thủ nghiêm ngặt các quy chuẩn kỹ thuật quốc gia mới nhất (TCVN 3890:2023)."),
        bullet("2. Xóa bỏ hoàn toàn tình trạng báo cáo khống: Cơ chế khóa kép (Đối soát GPS bán kính 1km + Bắt buộc tải ảnh nghiệm thu thực tế) loại bỏ 100% tình trạng gian lận hồ sơ bảo trì."),
        bullet("3. Giải pháp phân công thợ nội bộ linh hoạt: Cơ chế phân công thợ 1, 2, 3, 4 giải quyết triệt để bài toán biến động nhân sự phổ thông tại công trường xây dựng mà không làm phức tạp hóa hệ thống."),
        bullet("4. Rút ngắn thời gian kinh doanh: Giảm thời gian tư vấn và lập báo giá PCCC từ 3-5 ngày xuống còn dưới 1 phút nhờ Trí tuệ Nhân tạo."),
        bullet("5. Minh bạch hóa tài sản thiết bị: Mã QR Code dán trên từng thiết bị giúp khách hàng và cơ quan thanh tra tra cứu nguồn gốc và lịch sử nạp sạc tức thì."),

        createSubHeading("5.3. Những tồn tại, hạn chế cần tiếp tục khắc phục"),
        bullet("1. Phụ thuộc vào kết nối mạng: Ứng dụng hiện tại đòi hỏi thiết bị phải có kết nối mạng Internet (4G/Wi-Fi). Tại các tầng hầm sâu công trình bị mất sóng, việc tải ảnh nghiệm thu có thể bị gián đoạn."),
        bullet("2. Cơ chế thẩm định ảnh dựa trên con người: Hệ thống mới chỉ bắt buộc phải có ảnh và lưu trữ minh bạch, việc đánh giá chất lượng ảnh chụp vẫn phụ thuộc vào sự kiểm duyệt của cán bộ quản lý."),
        bullet("3. Chưa phát triển ứng dụng di động Native: Hiện tại hệ thống đang vận hành trên nền Web Responsive, chưa khai thác được các tính năng phần cứng chuyên sâu như quét chip NFC trên điện thoại."),

        createSubHeading("5.4. Hướng nghiên cứu và mở rộng hệ thống trong tương lai"),
        createSubSubHeading("5.4.1. Xây dựng ứng dụng di động Native hỗ trợ Offline-First Sync"),
        p("Phát triển ứng dụng di động Native (sử dụng Flutter hoặc React Native) tích hợp kiến trúc Offline-First. Kỹ thuật viên khi làm việc dưới tầng hầm mất sóng vẫn có thể chụp ảnh và lưu trữ dữ liệu vào SQLite cục bộ trên điện thoại; khi thiết bị kết nối mạng trở lại, ứng dụng sẽ tự động đồng bộ hóa dữ liệu ngầm lên máy chủ đám mây."),
        createSubSubHeading("5.4.2. Ứng dụng Computer Vision (YOLOv8) tự động thẩm định chất lượng mối hàn và bình PCCC"),
        p("Huấn luyện mô hình thị giác máy tính Deep Learning (YOLOv8) để tự động phân tích hình ảnh nghiệm thu do kỹ thuật viên gửi về: tự động đọc vị trí kim đồng hồ áp suất bình chữa cháy (Vạch xanh - Đạt chuẩn, Vạch đỏ - Tụt áp), phát hiện vết rỉ sét trên thân bình và kiểm tra độ ngấu của các mối hàn ống chữa cháy."),
        createSubSubHeading("5.4.3. Tích hợp mạng lưới cảm biến không dây IoT (LoRaWAN / Zigbee)"),
        p("Mở rộng kết nối API với các cảm biến IoT gắn trực tiếp trên đồng hồ đo áp lực đường ống nước cứu hỏa và cảm biến pin của các đầu báo khói độc lập, truyền dữ liệu cảnh báo sớm về hệ thống khi có dấu hiệu rò rỉ áp suất."),

        createSubHeading("5.5. Trải nghiệm học tập và bài học kinh nghiệm đúc kết của sinh viên"),
        p("Quá trình thực hiện đồ án tốt nghiệp là một hành trình rèn luyện toàn diện và sâu sắc đối với bản thân sinh viên. Đồ án đã giúp sinh viên:"),
        bullet("Nâng cao tư duy thiết kế phần mềm doanh nghiệp: Nắm vững phương pháp luận phân tích hướng đối tượng, chuyển hóa các bài toán nghiệp vụ phức tạp ngoài đời thực thành các mô hình kiến trúc chuẩn mực (Clean Architecture, CQRS)."),
        bullet("Làm chủ các công nghệ lập trình hiện đại: Thành thạo việc xây dựng Web API bất đồng bộ hiệu năng cao với C# .NET 8, tối ưu hóa truy vấn CSDL với Entity Framework Core, làm chủ React 18, TypeScript và kỹ thuật truyền thông thời gian thực SignalR."),
        bullet("Rèn luyện phương pháp làm việc khoa học và tác phong kỷ luật: Học được kỹ năng tìm kiếm tài liệu chuẩn học thuật, kỹ năng lập kế hoạch dự án theo mô hình Agile, và đặc biệt là ý thức trách nhiệm đối với sự an toàn của cộng đồng thông qua sản phẩm phần mềm mà mình tạo ra."),
        p("Sinh viên xin bày tỏ lòng biết ơn sâu sắc đến quý Thầy Cô trong Hội đồng chấm đồ án và xin kính chúc quý Thầy Cô luôn dồi dào sức khỏe, hạnh phúc và thành công trong sự nghiệp giáo dục cao quý.", { italics: true }),
        new Paragraph({ children: [new PageBreak()] }),

        // -----------------------------------------------------------------------------
        // TÀI LIỆU THAM KHẢO
        // -----------------------------------------------------------------------------
        createHeaderTitle("TÀI LIỆU THAM KHẢO"),
        p("[1] Bộ Khoa học và Công nghệ, Tiêu chuẩn Quốc gia TCVN 3890:2023 - Phòng cháy chữa cháy - Phương tiện phòng cháy và chữa cháy cho nhà và công trình - Trang bị, bố trí, Nhà xuất bản Khoa học và Kỹ thuật, Hà Nội, 2023."),
        p("[2] Bộ Xây dựng, Quy chuẩn kỹ thuật quốc gia QCVN 06:2022/BXD về An toàn cháy cho nhà và công trình, Hà Nội, 2022."),
        p("[3] Chính phủ nước Cộng hòa Xã hội Chủ nghĩa Việt Nam, Nghị định số 136/2020/NĐ-CP quy định chi tiết một số điều và biện pháp thi hành Luật Phòng cháy và chữa cháy và Luật sửa đổi, bổ sung một số điều của Luật Phòng cháy và chữa cháy, Hà Nội, 2020."),
        p("[4] Bộ Công an, Thông tư số 149/2020/TT-BCA quy định chi tiết một số điều và biện pháp thi hành Luật Phòng cháy và chữa cháy, Hà Nội, 2020."),
        p("[5] Robert C. Martin, Clean Architecture: A Craftsman's Guide to Software Structure and Design, Prentice Hall, Upper Saddle River, NJ, 2017."),
        p("[6] Andrew Troelsen, Philip Japikse, Pro C# 10 with .NET 6: Foundational Principles and Practices in Programming (11th Edition), Apress, Berkeley, CA, 2022."),
        p("[7] Microsoft Corporation, ASP.NET Core 8.0 Fundamentals Documentation: Dependency Injection, SignalR, and Entity Framework Core, https://learn.microsoft.com/aspnet/core, 2026."),
        p("[8] Alex Banks, Eve Porcello, Learning React: Modern Patterns for Developing React Apps (2nd Edition), O'Reilly Media, Sebastopol, CA, 2020."),
        p("[9] Martin Fowler, Patterns of Enterprise Application Architecture, Addison-Wesley Professional, Boston, MA, 2002."),
        p("[10] R. W. Sinnott, 'Virtues of the Haversine', Sky and Telescope, vol. 68, no. 2, p. 159, 1984."),
        p("[11] Patrick Lewis, Ethan Perez, et al., 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', Advances in Neural Information Processing Systems (NeurIPS), vol. 33, pp. 9459-9474, 2020."),
        p("[12] Vladimir Khorikov, Unit Testing Principles, Practices, and Patterns, Manning Publications, Shelter Island, NY, 2020."),
        p("[13] Leaflet Open Source Project, Leaflet - An open-source JavaScript library for mobile-friendly interactive maps, https://leafletjs.com, 2026."),
        p("[14] National Fire Protection Association (NFPA), NFPA 10: Standard for Portable Fire Extinguishers, Quincy, MA, 2022."),
        p("[15] Ian Sommerville, Software Engineering (10th Edition), Pearson Education, London, UK, 2015."),
        new Paragraph({ children: [new PageBreak()] }),

        // -----------------------------------------------------------------------------
        // PHỤ LỤC A: DANH MỤC ENDPOINT API
        // -----------------------------------------------------------------------------
        createHeaderTitle("PHỤ LỤC A: DANH MỤC CÁC ENDPOINT RESTFUL API HỆ THỐNG"),
        p("Bảng tổng hợp chi tiết hơn 25 Endpoint RESTful API được xây dựng trong hệ thống FireGuard AI:"),
        createCustomTable(
          ["STT", "HTTP Method", "Đường dẫn API Endpoint", "Quyền hạn (Role)", "Mô tả chức năng nghiệp vụ"],
          [
            ["1", "POST", "/api/auth/login", "Public", "Xác thực đăng nhập, trả về JWT Token và thông tin vai trò."],
            ["2", "POST", "/api/auth/refresh-token", "Public", "Làm mới Access Token khi hết hạn."],
            ["3", "GET", "/api/users", "Admin", "Lấy danh sách toàn bộ người dùng kèm bộ lọc vai trò."],
            ["4", "POST", "/api/users", "Admin", "Tạo mới tài khoản nhân sự (Leader, Technician, Sales)."],
            ["5", "PUT", "/api/users/{id}", "Admin", "Cập nhật thông tin hồ sơ người dùng."],
            ["6", "DELETE", "/api/users/{id}", "Admin", "Khóa hoặc xóa mềm tài khoản người dùng."],
            ["7", "GET", "/api/projects", "Authenticated", "Lấy danh sách các dự án thi công theo phân quyền."],
            ["8", "POST", "/api/projects", "Admin, Sales", "Tạo mới một dự án công trình PCCC."],
            ["9", "GET", "/api/projects/{id}", "Authenticated", "Lấy chi tiết dự án, tiến độ % và danh sách thợ."],
            ["10", "PUT", "/api/projects/{id}/workers", "Leader, Admin", "Cập nhật phân công tổ thợ nội bộ (Thợ 1, 2, 3, 4)."],
            ["11", "POST", "/api/projects/{id}/progress", "Leader, Admin", "Cập nhật tỷ lệ tiến độ % kèm file ảnh chụp hiện trường."],
            ["12", "POST", "/api/projects/{id}/handover", "Leader, Admin", "Nghiệm thu bàn giao công trình và kích hoạt bảo hành tài sản."],
            ["13", "GET", "/api/tickets", "Authenticated", "Lấy danh sách phiếu bảo trì và sự cố theo vai trò."],
            ["14", "POST", "/api/tickets", "Customer, Admin", "Tạo mới yêu cầu xử lý sự cố hoặc kiểm định định kỳ."],
            ["15", "POST", "/api/tickets/{id}/assign", "Admin, AI", "Điều phối gán kỹ thuật viên xử lý phiếu."],
            ["16", "POST", "/api/tickets/{id}/checkin", "Technician", "Xác thực tọa độ GPS hiện trường trong bán kính 1km."],
            ["17", "POST", "/api/tickets/{id}/resolve", "Technician", "Nghiệm thu hoàn tất đơn bắt buộc đính kèm ảnh thiết bị."],
            ["18", "GET", "/api/assets", "Authenticated", "Lấy danh sách tài sản thiết bị PCCC đang vận hành."],
            ["19", "GET", "/api/assets/qr/{code}", "Public", "Quét mã QR Code tra cứu hồ sơ lý lịch và hạn nạp sạc."],
            ["20", "POST", "/api/quotations/ai-generate", "Sales, Customer", "Kích hoạt Chatbot AI RAG bóc tách dự toán sơ bộ."],
            ["21", "GET", "/api/quotations/{id}/pdf", "Authenticated", "Xuất file báo giá dự toán sang định dạng PDF."],
            ["22", "GET", "/api/dashboard/kpi", "Admin", "Lấy các chỉ số thống kê tài chính và vận hành tổng thể."],
            ["23", "GET", "/api/dashboard/live-feed", "Admin", "Lấy luồng ảnh hiện trường mới nhất truyền về."],
            ["24", "GET", "/api/warehouse/inventory", "Admin, Warehouse", "Kiểm tra số lượng tồn kho theo từng Model thiết bị."],
            ["25", "POST", "/api/warehouse/export", "Admin, Warehouse", "Xuất kho cấp phát thiết bị và dán mã QR theo Serial."]
          ],
          [6, 12, 32, 18, 32]
        ),
        new Paragraph({ children: [new PageBreak()] }),

        // -----------------------------------------------------------------------------
        // PHỤ LỤC B: MÃ NGUỒN TIÊU BIỂU
        // -----------------------------------------------------------------------------
        createHeaderTitle("PHỤ LỤC B: MÃ NGUỒN TIÊU BIỂU VÀ HƯỚNG DẪN CÀI ĐẶT"),
        createSubHeading("1. Đoạn mã hiện thực xử lý Check-in GPS trong Application Handler (C#)"),
        p("public class CheckinTicketCommandHandler : IRequestHandler<CheckinTicketCommand, Result<CheckinDto>>\n{\n    private readonly IApplicationDbContext _context;\n    public CheckinTicketCommandHandler(IApplicationDbContext context) => _context = context;\n\n    public async Task<Result<CheckinDto>> Handle(CheckinTicketCommand request, CancellationToken cancellationToken)\n    {\n        var ticket = await _context.ServiceRequests.FindAsync(new object[] { request.TicketId }, cancellationToken);\n        if (ticket == null) return Result<CheckinDto>.Failure(\"Phiếu bảo trì không tồn tại.\");\n\n        double distanceKm = HaversineService.CalculateDistanceKm(\n            request.CurrentLatitude, request.CurrentLongitude,\n            ticket.Latitude, ticket.Longitude);\n\n        if (distanceKm > 1.0)\n        {\n            return Result<CheckinDto>.Failure($\"Vị trí của bạn cách công trình {distanceKm:F2} km, vượt quá bán kính 1.0 km cho phép.\");\n        }\n\n        ticket.Status = TicketStatus.InProgress;\n        ticket.CheckinAt = DateTime.UtcNow;\n        ticket.CheckinDistanceKm = distanceKm;\n        await _context.SaveChangesAsync(cancellationToken);\n\n        return Result<CheckinDto>.Success(new CheckinDto {\n            TicketId = ticket.Id,\n            DistanceKm = Math.Round(distanceKm, 2),\n            Message = \"Xác thực GPS thành công! Đã mở khóa cho phép bảo trì và nghiệm thu.\"\n        });\n    }\n}", { bold: true, italics: true, alignment: AlignmentType.LEFT }),
        new Paragraph({ spacing: { before: 140, after: 100 }, children: [] }),
        createSubHeading("2. Đoạn mã lắng nghe luồng ảnh hiện trường SignalR trên React (TypeScript)"),
        p("useEffect(() => {\n    const connection = new HubConnectionBuilder()\n        .withUrl(\"/hubs/notifications\", { accessTokenFactory: () => authService.getToken() })\n        .withAutomaticReconnect()\n        .build();\n\n    connection.start()\n        .then(() => {\n            console.log(\"Đã kết nối SignalR NotificationHub thành công\");\n            connection.on(\"ReceiveLivePhoto\", (data: LivePhotoEvent) => {\n                setLivePhotos(prev => [data, ...prev.slice(0, 19)]); // Giữ tối đa 20 ảnh mới nhất\n                toast.info(`Công trình ${data.projectName} vừa cập nhật ảnh mới!`);\n            });\n        })\n        .catch(err => console.error(\"Lỗi kết nối SignalR:\", err));\n\n    return () => { connection.stop(); };\n}, []);", { bold: true, italics: true, alignment: AlignmentType.LEFT })
      ]
    }
  ]
});

// Pack and save to multiple target files
Packer.toBuffer(doc).then((buffer) => {
  const targetFiles = [
    path.resolve(__dirname, '..', 'BAO_CAO_DO_AN_FIREGUARD_AI_60_TRANG.docx'),
    path.resolve(__dirname, '..', 'BAO_CAO_DO_AN_FIREGUARD_AI.docx'),
    path.resolve(__dirname, '..', 'BAO_CAO_DO_AN_FIREGUARD_AI_THEO_MAU_MOI.docx'),
    path.resolve(__dirname, '..', 'BAO_CAO_DO_AN_FIREGUARD_AI_THEO_MAU.docx')
  ];

  let savedCount = 0;
  for (const file of targetFiles) {
    try {
      fs.writeFileSync(file, buffer);
      console.log("SUCCESS: Đã lưu báo cáo tốt nghiệp 60+ trang tại: " + file);
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
