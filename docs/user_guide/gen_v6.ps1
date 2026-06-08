# MLS User Guide Generator v6 - Chi tiết đầy đủ CRUD, 3 vai trò, Tiếng Việt có dấu
$ErrorActionPreference = "Continue"
$SS  = "D:\HiepPD\MLS\docs\user_guide\screenshots"
$OUT = "D:\HiepPD\MLS\docs\User_Guide_MLS.docx"

$cNavy    = 6240798   # #1E3A5F
$cBlue    = 15426341  # #2563EB
$cGray    = 8417899   # #6B7280
$cLightBg = 16774895  # #EFF6FF
$cWhite   = 16777215
$cBlack   = 0
$cGreen   = 39424     # #009900
$cOrange  = 26367     # #66FF

Write-Host "Khởi động Word..."
$word = New-Object -ComObject Word.Application
$word.Visible = $false; $word.DisplayAlerts = 0
$doc = $word.Documents.Add()
$sel = $word.Selection

# ───── Helper functions ─────
function ResetPara {
    $sel.ParagraphFormat.Alignment = 0; $sel.ParagraphFormat.SpaceBefore = 0
    $sel.ParagraphFormat.SpaceAfter = 8; $sel.ParagraphFormat.FirstLineIndent = 0
    $sel.ParagraphFormat.LeftIndent = 0
}
function SetFont([double]$sz,[bool]$bold=$false,[bool]$ital=$false,[int]$col=0,[string]$nm="Times New Roman") {
    $sel.Font.Name = $nm; $sel.Font.Size = $sz; $sel.Font.Bold = $bold
    $sel.Font.Italic = $ital; $sel.Font.Color = $col
}
function H1([string]$t) {
    $sel.Style = $doc.Styles.Item("Heading 1"); $sel.TypeText($t); $sel.TypeParagraph()
    $sel.Style = $doc.Styles.Item("Normal"); ResetPara
}
function H2([string]$t) {
    $sel.Style = $doc.Styles.Item("Heading 2"); $sel.TypeText($t); $sel.TypeParagraph()
    $sel.Style = $doc.Styles.Item("Normal"); ResetPara
}
function H3([string]$t) {
    $sel.Style = $doc.Styles.Item("Heading 3"); $sel.TypeText($t); $sel.TypeParagraph()
    $sel.Style = $doc.Styles.Item("Normal"); ResetPara
}
function H4([string]$t) {
    SetFont 12 $true $false $cNavy; $sel.ParagraphFormat.SpaceBefore = 8; $sel.ParagraphFormat.SpaceAfter = 4
    $sel.TypeText("▶  $t"); $sel.TypeParagraph(); ResetPara; SetFont 12 $false $false 0
}
function P([string]$t) {
    $sel.Style = $doc.Styles.Item("Normal"); SetFont 12 $false $false 0
    $sel.ParagraphFormat.Alignment = 3; $sel.ParagraphFormat.SpaceAfter = 6
    $sel.ParagraphFormat.FirstLineIndent = $word.CentimetersToPoints(1.0)
    $sel.TypeText($t); $sel.TypeParagraph()
    $sel.ParagraphFormat.FirstLineIndent = 0; $sel.ParagraphFormat.Alignment = 0
}
function BL([string]$t) {
    $sel.Style = $doc.Styles.Item("List Bullet"); SetFont 12 $false $false 0
    $sel.ParagraphFormat.SpaceAfter = 3; $sel.TypeText($t); $sel.TypeParagraph()
    $sel.Style = $doc.Styles.Item("Normal"); ResetPara
}
function NOTE([string]$t) {
    $sel.Style = $doc.Styles.Item("Normal"); SetFont 11 $false $true $cBlue
    $sel.ParagraphFormat.LeftIndent = $word.CentimetersToPoints(0.5)
    $sel.ParagraphFormat.SpaceBefore = 4; $sel.ParagraphFormat.SpaceAfter = 10
    $sel.TypeText("   $t"); $sel.TypeParagraph()
    ResetPara; SetFont 12 $false $false 0
}
function IMG([string]$fname,[double]$w,[double]$h,[string]$cap) {
    $fp = Join-Path $SS $fname
    if (-not (Test-Path $fp)) { Write-Host "  SKIP $fname"; return }
    $sel.Style = $doc.Styles.Item("Normal")
    $sel.ParagraphFormat.Alignment = 1; $sel.ParagraphFormat.SpaceBefore = 8; $sel.ParagraphFormat.SpaceAfter = 0
    try {
        $pic = $sel.InlineShapes.AddPicture($fp,$false,$true,$sel.Range)
        $pic.Width = $word.CentimetersToPoints($w); $pic.Height = $word.CentimetersToPoints($h)
    } catch { Write-Warning "IMG ERR: $fname" }
    $sel.TypeParagraph()
    if ($cap -ne "") {
        SetFont 10 $false $true $cGray; $sel.ParagraphFormat.Alignment = 1; $sel.ParagraphFormat.SpaceAfter = 14
        $sel.TypeText($cap); $sel.TypeParagraph()
    }
    ResetPara; SetFont 12 $false $false 0
    Write-Host "  [IMG] $fname"
}
function TBL([string[]]$hdrs,[object[]]$rows) {
    $nc = $hdrs.Count; $nr = $rows.Count + 1
    $tbl = $doc.Tables.Add($sel.Range,$nr,$nc)
    try { $tbl.Style = $doc.Styles.Item("Table Grid") } catch {}
    for ($c=1;$c -le $nc;$c++) {
        $cell = $tbl.Cell(1,$c)
        $cell.Range.Text = $hdrs[$c-1]; $cell.Range.Bold = $true
        $cell.Range.Font.Size = 11; $cell.Range.Font.Name = "Calibri"
        $cell.Range.Font.Color = $cWhite; $cell.Range.ParagraphFormat.Alignment = 1
        $cell.Shading.BackgroundPatternColor = $cNavy
    }
    for ($r=0;$r -lt $rows.Count;$r++) {
        $fill = if ($r%2 -eq 0){$cLightBg}else{16777215}
        for ($c=1;$c -le $nc;$c++) {
            $cell = $tbl.Cell($r+2,$c)
            $v = if ($c-1 -lt $rows[$r].Count){"$($rows[$r][$c-1])"}else{""}
            $cell.Range.Text = $v; $cell.Range.Font.Size = 11; $cell.Range.Font.Name = "Calibri"
            $cell.Range.Bold = $false; $cell.Range.Font.Color = 0
            $cell.Shading.BackgroundPatternColor = $fill
        }
    }
    try { $tbl.Columns.AutoFit() } catch {}
    $sel.MoveDown(5,$nr+2); $sel.TypeParagraph(); ResetPara
}
function PB { $sel.InsertBreak(7) }
function AddSP { $sel.Style = $doc.Styles.Item("Normal"); SetFont 6 $false $false 0; $sel.TypeParagraph(); ResetPara }
function SectionBanner([string]$num,[string]$title,[string]$sub) {
    $sel.Style = $doc.Styles.Item("Normal"); $sel.ParagraphFormat.Alignment = 1
    $sel.ParagraphFormat.SpaceBefore = 50; $sel.ParagraphFormat.SpaceAfter = 6
    SetFont 42 $true $false $cNavy "Calibri"
    $sel.TypeText($num); $sel.TypeParagraph()
    SetFont 22 $false $false $cBlue "Calibri"; $sel.ParagraphFormat.SpaceAfter = 4
    $sel.TypeText($title); $sel.TypeParagraph()
    SetFont 13 $false $true $cGray "Calibri"
    $sel.TypeText($sub); $sel.TypeParagraph()
    $sel.ParagraphFormat.Alignment = 0; ResetPara
}

# ════════════════════════════════════════════
# TRANG BÌA
# ════════════════════════════════════════════
Write-Host "=== TRANG BÌA ==="
$sel.Style = $doc.Styles.Item("Normal"); $sel.ParagraphFormat.Alignment = 1; $sel.ParagraphFormat.SpaceBefore = 40
SetFont 80 $true $false $cNavy "Calibri"
$sel.TypeText("MLS"); $sel.TypeParagraph()
SetFont 22 $false $false $cBlue "Calibri"; $sel.ParagraphFormat.SpaceAfter = 6
$sel.TypeText("Modern Language System"); $sel.TypeParagraph()
SetFont 14 $false $false 8355711 "Calibri"
$sel.TypeText("Nền tảng học tiếng Việt trực tuyến toàn diện"); $sel.TypeParagraph()
AddSP
SetFont 36 $true $false 0 "Calibri"; $sel.ParagraphFormat.SpaceAfter = 6
$sel.TypeText("HƯỚNG DẪN SỬ DỤNG"); $sel.TypeParagraph()
SetFont 13 $false $false $cGray "Calibri"
$sel.TypeText("Phiên bản 1.0  —  Tháng 6 năm 2026"); $sel.TypeParagraph()
AddSP; IMG "01_homepage.png" 15.5 8.5 ""
AddSP
SetFont 11 $false $true $cGray "Calibri"; $sel.ParagraphFormat.Alignment = 1
$sel.TypeText("Tài liệu hướng dẫn đầy đủ dành cho ba nhóm: Học viên, Giáo viên và Quản trị viên.")
$sel.TypeParagraph(); $sel.ParagraphFormat.Alignment = 0
PB

# ════════════════════════════════════════════
# GIỚI THIỆU TỔNG QUAN
# ════════════════════════════════════════════
Write-Host "=== GIỚI THIỆU ==="
H1 "GIỚI THIỆU HỆ THỐNG MLS"
P "MLS (Modern Language System) là nền tảng học tiếng Việt trực tuyến tích hợp AI, được thiết kế theo khung năng lực ngoại ngữ CEFR với 6 cấp độ từ A1 đến C2. Hệ thống phục vụ ba nhóm người dùng chính với giao diện và chức năng riêng biệt, được truy cập qua các đường dẫn khác nhau."

H2 "Các vai trò và đường dẫn truy cập"
TBL @("Vai trò","Đường dẫn","Quyền hạn chính") @(
    ,@("Học viên (Student)","/ (trang chủ)","Học khoá học, thi online, mua sách, tham gia nhóm học tập"),
    ,@("Giáo viên (Teacher)","/teacher","Tạo khoá học, soạn đề thi, ngân hàng câu hỏi, quản lý nhóm"),
    ,@("Quản trị viên (Admin)","/admin","Toàn quyền quản lý: khoá học, sách, đơn hàng, người dùng, voucher")
)
H2 "Tài khoản thử nghiệm"
TBL @("Vai trò","Email đăng nhập","Mật khẩu") @(
    ,@("Quản trị viên","admin01@gmail.com","123@123aA"),
    ,@("Giáo viên","teacher01@gmail.com","123@123aA"),
    ,@("Học viên","student01@gmail.com","123@123aA")
)
H2 "Yêu cầu kỹ thuật"
TBL @("Thành phần","Yêu cầu tối thiểu","Khuyến nghị") @(
    ,@("Trình duyệt web","Chrome 90+, Firefox 88+, Edge 90+, Safari 14+","Chrome phiên bản mới nhất"),
    ,@("Kết nối Internet","5 Mbps (xem video), 1 Mbps (văn bản)","20 Mbps trở lên"),
    ,@("Màn hình","1280 x 720 pixels","1920 x 1080 pixels"),
    ,@("Thiết bị mobile","iOS 14+ / Android 8+","iOS 16+ / Android 12+")
)
PB

# ════════════════════════════════════════════
# PHẦN 1: HỌC VIÊN
# ════════════════════════════════════════════
SectionBanner "PHẦN 1" "HƯỚNG DẪN DÀNH CHO HỌC VIÊN" "Student Guide"
PB

Write-Host "=== HV1: Đăng ký & Đăng nhập ==="
H1 "1. Đăng ký tài khoản & Đăng nhập"
H2 "1.1 Đăng ký tài khoản mới"
IMG "16_register.png" 15.5 10 "Hình 1.1 — Trang đăng ký tài khoản MLS"
BL "Họ và tên đầy đủ — hiển thị trong hồ sơ và trên chứng chỉ hoàn thành khoá học"
BL "Địa chỉ email hợp lệ — dùng để đăng nhập và nhận thông báo từ hệ thống"
BL "Mật khẩu mạnh: tối thiểu 8 ký tự, phải có chữ hoa, chữ thường và số (VD: MyPass123)"
BL "Xác nhận lại mật khẩu để tránh nhập sai"
BL "Nhấn 'Đăng ký' — hệ thống gửi email xác nhận đến địa chỉ vừa nhập"
BL "Mở email và nhấn link kích hoạt để hoàn tất (link có hiệu lực 24 giờ)"
NOTE "Nếu không nhận được email sau 5 phút, kiểm tra thư mục Spam/Junk hoặc nhấn 'Gửi lại email xác nhận'."

H2 "1.2 Đăng nhập bằng email & mật khẩu"
IMG "02_login_page.png" 15.5 10 "Hình 1.2 — Trang đăng nhập MLS"
IMG "02b_login_filled.png" 15.5 10 "Hình 1.3 — Form đăng nhập đã điền thông tin"
BL "Bước 1: Nhấn nút 'Đăng nhập' ở góc phải trên thanh điều hướng"
BL "Bước 2: Nhập Email đã đăng ký"
BL "Bước 3: Nhập Mật khẩu (ẩn bằng dấu chấm, nhấn biểu tượng mắt để hiện)"
BL "Bước 4: Nhấn 'Đăng nhập' — hệ thống tự chuyển đến trang chủ học viên"
NOTE "Quên mật khẩu: Nhấn 'Quên mật khẩu?' dưới ô mật khẩu → nhập email → nhận link đặt lại (hiệu lực 1 giờ)."

H2 "1.3 Đăng nhập nhanh bằng Google"
P "Nhấn nút 'Tiếp tục với Google', chọn tài khoản Google, xác nhận cấp quyền truy cập. Hệ thống tự động tạo tài khoản MLS liên kết với Google Account — không cần nhớ thêm mật khẩu mới. Lần đăng nhập tiếp theo chỉ cần nhấn một lần."
PB

Write-Host "=== HV2: Trang chủ ==="
H1 "2. Trang chủ"
IMG "04_homepage_loggedin.png" 15.5 9 "Hình 2.1 — Trang chủ MLS sau khi đăng nhập với luồng video bài học phong cách TikTok"
H2 "2.1 Bố cục 3 cột"
BL "Sidebar trái: Bài học mới nhất, Khoá học đã kích hoạt, Nhóm của tôi, Người đang theo dõi, Bài đã lưu, Bài đã thích, Danh sách bạn bè"
BL "Khu vực trung tâm: Luồng video bài học ngắn TikTok-style. Mỗi video hiển thị tên bài, giáo viên, số lượt xem, nút Thích/Lưu/Chia sẻ/Bình luận"
BL "Sidebar phải: Thống kê nhanh, Giáo viên nổi bật, Khoá học đề xuất theo sở thích"
H2 "2.2 Thanh điều hướng chính"
BL "Logo MLS — quay về trang chủ từ bất kỳ trang nào"
BL "Menu: Trang chủ | Khoá học | Sách | Thi online | Nhóm"
BL "Ô tìm kiếm toàn cục — tìm khoá học, giáo viên, bài thi, sách"
BL "Biểu tượng Giỏ hàng — hiển thị số sách đang chờ thanh toán"
BL "Chuông thông báo — bài học mới, kết quả thi, đơn hàng, tin nhắn"
BL "Avatar — truy cập hồ sơ, cài đặt, đăng xuất; chọn ngôn ngữ Tiếng Việt / English"
PB

Write-Host "=== HV3: Khoá học ==="
H1 "3. Khoá học — Tìm kiếm, Đăng ký & Học tập"
IMG "05_courses_list.png" 15.5 10 "Hình 3.1 — Trang danh sách khoá học với hệ thống lọc đa dạng"
H2 "3.1 Tìm kiếm & Lọc khoá học"
BL "Lọc cấp độ CEFR: A1 Sơ cấp | A2 Cơ bản | B1 Trung cấp sơ | B2 Trung cấp | C1 Cao cấp | C2 Thành thạo"
BL "Lọc chủ đề: Giao tiếp, Kinh doanh & Thương mại, Du lịch, Văn hoá Việt Nam, Luyện thi VSTEP"
BL "Sắp xếp: Mới nhất | Phổ biến nhất | Đánh giá cao nhất | Giá thấp→cao | Giá cao→thấp"
BL "Lọc giá: Tất cả | Miễn phí | Có phí"
H2 "3.2 Chi tiết khoá học"
IMG "06_course_detail.png" 15.5 10 "Hình 3.2 — Trang chi tiết khoá học"
IMG "06b_course_detail_scroll.png" 15.5 9 "Hình 3.3 — Chương trình học chi tiết sau khi cuộn xuống"
BL "Video giới thiệu — xem trước phong cách giảng dạy của giáo viên"
BL "Mô tả tổng quan — mục tiêu học tập, đối tượng phù hợp, kiến thức cần có trước"
BL "Chương trình học — danh sách đầy đủ Chương → Bài học (có thể xem preview một số bài miễn phí)"
BL "Hồ sơ giáo viên — kinh nghiệm, chứng chỉ, số học viên đã dạy"
BL "Đánh giá từ học viên — điểm sao trung bình và nhận xét chi tiết"
BL "Thông tin đăng ký — giá khoá học, chính sách hoàn tiền, thời hạn truy cập"
H2 "3.3 Đăng ký khoá học"
BL "Khoá miễn phí: Nhấn 'Đăng ký học miễn phí' → bắt đầu học ngay"
BL "Khoá có phí: Nhấn 'Thêm vào giỏ hàng' → thanh toán → nhận quyền truy cập vĩnh viễn"
H2 "3.4 Khoá học của tôi & Tiến độ"
IMG "19_my_courses.png" 15.5 8 "Hình 3.4 — Khoá học của tôi với thanh tiến độ"
BL "Thanh tiến độ (%) — biết ngay đã hoàn thành bao nhiêu"
BL "Bài học tiếp theo được đề xuất tự động"
BL "Chứng chỉ PDF — tải xuống khi hoàn thành 100% và đạt bài kiểm tra cuối"
IMG "23_my_lesson.png" 15.5 8 "Hình 3.5 — Bài học mới cập nhật từ các khoá đã đăng ký"
PB

Write-Host "=== HV4: Sách ==="
H1 "4. Sách — Cửa hàng sách tiếng Việt"
IMG "07_books_list.png" 15.5 10 "Hình 4.1 — Cửa hàng sách MLS"
IMG "07b_book_detail.png" 15.5 9 "Hình 4.2 — Chi tiết sách với mục lục và nút mua"
BL "Thể loại: Giáo trình CEFR, Luyện thi VSTEP & OPIC, Từ điển Việt-Anh, Văn học, Sách doanh nhân"
BL "Lọc theo cấp độ — chỉ hiện sách phù hợp trình độ hiện tại"
BL "Nút 'Thêm vào giỏ hàng' — mua nhiều sách cùng lúc"
BL "Nút 'Mua ngay' — chuyển thẳng đến trang thanh toán"
NOTE "Giao hàng ViettelPost toàn quốc: Nội thành 1–2 ngày, Ngoại tỉnh 3–5 ngày làm việc."
PB

Write-Host "=== HV5: Thi online ==="
H1 "5. Thi online — VSTEP, OPIC & Kiểm tra xếp lớp"
IMG "08_quiz_list.png" 15.5 8 "Hình 5.1 — Trang danh sách bài thi online với bộ lọc và bảng xếp hạng"
H2 "5.1 Các loại bài thi"
TBL @("Loại thi","Mô tả","Kỹ năng kiểm tra","Chứng chỉ") @(
    ,@("Tổng quát","Kiểm tra ngữ pháp, từ vựng, đọc hiểu theo cấp độ CEFR","Đọc, Ngữ pháp, Từ vựng","Không"),
    ,@("OPIC","AI phân tích âm thanh và chấm điểm Speaking theo tiêu chí CEFR","Kỹ năng Nói","Có (OPIC Certificate)"),
    ,@("VSTEP","Chuẩn hoá quốc gia Bộ GD&ĐT, 4 kỹ năng đầy đủ CEFR B1–C1","Nghe, Đọc, Viết, Nói","Có (VSTEP Certificate)"),
    ,@("Live Exam","Giáo viên tổ chức theo thời gian thực, học viên vào bằng mã phòng thi","Tuỳ đề GV","Không")
)
H2 "5.2 Hướng dẫn làm bài"
BL "Chọn tab loại thi → nhấn vào bài thi → xem thông tin: số câu, thời gian, độ khó, số người đã thi"
BL "Nhấn 'Bắt đầu thi' → đồng hồ đếm ngược chạy; có thể đánh dấu câu chưa chắc để xem lại"
BL "Nhấn 'Nộp bài' → kết quả hiển thị ngay: điểm số, đáp án đúng/sai, giải thích"
H2 "5.3 Kiểm tra xếp lớp"
IMG "17_placement_test.png" 15.5 7 "Hình 5.2 — Kiểm tra xếp lớp cho học viên mới"
BL "45 phút gồm 3 phần: Nghe hiểu (20 câu), Đọc hiểu (20 câu), Ngữ pháp & Từ vựng (20 câu)"
BL "AI tự động xếp vào cấp độ A1–C2 và đề xuất lộ trình học phù hợp"
BL "Có thể làm lại sau 30 ngày để kiểm tra tiến bộ"
PB

Write-Host "=== HV6: Nhóm & Hồ sơ & Giỏ hàng ==="
H1 "6. Nhóm học tập & Chat"
IMG "09_groups.png" 15.5 8 "Hình 6.1 — Danh sách nhóm học tập với nhóm công khai và riêng tư"
BL "Nhóm công khai — tham gia tự do bằng nút 'Tham gia'"
BL "Nhóm riêng tư — cần mã mời 6 ký tự từ giáo viên/trưởng nhóm"
BL "Tìm kiếm theo tên, chủ đề (Giao tiếp, Kinh doanh, Chuẩn bị VSTEP...) hoặc cấp độ"
BL "Chat thời gian thực, chia sẻ file/hình ảnh, tương tác bài đăng của giáo viên"
BL "Chia sẻ tiến độ học tập và kết quả thi trong nhóm"

H1 "7. Hồ sơ cá nhân & Thống kê học tập"
BL "Ảnh đại diện, Họ tên, Ngày sinh, Quốc tịch, Ngôn ngữ mẹ đẻ, Mục tiêu học tập"
BL "Thay đổi mật khẩu — cần nhập mật khẩu cũ để xác thực"
BL "Thống kê: Tổng giờ học, Số bài học hoàn thành, Điểm thi trung bình, Chuỗi ngày học (Streak)"
BL "Lịch sử bài thi — xem lại đáp án, điểm số, thời gian làm bài"
BL "Chứng chỉ — tải xuống PDF chứng chỉ hoàn thành khoá học"

H1 "8. Giỏ hàng & Quy trình thanh toán"
IMG "18_cart.png" 15.5 7 "Hình 8.1 — Giỏ hàng với danh sách sách, số lượng, giá và ô voucher"
BL "Bước 1: Kiểm tra danh sách sách — có thể xoá sách không muốn mua, thay đổi số lượng"
BL "Bước 2: Nhập mã voucher → nhấn 'Áp dụng' để được trừ giá"
BL "Bước 3: Nhấn 'Tiến hành thanh toán'"
BL "Bước 4: Nhập địa chỉ giao hàng: Tên người nhận, SĐT, Địa chỉ chi tiết, Phường/Xã, Quận/Huyện, Tỉnh/TP"
BL "Bước 5: Chọn phương thức vận chuyển (Tiêu chuẩn / Nhanh) — xem thời gian giao và phí"
BL "Bước 6: Chọn thanh toán: Chuyển khoản ngân hàng | MoMo | ZaloPay | VNPay | COD (nhận hàng trả tiền)"
BL "Bước 7: Kiểm tra tổng đơn hàng → nhấn 'Đặt hàng'"
BL "Bước 8: Nhận email xác nhận đơn hàng — nhấn link theo dõi trạng thái vận đơn ViettelPost"
NOTE "Đơn chuyển khoản bị huỷ tự động sau 24 giờ nếu chưa thanh toán. Yêu cầu đổi/trả sách trong 7 ngày kể từ ngày nhận."
PB

# ════════════════════════════════════════════
# PHẦN 2: GIÁO VIÊN
# ════════════════════════════════════════════
SectionBanner "PHẦN 2" "HƯỚNG DẪN DÀNH CHO GIÁO VIÊN" "Teacher Guide"
PB

Write-Host "=== GV1: Dashboard ==="
H1 "9. Cổng thông tin Giáo viên — Tổng quan"
IMG "20_teacher_dashboard.png" 15.5 8 "Hình 9.1 — Cổng thông tin Giáo viên tại /teacher"
P "Giáo viên truy cập Cổng thông tin tại /teacher — giao diện riêng biệt để quản lý toàn bộ hoạt động giảng dạy. Chỉ tài khoản được cấp quyền Teacher hoặc Admin mới truy cập được khu vực này."
NOTE "Đăng ký Giáo viên: Gửi CV, bằng cấp/chứng chỉ và video giới thiệu 2–3 phút đến teacher@mls.edu.vn. Đội ngũ MLS xét duyệt trong 5–7 ngày làm việc."

H2 "9.1 Menu điều hướng Giáo viên"
TBL @("Mục","Chức năng chính") @(
    ,@("Khoá học","Tạo mới, chỉnh sửa, quản lý khoá học và chương trình học"),
    ,@("Bài thi","Tạo đề thi VSTEP/OPIC/Tổng quát, xem kết quả học viên"),
    ,@("Ngân hàng câu hỏi","Tạo và quản lý câu hỏi theo kỹ năng, cấp độ, loại"),
    ,@("Nhóm học tập","Tạo nhóm, quản lý thành viên, đăng bài, chat"),
    ,@("Cài đặt OPIC","Cấu hình câu hỏi nói cho bài thi OPIC"),
    ,@("Bài đọc VSTEP","Quản lý đoạn văn cho bài thi VSTEP Reading")
)
PB

Write-Host "=== GV2: Tạo bài thi ==="
H1 "10. Quản lý Bài thi — Tạo đề thi chi tiết"
IMG "21_teacher_quizzes.png" 15.5 8 "Hình 10.1 — Trang quản lý bài thi với danh sách và thống kê"
P "Tính năng tạo bài thi sử dụng quy trình nhiều bước (wizard) giúp giáo viên cấu hình đầy đủ thông tin trước khi chọn câu hỏi. Hệ thống hỗ trợ ba nền tảng thi khác nhau: Standard, OPIC và VSTEP."

H2 "10.1 Quy trình tạo đề thi — 4 bước"
TBL @("Bước","Tên bước","Nội dung") @(
    ,@("Bước 0","Chọn nền tảng thi","Chọn loại: Standard (Tổng quát), OPIC (Nói), hoặc VSTEP (4 kỹ năng)"),
    ,@("Bước 1","Thông tin cơ bản","Đặt tên, mô tả, loại thi, kỹ năng, thời gian, điểm đậu và các tuỳ chọn"),
    ,@("Bước 2","Chọn câu hỏi","Tìm kiếm và chọn câu hỏi từ ngân hàng câu hỏi"),
    ,@("Bước 3","Xác nhận","Xem lại toàn bộ thông tin và xác nhận tạo đề")
)

H4 "Bước 0: Chọn nền tảng thi"
TBL @("Nền tảng","Màu nhận diện","Loại bài thi hỗ trợ","Mục đích") @(
    ,@("Standard","Xanh dương nhạt","PracticeQuiz, MidtermQuiz, FinalQuiz","Bài tập, Kiểm tra giữa kỳ, Cuối kỳ"),
    ,@("OPIC","Xanh lá","OPICMockTest, OPICMiniTest","Thi Nói — AI chấm điểm Speaking"),
    ,@("VSTEP","Cam","VSTEPFullTest, VSTEPListeningTest, VSTEPReadingTest, VSTEPWritingTest","Thi chuẩn hoá Bộ GD&ĐT")
)

H4 "Bước 1: Thông tin cơ bản — Chi tiết từng trường"
TBL @("Trường","Kiểu nhập","Bắt buộc","Mô tả chi tiết") @(
    ,@("Tên bài thi","Ô văn bản","Có","Tiêu đề hiển thị cho học viên. VD: Kiểm tra giữa kỳ B2 - Tháng 6"),
    ,@("Mô tả","Textarea","Không","Hướng dẫn cho học viên về nội dung và cách làm bài"),
    ,@("Loại bài thi","Danh sách thả xuống","Có","Tuỳ theo nền tảng đã chọn ở Bước 0 (xem bảng bên dưới)"),
    ,@("Kỹ năng kiểm tra","Danh sách thả xuống","Không","Reading | Listening | Speaking | Writing | Grammar | Vocabulary | Mixed"),
    ,@("Thời gian làm bài","Số (phút)","Có","Tối thiểu 1 phút. VD: 45 phút cho kiểm tra giữa kỳ"),
    ,@("Điểm đậu (%)","Số từ 0–100","Có","Mặc định 70%. Học viên đạt từ ngưỡng này mới được coi là vượt qua"),
    ,@("Trộn thứ tự câu hỏi","Checkbox","—","Mặc định: Bật. Mỗi học viên nhận thứ tự câu hỏi ngẫu nhiên khác nhau"),
    ,@("Hiện đáp án sau thi","Checkbox","—","Mặc định: Bật. Học viên xem đáp án đúng/sai ngay sau khi nộp bài")
)
AddSP
P "Các loại bài thi theo nền tảng:"
TBL @("Nền tảng","Loại thi (Giá trị)","Tên hiển thị") @(
    ,@("Standard","PracticeQuiz","Bài tập luyện"),
    ,@("Standard","MidtermQuiz","Kiểm tra giữa kỳ"),
    ,@("Standard","FinalQuiz","Kiểm tra cuối kỳ"),
    ,@("OPIC","OPICMockTest","Thi thử OPIC đầy đủ"),
    ,@("OPIC","OPICMiniTest","OPIC Mini (bài ngắn)"),
    ,@("VSTEP","VSTEPFullTest","VSTEP Đầy đủ 4 kỹ năng"),
    ,@("VSTEP","VSTEPListeningTest","VSTEP — Nghe"),
    ,@("VSTEP","VSTEPReadingTest","VSTEP — Đọc"),
    ,@("VSTEP","VSTEPWritingTest","VSTEP — Viết")
)

H4 "Bước 2: Chọn câu hỏi từ Ngân hàng"
BL "Ô tìm kiếm — lọc câu hỏi theo từ khoá trong nội dung"
BL "Bộ lọc Loại câu hỏi — Single Choice, Multiple Choice, Fill Blank, True/False..."
BL "Đánh dấu chọn nhiều câu hỏi cùng lúc bằng checkbox"
BL "Thứ tự hiển thị tự động theo thứ tự chọn — có thể kéo thả để thay đổi"
NOTE "Nên chọn câu hỏi cùng kỹ năng và cấp độ CEFR với loại bài thi để đảm bảo tính nhất quán."

H4 "Bước 3: Xác nhận"
BL "Xem lại toàn bộ thông tin: tên, loại thi, số câu, thời gian, điểm đậu"
BL "Nhấn 'Tạo bài thi' để lưu — đề thi được tạo với trạng thái Nháp"
BL "Sau khi tạo, truy cập trang chỉnh sửa để bổ sung thêm câu hỏi hoặc cấu hình OPIC/VSTEP"

H2 "10.2 Chỉnh sửa bài thi — 4 tab"
H4 "Tab Cài đặt (Settings)"
BL "Chỉnh sửa tất cả thông tin đã nhập ở Bước 1: tên, mô tả, loại thi, kỹ năng, thời gian, điểm đậu"
BL "Bật/tắt Trộn câu hỏi và Hiện đáp án sau thi bất kỳ lúc nào"
BL "Nhấn 'Lưu thay đổi' để cập nhật"

H4 "Tab Câu hỏi (Questions)"
BL "Xem danh sách câu hỏi hiện có trong đề — số thứ tự, nội dung (rút gọn), loại, điểm"
BL "Thêm câu hỏi mới từ ngân hàng — tìm kiếm và chọn tương tự Bước 2"
BL "Xoá câu hỏi khỏi đề (không xoá khỏi ngân hàng)"
BL "Kéo thả để sắp xếp lại thứ tự câu hỏi"

H4 "Tab OPIC (chỉ với bài thi OPIC)"
P "Tab này cấu hình chi tiết từng câu hỏi nói cho bài thi OPIC. Mỗi câu hỏi Speaking cần thiết lập thêm các thông số đặc biệt:"
TBL @("Trường OPIC","Kiểu nhập","Các tuỳ chọn / Mô tả") @(
    ,@("Loại câu OPIC (Tag)","Danh sách thả xuống","orientation (Giới thiệu bản thân) | describe (Mô tả) | routine (Thói quen) | experience (Trải nghiệm) | roleplay (Nhập vai) | question-asking (Đặt câu hỏi)"),
    ,@("URL file âm thanh gợi ý","Ô văn bản URL","Đường dẫn file audio chứa câu hỏi/chủ đề cho học viên nghe trước khi trả lời"),
    ,@("Thời gian ghi âm (giây)","Số từ 15–300","Thời gian học viên có để suy nghĩ và ghi âm câu trả lời. Mặc định: 120 giây"),
    ,@("Số lần nghe lại audio","1 / 2 / 3","Học viên được nghe lại câu hỏi âm thanh tối đa bao nhiêu lần trước khi trả lời")
)

H4 "Tab Bài đọc VSTEP (chỉ với VSTEP)"
BL "Thêm đoạn văn (Passage) làm cơ sở cho các câu hỏi đọc hiểu"
BL "Mỗi passage gồm: Tiêu đề, Nội dung văn bản, Nguồn tham khảo (tuỳ chọn)"
BL "Liên kết câu hỏi Reading với passage tương ứng"
BL "Học viên đọc passage, sau đó trả lời các câu hỏi liên quan"

H2 "10.3 Xem kết quả & Thống kê bài thi"
BL "Điểm trung bình cả lớp — theo từng đề thi"
BL "Phân bố điểm — biểu đồ histogram số học viên theo từng khoảng điểm"
BL "Câu hỏi học viên hay sai nhất — giúp điều chỉnh nội dung giảng dạy"
BL "Danh sách học viên đã thi — điểm, thời gian nộp, số lần thi"
PB

Write-Host "=== GV3: Câu hỏi ==="
H1 "11. Ngân hàng câu hỏi — Tạo & Quản lý câu hỏi"
IMG "22_teacher_questions.png" 15.5 8 "Hình 11.1 — Ngân hàng câu hỏi với bộ lọc theo kỹ năng, cấp độ và loại câu hỏi"
P "Ngân hàng câu hỏi là kho lưu trữ tập trung tất cả câu hỏi của giáo viên. Câu hỏi được phân loại chi tiết và tái sử dụng linh hoạt trong nhiều đề thi khác nhau."

H2 "11.1 Tạo câu hỏi mới — Thông tin chung"
P "Nhấn nút 'Tạo câu hỏi mới' để mở form. Form được chia thành hai phần: Thông tin câu hỏi (áp dụng cho mọi loại) và Đáp án (phụ thuộc vào loại câu hỏi được chọn)."
TBL @("Trường","Kiểu nhập","Bắt buộc","Mô tả & Ví dụ") @(
    ,@("Nội dung câu hỏi","Textarea","Có","Câu hỏi hiển thị cho học viên. VD: 'Chọn từ điền vào chỗ trống: Tôi _____ cà phê mỗi sáng.'"),
    ,@("Loại câu hỏi","Danh sách thả xuống","Có","Xem bảng loại câu hỏi chi tiết bên dưới"),
    ,@("Kỹ năng","Danh sách thả xuống","Có","Reading | Listening | Speaking | Writing | Grammar | Vocabulary | Mixed"),
    ,@("Độ khó","Danh sách thả xuống","Có","Dễ (xanh lá) | Trung bình (cam) | Khó (đỏ)"),
    ,@("Điểm","Số (bước 0.1)","Có","Số điểm cho câu hỏi này. Mặc định: 1.0 điểm. Có thể nhập 0.5, 1.5, 2.0..."),
    ,@("Tags","Ô văn bản","Không","Từ khoá phân loại, cách nhau bằng dấu phẩy. VD: B1, động từ, thì hiện tại"),
    ,@("Giải thích đáp án","Textarea","Không","Giải thích tại sao đáp án này đúng — hiển thị cho học viên sau khi nộp bài")
)

H2 "11.2 Các loại câu hỏi và cách tạo đáp án"
H4 "Loại 1: Một đáp án (Single Choice)"
P "Học viên chọn DUY NHẤT một đáp án đúng trong 4 lựa chọn. Đây là loại phổ biến nhất cho bài thi ngữ pháp và từ vựng."
BL "Form tự động tạo sẵn 4 ô nhập đáp án — có thể thêm bớt (tối thiểu 2 đáp án)"
BL "Đánh dấu radio button bên cạnh đáp án đúng — chỉ chọn được 1 đáp án đúng"
BL "Điền nội dung vào từng ô đáp án (A, B, C, D)"
BL "Nếu muốn xoá đáp án: nhấn nút X ở cuối hàng (không thể xoá khi chỉ còn 2 đáp án)"
NOTE "Ví dụ: Câu hỏi 'Chọn từ đúng: Tôi _____ học tiếng Việt.' → A: đang (đúng) | B: đã | C: sẽ | D: hay"

H4 "Loại 2: Nhiều đáp án (Multiple Choice)"
P "Học viên chọn TẤT CẢ các đáp án đúng. Dùng khi câu hỏi có nhiều đáp án đúng cùng lúc."
BL "Tương tự Single Choice nhưng sử dụng checkbox thay vì radio button"
BL "Có thể đánh dấu nhiều ô là đáp án đúng cùng lúc"
BL "Học viên phải chọn đúng tất cả các đáp án đúng mới được điểm tối đa"
NOTE "Ví dụ: 'Những từ nào là danh từ?' → A: sách (đúng) | B: đọc | C: bàn (đúng) | D: đẹp"

H4 "Loại 3: Đúng/Sai (True/False)"
P "Học viên phán đoán nhận định là Đúng hay Sai. Dùng cho câu hỏi đọc hiểu hoặc kiểm tra kiến thức."
BL "Form tự động tạo 2 đáp án cố định: 'Đúng' và 'Sai'"
BL "Đánh dấu radio button vào đáp án đúng (Đúng hoặc Sai)"

H4 "Loại 4: Điền vào chỗ trống (Fill in the Blank)"
P "Học viên gõ trực tiếp từ/cụm từ vào ô trống. Không có danh sách đáp án lựa chọn. Dùng để kiểm tra từ vựng chính xác."
BL "Không hiển thị ô nhập đáp án — thay vào đó là ô nhập 'Đáp án đúng'"
BL "Nhập từ/cụm từ chính xác mà học viên cần điền — hệ thống so sánh tự động"
BL "Có thể nhập nhiều đáp án chấp nhận được, ngăn cách bằng dấu | (pipe)"
NOTE "Ví dụ: Câu hỏi 'Hà Nội là _____ của Việt Nam.' → Đáp án: thủ đô | Thủ đô"

H4 "Loại 5: Nối đôi (Matching)"
P "Học viên nối các cặp đáp án tương ứng ở hai cột (VD: từ tiếng Việt ↔ nghĩa tiếng Anh)."
BL "Mỗi hàng là một cặp: Ô trái (cột A) và Ô phải (cột B)"
BL "Nhập nội dung vào cả hai ô, đánh dấu cặp nào là khớp đúng"
BL "Hệ thống xáo trộn cột B khi hiển thị cho học viên"
NOTE "Ví dụ: 'sách' ↔ 'book', 'bút' ↔ 'pen', 'bàn' ↔ 'table'"

H4 "Loại 6: Sắp xếp thứ tự (Ordering)"
P "Học viên kéo thả để sắp xếp các mục vào đúng thứ tự. Dùng để kiểm tra ngữ pháp câu hoặc thứ tự sự kiện."
BL "Nhập các mục vào từng ô đáp án"
BL "Thứ tự đáp án chính xác = thứ tự hiển thị trong form (từ trên xuống dưới)"
BL "Hệ thống xáo trộn ngẫu nhiên khi hiển thị cho học viên"
NOTE "Ví dụ: Sắp xếp câu: [học] [tôi] [tiếng Việt] [đang] → Đúng: Tôi đang học tiếng Việt"

H2 "11.3 Bộ lọc và tìm kiếm ngân hàng câu hỏi"
TBL @("Bộ lọc","Các tuỳ chọn","Tác dụng") @(
    ,@("Tìm kiếm văn bản","Nhập từ khoá","Lọc câu hỏi có chứa từ khoá trong nội dung"),
    ,@("Loại câu hỏi","Single Choice, Multiple Choice, True/False, Fill Blank, Matching, Ordering","Chỉ hiển thị câu hỏi loại được chọn"),
    ,@("Độ khó","Dễ | Trung bình | Khó","Lọc theo mức độ khó"),
    ,@("Kỹ năng","Reading | Listening | Speaking | Writing | Grammar | Vocabulary | Mixed","Lọc theo kỹ năng kiểm tra")
)
BL "Mỗi trang hiển thị 25 câu hỏi — dùng nút điều hướng trang ở cuối danh sách"
BL "Cột hiển thị: Nội dung (rút gọn 100 ký tự), Loại, Kỹ năng, Độ khó (badge màu), Điểm, Ngày tạo"
BL "Nút Sửa (bút chì) — mở form chỉnh sửa câu hỏi"
BL "Nút Xoá (thùng rác) — xoá câu hỏi (hiện hộp xác nhận trước khi xoá)"
PB

Write-Host "=== GV4: Khoá học ==="
H1 "12. Quản lý Khoá học — Tạo & Chỉnh sửa"
P "Giáo viên có thể tạo khoá học mới và quản lý toàn bộ nội dung từ trang Khoá học trong Teacher Portal. Sau khi hoàn thiện, khoá học được gửi lên Admin để duyệt trước khi đăng công khai."

H2 "12.1 Tạo khoá học mới"
BL "Nhấn nút 'Tạo khoá học mới' trên trang danh sách khoá học"
BL "Điền các thông tin cơ bản trong form tạo nhanh (có thể bổ sung chi tiết sau)"
BL "Sau khi tạo, hệ thống chuyển đến trang chỉnh sửa đầy đủ với 6 tab"

H2 "12.2 Form khoá học — Tab Thông tin (Info)"
TBL @("Trường","Kiểu nhập","Bắt buộc","Mô tả chi tiết") @(
    ,@("Tên khoá học","Ô văn bản","Có","Tiêu đề đầy đủ, rõ ràng. VD: Tiếng Việt cho người mới bắt đầu — Cấp độ A1"),
    ,@("Mã khoá học","Ô văn bản","Không","Mã nội bộ để quản lý. VD: VN-A1-2026"),
    ,@("Mô tả ngắn","Textarea","Không","Tối đa 200 ký tự — hiển thị dưới tiêu đề trong danh sách khoá học"),
    ,@("Mô tả đầy đủ","RichText Editor","Không","Mô tả chi tiết với định dạng phong phú: in đậm, in nghiêng, danh sách, link"),
    ,@("Cấp độ","Danh sách thả xuống","Có","A1 | A2 | B1 | B2 | C1 | C2 (tải từ API learningLevels)"),
    ,@("Ngôn ngữ giảng dạy","Danh sách thả xuống","Có","🇻🇳 VI (Tiếng Việt) | 🇬🇧 EN (English)"),
    ,@("Thời lượng","Số (giờ)","Không","Tổng thời lượng ước tính của toàn bộ khoá học"),
    ,@("Tags","Ô văn bản","Không","Từ khoá phân loại, cách nhau bằng dấu phẩy. VD: A1, người mới, giao tiếp, CEFR"),
    ,@("Mục tiêu học tập","Danh sách mục","Không","'Những gì bạn sẽ học' — nhập từng mục rồi nhấn Enter để thêm"),
    ,@("Yêu cầu","Danh sách mục","Không","Kiến thức/kỹ năng cần có trước khi học — nhập từng mục rồi nhấn Enter"),
    ,@("Đối tượng học","Danh sách mục","Không","Khoá học này dành cho ai — nhập từng mục rồi nhấn Enter"),
    ,@("Giáo viên phụ trách","Dropdown tìm kiếm","Có","Tìm theo tên hoặc email — hiển thị cả Họ tên & Email để tránh nhầm lẫn"),
    ,@("Slug (đường dẫn)","Ô văn bản (read-only)","—","Tự động sinh từ tên khoá học. VD: /courses/tieng-viet-nguoi-moi-bat-dau-a1")
)

H2 "12.3 Form khoá học — Tab Hình ảnh (Media)"
TBL @("Trường","Mô tả","Ghi chú") @(
    ,@("Ảnh thumbnail","Upload file ảnh hoặc nhập URL trực tiếp","Ảnh hiển thị trong thẻ khoá học ở trang danh sách. Kích thước chuẩn: 320×180px"),
    ,@("Ảnh banner","Upload file ảnh hoặc nhập URL trực tiếp","Ảnh nền lớn hiển thị ở đầu trang chi tiết khoá học. Kích thước chuẩn: 1200×400px")
)
BL "Hỗ trợ kéo thả file vào khu vực upload — tự động tải lên và hiển thị xem trước"
BL "Định dạng ảnh chấp nhận: JPG, PNG, WebP, GIF"
BL "Nhấn 'Xoá ảnh' để xoá ảnh hiện tại và nhập URL mới nếu cần"

H2 "12.4 Form khoá học — Tab Giá (Price)"
BL "Đặt giá khoá học: nhập giá gốc (VND), giá khuyến mãi (nếu có) và ngày hết hạn giá khuyến mãi"
BL "Bật 'Khoá học miễn phí' (Is Free) — tự động đặt giá = 0, học viên đăng ký không cần thanh toán"
BL "Khi khoá miễn phí, các trường giá bị ẩn"

H2 "12.5 Form khoá học — Tab Cài đặt (Settings)"
TBL @("Trường","Kiểu nhập","Giá trị mặc định","Mô tả") @(
    ,@("Hiển thị","Dropdown","Public","Public (công khai) | Private (chỉ người có link)"),
    ,@("Ngày bắt đầu","Chọn ngày","(trống)","Ngày khoá học bắt đầu nhận học viên đăng ký"),
    ,@("Ngày kết thúc","Chọn ngày","(trống)","Ngày ngừng nhận đăng ký mới"),
    ,@("Cấp chứng chỉ","Checkbox","Tắt","Bật để học viên nhận chứng chỉ PDF khi hoàn thành"),
    ,@("Yêu cầu hoàn thành","Checkbox","Tắt","Bật để học viên phải hoàn thành 100% mới nhận chứng chỉ")
)

H2 "12.6 Form khoá học — Tab Chương học (Modules)"
P "Tab này quản lý cấu trúc chương trình khoá học theo phân cấp: Khoá học → Chương (Module) → Bài học (Lesson). Giáo viên xây dựng toàn bộ lộ trình học từ đây."
H4 "Tạo Chương (Module) mới"
TBL @("Trường","Bắt buộc","Mô tả") @(
    ,@("Tên chương","Có","Tiêu đề chương. VD: Chương 1 — Chào hỏi và Giới thiệu bản thân"),
    ,@("Mô tả","Không","Tóm tắt nội dung sẽ học trong chương này"),
    ,@("Ảnh đại diện chương","Không","Upload ảnh thumbnail cho chương"),
    ,@("Thời lượng ước tính","Không","Tổng thời lượng bài học trong chương (tính theo phút/giờ)")
)
BL "Nhấn 'Thêm chương' → điền form → nhấn 'Lưu' để tạo chương mới"
BL "Kéo thả icon 6 chấm ở đầu mỗi chương để thay đổi thứ tự — thứ tự được lưu tự động"
BL "Nhấn biểu tượng bút chì để chỉnh sửa thông tin chương"
BL "Nhấn biểu tượng thùng rác để xoá chương (cần xác nhận — toàn bộ bài học trong chương sẽ bị xoá)"
BL "Nhấn vào tên chương để mở rộng → xem và quản lý danh sách bài học trong chương"

H4 "Quản lý Bài học (Lesson) trong chương"
BL "Nhấn 'Thêm bài học' trong chương → điền tên bài học → nhấn 'Lưu'"
BL "Mỗi bài học bao gồm: video bài giảng, tài liệu PDF đính kèm, bài tập"
BL "Kéo thả để sắp xếp lại thứ tự bài học trong chương"

H2 "12.7 Form khoá học — Tab Bản dịch (Translations)"
BL "Hỗ trợ nhập bản dịch tên khoá học và mô tả sang tiếng Anh (en) và tiếng Hàn (ko)"
BL "Học viên chọn ngôn ngữ giao diện sẽ thấy nội dung tương ứng"

H2 "12.8 Quy trình duyệt và đăng khoá học"
TBL @("Trạng thái","Màu nhận diện","Mô tả","Hành động tiếp theo") @(
    ,@("Draft (Nháp)","Xám","Khoá học mới tạo, chưa gửi duyệt","Nhấn 'Gửi duyệt' khi hoàn thiện nội dung"),
    ,@("PendingReview (Chờ duyệt)","Cam","Đã gửi Admin, đang chờ xem xét","Chờ Admin phản hồi"),
    ,@("Published (Đã đăng)","Xanh lá","Admin đã duyệt, hiện trên trang công khai","Học viên có thể đăng ký và học"),
    ,@("Rejected (Từ chối)","Đỏ","Admin từ chối kèm lý do","Xem lý do, chỉnh sửa và gửi duyệt lại"),
    ,@("Archived (Lưu trữ)","Đỏ nhạt","Khoá học bị ẩn khỏi trang công khai","Liên hệ Admin để kích hoạt lại")
)
PB

Write-Host "=== GV5: Nhóm ==="
H1 "13. Quản lý Nhóm học tập"
BL "Tạo nhóm: Đặt tên, mô tả, chủ đề, số thành viên tối đa, loại (Công khai / Riêng tư)"
BL "Nhóm riêng tư: Tự động sinh mã mời 6 ký tự — chia sẻ cho học viên muốn mời"
BL "Duyệt yêu cầu gia nhập với nhóm riêng tư: Chấp nhận hoặc Từ chối từng yêu cầu"
BL "Đăng bài, chia sẻ tài liệu và thông báo cho toàn nhóm"
BL "Xem thống kê hoạt động: tổng tin nhắn, thành viên tích cực nhất trong tuần"
PB

# ════════════════════════════════════════════
# PHẦN 3: QUẢN TRỊ VIÊN
# ════════════════════════════════════════════
SectionBanner "PHẦN 3" "HƯỚNG DẪN DÀNH CHO QUẢN TRỊ VIÊN" "Admin Guide"
PB

Write-Host "=== AD1: Dashboard ==="
H1 "14. Bảng điều khiển Admin — Analytics"
IMG "03_admin_dashboard.png" 15.5 9 "Hình 14.1 — Bảng điều khiển Admin tại /admin với menu đầy đủ và Analytics"
P "Bảng quản trị Admin (/admin) là trung tâm điều hành toàn bộ nền tảng MLS. Quản trị viên có quyền xem, chỉnh sửa và quản lý tất cả dữ liệu trong hệ thống. Mọi thao tác Admin được ghi nhật ký đầy đủ."
NOTE "Bảo mật: Không chia sẻ thông tin đăng nhập Admin. Mỗi phiên Admin được ghi lại thời gian, địa chỉ IP và thao tác thực hiện."

H2 "14.1 Dashboard Analytics — 4 tab thống kê"
BL "Bộ lọc thời gian: 7 ngày | 30 ngày | 90 ngày gần nhất"
BL "Tab Tổng quan: Doanh thu, số đơn hàng, học viên mới đăng ký, số khoá học được đăng ký"
BL "Tab Người dùng: Biểu đồ tăng trưởng người dùng mới theo từng ngày"
BL "Tab Lượt xem: Thống kê lượt xem video bài học theo ngày và theo từng khoá học"
BL "Tab Doanh số: Biểu đồ doanh thu theo ngày, Top 10 sách bán chạy nhất, phân tích trạng thái đơn hàng"
PB

Write-Host "=== AD2: Quản lý Khoá học ==="
H1 "15. Quản lý Khoá học — Toàn diện (Admin)"
IMG "10_admin_courses.png" 15.5 8 "Hình 15.1 — Trang quản lý khoá học Admin với bộ lọc và danh sách tất cả giáo viên"
P "Admin có quyền quản lý TOÀN BỘ khoá học của tất cả giáo viên trên hệ thống — không chỉ khoá học của mình. Đây là điểm khác biệt chính so với Teacher Portal."

H2 "15.1 Tổng quan danh sách khoá học"
BL "Xem tất cả khoá học của mọi giáo viên — không giới hạn bởi quyền sở hữu"
BL "Bộ lọc trạng thái: Tất cả | Draft (Nháp) | PendingReview (Chờ duyệt) | Published (Đã đăng) | Rejected (Từ chối) | Archived (Lưu trữ)"
BL "Tìm kiếm theo tên khoá học, tên giáo viên, mã khoá"
BL "Sắp xếp theo ngày tạo, trạng thái, giá, số học viên"
BL "Nhấn 'Tạo khoá học mới' để tạo khoá học trực tiếp từ Admin (không cần qua Teacher Portal)"

H2 "15.2 Tạo khoá học mới từ Admin"
P "Form tạo nhanh gồm các trường bắt buộc, sau đó chuyển sang trang chỉnh sửa đầy đủ 6 tab. Các trường trong form tạo nhanh:"
TBL @("Trường","Kiểu nhập","Bắt buộc","Mô tả") @(
    ,@("Tên khoá học","Ô văn bản","Có","Tiêu đề đầy đủ của khoá học"),
    ,@("Mô tả ngắn","Textarea","Không","Tối đa 200 ký tự — hiển thị dưới tiêu đề trong danh sách"),
    ,@("Mô tả đầy đủ","RichText Editor","Không","Mô tả chi tiết với định dạng"),
    ,@("Cấp độ","Dropdown","Có","A1 | A2 | B1 | B2 | C1 | C2"),
    ,@("Ngôn ngữ","Dropdown","Có","VI (🇻🇳) | EN (🇬🇧)"),
    ,@("Mã khoá học","Ô văn bản","Không","Mã nội bộ tuỳ chỉnh"),
    ,@("Ảnh thumbnail","Upload/URL","Không","Ảnh đại diện 320×180px"),
    ,@("Tags","Ô văn bản","Không","Từ khoá, cách nhau bằng dấu phẩy"),
    ,@("Giá","Số (VND)","Không","Bước nhảy 1000 VND. Để 0 = miễn phí"),
    ,@("Giá khuyến mãi","Số (VND)","Không","Giá sau khi giảm — thấp hơn giá gốc"),
    ,@("Miễn phí","Checkbox","—","Bật để đặt khoá hoàn toàn miễn phí"),
    ,@("Cấp chứng chỉ","Checkbox","—","Học viên nhận chứng chỉ PDF khi hoàn thành"),
    ,@("Yêu cầu hoàn thành","Checkbox","—","Phải hoàn thành 100% mới được coi là xong"),
    ,@("Hiển thị","Dropdown","—","Public (công khai) | Private (chỉ link trực tiếp)")
)

H2 "15.3 Chỉnh sửa khoá học từ Admin — 6 Tab"
P "Admin có quyền chỉnh sửa khoá học của BẤT KỲ giáo viên nào. Nhấn vào tên khoá học trong danh sách để mở trang chỉnh sửa đầy đủ với 6 tab:"

H4 "Tab 1: Thông tin (Info)"
P "Đầy đủ các trường như mô tả trong phần Giáo viên (Mục 12.2), với thêm khả năng thay đổi Giáo viên phụ trách — Admin có thể chuyển khoá học từ giáo viên này sang giáo viên khác."

H4 "Tab 2: Hình ảnh (Media)"
BL "Upload hoặc nhập URL cho Ảnh thumbnail (320×180px) và Ảnh banner (1200×400px)"
BL "Upload qua endpoint: POST /api/v1/admin/cms/upload-thumbnail"
BL "Hỗ trợ kéo thả file — xem trước ảnh ngay sau khi tải lên"
BL "Nhấn 'Xoá' để xoá ảnh hiện tại"

H4 "Tab 3: Giá (Price)"
TBL @("Trường","Kiểu nhập","Mô tả") @(
    ,@("Giá gốc","Số (VND), bước 1000","Giá bán thông thường của khoá học"),
    ,@("Giá khuyến mãi","Số (VND), bước 1000","Giá sau khi giảm (phải thấp hơn giá gốc)"),
    ,@("Ngày hết hạn KM","Chọn ngày (YYYY-MM-DD)","Sau ngày này, giá khuyến mãi tự động hết hiệu lực"),
    ,@("Miễn phí (Is Free)","Checkbox","Bật để đặt khoá hoàn toàn miễn phí — ẩn các trường giá")
)

H4 "Tab 4: Cài đặt (Settings)"
TBL @("Trường","Kiểu nhập","Giá trị mặc định","Mô tả") @(
    ,@("Hiển thị (Visibility)","Dropdown","Public","Public = Tất cả đều thấy | Private = Chỉ người có link"),
    ,@("Ngày bắt đầu","Chọn ngày","(trống)","Ngày khoá học bắt đầu nhận đăng ký"),
    ,@("Ngày kết thúc","Chọn ngày","(trống)","Ngày ngừng nhận đăng ký mới"),
    ,@("Cấp chứng chỉ","Checkbox","Tắt","Học viên nhận chứng chỉ PDF khi hoàn thành"),
    ,@("Yêu cầu hoàn thành","Checkbox","Tắt","Phải xem hết 100% bài học mới được tính hoàn thành")
)
BL "Nút 'Xuất bản' (Publish) — chuyển trạng thái khoá học sang Published ngay lập tức"
BL "Nút 'Lưu trữ' (Archive) — ẩn khoá học khỏi trang công khai (học viên cũ vẫn truy cập được)"

H4 "Tab 5: Chương học (Modules)"
P "Admin quản lý cấu trúc chương học tương tự Giáo viên (Mục 12.6) với quyền hạn cao hơn:"
BL "Xem, tạo, sửa, xoá chương học (Module) của BẤT KỲ giáo viên nào"
BL "Kéo thả để sắp xếp lại thứ tự chương — thứ tự được lưu tự động qua API"
BL "Nhấn tên chương để mở rộng và quản lý danh sách bài học bên trong"

H4 "Tab 6: Bản dịch (Translations)"
BL "Nhập bản dịch tên khoá học và mô tả sang Tiếng Anh (en) và Tiếng Hàn (ko)"
BL "Giao diện tự chọn bản dịch phù hợp theo ngôn ngữ người dùng đang dùng"

H2 "15.4 Phê duyệt và quản lý trạng thái khoá học"
TBL @("Thao tác","Cách thực hiện","Kết quả") @(
    ,@("Duyệt khoá học","Mở khoá chờ duyệt → xem nội dung → nhấn 'Phê duyệt'","Trạng thái chuyển sang Published, khoá hiện trên trang công khai"),
    ,@("Từ chối khoá học","Nhấn 'Từ chối' → nhập lý do chi tiết → xác nhận","Trạng thái chuyển sang Rejected, GV nhận thông báo kèm lý do"),
    ,@("Lưu trữ khoá học","Mở khoá đã đăng → nhấn 'Lưu trữ' → xác nhận","Khoá bị ẩn, học viên mới không thấy; học viên cũ vẫn học được"),
    ,@("Xoá khoá học","Mở khoá → nhấn 'Xoá' → xác nhận 2 lần","Xoá vĩnh viễn toàn bộ dữ liệu khoá học — không thể khôi phục")
)
NOTE "Cảnh báo: Xoá khoá học là thao tác KHÔNG THỂ HOÀN TÁC. Đảm bảo không có học viên đang học trước khi xoá."
PB

Write-Host "=== AD3: Sách ==="
H1 "16. Quản lý Sách"
IMG "11_admin_books.png" 15.5 8 "Hình 16.1 — Trang quản lý sách với danh sách, tình trạng kho và công cụ thêm mới"
H2 "16.1 Thêm sách mới"
TBL @("Trường","Bắt buộc","Mô tả") @(
    ,@("ISBN","Không","Mã ISBN-10 hoặc ISBN-13 của sách"),
    ,@("Tiêu đề sách","Có","Tên đầy đủ của sách"),
    ,@("Tác giả","Có","Họ tên tác giả hoặc biên tập viên"),
    ,@("Nhà xuất bản","Không","Tên nhà xuất bản"),
    ,@("Năm xuất bản","Không","Năm in/xuất bản"),
    ,@("Giá bán","Có","Giá niêm yết (VND)"),
    ,@("Số trang","Không","Tổng số trang của sách"),
    ,@("Cấp độ","Không","A1 | A2 | B1 | B2 | C1 | C2 | Không áp dụng"),
    ,@("Thể loại","Không","Giáo trình | Luyện thi | Từ điển | Văn học | Khác"),
    ,@("Ảnh bìa","Có","Upload file ảnh JPG/PNG — ảnh hiển thị trong danh sách và trang chi tiết"),
    ,@("Ảnh bên trong","Không","Upload ảnh mẫu trang nội dung sách"),
    ,@("Số lượng tồn kho","Có","Số lượng sách hiện có trong kho"),
    ,@("Ngưỡng cảnh báo hết hàng","Không","Hệ thống gửi thông báo khi tồn kho xuống dưới ngưỡng này")
)
H2 "16.2 Quản lý tồn kho"
BL "Xem số lượng tồn kho hiện tại của từng sách"
BL "Cập nhật số lượng nhập kho mới — nhập số lượng và nhấn 'Cập nhật'"
BL "Đặt ngưỡng cảnh báo — hệ thống hiển thị badge đỏ khi sắp hết hàng"
BL "Ẩn sách hết hàng để không hiển thị 'Thêm vào giỏ' với học viên"
PB

Write-Host "=== AD4: Đơn hàng ==="
H1 "17. Quản lý Đơn hàng"
IMG "12_admin_orders.png" 15.5 8 "Hình 17.1 — Trang quản lý đơn hàng với bộ lọc và ô tìm kiếm"
H2 "17.1 Các trạng thái đơn hàng"
TBL @("Trạng thái","Mô tả","Hành động của Admin") @(
    ,@("Chờ xử lý (Pending)","Đơn vừa được đặt, chưa thanh toán hoặc chưa xác nhận","Xác nhận đơn hoặc huỷ nếu cần"),
    ,@("Chờ thanh toán","Khách chọn chuyển khoản, chờ nhận tiền","Xác nhận khi nhận đủ tiền vào tài khoản"),
    ,@("Đã thanh toán","Thanh toán thành công, chờ đóng gói","Chuyển sang trạng thái Đang xử lý"),
    ,@("Đang xử lý","Đang đóng gói sản phẩm","Tạo vận đơn ViettelPost và in phiếu giao hàng"),
    ,@("Hoàn thành","Khách đã nhận hàng","Không cần thêm thao tác"),
    ,@("Đã huỷ","Đơn bị huỷ bởi khách hoặc Admin","Kiểm tra và xử lý hoàn tiền nếu đã thanh toán"),
    ,@("Thất bại","Lỗi thanh toán hoặc giao hàng","Liên hệ khách để xử lý lại")
)
H2 "17.2 Tạo vận đơn ViettelPost"
BL "Mở chi tiết đơn hàng trạng thái 'Đã thanh toán' hoặc 'Đang xử lý'"
BL "Kiểm tra thông tin người nhận: Tên, SĐT, Địa chỉ đầy đủ"
BL "Nhấn 'Tạo vận đơn ViettelPost' — hệ thống tự gọi API ViettelPost"
BL "In phiếu giao hàng (label) trực tiếp từ trình duyệt"
BL "Mã vận đơn được gửi tự động qua email cho khách hàng"
H2 "17.3 Hoàn tiền (Refund)"
BL "Mở đơn hàng cần hoàn tiền"
BL "Nhấn 'Hoàn tiền' → nhập lý do hoàn tiền → nhập số tiền cần hoàn → xác nhận"
BL "Hoàn tiền được ghi vào lịch sử đơn hàng kèm thời gian và người thực hiện"
PB

Write-Host "=== AD5: Voucher ==="
H1 "18. Quản lý Voucher & Khuyến mãi"
IMG "13_admin_vouchers.png" 15.5 8 "Hình 18.1 — Trang quản lý voucher với danh sách mã đang hoạt động và lịch sử"
H2 "18.1 Tạo voucher mới"
TBL @("Trường","Kiểu nhập","Bắt buộc","Mô tả") @(
    ,@("Mã voucher","Ô văn bản hoặc Tạo ngẫu nhiên","Có","Mã học viên nhập khi thanh toán. VD: SUMMER2026 hoặc nhấn 'Tạo ngẫu nhiên'"),
    ,@("Loại giảm giá","Radio button","Có","Phần trăm (%) | Số tiền cố định (VND)"),
    ,@("Giá trị giảm","Số","Có","Nếu %, nhập 10–100. Nếu VND, nhập số tiền VD: 50000"),
    ,@("Đơn hàng tối thiểu","Số (VND)","Không","Chỉ áp dụng khi tổng đơn đạt mức tối thiểu. VD: 200000 VND"),
    ,@("Danh mục áp dụng","Dropdown/Checkbox","Không","Tất cả | Chỉ sách | Chỉ khoá học"),
    ,@("Giới hạn 1 lần/tài khoản","Checkbox","—","Mỗi tài khoản chỉ dùng voucher này 1 lần"),
    ,@("Tổng số lần sử dụng","Số","Không","Voucher hết hiệu lực sau khi đạt số lần này (0 = không giới hạn)"),
    ,@("Ngày bắt đầu","Chọn ngày","Có","Voucher bắt đầu có hiệu lực từ ngày này"),
    ,@("Ngày hết hạn","Chọn ngày","Có","Voucher không còn hiệu lực sau ngày này")
)
H2 "18.2 Theo dõi thống kê voucher"
BL "Số lần đã sử dụng / Tổng giới hạn — biết voucher còn có thể dùng bao nhiêu lần"
BL "Tổng giá trị chiết khấu đã cấp — tổng số tiền đã giảm cho học viên qua voucher này"
BL "Danh sách đơn hàng đã dùng voucher — nhấn để xem chi tiết từng đơn"
PB

Write-Host "=== AD6: Người dùng ==="
H1 "19. Quản lý Người dùng"
IMG "14_admin_users.png" 15.5 8 "Hình 19.1 — Trang quản lý người dùng với danh sách tài khoản và công cụ quản lý"
H2 "19.1 Tìm kiếm và lọc"
BL "Tìm kiếm theo email, họ tên, số điện thoại"
BL "Lọc theo vai trò: Tất cả | Student | Teacher | Content Manager | Admin | SuperAdmin"
BL "Lọc theo trạng thái: Tất cả | Đang hoạt động | Bị khoá"
H2 "19.2 Xem chi tiết người dùng"
BL "Thông tin cá nhân: Họ tên, email, SĐT, ngày sinh, quốc tịch, ngày đăng ký"
BL "Khoá học đã đăng ký — danh sách và tiến độ học tập"
BL "Lịch sử thi — điểm số, ngày thi, loại bài thi"
BL "Đơn hàng — danh sách đơn hàng đã đặt"
BL "Lịch sử đăng nhập — thời gian, thiết bị, địa chỉ IP"
H2 "19.3 Quản lý tài khoản"
TBL @("Thao tác","Cách thực hiện","Ghi chú") @(
    ,@("Phân quyền","Mở chi tiết → chọn vai trò mới từ dropdown → nhấn 'Lưu'","Student→Teacher→Admin. Cần quyền SuperAdmin để cấp Admin"),
    ,@("Khoá tài khoản","Nhấn 'Khoá' → nhập lý do → xác nhận","Tài khoản không thể đăng nhập; có thể mở lại"),
    ,@("Mở khoá tài khoản","Nhấn 'Mở khoá' → xác nhận","Tài khoản hoạt động bình thường trở lại"),
    ,@("Vô hiệu hoá vĩnh viễn","Nhấn 'Vô hiệu hoá' → xác nhận 2 lần","Không thể đăng nhập và không thể khôi phục"),
    ,@("Reset mật khẩu","Nhấn 'Reset mật khẩu' → hệ thống gửi email link đặt lại","Dùng khi user không nhận được email tự động")
)
PB

Write-Host "=== FAQ & Liên hệ ==="
H1 "20. Câu hỏi thường gặp (FAQ)"
H3 "Tôi quên mật khẩu, phải làm gì?"
P "Nhấn 'Quên mật khẩu?' dưới ô mật khẩu tại trang đăng nhập → nhập email → nhận link đặt lại (hiệu lực 1 giờ). Kiểm tra cả thư mục Spam. Nếu không nhận được sau 5 phút, thử lại hoặc liên hệ support@mls.edu.vn."
H3 "Khoá học có hết hạn không?"
P "Không. Khoá học trên MLS không có hạn truy cập — học lại bất cứ lúc nào, xem video không giới hạn. Tuy nhiên giáo viên có thể cập nhật nội dung theo thời gian."
H3 "Làm sao biết mình ở cấp độ CEFR nào?"
P "Thực hiện Kiểm tra xếp lớp (Placement Test) miễn phí tại mục 'Thi online' — 45 phút, AI phân tích và xếp bạn vào cấp A1–C2, kèm gợi ý lộ trình học phù hợp."
H3 "Chứng chỉ MLS có giá trị gì?"
P "Chứng chỉ hoàn thành khoá học MLS cấp khi đạt 100% và vượt bài kiểm tra cuối. Chứng chỉ VSTEP và OPIC được Bộ Giáo dục & Đào tạo Việt Nam công nhận chính thức."
H3 "Nhận sách sai/hỏng phải làm gì?"
P "Chụp ảnh và liên hệ support@mls.edu.vn trong 48 giờ kể từ khi nhận hàng, kèm mã đơn và ảnh minh chứng. Xử lý đổi/trả trong 3–5 ngày, MLS chịu phí vận chuyển."
H3 "Muốn trở thành Giáo viên MLS?"
P "Gửi email đến teacher@mls.edu.vn kèm CV, bằng cấp và video giới thiệu 2–3 phút. Đội ngũ xét duyệt trong 5–7 ngày làm việc và hướng dẫn kích hoạt tài khoản."
PB

H1 "21. Thông tin liên hệ & Hỗ trợ"
P "Thời gian làm việc: Thứ Hai — Thứ Sáu, 8:00 — 18:00 (giờ Hà Nội, UTC+7)."
TBL @("Kênh hỗ trợ","Địa chỉ / Thông tin","Thời gian phản hồi") @(
    ,@("Email hỗ trợ kỹ thuật","support@mls.edu.vn","Trong vòng 24 giờ làm việc"),
    ,@("Email Giáo viên","teacher@mls.edu.vn","Trong vòng 48 giờ làm việc"),
    ,@("Chat trực tuyến","Biểu tượng chat góc dưới phải website","Trong giờ làm việc: dưới 5 phút"),
    ,@("Cộng đồng học viên","Nhóm Facebook: MLS Vietnamese Learners","Giải đáp bởi cộng đồng 24/7"),
    ,@("Kênh YouTube","youtube.com/@MLSVietnamese","Video hướng dẫn miễn phí"),
    ,@("Văn phòng","Hà Nội, Việt Nam","Hẹn gặp trước qua email")
)
AddSP
$sel.ParagraphFormat.Alignment = 1; SetFont 11 $false $true $cGray "Calibri"
$sel.TypeText("— Hết tài liệu Hướng dẫn sử dụng MLS v1.0 — Tháng 6/2026 —"); $sel.TypeParagraph()
$sel.ParagraphFormat.Alignment = 0

# ════════════════════════════════════════════
# LƯU FILE
# ════════════════════════════════════════════
Write-Host "`n=== ĐANG LƯU ==="
if (Test-Path $OUT) { Remove-Item $OUT -Force }
$doc.SaveAs2($OUT, 16)
$doc.Close($false); $word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null

$info = Get-Item $OUT
Write-Host "`nHOÀN THÀNH!"
Write-Host "File  : $OUT"
Write-Host "Size  : $([math]::Round($info.Length/1MB,2)) MB"
Write-Host "Thời gian: $(Get-Date -Format 'HH:mm:ss dd/MM/yyyy')"
