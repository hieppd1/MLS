# Generate User Guide using Word COM Object - guaranteed compatibility
# Run: powershell -ExecutionPolicy Bypass -File generate_with_word.ps1

$ErrorActionPreference = "Stop"
$SS = "D:\HiepPD\MLS\docs\user_guide\screenshots"
$OUT = "D:\HiepPD\MLS\docs\User_Guide_MLS.docx"

# Screenshot map: [filename, width_cm, height_cm, caption]
$IMAGES = @(
    @("01_homepage.png",       16, 9,  "Hinh 1.1 - Trang chu MLS chua dang nhap"),
    @("02_login_page.png",     16, 10, "Hinh 2.1 - Trang dang nhap"),
    @("02b_login_filled.png",  16, 10, "Hinh 2.2 - Nhap thong tin dang nhap"),
    @("16_register.png",       16, 10, "Hinh 2.3 - Trang dang ky tai khoan"),
    @("04_homepage_loggedin.png", 16, 9, "Hinh 3.1 - Trang chu sau khi dang nhap"),
    @("05_courses_list.png",   16, 10, "Hinh 4.1 - Danh sach khoa hoc"),
    @("06_course_detail.png",  16, 10, "Hinh 4.2 - Chi tiet khoa hoc"),
    @("06b_course_detail_scroll.png", 16, 9, "Hinh 4.3 - Noi dung chuong trinh"),
    @("19_my_courses.png",     16, 8,  "Hinh 4.4 - Khoa hoc cua toi"),
    @("23_my_lesson.png",      16, 8,  "Hinh 4.5 - Bai hoc moi"),
    @("07_books_list.png",     16, 10, "Hinh 5.1 - Cua hang sach"),
    @("07b_book_detail.png",   16, 9,  "Hinh 5.2 - Chi tiet sach"),
    @("08_quiz_list.png",      16, 7,  "Hinh 6.1 - Danh sach bai thi"),
    @("17_placement_test.png", 16, 6,  "Hinh 6.2 - Kiem tra xep lop"),
    @("09_groups.png",         16, 7,  "Hinh 7.1 - Nhom hoc tap"),
    @("18_cart.png",           16, 7,  "Hinh 9.1 - Gio hang"),
    @("20_teacher_dashboard.png", 16, 8, "Hinh 10.1 - Giao vien Dashboard"),
    @("21_teacher_quizzes.png",16, 8,  "Hinh 10.2 - Quan ly bai thi"),
    @("22_teacher_questions.png",16, 8,"Hinh 10.3 - Ngan hang cau hoi"),
    @("03_admin_dashboard.png",16, 9,  "Hinh 11.1 - Admin Dashboard"),
    @("10_admin_courses.png",  16, 8,  "Hinh 11.2 - Quan ly khoa hoc"),
    @("11_admin_books.png",    16, 8,  "Hinh 11.3 - Quan ly sach"),
    @("12_admin_orders.png",   16, 8,  "Hinh 11.4 - Quan ly don hang"),
    @("13_admin_vouchers.png", 16, 8,  "Hinh 11.5 - Quan ly voucher"),
    @("14_admin_users.png",    16, 8,  "Hinh 11.6 - Quan ly nguoi dung")
)

Write-Host "Starting Word COM..."
$word = New-Object -ComObject Word.Application
$word.Visible = $false

$doc = $word.Documents.Add()
$sel = $word.Selection

# --- Helpers ---
function AddHeading($text, $level) {
    $sel.Style = $doc.Styles("Heading $level")
    $sel.TypeText($text)
    $sel.TypeParagraph()
}

function AddBody($text) {
    $sel.Style = $doc.Styles("Normal")
    $sel.TypeText($text)
    $sel.TypeParagraph()
}

function AddBullet($text) {
    $sel.Style = $doc.Styles("List Bullet")
    $sel.TypeText($text)
    $sel.TypeParagraph()
}

function AddCaption($text) {
    $sel.Style = $doc.Styles("Normal")
    $sel.ParagraphFormat.Alignment = 1 # Center
    $sel.Font.Italic = $true
    $sel.Font.Size = 9
    $sel.Font.Color = 0x6B7280  # gray
    $sel.TypeText($text)
    $sel.TypeParagraph()
    $sel.Font.Italic = $false
    $sel.Font.Size = 11
    $sel.Font.Color = 0  # black
    $sel.ParagraphFormat.Alignment = 0 # Left
}

function AddImage($filename, $widthCm, $heightCm, $caption) {
    $fp = Join-Path $SS $filename
    if (-not (Test-Path $fp)) {
        Write-Host "  SKIP: $filename (not found)"
        return
    }
    try {
        $inline = $sel.InlineShapes.AddPicture($fp, $false, $true, $sel.Range)
        $inline.Width = $word.CentimetersToPoints($widthCm)
        $inline.Height = $word.CentimetersToPoints($heightCm)
        $inline.Range.ParagraphFormat.Alignment = 1  # center
        $sel.TypeParagraph()
        AddCaption $caption
        Write-Host "  IMG: $filename"
    } catch {
        Write-Host "  IMG FAIL: $filename - $_"
    }
}

function AddTable($headers, $rows) {
    $numCols = $headers.Count
    $numRows = $rows.Count + 1
    $table = $doc.Tables.Add($sel.Range, $numRows, $numCols)
    $table.Style = "Table Grid"
    $table.AutoFitBehavior(1)  # AutoFitToContents

    # Header row
    for ($c = 0; $c -lt $numCols; $c++) {
        $cell = $table.Cell(1, $c+1)
        $cell.Range.Text = $headers[$c]
        $cell.Range.Bold = $true
        $cell.Shading.BackgroundPatternColor = 0x2563EB
        $cell.Range.Font.Color = 0xFFFFFF
    }

    # Data rows
    for ($r = 0; $r -lt $rows.Count; $r++) {
        $fill = if ($r % 2 -eq 0) { 0xF8FAFC } else { 0xFFFFFF }
        for ($c = 0; $c -lt $numCols; $c++) {
            $cell = $table.Cell($r+2, $c+1)
            $cell.Range.Text = $rows[$r][$c]
            $cell.Shading.BackgroundPatternColor = $fill
        }
    }

    # Move past table
    $sel.MoveDown(5, 1)  # Move down 1 row
    $sel.TypeParagraph()
}

function PageBreak() {
    $sel.InsertBreak(7)  # wdPageBreak
}

# ===== COVER PAGE =====
Write-Host "Writing cover..."
$sel.Style = $doc.Styles("Title")
$sel.TypeText("MLS")
$sel.TypeParagraph()
$sel.Style = $doc.Styles("Subtitle")
$sel.TypeText("Nen tang hoc tieng Viet")
$sel.TypeParagraph()
$sel.Style = $doc.Styles("Normal")
$sel.ParagraphFormat.Alignment = 1
$sel.Font.Size = 28
$sel.Font.Bold = $true
$sel.TypeText("HUONG DAN SU DUNG")
$sel.TypeParagraph()
$sel.Font.Size = 12
$sel.Font.Bold = $false
$sel.TypeText("Phien ban 1.0  |  Thang 6/2026")
$sel.TypeParagraph()
$sel.ParagraphFormat.Alignment = 0
AddImage "01_homepage.png" 16 9 ""
PageBreak

# ===== TOC =====
Write-Host "Writing TOC..."
AddHeading "Muc luc" 1
$entries = @(
    "1.   Gioi thieu he thong",
    "2.   Tai khoan va Dang nhap",
    "3.   Trang chu",
    "4.   Khoa hoc",
    "5.   Sach",
    "6.   Thi online",
    "7.   Nhom hoc tap",
    "8.   Ho so ca nhan",
    "9.   Gio hang va Thanh toan",
    "10.  Bang dieu khien Giao vien",
    "11.  Quan tri he thong (Admin)",
    "12.  Cau hoi thuong gap"
)
foreach ($e in $entries) { AddBody $e }
PageBreak

# ===== SECTION 1 =====
Write-Host "Section 1..."
AddHeading "1. Gioi thieu he thong" 1
AddBody "MLS (Modern Language System) la nen tang hoc tieng Viet truc tuyen toan dien cho nguoi nuoc ngoai, theo lo trinh chuan CEFR (A1 den C2)."
AddHeading "1.1 Tinh nang noi bat" 2
AddBullet "Lo trinh 6 cap do chuan CEFR: A1, A2, B1, B2, C1, C2"
AddBullet "He thong thi VSTEP & OPIC tich hop AI cham diem"
AddBullet "AI cham diem Speaking & Writing tu dong"
AddBullet "Nhom hoc tap & chat thoi gian thuc"
AddBullet "Thuong mai sach truc tuyen, giao hang ViettelPost"
AddBullet "Ung dung di dong iOS & Android"
AddBullet "Giao dien da ngon ngu: Tieng Viet & English"
AddHeading "1.2 Yeu cau he thong" 2
AddTable @("Yeu cau", "Chi tiet") @(
    @("Trinh duyet", "Chrome 90+, Firefox 88+, Edge 90+, Safari 14+"),
    @("Ket noi mang", "Toi thieu 5 Mbps de xem video"),
    @("Man hinh", "Do phan giai toi thieu 1280 x 720"),
    @("Mobile", "iOS 14+ / Android 8+")
)
PageBreak

# ===== SECTION 2 =====
Write-Host "Section 2..."
AddHeading "2. Tai khoan & Dang nhap" 1
AddHeading "2.1 Dang nhap" 2
AddBody "Truy cap website, nhan 'Dang nhap' o goc phai tren. Nhap email va mat khau roi nhan nut Dang nhap."
AddImage "02_login_page.png" 16 10 "Hinh 2.1 - Trang dang nhap"
AddImage "02b_login_filled.png" 16 10 "Hinh 2.2 - Nhap thong tin dang nhap"
AddBody "Luu y: Ho tro dang nhap bang Google. Nhan 'Tiep tuc voi Google' de su dung tai khoan Google."
AddHeading "2.2 Tai khoan demo" 2
AddTable @("Loai tai khoan", "Email", "Mat khau", "Vai tro") @(
    @("Admin", "admin01@gmail.com", "123@123aA", "Quan tri vien"),
    @("Giao vien", "teacher01@gmail.com", "123@123aA", "Giao vien"),
    @("Hoc vien", "student01@gmail.com", "123@123aA", "Hoc vien")
)
AddHeading "2.3 Dang ky tai khoan moi" 2
AddBody "Nhan 'Dang ky' tren thanh dieu huong de tao tai khoan moi."
AddImage "16_register.png" 16 10 "Hinh 2.3 - Trang dang ky"
AddBullet "Dien day du: Ho ten, Email, Mat khau (toi thieu 8 ky tu)"
AddBullet "Nhan 'Dang ky' de hoan tat"
AddBullet "Kiem tra email va nhan link kich hoat tai khoan"
PageBreak

# ===== SECTION 3 =====
Write-Host "Section 3..."
AddHeading "3. Trang chu" 1
AddBody "Sau khi dang nhap, trang chu hien thi luong video bai hoc theo dang TikTok - cuon de kham pha noi dung."
AddImage "04_homepage_loggedin.png" 16 9 "Hinh 3.1 - Trang chu sau khi dang nhap"
AddHeading "3.1 Bo cuc giao dien" 2
AddTable @("Thanh phan", "Mo ta") @(
    @("Thanh dieu huong", "Trang chu, Khoa hoc, Sach, Thi online, Nhom"),
    @("Sidebar trai", "Bai hoc moi, Khoa da kich hoat, Nhom, Dang theo doi, Da luu"),
    @("Luong video chinh", "Video bai hoc TikTok-style, cuon de xem them"),
    @("Sidebar phai", "Danh sach Giao vien & Khoa hoc noi bat"),
    @("Hop tin nhan", "Chat nhanh voi ban hoc va giao vien")
)
AddHeading "3.2 Tim kiem" 2
AddBody "Dung o tim kiem tren thanh dieu huong de tim khoa hoc theo ten, chu de hoac giao vien."
PageBreak

# ===== SECTION 4 =====
Write-Host "Section 4..."
AddHeading "4. Khoa hoc" 1
AddHeading "4.1 Danh sach khoa hoc" 2
AddBody "Nhan 'Khoa hoc' tren thanh dieu huong de xem tat ca khoa hoc."
AddImage "05_courses_list.png" 16 10 "Hinh 4.1 - Danh sach khoa hoc"
AddBullet "Loc theo cap do CEFR: A1, A2, B1, B2, C1, C2"
AddBullet "Loc theo chu de: Giao tiep, Kinh doanh, Du lich..."
AddBullet "Sap xep: Moi nhat, Pho bien, Gia"
AddHeading "4.2 Chi tiet khoa hoc" 2
AddBody "Nhan vao ten/anh khoa hoc de xem thong tin chi tiet."
AddImage "06_course_detail.png" 16 10 "Hinh 4.2 - Chi tiet khoa hoc"
AddImage "06b_course_detail_scroll.png" 16 9 "Hinh 4.3 - Noi dung chuong trinh hoc"
AddBullet "Xem mo ta, chuong trinh, giao vien giang day"
AddBullet "Doc danh gia tu hoc vien"
AddBullet "Nhan 'Dang ky hoc' de ghi danh"
AddHeading "4.3 Khoa hoc cua toi" 2
AddImage "19_my_courses.png" 16 8 "Hinh 4.4 - Khoa hoc da dang ky"
AddBullet "Xem tien do hoc tung khoa"
AddBullet "Tiep tuc bai hoc con do"
AddBullet "Tai chung chi khi hoan thanh"
AddHeading "4.4 Bai hoc moi" 2
AddImage "23_my_lesson.png" 16 8 "Hinh 4.5 - Bai hoc vua cap nhat"
PageBreak

# ===== SECTION 5 =====
Write-Host "Section 5..."
AddHeading "5. Sach" 1
AddHeading "5.1 Cua hang sach" 2
AddBody "Nhan 'Sach' tren thanh dieu huong de vao cua hang sach tieng Viet."
AddImage "07_books_list.png" 16 10 "Hinh 5.1 - Cua hang sach"
AddBullet "Duyet theo the loai: Giao trinh, Luyen thi, Tu dien, Van hoc"
AddBullet "Loc theo cap do CEFR, gia, moi nhat"
AddBullet "Xem xep hang va danh gia sach"
AddHeading "5.2 Chi tiet sach" 2
AddImage "07b_book_detail.png" 16 9 "Hinh 5.2 - Chi tiet sach"
AddBullet "Mo ta, muc luc, thong tin tac gia"
AddBullet "Anh bia va xem truoc noi dung"
AddBullet "Nhan 'Them vao gio hang' de mua"
AddBody "Luu y: Giao hang qua ViettelPost toan quoc. Nhap ma voucher de duoc giam gia."
PageBreak

# ===== SECTION 6 =====
Write-Host "Section 6..."
AddHeading "6. Thi online" 1
AddHeading "6.1 Danh sach bai thi" 2
AddBody "Nhan 'Thi online' de xem danh sach cac bai kiem tra."
AddImage "08_quiz_list.png" 16 7 "Hinh 6.1 - Danh sach bai thi"
AddBullet "Loc theo loai: Tong quat, OPIC, VSTEP, Live Exam"
AddBullet "Xem thong tin: so cau, thoi gian, so luot thi"
AddBullet "Bang xep hang (Leaderboard) hang tuan/thang/nam"
AddHeading "6.2 Phan loai bai thi" 2
AddTable @("Loai", "Mo ta") @(
    @("Tong quat", "Kiem tra ngu phap, tu vung theo cap do CEFR"),
    @("OPIC", "Oral Proficiency Interview - thi noi, AI cham diem"),
    @("VSTEP", "Bo de chuan Bo GD&DT - 4 ky nang Nghe/Doc/Noi/Viet"),
    @("Live Exam", "Thi truc tiep do giao vien to chuc theo thoi gian thuc")
)
AddHeading "6.3 Kiem tra xep lop" 2
AddBody "Bai kiem tra danh cho hoc vien moi de xac dinh cap do CEFR phu hop."
AddImage "17_placement_test.png" 16 6 "Hinh 6.2 - Kiem tra xep lop"
AddBullet "Bai gom: Nghe, Doc, Ngu phap"
AddBullet "Ket qua tu dong phan tich va goi y cap do"
AddBullet "Co the lam lai sau 30 ngay"
PageBreak

# ===== SECTION 7 =====
Write-Host "Section 7..."
AddHeading "7. Nhom hoc tap" 1
AddBody "Tinh nang Nhom cho phep hoc vien tham gia nhom hoc, chat voi giao vien va ban hoc."
AddImage "09_groups.png" 16 7 "Hinh 7.1 - Danh sach nhom"
AddHeading "7.1 Tham gia nhom" 2
AddBullet "Tim nhom theo chu de, cap do hoac giao vien"
AddBullet "Nhan 'Tham gia' voi nhom cong khai"
AddBullet "Nhap ma moi voi nhom rieng tu"
AddHeading "7.2 Hoat dong trong nhom" 2
AddBullet "Chat van ban, gui hinh anh, file tai lieu"
AddBullet "Xem bai dang va thong bao tu giao vien"
AddBullet "Chia se tien do hoc voi ca nhom"
AddBullet "Tham gia buoi hoc/thi truc tiep"
PageBreak

# ===== SECTION 8 =====
Write-Host "Section 8..."
AddHeading "8. Ho so ca nhan" 1
AddBody "Nhan vao ten/avatar goc phai tren de vao trang ho so."
AddHeading "8.1 Thong tin ca nhan" 2
AddBullet "Cap nhat ho ten, anh dai dien, ngay sinh"
AddBullet "Thay doi mat khau, email"
AddBullet "Chon ngon ngu hien thi (Tieng Viet / English)"
AddHeading "8.2 Tien do hoc tap" 2
AddBullet "Tong so bai hoc da hoan thanh"
AddBullet "Diem so va thu hang bang xep hang"
AddBullet "Lich su bai thi da lam"
AddBullet "Tai chung chi hoan thanh khoa hoc"
PageBreak

# ===== SECTION 9 =====
Write-Host "Section 9..."
AddHeading "9. Gio hang & Thanh toan" 1
AddBody "Nhan bieu tuong Gio hang o goc phai thanh dieu huong."
AddImage "18_cart.png" 16 7 "Hinh 9.1 - Gio hang"
AddHeading "9.1 Them vao gio" 2
AddBullet "Tim sach muon mua, nhan 'Them vao gio hang'"
AddBullet "Chinh so luong trong gio"
AddHeading "9.2 Thanh toan" 2
AddBullet "Nhan 'Tien hanh thanh toan'"
AddBullet "Nhap dia chi giao hang day du"
AddBullet "Chon phuong thuc: Chuyen khoan, Vi dien tu, COD"
AddBullet "Nhap ma voucher giam gia (neu co)"
AddBullet "Xac nhan va cho xu ly don hang"
AddHeading "9.3 Theo doi don hang" 2
AddBullet "Vao Ho so > Don hang de xem trang thai"
AddBullet "Nhan thong bao khi don duoc xu ly va giao"
AddBody "Luu y: Giao hang qua ViettelPost. Thoi gian giao 2-5 ngay lam viec tuy khu vuc."
PageBreak

# ===== SECTION 10 =====
Write-Host "Section 10..."
AddHeading "10. Bang dieu khien Giao vien" 1
AddBody "Dang nhap bang tai khoan Giao vien, truy cap URL /teacher hoac menu 'Giao vien'."
AddImage "20_teacher_dashboard.png" 16 8 "Hinh 10.1 - Bang dieu khien Giao vien"
AddHeading "10.1 Quan ly khoa hoc" 2
AddBullet "Tao khoa hoc: dat ten, mo ta, cap do, gia"
AddBullet "Them chuong va bai hoc theo tung chapter"
AddBullet "Upload video bai giang, tai lieu PDF"
AddBullet "Quan ly hoc vien da dang ky"
AddBullet "Xem thong ke luot xem va tien do"
AddHeading "10.2 Quan ly bai thi" 2
AddImage "21_teacher_quizzes.png" 16 8 "Hinh 10.2 - Quan ly bai thi"
AddBullet "Tao bai thi theo chuan VSTEP, OPIC hoac tu do"
AddBullet "Dat thoi gian, so cau, cap do"
AddBullet "Xem ket qua va phan tich diem hoc vien"
AddHeading "10.3 Ngan hang cau hoi" 2
AddImage "22_teacher_questions.png" 16 8 "Hinh 10.3 - Ngan hang cau hoi"
AddBullet "Trac nghiem, dien vao cho trong, nghe"
AddBullet "OPIC: Ghi am cau tra loi, AI cham diem"
AddBullet "VSTEP Writing: AI cham diem bai viet"
AddBullet "Phan loai theo ky nang: Nghe, Doc, Noi, Viet, Ngu phap"
AddHeading "10.4 Thi truc tiep (Live Exam)" 2
AddBullet "Tao phong thi, chia se ma tham gia cho hoc vien"
AddBullet "Dieu khien tien do thi theo thoi gian thuc"
AddBullet "Ket qua hien thi ngay sau khi ket thuc"
AddHeading "10.5 Nhom chat" 2
AddBullet "Tao va quan ly nhom hoc tap"
AddBullet "Dang thong bao, chia se tai lieu"
PageBreak

# ===== SECTION 11 =====
Write-Host "Section 11..."
AddHeading "11. Quan tri he thong (Admin)" 1
AddBody "Quan tri vien truy cap khu vuc Admin tai URL /admin."
AddImage "03_admin_dashboard.png" 16 9 "Hinh 11.1 - Admin Dashboard"
AddHeading "11.1 Analytics" 2
AddBullet "Tong quan doanh thu 7/30/90 ngay"
AddBullet "Bieu do doanh thu hang ngay"
AddBullet "Top 10 sach ban chay nhat"
AddBullet "Thong ke trang thai don hang"
AddHeading "11.2 Quan ly khoa hoc" 2
AddImage "10_admin_courses.png" 16 8 "Hinh 11.2 - Quan ly khoa hoc"
AddBullet "Duyet va phe duyet khoa hoc tu giao vien"
AddBullet "Chinh sua, xoa khoa hoc"
AddBullet "Quan ly danh muc va the tag"
AddHeading "11.3 Quan ly sach" 2
AddImage "11_admin_books.png" 16 8 "Hinh 11.3 - Quan ly sach"
AddBullet "Them, sua, xoa sach"
AddBullet "Quan ly ton kho va gia ban"
AddBullet "Upload anh bia va noi dung"
AddHeading "11.4 Quan ly don hang" 2
AddImage "12_admin_orders.png" 16 8 "Hinh 11.4 - Quan ly don hang"
AddBullet "Danh sach don hang theo trang thai"
AddBullet "Tim kiem theo ma don, email, ten khach"
AddBullet "Cap nhat trang thai, in phieu ViettelPost"
AddHeading "11.5 Quan ly voucher" 2
AddImage "13_admin_vouchers.png" 16 8 "Hinh 11.5 - Quan ly voucher"
AddBullet "Tao voucher giam gia theo % hoac so tien co dinh"
AddBullet "Dat gioi han su dung va thoi han"
AddBullet "Xem lich su su dung"
AddHeading "11.6 Quan ly nguoi dung" 2
AddImage "14_admin_users.png" 16 8 "Hinh 11.6 - Quan ly nguoi dung"
AddBullet "Xem toan bo tai khoan"
AddBullet "Phan quyen: Hoc vien, Giao vien, Admin"
AddBullet "Khoa/mo khoa tai khoan, reset mat khau"
PageBreak

# ===== SECTION 12 =====
Write-Host "Section 12..."
AddHeading "12. Cau hoi thuong gap (FAQ)" 1

AddHeading "Toi quen mat khau, lam sao lay lai?" 3
AddBody "Nhan 'Quen mat khau?' o trang dang nhap, nhap email va lam theo huong dan trong email duoc gui den hop thu."

AddHeading "Toi co the hoc tren dien thoai khong?" 3
AddBody "Co. Tai ung dung MLS tu App Store (iOS) hoac Google Play (Android). Du lieu dong bo voi tai khoan."

AddHeading "Khoa hoc co het han khong?" 3
AddBody "Khong. Sau khi dang ky, ban co the hoc lai bat cu luc nao ma khong lo het han."

AddHeading "Voucher ap dung cho san pham nao?" 3
AddBody "Tuy dieu kien tung voucher. Doc ky dieu kien ap dung truoc khi su dung tai trang thanh toan."

AddHeading "Toi muon tro thanh giao vien tren MLS?" 3
AddBody "Lien he support@mls.edu.vn hoac nhan 'Day tren MLS' o trang chu de dang ky tai khoan Giao vien."

AddHeading "Chung chi MLS co duoc cong nhan khong?" 3
AddBody "Chung chi MLS cap sau khi hoan thanh khoa hoc. Chung chi VSTEP va OPIC duoc Bo GD&DT Viet Nam cong nhan."

# ===== Save =====
Write-Host "Saving document..."
if (Test-Path $OUT) { Remove-Item $OUT -Force }
$doc.SaveAs2($OUT, 16)  # 16 = wdFormatDocx
$doc.Close()
$word.Quit()

Write-Host "DONE: $OUT"
$size = [math]::Round((Get-Item $OUT).Length / 1MB, 2)
Write-Host "Size: $size MB"
