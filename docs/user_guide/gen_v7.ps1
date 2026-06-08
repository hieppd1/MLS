# MLS User Guide v7 - Đầy đủ nhất, chi tiết từng tính năng, 3 vai trò
$ErrorActionPreference = "Continue"
$SS  = "D:\HiepPD\MLS\docs\user_guide\screenshots"
$OUT = "D:\HiepPD\MLS\docs\User_Guide_MLS.docx"

$cNavy = 6240798; $cBlue = 15426341; $cGray = 8417899
$cLightBg = 16774895; $cWhite = 16777215; $cBlack = 0

Write-Host "Khởi động Word..."
$word = New-Object -ComObject Word.Application
$word.Visible = $false; $word.DisplayAlerts = 0
$doc = $word.Documents.Add(); $sel = $word.Selection

function ResetPara {
    $sel.ParagraphFormat.Alignment = 0; $sel.ParagraphFormat.SpaceBefore = 0
    $sel.ParagraphFormat.SpaceAfter = 8; $sel.ParagraphFormat.FirstLineIndent = 0
    $sel.ParagraphFormat.LeftIndent = 0
}
function SetFont([double]$sz,[bool]$bold=$false,[bool]$ital=$false,[int]$col=0,[string]$nm="Times New Roman") {
    $sel.Font.Name = $nm; $sel.Font.Size = $sz; $sel.Font.Bold = $bold
    $sel.Font.Italic = $ital; $sel.Font.Color = $col
}
function H1([string]$t) { $sel.Style=$doc.Styles.Item("Heading 1"); $sel.TypeText($t); $sel.TypeParagraph(); $sel.Style=$doc.Styles.Item("Normal"); ResetPara }
function H2([string]$t) { $sel.Style=$doc.Styles.Item("Heading 2"); $sel.TypeText($t); $sel.TypeParagraph(); $sel.Style=$doc.Styles.Item("Normal"); ResetPara }
function H3([string]$t) { $sel.Style=$doc.Styles.Item("Heading 3"); $sel.TypeText($t); $sel.TypeParagraph(); $sel.Style=$doc.Styles.Item("Normal"); ResetPara }
function H4([string]$t) {
    SetFont 12 $true $false $cNavy; $sel.ParagraphFormat.SpaceBefore=8; $sel.ParagraphFormat.SpaceAfter=4
    $sel.TypeText("▶  $t"); $sel.TypeParagraph(); ResetPara; SetFont 12 $false $false 0
}
function P([string]$t) {
    $sel.Style=$doc.Styles.Item("Normal"); SetFont 12 $false $false 0
    $sel.ParagraphFormat.Alignment=3; $sel.ParagraphFormat.SpaceAfter=6
    $sel.ParagraphFormat.FirstLineIndent=$word.CentimetersToPoints(1.0)
    $sel.TypeText($t); $sel.TypeParagraph()
    $sel.ParagraphFormat.FirstLineIndent=0; $sel.ParagraphFormat.Alignment=0
}
function BL([string]$t) {
    $sel.Style=$doc.Styles.Item("List Bullet"); SetFont 12 $false $false 0
    $sel.ParagraphFormat.SpaceAfter=3; $sel.TypeText($t); $sel.TypeParagraph()
    $sel.Style=$doc.Styles.Item("Normal"); ResetPara
}
function NOTE([string]$t) {
    $sel.Style=$doc.Styles.Item("Normal"); SetFont 11 $false $true $cBlue
    $sel.ParagraphFormat.LeftIndent=$word.CentimetersToPoints(0.5)
    $sel.ParagraphFormat.SpaceBefore=4; $sel.ParagraphFormat.SpaceAfter=10
    $sel.TypeText("   $t"); $sel.TypeParagraph(); ResetPara; SetFont 12 $false $false 0
}
function IMG([string]$fname,[double]$w,[double]$h,[string]$cap) {
    $fp=Join-Path $SS $fname; if(-not(Test-Path $fp)){Write-Host "  SKIP $fname";return}
    $sel.Style=$doc.Styles.Item("Normal")
    $sel.ParagraphFormat.Alignment=1; $sel.ParagraphFormat.SpaceBefore=8; $sel.ParagraphFormat.SpaceAfter=0
    try { $pic=$sel.InlineShapes.AddPicture($fp,$false,$true); $pic.Width=$word.CentimetersToPoints($w); $pic.Height=$word.CentimetersToPoints($h) } catch { Write-Warning "IMG ERR: $fname" }
    $sel.TypeParagraph()
    if($cap-ne""){SetFont 10 $false $true $cGray; $sel.ParagraphFormat.Alignment=1; $sel.ParagraphFormat.SpaceAfter=14; $sel.TypeText($cap); $sel.TypeParagraph()}
    ResetPara; SetFont 12 $false $false 0; Write-Host "  [IMG] $fname"
}
function TBL([string[]]$hdrs,[object[]]$rows) {
    $nc=$hdrs.Count; $nr=$rows.Count+1; $tbl=$doc.Tables.Add($sel.Range,$nr,$nc)
    try{$tbl.Style=$doc.Styles.Item("Table Grid")}catch{}
    for($c=1;$c-le$nc;$c++){
        $cell=$tbl.Cell(1,$c); $cell.Range.Text=$hdrs[$c-1]; $cell.Range.Bold=$true
        $cell.Range.Font.Size=11; $cell.Range.Font.Name="Calibri"
        $cell.Range.Font.Color=$cWhite; $cell.Range.ParagraphFormat.Alignment=1
        $cell.Shading.BackgroundPatternColor=$cNavy
    }
    for($r=0;$r-lt$rows.Count;$r++){
        $fill=if($r%2-eq 0){$cLightBg}else{16777215}
        for($c=1;$c-le$nc;$c++){
            $cell=$tbl.Cell($r+2,$c); $v=if($c-1-lt$rows[$r].Count){"$($rows[$r][$c-1])"}else{""}
            $cell.Range.Text=$v; $cell.Range.Font.Size=11; $cell.Range.Font.Name="Calibri"
            $cell.Range.Bold=$false; $cell.Range.Font.Color=0; $cell.Shading.BackgroundPatternColor=$fill
        }
    }
    try{$tbl.Columns.AutoFit()}catch{}
    $ep = $tbl.Range.End
    $sel.Start = $ep
    $sel.End   = $ep
    $sel.TypeParagraph(); ResetPara
}
function PB { $sel.InsertBreak(7) }
function AddSP { $sel.Style=$doc.Styles.Item("Normal"); SetFont 6 $false $false 0; $sel.TypeParagraph(); ResetPara }
function Banner([string]$num,[string]$title,[string]$sub) {
    $sel.Style=$doc.Styles.Item("Normal"); $sel.ParagraphFormat.Alignment=1
    $sel.ParagraphFormat.SpaceBefore=50; $sel.ParagraphFormat.SpaceAfter=6
    SetFont 42 $true $false $cNavy "Calibri"; $sel.TypeText($num); $sel.TypeParagraph()
    SetFont 22 $false $false $cBlue "Calibri"; $sel.ParagraphFormat.SpaceAfter=4
    $sel.TypeText($title); $sel.TypeParagraph()
    SetFont 13 $false $true $cGray "Calibri"; $sel.TypeText($sub); $sel.TypeParagraph()
    $sel.ParagraphFormat.Alignment=0; ResetPara
}

# ─── TRANG BÌA ───
Write-Host "=== TRANG BÌA ==="
$sel.Style=$doc.Styles.Item("Normal"); $sel.ParagraphFormat.Alignment=1; $sel.ParagraphFormat.SpaceBefore=40
SetFont 80 $true $false $cNavy "Calibri"; $sel.TypeText("MLS"); $sel.TypeParagraph()
SetFont 22 $false $false $cBlue "Calibri"; $sel.ParagraphFormat.SpaceAfter=6
$sel.TypeText("Modern Language System"); $sel.TypeParagraph()
SetFont 14 $false $false 8355711 "Calibri"
$sel.TypeText("Nền tảng học tiếng Việt trực tuyến toàn diện"); $sel.TypeParagraph()
AddSP
SetFont 36 $true $false 0 "Calibri"; $sel.ParagraphFormat.SpaceAfter=6
$sel.TypeText("HƯỚNG DẪN SỬ DỤNG ĐẦY ĐỦ"); $sel.TypeParagraph()
SetFont 13 $false $false $cGray "Calibri"
$sel.TypeText("Phiên bản 2.0  —  Tháng 6 năm 2026"); $sel.TypeParagraph()
AddSP; IMG "01_homepage.png" 15.5 8.5 ""
AddSP
SetFont 11 $false $true $cGray "Calibri"; $sel.ParagraphFormat.Alignment=1
$sel.TypeText("Tài liệu hướng dẫn đầy đủ cho 3 nhóm: Học viên · Giáo viên · Quản trị viên")
$sel.TypeParagraph(); $sel.ParagraphFormat.Alignment=0
PB

# ─── GIỚI THIỆU CHUNG ───
Write-Host "=== GIỚI THIỆU ==="
H1 "GIỚI THIỆU HỆ THỐNG MLS"
P "MLS (Modern Language System) là nền tảng học tiếng Việt trực tuyến tích hợp AI, được thiết kế theo khung năng lực CEFR với 6 cấp độ A1–C2. Hệ thống có ba cổng truy cập riêng biệt cho từng vai trò người dùng."
H2 "Cổng truy cập và vai trò"
TBL @("Vai trò","URL truy cập","Quyền hạn") @(
    ,@("Học viên (Student)","/ (trang chủ)","Học khoá học, thi online, mua sách, nhóm, chat hỗ trợ"),
    ,@("Giáo viên (Teacher)","/teacher","Tạo khoá học, bài thi, câu hỏi, quản lý nhóm, OPIC, VSTEP"),
    ,@("Quản trị viên (Admin)","/admin","Toàn quyền quản lý hệ thống: nội dung, đơn hàng, người dùng, chat")
)
H2 "Tài khoản demo"
TBL @("Vai trò","Email","Mật khẩu") @(
    ,@("Admin","admin01@gmail.com","123@123aA"),
    ,@("Giáo viên","teacher01@gmail.com","123@123aA"),
    ,@("Học viên","student01@gmail.com","123@123aA")
)
PB

# ══════════════════════════════════════════
# PHẦN 1: HỌC VIÊN
# ══════════════════════════════════════════
Banner "PHẦN 1" "HƯỚNG DẪN DÀNH CHO HỌC VIÊN" "Student Guide — /  (trang chủ)"
PB

Write-Host "=== HV: Đăng ký & Đăng nhập ==="
H1 "1. Đăng ký & Đăng nhập"
H2 "1.1 Đăng ký tài khoản mới"
IMG "16_register.png" 15.5 10 "Hình 1.1 — Trang đăng ký tài khoản"
TBL @("Trường","Bắt buộc","Mô tả") @(
    ,@("Họ và tên đầy đủ","Có","Hiển thị trong hồ sơ, nhóm và trên chứng chỉ hoàn thành"),
    ,@("Địa chỉ Email","Có","Dùng để đăng nhập và nhận thông báo. Mỗi email chỉ đăng ký 1 tài khoản"),
    ,@("Mật khẩu","Có","Tối thiểu 8 ký tự, phải có chữ hoa, chữ thường và số (VD: MyPass123)"),
    ,@("Xác nhận mật khẩu","Có","Nhập lại đúng mật khẩu để tránh sai sót")
)
BL "Nhấn 'Đăng ký' → hệ thống gửi email kích hoạt (hiệu lực 24 giờ)"
BL "Mở email → nhấn link xác nhận → tài khoản được kích hoạt"
NOTE "Không nhận được email sau 5 phút → kiểm tra thư mục Spam/Junk hoặc nhấn 'Gửi lại email xác nhận'."

H2 "1.2 Đăng nhập"
IMG "02_login_page.png" 15.5 9 "Hình 1.2 — Trang đăng nhập với form email/mật khẩu và nút Google"
IMG "02b_login_filled.png" 15.5 9 "Hình 1.3 — Form đăng nhập đã điền thông tin"
BL "Nhập Email + Mật khẩu → nhấn 'Đăng nhập'"
BL "Hoặc nhấn 'Tiếp tục với Google' → chọn tài khoản Google → xác nhận cấp quyền"
NOTE "Quên mật khẩu: Nhấn liên kết 'Quên mật khẩu?' → nhập email → nhận link đặt lại (hiệu lực 1 giờ)."
PB

Write-Host "=== HV: Trang chủ ==="
H1 "2. Trang chủ — Khám phá & Điều hướng"
IMG "04_homepage_loggedin.png" 15.5 9 "Hình 2.1 — Trang chủ sau khi đăng nhập với luồng video bài học TikTok-style"
H2 "2.1 Bố cục trang chủ"
BL "Sidebar trái: Bài học mới nhất | Khoá học đã kích hoạt | Nhóm của tôi | Người đang theo dõi | Bài đã lưu | Bài đã thích | Bạn bè"
BL "Khu vực trung tâm: Luồng video bài học ngắn — cuộn lên/xuống để khám phá. Mỗi video có nút Thích / Lưu / Bình luận / Chia sẻ"
BL "Sidebar phải: Thống kê nhanh, Giáo viên nổi bật, Khoá học đề xuất theo sở thích"
H2 "2.2 Thanh điều hướng"
BL "Menu chính: Trang chủ | Khoá học | Sách | Thi online | Nhóm"
BL "Ô tìm kiếm toàn cục — tìm khoá học, giáo viên, bài thi, sách"
BL "Giỏ hàng | Chuông thông báo | Avatar (Hồ sơ, Cài đặt, Đăng xuất) | Chọn ngôn ngữ"
PB

Write-Host "=== HV: Khoá học ==="
H1 "3. Khoá học — Duyệt, Đăng ký, Học & Đánh giá"
H2 "3.1 Danh sách khoá học"
IMG "05_courses_list.png" 15.5 10 "Hình 3.1 — Trang danh sách khoá học với bộ lọc đa dạng"
BL "Lọc cấp độ CEFR: A1 Sơ cấp | A2 Cơ bản | B1 Trung cấp sơ | B2 Trung cấp | C1 Cao cấp | C2 Thành thạo"
BL "Lọc chủ đề: Giao tiếp | Kinh doanh | Du lịch | Văn hoá Việt Nam | Luyện thi VSTEP"
BL "Sắp xếp: Mới nhất | Phổ biến nhất | Đánh giá cao | Giá thấp→cao"
BL "Lọc giá: Tất cả | Miễn phí | Có phí"

H2 "3.2 Trang chi tiết khoá học"
IMG "06_course_detail.png" 15.5 10 "Hình 3.2 — Chi tiết khoá học với đầy đủ thông tin"
IMG "06b_course_detail_scroll.png" 15.5 9 "Hình 3.3 — Chương trình học và đánh giá sau khi cuộn xuống"
BL "Video giới thiệu — xem trước phong cách giảng dạy"
BL "Mục tiêu học tập (Những gì bạn sẽ học), Yêu cầu đầu vào, Đối tượng phù hợp"
BL "Chương trình học đầy đủ — Chương → Bài học (Session); preview một số bài miễn phí"
BL "Bài thi liên quan — hiển thị các đề thi cùng cấp độ để luyện tập"
BL "Hồ sơ giáo viên — kinh nghiệm, chứng chỉ, số học viên đã dạy"
BL "Đánh giá học viên — điểm sao trung bình và nhận xét chi tiết"
BL "Gói giá (Pricing Packages) — xem các gói khác nhau nếu khoá có phí"
BL "Nút 'Đăng ký học miễn phí' (khoá miễn phí) hoặc 'Thêm vào giỏ hàng' (khoá có phí)"

H2 "3.3 Đăng ký & Kích hoạt khoá học"
BL "Khoá miễn phí: Nhấn 'Đăng ký học miễn phí' → bắt đầu học ngay lập tức"
BL "Khoá có phí: Thêm vào giỏ hàng → thanh toán → nhận quyền truy cập vĩnh viễn"
BL "Kích hoạt bằng mã (activation code): Truy cập /kich-hoat → nhập mã → khoá học xuất hiện trong 'Khoá học của tôi'"
IMG "19_my_courses.png" 15.5 8 "Hình 3.4 — Trang Khoá học của tôi với tiến độ học tập"
BL "Trang 'Khoá học của tôi' (/my-courses): xem tất cả khoá đã đăng ký, thanh tiến độ %, thời gian học gần nhất, bài học tiếp theo"
BL "Chứng chỉ PDF — tải xuống khi hoàn thành 100% và đạt bài kiểm tra cuối khoá"

H2 "3.4 Giao diện học bài (Session Player) — Chi tiết đầy đủ"
P "Khi nhấn vào bài học (session), hệ thống mở trình phát học (Session Player) tại /learn/[id] với giao diện đầy đủ tính năng tương tác."
IMG "23_my_lesson.png" 15.5 8 "Hình 3.5 — Bài học mới cập nhật từ các khoá đã đăng ký"

H4 "Thanh tiêu đề (Sub-header)"
BL "Nút '← Quay lại' — trở về trang khoá học"
BL "Tên bài học hiển thị ở giữa"
BL "Badge 'Đã hoàn thành' (màu xanh lá) nếu đã xem xong bài"
BL "Phần trăm đã xem (VD: 75%) nếu chưa hoàn thành"
BL "Nút chuyển đổi giao diện Tối/Sáng (Dark/Light mode) — lưu vào localStorage"
BL "Nút 'Nội dung' — mở/đóng sidebar danh sách bài học (trên màn hình nhỏ)"

H4 "Khu vực video chính"
BL "Trình phát HLS (HTTP Live Streaming) cho video chất lượng cao"
BL "Tự động tiếp tục từ vị trí đã xem lần trước (resume playback)"
BL "Tự động lưu vị trí xem sau mỗi 5 giây để không mất tiến độ"
BL "Video quiz pop-up: Video tự động dừng tại mốc thời gian định sẵn → hiện bài quiz ngắn → tiếp tục sau khi trả lời"

H4 "Thanh timeline phân đoạn (Segment Timeline Bar)"
BL "Thanh màu nằm dưới video — chia video thành các phân đoạn (segment) nhỏ"
BL "Mỗi phân đoạn được tô màu theo trạng thái: Xanh dương = đang xem | Xanh lá = đã hoàn thành | Xám = chưa xem"
BL "Nhấn vào bất kỳ điểm nào trên thanh để nhảy đến phân đoạn đó trong video"
BL "Bên dưới thanh: Thời gian hiện tại / Tổng thời lượng (VD: 03:25 / 12:40)"

H4 "Panel phân đoạn đang hoạt động"
BL "Hiển thị số thứ tự, tên và khoảng thời gian của phân đoạn đang xem"
BL "Badge 'Đã hoàn thành' màu xanh khi phân đoạn kết thúc"
BL "Nút 'Đánh dấu hoàn thành' thủ công nếu chưa tự động đánh dấu"

H4 "Tài liệu đính kèm theo phân đoạn (Assets)"
P "Mỗi phân đoạn video có thể kèm theo nhiều tài liệu học tập xuất hiện tự động khi video đến đúng mốc thời gian. Có 7 loại tài liệu:"
TBL @("Loại Asset","Biểu tượng","Nội dung & Tương tác") @(
    ,@("Ghi chú (NoteBlock)","📝 Vàng","Hiển thị ghi chú văn bản + danh sách highlight. Đọc để nắm ý chính"),
    ,@("Ngữ pháp (GrammarBlock)","📐 Xanh dương","Công thức ngữ pháp (mono font) + ví dụ câu song ngữ Việt-Anh + từ khoá"),
    ,@("Từ vựng (VocabularyBlock)","📚 Xanh lá","Danh sách từ vựng — nhấn từng từ để xem IPA, nghĩa và câu ví dụ có dịch"),
    ,@("Bài quiz nhúng (QuizBlock)","❓ Vàng","Trắc nghiệm ngắn — chọn đáp án → nộp → xem điểm và giải thích ngay"),
    ,@("Bài tập điền từ (ExerciseBlock)","✏️ Cam","Điền từ vào chỗ trống trong câu → nhấn Kiểm tra → thấy đáp án đúng/sai"),
    ,@("Tài liệu PPT/PDF (PPTBlock)","📊 Xanh ngọc","Xem trực tiếp file PowerPoint/PDF trong trình duyệt + nút tải xuống"),
    ,@("File đính kèm (FileAttachment)","📎 Đỏ","Tải xuống tài liệu kèm theo bài học (PDF, DOCX, ZIP...)")
)
IMG "23b_session_assets.png" 15.5 8 "Hình 3.6 — Tài liệu học tập (Assets) xuất hiện tự động theo mốc thời gian video"

H4 "Panel bình luận (Comment Panel)"
BL "Mặc định hiển thị ở cột bên phải của video (trên màn hình rộng)"
BL "Nhấn nút 'Bình luận' trên thanh tiêu đề để ẩn/hiện panel"
BL "Gõ bình luận vào ô văn bản → nhấn Enter hoặc nút gửi"
BL "Bình luận theo mốc thời gian video — nhấn timestamp trong bình luận để nhảy đến đúng điểm trong video"
BL "Thích (Like) và trả lời (Reply) bình luận của người khác"
BL "Xem tất cả bình luận của bài học — cuộn để tải thêm"

H4 "Panel Hỏi đáp Q&A (QA Section)"
BL "Tab riêng biệt bên cạnh bình luận — dành cho câu hỏi học thuật"
BL "Đặt câu hỏi bằng văn bản — giáo viên và cộng đồng trả lời"
BL "Đánh dấu câu trả lời là 'Tốt nhất' (Best Answer)"

H4 "Sidebar danh sách bài học (Segments Sidebar)"
BL "Danh sách toàn bộ phân đoạn trong bài học hiện tại"
BL "Mỗi phân đoạn: Số thứ tự | Tên | Khoảng thời gian | Trạng thái (xem/chưa xem/hoàn thành)"
BL "Nhấn phân đoạn để nhảy đến đúng vị trí trong video"
BL "Màu xanh lá = đã hoàn thành | Xanh dương = đang xem | Xám = chưa xem"

H4 "Các loại bài học (Session Type)"
TBL @("Loại","Mô tả giao diện","Tính năng đặc biệt") @(
    ,@("Interactive (Tương tác)","Video + Segments + Assets + Bình luận","Đầy đủ nhất — phổ biến nhất"),
    ,@("Reading (Đọc)","Văn bản HTML + Assets","Cuộn đọc như trang web thông thường"),
    ,@("Audio (Nghe)","Trình phát âm thanh + Ảnh đại diện","Nghe podcast/audio bài học"),
    ,@("PDF","Nhúng PDF full-screen trong trình duyệt","Xem tài liệu PDF trực tiếp")
)
PB

Write-Host "=== HV: Sách ==="
H1 "4. Sách — Mua sắm & Giao hàng"
IMG "07_books_list.png" 15.5 9 "Hình 4.1 — Cửa hàng sách MLS"
IMG "07b_book_detail.png" 15.5 9 "Hình 4.2 — Chi tiết sách với mục lục và đánh giá"
BL "Thể loại: Giáo trình CEFR | Luyện thi VSTEP & OPIC | Từ điển Việt-Anh | Văn học tiếng Việt | Sách doanh nhân"
BL "Chi tiết sách: Ảnh bìa (có thể phóng to) + Ảnh trang nội dung, Mô tả, Mục lục, Thông tin tác giả, Đánh giá"
BL "Trạng thái kho: Còn hàng (số lượng) | Sắp về hàng | Hết hàng"
BL "Nút 'Thêm vào giỏ hàng' hoặc 'Mua ngay' → chuyển thẳng đến thanh toán"
NOTE "Giao hàng ViettelPost: Nội thành 1–2 ngày, Ngoại tỉnh 3–5 ngày làm việc."

H1 "5. Giỏ hàng & Thanh toán"
IMG "18_cart.png" 15.5 7 "Hình 5.1 — Giỏ hàng với danh sách sách và ô nhập voucher"
BL "Bước 1: Kiểm tra danh sách sách, thay đổi số lượng hoặc xoá sách không mua"
BL "Bước 2: Nhập mã voucher → nhấn 'Áp dụng' → số tiền giảm tự động cập nhật"
BL "Bước 3: Nhấn 'Tiến hành thanh toán'"
BL "Bước 4: Nhập địa chỉ giao hàng — Tên người nhận, SĐT, Địa chỉ chi tiết, Phường/Xã, Quận/Huyện, Tỉnh/TP"
BL "Bước 5: Chọn phương thức vận chuyển Tiêu chuẩn hoặc Nhanh — xem thời gian giao và phí"
BL "Bước 6: Chọn thanh toán: Chuyển khoản | MoMo | ZaloPay | VNPay | COD (nhận hàng trả tiền)"
BL "Bước 7: Kiểm tra tổng đơn → nhấn 'Đặt hàng' → nhận email xác nhận kèm mã vận đơn ViettelPost"
BL "Theo dõi đơn hàng: Truy cập /don-hang → xem trạng thái → nhấn mã vận đơn để tra cứu ViettelPost"
NOTE "Đơn chuyển khoản bị huỷ tự động sau 24 giờ nếu chưa thanh toán. Đổi/trả sách trong 7 ngày kể từ nhận hàng."
PB

Write-Host "=== HV: Thi online ==="
H1 "6. Thi online — VSTEP, OPIC, Tổng quát & Live"
IMG "08_quiz_list.png" 15.5 8 "Hình 6.1 — Trang danh sách bài thi online"
H2 "6.1 Các loại bài thi"
TBL @("Loại","Mô tả","Kỹ năng","Chứng chỉ") @(
    ,@("Tổng quát (Standard)","Kiểm tra ngữ pháp, từ vựng, đọc hiểu theo CEFR","Đọc, Ngữ pháp, Từ vựng","Không"),
    ,@("OPIC","AI phân tích Speaking, chấm điểm tự động theo CEFR","Nói (Speaking)","Có — OPIC Certificate"),
    ,@("VSTEP","Chuẩn hoá Bộ GD&ĐT, 4 kỹ năng đầy đủ B1–C1","Nghe+Đọc+Viết+Nói","Có — VSTEP Certificate"),
    ,@("Live Exam","Giáo viên tổ chức theo thời gian thực","Tuỳ đề GV","Không"),
    ,@("Adaptive","Bài thi tự điều chỉnh độ khó theo câu trả lời","Tổng hợp","Không")
)
H2 "6.2 Quy trình làm bài thi Standard/Adaptive"
BL "Nhấn vào bài thi → xem: Số câu, Thời gian, Điểm đậu (%), Số lần đã thi, Điểm cao nhất"
BL "Nhấn 'Bắt đầu thi' → đồng hồ đếm ngược chạy trên góc phải"
BL "Trả lời từng câu — có thể nhấn biểu tượng cờ để đánh dấu câu cần xem lại"
BL "Thanh điều hướng câu hỏi — nhảy đến bất kỳ câu nào trong đề"
BL "Nhấn 'Nộp bài' → hộp xác nhận → xác nhận nộp → kết quả hiển thị ngay"
BL "Kết quả: Điểm số, Điểm đậu/Rớt, % đúng theo từng loại câu hỏi, đáp án đúng/sai từng câu + giải thích"
H2 "6.3 Quy trình thi OPIC Speaking"
BL "Chọn bài thi OPIC → xem hướng dẫn → nhấn 'Bắt đầu'"
BL "Mỗi câu hỏi: Đọc đề + nghe audio gợi ý (có thể nghe lại tối đa 1–3 lần)"
BL "Nhấn nút ghi âm 🎙 → nói câu trả lời trong thời gian quy định (thường 30–120 giây)"
BL "Hệ thống AI phân tích: Phát âm, Ngữ điệu, Từ vựng sử dụng, Ngữ pháp, Độ lưu loát"
BL "Kết quả (/opic/[id]/result): Điểm tổng, điểm từng tiêu chí, nhận xét chi tiết từng câu"
BL "Lịch sử thi OPIC: Xem lại tất cả lần thi tại /opic/history"
H2 "6.4 Quy trình thi VSTEP"
BL "VSTEP gồm 4 phần thi riêng biệt — có thể làm lần lượt hoặc theo lịch"
BL "Nghe (Listening /vstep/[id]/listening): Nghe audio, trả lời trắc nghiệm. Không thể tua lại audio"
BL "Đọc (Reading /vstep/[id]/reading): Đọc đoạn văn (passages), trả lời câu hỏi trong thời gian quy định"
BL "Viết (Writing /vstep/[id]/writing): Viết bài luận — AI chấm điểm theo tiêu chí từ vựng, ngữ pháp, cấu trúc"
BL "Nói (Speaking /vstep/[id]/speaking): Ghi âm trả lời — AI phân tích tương tự OPIC"
BL "Kết quả (/vstep/[id]/result): Điểm tổng và điểm từng kỹ năng theo thang CEFR"
H2 "6.5 Thi Live (Thời gian thực)"
BL "Giáo viên gửi mã phòng 6 ký tự → Truy cập /realtime/join → nhập mã → nhấn 'Tham gia'"
BL "Chờ giáo viên bắt đầu thi → làm bài trong thời gian quy định"
BL "Kết quả hiển thị ngay sau khi giáo viên kết thúc thi"
H2 "6.6 Kiểm tra xếp lớp (Placement Test)"
IMG "17_placement_test.png" 15.5 7 "Hình 6.2 — Trang kiểm tra xếp lớp"
BL "Truy cập /placement-test → làm bài 45 phút: 20 câu Nghe + 20 câu Đọc + 20 câu Ngữ pháp"
BL "AI phân tích → xếp cấp độ A1–C2 → đề xuất khoá học phù hợp"
BL "Có thể làm lại sau 30 ngày"
PB

Write-Host "=== HV: Nhóm & Chat ==="
H1 "7. Nhóm học tập & Tính năng Chat"
IMG "09_groups.png" 15.5 8 "Hình 7.1 — Trang danh sách nhóm học tập"
H2 "7.1 Tham gia nhóm"
BL "Nhóm công khai (/nhom hoặc /groups): Tìm kiếm theo tên, chủ đề, cấp độ → nhấn 'Tham gia'"
BL "Nhóm riêng tư: Nhập mã mời 6 ký tự từ giáo viên → tham gia ngay"
BL "Xem thông tin nhóm: Số thành viên, Giáo viên phụ trách, Mức độ hoạt động, Chủ đề"
H2 "7.2 Hoạt động trong nhóm"
BL "Chat văn bản thời gian thực — gửi tin nhắn, câu hỏi ngay trong nhóm"
BL "Chia sẻ file và hình ảnh — tài liệu học, ghi chú, ảnh chụp màn hình"
BL "Bài đăng (Posts) của giáo viên: thông báo, bài tập, tài liệu bổ sung"
BL "Tương tác: Like | Bình luận | Tag thành viên bằng @tên"
BL "Chia sẻ kết quả thi và tiến độ học tập với cả nhóm"

H2 "7.3 Chat hỗ trợ trực tiếp (Support Chat)"
P "Tính năng Chat hỗ trợ cho phép học viên nhắn tin trực tiếp với đội ngũ hỗ trợ MLS. Biểu tượng chat nằm ở góc dưới phải màn hình — nhấn để mở cửa sổ chat."
BL "Nhấn biểu tượng chat 💬 góc dưới phải → cửa sổ chat mở"
BL "Gõ tin nhắn vào ô 'Nhập tin nhắn...' → nhấn Enter hoặc nút gửi"
BL "Xem lịch sử tin nhắn — phân nhóm theo ngày (Hôm nay / Hôm qua / Ngày cụ thể)"
BL "Nhận trả lời từ nhân viên hỗ trợ MLS trong giờ làm việc (8:00–18:00)"
BL "Ngoài giờ: Tin nhắn được lưu → nhân viên trả lời khi online"
BL "Trạng thái hội thoại: Đang mở (Open - xanh lá) | Đang chờ (Pending - vàng) | Đã đóng (Closed - xám)"
PB

Write-Host "=== HV: Hồ sơ & Thống kê ==="
H1 "8. Hồ sơ cá nhân, Thống kê & Cài đặt"
H2 "8.1 Chỉnh sửa thông tin cá nhân"
TBL @("Trường","Mô tả") @(
    ,@("Ảnh đại diện","Upload ảnh mới hoặc chọn từ thư viện — hiển thị trong tất cả bình luận và nhóm"),
    ,@("Họ và tên đầy đủ","Tên xuất hiện trên chứng chỉ, nhóm học và bảng xếp hạng"),
    ,@("Ngày sinh","Dùng để cá nhân hoá nội dung phù hợp độ tuổi"),
    ,@("Quốc tịch / Ngôn ngữ mẹ đẻ","AI điều chỉnh phương pháp dạy phù hợp"),
    ,@("Mục tiêu học tập","Giao tiếp hàng ngày | Công việc | Du lịch | Luyện thi"),
    ,@("Thay đổi mật khẩu","Cần nhập mật khẩu hiện tại để xác thực")
)
H2 "8.2 Thống kê học tập"
BL "Tổng số giờ học tích luỹ — từ ngày đăng ký đến hiện tại"
BL "Số bài học (session) đã hoàn thành — theo từng khoá và tổng"
BL "Điểm thi trung bình — cập nhật sau mỗi bài thi"
BL "Chuỗi ngày học liên tiếp (Streak) — mất chuỗi nếu bỏ 1 ngày"
BL "Thứ hạng Leaderboard — so sánh với học viên khác trong tuần/tháng"
BL "Lịch sử bài thi — xem lại đáp án, điểm, thời gian làm"
BL "Danh sách chứng chỉ — tải xuống PDF"
H2 "8.3 Quản lý thiết bị đăng nhập"
BL "Truy cập /settings/sessions → xem danh sách thiết bị đang đăng nhập"
BL "Nhấn 'Đăng xuất' từng thiết bị → thu hồi quyền truy cập từ xa"
BL "Đăng xuất tất cả thiết bị khác — bảo mật khi mất điện thoại"
PB

# ══════════════════════════════════════════
# PHẦN 2: GIÁO VIÊN
# ══════════════════════════════════════════
Banner "PHẦN 2" "HƯỚNG DẪN DÀNH CHO GIÁO VIÊN" "Teacher Guide — /teacher"
PB

Write-Host "=== GV: Dashboard ==="
H1 "9. Cổng thông tin Giáo viên — Tổng quan"
IMG "20_teacher_dashboard.png" 15.5 8 "Hình 9.1 — Teacher Portal tại /teacher"
P "Giáo viên truy cập cổng thông tin tại /teacher. Chỉ tài khoản có vai trò Teacher hoặc Admin mới truy cập được."
TBL @("Menu","URL","Chức năng") @(
    ,@("Khoá học","/teacher/courses","Tạo, chỉnh sửa khoá học — Module — Session — Asset"),
    ,@("Bài thi","/teacher/quizzes","Tạo và quản lý đề thi VSTEP/OPIC/Standard"),
    ,@("Ngân hàng câu hỏi","/teacher/questions","Tạo, lọc, quản lý toàn bộ câu hỏi"),
    ,@("Nhóm","/teacher/chat/groups","Tạo và quản lý nhóm học tập"),
    ,@("OPIC","/teacher/opic","Quản lý kịch bản và học viên OPIC"),
    ,@("VSTEP","/teacher/vstep","Quản lý passages và phiên thi VSTEP"),
    ,@("Thi Live","/teacher/realtime/new","Tạo phòng thi trực tiếp"),
    ,@("Kiểm tra xếp lớp","/teacher/placement","Cấu hình bài kiểm tra xếp lớp")
)
NOTE "Đăng ký Giáo viên: Gửi CV + bằng cấp + video giới thiệu 2–3 phút đến teacher@mls.edu.vn. Xét duyệt trong 5–7 ngày."
PB

Write-Host "=== GV: Khoá học - Module - Session - Asset ==="
H1 "10. Quản lý Khoá học — Cấu trúc đầy đủ"
IMG "20b_teacher_courses.png" 15.5 8 "Hình 10.1 — Danh sách khoá học của Giáo viên"
IMG "20c_teacher_course_detail.png" 15.5 9 "Hình 10.2 — Trang chỉnh sửa khoá học với đầy đủ 6 tab"
P "Khoá học trong MLS có cấu trúc phân cấp 4 tầng: Khoá học (Course) → Chương (Module) → Bài học (Session) → Tài liệu (Asset). Giáo viên quản lý từng tầng từ Teacher Portal."

H2 "10.1 Cấu trúc phân cấp khoá học"
TBL @("Tầng","Tên","Mô tả","URL quản lý") @(
    ,@("1","Course (Khoá học)","Container tổng thể chứa toàn bộ nội dung","/teacher/courses/[id]"),
    ,@("2","Module (Chương)","Nhóm các bài học theo chủ đề/tuần","/teacher/modules/[id]"),
    ,@("3","Session (Bài học)","Đơn vị nội dung học — video/audio/PDF/text","/teacher/sessions/[id]"),
    ,@("4","Asset (Tài liệu nhúng)","Tài liệu tương tác gắn theo phân đoạn video","Quản lý trong trang Session")
)

H2 "10.2 Form Khoá học — Tab Thông tin (Info)"
TBL @("Trường","Kiểu","Bắt buộc","Ghi chú") @(
    ,@("Tên khoá học","Văn bản","Có","Tiêu đề đầy đủ. VD: Tiếng Việt A1 — Người mới bắt đầu"),
    ,@("Mã khoá","Văn bản","Không","Mã nội bộ. VD: VN-A1-2026"),
    ,@("Mô tả ngắn","Textarea","Không","Tối đa 200 ký tự — hiển thị dưới tên trong danh sách"),
    ,@("Mô tả đầy đủ","RichText Editor","Không","Soạn thảo văn bản phong phú: in đậm, danh sách, link, hình ảnh"),
    ,@("Cấp độ","Dropdown","Có","A1 | A2 | B1 | B2 | C1 | C2 (tải từ API learningLevels)"),
    ,@("Ngôn ngữ","Dropdown","Có","🇻🇳 Tiếng Việt (VI) hoặc 🇬🇧 English (EN)"),
    ,@("Thời lượng (giờ)","Số","Không","Tổng thời lượng học ước tính của toàn khoá"),
    ,@("Tags","Văn bản","Không","Từ khoá phân cách bằng dấu phẩy. VD: A1, người mới, giao tiếp"),
    ,@("Mục tiêu học tập","Danh sách","Không","Nhập từng mục → Enter để thêm. VD: Giao tiếp cơ bản hàng ngày"),
    ,@("Yêu cầu đầu vào","Danh sách","Không","Kiến thức/kỹ năng cần có trước khi học khoá này"),
    ,@("Đối tượng học","Danh sách","Không","Khoá này dành cho ai. VD: Người chưa biết tiếng Việt"),
    ,@("Giáo viên phụ trách","Dropdown tìm kiếm","Có","Tìm theo tên hoặc email giáo viên"),
    ,@("Slug URL","Văn bản (read-only)","—","Tự động sinh. VD: /courses/tieng-viet-a1-nguoi-moi")
)

H2 "10.3 Form Khoá học — Tab Hình ảnh (Media)"
TBL @("Trường","Kích thước chuẩn","Cách upload") @(
    ,@("Ảnh thumbnail","320 × 180 px","Kéo thả file vào khu vực upload HOẶC nhấn để chọn file HOẶC nhập URL trực tiếp"),
    ,@("Ảnh banner","1200 × 400 px","Tương tự — hiển thị ở đầu trang chi tiết khoá học")
)
BL "Định dạng: JPG, PNG, WebP, GIF"
BL "Ảnh tải lên qua API: POST /api/v1/admin/cms/upload-thumbnail"
BL "Xem trước ảnh ngay sau khi upload — nhấn 'Xoá' để xoá ảnh hiện tại"

H2 "10.4 Form Khoá học — Tab Giá (Price)"
TBL @("Trường","Kiểu","Mô tả") @(
    ,@("Giá gốc","Số (VND, bước 1.000)","Giá bán thông thường"),
    ,@("Giá khuyến mãi","Số (VND, bước 1.000)","Giá sau giảm — phải thấp hơn giá gốc"),
    ,@("Ngày hết hạn KM","Chọn ngày (YYYY-MM-DD)","Sau ngày này giá KM tự hết hiệu lực"),
    ,@("Miễn phí (Is Free)","Checkbox","Bật = khoá hoàn toàn miễn phí, ẩn các trường giá")
)

H2 "10.5 Form Khoá học — Tab Cài đặt (Settings)"
TBL @("Trường","Giá trị","Mô tả") @(
    ,@("Hiển thị (Visibility)","Public / Private","Public = tất cả thấy | Private = chỉ người có link trực tiếp"),
    ,@("Ngày bắt đầu nhận đăng ký","Chọn ngày","Để trống = nhận đăng ký ngay"),
    ,@("Ngày kết thúc nhận đăng ký","Chọn ngày","Để trống = không giới hạn"),
    ,@("Cấp chứng chỉ","Checkbox","Bật = học viên nhận chứng chỉ PDF khi hoàn thành"),
    ,@("Yêu cầu hoàn thành 100%","Checkbox","Bật = phải xem hết toàn bộ bài học mới tính hoàn thành")
)
BL "Trạng thái khoá học: Draft → PendingReview (khi gửi duyệt) → Published (Admin duyệt) / Rejected (từ chối)"
BL "Nhấn 'Gửi duyệt' khi hoàn thiện nội dung — Admin nhận thông báo để xem xét"

H2 "10.6 Form Khoá học — Tab Bản dịch (Translations)"
BL "Nhập tên và mô tả khoá bằng tiếng Anh (en) và tiếng Hàn (ko)"
BL "Học viên chọn ngôn ngữ giao diện sẽ thấy bản dịch tương ứng"

H2 "10.7 Tab Chương học (Modules) — Quản lý đầy đủ"
P "Tab Modules hiển thị toàn bộ chương học của khoá, hỗ trợ kéo thả để sắp xếp thứ tự."
H4 "Tạo Chương mới"
TBL @("Trường","Bắt buộc","Mô tả") @(
    ,@("Tên chương","Có","VD: Chương 1 — Chào hỏi và Giới thiệu bản thân"),
    ,@("Mô tả","Không","Tóm tắt nội dung sẽ học trong chương"),
    ,@("Ảnh đại diện chương","Không","Upload ảnh thumbnail cho chương — hiển thị trong danh sách"),
    ,@("Thời lượng ước tính","Không","Tổng thời gian học các bài trong chương (phút)")
)
BL "Nhấn 'Thêm chương' → điền form → 'Lưu' → chương mới xuất hiện cuối danh sách"
BL "Kéo thả biểu tượng ⋮⋮ đầu mỗi chương để sắp xếp lại thứ tự — lưu tự động"
BL "Nhấn ✏️ để sửa thông tin chương | 🗑️ để xoá chương (toàn bộ bài học trong chương cũng bị xoá)"
BL "Nhấn tên chương để mở rộng → xem danh sách bài học bên trong"
PB

Write-Host "=== GV: Module & Session ==="
H1 "11. Quản lý Chương (Module) & Bài học (Session)"
H2 "11.1 Trang chi tiết Module (/teacher/modules/[id])"
P "Sau khi tạo Chương từ Tab Modules của khoá học, nhấn vào tên chương để vào trang quản lý chi tiết."
H4 "Chỉnh sửa thông tin Chương"
TBL @("Trường","Mô tả") @(
    ,@("Tên chương","Tiêu đề hiển thị cho học viên"),
    ,@("Mô tả","HTML mô tả chi tiết nội dung chương — dùng RichText Editor"),
    ,@("Ảnh đại diện","Upload file hoặc nhập URL — hiển thị trong sidebar khoá học"),
    ,@("Thời lượng ước tính","Tổng phút học của chương"),
    ,@("Thứ tự (Order Index)","Số thứ tự hiển thị trong danh sách chương"),
    ,@("Khoá chương (Is Locked)","Checkbox — bật = học viên phải hoàn thành chương trước mới học được")
)

H4 "Tạo Bài học mới (Session) trong Chương"
TBL @("Trường","Bắt buộc","Mô tả chi tiết") @(
    ,@("Tên bài học","Có","Tiêu đề bài. VD: Bài 1 — Cách chào hỏi người lớn tuổi hơn"),
    ,@("Loại bài học","Có","Interactive (Video+Assets) | Reading | Audio | PDF — quyết định giao diện học"),
    ,@("Mô tả","Không","Tóm tắt nội dung bài học"),
    ,@("Dùng thử miễn phí","Checkbox","Bật = học viên chưa mua khoá vẫn xem được bài này (preview)"),
    ,@("Nội dung (Reading)","RichText","Chỉ hiện khi loại = Reading — nhập nội dung văn bản HTML"),
    ,@("URL Audio (Audio)","Văn bản URL","Chỉ hiện khi loại = Audio — đường dẫn file âm thanh"),
    ,@("URL Tài liệu (PDF)","Văn bản URL","Chỉ hiện khi loại = PDF — đường dẫn file PDF"),
    ,@("Điểm tối thiểu","Số","Điểm cần đạt để hoàn thành bài học"),
    ,@("Thời lượng (phút)","Số","Thời lượng ước tính của bài học")
)
BL "Nhấn 'Thêm bài học' → điền form → 'Lưu' → bài học xuất hiện trong danh sách"
BL "Kéo thả để sắp xếp lại thứ tự bài học trong chương"
BL "Nhấn 'Sửa' để chỉnh sửa thông tin | 'Xoá' để xoá bài học"
BL "Nhấn tên bài học để mở trang chi tiết Session — nơi upload video và quản lý Assets"
PB

Write-Host "=== GV: Session Editor ==="
H1 "12. Trình chỉnh sửa Bài học (Session Editor)"
P "Trang Session Editor tại /teacher/sessions/[id] là nơi quản lý đầy đủ nội dung bài học: upload video, chia phân đoạn (Segments) và thêm tài liệu tương tác (Assets) vào từng phân đoạn."

H2 "12.1 Thông tin cơ bản Session"
BL "Nhấn nút 'Sửa' để chỉnh sửa: Tên bài học, Mô tả, Trạng thái Dùng thử miễn phí"
BL "Nhấn 'Lưu' để cập nhật | Nhấn 'Xuất bản' (Publish) để kích hoạt bài học cho học viên"

H2 "12.2 Upload Video"
BL "Nhấn nút 'Upload video' hoặc kéo thả file MP4/MOV/AVI vào khu vực upload"
BL "Thanh tiến trình hiển thị % đã tải lên — không đóng trang khi đang upload"
BL "Sau khi upload: Hệ thống xử lý (Processing) → chuyển sang HLS → Trạng thái 'Sẵn sàng' (Ready)"
BL "Video đã sẵn sàng mới hiển thị cho học viên"
TBL @("Trạng thái video","Biểu tượng","Mô tả") @(
    ,@("Pending (Chờ)","⏳","Video vừa upload, chưa xử lý"),
    ,@("Processing (Xử lý)","⚙️","Đang chuyển đổi sang định dạng HLS cho phát trực tuyến"),
    ,@("Ready (Sẵn sàng)","✅","Video đã sẵn sàng, học viên xem được"),
    ,@("Failed (Lỗi)","❌","Upload/xử lý thất bại — cần upload lại")
)

H2 "12.3 Quản lý Phân đoạn (Segments)"
P "Phân đoạn (Segment) chia video thành các đoạn nhỏ có tiêu đề riêng — học viên thấy trên thanh timeline và sidebar. Mỗi segment có thể kèm nhiều Assets."
H4 "Tạo Segment mới"
TBL @("Trường","Bắt buộc","Mô tả") @(
    ,@("Tên phân đoạn","Có","VD: Phần 1 — Cách phát âm tên người Việt"),
    ,@("Mô tả","Không","Mô tả ngắn về nội dung phân đoạn"),
    ,@("Thời gian bắt đầu","Có","Dạng M:SS hoặc giây. VD: 0:00 hoặc 2:30"),
    ,@("Thời gian kết thúc","Có","VD: 2:30 hoặc 6:00. Tự động gợi ý = bắt đầu segment trước + 6 phút")
)
BL "Nhấn '+ Thêm phân đoạn' → điền form → 'Lưu'"
BL "Nhấn ✏️ để sửa | 🗑️ để xoá segment (các Assets trong segment cũng bị xoá)"
BL "Các segment được hiển thị theo thứ tự thời gian"

H2 "12.4 Quản lý Tài liệu (Assets) trong Segment"
P "Mỗi Segment có thể có nhiều Assets — tài liệu xuất hiện tự động khi video đến đúng mốc thời gian (startTime). Học viên thấy và tương tác với assets trong khi xem video."

H4 "Tạo Asset mới — Thông tin chung"
TBL @("Trường","Bắt buộc","Mô tả") @(
    ,@("Loại Asset","Có","Chọn từ 7 loại: GrammarBlock, VocabularyBlock, QuizBlock, ExerciseBlock, PPTBlock, NoteBlock, FileAttachment"),
    ,@("Tiêu đề","Có","Tên hiển thị của asset"),
    ,@("Mô tả","Không","Mô tả ngắn về nội dung"),
    ,@("Thời điểm xuất hiện","Có","Giây hoặc M:SS — video đến mốc này asset sẽ hiện ra. VD: 1:30"),
    ,@("Thời điểm kết thúc","Không","Khi nào asset bị ẩn đi — để trống = hiện đến hết segment"),
    ,@("Công khai (isPublic)","Checkbox","Bật = học viên không mua khoá cũng thấy asset này (preview)")
)

H4 "Cấu hình Metadata theo từng loại Asset"
P "Mỗi loại Asset có định dạng Metadata JSON khác nhau — điền vào ô 'Nội dung (JSON)':"
TBL @("Loại Asset","Cấu trúc JSON metadata","Ví dụ") @(
    ,@("NoteBlock","{ content: string, highlights: string[] }","{ content: 'Khi gặp người lớn tuổi...', highlights: ['ạ', 'thưa', 'kính'] }"),
    ,@("GrammarBlock","{ pattern: string, examples: [{vi,en}], keywords: string[] }","{ pattern: 'S + đang + V', examples: [{vi:'Tôi đang học', en:'I am studying'}] }"),
    ,@("VocabularyBlock","{ words: [{word, ipa, meaning, example, exampleTranslation}] }","{ words: [{word:'xin chào', ipa:'sin tʃaːw', meaning:'hello', example:'Xin chào bạn!'}] }"),
    ,@("QuizBlock","{ passScore: number, questions: [{text, options, correct, explanation}] }","{ passScore: 70, questions: [{text:'Chọn đáp án', options:['A','B'], correct:0}] }"),
    ,@("ExerciseBlock","{ type: 'fill', items: [{sentence, answer}] }","{ items: [{sentence:'Tôi ___ học', answer:'đang'}] }"),
    ,@("PPTBlock","{ fileUrl: string, fileName: string, slideCount: number }","{ fileUrl: 'https://...', fileName: 'Bai1.pptx', slideCount: 12 }"),
    ,@("FileAttachment","{ fileUrl: string, fileName: string, fileSize: number }","{ fileUrl: 'https://...', fileName: 'TaiLieu.pdf', fileSize: 524288 }")
)
BL "Nhấn '+ Thêm asset' trong dòng segment → điền form → 'Lưu'"
BL "Nhấn ✏️ để sửa | 🗑️ để xoá asset"
BL "Thứ tự assets trong segment = thứ tự xuất hiện khi học"
PB

Write-Host "=== GV: Bài thi ==="
H1 "13. Quản lý Bài thi — Tạo & Cấu hình đầy đủ"
IMG "21_teacher_quizzes.png" 15.5 8 "Hình 13.1 — Trang quản lý bài thi Teacher Portal"

H2 "13.1 Wizard tạo đề thi — Bước 0: Chọn nền tảng"
TBL @("Nền tảng","Màu","Loại thi có thể tạo","Dùng cho") @(
    ,@("Standard","Xanh dương nhạt","PracticeQuiz, MidtermQuiz, FinalQuiz, CourseQuiz, PlacementTest","Bài tập hàng ngày, kiểm tra giữa/cuối kỳ"),
    ,@("OPIC","Xanh lá","OPICMockTest, OPICMiniTest","Thi Nói AI-graded — chuẩn OPIC quốc tế"),
    ,@("VSTEP","Cam","VSTEPFullTest, VSTEPListeningTest, VSTEPReadingTest, VSTEPWritingTest","Thi chuẩn hoá Bộ GD&ĐT")
)

H2 "13.2 Bước 1: Thông tin cơ bản đề thi"
IMG "21b_teacher_quiz_new.png" 15.5 9 "Hình 13.2 — Form tạo bài thi mới — Bước 1: Thông tin cơ bản"
TBL @("Trường","Kiểu","Mặc định","Mô tả") @(
    ,@("Tên bài thi","Văn bản (bắt buộc)","—","Tiêu đề hiển thị. VD: Kiểm tra giữa kỳ B2 — Tháng 6/2026"),
    ,@("Mô tả","Textarea","—","Hướng dẫn cho học viên: phạm vi đề, lưu ý khi thi"),
    ,@("Loại bài thi","Dropdown (bắt buộc)","PracticeQuiz","Danh sách thay đổi theo nền tảng đã chọn ở Bước 0"),
    ,@("Kỹ năng kiểm tra","Dropdown","(trống)","Reading | Listening | Speaking | Writing | Grammar | Vocabulary | Mixed"),
    ,@("Thời gian làm bài","Số (phút, tối thiểu 1)","—","VD: 45 phút cho kiểm tra giữa kỳ"),
    ,@("Điểm đậu (%)","Số từ 0–100","70","Từ ngưỡng này trở lên = vượt qua. Mặc định 70%"),
    ,@("Trộn thứ tự câu","Checkbox","Bật","Mỗi học viên nhận đề có thứ tự câu hỏi khác nhau"),
    ,@("Hiện đáp án sau thi","Checkbox","Bật","Học viên xem đáp án đúng/sai ngay sau khi nộp")
)

H2 "13.3 Bước 2: Chọn câu hỏi từ Ngân hàng"
BL "Ô tìm kiếm — lọc câu theo từ khoá trong nội dung"
BL "Bộ lọc Loại câu hỏi: Single Choice | Multiple Choice | True/False | Fill Blank | Matching | Ordering"
BL "Đánh dấu checkbox để chọn nhiều câu hỏi cùng lúc"
BL "Nhấn 'Thêm vào đề' → câu hỏi được thêm theo thứ tự chọn"
BL "Sau khi tạo có thể kéo thả để sắp xếp lại thứ tự câu hỏi trong đề"

H2 "13.4 Chỉnh sửa đề thi — 4 Tab"
H4 "Tab Cài đặt (Settings)"
BL "Chỉnh sửa tất cả thông tin đã nhập: Tên, Mô tả, Loại thi, Kỹ năng, Thời gian, Điểm đậu"
BL "Bật/tắt Trộn câu hỏi và Hiện đáp án"
BL "Nhấn 'Lưu thay đổi'"

H4 "Tab Câu hỏi (Questions)"
BL "Xem danh sách câu hỏi: Số thứ tự | Nội dung (rút gọn 100 ký tự) | Loại | Điểm"
BL "Nhấn '+ Thêm câu hỏi' → tìm kiếm và chọn từ ngân hàng"
BL "Nhấn 🗑️ để xoá câu khỏi đề (không xoá khỏi ngân hàng)"
BL "Kéo thả để sắp xếp lại thứ tự"

H4 "Tab OPIC (chỉ hiện với đề OPIC)"
P "Cấu hình chi tiết từng câu hỏi Speaking cho bài thi OPIC:"
TBL @("Trường","Tuỳ chọn","Mô tả") @(
    ,@("Loại câu OPIC (Tag)","orientation | describe | routine | experience | roleplay | question-asking","Phân loại câu hỏi theo tiêu chí OPIC quốc tế"),
    ,@("URL file audio gợi ý","Đường dẫn URL","File âm thanh chứa câu hỏi/chủ đề học viên nghe trước khi trả lời"),
    ,@("Thời gian ghi âm (giây)","15 – 300 giây | Mặc định: 120","Thời gian học viên có để suy nghĩ và ghi âm câu trả lời"),
    ,@("Số lần nghe lại audio","1 lần | 2 lần | 3 lần","Học viên được phép nghe lại câu hỏi tối đa bao nhiêu lần")
)

H4 "Tab Bài đọc VSTEP (chỉ hiện với đề VSTEP)"
BL "Thêm Passage (đoạn văn đọc hiểu): Tiêu đề + Nội dung văn bản + Nguồn tham khảo"
BL "Liên kết câu hỏi Reading với đúng passage tương ứng"
BL "Học viên đọc passage rồi trả lời các câu hỏi liên quan"
BL "Quản lý danh sách passages tại /teacher/vstep/passages"

H2 "13.5 Analytics bài thi (/teacher/quizzes/[id]/analytics)"
BL "Điểm trung bình cả lớp | Điểm cao nhất/thấp nhất | Tỷ lệ đậu/rớt"
BL "Biểu đồ phân bố điểm theo khoảng"
BL "Top câu hỏi học viên hay sai nhất — để điều chỉnh nội dung giảng dạy"
BL "Danh sách học viên đã thi: Tên, Điểm, Thời gian nộp, Số lần thi"

H2 "13.6 Thi Live (Realtime Exam)"
BL "Truy cập /teacher/realtime/new → đặt tên phòng → chọn đề thi → nhấn 'Tạo phòng'"
BL "Mã phòng 6 ký tự được tạo → chia sẻ cho học viên"
BL "Màn hình Host (/teacher/realtime/[id]/host): Nhìn thấy học viên tham gia theo thời gian thực"
BL "Nhấn 'Bắt đầu thi' khi đủ người → theo dõi tiến độ từng học viên đang làm bài"
BL "Nhấn 'Kết thúc thi' → bảng xếp hạng điểm số + phân tích từng câu hiển thị ngay"
PB

Write-Host "=== GV: Câu hỏi ==="
H1 "14. Ngân hàng câu hỏi — Tạo & Quản lý đầy đủ"
IMG "22_teacher_questions.png" 15.5 8 "Hình 14.1 — Ngân hàng câu hỏi với bộ lọc"

H2 "14.1 Thông tin chung của câu hỏi"
TBL @("Trường","Kiểu","Bắt buộc","Mô tả & Ví dụ") @(
    ,@("Nội dung câu hỏi","Textarea","Có","Câu hỏi đầy đủ hiển thị cho học viên. VD: Chọn từ điền vào chỗ trống: 'Tôi ___ học tiếng Việt'"),
    ,@("Loại câu hỏi","Dropdown","Có","Xem bảng 6 loại bên dưới — quyết định giao diện nhập đáp án"),
    ,@("Kỹ năng","Dropdown","Có","Reading | Listening | Speaking | Writing | Grammar | Vocabulary | Mixed"),
    ,@("Độ khó","Dropdown","Có","Dễ (xanh lá) | Trung bình (cam) | Khó (đỏ)"),
    ,@("Điểm","Số (bước 0.1)","Có","Mặc định 1.0 — có thể là 0.5, 1.5, 2.0..."),
    ,@("Tags","Văn bản","Không","Từ khoá cách nhau bằng dấu phẩy. VD: B1, động từ, thì hiện tại tiếp diễn"),
    ,@("Giải thích đáp án","Textarea","Không","Lý do tại sao đáp án đúng — hiển thị cho học viên sau khi nộp bài")
)

H2 "14.2 Hướng dẫn 6 loại câu hỏi"
H4 "Loại 1: Một đáp án (Single Choice)"
BL "Học viên chọn DUY NHẤT 1 đáp án đúng trong 4 lựa chọn (mặc định)"
BL "Form tự động tạo 4 ô đáp án — nhấn '+ Thêm đáp án' để thêm, nhấn X để xoá (tối thiểu 2)"
BL "Đánh dấu radio button ○ bên cạnh đáp án đúng — chỉ được chọn 1"
NOTE "Ví dụ: 'Từ nào chỉ hoạt động hàng ngày?' A: ăn sáng (✓) | B: đẹp | C: nhanh | D: đây"

H4 "Loại 2: Nhiều đáp án (Multiple Choice)"
BL "Học viên chọn TẤT CẢ đáp án đúng — có thể có 2, 3 hoặc nhiều hơn"
BL "Form giống Single Choice nhưng dùng checkbox ☐ thay vì radio"
BL "Đánh dấu checkbox vào tất cả các đáp án đúng"
BL "Học viên phải chọn đúng TẤT CẢ mới được điểm tối đa"
NOTE "Ví dụ: 'Những từ nào là danh từ?' A: sách (✓) | B: đọc | C: bàn (✓) | D: chạy"

H4 "Loại 3: Đúng/Sai (True/False)"
BL "Học viên phán đoán nhận định là Đúng hay Sai — 2 đáp án cố định"
BL "Form tự động tạo 2 ô: 'Đúng' và 'Sai' — chỉ cần đánh dấu cái nào đúng"
NOTE "Ví dụ: 'Hà Nội là thủ đô của Việt Nam.' → Đúng ✓"

H4 "Loại 4: Điền vào chỗ trống (Fill in the Blank)"
BL "Học viên gõ trực tiếp từ/cụm từ — không có lựa chọn"
BL "Ô 'Đáp án đúng': nhập từ/cụm từ chính xác — hệ thống so sánh tự động (không phân biệt hoa thường)"
BL "Nhập nhiều đáp án chấp nhận được, ngăn cách bằng dấu | (pipe)"
NOTE "Ví dụ: 'Hà Nội là ___ của Việt Nam.' → Đáp án: thủ đô | Thủ đô | thu do"

H4 "Loại 5: Nối đôi (Matching)"
BL "Học viên nối cặp tương ứng giữa 2 cột (VD: từ tiếng Việt ↔ nghĩa tiếng Anh)"
BL "Mỗi hàng là 1 cặp: Ô trái (cột A) + Ô phải (cột B) — điền nội dung vào cả hai"
BL "Đánh dấu cặp nào là khớp đúng"
BL "Hệ thống xáo trộn cột B khi hiển thị cho học viên"
NOTE "Ví dụ: 'sách' ↔ 'book' | 'bút' ↔ 'pen' | 'bàn' ↔ 'table'"

H4 "Loại 6: Sắp xếp thứ tự (Ordering)"
BL "Học viên kéo thả để sắp xếp các mục theo đúng thứ tự"
BL "Nhập các mục theo thứ tự đúng (từ trên xuống) — hệ thống sẽ xáo trộn khi hiển thị"
NOTE "Ví dụ: Sắp xếp câu hoàn chỉnh: 1.Tôi | 2.đang | 3.học | 4.tiếng Việt"

H2 "14.3 Tìm kiếm & Lọc ngân hàng câu hỏi"
TBL @("Bộ lọc","Tuỳ chọn") @(
    ,@("Tìm kiếm văn bản","Lọc câu hỏi chứa từ khoá trong nội dung"),
    ,@("Loại câu hỏi","Single | Multiple | True/False | Fill Blank | Matching | Ordering | (Tất cả)"),
    ,@("Độ khó","Dễ | Trung bình | Khó | (Tất cả)"),
    ,@("Kỹ năng","Reading | Listening | Speaking | Writing | Grammar | Vocabulary | Mixed | (Tất cả)")
)
BL "25 câu/trang — điều hướng trang ở cuối danh sách"
BL "Nhấn ✏️ Sửa để chỉnh sửa câu hỏi | 🗑️ Xoá để xoá câu (cần xác nhận)"
BL "Câu hỏi đã dùng trong đề thi sẽ cảnh báo khi xoá"
PB

Write-Host "=== GV: Nhóm & OPIC & VSTEP ==="
H1 "15. Quản lý Nhóm, OPIC & VSTEP"
H2 "15.1 Nhóm học tập (/teacher/chat/groups)"
IMG "21e_teacher_groups.png" 15.5 8 "Hình 15.1 — Quản lý nhóm học tập của Giáo viên"
BL "Tạo nhóm: Nhấn 'Tạo nhóm mới' → Đặt tên, Mô tả, Chủ đề, Số thành viên tối đa, Loại (Công khai/Riêng tư)"
BL "Nhóm riêng tư: Hệ thống tự sinh mã mời 6 ký tự — chia sẻ cho học viên muốn mời"
BL "Duyệt yêu cầu gia nhập: Chấp nhận hoặc Từ chối từng yêu cầu (với nhóm riêng tư)"
BL "Đăng bài thông báo, tài liệu, bài tập cho toàn nhóm"
BL "Chat thời gian thực với tất cả thành viên"
BL "Xem thống kê: Tổng tin nhắn, Thành viên tích cực nhất"

H2 "15.2 Quản lý OPIC (/teacher/opic)"
IMG "21c_teacher_opic.png" 15.5 8 "Hình 15.2 — Trang quản lý OPIC của Giáo viên"
BL "Kịch bản OPIC (/teacher/opic/scripts): Tạo bộ câu hỏi Speaking theo chuẩn OPIC — 6 loại: orientation, describe, routine, experience, roleplay, question-asking"
BL "Tạo kịch bản mới (/teacher/opic/scripts/new): Đặt tên, chọn cấp độ, thêm câu hỏi và cấu hình audio"
BL "Học viên OPIC (/teacher/opic/students): Xem danh sách học viên đã thi OPIC, điểm số và bản ghi âm"

H2 "15.3 Quản lý VSTEP (/teacher/vstep)"
IMG "21d_teacher_vstep.png" 15.5 8 "Hình 15.3 — Trang quản lý VSTEP của Giáo viên"
BL "Passages (/teacher/vstep/passages): Tạo và quản lý đoạn văn đọc hiểu — Tiêu đề, Nội dung, Nguồn tham khảo"
BL "Phiên thi VSTEP (/teacher/vstep/sessions): Quản lý các đợt thi VSTEP"
BL "Liên kết câu hỏi Reading với đúng passage từ trang chỉnh sửa đề thi"
PB

# ══════════════════════════════════════════
# PHẦN 3: QUẢN TRỊ VIÊN
# ══════════════════════════════════════════
Banner "PHẦN 3" "HƯỚNG DẪN DÀNH CHO QUẢN TRỊ VIÊN" "Admin Guide — /admin"
PB

Write-Host "=== AD: Dashboard ==="
H1 "16. Bảng điều khiển Admin — Analytics"
IMG "03_admin_dashboard.png" 15.5 9 "Hình 16.1 — Bảng điều khiển Admin tại /admin"
IMG "03b_admin_analytics.png" 15.5 7 "Hình 16.2 — Trang Analytics chi tiết tại /admin/analytics"
BL "Bộ lọc: 7 ngày | 30 ngày | 90 ngày"
BL "Tab Tổng quan: Doanh thu, Đơn hàng, Học viên mới, Khoá học được đăng ký"
BL "Tab Người dùng: Biểu đồ tăng trưởng người dùng mới theo ngày"
BL "Tab Lượt xem: Thống kê lượt xem video theo ngày và theo khoá học"
BL "Tab Doanh số: Biểu đồ doanh thu, Top 10 sách bán chạy, Phân tích trạng thái đơn hàng"
PB

Write-Host "=== AD: Khoá học ==="
H1 "17. Quản lý Khoá học (Admin) — Toàn quyền"
IMG "10_admin_courses.png" 15.5 8 "Hình 17.1 — Danh sách toàn bộ khoá học tại /admin/courses"
P "Admin có quyền xem và quản lý TẤT CẢ khoá học của mọi giáo viên. Trang /admin/courses hiển thị danh sách đầy đủ với bộ lọc trạng thái, tìm kiếm theo tên, và các thao tác nhanh."

H2 "17.1 Danh sách & Tìm kiếm khoá học"
BL "Lọc theo trạng thái: Tất cả | Nháp (Draft) | Chờ duyệt (PendingReview) | Đã đăng (Published) | Từ chối (Rejected) | Lưu trữ (Archived)"
BL "Tìm kiếm theo tên khoá học hoặc tên giáo viên"
BL "Xem: ID, Tên, Giáo viên, Cấp độ, Trạng thái, Ngày tạo, Số học viên"
BL "Thao tác nhanh: Sửa | Xem trước | Duyệt / Từ chối | Lưu trữ | Xoá"
TBL @("Trạng thái","Màu badge","Mô tả","Hành động có thể") @(
    ,@("Draft (Nháp)","Xám","GV mới tạo, chưa gửi duyệt","Sửa, Xoá"),
    ,@("PendingReview (Chờ duyệt)","Cam","GV đã gửi — chờ Admin xem","Duyệt, Từ chối, Sửa"),
    ,@("Published (Đã đăng)","Xanh lá","Đã duyệt — hiện trên trang công khai","Sửa, Lưu trữ, Xoá"),
    ,@("Rejected (Từ chối)","Đỏ","Bị từ chối kèm lý do","Sửa, Gửi lại duyệt, Xoá"),
    ,@("Archived (Lưu trữ)","Đỏ nhạt","Ẩn với học viên mới — học viên cũ vẫn học được","Khôi phục, Xoá")
)

H2 "17.2 Tạo & Chỉnh sửa khoá học — 6 Tab đầy đủ"
IMG "10b_admin_course_detail.png" 15.5 9 "Hình 17.2 — Trang chỉnh sửa chi tiết khoá học tại /admin/courses/[id]"
P "Nhấn 'Tạo khoá học mới' hoặc nhấn tên khoá để mở form chỉnh sửa. Form gồm 6 tab:"

H4 "Tab 1: Thông tin (Info)"
TBL @("Trường","Bắt buộc","Mô tả") @(
    ,@("Tên khoá học","Có","Tiêu đề đầy đủ hiển thị trên trang công khai"),
    ,@("Giáo viên phụ trách","Có","Admin chọn bất kỳ giáo viên nào trong hệ thống"),
    ,@("Mô tả ngắn","Không","Tối đa 200 ký tự — hiển thị dưới tên trong danh sách"),
    ,@("Mô tả đầy đủ","Không","RichText Editor — soạn HTML đầy đủ: tiêu đề, danh sách, hình ảnh, link"),
    ,@("Cấp độ CEFR","Có","A1 | A2 | B1 | B2 | C1 | C2"),
    ,@("Ngôn ngữ","Có","Tiếng Việt (VI) | English (EN)"),
    ,@("Thời lượng (giờ)","Không","Tổng thời lượng học ước tính"),
    ,@("Tags","Không","Từ khoá phân cách bằng dấu phẩy"),
    ,@("Mục tiêu học tập","Không","Danh sách bullet — nhập từng mục, Enter để thêm"),
    ,@("Yêu cầu đầu vào","Không","Kiến thức/kỹ năng cần có trước khi học"),
    ,@("Đối tượng học","Không","Khoá này dành cho ai")
)

H4 "Tab 2: Hình ảnh (Media)"
BL "Ảnh thumbnail (320×180 px): Kéo thả file HOẶC nhấn chọn HOẶC nhập URL trực tiếp"
BL "Ảnh banner (1200×400 px): Hiển thị ở đầu trang chi tiết khoá học"
BL "Định dạng: JPG, PNG, WebP — xem trước ngay sau upload"

H4 "Tab 3: Giá (Price)"
TBL @("Trường","Kiểu","Mô tả") @(
    ,@("Miễn phí (Is Free)","Checkbox","Bật = khoá hoàn toàn miễn phí, ẩn các trường giá bên dưới"),
    ,@("Giá gốc","Số (VND, bước 1.000)","Giá bán thông thường"),
    ,@("Giá khuyến mãi","Số (VND)","Phải thấp hơn giá gốc — hiển thị nổi bật trên trang khoá học"),
    ,@("Ngày hết hạn KM","Chọn ngày","Sau ngày này giá KM tự hết hiệu lực — về giá gốc")
)

H4 "Tab 4: Cài đặt (Settings)"
TBL @("Trường","Giá trị","Mô tả") @(
    ,@("Hiển thị","Public / Private","Public = tất cả thấy | Private = chỉ người có link"),
    ,@("Ngày bắt đầu nhận ĐK","Chọn ngày","Để trống = nhận đăng ký ngay"),
    ,@("Ngày kết thúc nhận ĐK","Chọn ngày","Để trống = không giới hạn"),
    ,@("Cấp chứng chỉ","Checkbox","Học viên nhận chứng chỉ PDF khi hoàn thành"),
    ,@("Yêu cầu hoàn thành 100%","Checkbox","Phải xem hết toàn bộ bài học mới tính hoàn thành")
)

H4 "Tab 5: Bản dịch (Translations)"
BL "Nhập tên và mô tả khoá bằng Tiếng Anh (en) và Tiếng Hàn (ko)"
BL "Học viên đổi ngôn ngữ giao diện sẽ thấy bản dịch tương ứng"

H4 "Tab 6: Chương học (Modules)"
BL "Xem toàn bộ chương (Module) của khoá — số lượng bài học trong mỗi chương"
BL "Nhấn 'Đi đến Module' để vào trang quản lý chi tiết tại /admin/modules/[id]"
BL "Admin có thể tạo Module mới, kéo thả sắp xếp thứ tự, chỉnh sửa và xoá chương"
BL "Trong mỗi Module: xem danh sách Session → nhấn 'Đi đến Session' tại /admin/sessions/[id]"

H2 "17.3 Quy trình duyệt khoá học"
BL "Giáo viên hoàn thiện nội dung → nhấn 'Gửi duyệt' → trạng thái chuyển sang PendingReview"
BL "Admin nhận thông báo → vào /admin/courses → lọc 'Chờ duyệt' → nhấn tên khoá để xem nội dung"
BL "Kiểm tra: thông tin tổng quát, ảnh, giá, nội dung chương/bài học"
BL "Nhấn 'Phê duyệt' → trạng thái Published → khoá hiện trên trang công khai"
BL "Nhấn 'Từ chối' → bắt buộc nhập lý do chi tiết → Giáo viên nhận thông báo + lý do"
NOTE "Sau khi Published: Admin có thể 'Lưu trữ' để ẩn tạm thời mà không xoá dữ liệu."
PB

Write-Host "=== AD: Sách + Đơn hàng ==="
H1 "18. Quản lý Sách"
IMG "11_admin_books.png" 15.5 8 "Hình 18.1 — Trang quản lý sách"
H2 "18.1 Thêm/Sửa sách"
TBL @("Trường","Bắt buộc","Mô tả") @(
    ,@("ISBN","Không","Mã ISBN-10 hoặc ISBN-13"),
    ,@("Tiêu đề sách","Có","Tên đầy đủ của sách"),
    ,@("Tác giả","Có","Họ tên tác giả/biên tập viên"),
    ,@("Nhà xuất bản","Không","Tên NXB"),
    ,@("Năm xuất bản","Không","Năm in"),
    ,@("Giá bán (VND)","Có","Giá niêm yết bán cho học viên"),
    ,@("Số trang","Không","Tổng số trang"),
    ,@("Cấp độ","Không","A1–C2 hoặc Không áp dụng"),
    ,@("Thể loại","Không","Giáo trình | Luyện thi | Từ điển | Văn học | Khác"),
    ,@("Ảnh bìa","Có","Upload JPG/PNG — hiển thị trong danh sách và chi tiết"),
    ,@("Ảnh trang nội dung","Không","Ảnh mẫu bên trong sách"),
    ,@("Số lượng tồn kho","Có","Số sách hiện có trong kho"),
    ,@("Ngưỡng cảnh báo hết hàng","Không","Cảnh báo khi tồn kho xuống dưới ngưỡng này")
)
BL "Ẩn/hiện sách: Nhấn nút toggle → sách không hiển thị cho học viên nhưng dữ liệu vẫn giữ"
BL "Xoá sách: Cần xác nhận — không thể xoá nếu còn đơn hàng liên quan"

H1 "19. Quản lý Đơn hàng"
IMG "12_admin_orders.png" 15.5 8 "Hình 19.1 — Trang quản lý đơn hàng"
H2 "19.1 Trạng thái đơn hàng & Hành động"
TBL @("Trạng thái","Mô tả","Hành động Admin") @(
    ,@("Chờ xử lý","Đơn vừa đặt","Xác nhận hoặc Huỷ"),
    ,@("Chờ thanh toán","Khách chọn chuyển khoản, chưa nhận tiền","Xác nhận khi nhận tiền vào TK"),
    ,@("Đã thanh toán","TT thành công, chờ đóng gói","Tạo vận đơn ViettelPost, in phiếu"),
    ,@("Đang xử lý","Đang đóng gói","Theo dõi vận đơn"),
    ,@("Hoàn thành","Khách đã nhận hàng","—"),
    ,@("Đã huỷ","Bị huỷ","Kiểm tra và xử lý hoàn tiền nếu cần"),
    ,@("Thất bại","Lỗi TT hoặc giao hàng","Liên hệ khách để xử lý")
)
BL "Tìm kiếm: Mã đơn | Email | SĐT | Tên người nhận"
BL "Tạo vận đơn ViettelPost: Mở đơn → kiểm tra địa chỉ → nhấn 'Tạo vận đơn' → in phiếu"
BL "Hoàn tiền (Refund): Mở đơn → 'Hoàn tiền' → nhập lý do + số tiền → xác nhận"
BL "Xem lịch sử trạng thái từng đơn: thời gian thay đổi + người thực hiện"
PB

Write-Host "=== AD: Voucher + Users ==="
H1 "20. Quản lý Voucher"
IMG "13_admin_vouchers.png" 15.5 8 "Hình 20.1 — Trang quản lý voucher"
H2 "20.1 Tạo voucher mới"
TBL @("Trường","Kiểu","Mô tả") @(
    ,@("Mã voucher","Văn bản hoặc Tạo ngẫu nhiên","Mã học viên nhập. VD: SUMMER2026 hoặc nhấn 'Tạo ngẫu nhiên'"),
    ,@("Loại giảm","% hoặc VND","Phần trăm (VD: 20%) hoặc Số tiền cố định (VD: 50.000 VND)"),
    ,@("Giá trị giảm","Số","Nếu %: nhập 1–100. Nếu VND: nhập số tiền"),
    ,@("Đơn hàng tối thiểu","Số (VND)","Chỉ dùng được khi tổng đơn ≥ mức này. VD: 200.000 VND"),
    ,@("Danh mục áp dụng","Dropdown","Tất cả | Chỉ sách | Chỉ khoá học"),
    ,@("Giới hạn 1 lần/tài khoản","Checkbox","Mỗi tài khoản chỉ dùng 1 lần"),
    ,@("Tổng số lần dùng","Số","Voucher tự hết hiệu lực khi đạt số này (0 = không giới hạn)"),
    ,@("Ngày bắt đầu","Chọn ngày","Voucher bắt đầu có hiệu lực từ ngày này"),
    ,@("Ngày hết hạn","Chọn ngày","Voucher không còn hiệu lực sau ngày này")
)

H1 "21. Quản lý Người dùng"
IMG "14_admin_users.png" 15.5 8 "Hình 21.1 — Trang quản lý người dùng"
BL "Tìm kiếm theo: Email | Họ tên | SĐT | Vai trò | Trạng thái"
BL "Xem chi tiết: Thông tin cá nhân, Khoá học đã đăng ký + tiến độ, Lịch sử thi, Đơn hàng, Lịch sử đăng nhập (IP, thiết bị)"
TBL @("Thao tác","Cách thực hiện","Ghi chú") @(
    ,@("Phân quyền","Mở chi tiết → chọn vai trò → Lưu","Student→Teacher→Admin. Cần SuperAdmin để cấp Admin"),
    ,@("Khoá tài khoản","Nhấn 'Khoá' → nhập lý do → xác nhận","Không đăng nhập được — có thể mở lại"),
    ,@("Mở khoá","Nhấn 'Mở khoá' → xác nhận","Hoạt động bình thường trở lại"),
    ,@("Vô hiệu hoá vĩnh viễn","Nhấn 'Vô hiệu hoá' → xác nhận 2 lần","Không thể khôi phục"),
    ,@("Reset mật khẩu","Nhấn 'Reset mật khẩu' → hệ thống gửi email link đặt lại","Dùng khi user không nhận được email tự động")
)
PB

Write-Host "=== AD: Chat Support ==="
H1 "22. Hệ thống Chat & Hỗ trợ trực tiếp (Admin)"
IMG "24_admin_chat_support.png" 15.5 9 "Hình 22.1 — Trang Chat Support tại /admin/chat/support"
P "Admin quản lý toàn bộ hội thoại hỗ trợ giữa học viên và đội ngũ tại /admin/chat/support. Hệ thống cập nhật tự động mỗi 15 giây."

H2 "22.1 Giao diện tổng quan Inbox"
BL "Sidebar trái — danh sách hội thoại với bộ lọc: Đang mở (Open) | Đang chờ (Pending) | Đã đóng (Closed)"
BL "Badge đếm số hội thoại đang mở (Open) trên đầu sidebar"
BL "Ô tìm kiếm — lọc hội thoại theo ID học viên"
BL "Mỗi hội thoại hiển thị: Avatar học viên, Tên/ID, Tin nhắn gần nhất, Thời gian, Badge trạng thái"

H2 "22.2 Xử lý hội thoại hỗ trợ"
BL "Nhấn hội thoại trong sidebar → khu vực giữa hiển thị toàn bộ lịch sử tin nhắn"
BL "Tin nhắn nhóm theo ngày: Hôm nay / Hôm qua / Ngày cụ thể"
BL "Avatar xanh indigo = Học viên | Avatar xanh emerald = Nhân viên hỗ trợ"
BL "Gõ trả lời vào ô text → nhấn Enter hoặc nút 'Gửi'"
BL "Nút 'Giao cho tôi' (Assign): Nhận hội thoại này về mình để xử lý"
BL "Nút 'Đóng' (Close): Đóng hội thoại khi đã giải quyết xong"

H2 "22.3 Cấu hình Chat (/admin/chat/config)"
BL "Bật/tắt tính năng Chat hỗ trợ trên toàn hệ thống"
BL "Thông điệp chào mừng — hiển thị khi học viên mở cửa sổ chat lần đầu"
BL "Giờ hoạt động — thời gian nhân viên hỗ trợ online"

H2 "22.4 Chat nhóm Admin (/admin/chat/groups)"
BL "Xem và tham gia quản lý tất cả nhóm học tập trên hệ thống"
BL "Kiểm soát nội dung, xoá tin nhắn vi phạm, kick thành viên vi phạm"
PB

Write-Host "=== AD: Phê duyệt & Cài đặt ==="
H1 "23. Phê duyệt nội dung & Cài đặt hệ thống"
H2 "23.1 Phê duyệt nội dung (/admin/content/approvals)"
BL "Danh sách bài đăng, video, tài liệu đang chờ duyệt từ giáo viên và học viên"
BL "Xem nội dung chi tiết → Phê duyệt hoặc Từ chối kèm lý do"

H2 "23.2 Cài đặt hệ thống (/admin/settings)"
IMG "25_admin_settings.png" 15.5 8 "Hình 23.2 — Trang cài đặt hệ thống"
BL "Cài đặt chung: Tên hệ thống, Logo, Favicon, Ngôn ngữ mặc định"
BL "Cài đặt Email: SMTP server, Tên người gửi, Email mẫu"
H2 "23.3 Banners quảng cáo (/admin/settings/banners)"
IMG "25b_admin_banners.png" 15.5 7 "Hình 23.3 — Quản lý banner trang chủ"
BL "Thêm banner mới: Tải ảnh (1200×400 px), Tiêu đề, Đường dẫn (URL khi click), Ngày bắt đầu, Ngày kết thúc"
BL "Bật/tắt từng banner không cần xoá — hữu ích để chuẩn bị trước chiến dịch"
BL "Kéo thả để sắp xếp thứ tự hiển thị banner trên trang chủ"
BL "Xoá banner: nhấn biểu tượng thùng rác → xác nhận"

H2 "23.4 Quản lý cấp độ học (/admin/levels)"
IMG "26_admin_levels.png" 15.5 7 "Hình 23.4 — Quản lý cấp độ CEFR"
BL "Xem danh sách cấp độ CEFR: A1, A2, B1, B2, C1, C2"
BL "Chỉnh sửa từng cấp: Tên hiển thị, Mô tả, Màu nhận diện"
BL "Tạo cấp độ tùy chỉnh mới nếu cần"

H2 "23.5 Quản lý Giáo viên (/admin/teachers)"
IMG "28_admin_teachers.png" 15.5 8 "Hình 23.5 — Trang quản lý Giáo viên"
BL "Xem danh sách tất cả Giáo viên: Tên, Email, Số khoá học, Số học viên, Ngày tham gia"
BL "Xem chi tiết hồ sơ giáo viên, danh sách khoá học và thống kê doanh thu"
BL "Phê duyệt/Từ chối đơn đăng ký Giáo viên mới từ trang này"
BL "Thu hồi quyền Giáo viên: tài khoản về Student, không mất dữ liệu khoá học đã tạo"

H2 "23.6 Phê duyệt nội dung (/admin/content/approvals)"
IMG "29_admin_approvals.png" 15.5 7 "Hình 23.6 — Trang phê duyệt nội dung đang chờ"
BL "Danh sách nội dung đang chờ duyệt từ giáo viên"
BL "Xem nội dung chi tiết → Phê duyệt (Published) hoặc Từ chối kèm lý do"

H2 "23.7 Quản lý vai trò & quyền (/admin/roles)"
IMG "27_admin_roles.png" 15.5 7 "Hình 23.7 — Quản lý vai trò và quyền hạn"
BL "Xem danh sách vai trò: Student, Teacher, ContentManager, Admin, SuperAdmin"
BL "Mỗi vai trò: Tên, Mô tả, Danh sách quyền (permissions)"
BL "Chỉnh sửa quyền từng vai trò — chỉ SuperAdmin mới thay đổi được vai trò Admin"
PB

Write-Host "=== FAQ & Liên hệ ==="
H1 "24. Câu hỏi thường gặp (FAQ)"
H3 "Tôi quên mật khẩu?"
P "Nhấn 'Quên mật khẩu?' ở trang đăng nhập → nhập email → nhận link đặt lại (hiệu lực 1 giờ). Kiểm tra cả Spam/Junk. Nếu không nhận được sau 5 phút → liên hệ support@mls.edu.vn."
H3 "Khoá học có hết hạn không?"
P "Không. Khoá học trên MLS không có hạn truy cập — học lại bất cứ lúc nào, xem video không giới hạn lần. Nội dung có thể được giáo viên cập nhật thêm theo thời gian."
H3 "Làm sao biết mình ở cấp độ CEFR nào?"
P "Làm Kiểm tra xếp lớp (/placement-test) miễn phí — 45 phút, AI xếp A1–C2 và đề xuất lộ trình học."
H3 "Chứng chỉ VSTEP có giá trị gì?"
P "Chứng chỉ VSTEP và OPIC được Bộ GD&ĐT Việt Nam công nhận chính thức. Chứng chỉ hoàn thành khoá học MLS cấp khi đạt 100% + kiểm tra cuối — dùng được trong hồ sơ xin việc."
H3 "Nhận sách sai/hỏng phải làm gì?"
P "Chụp ảnh và liên hệ support@mls.edu.vn trong 48 giờ kèm mã đơn. Xử lý đổi/trả trong 3–5 ngày, MLS chịu toàn bộ phí vận chuyển."
H3 "Asset trong bài học xuất hiện như thế nào?"
P "Asset gắn với một mốc thời gian trong video. Khi video phát đến đúng mốc đó, asset tự động hiện ra ở khu vực bên dưới hoặc bên phải video. Học viên có thể tương tác ngay trong khi xem."
H3 "Muốn trở thành Giáo viên MLS?"
P "Gửi email đến teacher@mls.edu.vn kèm CV, bằng cấp và video giới thiệu 2–3 phút. Đội ngũ xét duyệt 5–7 ngày làm việc."
PB

H1 "25. Thông tin liên hệ & Hỗ trợ"
P "Thời gian làm việc: Thứ Hai — Thứ Sáu, 8:00 — 18:00 (giờ Hà Nội, UTC+7)."
TBL @("Kênh","Thông tin","Phản hồi") @(
    ,@("Chat trực tuyến (học viên)","Bieu tuong chat goc duoi phai website","Trong gio lam viec: < 5 phut"),
    ,@("Email hỗ trợ kỹ thuật","support@mls.edu.vn","Trong vòng 24 giờ làm việc"),
    ,@("Email Giáo viên","teacher@mls.edu.vn","Trong vòng 48 giờ làm việc"),
    ,@("Cộng đồng Facebook","Nhóm: MLS Vietnamese Learners","Cộng đồng giải đáp 24/7"),
    ,@("Kênh YouTube","youtube.com/@MLSVietnamese","Video hướng dẫn miễn phí"),
    ,@("Văn phòng","Hà Nội, Việt Nam","Hẹn gặp trước qua email")
)
AddSP
$sel.ParagraphFormat.Alignment=1; SetFont 11 $false $true $cGray "Calibri"
$sel.TypeText("— Hết tài liệu Hướng dẫn sử dụng MLS v2.0 — Tháng 6/2026 —"); $sel.TypeParagraph()
$sel.ParagraphFormat.Alignment=0

Write-Host "`n=== LƯU FILE ==="
if(Test-Path $OUT){Remove-Item $OUT -Force}
$doc.SaveAs2($OUT,16); $doc.Close($false); $word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word)|Out-Null
$info=Get-Item $OUT
Write-Host "`nHOÀN THÀNH!"
Write-Host "File  : $OUT"
Write-Host "Size  : $([math]::Round($info.Length/1MB,2)) MB"
Write-Host "Thời gian: $(Get-Date -Format 'HH:mm:ss dd/MM/yyyy')"
