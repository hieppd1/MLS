# MLS User Guide Generator v5 - Tiếng Việt có dấu, 3 vai trò
$ErrorActionPreference = "Continue"
$SS  = "D:\HiepPD\MLS\docs\user_guide\screenshots"
$OUT = "D:\HiepPD\MLS\docs\User_Guide_MLS.docx"

$cNavy    = 6240798   # #1E3A5F
$cBlue    = 15426341  # #2563EB
$cGray    = 8417899   # #6B7280
$cLightBg = 16774895  # #EFF6FF
$cWhite   = 16777215
$cBlack   = 0

Write-Host "Khởi động Word..."
$word = New-Object -ComObject Word.Application
$word.Visible = $false; $word.DisplayAlerts = 0
$doc = $word.Documents.Add()
$sel = $word.Selection

function ResetPara {
    $sel.ParagraphFormat.Alignment = 0
    $sel.ParagraphFormat.SpaceBefore = 0
    $sel.ParagraphFormat.SpaceAfter = 8
    $sel.ParagraphFormat.FirstLineIndent = 0
    $sel.ParagraphFormat.LeftIndent = 0
}
function SetFont([double]$sz,[bool]$bold=$false,[bool]$ital=$false,[int]$col=0,[string]$nm="Times New Roman") {
    $sel.Font.Name = $nm; $sel.Font.Size = $sz
    $sel.Font.Bold = $bold; $sel.Font.Italic = $ital; $sel.Font.Color = $col
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
function P([string]$t) {
    $sel.Style = $doc.Styles.Item("Normal"); SetFont 12 $false $false 0
    $sel.ParagraphFormat.Alignment = 3; $sel.ParagraphFormat.SpaceAfter = 6
    $sel.ParagraphFormat.FirstLineIndent = $word.CentimetersToPoints(1.0)
    $sel.TypeText($t); $sel.TypeParagraph()
    $sel.ParagraphFormat.FirstLineIndent = 0; $sel.ParagraphFormat.Alignment = 0
}
function BL([string]$t) {
    $sel.Style = $doc.Styles.Item("List Bullet"); SetFont 12 $false $false 0
    $sel.ParagraphFormat.SpaceAfter = 3
    $sel.TypeText($t); $sel.TypeParagraph()
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

# ===================== TRANG BÌA =====================
Write-Host "=== TRANG BÌA ==="
$sel.Style = $doc.Styles.Item("Normal"); $sel.ParagraphFormat.Alignment = 1
$sel.ParagraphFormat.SpaceBefore = 40
SetFont 80 $true $false $cNavy "Calibri"
$sel.TypeText("MLS"); $sel.TypeParagraph()
SetFont 22 $false $false $cBlue "Calibri"
$sel.ParagraphFormat.SpaceAfter = 6; $sel.TypeText("Modern Language System"); $sel.TypeParagraph()
SetFont 14 $false $false 8355711 "Calibri"
$sel.TypeText("Nền tảng học tiếng Việt trực tuyến toàn diện"); $sel.TypeParagraph()
AddSP
SetFont 36 $true $false 0 "Calibri"
$sel.ParagraphFormat.SpaceAfter = 6; $sel.TypeText("HƯỚNG DẪN SỬ DỤNG"); $sel.TypeParagraph()
SetFont 13 $false $false $cGray "Calibri"
$sel.TypeText("Phiên bản 1.0  —  Tháng 6 năm 2026"); $sel.TypeParagraph()
AddSP
IMG "01_homepage.png" 15.5 8.5 ""
AddSP
SetFont 11 $false $true $cGray "Calibri"; $sel.ParagraphFormat.Alignment = 1
$sel.TypeText("Tài liệu này hướng dẫn sử dụng đầy đủ hệ thống MLS cho ba nhóm người dùng: Học viên, Giáo viên và Quản trị viên.")
$sel.TypeParagraph(); $sel.ParagraphFormat.Alignment = 0
PB

# ===================== GIỚI THIỆU =====================
Write-Host "=== GIỚI THIỆU ==="
H1 "GIỚI THIỆU HỆ THỐNG MLS"
P "MLS (Modern Language System) là nền tảng học tiếng Việt trực tuyến tích hợp công nghệ AI, được thiết kế theo khung năng lực ngoại ngữ quốc tế CEFR với 6 cấp độ từ A1 (Sơ cấp) đến C2 (Thành thạo). Hệ thống phục vụ ba nhóm người dùng chính với giao diện và chức năng riêng biệt."

H2 "Các vai trò trong hệ thống"
TBL @("Vai trò","Mô tả","Quyền hạn chính") @(
    ,@("Học viên (Student)","Người học tiếng Việt, đăng ký và học các khoá học","Học, thi, mua sách, tham gia nhóm"),
    ,@("Giáo viên (Teacher)","Giảng viên tạo nội dung khoá học và quản lý bài thi","Tạo khoá học, soạn đề thi, quản lý nhóm"),
    ,@("Quản trị viên (Admin)","Nhân viên vận hành và quản lý toàn bộ hệ thống","Toàn quyền quản lý hệ thống")
)
H2 "Yêu cầu kỹ thuật"
TBL @("Thành phần","Yêu cầu tối thiểu","Khuyến nghị") @(
    ,@("Trình duyệt web","Chrome 90+, Firefox 88+, Edge 90+, Safari 14+","Chrome phiên bản mới nhất"),
    ,@("Kết nối Internet","5 Mbps (xem video), 1 Mbps (văn bản)","20 Mbps trở lên"),
    ,@("Màn hình","1280 x 720 pixels","1920 x 1080 pixels"),
    ,@("Thiết bị mobile","iOS 14+ / Android 8+","iOS 16+ / Android 12+")
)
H2 "Thông tin tài khoản thử nghiệm"
TBL @("Vai trò","Email đăng nhập","Mật khẩu") @(
    ,@("Quản trị viên","admin01@gmail.com","123@123aA"),
    ,@("Giáo viên","teacher01@gmail.com","123@123aA"),
    ,@("Học viên","student01@gmail.com","123@123aA")
)
PB

# ╔══════════════════════════════════════════════════════╗
# ║           PHẦN 1: HỌC VIÊN                          ║
# ╚══════════════════════════════════════════════════════╝
$sel.Style = $doc.Styles.Item("Normal"); $sel.ParagraphFormat.Alignment = 1
$sel.ParagraphFormat.SpaceBefore = 60; $sel.ParagraphFormat.SpaceAfter = 10
SetFont 40 $true $false $cNavy "Calibri"
$sel.TypeText("PHẦN 1"); $sel.TypeParagraph()
SetFont 24 $false $false $cBlue "Calibri"
$sel.TypeText("HƯỚNG DẪN DÀNH CHO HỌC VIÊN"); $sel.TypeParagraph()
SetFont 13 $false $true $cGray "Calibri"
$sel.TypeText("Student Guide"); $sel.TypeParagraph()
$sel.ParagraphFormat.Alignment = 0; ResetPara
PB

# CH1 - ĐĂNG KÝ & ĐĂNG NHẬP
Write-Host "=== CH1 - Học viên: Đăng ký ==="
H1 "1. Đăng ký tài khoản & Đăng nhập"
P "Để sử dụng đầy đủ các tính năng của MLS, học viên cần tạo tài khoản cá nhân. Quá trình đăng ký hoàn toàn miễn phí và chỉ mất vài phút. Hệ thống hỗ trợ đăng nhập bằng email/mật khẩu hoặc tài khoản Google."

H2 "1.1 Đăng ký tài khoản mới"
IMG "16_register.png" 15.5 10 "Hình 1.1 — Trang đăng ký tài khoản MLS dành cho học viên mới"
P "Truy cập trang đăng ký tại /register hoặc nhấn nút 'Đăng ký' trên trang chủ. Điền đầy đủ các thông tin theo yêu cầu."
BL "Họ và tên đầy đủ — sẽ hiển thị trong hồ sơ và chứng chỉ hoàn thành khoá học"
BL "Địa chỉ email hợp lệ — dùng để đăng nhập và nhận thông báo"
BL "Mật khẩu mạnh: tối thiểu 8 ký tự, có chữ hoa, chữ thường và số (ví dụ: MyPass123)"
BL "Xác nhận lại mật khẩu để tránh nhập sai"
BL "Nhấn 'Đăng ký' — hệ thống gửi email xác nhận đến địa chỉ email vừa nhập"
BL "Mở email và nhấn link kích hoạt để hoàn tất đăng ký (link có hiệu lực 24 giờ)"
NOTE "Lưu ý: Nếu không nhận được email xác nhận sau 5 phút, kiểm tra thư mục Spam/Junk hoặc nhấn 'Gửi lại email xác nhận' trên trang đăng ký."

H2 "1.2 Đăng nhập"
IMG "02_login_page.png" 15.5 10 "Hình 1.2 — Trang đăng nhập MLS với form nhập email/mật khẩu và tuỳ chọn đăng nhập Google"
IMG "02b_login_filled.png" 15.5 10 "Hình 1.3 — Form đăng nhập đã được điền thông tin, sẵn sàng nhấn nút Đăng nhập"
BL "Bước 1: Truy cập địa chỉ website MLS trên trình duyệt"
BL "Bước 2: Nhấn nút 'Đăng nhập' ở góc phải trên cùng của trang chủ"
BL "Bước 3: Nhập địa chỉ Email đã đăng ký vào ô 'Email'"
BL "Bước 4: Nhập mật khẩu vào ô 'Mật khẩu' (mật khẩu được ẩn bằng dấu chấm)"
BL "Bước 5: Nhấn nút 'Đăng nhập' màu xanh để xác nhận"
BL "Bước 6: Nếu thành công, hệ thống tự động chuyển đến trang chủ học viên"
NOTE "Nếu quên mật khẩu: nhấn liên kết 'Quên mật khẩu?' ngay dưới ô nhập mật khẩu. Hệ thống gửi email hướng dẫn đặt lại mật khẩu — link có hiệu lực trong 1 giờ."

H2 "1.3 Đăng nhập bằng Google"
P "Nhấn nút 'Tiếp tục với Google', chọn tài khoản Google muốn sử dụng, xác nhận cấp quyền cho MLS truy cập thông tin cơ bản (họ tên, email, ảnh đại diện). Hệ thống tự động tạo tài khoản MLS liên kết với Google Account — không cần nhớ thêm mật khẩu mới."
PB

# CH2 - TRANG CHỦ
Write-Host "=== CH2 - Học viên: Trang chủ ==="
H1 "2. Trang chủ — Khám phá nội dung học tập"
IMG "04_homepage_loggedin.png" 15.5 9 "Hình 2.1 — Trang chủ MLS sau khi đăng nhập với giao diện video bài học theo phong cách TikTok"
P "Trang chủ MLS là trung tâm điều hướng và khám phá nội dung. Sau khi đăng nhập, học viên thấy giao diện hiện đại với luồng video bài học ngắn — cuộn lên/xuống để khám phá nội dung mới từ các giáo viên đang theo dõi."

H2 "2.1 Bố cục trang chủ"
BL "Sidebar trái: Điều hướng nhanh — Bài học mới nhất, Khoá học đã kích hoạt, Nhóm của tôi, Người đang theo dõi, Bài đã lưu, Bài đã thích, Danh sách bạn bè"
BL "Khu vực trung tâm: Luồng video bài học ngắn (TikTok-style). Mỗi video hiển thị tên bài, giáo viên, số lượt xem và nút tương tác (Thích, Lưu, Chia sẻ, Bình luận)"
BL "Sidebar phải: Thống kê nhanh (tin nhắn chưa đọc, thông báo), danh sách Giáo viên nổi bật, Khoá học được đề xuất dựa trên sở thích và lịch sử học"

H2 "2.2 Thanh điều hướng chính"
BL "Logo MLS — nhấn để quay về trang chủ từ bất kỳ trang nào"
BL "Menu chính: Trang chủ | Khoá học | Sách | Thi online | Nhóm"
BL "Ô tìm kiếm toàn cục — tìm khoá học, giáo viên, bài thi, sách bằng từ khoá"
BL "Biểu tượng Giỏ hàng — hiển thị số lượng sách đang chờ thanh toán"
BL "Chuông thông báo — nhận thông báo về bài học mới, kết quả thi, đơn hàng"
BL "Avatar người dùng — truy cập nhanh hồ sơ, cài đặt, đăng xuất"
BL "Chọn ngôn ngữ — chuyển đổi giữa Tiếng Việt và English"
PB

# CH3 - KHOÁ HỌC
Write-Host "=== CH3 - Học viên: Khoá học ==="
H1 "3. Khoá học — Tìm kiếm, Đăng ký & Học tập"
IMG "05_courses_list.png" 15.5 10 "Hình 3.1 — Trang danh sách khoá học với hệ thống lọc theo cấp độ, giá, đánh giá và chủ đề"
P "Khoá học là tính năng cốt lõi của MLS. Hệ thống có hàng chục khoá học tiếng Việt được biên soạn bởi đội ngũ giáo viên chuyên nghiệp, bao phủ tất cả 6 cấp độ CEFR và nhiều chủ đề chuyên ngành: giao tiếp hàng ngày, kinh doanh, lịch sử văn hoá Việt Nam."

H2 "3.1 Khám phá danh sách khoá học"
BL "Lọc theo cấp độ CEFR: A1 (Sơ cấp), A2 (Cơ bản), B1 (Trung cấp sơ), B2 (Trung cấp), C1 (Cao cấp), C2 (Thành thạo)"
BL "Lọc theo chủ đề: Giao tiếp, Kinh doanh & Thương mại, Du lịch, Văn hoá Việt Nam, Luyện thi VSTEP"
BL "Sắp xếp theo: Mới nhất, Phổ biến nhất, Đánh giá cao nhất, Giá thấp đến cao, Giá cao đến thấp"
BL "Lọc theo giá: Miễn phí, Có phí, Tất cả"

H2 "3.2 Xem chi tiết khoá học"
IMG "06_course_detail.png" 15.5 10 "Hình 3.2 — Trang chi tiết khoá học với thông tin đầy đủ về nội dung, giáo viên và nút đăng ký"
IMG "06b_course_detail_scroll.png" 15.5 9 "Hình 3.3 — Nội dung chi tiết chương trình học sau khi cuộn xuống"
BL "Video giới thiệu khoá học — xem trước nội dung và phong cách giảng dạy"
BL "Mô tả tổng quan — mục tiêu học tập, đối tượng phù hợp, kiến thức cần có trước"
BL "Nội dung chương trình — danh sách đầy đủ các chương và bài học (có thể xem preview một số bài miễn phí)"
BL "Thông tin giáo viên — hồ sơ, kinh nghiệm, chứng chỉ giảng dạy"
BL "Đánh giá & Nhận xét — điểm trung bình và các đánh giá chi tiết từ học viên"
BL "Thông tin đăng ký — giá khoá học, chính sách hoàn tiền, thời hạn truy cập"

H2 "3.3 Đăng ký khoá học"
BL "Khoá học miễn phí: Nhấn 'Đăng ký học miễn phí' → Bắt đầu học ngay lập tức"
BL "Khoá học có phí: Nhấn 'Thêm vào giỏ hàng' → Thanh toán → Nhận quyền truy cập vĩnh viễn"
BL "Sau đăng ký: Khoá học xuất hiện trong mục 'Khoá học của tôi' để tiếp tục học bất cứ lúc nào"

H2 "3.4 Khoá học của tôi"
IMG "19_my_courses.png" 15.5 8 "Hình 3.4 — Trang Khoá học của tôi hiển thị tất cả khoá học đã đăng ký cùng tiến độ học tập"
BL "Thanh tiến độ học tập (%) cho từng khoá — biết ngay đã hoàn thành bao nhiêu phần trăm"
BL "Bài học tiếp theo được đề xuất dựa trên vị trí hiện tại trong khoá"
BL "Thời gian học gần nhất — giúp tiếp tục từ chỗ đã dừng"
BL "Chứng chỉ hoàn thành — tải xuống PDF khi đạt 100% khoá học và vượt qua bài kiểm tra cuối"

H2 "3.5 Bài học mới được cập nhật"
IMG "23_my_lesson.png" 15.5 8 "Hình 3.5 — Trang bài học mới nhất từ các khoá học đã đăng ký, sắp xếp theo thời gian"
P "Tính năng 'Bài học mới' tổng hợp tất cả bài học vừa được giáo viên cập nhật từ các khoá học đã đăng ký, sắp xếp theo thời gian — bài mới nhất ở trên cùng. Học viên không bỏ lỡ bất kỳ nội dung học nào."
PB

# CH4 - SÁCH
Write-Host "=== CH4 - Học viên: Sách ==="
H1 "4. Sách — Cửa hàng sách tiếng Việt"
IMG "07_books_list.png" 15.5 10 "Hình 4.1 — Cửa hàng sách MLS với danh mục đa dạng, tính năng lọc và tìm kiếm"
P "MLS tích hợp một cửa hàng sách tiếng Việt trực tuyến đa dạng, cung cấp sách giáo trình, sách luyện thi, từ điển và tài liệu học tập chính thống. Sách được giao tận nhà qua dịch vụ ViettelPost trên toàn quốc."

H2 "4.1 Khám phá danh mục sách"
BL "Duyệt theo thể loại: Sách giáo trình (theo cấp độ CEFR), Sách luyện thi VSTEP & OPIC, Từ điển Việt-Anh/Anh-Việt, Văn học & Truyện tiếng Việt, Sách doanh nhân"
BL "Lọc theo cấp độ CEFR phù hợp với trình độ hiện tại"
BL "Sắp xếp theo: Bán chạy nhất, Mới nhất, Đánh giá cao, Giá từ thấp đến cao"

H2 "4.2 Trang chi tiết sách"
IMG "07b_book_detail.png" 15.5 9 "Hình 4.2 — Trang chi tiết sách với mô tả đầy đủ, thông tin tác giả, mục lục và nút thêm vào giỏ hàng"
BL "Hình ảnh bìa sách chất lượng cao (có thể phóng to) và các hình ảnh bên trong"
BL "Mô tả chi tiết: nội dung, đối tượng đọc giả, cấp độ phù hợp, số trang, nhà xuất bản"
BL "Mục lục (Table of Contents) — xem trước cấu trúc và nội dung các chương"
BL "Thông tin tác giả/biên tập viên với hồ sơ chuyên môn"
BL "Đánh giá và nhận xét chi tiết từ người đọc đã mua sách"
BL "Tình trạng kho hàng: Còn hàng (số lượng), Sắp về hàng, Hết hàng"
BL "Nút 'Thêm vào giỏ hàng' — thêm sách vào giỏ để thanh toán sau"
BL "Nút 'Mua ngay' — chuyển thẳng đến trang thanh toán"
NOTE "Lưu ý giao hàng: ViettelPost giao đến tất cả 63 tỉnh thành toàn quốc. Thời gian giao: Nội thành 1–2 ngày làm việc, Ngoại tỉnh 3–5 ngày làm việc. Phí vận chuyển tính theo khu vực và cân nặng."
PB

# CH5 - THI ONLINE
Write-Host "=== CH5 - Học viên: Thi online ==="
H1 "5. Thi online — VSTEP, OPIC & Kiểm tra xếp lớp"
IMG "08_quiz_list.png" 15.5 8 "Hình 5.1 — Trang danh sách bài thi online với bộ lọc theo loại thi và bảng xếp hạng bên phải"
P "Hệ thống thi online của MLS được thiết kế theo chuẩn quốc tế, hỗ trợ nhiều loại bài thi khác nhau từ kiểm tra ngữ pháp thông thường đến các kỳ thi được Bộ Giáo dục & Đào tạo Việt Nam công nhận."

H2 "5.1 Các loại bài thi"
TBL @("Loại thi","Mô tả","Kỹ năng kiểm tra","Chứng chỉ") @(
    ,@("Tổng quát","Kiểm tra ngữ pháp, từ vựng và kỹ năng đọc hiểu theo cấp độ CEFR","Đọc, Ngữ pháp, Từ vựng","Không"),
    ,@("OPIC","Oral Proficiency Interview — AI phân tích âm thanh và chấm điểm theo tiêu chí CEFR","Kỹ năng Nói (Speaking)","Có (OPIC Certificate)"),
    ,@("VSTEP","Vietnamese Standardized Test — chuẩn hoá quốc gia, 4 kỹ năng đầy đủ theo khung CEFR B1–C1","Nghe, Đọc, Viết, Nói","Có (VSTEP Certificate)"),
    ,@("Live Exam","Bài thi trực tiếp do giáo viên tổ chức theo thời gian thực. Học viên tham gia bằng mã phòng thi","Tuỳ đề thi của GV","Không")
)

H2 "5.2 Hướng dẫn làm bài thi"
BL "Bước 1: Truy cập 'Thi online' từ thanh điều hướng chính"
BL "Bước 2: Chọn loại thi từ các tab lọc (Tổng quát / OPIC / VSTEP / Live)"
BL "Bước 3: Nhấn vào bài thi muốn làm để xem thông tin chi tiết: số câu, thời gian, độ khó, số người đã thi"
BL "Bước 4: Nhấn 'Bắt đầu thi' để vào phòng thi — đồng hồ đếm ngược bắt đầu chạy"
BL "Bước 5: Trả lời từng câu hỏi — có thể đánh dấu câu chưa chắc để xem lại"
BL "Bước 6: Nhấn 'Nộp bài' khi hoàn thành — kết quả hiển thị ngay lập tức với điểm số và đáp án đúng/sai"

H2 "5.3 Kiểm tra xếp lớp (Placement Test)"
IMG "17_placement_test.png" 15.5 7 "Hình 5.2 — Trang kiểm tra xếp lớp dành cho học viên mới chưa biết trình độ của mình"
BL "Bài kiểm tra gồm 3 phần: Nghe hiểu (20 câu), Đọc hiểu (20 câu) và Ngữ pháp/Từ vựng (20 câu)"
BL "Thời gian làm bài: 45 phút — AI phân tích kết quả và tự động xếp vào cấp độ phù hợp (A1 đến C2)"
BL "Kết quả đi kèm với lộ trình học tập đề xuất cụ thể: nên học khoá nào, ôn tập phần nào"
BL "Sau 30 ngày có thể làm lại để kiểm tra tiến bộ"

H2 "5.4 Bảng xếp hạng (Leaderboard)"
P "Bảng xếp hạng ở sidebar phải trang Thi online cập nhật liên tục, hiển thị Top 10 học viên có điểm tổng cao nhất. Học viên có thể xem theo 3 kỳ: Tuần này, Tháng này và Cả năm. Đây là nguồn động lực học tập tích cực cho cộng đồng MLS."
PB

# CH6 - NHÓM HỌC TẬP
Write-Host "=== CH6 - Học viên: Nhóm ==="
H1 "6. Nhóm học tập & Chat"
IMG "09_groups.png" 15.5 8 "Hình 6.1 — Trang danh sách nhóm học tập với các nhóm công khai và riêng tư"
P "Tính năng Nhóm học tập (Study Groups) của MLS tạo ra môi trường học cộng đồng — nơi học viên kết nối, hỗ trợ nhau và học cùng giáo viên theo nhóm nhỏ. Cảm giác học trong lớp học thật sự dù ở bất cứ đâu."

H2 "6.1 Tìm kiếm và tham gia nhóm"
BL "Nhóm công khai — bất kỳ học viên nào cũng có thể tham gia bằng cách nhấn nút 'Tham gia'"
BL "Nhóm riêng tư — chỉ tham gia bằng mã mời (invite code) do giáo viên/trưởng nhóm cung cấp"
BL "Tìm kiếm nhóm theo tên, chủ đề (Giao tiếp hàng ngày, Kinh doanh, Chuẩn bị VSTEP...) hoặc cấp độ"
BL "Xem thông tin nhóm: số thành viên, giáo viên phụ trách, mức độ hoạt động"

H2 "6.2 Hoạt động trong nhóm"
BL "Chat văn bản thời gian thực — gửi tin nhắn, hỏi đáp ngay trong nhóm"
BL "Chia sẻ file và hình ảnh — tài liệu học tập, bài tập, ghi chú cá nhân"
BL "Bài đăng (Posts) — giáo viên đăng thông báo, bài tập, tài liệu cho cả nhóm"
BL "Tương tác: Like bài đăng, bình luận, tag thành viên"
BL "Chia sẻ tiến độ học tập — báo cáo kết quả bài thi, khoá học vừa hoàn thành"
PB

# CH7 - HỒ SƠ & GIỎ HÀNG
Write-Host "=== CH7 - Học viên: Hồ sơ & Giỏ hàng ==="
H1 "7. Hồ sơ cá nhân & Tiến độ học tập"
P "Trang Hồ sơ cá nhân là trung tâm quản lý thông tin, theo dõi tiến độ học tập và các hoạt động cá nhân. Truy cập bằng cách nhấn vào avatar/tên ở góc phải trên thanh điều hướng."

H2 "7.1 Thông tin cá nhân"
BL "Ảnh đại diện (avatar) — tải lên ảnh mới hoặc chọn từ thư viện có sẵn"
BL "Họ và tên đầy đủ — tên này xuất hiện trên chứng chỉ và trong các nhóm học"
BL "Ngày sinh — dùng để cá nhân hoá nội dung học phù hợp với độ tuổi"
BL "Quốc tịch / Ngôn ngữ mẹ đẻ — giúp AI điều chỉnh phương pháp dạy phù hợp"
BL "Mục tiêu học tập — Giao tiếp hàng ngày, Công việc, Du lịch, Luyện thi"
BL "Thay đổi mật khẩu — cần nhập mật khẩu cũ để xác thực"

H2 "7.2 Thống kê học tập"
BL "Tổng số giờ học tích luỹ — tính từ ngày đăng ký đến hiện tại"
BL "Số bài học đã hoàn thành — theo từng khoá và tổng cộng"
BL "Điểm thi trung bình — cập nhật sau mỗi bài thi"
BL "Chuỗi ngày học liên tiếp (Streak) — khuyến khích duy trì thói quen học đều đặn"
BL "Thứ hạng trên Leaderboard — xếp hạng so với học viên khác trong cùng tuần/tháng"
BL "Lịch sử các bài thi đã làm — xem lại đáp án, điểm số, thời gian làm bài"
BL "Danh sách chứng chỉ — tải xuống PDF chứng chỉ hoàn thành khoá học"

H1 "8. Giỏ hàng & Quy trình thanh toán"
IMG "18_cart.png" 15.5 7 "Hình 8.1 — Trang giỏ hàng hiển thị danh sách sách đã chọn, số lượng, giá và ô nhập voucher"
P "Hệ thống mua sắm của MLS được thiết kế đơn giản, an toàn và hỗ trợ nhiều phương thức thanh toán phổ biến tại Việt Nam. Mọi giao dịch được mã hoá bảo mật theo tiêu chuẩn SSL."

H2 "8.1 Quy trình thanh toán từng bước"
BL "Bước 1: Vào Giỏ hàng, kiểm tra lại danh sách sách và số lượng — có thể xoá sách không muốn mua"
BL "Bước 2: Nhập mã voucher giảm giá (nếu có) vào ô 'Mã giảm giá' và nhấn 'Áp dụng'"
BL "Bước 3: Nhấn 'Tiến hành thanh toán'"
BL "Bước 4: Nhập địa chỉ giao hàng đầy đủ: Tên người nhận, Số điện thoại, Địa chỉ chi tiết, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
BL "Bước 5: Chọn phương thức vận chuyển (Tiêu chuẩn / Nhanh) — xem thời gian giao dự kiến và phí vận chuyển"
BL "Bước 6: Chọn phương thức thanh toán: Chuyển khoản ngân hàng, Ví MoMo, ZaloPay, VNPay, Thanh toán khi nhận hàng (COD)"
BL "Bước 7: Kiểm tra lại toàn bộ thông tin đơn hàng và nhấn 'Đặt hàng' để xác nhận"
BL "Bước 8: Nhận email xác nhận đơn hàng với mã đơn hàng để theo dõi"

H2 "8.2 Theo dõi và quản lý đơn hàng"
BL "Xem trạng thái đơn hàng: Chờ xử lý → Đã xác nhận → Đang đóng gói → Đã giao ViettelPost → Đang giao → Đã nhận"
BL "Theo dõi vận đơn ViettelPost bằng cách nhấn vào mã vận đơn trong trang chi tiết đơn hàng"
BL "Yêu cầu đổi/trả hàng trong vòng 7 ngày kể từ ngày nhận (nếu sách lỗi, sai đơn)"
NOTE "Lưu ý: Đơn hàng có thể bị huỷ tự động nếu chưa thanh toán trong vòng 24 giờ (với hình thức chuyển khoản). Hoá đơn VAT được xuất theo yêu cầu — liên hệ support@mls.edu.vn."
PB

# ╔══════════════════════════════════════════════════════╗
# ║           PHẦN 2: GIÁO VIÊN                         ║
# ╚══════════════════════════════════════════════════════╝
$sel.Style = $doc.Styles.Item("Normal"); $sel.ParagraphFormat.Alignment = 1
$sel.ParagraphFormat.SpaceBefore = 60; $sel.ParagraphFormat.SpaceAfter = 10
SetFont 40 $true $false $cNavy "Calibri"
$sel.TypeText("PHẦN 2"); $sel.TypeParagraph()
SetFont 24 $false $false $cBlue "Calibri"
$sel.TypeText("HƯỚNG DẪN DÀNH CHO GIÁO VIÊN"); $sel.TypeParagraph()
SetFont 13 $false $true $cGray "Calibri"
$sel.TypeText("Teacher Guide"); $sel.TypeParagraph()
$sel.ParagraphFormat.Alignment = 0; ResetPara
PB

# CH9 - GIÁO VIÊN
Write-Host "=== CH9 - Giáo viên ==="
H1 "9. Cổng thông tin Giáo viên (Teacher Portal)"
IMG "20_teacher_dashboard.png" 15.5 8 "Hình 9.1 — Cổng thông tin Giáo viên tại /teacher với menu đầy đủ: Khoá học, Bài thi, Ngân hàng câu hỏi, Nhóm"
P "Giáo viên truy cập vào Cổng thông tin riêng biệt tại /teacher — nơi quản lý toàn bộ hoạt động giảng dạy từ tạo khoá học, soạn đề thi đến theo dõi tiến độ học viên và quản lý nhóm học tập. Chỉ tài khoản được cấp quyền Teacher mới truy cập được khu vực này."
NOTE "Để đăng ký trở thành Giáo viên MLS: Gửi hồ sơ đến teacher@mls.edu.vn gồm CV, bằng cấp/chứng chỉ dạy tiếng Việt và video giới thiệu ngắn 2–3 phút. Đội ngũ MLS xét duyệt trong 5–7 ngày làm việc."

H2 "9.1 Tạo và quản lý Khoá học"
BL "Tạo khoá học mới: Điền tên khoá, mô tả chi tiết, đối tượng học viên, cấp độ CEFR, ngôn ngữ giảng dạy, ảnh bìa và giá"
BL "Xây dựng chương trình: Tạo cấu trúc theo Chương (Chapter) → Bài học (Lesson)"
BL "Upload nội dung bài học: Video bài giảng MP4, tài liệu PDF, bài tập đính kèm"
BL "Thiết lập bài kiểm tra cuối chương — học viên phải đạt điểm yêu cầu mới học chương tiếp"
BL "Quản lý học viên: Xem danh sách đăng ký, tiến độ của từng học viên, gửi tin nhắn"
BL "Xem thống kê: Tổng lượt xem, thời gian học trung bình, tỷ lệ hoàn thành, doanh thu"
BL "Sau khi hoàn thiện, gửi khoá học để Admin duyệt và đăng tải công khai"

H2 "9.2 Quản lý Bài thi"
IMG "21_teacher_quizzes.png" 15.5 8 "Hình 9.2 — Trang quản lý bài thi của Giáo viên, hiển thị danh sách đề thi và thống kê chi tiết"
BL "Tạo đề thi mới: Đặt tiêu đề, mô tả, loại thi (Tổng quát/OPIC/VSTEP), thời gian làm bài, số lần cho phép thi lại"
BL "Lấy câu hỏi từ Ngân hàng câu hỏi hoặc tạo câu hỏi mới trực tiếp trong đề"
BL "Thiết lập thang điểm và điểm đậu (passing score) cho từng đề thi"
BL "Xem kết quả: Điểm trung bình cả lớp, phân bố điểm, câu hỏi học viên hay sai nhất"

H2 "9.3 Ngân hàng câu hỏi"
IMG "22_teacher_questions.png" 15.5 8 "Hình 9.3 — Ngân hàng câu hỏi với bộ lọc theo kỹ năng, cấp độ và loại câu hỏi"
BL "Câu hỏi trắc nghiệm (Multiple Choice) — 4 lựa chọn, chọn 1 hoặc nhiều đáp án đúng"
BL "Câu điền từ (Fill in the Blank) — học viên gõ từ/cụm từ vào ô trống"
BL "Câu hỏi nghe (Listening) — đính kèm file audio, học viên nghe rồi trả lời"
BL "Câu hỏi Nói — OPIC Speaking: học viên ghi âm câu trả lời, AI đánh giá phát âm, ngữ điệu, từ vựng, ngữ pháp"
BL "Câu viết luận — VSTEP Writing: học viên viết đoạn văn/bài luận, AI phân tích cấu trúc, từ vựng và chấm điểm chi tiết"
BL "Phân loại câu hỏi theo: Kỹ năng (Nghe/Đọc/Nói/Viết/Ngữ pháp), Cấp độ CEFR, Chủ đề, Độ khó"

H2 "9.4 Thi trực tiếp (Live Exam)"
BL "Tạo phòng thi → chia sẻ mã tham gia cho học viên (không cần link dài phức tạp)"
BL "Học viên tham gia bằng mã phòng thi 6 ký tự"
BL "Màn hình giáo viên: nhìn thấy học viên đang vào phòng theo thời gian thực, bắt đầu thi khi đủ người"
BL "Trong khi thi: Giáo viên theo dõi tiến độ làm bài của từng học viên, có thể gửi thông báo"
BL "Kết thúc thi: Kết quả hiển thị ngay — bảng xếp hạng điểm số, phân tích từng câu"

H2 "9.5 Quản lý nhóm học tập"
BL "Tạo và quản lý nhóm: Đặt tên, mô tả, chủ đề, số thành viên tối đa, loại nhóm (công khai/riêng tư)"
BL "Duyệt thành viên xin gia nhập (với nhóm riêng tư)"
BL "Đăng bài, chia sẻ tài liệu và thông báo cho toàn nhóm"
BL "Xem thống kê hoạt động nhóm: số tin nhắn, thành viên tích cực nhất"
PB

# ╔══════════════════════════════════════════════════════╗
# ║           PHẦN 3: QUẢN TRỊ VIÊN                     ║
# ╚══════════════════════════════════════════════════════╝
$sel.Style = $doc.Styles.Item("Normal"); $sel.ParagraphFormat.Alignment = 1
$sel.ParagraphFormat.SpaceBefore = 60; $sel.ParagraphFormat.SpaceAfter = 10
SetFont 40 $true $false $cNavy "Calibri"
$sel.TypeText("PHẦN 3"); $sel.TypeParagraph()
SetFont 24 $false $false $cBlue "Calibri"
$sel.TypeText("HƯỚNG DẪN DÀNH CHO QUẢN TRỊ VIÊN"); $sel.TypeParagraph()
SetFont 13 $false $true $cGray "Calibri"
$sel.TypeText("Admin Guide"); $sel.TypeParagraph()
$sel.ParagraphFormat.Alignment = 0; ResetPara
PB

# CH10 - ADMIN
Write-Host "=== CH10 - Admin ==="
H1 "10. Bảng quản trị Admin"
IMG "03_admin_dashboard.png" 15.5 9 "Hình 10.1 — Bảng điều khiển Admin tại /admin với menu đầy đủ bên trái và tổng quan Analytics bên phải"
P "Bảng quản trị Admin (/admin) là khu vực dành riêng cho Quản trị viên của nền tảng MLS. Tại đây, Quản trị viên có thể giám sát toàn bộ hoạt động hệ thống, quản lý dữ liệu và cấu hình nền tảng theo thời gian thực."
NOTE "Bảo mật: Tài khoản Admin chỉ được truy cập từ thiết bị đã xác thực. Mỗi phiên đăng nhập Admin được ghi nhật ký đầy đủ (thời gian, địa chỉ IP, thao tác thực hiện). Không chia sẻ thông tin đăng nhập Admin với bất kỳ ai."

H2 "10.1 Dashboard Analytics — Thống kê tổng quan"
BL "Bộ lọc thời gian: Xem số liệu theo 7 ngày, 30 ngày hoặc 90 ngày gần nhất"
BL "Tab Tổng quan (Overview): Doanh thu, số đơn hàng, số học viên mới, số khoá học được đăng ký"
BL "Tab Người dùng (Users): Biểu đồ tăng trưởng người dùng mới theo ngày"
BL "Tab Lượt xem (Views): Thống kê lượt xem video bài học theo ngày và theo khoá học"
BL "Tab Doanh số (Sales): Biểu đồ doanh thu theo ngày, Top 10 sách bán chạy, phân tích trạng thái đơn hàng"

H2 "10.2 Quản lý Khoá học"
IMG "10_admin_courses.png" 15.5 8 "Hình 10.2 — Trang quản lý khoá học của Admin với bộ lọc và danh sách đầy đủ từ tất cả giáo viên"
BL "Xem danh sách toàn bộ khoá học của tất cả giáo viên, lọc theo trạng thái: Nháp, Chờ duyệt, Đã đăng, Đã ẩn"
BL "Duyệt khoá học: Xem nội dung, kiểm tra chất lượng và phê duyệt hoặc từ chối kèm lý do chi tiết"
BL "Chỉnh sửa thông tin khoá học, thêm/xoá bài học, thay đổi giá"
BL "Ẩn/hiện khoá học trên trang công khai; Xoá vĩnh viễn khoá học (cần xác nhận 2 lần)"
BL "Quản lý danh mục và thẻ tag cho hệ thống phân loại"

H2 "10.3 Quản lý Sách"
IMG "11_admin_books.png" 15.5 8 "Hình 10.3 — Trang quản lý sách với danh sách đầy đủ, tình trạng kho và nút thêm sách mới"
BL "Thêm sách mới: Nhập ISBN, tiêu đề, tác giả, nhà xuất bản, năm xuất bản, giá bán, số trang, cấp độ, thể loại"
BL "Upload ảnh bìa (bắt buộc) và ảnh bên trong sách (tuỳ chọn)"
BL "Quản lý tồn kho: Nhập số lượng, đặt ngưỡng cảnh báo hết hàng"
BL "Chỉnh sửa thông tin và giá sách bất kỳ lúc nào; Ẩn/hiện sách không còn phân phối"

H2 "10.4 Quản lý Đơn hàng"
IMG "12_admin_orders.png" 15.5 8 "Hình 10.4 — Trang quản lý đơn hàng với bộ lọc trạng thái và ô tìm kiếm"
BL "Xem danh sách đơn hàng, lọc theo trạng thái: Chờ xử lý, Chờ thanh toán, Đã thanh toán, Đang xử lý, Hoàn thành, Đã huỷ, Thất bại"
BL "Tìm kiếm đơn hàng theo mã đơn, email khách hàng, số điện thoại, tên người nhận"
BL "Xem chi tiết đơn: danh sách sách, địa chỉ giao hàng, phương thức thanh toán, lịch sử trạng thái"
BL "Tạo vận đơn ViettelPost: Nhập thông tin, in phiếu giao hàng trực tiếp từ hệ thống"
BL "Hoàn tiền (Refund) cho đơn hàng lỗi hoặc khách huỷ theo chính sách"

H2 "10.5 Quản lý Voucher"
IMG "13_admin_vouchers.png" 15.5 8 "Hình 10.5 — Trang quản lý voucher với danh sách mã giảm giá đang hoạt động và lịch sử sử dụng"
BL "Tạo voucher mới: Nhập mã tuỳ chỉnh hoặc tạo ngẫu nhiên, chọn loại giảm giá (% hoặc số tiền cố định)"
BL "Thiết lập điều kiện áp dụng: Đơn hàng tối thiểu, danh mục sản phẩm áp dụng, giới hạn 1 lần/tài khoản"
BL "Đặt thời hạn sử dụng: Ngày bắt đầu và ngày hết hạn voucher"
BL "Giới hạn tổng số lần sử dụng trên toàn hệ thống"
BL "Xem thống kê: Số lần đã dùng, tổng giá trị chiết khấu đã cấp"

H2 "10.6 Quản lý Người dùng"
IMG "14_admin_users.png" 15.5 8 "Hình 10.6 — Trang quản lý người dùng với danh sách tài khoản, vai trò và công cụ quản lý"
BL "Xem danh sách tất cả người dùng, tìm kiếm theo email, tên, trạng thái, vai trò"
BL "Xem chi tiết hồ sơ: thông tin cá nhân, khoá học đã đăng ký, lịch sử thi, đơn hàng"
BL "Phân quyền: Học viên → Giáo viên → Content Manager → Admin → SuperAdmin"
BL "Kích hoạt/Khoá tài khoản — Khoá tạm thời (có thể mở) hoặc vô hiệu hoá vĩnh viễn"
BL "Reset mật khẩu cho người dùng quên mật khẩu và không nhận được email"
BL "Xem lịch sử đăng nhập: Thời gian, thiết bị, địa chỉ IP"
PB

# CH11 - FAQ
Write-Host "=== CH11 - FAQ ==="
H1 "11. Câu hỏi thường gặp (FAQ)"
H3 "Tôi quên mật khẩu, phải làm gì?"
P "Tại trang đăng nhập, nhấn liên kết 'Quên mật khẩu?' phía dưới ô nhập mật khẩu. Nhập địa chỉ email đã đăng ký và nhấn 'Gửi email'. Kiểm tra hộp thư (kể cả thư mục Spam/Junk) và nhấn link đặt lại mật khẩu. Link có hiệu lực trong 1 giờ. Nếu không nhận được email sau 5 phút, thử lại hoặc liên hệ bộ phận hỗ trợ."
H3 "Khoá học có hết hạn sau khi đăng ký không?"
P "Không — khoá học trên MLS không có hạn truy cập. Sau khi đăng ký (miễn phí hoặc có phí), bạn có thể học lại bất cứ lúc nào, xem lại video không giới hạn lần. Tuy nhiên, nội dung khoá học có thể được giáo viên cập nhật theo thời gian."
H3 "Tôi có thể học MLS trên điện thoại không?"
P "Có. MLS có ứng dụng di động đầy đủ tính năng cho cả iOS (tải từ App Store) và Android (tải từ Google Play). Tất cả dữ liệu học tập, tiến độ và kết quả thi đều đồng bộ tự động giữa máy tính và điện thoại qua tài khoản."
H3 "Làm sao biết mình ở cấp độ nào của CEFR?"
P "Thực hiện bài Kiểm tra xếp lớp (Placement Test) miễn phí từ mục 'Thi online'. Bài kiểm tra khoảng 45 phút, bao gồm Nghe, Đọc và Ngữ pháp. Hệ thống AI tự động phân tích kết quả và xếp bạn vào cấp độ phù hợp từ A1 đến C2, đồng thời gợi ý khoá học phù hợp để bắt đầu."
H3 "Chứng chỉ hoàn thành khoá học có giá trị gì?"
P "Chứng chỉ Hoàn thành khoá học MLS được cấp sau khi học viên hoàn thành 100% nội dung và đạt điểm kiểm tra cuối khoá. Chứng chỉ này là bằng chứng về nỗ lực học tập và có thể dùng trong hồ sơ xin việc. Riêng chứng chỉ VSTEP và OPIC được Bộ Giáo dục & Đào tạo Việt Nam công nhận chính thức."
H3 "Tôi mua sách nhưng nhận được sách sai/hỏng, phải làm gì?"
P "Chụp ảnh sách lỗi/sai và liên hệ ngay bộ phận hỗ trợ qua email support@mls.edu.vn hoặc Chat trực tuyến trên website trong vòng 48 giờ kể từ khi nhận hàng. Đính kèm mã đơn hàng và ảnh minh chứng. Chúng tôi sẽ xử lý đổi/trả trong 3–5 ngày làm việc và chịu toàn bộ chi phí vận chuyển."
H3 "Giáo viên muốn tạo khoá học phải làm gì?"
P "Để đăng ký trở thành Giáo viên trên MLS: (1) Điền form đăng ký tại /teacher-register hoặc gửi email đến teacher@mls.edu.vn, (2) Đính kèm hồ sơ: CV, bằng cấp/chứng chỉ dạy tiếng Việt, video giới thiệu ngắn 2–3 phút, (3) Đội ngũ MLS xét duyệt trong 5–7 ngày làm việc, (4) Sau khi được duyệt, nhận email hướng dẫn kích hoạt tài khoản Giáo viên."
PB

# CH12 - LIÊN HỆ
Write-Host "=== CH12 - Liên hệ ==="
H1 "12. Thông tin liên hệ & Hỗ trợ"
P "Đội ngũ MLS luôn sẵn sàng hỗ trợ người dùng qua nhiều kênh khác nhau. Thời gian làm việc chính thức: Thứ Hai — Thứ Sáu, 8:00 — 18:00 (giờ Hà Nội, UTC+7)."
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

# ===================== LƯU FILE =====================
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
