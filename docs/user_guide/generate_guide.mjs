import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun,
  AlignmentType, PageBreak, Table, TableRow, TableCell, WidthType,
  BorderStyle, ShadingType, Header, Footer, NumberFormat,
  PageNumberElement
} from 'docx';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS = path.join(import.meta.dirname, 'screenshots');

function img(filename, width = 600, height = 380) {
  const fp = path.join(SCREENSHOTS, filename);
  if (!fs.existsSync(fp)) return null;
  const data = fs.readFileSync(fp);
  return new ImageRun({ data, transformation: { width, height }, type: 'png' });
}

function h1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2563EB' } },
  });
}

function h2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
  });
}

function h3(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
  });
}

function body(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 24 })],
    spacing: { after: 120 },
  });
}

function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text: '• ' + text, size: 24 })],
    spacing: { after: 80 },
    indent: { left: 400 },
  });
}

function note(text) {
  return new Paragraph({
    children: [new TextRun({ text: '📌 Lưu ý: ' + text, size: 22, italics: true, color: '6B7280' })],
    spacing: { after: 120 },
    indent: { left: 400 },
  });
}

function imgParagraph(filename, w = 580, h = 360) {
  const image = img(filename, w, h);
  if (!image) return null;
  return new Paragraph({
    children: [image],
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 200 },
  });
}

function caption(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, italics: true, color: '6B7280' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function infoBox(title, lines) {
  const rows = [
    new TableRow({
      children: [new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: title, bold: true, size: 24, color: '1D4ED8' })],
        })],
        shading: { type: ShadingType.CLEAR, fill: 'DBEAFE' },
        columnSpan: 2,
      })],
    }),
    ...lines.map(([k, v]) => new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 22 })] })],
          shading: { type: ShadingType.CLEAR, fill: 'F0F9FF' },
          width: { size: 30, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: v, size: 22 })] })],
          width: { size: 70, type: WidthType.PERCENTAGE },
        }),
      ],
    })),
  ];
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: { top: 50, bottom: 50, left: 100, right: 100 },
  });
}

function credentialTable(rows) {
  const header = new TableRow({
    children: ['Tài khoản', 'Email', 'Mật khẩu', 'Vai trò'].map(t => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 22, color: 'FFFFFF' })] })],
      shading: { type: ShadingType.CLEAR, fill: '2563EB' },
    })),
    tableHeader: true,
  });
  const dataRows = rows.map((r, i) => new TableRow({
    children: r.map(v => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: v, size: 22 })] })],
      shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? 'F8FAFC' : 'FFFFFF' },
    })),
  }));
  return new Table({
    rows: [header, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: { top: 50, bottom: 50, left: 100, right: 100 },
  });
}

// --- Build document sections ---

function coverPage() {
  return [
    new Paragraph({ spacing: { before: 1000 } }),
    new Paragraph({
      children: [new TextRun({ text: 'MLS', size: 80, bold: true, color: '2563EB' })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Nền tảng học tiếng Việt', size: 40, color: '1E40AF' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '─────────────────────────────', size: 28, color: '93C5FD' })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: 'HƯỚNG DẪN SỬ DỤNG', size: 52, bold: true, color: '111827' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Phiên bản 1.0  |  Tháng 6/2026', size: 26, color: '6B7280' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    ...(imgParagraph('01_homepage.png', 580, 340) ? [imgParagraph('01_homepage.png', 580, 340)] : []),
    new Paragraph({ spacing: { before: 600 } }),
    new Paragraph({
      children: [new TextRun({ text: 'Tài liệu này hướng dẫn cách sử dụng đầy đủ các tính năng của hệ thống MLS,', size: 22, italics: true, color: '6B7280' })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: 'bao gồm: Học viên, Giáo viên và Quản trị viên.', size: 22, italics: true, color: '6B7280' })],
      alignment: AlignmentType.CENTER,
    }),
    pageBreak(),
  ];
}

function tableOfContents() {
  const entries = [
    ['1', 'Giới thiệu hệ thống', '3'],
    ['2', 'Tài khoản & Đăng nhập', '4'],
    ['3', 'Trang chủ', '5'],
    ['4', 'Khoá học', '6'],
    ['5', 'Sách', '9'],
    ['6', 'Thi online', '11'],
    ['7', 'Nhóm học tập', '13'],
    ['8', 'Hồ sơ cá nhân', '14'],
    ['9', 'Giỏ hàng & Thanh toán', '15'],
    ['10', 'Bảng điều khiển Giáo viên', '16'],
    ['11', 'Quản trị hệ thống (Admin)', '20'],
  ];

  return [
    h1('Mục lục'),
    ...entries.map(([n, title, page]) =>
      new Paragraph({
        children: [
          new TextRun({ text: `${n}.  ${title}`, size: 24 }),
          new TextRun({ text: `\t${page}`, size: 24 }),
        ],
        spacing: { after: 100 },
        tabStops: [{ type: 'right', position: 8700 }],
      })
    ),
    pageBreak(),
  ];
}

function section1_intro() {
  return [
    h1('1. Giới thiệu hệ thống'),
    body('MLS (Modern Language System) là nền tảng học tiếng Việt trực tuyến toàn diện, được thiết kế cho người học nước ngoài muốn học tiếng Việt theo lộ trình chuẩn CEFR (A1 → C2).'),
    h2('1.1 Tính năng nổi bật'),
    bullet('Lộ trình 6 cấp độ chuẩn CEFR (A1, A2, B1, B2, C1, C2)'),
    bullet('Hệ thống bài thi VSTEP & OPIC tích hợp'),
    bullet('AI chấm điểm Speaking & Writing tự động'),
    bullet('Hệ thống nhóm học tập & chat thời gian thực'),
    bullet('Thương mại sách trực tuyến (mua, giao hàng)'),
    bullet('Ứng dụng di động iOS & Android'),
    bullet('Hỗ trợ đa ngôn ngữ (Tiếng Việt & Tiếng Anh)'),
    h2('1.2 Yêu cầu hệ thống'),
    infoBox('Yêu cầu kỹ thuật', [
      ['Trình duyệt', 'Chrome 90+, Firefox 88+, Edge 90+, Safari 14+'],
      ['Kết nối', 'Internet tốc độ tối thiểu 5 Mbps để xem video'],
      ['Màn hình', 'Độ phân giải tối thiểu 1280×720'],
      ['Ứng dụng mobile', 'iOS 14+ / Android 8+'],
    ]),
    new Paragraph({ spacing: { after: 200 } }),
    pageBreak(),
  ];
}

function section2_login() {
  return [
    h1('2. Tài khoản & Đăng nhập'),
    h2('2.1 Đăng nhập hệ thống'),
    body('Truy cập địa chỉ website và nhấn nút "Đăng nhập" ở góc phải trên cùng.'),
    ...(imgParagraph('02_login_page.png') ? [imgParagraph('02_login_page.png'), caption('Hình 2.1 – Trang đăng nhập MLS')] : []),
    body('Nhập email và mật khẩu, sau đó nhấn nút "Đăng nhập".'),
    ...(imgParagraph('02b_login_filled.png') ? [imgParagraph('02b_login_filled.png'), caption('Hình 2.2 – Nhập thông tin đăng nhập')] : []),
    note('Hệ thống hỗ trợ đăng nhập bằng Google. Nhấn nút "Tiếp tục với Google" nếu bạn muốn dùng tài khoản Google.'),
    h2('2.2 Tài khoản demo'),
    credentialTable([
      ['Admin', 'admin01@gmail.com', '123@123aA', 'Quản trị viên'],
      ['Giáo viên', 'teacher01@gmail.com', '123@123aA', 'Giáo viên'],
      ['Học viên', 'student01@gmail.com', '123@123aA', 'Học viên'],
    ]),
    new Paragraph({ spacing: { after: 200 } }),
    h2('2.3 Đăng ký tài khoản mới'),
    body('Nhấn "Đăng ký" trên thanh điều hướng hoặc nhấn liên kết "Đăng ký miễn phí" ở trang đăng nhập.'),
    ...(imgParagraph('16_register.png') ? [imgParagraph('16_register.png'), caption('Hình 2.3 – Trang đăng ký tài khoản mới')] : []),
    bullet('Điền đầy đủ: Họ tên, Email, Mật khẩu (tối thiểu 8 ký tự)'),
    bullet('Nhấn "Đăng ký" để hoàn tất'),
    bullet('Kiểm tra email xác nhận và nhấn link kích hoạt tài khoản'),
    pageBreak(),
  ];
}

function section3_homepage() {
  return [
    h1('3. Trang chủ'),
    body('Sau khi đăng nhập, bạn sẽ được chuyển đến trang chủ với giao diện TikTok-style hiển thị các video bài học ngắn.'),
    ...(imgParagraph('04_homepage_loggedin.png') ? [imgParagraph('04_homepage_loggedin.png'), caption('Hình 3.1 – Trang chủ sau khi đăng nhập')] : []),
    h2('3.1 Các thành phần giao diện'),
    infoBox('Bố cục trang chủ', [
      ['Thanh điều hướng', 'Trang chủ, Khoá học, Sách, Thi online, Nhóm'],
      ['Sidebar trái', 'Bài học mới, Khoá đã kích hoạt, Nhóm của tôi, Đang theo dõi, Đã lưu, Đã thích'],
      ['Luồng chính', 'Video bài học theo dạng TikTok – cuộn để xem tiếp'],
      ['Sidebar phải', 'Danh sách Giáo viên & Khoá học nổi bật'],
      ['Hộp tin nhắn', 'Chat nhanh với bạn học và giáo viên'],
    ]),
    new Paragraph({ spacing: { after: 200 } }),
    h2('3.2 Tìm kiếm'),
    body('Sử dụng ô tìm kiếm ở thanh điều hướng để tìm khoá học theo tên, chủ đề hoặc giáo viên.'),
    pageBreak(),
  ];
}

function section4_courses() {
  return [
    h1('4. Khoá học'),
    h2('4.1 Danh sách khoá học'),
    body('Nhấn "Khoá học" trên thanh điều hướng để xem toàn bộ danh sách khoá học.'),
    ...(imgParagraph('05_courses_list.png') ? [imgParagraph('05_courses_list.png'), caption('Hình 4.1 – Danh sách tất cả khoá học')] : []),
    bullet('Lọc theo cấp độ: A1, A2, B1, B2, C1, C2'),
    bullet('Lọc theo chủ đề: Giao tiếp, Kinh doanh, Du lịch...'),
    bullet('Sắp xếp theo: Mới nhất, Phổ biến nhất, Giá'),
    bullet('Tìm kiếm theo tên khoá học hoặc giáo viên'),
    h2('4.2 Chi tiết khoá học'),
    body('Nhấn vào tên/ảnh khoá học để xem thông tin chi tiết.'),
    ...(imgParagraph('06_course_detail.png') ? [imgParagraph('06_course_detail.png'), caption('Hình 4.2 – Trang chi tiết khoá học')] : []),
    bullet('Xem mô tả, nội dung chương trình, giáo viên giảng dạy'),
    bullet('Xem đánh giá và nhận xét từ học viên khác'),
    bullet('Nhấn "Đăng ký học" để ghi danh (miễn phí hoặc có phí)'),
    ...(imgParagraph('06b_course_detail_scroll.png') ? [imgParagraph('06b_course_detail_scroll.png'), caption('Hình 4.3 – Nội dung khoá học (cuộn xuống)')] : []),
    h2('4.3 Khoá học của tôi'),
    body('Nhấn "Khoá đã kích hoạt" ở sidebar trái hoặc vào mục "Khoá học của tôi" từ menu hồ sơ.'),
    ...(imgParagraph('19_my_courses.png') ? [imgParagraph('19_my_courses.png'), caption('Hình 4.4 – Danh sách khoá học của tôi')] : []),
    bullet('Xem tiến độ học tập của từng khoá'),
    bullet('Tiếp tục bài học từ lần học trước'),
    bullet('Xem chứng chỉ khi hoàn thành'),
    h2('4.4 Bài học mới'),
    body('Xem các bài học vừa được cập nhật từ các khoá bạn đã đăng ký.'),
    ...(imgParagraph('23_my_lesson.png') ? [imgParagraph('23_my_lesson.png'), caption('Hình 4.5 – Bài học mới')] : []),
    pageBreak(),
  ];
}

function section5_books() {
  return [
    h1('5. Sách'),
    h2('5.1 Cửa hàng sách'),
    body('Nhấn "Sách" trên thanh điều hướng để vào cửa hàng sách tiếng Việt.'),
    ...(imgParagraph('07_books_list.png') ? [imgParagraph('07_books_list.png'), caption('Hình 5.1 – Cửa hàng sách MLS')] : []),
    bullet('Duyệt sách theo thể loại: Giáo trình, Luyện thi, Từ điển, Văn học'),
    bullet('Lọc theo cấp độ CEFR, giá, mới nhất'),
    bullet('Xem xếp hạng và đánh giá sách'),
    h2('5.2 Chi tiết sách'),
    ...(imgParagraph('07b_book_detail.png', 580, 320) ? [imgParagraph('07b_book_detail.png', 580, 320), caption('Hình 5.2 – Trang chi tiết sách')] : []),
    bullet('Xem mô tả, mục lục, thông tin tác giả'),
    bullet('Xem ảnh bìa và ảnh bên trong sách'),
    bullet('Nhấn "Thêm vào giỏ hàng" để mua'),
    bullet('Kiểm tra tình trạng kho hàng và thời gian giao hàng dự kiến'),
    note('Hệ thống hỗ trợ giao hàng qua ViettelPost toàn quốc. Nhập mã voucher để được giảm giá.'),
    pageBreak(),
  ];
}

function section6_quiz() {
  return [
    h1('6. Thi online'),
    h2('6.1 Danh sách bài thi'),
    body('Nhấn "Thi online" trên thanh điều hướng để xem danh sách bài thi.'),
    ...(imgParagraph('08_quiz_list.png') ? [imgParagraph('08_quiz_list.png'), caption('Hình 6.1 – Danh sách bài thi online')] : []),
    bullet('Lọc theo loại: Tổng quát, OPIC, VSTEP, Thi trực tiếp (Live)'),
    bullet('Xem thông tin: số câu, thời gian, số người đã thi'),
    bullet('Xem bảng xếp hạng (Leaderboard) hàng tuần/tháng/năm'),
    h2('6.2 Các loại bài thi'),
    infoBox('Phân loại bài thi', [
      ['Tổng quát', 'Bài kiểm tra ngữ pháp, từ vựng theo cấp độ CEFR'],
      ['OPIC', 'Oral Proficiency Interview by Computer – thi nói'],
      ['VSTEP', 'Vietnamese Standardized Test of English Proficiency'],
      ['Live Exam', 'Thi trực tiếp do giáo viên tổ chức theo thời gian thực'],
    ]),
    new Paragraph({ spacing: { after: 200 } }),
    h2('6.3 Kiểm tra xếp lớp'),
    body('Học viên mới có thể làm bài kiểm tra xếp lớp để xác định cấp độ phù hợp.'),
    ...(imgParagraph('17_placement_test.png', 580, 200) ? [imgParagraph('17_placement_test.png', 580, 200), caption('Hình 6.2 – Kiểm tra xếp lớp')] : []),
    bullet('Bài kiểm tra gồm các dạng: Nghe, Đọc, Ngữ pháp'),
    bullet('Kết quả được phân tích tự động và gợi ý cấp độ phù hợp'),
    bullet('Có thể làm lại sau 30 ngày'),
    pageBreak(),
  ];
}

function section7_groups() {
  return [
    h1('7. Nhóm học tập'),
    body('Tính năng Nhóm cho phép học viên tạo và tham gia các nhóm học, chat nhóm với giáo viên và bạn học.'),
    ...(imgParagraph('09_groups.png') ? [imgParagraph('09_groups.png'), caption('Hình 7.1 – Danh sách nhóm học tập')] : []),
    h2('7.1 Tham gia nhóm'),
    bullet('Tìm kiếm nhóm theo chủ đề, cấp độ hoặc giáo viên'),
    bullet('Nhấn "Tham gia" để gia nhập nhóm công khai'),
    bullet('Nhập mã mời nếu là nhóm riêng tư'),
    h2('7.2 Hoạt động trong nhóm'),
    bullet('Chat văn bản, gửi hình ảnh, file tài liệu'),
    bullet('Xem bài đăng và thông báo từ giáo viên'),
    bullet('Chia sẻ tiến độ học tập với nhóm'),
    bullet('Tham gia buổi học trực tiếp do giáo viên tổ chức'),
    pageBreak(),
  ];
}

function section8_profile() {
  return [
    h1('8. Hồ sơ cá nhân'),
    body('Nhấn vào tên/avatar của bạn ở góc phải trên cùng để vào trang hồ sơ cá nhân.'),
    h2('8.1 Thông tin cá nhân'),
    bullet('Cập nhật họ tên, ảnh đại diện, ngày sinh'),
    bullet('Thay đổi mật khẩu, email'),
    bullet('Chọn ngôn ngữ hiển thị (Tiếng Việt / English)'),
    h2('8.2 Tiến độ học tập'),
    bullet('Xem tổng số bài học đã hoàn thành'),
    bullet('Theo dõi điểm số và thứ hạng trên bảng xếp hạng'),
    bullet('Xem lịch sử bài thi đã làm'),
    bullet('Tải chứng chỉ hoàn thành khoá học'),
    pageBreak(),
  ];
}

function section9_cart() {
  return [
    h1('9. Giỏ hàng & Thanh toán'),
    body('Nhấn biểu tượng Giỏ hàng ở góc phải để quản lý đơn hàng sách.'),
    ...(imgParagraph('18_cart.png', 580, 260) ? [imgParagraph('18_cart.png', 580, 260), caption('Hình 9.1 – Giỏ hàng')] : []),
    h2('9.1 Thêm sách vào giỏ'),
    bullet('Tìm sách muốn mua ở trang Sách'),
    bullet('Nhấn "Thêm vào giỏ hàng"'),
    bullet('Chỉnh số lượng trong giỏ nếu cần'),
    h2('9.2 Thanh toán'),
    bullet('Nhấn "Tiến hành thanh toán"'),
    bullet('Nhập địa chỉ giao hàng đầy đủ'),
    bullet('Chọn phương thức thanh toán: Chuyển khoản, Ví điện tử, COD'),
    bullet('Nhập mã voucher giảm giá (nếu có)'),
    bullet('Xác nhận đơn hàng'),
    h2('9.3 Theo dõi đơn hàng'),
    bullet('Vào Hồ sơ → Đơn hàng để xem trạng thái'),
    bullet('Nhận thông báo khi đơn hàng được xử lý và giao hàng'),
    note('Giao hàng qua ViettelPost. Thời gian giao 2–5 ngày làm việc tùy khu vực.'),
    pageBreak(),
  ];
}

function section10_teacher() {
  return [
    h1('10. Bảng điều khiển Giáo viên'),
    body('Giáo viên đăng nhập và truy cập vào khu vực quản lý tại menu "Giáo viên" hoặc URL /teacher.'),
    ...(imgParagraph('20_teacher_dashboard.png') ? [imgParagraph('20_teacher_dashboard.png'), caption('Hình 10.1 – Bảng điều khiển giáo viên')] : []),
    h2('10.1 Quản lý khoá học'),
    bullet('Tạo khoá học mới: đặt tên, mô tả, cấp độ, giá'),
    bullet('Thêm chương trình học theo từng chương (Chapter)'),
    bullet('Upload video bài học, tài liệu PDF'),
    bullet('Quản lý học viên đăng ký'),
    bullet('Xem thống kê lượt xem, tiến độ học viên'),
    h2('10.2 Quản lý câu hỏi & Bài thi'),
    ...(imgParagraph('21_teacher_quizzes.png') ? [imgParagraph('21_teacher_quizzes.png'), caption('Hình 10.2 – Quản lý bài thi')] : []),
    bullet('Tạo bộ câu hỏi theo chuẩn VSTEP, OPIC hoặc tự do'),
    bullet('Tạo bài thi với thời gian giới hạn'),
    bullet('Xem kết quả và phân tích điểm số học viên'),
    h2('10.3 Ngân hàng câu hỏi'),
    ...(imgParagraph('22_teacher_questions.png') ? [imgParagraph('22_teacher_questions.png'), caption('Hình 10.3 – Ngân hàng câu hỏi')] : []),
    bullet('Tạo câu hỏi: Trắc nghiệm, Điền vào chỗ trống, Nghe'),
    bullet('Câu hỏi OPIC: Ghi âm câu trả lời, AI chấm điểm'),
    bullet('Câu hỏi VSTEP Writing: AI chấm điểm bài viết'),
    bullet('Phân loại theo kỹ năng: Nghe, Đọc, Nói, Viết, Ngữ pháp'),
    h2('10.4 Thi trực tiếp (Live Exam)'),
    bullet('Tạo phòng thi mới với mã tham gia'),
    bullet('Học viên tham gia bằng mã phòng'),
    bullet('Giáo viên điều khiển tiến độ thi theo thời gian thực'),
    bullet('Kết quả hiển thị ngay sau khi kết thúc'),
    h2('10.5 Nhóm chat'),
    bullet('Tạo nhóm học tập'),
    bullet('Quản lý thành viên nhóm'),
    bullet('Đăng thông báo, tài liệu cho nhóm'),
    bullet('Chat video/audio với học viên'),
    pageBreak(),
  ];
}

function section11_admin() {
  return [
    h1('11. Quản trị hệ thống (Admin)'),
    body('Quản trị viên đăng nhập và truy cập khu vực Admin tại URL /admin hoặc qua menu quản trị.'),
    ...(imgParagraph('03_admin_dashboard.png') ? [imgParagraph('03_admin_dashboard.png'), caption('Hình 11.1 – Bảng điều khiển Admin')] : []),
    h2('11.1 Dashboard Analytics'),
    bullet('Xem tổng quan doanh thu theo 7/30/90 ngày'),
    bullet('Biểu đồ doanh thu hàng ngày'),
    bullet('Top 10 sách bán chạy nhất'),
    bullet('Thống kê trạng thái đơn hàng'),
    bullet('Phân tích người dùng mới và hoạt động'),
    h2('11.2 Quản lý khoá học'),
    ...(imgParagraph('10_admin_courses.png', 580, 300) ? [imgParagraph('10_admin_courses.png', 580, 300), caption('Hình 11.2 – Quản lý khoá học')] : []),
    bullet('Duyệt và phê duyệt khoá học mới từ giáo viên'),
    bullet('Chỉnh sửa hoặc xóa khoá học'),
    bullet('Quản lý danh mục và thẻ khoá học'),
    h2('11.3 Quản lý sách'),
    ...(imgParagraph('11_admin_books.png', 580, 300) ? [imgParagraph('11_admin_books.png', 580, 300), caption('Hình 11.3 – Quản lý sách')] : []),
    bullet('Thêm, sửa, xóa sách trong danh mục'),
    bullet('Quản lý tồn kho, giá bán'),
    bullet('Upload ảnh bìa và nội dung sách'),
    h2('11.4 Quản lý đơn hàng'),
    ...(imgParagraph('12_admin_orders.png', 580, 300) ? [imgParagraph('12_admin_orders.png', 580, 300), caption('Hình 11.4 – Quản lý đơn hàng')] : []),
    bullet('Xem danh sách đơn hàng theo trạng thái'),
    bullet('Tìm kiếm theo mã đơn, email, tên khách'),
    bullet('Cập nhật trạng thái đơn hàng'),
    bullet('In phiếu giao hàng ViettelPost'),
    h2('11.5 Quản lý voucher'),
    ...(imgParagraph('13_admin_vouchers.png', 580, 300) ? [imgParagraph('13_admin_vouchers.png', 580, 300), caption('Hình 11.5 – Quản lý voucher')] : []),
    bullet('Tạo mã voucher giảm giá (theo %, theo số tiền cố định)'),
    bullet('Đặt giới hạn sử dụng và thời gian hết hạn'),
    bullet('Xem lịch sử sử dụng voucher'),
    h2('11.6 Quản lý người dùng'),
    ...(imgParagraph('14_admin_users.png', 580, 300) ? [imgParagraph('14_admin_users.png', 580, 300), caption('Hình 11.6 – Quản lý người dùng')] : []),
    bullet('Xem danh sách toàn bộ tài khoản'),
    bullet('Phân quyền: Học viên, Giáo viên, Admin, Content Manager'),
    bullet('Khóa/mở khóa tài khoản'),
    bullet('Reset mật khẩu người dùng'),
    pageBreak(),
  ];
}

function sectionFAQ() {
  return [
    h1('12. Câu hỏi thường gặp (FAQ)'),
    h3('❓ Tôi quên mật khẩu, làm sao lấy lại?'),
    body('Nhấn "Quên mật khẩu?" ở trang đăng nhập, nhập email và làm theo hướng dẫn trong email được gửi đến.'),
    h3('❓ Tôi có thể học trên điện thoại không?'),
    body('Có. Tải ứng dụng MLS từ App Store (iOS) hoặc Google Play (Android). Tất cả dữ liệu đồng bộ với tài khoản.'),
    h3('❓ Khoá học có hết hạn không?'),
    body('Khoá học sau khi đăng ký sẽ không có hạn. Bạn có thể học lại bất cứ lúc nào.'),
    h3('❓ Voucher có thể dùng cho tất cả sản phẩm không?'),
    body('Tùy thuộc vào điều kiện áp dụng của từng voucher. Đọc kỹ điều kiện trước khi sử dụng.'),
    h3('❓ Tôi muốn trở thành giáo viên trên MLS?'),
    body('Đăng ký tài khoản Giáo viên bằng cách liên hệ support@mls.edu.vn hoặc nhấn "Dạy trên MLS" ở trang chủ.'),
    h3('❓ Chứng chỉ MLS có được công nhận không?'),
    body('Chứng chỉ MLS được cấp sau khi hoàn thành khoá học, có thể dùng như bằng chứng về quá trình học tập. Chứng chỉ VSTEP và OPIC được công nhận bởi Bộ Giáo dục & Đào tạo Việt Nam.'),
    pageBreak(),
  ];
}

// ---- Build full document ----

const children = [
  ...coverPage(),
  ...tableOfContents(),
  ...section1_intro(),
  ...section2_login(),
  ...section3_homepage(),
  ...section4_courses(),
  ...section5_books(),
  ...section6_quiz(),
  ...section7_groups(),
  ...section8_profile(),
  ...section9_cart(),
  ...section10_teacher(),
  ...section11_admin(),
  ...sectionFAQ(),
].filter(Boolean);

const doc = new Document({
  title: 'Hướng dẫn sử dụng MLS',
  description: 'Tài liệu hướng dẫn sử dụng hệ thống MLS - Nền tảng học tiếng Việt',
  creator: 'MLS Team',
  styles: {
    default: {
      heading1: {
        run: { size: 36, bold: true, color: '1D4ED8', font: 'Calibri' },
        paragraph: { spacing: { before: 400, after: 200 } },
      },
      heading2: {
        run: { size: 28, bold: true, color: '1E40AF', font: 'Calibri' },
        paragraph: { spacing: { before: 280, after: 140 } },
      },
      heading3: {
        run: { size: 24, bold: true, color: '374151', font: 'Calibri' },
        paragraph: { spacing: { before: 200, after: 100 } },
      },
      document: {
        run: { size: 24, font: 'Calibri' },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, right: 1080, bottom: 1440, left: 1080 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [new TextRun({ text: 'MLS – Hướng dẫn sử dụng', size: 18, color: '9CA3AF' })],
          alignment: AlignmentType.RIGHT,
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [
            new TextRun({ text: '© 2026 MLS Platform  |  Trang ', size: 18, color: '9CA3AF' }),
            new PageNumberElement(NumberFormat.DECIMAL),
          ],
          alignment: AlignmentType.CENTER,
        })],
      }),
    },
    children,
  }],
});

const buffer = await Packer.toBuffer(doc);
const outputPath = 'D:/HiepPD/MLS/docs/User_Guide_MLS_v2.docx';
fs.writeFileSync(outputPath, buffer);

console.log(`✅ User Guide created: ${outputPath}`);
console.log(`   File size: ${(buffer.length / 1024).toFixed(1)} KB`);
