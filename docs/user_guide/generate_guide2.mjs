import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun,
  AlignmentType, PageBreak, Table, TableRow, TableCell, WidthType,
  ShadingType, Header, Footer, PageNumberElement, NumberFormat
} from 'docx';
import fs from 'fs';
import path from 'path';

const SS = path.join(import.meta.dirname, 'screenshots');

// ---- helpers ----

function imgPara(filename, w = 560, h = 340) {
  const fp = path.join(SS, filename);
  if (!fs.existsSync(fp)) return null;
  const data = fs.readFileSync(fp);
  return [
    new Paragraph({
      children: [new ImageRun({ data, transformation: { width: w, height: h }, type: 'png' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 80 },
    }),
  ];
}

function cap(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 18, italics: true, color: '6B7280' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 },
  });
}

function h1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160 } });
}
function h2(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } });
}
function h3(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 80 } });
}
function body(text) {
  return new Paragraph({ children: [new TextRun({ text, size: 24 })], spacing: { after: 100 } });
}
function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 24 })],
    bullet: { level: 0 },
    spacing: { after: 60 },
  });
}
function note(text) {
  return new Paragraph({
    children: [new TextRun({ text: '📌 ' + text, size: 22, italics: true, color: '6B7280' })],
    spacing: { after: 120 },
    indent: { left: 360 },
  });
}
function pb() {
  return new Paragraph({ children: [new PageBreak()] });
}
function sp(n = 120) {
  return new Paragraph({ children: [new TextRun('')], spacing: { after: n } });
}

// Info table (key-value)
function infoTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([k, v], i) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: i === 0 ? 'DBEAFE' : 'F0F9FF' },
            children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 22 })] })],
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: i === 0 ? 'DBEAFE' : 'FFFFFF' },
            children: [new Paragraph({ children: [new TextRun({ text: v, size: 22 })] })],
          }),
        ],
      })
    ),
  });
}

// Credential table
function credTable(dataRows) {
  const header = new TableRow({
    children: ['Loại tài khoản', 'Email', 'Mật khẩu', 'Vai trò'].map(t =>
      new TableCell({
        shading: { type: ShadingType.CLEAR, fill: '2563EB' },
        children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 22, color: 'FFFFFF' })] })],
      })
    ),
    tableHeader: true,
  });
  const rows = dataRows.map((r, i) =>
    new TableRow({
      children: r.map(v =>
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? 'F8FAFC' : 'FFFFFF' },
          children: [new Paragraph({ children: [new TextRun({ text: v, size: 22 })] })],
        })
      ),
    })
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...rows],
  });
}

// Flatten: filter nulls and flatten arrays
function flat(...items) {
  return items.flat(5).filter(Boolean);
}

// ---- Sections ----

function coverSection() {
  return flat(
    sp(800),
    new Paragraph({
      children: [new TextRun({ text: 'MLS', size: 96, bold: true, color: '2563EB' })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Nền tảng học tiếng Việt', size: 48, color: '1E40AF' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'HƯỚNG DẪN SỬ DỤNG', size: 56, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Phiên bản 1.0  |  Tháng 6/2026', size: 26, color: '6B7280' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    imgPara('01_homepage.png', 560, 320),
    sp(400),
    new Paragraph({
      children: [new TextRun({ text: 'Tài liệu hướng dẫn đầy đủ các tính năng: Học viên · Giáo viên · Quản trị viên', size: 22, italics: true, color: '6B7280' })],
      alignment: AlignmentType.CENTER,
    }),
    pb(),
  );
}

function tocSection() {
  const entries = [
    ['1', 'Giới thiệu hệ thống'],
    ['2', 'Tài khoản & Đăng nhập'],
    ['3', 'Trang chủ'],
    ['4', 'Khoá học'],
    ['5', 'Sách'],
    ['6', 'Thi online'],
    ['7', 'Nhóm học tập'],
    ['8', 'Hồ sơ cá nhân'],
    ['9', 'Giỏ hàng & Thanh toán'],
    ['10', 'Bảng điều khiển Giáo viên'],
    ['11', 'Quản trị hệ thống (Admin)'],
    ['12', 'Câu hỏi thường gặp'],
  ];
  return flat(
    h1('Mục lục'),
    entries.map(([n, t]) =>
      new Paragraph({
        children: [new TextRun({ text: `${n}.   ${t}`, size: 24 })],
        spacing: { after: 80 },
        indent: { left: 360 },
      })
    ),
    pb(),
  );
}

function s1() {
  return flat(
    h1('1. Giới thiệu hệ thống'),
    body('MLS (Modern Language System) là nền tảng học tiếng Việt trực tuyến toàn diện cho người nước ngoài, theo lộ trình chuẩn CEFR (A1 → C2).'),
    sp(),
    h2('1.1 Tính năng nổi bật'),
    bullet('Lộ trình 6 cấp độ chuẩn CEFR: A1, A2, B1, B2, C1, C2'),
    bullet('Hệ thống thi VSTEP & OPIC tích hợp AI chấm điểm'),
    bullet('AI chấm điểm Speaking & Writing tự động'),
    bullet('Nhóm học tập & chat thời gian thực'),
    bullet('Thương mại sách trực tuyến, giao hàng ViettelPost'),
    bullet('Ứng dụng di động iOS & Android'),
    bullet('Giao diện đa ngôn ngữ: Tiếng Việt & English'),
    sp(),
    h2('1.2 Yêu cầu hệ thống'),
    infoTable([
      ['Yêu cầu', 'Chi tiết'],
      ['Trình duyệt', 'Chrome 90+, Firefox 88+, Edge 90+, Safari 14+'],
      ['Kết nối mạng', 'Tối thiểu 5 Mbps để xem video'],
      ['Màn hình', 'Độ phân giải tối thiểu 1280 × 720'],
      ['Mobile', 'iOS 14+ / Android 8+'],
    ]),
    pb(),
  );
}

function s2() {
  return flat(
    h1('2. Tài khoản & Đăng nhập'),
    h2('2.1 Đăng nhập'),
    body('Truy cập website, nhấn "Đăng nhập" ở góc phải trên. Nhập email và mật khẩu rồi nhấn "Đăng nhập".'),
    imgPara('02_login_page.png'), cap('Hình 2.1 – Trang đăng nhập'),
    imgPara('02b_login_filled.png'), cap('Hình 2.2 – Nhập thông tin đăng nhập'),
    note('Hỗ trợ đăng nhập bằng Google. Nhấn "Tiếp tục với Google" để sử dụng tài khoản Google.'),
    sp(),
    h2('2.2 Tài khoản demo'),
    credTable([
      ['Admin', 'admin01@gmail.com', '123@123aA', 'Quản trị viên'],
      ['Giáo viên', 'teacher01@gmail.com', '123@123aA', 'Giáo viên'],
      ['Học viên', 'student01@gmail.com', '123@123aA', 'Học viên'],
    ]),
    sp(),
    h2('2.3 Đăng ký tài khoản mới'),
    body('Nhấn "Đăng ký" trên thanh điều hướng để tạo tài khoản mới.'),
    imgPara('16_register.png'), cap('Hình 2.3 – Trang đăng ký'),
    bullet('Điền đầy đủ: Họ tên, Email, Mật khẩu (tối thiểu 8 ký tự)'),
    bullet('Nhấn "Đăng ký" để hoàn tất'),
    bullet('Kiểm tra email và nhấn link kích hoạt tài khoản'),
    pb(),
  );
}

function s3() {
  return flat(
    h1('3. Trang chủ'),
    body('Sau khi đăng nhập, trang chủ hiển thị luồng video bài học theo dạng TikTok — cuộn để khám phá nội dung.'),
    imgPara('04_homepage_loggedin.png'), cap('Hình 3.1 – Trang chủ (đã đăng nhập)'),
    h2('3.1 Bố cục giao diện'),
    infoTable([
      ['Thành phần', 'Mô tả'],
      ['Thanh điều hướng', 'Trang chủ, Khoá học, Sách, Thi online, Nhóm'],
      ['Sidebar trái', 'Bài học mới, Khoá đã kích hoạt, Nhóm, Đang theo dõi, Đã lưu, Đã thích'],
      ['Luồng video chính', 'Video bài học TikTok-style, cuộn để xem thêm'],
      ['Sidebar phải', 'Danh sách Giáo viên & Khoá học nổi bật'],
      ['Hộp tin nhắn', 'Chat nhanh với bạn học và giáo viên'],
    ]),
    sp(),
    h2('3.2 Tìm kiếm'),
    body('Dùng ô tìm kiếm trên thanh điều hướng để tìm khoá học theo tên, chủ đề hoặc giáo viên.'),
    pb(),
  );
}

function s4() {
  return flat(
    h1('4. Khoá học'),
    h2('4.1 Danh sách khoá học'),
    body('Nhấn "Khoá học" trên thanh điều hướng để xem tất cả khoá học.'),
    imgPara('05_courses_list.png'), cap('Hình 4.1 – Danh sách khoá học'),
    bullet('Lọc theo cấp độ CEFR: A1, A2, B1, B2, C1, C2'),
    bullet('Lọc theo chủ đề: Giao tiếp, Kinh doanh, Du lịch...'),
    bullet('Sắp xếp: Mới nhất, Phổ biến, Giá'),
    sp(),
    h2('4.2 Chi tiết khoá học'),
    body('Nhấn vào tên/ảnh khoá học để xem thông tin chi tiết.'),
    imgPara('06_course_detail.png'), cap('Hình 4.2 – Chi tiết khoá học'),
    imgPara('06b_course_detail_scroll.png'), cap('Hình 4.3 – Nội dung chương trình học'),
    bullet('Xem mô tả, chương trình, giáo viên giảng dạy'),
    bullet('Đọc đánh giá từ học viên'),
    bullet('Nhấn "Đăng ký học" để ghi danh'),
    sp(),
    h2('4.3 Khoá học của tôi'),
    imgPara('19_my_courses.png'), cap('Hình 4.4 – Khoá học đã đăng ký'),
    bullet('Xem tiến độ học từng khoá'),
    bullet('Tiếp tục bài học còn dở'),
    bullet('Tải chứng chỉ khi hoàn thành'),
    sp(),
    h2('4.4 Bài học mới'),
    imgPara('23_my_lesson.png'), cap('Hình 4.5 – Bài học vừa cập nhật'),
    pb(),
  );
}

function s5() {
  return flat(
    h1('5. Sách'),
    h2('5.1 Cửa hàng sách'),
    body('Nhấn "Sách" trên thanh điều hướng để vào cửa hàng sách tiếng Việt.'),
    imgPara('07_books_list.png'), cap('Hình 5.1 – Cửa hàng sách'),
    bullet('Duyệt theo thể loại: Giáo trình, Luyện thi, Từ điển, Văn học'),
    bullet('Lọc theo cấp độ CEFR, giá, mới nhất'),
    bullet('Xem xếp hạng và đánh giá sách'),
    sp(),
    h2('5.2 Chi tiết sách'),
    imgPara('07b_book_detail.png', 560, 300), cap('Hình 5.2 – Chi tiết sách'),
    bullet('Mô tả, mục lục, thông tin tác giả'),
    bullet('Ảnh bìa và xem trước nội dung'),
    bullet('Nhấn "Thêm vào giỏ hàng" để mua'),
    note('Giao hàng qua ViettelPost toàn quốc. Nhập mã voucher để được giảm giá.'),
    pb(),
  );
}

function s6() {
  return flat(
    h1('6. Thi online'),
    h2('6.1 Danh sách bài thi'),
    body('Nhấn "Thi online" để xem danh sách các bài kiểm tra.'),
    imgPara('08_quiz_list.png'), cap('Hình 6.1 – Danh sách bài thi'),
    bullet('Lọc theo loại: Tổng quát, OPIC, VSTEP, Live Exam'),
    bullet('Xem thông tin: số câu, thời gian, số lượt thi'),
    bullet('Bảng xếp hạng (Leaderboard) hàng tuần/tháng/năm'),
    sp(),
    h2('6.2 Phân loại bài thi'),
    infoTable([
      ['Loại', 'Mô tả'],
      ['Tổng quát', 'Kiểm tra ngữ pháp, từ vựng theo cấp độ CEFR'],
      ['OPIC', 'Oral Proficiency Interview — thi nói, AI chấm điểm'],
      ['VSTEP', 'Bộ đề chuẩn Bộ GD&ĐT — 4 kỹ năng Nghe/Đọc/Nói/Viết'],
      ['Live Exam', 'Thi trực tiếp do giáo viên tổ chức theo thời gian thực'],
    ]),
    sp(),
    h2('6.3 Kiểm tra xếp lớp'),
    body('Bài kiểm tra dành cho học viên mới để xác định cấp độ CEFR phù hợp.'),
    imgPara('17_placement_test.png', 560, 200), cap('Hình 6.2 – Kiểm tra xếp lớp'),
    bullet('Bài gồm: Nghe, Đọc, Ngữ pháp'),
    bullet('Kết quả tự động phân tích và gợi ý cấp độ'),
    bullet('Có thể làm lại sau 30 ngày'),
    pb(),
  );
}

function s7() {
  return flat(
    h1('7. Nhóm học tập'),
    body('Tính năng Nhóm cho phép học viên tham gia nhóm học, chat với giáo viên và bạn học.'),
    imgPara('09_groups.png'), cap('Hình 7.1 – Danh sách nhóm'),
    h2('7.1 Tham gia nhóm'),
    bullet('Tìm nhóm theo chủ đề, cấp độ hoặc giáo viên'),
    bullet('Nhấn "Tham gia" với nhóm công khai'),
    bullet('Nhập mã mời với nhóm riêng tư'),
    sp(),
    h2('7.2 Hoạt động trong nhóm'),
    bullet('Chat văn bản, gửi hình ảnh, file tài liệu'),
    bullet('Xem bài đăng và thông báo từ giáo viên'),
    bullet('Chia sẻ tiến độ học với cả nhóm'),
    bullet('Tham gia buổi học/thi trực tiếp'),
    pb(),
  );
}

function s8() {
  return flat(
    h1('8. Hồ sơ cá nhân'),
    body('Nhấn vào tên/avatar góc phải trên để vào trang hồ sơ.'),
    h2('8.1 Thông tin cá nhân'),
    bullet('Cập nhật họ tên, ảnh đại diện, ngày sinh'),
    bullet('Thay đổi mật khẩu, email'),
    bullet('Chọn ngôn ngữ hiển thị (Tiếng Việt / English)'),
    sp(),
    h2('8.2 Tiến độ học tập'),
    bullet('Tổng số bài học đã hoàn thành'),
    bullet('Điểm số và thứ hạng bảng xếp hạng'),
    bullet('Lịch sử bài thi đã làm'),
    bullet('Tải chứng chỉ hoàn thành khoá học'),
    pb(),
  );
}

function s9() {
  return flat(
    h1('9. Giỏ hàng & Thanh toán'),
    body('Nhấn biểu tượng Giỏ hàng ở góc phải thanh điều hướng.'),
    imgPara('18_cart.png', 560, 260), cap('Hình 9.1 – Giỏ hàng'),
    h2('9.1 Thêm vào giỏ'),
    bullet('Tìm sách muốn mua → nhấn "Thêm vào giỏ hàng"'),
    bullet('Chỉnh số lượng trong giỏ'),
    sp(),
    h2('9.2 Thanh toán'),
    bullet('Nhấn "Tiến hành thanh toán"'),
    bullet('Nhập địa chỉ giao hàng đầy đủ'),
    bullet('Chọn phương thức: Chuyển khoản, Ví điện tử, COD'),
    bullet('Nhập mã voucher giảm giá (nếu có)'),
    bullet('Xác nhận và chờ xử lý đơn hàng'),
    sp(),
    h2('9.3 Theo dõi đơn hàng'),
    bullet('Vào Hồ sơ → Đơn hàng để xem trạng thái'),
    bullet('Nhận thông báo khi đơn được xử lý và giao'),
    note('Giao hàng qua ViettelPost. Thời gian giao 2–5 ngày làm việc tùy khu vực.'),
    pb(),
  );
}

function s10() {
  return flat(
    h1('10. Bảng điều khiển Giáo viên'),
    body('Đăng nhập bằng tài khoản Giáo viên, truy cập URL /teacher hoặc menu "Giáo viên".'),
    imgPara('20_teacher_dashboard.png'), cap('Hình 10.1 – Bảng điều khiển Giáo viên'),
    h2('10.1 Quản lý khoá học'),
    bullet('Tạo khoá học: đặt tên, mô tả, cấp độ, giá'),
    bullet('Thêm chương và bài học theo từng chapter'),
    bullet('Upload video bài giảng, tài liệu PDF'),
    bullet('Quản lý học viên đã đăng ký'),
    bullet('Xem thống kê lượt xem và tiến độ'),
    sp(),
    h2('10.2 Quản lý bài thi'),
    imgPara('21_teacher_quizzes.png'), cap('Hình 10.2 – Quản lý bài thi'),
    bullet('Tạo bài thi theo chuẩn VSTEP, OPIC hoặc tự do'),
    bullet('Đặt thời gian, số câu, cấp độ'),
    bullet('Xem kết quả và phân tích điểm học viên'),
    sp(),
    h2('10.3 Ngân hàng câu hỏi'),
    imgPara('22_teacher_questions.png'), cap('Hình 10.3 – Ngân hàng câu hỏi'),
    bullet('Trắc nghiệm, điền vào chỗ trống, nghe'),
    bullet('OPIC: Ghi âm câu trả lời, AI chấm điểm'),
    bullet('VSTEP Writing: AI chấm điểm bài viết'),
    bullet('Phân loại theo kỹ năng: Nghe, Đọc, Nói, Viết, Ngữ pháp'),
    sp(),
    h2('10.4 Thi trực tiếp (Live Exam)'),
    bullet('Tạo phòng thi → chia sẻ mã tham gia cho học viên'),
    bullet('Điều khiển tiến độ thi theo thời gian thực'),
    bullet('Kết quả hiển thị ngay sau khi kết thúc'),
    sp(),
    h2('10.5 Nhóm chat'),
    bullet('Tạo và quản lý nhóm học tập'),
    bullet('Đăng thông báo, chia sẻ tài liệu'),
    pb(),
  );
}

function s11() {
  return flat(
    h1('11. Quản trị hệ thống (Admin)'),
    body('Quản trị viên truy cập khu vực Admin tại URL /admin.'),
    imgPara('03_admin_dashboard.png'), cap('Hình 11.1 – Dashboard Admin'),
    h2('11.1 Analytics'),
    bullet('Tổng quan doanh thu 7/30/90 ngày'),
    bullet('Biểu đồ doanh thu hàng ngày'),
    bullet('Top 10 sách bán chạy nhất'),
    bullet('Thống kê trạng thái đơn hàng'),
    sp(),
    h2('11.2 Quản lý khoá học'),
    imgPara('10_admin_courses.png', 560, 280), cap('Hình 11.2 – Quản lý khoá học'),
    bullet('Duyệt và phê duyệt khoá học từ giáo viên'),
    bullet('Chỉnh sửa, xóa khoá học'),
    bullet('Quản lý danh mục và thẻ tag'),
    sp(),
    h2('11.3 Quản lý sách'),
    imgPara('11_admin_books.png', 560, 280), cap('Hình 11.3 – Quản lý sách'),
    bullet('Thêm, sửa, xóa sách'),
    bullet('Quản lý tồn kho và giá bán'),
    bullet('Upload ảnh bìa và nội dung'),
    sp(),
    h2('11.4 Quản lý đơn hàng'),
    imgPara('12_admin_orders.png', 560, 280), cap('Hình 11.4 – Quản lý đơn hàng'),
    bullet('Danh sách đơn hàng theo trạng thái'),
    bullet('Tìm kiếm theo mã đơn, email, tên khách'),
    bullet('Cập nhật trạng thái, in phiếu ViettelPost'),
    sp(),
    h2('11.5 Quản lý voucher'),
    imgPara('13_admin_vouchers.png', 560, 280), cap('Hình 11.5 – Quản lý voucher'),
    bullet('Tạo voucher giảm giá theo % hoặc số tiền cố định'),
    bullet('Đặt giới hạn sử dụng và thời hạn'),
    bullet('Xem lịch sử sử dụng'),
    sp(),
    h2('11.6 Quản lý người dùng'),
    imgPara('14_admin_users.png', 560, 280), cap('Hình 11.6 – Quản lý người dùng'),
    bullet('Xem toàn bộ tài khoản'),
    bullet('Phân quyền: Học viên, Giáo viên, Admin'),
    bullet('Khóa/mở khóa tài khoản, reset mật khẩu'),
    pb(),
  );
}

function s12() {
  return flat(
    h1('12. Câu hỏi thường gặp (FAQ)'),
    h3('Tôi quên mật khẩu, làm sao lấy lại?'),
    body('Nhấn "Quên mật khẩu?" ở trang đăng nhập, nhập email và làm theo hướng dẫn trong email được gửi đến hộp thư của bạn.'),
    sp(80),
    h3('Tôi có thể học trên điện thoại không?'),
    body('Có. Tải ứng dụng MLS từ App Store (iOS) hoặc Google Play (Android). Dữ liệu đồng bộ với tài khoản.'),
    sp(80),
    h3('Khoá học có hết hạn không?'),
    body('Không. Sau khi đăng ký, bạn có thể học lại bất cứ lúc nào mà không lo hết hạn.'),
    sp(80),
    h3('Voucher áp dụng cho sản phẩm nào?'),
    body('Tùy điều kiện từng voucher. Đọc kỹ điều kiện áp dụng trước khi sử dụng tại trang thanh toán.'),
    sp(80),
    h3('Tôi muốn trở thành giáo viên trên MLS?'),
    body('Liên hệ support@mls.edu.vn hoặc nhấn "Dạy trên MLS" ở trang chủ để đăng ký tài khoản Giáo viên.'),
    sp(80),
    h3('Chứng chỉ MLS có được công nhận không?'),
    body('Chứng chỉ MLS cấp sau khi hoàn thành khoá học. Chứng chỉ VSTEP và OPIC được Bộ Giáo dục & Đào tạo Việt Nam công nhận.'),
  );
}

// ---- Build document ----

const allChildren = flat(
  coverSection(),
  tocSection(),
  s1(), s2(), s3(), s4(), s5(), s6(),
  s7(), s8(), s9(), s10(), s11(), s12(),
);

const doc = new Document({
  sections: [{
    properties: {
      page: { margin: { top: 1440, right: 1080, bottom: 1440, left: 1080 } },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [new TextRun({ text: 'MLS – Hướng dẫn sử dụng  v1.0', size: 18, color: '9CA3AF' })],
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
    children: allChildren,
  }],
});

const buffer = await Packer.toBuffer(doc);
const out = 'D:/HiepPD/MLS/docs/User_Guide_MLS.docx';
fs.writeFileSync(out, buffer);
console.log(`✅ Created: ${out}`);
console.log(`   Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
