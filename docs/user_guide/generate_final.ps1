# =====================================================================
# Tạo User Guide MLS - Chuyên nghiệp, đầy đủ tiếng Việt có dấu
# Dùng Word COM Object để tạo file .docx 100% tương thích
# =====================================================================

param()
$ErrorActionPreference = "Continue"
$SS  = "D:\HiepPD\MLS\docs\user_guide\screenshots"
$OUT = "D:\HiepPD\MLS\docs\User_Guide_MLS.docx"

# ---- Khởi động Word ----
Write-Host "Khởi động Microsoft Word..."
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

$doc  = $word.Documents.Add()
$sel  = $word.Selection

# Thiết lập font mặc định
$doc.Content.Font.Name = "Times New Roman"
$doc.Content.Font.Size = 13

# ---- Hàm tiện ích ----

function H1([string]$text) {
    $sel.Style = $doc.Styles.Item("Heading 1")
    $sel.TypeText($text)
    $sel.TypeParagraph()
    $sel.Style = $doc.Styles.Item("Normal")
}

function H2([string]$text) {
    $sel.Style = $doc.Styles.Item("Heading 2")
    $sel.TypeText($text)
    $sel.TypeParagraph()
    $sel.Style = $doc.Styles.Item("Normal")
}

function H3([string]$text) {
    $sel.Style = $doc.Styles.Item("Heading 3")
    $sel.TypeText($text)
    $sel.TypeParagraph()
    $sel.Style = $doc.Styles.Item("Normal")
}

function Body([string]$text) {
    $sel.Style = $doc.Styles.Item("Normal")
    $sel.Font.Bold    = $false
    $sel.Font.Italic  = $false
    $sel.Font.Size    = 12
    $sel.Font.Name    = "Times New Roman"
    $sel.Font.Color   = 0x111827
    $sel.ParagraphFormat.Alignment     = 3  # Justify
    $sel.ParagraphFormat.SpaceAfter    = 6
    $sel.ParagraphFormat.SpaceBefore   = 0
    $sel.ParagraphFormat.FirstLineIndent = $word.CentimetersToPoints(1.0)
    $sel.TypeText($text)
    $sel.TypeParagraph()
    $sel.ParagraphFormat.FirstLineIndent = 0
}

function Body2([string]$text) {
    # Body không thụt đầu dòng - dùng trong danh sách, table, v.v.
    $sel.Style = $doc.Styles.Item("Normal")
    $sel.Font.Bold    = $false
    $sel.Font.Italic  = $false
    $sel.Font.Size    = 12
    $sel.Font.Name    = "Times New Roman"
    $sel.Font.Color   = 0x111827
    $sel.ParagraphFormat.Alignment     = 0
    $sel.ParagraphFormat.SpaceAfter    = 4
    $sel.ParagraphFormat.SpaceBefore   = 0
    $sel.ParagraphFormat.FirstLineIndent = 0
    $sel.TypeText($text)
    $sel.TypeParagraph()
}

function Bullet([string]$text) {
    $sel.Style = $doc.Styles.Item("List Bullet")
    $sel.Font.Size  = 12
    $sel.Font.Name  = "Times New Roman"
    $sel.Font.Bold  = $false
    $sel.Font.Color = 0x111827
    $sel.ParagraphFormat.SpaceAfter  = 3
    $sel.ParagraphFormat.SpaceBefore = 0
    $sel.TypeText($text)
    $sel.TypeParagraph()
    $sel.Style = $doc.Styles.Item("Normal")
}

function Note([string]$text) {
    $sel.Style = $doc.Styles.Item("Normal")
    $sel.Font.Italic  = $true
    $sel.Font.Size    = 11
    $sel.Font.Name    = "Times New Roman"
    $sel.Font.Color   = 0x1D4ED8
    $sel.ParagraphFormat.LeftIndent  = $word.CentimetersToPoints(0.5)
    $sel.ParagraphFormat.SpaceAfter  = 8
    $sel.ParagraphFormat.SpaceBefore = 4
    $sel.TypeText("   $text")
    $sel.TypeParagraph()
    $sel.Font.Italic = $false
    $sel.Font.Color  = 0x111827
    $sel.ParagraphFormat.LeftIndent  = 0
    $sel.ParagraphFormat.SpaceAfter  = 6
}

function Img([string]$fname, [double]$wCm, [double]$hCm, [string]$cap) {
    $fp = Join-Path $SS $fname
    if (-not (Test-Path $fp)) {
        Write-Warning "  Bỏ qua: $fname"
        return
    }
    # Căn giữa ảnh
    $sel.Style = $doc.Styles.Item("Normal")
    $sel.ParagraphFormat.Alignment = 1  # Center
    $sel.ParagraphFormat.SpaceBefore = 6
    $sel.ParagraphFormat.SpaceAfter  = 0
    try {
        $pic = $sel.InlineShapes.AddPicture($fp, $false, $true, $sel.Range)
        $pic.Width  = $word.CentimetersToPoints($wCm)
        $pic.Height = $word.CentimetersToPoints($hCm)
        $pic.Range.ParagraphFormat.Alignment = 1
    } catch {
        Write-Warning "  Lỗi chèn ảnh: $fname"
    }
    $sel.TypeParagraph()
    # Caption
    if ($cap -ne "") {
        $sel.ParagraphFormat.Alignment = 1
        $sel.Font.Italic  = $true
        $sel.Font.Size    = 10
        $sel.Font.Name    = "Times New Roman"
        $sel.Font.Color   = 0x6B7280
        $sel.ParagraphFormat.SpaceAfter = 12
        $sel.TypeText($cap)
        $sel.TypeParagraph()
        $sel.Font.Italic  = $false
        $sel.Font.Size    = 12
        $sel.Font.Color   = 0x111827
    }
    $sel.ParagraphFormat.Alignment = 0
    $sel.ParagraphFormat.SpaceBefore = 0
    $sel.ParagraphFormat.SpaceAfter  = 6
    Write-Host "    [OK] $fname"
}

function MakeTable([string[]]$headers, [string[][]]$rows) {
    $nCols = $headers.Count
    $nRows = $rows.Count + 1
    $range = $sel.Range
    $tbl   = $doc.Tables.Add($range, $nRows, $nCols)
    $tbl.Style = $doc.Styles.Item("Table Grid")

    # Style header
    for ($c = 1; $c -le $nCols; $c++) {
        $cell = $tbl.Cell(1, $c)
        $cell.Range.Text      = $headers[$c - 1]
        $cell.Range.Bold      = $true
        $cell.Range.Font.Size = 11
        $cell.Range.Font.Name = "Calibri"
        $cell.Range.Font.Color = -16777216 + 0xFFFFFF  # white
        $cell.Range.ParagraphFormat.Alignment = 1
        $cell.Shading.BackgroundPatternColor = -16777216 + 0x1E3A5F
    }

    # Data rows
    for ($r = 0; $r -lt $rows.Count; $r++) {
        $fillColor = if ($r % 2 -eq 0) { -16777216 + 0xEFF6FF } else { -16777216 + 0xFFFFFF }
        for ($c = 1; $c -le $nCols; $c++) {
            $cell = $tbl.Cell($r + 2, $c)
            $val  = if ($c - 1 -lt $rows[$r].Count) { $rows[$r][$c - 1] } else { "" }
            $cell.Range.Text      = $val
            $cell.Range.Font.Size = 11
            $cell.Range.Font.Name = "Calibri"
            $cell.Range.Bold      = $false
            $cell.Range.Font.Color = -16777216 + 0x111827
            $cell.Shading.BackgroundPatternColor = $fillColor
        }
    }

    # Auto fit
    $tbl.Columns.AutoFit()

    # Di chuyển con trỏ ra ngoài bảng
    $sel.MoveDown(5, $nRows + 1)
    $sel.TypeParagraph()
    $sel.Style = $doc.Styles.Item("Normal")
}

function PB() {
    $sel.InsertBreak(7)
}

function SP([int]$pt = 8) {
    $sel.Style = $doc.Styles.Item("Normal")
    $sel.Font.Size = $pt
    $sel.TypeParagraph()
    $sel.Font.Size = 12
}

# =====================================================================
# TRANG BÌA
# =====================================================================
Write-Host "`n=== TRANG BÌA ==="

# Tiêu đề lớn
$sel.Style = $doc.Styles.Item("Normal")
$sel.ParagraphFormat.Alignment   = 1
$sel.ParagraphFormat.SpaceBefore = 60
$sel.ParagraphFormat.SpaceAfter  = 0
$sel.Font.Name  = "Calibri"
$sel.Font.Size  = 60
$sel.Font.Bold  = $true
$sel.Font.Color = -16777216 + 0x1E3A5F
$sel.TypeText("MLS")
$sel.TypeParagraph()

$sel.Font.Size  = 22
$sel.Font.Bold  = $false
$sel.Font.Color = -16777216 + 0x2563EB
$sel.ParagraphFormat.SpaceAfter = 4
$sel.TypeText("Modern Language System")
$sel.TypeParagraph()

$sel.Font.Size  = 16
$sel.Font.Color = -16777216 + 0x374151
$sel.TypeText("Nền tảng học tiếng Việt trực tuyến")
$sel.TypeParagraph()

SP 20

$sel.Font.Name  = "Calibri"
$sel.Font.Size  = 36
$sel.Font.Bold  = $true
$sel.Font.Color = -16777216 + 0x111827
$sel.ParagraphFormat.SpaceAfter = 4
$sel.TypeText("HƯỚNG DẪN SỬ DỤNG")
$sel.TypeParagraph()

$sel.Font.Size  = 16
$sel.Font.Bold  = $false
$sel.Font.Color = -16777216 + 0x6B7280
$sel.TypeText("Phiên bản 1.0  ·  Tháng 6 năm 2026")
$sel.TypeParagraph()
SP 10

# Ảnh trang chủ
Img "01_homepage.png" 15.5 8.5 ""

SP 8
$sel.Font.Size  = 11
$sel.Font.Italic = $true
$sel.Font.Color = -16777216 + 0x6B7280
$sel.TypeText("Tài liệu này mô tả đầy đủ các tính năng của hệ thống MLS dành cho Học viên, Giáo viên và Quản trị viên.")
$sel.TypeParagraph()
$sel.Font.Italic = $false

$sel.ParagraphFormat.Alignment = 0
PB

# =====================================================================
# MỤC LỤC
# =====================================================================
Write-Host "`n=== MỤC LỤC ==="
H1 "MỤC LỤC"

$tocItems = @(
    "1.    Giới thiệu hệ thống MLS",
    "2.    Tài khoản người dùng — Đăng ký & Đăng nhập",
    "3.    Trang chủ",
    "4.    Khoá học — Tìm kiếm, Đăng ký & Học tập",
    "5.    Sách — Cửa hàng sách tiếng Việt",
    "6.    Thi online — VSTEP, OPIC & Kiểm tra xếp lớp",
    "7.    Nhóm học tập & Chat",
    "8.    Hồ sơ cá nhân & Tiến độ học tập",
    "9.    Giỏ hàng & Quy trình thanh toán",
    "10.  Cổng thông tin Giáo viên",
    "11.  Bảng quản trị Admin",
    "12.  Câu hỏi thường gặp (FAQ)",
    "13.  Thông tin liên hệ & Hỗ trợ"
)
foreach ($item in $tocItems) {
    $sel.Style = $doc.Styles.Item("Normal")
    $sel.Font.Size = 13
    $sel.Font.Name = "Times New Roman"
    $sel.ParagraphFormat.SpaceAfter = 5
    $sel.TypeText($item)
    $sel.TypeParagraph()
}
PB

# =====================================================================
# CHƯƠNG 1 — GIỚI THIỆU
# =====================================================================
Write-Host "`n=== Chương 1 ==="
H1 "1. Giới thiệu hệ thống MLS"

Body "MLS (Modern Language System) là nền tảng học tiếng Việt trực tuyến toàn diện, được thiết kế đặc biệt cho người nước ngoài muốn học và nâng cao trình độ tiếng Việt một cách bài bản. Hệ thống tuân theo khung năng lực ngôn ngữ quốc tế CEFR (Common European Framework of Reference for Languages) với 6 cấp độ từ A1 (Sơ cấp) đến C2 (Thành thạo)."

Body "Nền tảng tích hợp nhiều phương thức học tập hiện đại: học qua video ngắn theo định dạng TikTok, luyện tập qua hệ thống bài thi tương tác, mua và đọc sách giáo trình trực tuyến, giao tiếp trong nhóm học tập, và được AI chấm điểm kỹ năng nói và viết theo thời gian thực."

H2 "1.1 Tính năng nổi bật"
Bullet "Lộ trình học tập 6 cấp độ chuẩn CEFR: A1 → A2 → B1 → B2 → C1 → C2"
Bullet "Hệ thống thi VSTEP (Vietnamese Standardized Test of English Proficiency) và OPIC (Oral Proficiency Interview by Computer) được tích hợp sẵn trên nền tảng"
Bullet "Công nghệ AI tự động chấm điểm bài thi Speaking & Writing, trả kết quả ngay lập tức với nhận xét chi tiết"
Bullet "Giao diện video học tập theo định dạng TikTok — cuộn để xem bài học ngắn, trực quan, hấp dẫn"
Bullet "Hệ thống nhóm học tập với tính năng chat thời gian thực giữa học viên và giáo viên"
Bullet "Cửa hàng sách tiếng Việt trực tuyến với dịch vụ giao hàng toàn quốc qua ViettelPost"
Bullet "Ứng dụng di động đa nền tảng: iOS (App Store) và Android (Google Play)"
Bullet "Giao diện hỗ trợ đa ngôn ngữ: Tiếng Việt và Tiếng Anh"
Bullet "Hệ thống voucher, khuyến mãi và chương trình tích điểm cho học viên thân thiết"
Bullet "Chứng chỉ hoàn thành khoá học được cấp sau khi đạt điểm số yêu cầu"

H2 "1.2 Đối tượng sử dụng"
MakeTable @("Đối tượng", "Mô tả", "Quyền hạn") @(
    @("Học viên (Student)", "Người học tiếng Việt, đăng ký khoá học và thi online", "Học, thi, mua sách, chat nhóm"),
    @("Giáo viên (Teacher)", "Giảng viên tạo nội dung khoá học và quản lý bài thi", "Tạo khoá học, đề thi, quản lý học viên"),
    @("Quản trị viên (Admin)", "Nhân viên vận hành và quản lý toàn bộ hệ thống", "Toàn quyền quản lý hệ thống"),
    @("Content Manager", "Nhân viên biên tập nội dung học liệu", "Tạo và duyệt nội dung học")
)

H2 "1.3 Yêu cầu kỹ thuật"
MakeTable @("Thành phần", "Yêu cầu tối thiểu", "Khuyến nghị") @(
    @("Trình duyệt web", "Chrome 90+, Firefox 88+, Edge 90+, Safari 14+", "Chrome phiên bản mới nhất"),
    @("Kết nối Internet", "5 Mbps (xem video), 1 Mbps (text)", "20 Mbps trở lên"),
    @("Màn hình", "1280 × 720 pixels", "1920 × 1080 pixels"),
    @("Thiết bị mobile", "iOS 14+ / Android 8+", "iOS 16+ / Android 12+"),
    @("RAM (máy tính)", "4 GB", "8 GB trở lên")
)

PB

# =====================================================================
# CHƯƠNG 2 — ĐĂNG NHẬP / ĐĂNG KÝ
# =====================================================================
Write-Host "`n=== Chương 2 ==="
H1 "2. Tài khoản người dùng — Đăng ký & Đăng nhập"

Body "Để sử dụng đầy đủ các tính năng của MLS, người dùng cần có tài khoản trên hệ thống. Quá trình đăng ký hoàn toàn miễn phí và chỉ mất vài phút. Hệ thống hỗ trợ đăng nhập bằng email/mật khẩu hoặc tài khoản Google."

H2 "2.1 Giao diện trang đăng nhập"
Img "02_login_page.png" 15.5 10 "Hình 2.1 — Trang đăng nhập MLS với form nhập email/mật khẩu và tùy chọn đăng nhập Google"

Body "Trang đăng nhập được thiết kế với hai vùng chính: bên trái là thông tin giới thiệu nền tảng (lợi ích học tập, đánh giá từ học viên), bên phải là form đăng nhập. Bố cục này giúp người dùng mới hiểu nhanh về MLS trong khi nhập thông tin đăng nhập."

H2 "2.2 Hướng dẫn đăng nhập"
Body "Thực hiện theo các bước sau để đăng nhập vào hệ thống MLS:"
Bullet "Bước 1: Mở trình duyệt và truy cập địa chỉ website MLS"
Bullet "Bước 2: Nhấn nút 'Đăng nhập' ở góc phải trên cùng của trang chủ"
Bullet "Bước 3: Nhập địa chỉ Email đã đăng ký vào ô 'Email'"
Bullet "Bước 4: Nhập mật khẩu vào ô 'Mật khẩu' (mật khẩu được ẩn bằng dấu chấm)"
Bullet "Bước 5: Nhấn nút 'Đăng nhập' màu xanh để xác nhận"
Bullet "Bước 6: Nếu thành công, hệ thống tự động chuyển đến trang chủ hoặc trang Admin (nếu là quản trị viên)"

Img "02b_login_filled.png" 15.5 10 "Hình 2.2 — Form đăng nhập đã được điền thông tin, sẵn sàng nhấn nút 'Đăng nhập'"

Note "Lưu ý: Nếu quên mật khẩu, nhấn liên kết 'Quên mật khẩu?' ngay dưới ô nhập mật khẩu. Hệ thống sẽ gửi email hướng dẫn đặt lại mật khẩu về địa chỉ email đã đăng ký."

H2 "2.3 Đăng nhập bằng Google"
Body "MLS hỗ trợ đăng nhập nhanh bằng tài khoản Google. Tính năng này đặc biệt tiện lợi cho người dùng không muốn ghi nhớ thêm mật khẩu mới."
Bullet "Bước 1: Tại trang đăng nhập, nhấn nút 'Tiếp tục với Google'"
Bullet "Bước 2: Cửa sổ Google hiện ra — chọn tài khoản Google muốn sử dụng"
Bullet "Bước 3: Xác nhận cấp quyền cho MLS truy cập thông tin cơ bản"
Bullet "Bước 4: Hệ thống tự động tạo/đăng nhập tài khoản MLS liên kết với Google"

H2 "2.4 Đăng ký tài khoản mới"
Img "16_register.png" 15.5 10 "Hình 2.3 — Trang đăng ký tài khoản MLS dành cho người dùng mới"

Body "Nếu chưa có tài khoản, người dùng cần đăng ký trước khi đăng nhập. Nhấn liên kết 'Đăng ký miễn phí' trên trang đăng nhập hoặc nút 'Đăng ký' trên thanh điều hướng."
Bullet "Điền họ và tên đầy đủ (hiển thị trong hồ sơ và chứng chỉ)"
Bullet "Nhập địa chỉ email hợp lệ (dùng để đăng nhập và nhận thông báo)"
Bullet "Đặt mật khẩu mạnh: tối thiểu 8 ký tự, có chữ hoa, chữ thường và số"
Bullet "Xác nhận lại mật khẩu để tránh nhập sai"
Bullet "Nhấn 'Đăng ký' — hệ thống gửi email xác nhận đến địa chỉ email vừa nhập"
Bullet "Mở email và nhấn link kích hoạt để hoàn tất đăng ký (link có hiệu lực trong 24 giờ)"

H2 "2.5 Tài khoản demo cho thử nghiệm"
Body "Hệ thống cung cấp các tài khoản demo với đầy đủ dữ liệu thử nghiệm để trải nghiệm các tính năng:"
MakeTable @("Loại tài khoản", "Email đăng nhập", "Mật khẩu", "Vai trò & Quyền hạn") @(
    @("Quản trị viên", "admin01@gmail.com", "123@123aA", "Toàn quyền: Analytics, quản lý user/khoá học/sách/đơn hàng"),
    @("Giáo viên", "teacher01@gmail.com", "123@123aA", "Tạo khoá học, đề thi, ngân hàng câu hỏi, nhóm học tập"),
    @("Học viên", "student01@gmail.com", "123@123aA", "Học khoá học, thi online, mua sách, chat nhóm")
)
Note "Lưu ý bảo mật: Các tài khoản demo chỉ dùng cho mục đích thử nghiệm. Không lưu thông tin cá nhân hay thanh toán thật vào tài khoản demo."
PB

# =====================================================================
# CHƯƠNG 3 — TRANG CHỦ
# =====================================================================
Write-Host "`n=== Chương 3 ==="
H1 "3. Trang chủ"

Body "Trang chủ MLS là trung tâm điều hướng và khám phá nội dung của toàn bộ nền tảng. Sau khi đăng nhập thành công, người dùng sẽ được chuyển đến trang chủ với giao diện hiện đại, lấy cảm hứng từ TikTok — hiển thị luồng video bài học ngắn theo phong cách cuộn dọc."

Img "04_homepage_loggedin.png" 15.5 9 "Hình 3.1 — Trang chủ MLS sau khi đăng nhập với giao diện ba cột: sidebar trái, luồng video chính và sidebar phải"

H2 "3.1 Bố cục trang chủ"
Body "Trang chủ được chia thành 3 vùng chính:"
Bullet "Sidebar trái — Điều hướng nhanh đến các mục cá nhân: Bài học mới nhất, Khoá học đã kích hoạt, Nhóm của tôi, Người đang theo dõi, Bài đã lưu, Bài đã thích, Danh sách bạn bè"
Bullet "Khu vực trung tâm — Hiển thị luồng video bài học ngắn (TikTok-style). Người dùng cuộn lên/xuống để xem video tiếp theo. Mỗi video hiển thị tên bài học, giáo viên, số lượt xem và nút tương tác (Like, Lưu, Chia sẻ, Bình luận)"
Bullet "Sidebar phải — Thống kê nhanh (tin nhắn chưa đọc, thông báo), danh sách Giáo viên nổi bật, Khoá học được đề xuất dựa trên sở thích và lịch sử học"

H2 "3.2 Thanh điều hướng chính"
Body "Thanh điều hướng cố định ở trên cùng bao gồm:"
Bullet "Logo MLS — Nhấn để quay về trang chủ từ bất kỳ trang nào"
Bullet "Menu chính: Trang chủ | Khoá học | Sách | Thi online | Nhóm"
Bullet "Ô tìm kiếm toàn cục — Tìm khoá học, giáo viên, bài thi, sách"
Bullet "Biểu tượng Giỏ hàng — Hiển thị số lượng sách đang chờ thanh toán"
Bullet "Chuông thông báo — Nhận thông báo về bài học mới, kết quả thi, đơn hàng"
Bullet "Avatar người dùng — Truy cập nhanh hồ sơ, cài đặt, đăng xuất"
Bullet "Chọn ngôn ngữ — Chuyển đổi giữa Tiếng Việt (🇻🇳) và English (🇬🇧)"

H2 "3.3 Hộp tin nhắn"
Body "Hộp tin nhắn tích hợp ở sidebar cho phép chat nhanh mà không cần rời trang chủ. Người dùng có thể xem tất cả tin nhắn, lọc theo 'Tất cả' hoặc 'Chưa đọc', và tìm kiếm cuộc trò chuyện theo tên người hoặc nhóm."

H2 "3.4 Tìm kiếm toàn cục"
Body "Tính năng tìm kiếm cho phép tìm nhanh mọi nội dung trên nền tảng. Gõ từ khoá vào ô tìm kiếm trên thanh điều hướng — kết quả được phân loại theo Khoá học, Giáo viên, Sách và Bài thi để dễ dàng chọn lọc."
PB

# =====================================================================
# CHƯƠNG 4 — KHOÁ HỌC
# =====================================================================
Write-Host "`n=== Chương 4 ==="
H1 "4. Khoá học — Tìm kiếm, Đăng ký & Học tập"

Body "Khoá học là tính năng cốt lõi của MLS. Hệ thống hiện có hàng chục khoá học tiếng Việt được biên soạn bởi đội ngũ giáo viên chuyên nghiệp, bao phủ tất cả 6 cấp độ CEFR và nhiều chủ đề chuyên ngành khác nhau như Giao tiếp hàng ngày, Kinh doanh, Lịch sử văn hóa Việt Nam."

Img "05_courses_list.png" 15.5 10 "Hình 4.1 — Trang danh sách khoá học với hệ thống lọc theo cấp độ, giá, đánh giá và chủ đề"

H2 "4.1 Khám phá danh sách khoá học"
Body "Trang danh sách khoá học (/courses) hiển thị tất cả khoá học hiện có. Mỗi khoá học được trình bày dưới dạng thẻ (card) bao gồm ảnh bìa, tên khoá học, tên giáo viên, cấp độ CEFR, đánh giá sao, số học viên đã đăng ký và giá."
Bullet "Lọc theo cấp độ CEFR: A1 (Sơ cấp), A2 (Cơ bản), B1 (Trung cấp sơ), B2 (Trung cấp), C1 (Cao cấp), C2 (Thành thạo)"
Bullet "Lọc theo chủ đề: Giao tiếp, Kinh doanh & Thương mại, Du lịch, Văn hóa Việt Nam, Luyện thi VSTEP"
Bullet "Sắp xếp theo: Mới nhất, Phổ biến nhất, Đánh giá cao nhất, Giá thấp đến cao, Giá cao đến thấp"
Bullet "Lọc theo giá: Miễn phí, Có phí, Tất cả"

H2 "4.2 Xem chi tiết khoá học"
Img "06_course_detail.png" 15.5 10 "Hình 4.2 — Trang chi tiết khoá học với thông tin đầy đủ về nội dung, giáo viên và nút đăng ký học"

Body "Khi nhấn vào một khoá học, trang chi tiết hiển thị đầy đủ thông tin để người dùng đưa ra quyết định đăng ký:"
Bullet "Video giới thiệu khoá học — Xem trước nội dung và phong cách giảng dạy của giáo viên"
Bullet "Mô tả tổng quan — Mục tiêu học tập, đối tượng phù hợp, kiến thức cần có trước"
Bullet "Nội dung chương trình — Danh sách đầy đủ các chương và bài học (có thể xem preview một số bài miễn phí)"
Bullet "Thông tin giáo viên — Hồ sơ, kinh nghiệm, chứng chỉ giảng dạy, số học viên đã dạy"
Bullet "Đánh giá & Nhận xét — Điểm trung bình và các đánh giá chi tiết từ học viên đã học"
Bullet "Thông tin đăng ký — Giá khoá học, chính sách hoàn tiền, thời hạn truy cập"

Img "06b_course_detail_scroll.png" 15.5 9 "Hình 4.3 — Nội dung chi tiết chương trình học sau khi cuộn xuống, hiển thị từng chương và bài học"

H2 "4.3 Đăng ký khoá học"
Body "Sau khi xem xét và quyết định đăng ký, nhấn nút 'Đăng ký học ngay' hoặc 'Thêm vào giỏ hàng':"
Bullet "Khoá học miễn phí: Nhấn 'Đăng ký học miễn phí' → Bắt đầu học ngay lập tức"
Bullet "Khoá học có phí: Nhấn 'Thêm vào giỏ hàng' → Thanh toán → Nhận quyền truy cập vĩnh viễn"
Bullet "Sau đăng ký: Khoá học xuất hiện trong mục 'Khoá học của tôi' để tiếp tục học bất cứ lúc nào"

H2 "4.4 Khoá học của tôi"
Img "19_my_courses.png" 15.5 8 "Hình 4.4 — Trang 'Khoá học của tôi' hiển thị tất cả khoá học đã đăng ký cùng tiến độ học tập"

Body "Mục 'Khoá học của tôi' là nơi quản lý tập trung tất cả khoá học người dùng đã đăng ký. Tại đây hiển thị:"
Bullet "Thanh tiến độ học tập (%) cho từng khoá — biết ngay đã hoàn thành bao nhiêu phần trăm"
Bullet "Bài học tiếp theo được đề xuất dựa trên vị trí hiện tại trong khoá"
Bullet "Thời gian học gần nhất — giúp tiếp tục từ chỗ đã dừng"
Bullet "Chứng chỉ hoàn thành — Tải xuống PDF khi đạt 100% khoá học và vượt qua bài kiểm tra cuối"

H2 "4.5 Bài học mới được cập nhật"
Img "23_my_lesson.png" 15.5 8 "Hình 4.5 — Trang bài học mới nhất từ các khoá học đã đăng ký"

Body "Tính năng 'Bài học mới' (Sidebar trái → 'Bài học mới') tổng hợp tất cả bài học vừa được giáo viên cập nhật từ các khoá học người dùng đã đăng ký, sắp xếp theo thời gian — bài mới nhất ở trên cùng. Người dùng không bỏ lỡ bất kỳ nội dung học nào."
PB

# =====================================================================
# CHƯƠNG 5 — SÁCH
# =====================================================================
Write-Host "`n=== Chương 5 ==="
H1 "5. Sách — Cửa hàng sách tiếng Việt"

Body "MLS tích hợp một cửa hàng sách tiếng Việt trực tuyến đa dạng, cung cấp sách giáo trình, sách luyện thi, từ điển và tài liệu học tập chính thống. Sách được giao tận nhà qua dịch vụ ViettelPost trên toàn quốc."

Img "07_books_list.png" 15.5 10 "Hình 5.1 — Cửa hàng sách MLS với danh sách đa dạng, có tính năng lọc và tìm kiếm"

H2 "5.1 Khám phá danh mục sách"
Body "Trang cửa hàng sách (/sach) hiển thị toàn bộ đầu sách hiện có. Mỗi sách được trình bày với ảnh bìa rõ nét, tên sách, tác giả, giá bán, đánh giá sao và tình trạng kho."
Bullet "Duyệt theo thể loại: Sách giáo trình (theo cấp độ CEFR), Sách luyện thi VSTEP & OPIC, Từ điển Việt-Anh/Anh-Việt, Văn học & Truyện tiếng Việt, Sách doanh nhân"
Bullet "Lọc theo cấp độ CEFR phù hợp với trình độ hiện tại"
Bullet "Sắp xếp theo: Bán chạy nhất, Mới nhất, Đánh giá cao, Giá từ thấp đến cao"
Bullet "Xem đánh giá sao trung bình và số lượng đánh giá từ người đã mua"

H2 "5.2 Trang chi tiết sách"
Img "07b_book_detail.png" 15.5 9 "Hình 5.2 — Trang chi tiết sách với mô tả đầy đủ, thông tin tác giả, mục lục và nút thêm vào giỏ hàng"

Body "Trang chi tiết sách cung cấp đầy đủ thông tin trước khi quyết định mua:"
Bullet "Hình ảnh bìa sách chất lượng cao (có thể phóng to) và các hình ảnh bên trong sách"
Bullet "Mô tả chi tiết: nội dung, đối tượng độc giả, cấp độ phù hợp, số trang, nhà xuất bản"
Bullet "Mục lục (Table of Contents) — xem trước cấu trúc và nội dung các chương"
Bullet "Thông tin tác giả/biên soạn viên với hồ sơ chuyên môn"
Bullet "Đánh giá và nhận xét chi tiết từ người đọc đã mua sách"
Bullet "Tình trạng kho hàng: Còn hàng (số lượng), Sắp về hàng, Hết hàng"
Bullet "Nút 'Thêm vào giỏ hàng' — thêm sách vào giỏ để thanh toán sau"
Bullet "Nút 'Mua ngay' — chuyển thẳng đến trang thanh toán"
Bullet "Sách liên quan — gợi ý các đầu sách khác phù hợp với sở thích"

Note "Lưu ý: Hệ thống giao hàng qua ViettelPost đến tất cả 63 tỉnh thành trên toàn quốc. Thời gian giao hàng ước tính: Nội thành 1–2 ngày làm việc, Ngoại tỉnh 3–5 ngày làm việc. Phí vận chuyển tính theo khu vực và cân nặng."
PB

# =====================================================================
# CHƯƠNG 6 — THI ONLINE
# =====================================================================
Write-Host "`n=== Chương 6 ==="
H1 "6. Thi online — VSTEP, OPIC & Kiểm tra xếp lớp"

Body "Hệ thống thi online của MLS được thiết kế theo chuẩn quốc tế, hỗ trợ nhiều loại bài thi khác nhau từ kiểm tra ngữ pháp thông thường đến các kỳ thi được Bộ Giáo dục & Đào tạo Việt Nam công nhận như VSTEP và OPIC. Kết quả được tổng hợp vào bảng xếp hạng (Leaderboard) tạo động lực cạnh tranh lành mạnh."

Img "08_quiz_list.png" 15.5 8 "Hình 6.1 — Trang danh sách bài thi online với bộ lọc theo loại thi và bảng xếp hạng bên phải"

H2 "6.1 Các loại bài thi"
MakeTable @("Loại thi", "Mô tả", "Kỹ năng kiểm tra", "Chứng chỉ") @(
    @("Tổng quát", "Kiểm tra ngữ pháp, từ vựng và kỹ năng đọc hiểu theo từng cấp độ CEFR", "Đọc, Ngữ pháp, Từ vựng", "Không"),
    @("OPIC", "Oral Proficiency Interview by Computer — bài thi đánh giá kỹ năng nói. AI phân tích âm thanh và chấm điểm theo tiêu chí CEFR", "Kỹ năng Nói (Speaking)", "Có (OPIC Certificate)"),
    @("VSTEP", "Vietnamese Standardized Test — chuẩn hóa quốc gia, 4 kỹ năng đầy đủ theo khung CEFR B1–C1", "Nghe, Đọc, Viết, Nói", "Có (VSTEP Certificate)"),
    @("Live Exam", "Bài thi trực tiếp do giáo viên tổ chức theo thời gian thực. Học viên tham gia bằng mã phòng thi", "Tùy đề thi của GV", "Không")
)

H2 "6.2 Làm bài thi"
Body "Để bắt đầu làm một bài thi, người dùng thực hiện như sau:"
Bullet "Bước 1: Truy cập 'Thi online' từ thanh điều hướng"
Bullet "Bước 2: Chọn loại thi (Tổng quát / OPIC / VSTEP / Live) từ các tab lọc"
Bullet "Bước 3: Nhấn vào bài thi muốn làm để xem thông tin chi tiết: số câu, thời gian, độ khó, số người đã thi"
Bullet "Bước 4: Nhấn 'Bắt đầu thi' để vào phòng thi — đồng hồ đếm ngược bắt đầu chạy"
Bullet "Bước 5: Trả lời từng câu hỏi — có thể đánh dấu câu chưa chắc để xem lại"
Bullet "Bước 6: Nhấn 'Nộp bài' khi hoàn thành — kết quả hiển thị ngay lập tức với điểm số và đáp án đúng/sai"

H2 "6.3 Bảng xếp hạng (Leaderboard)"
Body "Bảng xếp hạng ở sidebar phải trang Thi online cập nhật liên tục, hiển thị Top 10 học viên có điểm tổng cao nhất. Người dùng có thể xem theo 3 kỳ: Tuần này, Tháng này và Cả năm. Đây là nguồn động lực học tập tích cực cho cộng đồng MLS."

H2 "6.4 Kiểm tra xếp lớp (Placement Test)"
Img "17_placement_test.png" 15.5 7 "Hình 6.2 — Trang kiểm tra xếp lớp dành cho học viên mới chưa biết trình độ của mình"

Body "Kiểm tra xếp lớp là công cụ đánh giá trình độ tiếng Việt hiện tại của người học, giúp xác định cấp độ CEFR phù hợp để bắt đầu học."
Bullet "Bài kiểm tra bao gồm 3 phần: Nghe hiểu (20 câu), Đọc hiểu (20 câu) và Ngữ pháp/Từ vựng (20 câu)"
Bullet "Thời gian làm bài: 45 phút — không giới hạn thử lại, nhưng chỉ tính kết quả lần làm gần nhất"
Bullet "Hệ thống AI phân tích kết quả và tự động xếp vào cấp độ phù hợp (A1 đến C2)"
Bullet "Kết quả đi kèm với lộ trình học tập đề xuất cụ thể: nên học khoá nào, ôn tập phần nào"
Bullet "Sau 30 ngày có thể làm lại để kiểm tra tiến bộ"
PB

# =====================================================================
# CHƯƠNG 7 — NHÓM HỌC TẬP
# =====================================================================
Write-Host "`n=== Chương 7 ==="
H1 "7. Nhóm học tập & Chat"

Body "Tính năng Nhóm học tập (Study Groups) của MLS tạo ra môi trường học cộng đồng — nơi học viên kết nối, hỗ trợ nhau và học cùng giáo viên theo nhóm nhỏ. Đây là tính năng được nhiều học viên MLS yêu thích vì tạo cảm giác học trong lớp học thật sự dù ở bất cứ đâu."

Img "09_groups.png" 15.5 8 "Hình 7.1 — Trang danh sách nhóm học tập với các nhóm công khai và riêng tư"

H2 "7.1 Tìm kiếm và tham gia nhóm"
Body "Trang Nhóm (/nhom) hiển thị danh sách các nhóm học tập đang hoạt động:"
Bullet "Nhóm công khai — Bất kỳ học viên nào cũng có thể tham gia bằng cách nhấn nút 'Tham gia'"
Bullet "Nhóm riêng tư — Chỉ tham gia bằng mã mời (invite code) do giáo viên/trưởng nhóm cung cấp"
Bullet "Tìm kiếm nhóm theo tên, chủ đề (Giao tiếp hàng ngày, Kinh doanh, Chuẩn bị VSTEP...) hoặc cấp độ"
Bullet "Xem thông tin nhóm: số thành viên, giáo viên phụ trách, mức độ hoạt động, ngôn ngữ sử dụng"

H2 "7.2 Hoạt động trong nhóm"
Body "Sau khi gia nhập nhóm, thành viên có thể thực hiện nhiều hoạt động học tập tương tác:"
Bullet "Chat văn bản thời gian thực — Gửi tin nhắn, hỏi đáp ngay trong nhóm"
Bullet "Chia sẻ file và hình ảnh — Tài liệu học tập, bài tập, ghi chú"
Bullet "Bài đăng (Posts) — Giáo viên đăng thông báo, bài tập, tài liệu cho cả nhóm"
Bullet "Tương tác: Like bài đăng, bình luận, tag thành viên"
Bullet "Chia sẻ tiến độ học tập — Báo cáo kết quả bài thi, khoá học vừa hoàn thành"
Bullet "Tham gia buổi học/ôn tập trực tiếp do giáo viên tổ chức trong nhóm"

H2 "7.3 Tạo nhóm mới (dành cho Giáo viên)"
Body "Giáo viên có quyền tạo nhóm học tập mới từ cổng Giáo viên. Khi tạo nhóm cần điền: Tên nhóm, Mô tả, Cấp độ phù hợp, Chủ đề, Loại nhóm (Công khai/Riêng tư) và số thành viên tối đa."
PB

# =====================================================================
# CHƯƠNG 8 — HỒ SƠ CÁ NHÂN
# =====================================================================
Write-Host "`n=== Chương 8 ==="
H1 "8. Hồ sơ cá nhân & Tiến độ học tập"

Body "Trang Hồ sơ cá nhân (/profile) là trung tâm quản lý thông tin, theo dõi tiến độ học tập và các hoạt động cá nhân của từng người dùng. Truy cập bằng cách nhấn vào avatar/tên ở góc phải trên thanh điều hướng."

H2 "8.1 Thông tin cá nhân"
Body "Người dùng có thể cập nhật các thông tin cá nhân sau:"
Bullet "Ảnh đại diện (avatar) — Tải lên ảnh mới hoặc chọn từ thư viện có sẵn"
Bullet "Họ và tên đầy đủ — Tên này xuất hiện trên chứng chỉ và trong các nhóm học"
Bullet "Ngày sinh — Dùng để cá nhân hóa nội dung học phù hợp với độ tuổi"
Bullet "Quốc tịch / Ngôn ngữ mẹ đẻ — Giúp AI điều chỉnh phương pháp dạy phù hợp"
Bullet "Mục tiêu học tập — Giao tiếp hàng ngày, Công việc, Du lịch, Luyện thi"
Bullet "Thay đổi mật khẩu — Cần nhập mật khẩu cũ để xác thực"
Bullet "Thay đổi email — Cần xác nhận qua email mới"

H2 "8.2 Thống kê học tập"
Body "Phần Tiến độ học tập hiển thị tổng quan về quá trình học của người dùng:"
Bullet "Tổng số giờ học tích lũy — Tính từ ngày đăng ký đến hiện tại"
Bullet "Số bài học đã hoàn thành — Theo từng khoá và tổng cộng"
Bullet "Điểm thi trung bình — Cập nhật sau mỗi bài thi"
Bullet "Chuỗi ngày học liên tiếp (Streak) — Khuyến khích duy trì thói quen học đều đặn"
Bullet "Thứ hạng trên Leaderboard — Xếp hạng so với học viên khác trong cùng tuần/tháng"
Bullet "Lịch sử các bài thi đã làm — Xem lại đáp án, điểm số, thời gian làm bài"
Bullet "Danh sách chứng chỉ — Tải xuống PDF chứng chỉ hoàn thành khoá học"

H2 "8.3 Cài đặt thông báo"
Body "Người dùng tùy chỉnh loại thông báo muốn nhận: Bài học mới từ khoá đã đăng ký, Kết quả bài thi, Tin nhắn nhóm, Thông báo đơn hàng, Khuyến mãi và Voucher."
PB

# =====================================================================
# CHƯƠNG 9 — GIỎ HÀNG & THANH TOÁN
# =====================================================================
Write-Host "`n=== Chương 9 ==="
H1 "9. Giỏ hàng & Quy trình thanh toán"

Body "Hệ thống mua sắm của MLS được thiết kế đơn giản, an toàn và hỗ trợ nhiều phương thức thanh toán phổ biến tại Việt Nam. Mọi giao dịch được mã hóa bảo mật theo tiêu chuẩn SSL."

Img "18_cart.png" 15.5 7 "Hình 9.1 — Trang giỏ hàng hiển thị danh sách sách đã chọn, số lượng, giá và ô nhập voucher"

H2 "9.1 Thêm sách vào giỏ hàng"
Bullet "Truy cập cửa hàng Sách (/sach) và tìm sách muốn mua"
Bullet "Nhấn 'Thêm vào giỏ hàng' — biểu tượng giỏ hàng trên thanh điều hướng cập nhật số lượng"
Bullet "Có thể thêm nhiều đầu sách khác nhau vào giỏ trước khi thanh toán một lần"
Bullet "Nhấn vào giỏ hàng để xem, điều chỉnh số lượng hoặc xóa sách không muốn mua"

H2 "9.2 Quy trình thanh toán từng bước"
Bullet "Bước 1: Vào Giỏ hàng, kiểm tra lại danh sách sách và số lượng"
Bullet "Bước 2: Nhập mã voucher giảm giá (nếu có) vào ô 'Mã giảm giá' và nhấn 'Áp dụng'"
Bullet "Bước 3: Nhấn 'Tiến hành thanh toán'"
Bullet "Bước 4: Nhập địa chỉ giao hàng đầy đủ: Tên người nhận, Số điện thoại, Địa chỉ chi tiết, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
Bullet "Bước 5: Chọn phương thức vận chuyển (Tiêu chuẩn / Nhanh) — xem thời gian giao dự kiến và phí vận chuyển"
Bullet "Bước 6: Chọn phương thức thanh toán: Chuyển khoản ngân hàng, Ví MoMo, ZaloPay, VNPay, Thanh toán khi nhận hàng (COD)"
Bullet "Bước 7: Kiểm tra lại toàn bộ thông tin đơn hàng và nhấn 'Đặt hàng' để xác nhận"
Bullet "Bước 8: Nhận email xác nhận đơn hàng với mã đơn hàng để theo dõi"

H2 "9.3 Theo dõi và quản lý đơn hàng"
Body "Tất cả đơn hàng được lưu trong mục Hồ sơ → Đơn hàng của tôi. Người dùng có thể:"
Bullet "Xem trạng thái đơn hàng: Chờ xử lý → Đã xác nhận → Đang đóng gói → Đã giao ViettelPost → Đang giao → Đã nhận"
Bullet "Theo dõi vận đơn ViettelPost bằng cách nhấn vào mã vận đơn"
Bullet "Yêu cầu đổi/trả hàng trong vòng 7 ngày kể từ ngày nhận (nếu sách lỗi, sai đơn)"
Bullet "Xem lịch sử tất cả đơn hàng theo tháng, năm"

Note "Lưu ý: Đơn hàng có thể bị hủy tự động nếu chưa thanh toán trong vòng 24 giờ (với hình thức chuyển khoản). Phí COD thu khi giao hàng. Hóa đơn VAT được xuất theo yêu cầu."
PB

# =====================================================================
# CHƯƠNG 10 — CỔNG GIÁO VIÊN
# =====================================================================
Write-Host "`n=== Chương 10 ==="
H1 "10. Cổng thông tin Giáo viên (Teacher Portal)"

Body "Giáo viên trên nền tảng MLS có quyền truy cập vào Cổng thông tin riêng biệt tại /teacher — nơi quản lý toàn bộ hoạt động giảng dạy từ tạo khoá học, soạn đề thi đến theo dõi tiến độ học viên và quản lý nhóm học tập."

Img "20_teacher_dashboard.png" 15.5 8 "Hình 10.1 — Cổng thông tin Giáo viên với menu đầy đủ: Khoá học, Bài thi, Ngân hàng câu hỏi, Nhóm và cấu hình OPIC/VSTEP"

H2 "10.1 Quản lý Khoá học"
Body "Giáo viên tạo và quản lý khoá học từ mục 'Khoá học của tôi' (My Courses) trong cổng Giáo viên:"
Bullet "Tạo khoá học mới: Điền tên khoá, mô tả chi tiết, đối tượng học viên, cấp độ CEFR, ngôn ngữ giảng dạy, ảnh bìa và giá"
Bullet "Xây dựng chương trình: Tạo cấu trúc theo Chương (Chapter) → Bài học (Lesson)"
Bullet "Upload nội dung bài học: Video bài giảng MP4, tài liệu PDF, bài tập đính kèm"
Bullet "Thiết lập bài kiểm tra cuối chương — Học viên phải đạt điểm yêu cầu mới học chương tiếp"
Bullet "Quản lý học viên: Xem danh sách đăng ký, tiến độ của từng học viên, gửi tin nhắn"
Bullet "Xem thống kê: Tổng lượt xem, thời gian học trung bình, tỷ lệ hoàn thành, doanh thu"
Bullet "Sau khi hoàn thiện, gửi khoá học để Admin duyệt và đăng tải công khai"

H2 "10.2 Quản lý Bài thi"
Img "21_teacher_quizzes.png" 15.5 8 "Hình 10.2 — Trang quản lý bài thi của Giáo viên, hiển thị danh sách đề thi và thống kê"

Body "Giáo viên có thể tạo và quản lý các bài thi đa dạng từ tab 'Quiz & Questions' trong cổng Giáo viên:"
Bullet "Tạo đề thi mới: Đặt tiêu đề, mô tả, loại thi (Tổng quát/OPIC/VSTEP), thời gian làm bài, số lần cho phép thi lại, hiển thị/ẩn đáp án sau khi nộp"
Bullet "Lấy câu hỏi từ Ngân hàng câu hỏi hoặc tạo câu hỏi mới trực tiếp trong đề"
Bullet "Thiết lập thang điểm và điểm đậu (passing score) cho từng đề thi"
Bullet "Xem kết quả: Điểm trung bình cả lớp, phân bố điểm, câu hỏi học viên hay sai nhất"
Bullet "Xuất file báo cáo kết quả (Excel/PDF) cho từng đợt thi"

H2 "10.3 Ngân hàng câu hỏi"
Img "22_teacher_questions.png" 15.5 8 "Hình 10.3 — Ngân hàng câu hỏi với bộ lọc theo kỹ năng, cấp độ và loại câu hỏi"

Body "Ngân hàng câu hỏi (Question Bank) là kho lưu trữ tập trung tất cả câu hỏi do giáo viên tạo. Một câu hỏi có thể được tái sử dụng trong nhiều đề thi khác nhau."
Bullet "Câu hỏi trắc nghiệm (Multiple Choice) — 4 lựa chọn, chọn 1 hoặc nhiều đáp án đúng"
Bullet "Câu điền từ (Fill in the Blank) — Học viên gõ từ/cụm từ vào ô trống"
Bullet "Câu hỏi nghe (Listening) — Đính kèm file audio, học viên nghe rồi trả lời"
Bullet "Câu hỏi Nói — OPIC Speaking: Học viên ghi âm câu trả lời, AI đánh giá phát âm, ngữ điệu, từ vựng, ngữ pháp theo thang điểm CEFR"
Bullet "Câu viết luận — VSTEP Writing: Học viên viết đoạn văn/bài luận, AI phân tích cấu trúc, từ vựng, ngữ pháp và chấm điểm chi tiết"
Bullet "Phân loại câu hỏi theo: Kỹ năng (Nghe/Đọc/Nói/Viết/Ngữ pháp), Cấp độ CEFR, Chủ đề, Độ khó"
Bullet "Tìm kiếm và lọc nhanh câu hỏi khi soạn đề thi"

H2 "10.4 Thi trực tiếp (Live Exam / Realtime Quiz)"
Body "Tính năng Thi trực tiếp cho phép giáo viên tổ chức buổi thi đồng thời với tất cả học viên:"
Bullet "Tạo phòng thi mới: Chọn đề thi, đặt thời gian, tạo mã phòng (4–6 chữ số)"
Bullet "Học viên tham gia bằng mã phòng — không cần link dài phức tạp"
Bullet "Màn hình giáo viên: Nhìn thấy học viên đang vào phòng theo thời gian thực, bắt đầu thi khi đủ người"
Bullet "Trong khi thi: Giáo viên theo dõi tiến độ làm bài của từng học viên, có thể gửi thông báo"
Bullet "Kết thúc thi: Kết quả hiển thị ngay — bảng xếp hạng điểm số, phân tích từng câu"

H2 "10.5 Quản lý nhóm học tập"
Body "Giáo viên tạo và quản lý nhóm học tập từ mục 'Chat Groups' trong cổng Giáo viên:"
Bullet "Tạo nhóm: Đặt tên, mô tả, chủ đề, số thành viên tối đa, loại nhóm (công khai/riêng tư)"
Bullet "Duyệt thành viên xin gia nhập (với nhóm riêng tư)"
Bullet "Đăng bài, chia sẻ tài liệu và thông báo cho toàn nhóm"
Bullet "Xem thống kê hoạt động nhóm: số tin nhắn, thành viên tích cực"
PB

# =====================================================================
# CHƯƠNG 11 — ADMIN
# =====================================================================
Write-Host "`n=== Chương 11 ==="
H1 "11. Bảng quản trị Admin"

Body "Bảng quản trị Admin (/admin) là khu vực dành riêng cho Quản trị viên và Content Manager của nền tảng MLS. Tại đây, người có quyền Admin có thể giám sát toàn bộ hoạt động hệ thống, quản lý dữ liệu và cấu hình nền tảng."

Img "03_admin_dashboard.png" 15.5 9 "Hình 11.1 — Bảng điều khiển Admin với menu đầy đủ bên trái và tổng quan Analytics bên phải"

H2 "11.1 Dashboard Analytics — Thống kê tổng quan"
Body "Trang Dashboard Analytics (/admin/analytics) là trang mặc định khi Admin đăng nhập. Cung cấp cái nhìn toàn diện về tình trạng hoạt động nền tảng:"
Bullet "Bộ lọc thời gian: Xem số liệu theo 7 ngày, 30 ngày hoặc 90 ngày gần nhất"
Bullet "Tab Tổng quan (Overview): Doanh thu, số đơn hàng, số học viên mới, số khoá học được đăng ký"
Bullet "Tab Người dùng (Users): Biểu đồ tăng trưởng người dùng mới theo ngày"
Bullet "Tab Lượt xem (Views): Thống kê lượt xem video bài học theo ngày"
Bullet "Tab Doanh số (Sales): Biểu đồ doanh thu theo ngày, Top 10 sách bán chạy, phân tích trạng thái đơn hàng"

H2 "11.2 Quản lý Khoá học"
Img "10_admin_courses.png" 15.5 8 "Hình 11.2 — Trang quản lý khoá học của Admin với bộ lọc và danh sách đầy đủ"

Body "Admin có toàn quyền quản lý tất cả khoá học trên hệ thống:"
Bullet "Xem danh sách toàn bộ khoá học của tất cả giáo viên, lọc theo trạng thái: Nháp, Chờ duyệt, Đã đăng, Đã ẩn"
Bullet "Duyệt khoá học: Xem nội dung, kiểm tra chất lượng và phê duyệt hoặc từ chối kèm lý do"
Bullet "Chỉnh sửa thông tin khoá học, thêm/xóa bài học, thay đổi giá"
Bullet "Ẩn/hiện khoá học trên trang công khai"
Bullet "Xóa vĩnh viễn khoá học (cần xác nhận 2 lần)"
Bullet "Quản lý danh mục và thẻ tag (Category & Tags) cho hệ thống phân loại"

H2 "11.3 Quản lý Sách"
Img "11_admin_books.png" 15.5 8 "Hình 11.3 — Trang quản lý sách với danh sách đầy đủ, tình trạng kho và nút thêm sách mới"

Body "Quản lý toàn bộ danh mục sách trong cửa hàng MLS:"
Bullet "Thêm sách mới: Nhập ISBN, tiêu đề, tác giả, nhà xuất bản, năm xuất bản, giá bán, số trang, cấp độ, thể loại"
Bullet "Upload ảnh bìa (bắt buộc) và ảnh bên trong sách (tùy chọn)"
Bullet "Nhập mô tả chi tiết và mục lục dạng văn bản"
Bullet "Quản lý tồn kho: Nhập số lượng, đặt ngưỡng cảnh báo hết hàng"
Bullet "Chỉnh sửa thông tin và giá sách bất kỳ lúc nào"
Bullet "Ẩn/hiện sách không còn phân phối mà không cần xóa dữ liệu"

H2 "11.4 Quản lý Đơn hàng"
Img "12_admin_orders.png" 15.5 8 "Hình 11.4 — Trang quản lý đơn hàng với bộ lọc trạng thái và ô tìm kiếm"

Body "Theo dõi và xử lý tất cả đơn hàng sách trên hệ thống:"
Bullet "Xem danh sách đơn hàng, lọc theo trạng thái: Chờ xử lý, Chờ thanh toán, Đã thanh toán, Đang xử lý, Hoàn thành, Đã hủy, Thất bại"
Bullet "Tìm kiếm đơn hàng theo mã đơn, email khách hàng, số điện thoại, tên người nhận"
Bullet "Xem chi tiết đơn: danh sách sách, địa chỉ giao hàng, phương thức thanh toán, lịch sử trạng thái"
Bullet "Cập nhật trạng thái đơn hàng thủ công khi cần thiết"
Bullet "Tạo vận đơn ViettelPost: Nhập thông tin, in phiếu giao hàng trực tiếp từ hệ thống"
Bullet "Hoàn tiền (Refund) cho đơn hàng lỗi hoặc khách hủy theo chính sách"

H2 "11.5 Quản lý Voucher"
Img "13_admin_vouchers.png" 15.5 8 "Hình 11.5 — Trang quản lý voucher với danh sách mã giảm giá đang hoạt động và lịch sử sử dụng"

Body "Tạo và quản lý hệ thống mã giảm giá cho cửa hàng sách và khoá học:"
Bullet "Tạo voucher mới: Nhập mã tùy chỉnh hoặc tạo ngẫu nhiên, chọn loại giảm giá (% hoặc số tiền cố định)"
Bullet "Thiết lập điều kiện áp dụng: Đơn hàng tối thiểu, danh mục sản phẩm áp dụng, giới hạn 1 lần/tài khoản"
Bullet "Đặt thời hạn sử dụng: Ngày bắt đầu và ngày hết hạn voucher"
Bullet "Giới hạn tổng số lần sử dụng trên toàn hệ thống"
Bullet "Xem thống kê: Số lần đã dùng, tổng giá trị chiết khấu đã cấp"
Bullet "Vô hiệu hóa hoặc xóa voucher khi không còn cần thiết"

H2 "11.6 Quản lý Vận đơn (Shipments)"
Body "Theo dõi toàn bộ vận đơn giao hàng qua ViettelPost:"
Bullet "Xem danh sách vận đơn, lọc theo trạng thái: Đã tạo, Đang giao, Đã giao, Hoàn trả"
Bullet "Tra cứu trạng thái giao hàng theo thời gian thực từ API ViettelPost"
Bullet "Xử lý vận đơn hoàn trả: Nhận hàng trả về kho, cập nhật tình trạng"

H2 "11.7 Quản lý Người dùng"
Img "14_admin_users.png" 15.5 8 "Hình 11.6 — Trang quản lý người dùng với danh sách tài khoản, vai trò và công cụ quản lý"

Body "Admin quản lý toàn bộ tài khoản người dùng trên hệ thống:"
Bullet "Xem danh sách tất cả người dùng, tìm kiếm theo email, tên, trạng thái, vai trò"
Bullet "Xem chi tiết hồ sơ: thông tin cá nhân, khoá học đã đăng ký, lịch sử thi, đơn hàng"
Bullet "Phân quyền: Học viên → Giáo viên → Content Manager → Admin → SuperAdmin"
Bullet "Kích hoạt/Khóa tài khoản — Khóa tạm thời (có thể mở) hoặc vô hiệu hóa vĩnh viễn"
Bullet "Reset mật khẩu cho người dùng quên mật khẩu và không nhận được email"
Bullet "Xem lịch sử đăng nhập: Thời gian, thiết bị, địa chỉ IP"

H2 "11.8 Cấu hình hệ thống"
Body "Quản trị viên cấu hình các tham số vận hành hệ thống từ mục 'System Configuration':"
Bullet "Cài đặt thông tin công ty: Tên, logo, địa chỉ, thông tin liên hệ"
Bullet "Cấu hình email: SMTP server, mẫu email thông báo, email chào mừng"
Bullet "Chính sách nội dung: Điều khoản sử dụng, chính sách bảo mật"
Bullet "Cài đặt thanh toán: Tích hợp cổng thanh toán, phí vận chuyển theo vùng"
Bullet "Quản lý cấp độ học tập: Thêm/sửa tiêu chí xếp loại CEFR"
PB

# =====================================================================
# CHƯƠNG 12 — FAQ
# =====================================================================
Write-Host "`n=== Chương 12 ==="
H1 "12. Câu hỏi thường gặp (FAQ)"

H3 "Tôi quên mật khẩu, phải làm gì?"
Body "Tại trang đăng nhập, nhấn liên kết 'Quên mật khẩu?' phía dưới ô nhập mật khẩu. Nhập địa chỉ email đã đăng ký và nhấn 'Gửi email'. Kiểm tra hộp thư (kể cả thư mục Spam/Junk) và nhấn link đặt lại mật khẩu. Link có hiệu lực trong 1 giờ. Nếu không nhận được email sau 5 phút, thử lại hoặc liên hệ bộ phận hỗ trợ."

H3 "Khoá học có hết hạn sau khi đăng ký không?"
Body "Không — khoá học trên MLS không có hạn truy cập. Sau khi đăng ký (miễn phí hoặc có phí), bạn có thể học lại bất cứ lúc nào, xem lại video không giới hạn lần. Tuy nhiên, nội dung khoá học có thể được giáo viên cập nhật theo thời gian."

H3 "Tôi có thể học MLS trên điện thoại không?"
Body "Có. MLS có ứng dụng di động đầy đủ tính năng cho cả iOS (tải từ App Store) và Android (tải từ Google Play). Tất cả dữ liệu học tập, tiến độ và kết quả thi đều đồng bộ tự động giữa máy tính và điện thoại qua tài khoản."

H3 "Làm sao biết mình ở cấp độ nào của CEFR?"
Body "Thực hiện bài Kiểm tra xếp lớp (Placement Test) miễn phí từ mục 'Thi online'. Bài kiểm tra khoảng 45 phút, bao gồm Nghe, Đọc và Ngữ pháp. Hệ thống AI tự động phân tích kết quả và xếp bạn vào cấp độ phù hợp từ A1 đến C2, đồng thời gợi ý khoá học phù hợp để bắt đầu."

H3 "Chứng chỉ hoàn thành khoá học có giá trị gì?"
Body "Chứng chỉ Hoàn thành khoá học MLS được cấp sau khi học viên hoàn thành 100% nội dung và đạt điểm kiểm tra cuối khoá. Chứng chỉ này là bằng chứng về nỗ lực học tập và có thể dùng trong hồ sơ xin việc. Riêng chứng chỉ VSTEP và OPIC được Bộ Giáo dục & Đào tạo Việt Nam công nhận chính thức."

H3 "Tôi mua sách nhưng nhận được sách sai/hỏng, phải làm gì?"
Body "Chụp ảnh sách lỗi/sai và liên hệ ngay bộ phận hỗ trợ qua email support@mls.edu.vn hoặc Chat trực tuyến trên website trong vòng 48 giờ kể từ khi nhận hàng. Đính kèm mã đơn hàng và ảnh minh chứng. Chúng tôi sẽ xử lý đổi/trả trong 3–5 ngày làm việc và chịu toàn bộ chi phí vận chuyển."

H3 "Tôi muốn trở thành Giáo viên trên MLS, cần làm gì?"
Body "Để đăng ký trở thành Giáo viên trên MLS: (1) Điền form đăng ký Giáo viên tại /teacher-register hoặc gửi email đến teacher@mls.edu.vn, (2) Đính kèm hồ sơ gồm: CV, bằng cấp/chứng chỉ dạy tiếng Việt, video giới thiệu ngắn 2–3 phút, (3) Đội ngũ MLS xét duyệt trong 5–7 ngày làm việc, (4) Sau khi được duyệt, nhận email hướng dẫn kích hoạt tài khoản Giáo viên."

H3 "Voucher giảm giá có thể áp dụng cho tất cả sản phẩm không?"
Body "Mỗi voucher có điều kiện áp dụng riêng. Trước khi sử dụng, đọc kỹ phần 'Điều kiện áp dụng' hiển thị ngay dưới mỗi voucher. Một số voucher chỉ áp dụng cho sách, một số chỉ cho khoá học, một số yêu cầu giá trị đơn hàng tối thiểu. Mỗi tài khoản thường chỉ dùng mỗi voucher 1 lần."
PB

# =====================================================================
# CHƯƠNG 13 — THÔNG TIN LIÊN HỆ
# =====================================================================
Write-Host "`n=== Chương 13 ==="
H1 "13. Thông tin liên hệ & Hỗ trợ"

Body "Đội ngũ MLS luôn sẵn sàng hỗ trợ người dùng qua nhiều kênh khác nhau. Thời gian làm việc chính thức: Thứ Hai – Thứ Sáu, 8:00 – 18:00 (giờ Hà Nội, UTC+7)."

MakeTable @("Kênh hỗ trợ", "Địa chỉ / Thông tin", "Thời gian phản hồi") @(
    @("Email hỗ trợ kỹ thuật", "support@mls.edu.vn", "Trong vòng 24 giờ làm việc"),
    @("Email Giáo viên", "teacher@mls.edu.vn", "Trong vòng 48 giờ làm việc"),
    @("Chat trực tuyến", "Biểu tượng chat góc dưới phải website", "Trong giờ làm việc: < 5 phút"),
    @("Cộng đồng học viên", "Nhóm Facebook: MLS Vietnamese Learners", "Giải đáp bởi cộng đồng 24/7"),
    @("Kênh YouTube", "youtube.com/@MLSVietnamese", "Video hướng dẫn miễn phí"),
    @("Địa chỉ văn phòng", "Hà Nội, Việt Nam", "Hẹn gặp trước qua email")
)

SP 8
$sel.Style = $doc.Styles.Item("Normal")
$sel.ParagraphFormat.Alignment = 1
$sel.Font.Size  = 11
$sel.Font.Italic = $true
$sel.Font.Color  = -16777216 + 0x6B7280
$sel.TypeText("— Hết tài liệu hướng dẫn sử dụng MLS v1.0 · Tháng 6/2026 —")
$sel.TypeParagraph()
$sel.ParagraphFormat.Alignment = 0
$sel.Font.Italic = $false

# =====================================================================
# LƯU FILE
# =====================================================================
Write-Host "`n=== Đang lưu file... ==="
if (Test-Path $OUT) { Remove-Item $OUT -Force }
$doc.SaveAs2($OUT, 16)   # 16 = wdFormatDocx
$doc.Close($false)
$word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null

$info = Get-Item $OUT
Write-Host "`n✅ HOÀN THÀNH!"
Write-Host "   File: $OUT"
Write-Host "   Kích thước: $([math]::Round($info.Length/1MB, 2)) MB"
Write-Host "   Thời gian: $(Get-Date -Format 'HH:mm:ss dd/MM/yyyy')"
