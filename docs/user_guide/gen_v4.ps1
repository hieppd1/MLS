# MLS User Guide Generator - Word COM, UTF-8, Professional
$ErrorActionPreference = "Continue"
$SS  = "D:\HiepPD\MLS\docs\user_guide\screenshots"
$OUT = "D:\HiepPD\MLS\docs\User_Guide_MLS.docx"

# Word BGR colors (not RGB - Word uses B*65536 + G*256 + R)
$cNavy    = 6240798   # #1E3A5F navy
$cBlue    = 15426341  # #2563EB bright blue
$cGray    = 8417899   # #6B7280 gray
$cLightBg = 16774895  # #EFF6FF light blue bg
$cRowAlt  = 16579320  # #F8FAFC alt row
$cBlack   = 0
$cWhite   = 16777215

Write-Host "Khoi dong Word..."
$word = New-Object -ComObject Word.Application
$word.Visible = $false; $word.DisplayAlerts = 0
$doc = $word.Documents.Add()
$sel = $word.Selection

# Utility: set normal paragraph format
function ResetPara {
    $sel.ParagraphFormat.Alignment = 0
    $sel.ParagraphFormat.SpaceBefore = 0; $sel.ParagraphFormat.SpaceAfter = 8
    $sel.ParagraphFormat.FirstLineIndent = 0; $sel.ParagraphFormat.LeftIndent = 0
}
function SetFont([double]$sz,[bool]$bold=$false,[bool]$ital=$false,[int]$col=0,[string]$name="Times New Roman") {
    $sel.Font.Name = $name; $sel.Font.Size = $sz; $sel.Font.Bold = $bold
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
    $sel.TypeText("   $t"); $sel.TypeParagraph(); ResetPara; SetFont 12 $false $false 0
}
function IMG([string]$fname,[double]$w,[double]$h,[string]$cap) {
    $fp = Join-Path $SS $fname
    if (-not (Test-Path $fp)) { Write-Host "  SKIP $fname"; return }
    $sel.Style = $doc.Styles.Item("Normal")
    $sel.ParagraphFormat.Alignment = 1; $sel.ParagraphFormat.SpaceBefore = 6; $sel.ParagraphFormat.SpaceAfter = 0
    try {
        $pic = $sel.InlineShapes.AddPicture($fp,$false,$true,$sel.Range)
        $pic.Width = $word.CentimetersToPoints($w); $pic.Height = $word.CentimetersToPoints($h)
        $pic.Range.ParagraphFormat.Alignment = 1
    } catch { Write-Warning "IMG ERR: $fname" }
    $sel.TypeParagraph()
    if ($cap -ne "") {
        SetFont 10 $false $true $cGray; $sel.ParagraphFormat.Alignment = 1
        $sel.ParagraphFormat.SpaceAfter = 12
        $sel.TypeText($cap); $sel.TypeParagraph()
    }
    ResetPara; SetFont 12 $false $false 0
    Write-Host "  [IMG] $fname"
}
function TBL([string[]]$hdrs, [object[]]$rows) {
    $nc = $hdrs.Count; $nr = $rows.Count + 1
    $tbl = $doc.Tables.Add($sel.Range, $nr, $nc)
    try { $tbl.Style = $doc.Styles.Item("Table Grid") } catch {}
    for ($c=1; $c -le $nc; $c++) {
        $cell = $tbl.Cell(1,$c)
        $cell.Range.Text = $hdrs[$c-1]; $cell.Range.Bold = $true
        $cell.Range.Font.Size = 11; $cell.Range.Font.Name = "Calibri"
        $cell.Range.Font.Color = $cWhite
        $cell.Range.ParagraphFormat.Alignment = 1
        $cell.Shading.BackgroundPatternColor = $cNavy
    }
    for ($r=0; $r -lt $rows.Count; $r++) {
        $fill = if($r%2-eq 0){$cLightBg}else{16777215}
        for ($c=1; $c -le $nc; $c++) {
            $cell = $tbl.Cell($r+2,$c)
            $v = if($c-1 -lt $rows[$r].Count){"$($rows[$r][$c-1])"}else{""}
            $cell.Range.Text = $v; $cell.Range.Font.Size = 11; $cell.Range.Font.Name = "Calibri"
            $cell.Range.Bold = $false; $cell.Range.Font.Color = 0
            $cell.Shading.BackgroundPatternColor = $fill
        }
    }
    try { $tbl.Columns.AutoFit() } catch {}
    $sel.MoveDown(5,$nr+2); $sel.TypeParagraph(); ResetPara
}
function PB { $sel.InsertBreak(7) }
function AddSP { $sel.Style = $doc.Styles.Item("Normal"); $sel.TypeParagraph(); ResetPara }

Write-Host "=== TRANG BIA ==="
$sel.Style = $doc.Styles.Item("Normal")
$sel.ParagraphFormat.Alignment = 1; $sel.ParagraphFormat.SpaceBefore = 50
SetFont 72 $true $false $cNavy "Calibri"
$sel.TypeText("MLS"); $sel.TypeParagraph()
SetFont 20 $false $false $cBlue "Calibri"
$sel.ParagraphFormat.SpaceAfter = 4; $sel.TypeText("Modern Language System"); $sel.TypeParagraph()
SetFont 14 $false $false 8355711 "Calibri"
$sel.TypeText("Nen tang hoc tieng Viet truc tuyen"); $sel.TypeParagraph()
AddSP
SetFont 34 $true $false 0 "Calibri"
$sel.ParagraphFormat.SpaceAfter = 4; $sel.TypeText("HUONG DAN SU DUNG"); $sel.TypeParagraph()
SetFont 13 $false $false $cGray "Calibri"
$sel.TypeText("Phien ban 1.0  -  Thang 6 nam 2026"); $sel.TypeParagraph()
AddSP
IMG "01_homepage.png" 15.5 8.5 ""
AddSP
SetFont 10 $false $true $cGray
$sel.TypeText("Tai lieu nay mo ta day du cac tinh nang he thong MLS danh cho Hoc vien, Giao vien va Quan tri vien."); $sel.TypeParagraph()
$sel.ParagraphFormat.Alignment = 0; PB

Write-Host "=== MUC LUC ==="
H1 "MUC LUC"
$toc = @(
    "1.    Gioi thieu he thong MLS",
    "2.    Tai khoan nguoi dung - Dang ky & Dang nhap",
    "3.    Trang chu",
    "4.    Khoa hoc - Tim kiem, Dang ky & Hoc tap",
    "5.    Sach - Cua hang sach tieng Viet",
    "6.    Thi online - VSTEP, OPIC & Kiem tra xep lop",
    "7.    Nhom hoc tap & Chat",
    "8.    Ho so ca nhan & Tien do hoc tap",
    "9.    Gio hang & Quy trinh thanh toan",
    "10.  Cong thong tin Giao vien",
    "11.  Bang quan tri Admin",
    "12.  Cau hoi thuong gap (FAQ)",
    "13.  Thong tin lien he & Ho tro"
)
foreach ($e in $toc) {
    SetFont 13 $false $false 0; $sel.ParagraphFormat.SpaceAfter = 5; $sel.ParagraphFormat.Alignment = 0
    $sel.TypeText($e); $sel.TypeParagraph()
}
PB

Write-Host "=== CH.1 ==="
H1 "1. Gioi thieu he thong MLS"
P "MLS (Modern Language System) la nen tang hoc tieng Viet truc tuyen toan dien, duoc thiet ke dac biet cho nguoi nuoc ngoai muon hoc va nang cao trinh do tieng Viet theo khung nang luc ngon ngu quoc te CEFR voi 6 cap do tu A1 (So cap) den C2 (Thanh thao)."
P "Nen tang tich hop nhieu phuong thuc hoc tap hien dai: hoc qua video ngan theo dinh dang TikTok, luyen tap qua he thong bai thi tuong tac, mua va doc sach giao trinh truc tuyen, giao tiep trong nhom hoc tap, va duoc AI cham diem ky nang noi va viet theo thoi gian thuc."
H2 "1.1 Tinh nang noi bat"
BL "Lo trinh hoc tap 6 cap do chuan CEFR: A1 -> A2 -> B1 -> B2 -> C1 -> C2"
BL "He thong thi VSTEP (Vietnamese Standardized Test) va OPIC (Oral Proficiency Interview) tich hop san tren nen tang"
BL "Cong nghe AI tu dong cham diem bai thi Speaking & Writing, tra ket qua ngay lap tuc voi nhan xet chi tiet"
BL "Giao dien video hoc tap theo dinh dang TikTok - cuon de xem bai hoc ngan, truc quan, hap dan"
BL "He thong nhom hoc tap voi tinh nang chat thoi gian thuc giua hoc vien va giao vien"
BL "Cua hang sach tieng Viet truc tuyen voi dich vu giao hang toan quoc qua ViettelPost"
BL "Ung dung di dong da nen tang: iOS (App Store) va Android (Google Play)"
BL "Giao dien ho tro da ngon ngu: Tieng Viet va Tieng Anh"
BL "He thong voucher, khuyen mai va chuong trinh tich diem cho hoc vien than thiet"
BL "Chung chi hoan thanh khoa hoc duoc cap sau khi dat diem so yeu cau"
H2 "1.2 Doi tuong su dung"
TBL @("Doi tuong","Mo ta","Quyen han") @(
    ,@("Hoc vien (Student)","Nguoi hoc tieng Viet, dang ky khoa hoc va thi online","Hoc, thi, mua sach, chat nhom"),
    ,@("Giao vien (Teacher)","Giang vien tao noi dung khoa hoc va quan ly bai thi","Tao khoa hoc, de thi, quan ly hoc vien"),
    ,@("Quan tri vien (Admin)","Nhan vien van hanh va quan ly toan bo he thong","Toan quyen quan ly he thong"),
    ,@("Content Manager","Nhan vien bien tap noi dung hoc lieu","Tao va duyet noi dung hoc")
)
H2 "1.3 Yeu cau ky thuat"
TBL @("Thanh phan","Yeu cau toi thieu","Khuyen nghi") @(
    ,@("Trinh duyet web","Chrome 90+, Firefox 88+, Edge 90+, Safari 14+","Chrome phien ban moi nhat"),
    ,@("Ket noi Internet","5 Mbps (xem video), 1 Mbps (text)","20 Mbps tro len"),
    ,@("Man hinh","1280 x 720 pixels","1920 x 1080 pixels"),
    ,@("Thiet bi mobile","iOS 14+ / Android 8+","iOS 16+ / Android 12+")
)
PB

Write-Host "=== CH.2 ==="
H1 "2. Tai khoan nguoi dung - Dang ky & Dang nhap"
P "De su dung day du cac tinh nang cua MLS, nguoi dung can co tai khoan tren he thong. Qua trinh dang ky hoan toan mien phi va chi mat vai phut. He thong ho tro dang nhap bang email/mat khau hoac tai khoan Google."
H2 "2.1 Giao dien trang dang nhap"
IMG "02_login_page.png" 15.5 10 "Hinh 2.1 - Trang dang nhap MLS voi form nhap email/mat khau va tuy chon dang nhap Google"
P "Trang dang nhap duoc thiet ke hai vung chinh: ben trai la thong tin gioi thieu nen tang (loi ich hoc tap, danh gia tu hoc vien), ben phai la form dang nhap. Bo cuc nay giup nguoi dung moi hieu nhanh ve MLS trong khi nhap thong tin dang nhap."
H2 "2.2 Huong dan dang nhap tung buoc"
IMG "02b_login_filled.png" 15.5 10 "Hinh 2.2 - Form dang nhap da duoc dien thong tin, san sang nhan nut Dang nhap"
BL "Buoc 1: Mo trinh duyet va truy cap dia chi website MLS"
BL "Buoc 2: Nhan nut 'Dang nhap' o goc phai tren cung cua trang chu"
BL "Buoc 3: Nhap dia chi Email da dang ky vao o 'Email'"
BL "Buoc 4: Nhap mat khau vao o 'Mat khau' (mat khau duoc an bang dau cham)"
BL "Buoc 5: Nhan nut 'Dang nhap' mau xanh de xac nhan"
BL "Buoc 6: Neu thanh cong, he thong tu dong chuyen den trang chu hoac trang Admin (neu la quan tri vien)"
NOTE "Luu y: Neu quen mat khau, nhan lien ket 'Quen mat khau?' ngay duoi o nhap mat khau. He thong se gui email huong dan dat lai mat khau. Link co hieu luc trong 1 gio."
H2 "2.3 Dang nhap bang Google"
P "MLS ho tro dang nhap nhanh bang tai khoan Google - dac biet tien loi cho nguoi dung khong muon ghi nho them mat khau moi. Nhan nut 'Tiep tuc voi Google', chon tai khoan Google muon su dung, xac nhan cap quyen cho MLS truy cap thong tin co ban."
H2 "2.4 Dang ky tai khoan moi"
IMG "16_register.png" 15.5 10 "Hinh 2.3 - Trang dang ky tai khoan MLS danh cho nguoi dung moi"
BL "Dien ho va ten day du (hien thi trong ho so va chung chi)"
BL "Nhap dia chi email hop le (dung de dang nhap va nhan thong bao)"
BL "Dat mat khau manh: toi thieu 8 ky tu, co chu hoa, chu thuong va so"
BL "Xac nhan lai mat khau de tranh nhap sai"
BL "Nhan 'Dang ky' - he thong gui email xac nhan den dia chi email vua nhap"
BL "Mo email va nhan link kich hoat de hoan tat dang ky (link co hieu luc 24 gio)"
H2 "2.5 Tai khoan demo cho thu nghiem"
TBL @("Loai tai khoan","Email dang nhap","Mat khau","Vai tro & Quyen han") @(
    ,@("Quan tri vien","admin01@gmail.com","123@123aA","Toan quyen: Analytics, quan ly user/khoa hoc/sach/don hang"),
    ,@("Giao vien","teacher01@gmail.com","123@123aA","Tao khoa hoc, de thi, ngan hang cau hoi, nhom hoc tap"),
    ,@("Hoc vien","student01@gmail.com","123@123aA","Hoc khoa hoc, thi online, mua sach, chat nhom")
)
NOTE "Luu y bao mat: Cac tai khoan demo chi dung cho muc dich thu nghiem. Khong luu thong tin ca nhan hay thanh toan that vao tai khoan demo."
PB

Write-Host "=== CH.3 ==="
H1 "3. Trang chu"
IMG "04_homepage_loggedin.png" 15.5 9 "Hinh 3.1 - Trang chu MLS sau khi dang nhap voi giao dien ba cot: sidebar trai, luong video chinh va sidebar phai"
P "Trang chu MLS la trung tam dieu huong va kham pha noi dung. Sau khi dang nhap, nguoi dung thay giao dien hien dai voi luong video bai hoc ngan theo phong cach TikTok - cuon len/xuong de kham pha noi dung moi."
H2 "3.1 Bo cuc trang chu"
BL "Sidebar trai: Dieu huong nhanh den cac muc ca nhan - Bai hoc moi nhat, Khoa hoc da kich hoat, Nhom cua toi, Nguoi dang theo doi, Bai da luu, Bai da thich, Danh sach ban be"
BL "Khu vuc trung tam: Hien thi luong video bai hoc ngan (TikTok-style). Moi video hien thi ten bai hoc, giao vien, so luot xem va nut tuong tac (Like, Luu, Chia se, Binh luan)"
BL "Sidebar phai: Thong ke nhanh (tin nhan chua doc, thong bao), danh sach Giao vien noi bat, Khoa hoc duoc de xuat dua tren so thich va lich su hoc"
H2 "3.2 Thanh dieu huong chinh"
BL "Logo MLS - Nhan de quay ve trang chu tu bat ky trang nao"
BL "Menu chinh: Trang chu | Khoa hoc | Sach | Thi online | Nhom"
BL "O tim kiem toan cuc - Tim khoa hoc, giao vien, bai thi, sach"
BL "Bieu tuong Gio hang - Hien thi so luong sach dang cho thanh toan"
BL "Chuong thong bao - Nhan thong bao ve bai hoc moi, ket qua thi, don hang"
BL "Avatar nguoi dung - Truy cap nhanh ho so, cai dat, dang xuat"
BL "Chon ngon ngu - Chuyen doi giua Tieng Viet va English"
PB

Write-Host "=== CH.4 ==="
H1 "4. Khoa hoc - Tim kiem, Dang ky & Hoc tap"
IMG "05_courses_list.png" 15.5 10 "Hinh 4.1 - Trang danh sach khoa hoc voi he thong loc theo cap do, gia, danh gia va chu de"
P "Khoa hoc la tinh nang cot loi cua MLS. He thong co hang chuc khoa hoc tieng Viet duoc bien soan boi doi ngu giao vien chuyen nghiep, bao phu tat ca 6 cap do CEFR va nhieu chu de chuyen nganh: Giao tiep hang ngay, Kinh doanh, Lich su van hoa Viet Nam."
H2 "4.1 Kham pha danh sach khoa hoc"
BL "Loc theo cap do CEFR: A1 (So cap), A2 (Co ban), B1 (Trung cap so), B2 (Trung cap), C1 (Cao cap), C2 (Thanh thao)"
BL "Loc theo chu de: Giao tiep, Kinh doanh & Thuong mai, Du lich, Van hoa Viet Nam, Luyen thi VSTEP"
BL "Sap xep theo: Moi nhat, Pho bien nhat, Danh gia cao nhat, Gia thap den cao, Gia cao den thap"
BL "Loc theo gia: Mien phi, Co phi, Tat ca"
H2 "4.2 Xem chi tiet khoa hoc"
IMG "06_course_detail.png" 15.5 10 "Hinh 4.2 - Trang chi tiet khoa hoc voi thong tin day du ve noi dung, giao vien va nut dang ky hoc"
BL "Video gioi thieu khoa hoc - Xem truoc noi dung va phong cach giang day cua giao vien"
BL "Mo ta tong quan - Muc tieu hoc tap, doi tuong phu hop, kien thuc can co truoc"
BL "Noi dung chuong trinh - Danh sach day du cac chuong va bai hoc (co the xem preview mot so bai mien phi)"
BL "Thong tin giao vien - Ho so, kinh nghiem, chung chi giang day, so hoc vien da day"
BL "Danh gia & Nhan xet - Diem trung binh va cac danh gia chi tiet tu hoc vien da hoc"
BL "Thong tin dang ky - Gia khoa hoc, chinh sach hoan tien, thoi han truy cap"
IMG "06b_course_detail_scroll.png" 15.5 9 "Hinh 4.3 - Noi dung chi tiet chuong trinh hoc sau khi cuon xuong, hien thi tung chuong va bai hoc"
H2 "4.3 Dang ky khoa hoc"
BL "Khoa hoc mien phi: Nhan 'Dang ky hoc mien phi' -> Bat dau hoc ngay lap tuc"
BL "Khoa hoc co phi: Nhan 'Them vao gio hang' -> Thanh toan -> Nhan quyen truy cap vinh vien"
BL "Sau dang ky: Khoa hoc xuat hien trong muc 'Khoa hoc cua toi' de tiep tuc hoc bat cu luc nao"
H2 "4.4 Khoa hoc cua toi"
IMG "19_my_courses.png" 15.5 8 "Hinh 4.4 - Trang Khoa hoc cua toi hien thi tat ca khoa hoc da dang ky cung tien do hoc tap"
BL "Thanh tien do hoc tap (%) cho tung khoa - biet ngay da hoan thanh bao nhieu phan tram"
BL "Bai hoc tiep theo duoc de xuat dua tren vi tri hien tai trong khoa"
BL "Thoi gian hoc gan nhat - giup tiep tuc tu cho da dung"
BL "Chung chi hoan thanh - Tai xuong PDF khi dat 100% khoa hoc va vuot qua bai kiem tra cuoi"
H2 "4.5 Bai hoc moi duoc cap nhat"
IMG "23_my_lesson.png" 15.5 8 "Hinh 4.5 - Trang bai hoc moi nhat tu cac khoa hoc da dang ky"
P "Tinh nang 'Bai hoc moi' tong hop tat ca bai hoc vua duoc giao vien cap nhat tu cac khoa hoc nguoi dung da dang ky, sap xep theo thoi gian - bai moi nhat o tren cung. Nguoi dung khong bo lo bat ky noi dung hoc nao."
PB

Write-Host "=== CH.5 ==="
H1 "5. Sach - Cua hang sach tieng Viet"
IMG "07_books_list.png" 15.5 10 "Hinh 5.1 - Cua hang sach MLS voi danh sach da dang, co tinh nang loc va tim kiem"
P "MLS tich hop mot cua hang sach tieng Viet truc tuyen da dang, cung cap sach giao trinh, sach luyen thi, tu dien va tai lieu hoc tap chinh thong. Sach duoc giao tan nha qua dich vu ViettelPost tren toan quoc."
H2 "5.1 Kham pha danh muc sach"
BL "Duyet theo the loai: Sach giao trinh (theo cap do CEFR), Sach luyen thi VSTEP & OPIC, Tu dien Viet-Anh/Anh-Viet, Van hoc & Truyen tieng Viet, Sach doanh nhan"
BL "Loc theo cap do CEFR phu hop voi trinh do hien tai"
BL "Sap xep theo: Ban chay nhat, Moi nhat, Danh gia cao, Gia tu thap den cao"
BL "Xem danh gia sao trung binh va so luong danh gia tu nguoi da mua"
H2 "5.2 Trang chi tiet sach"
IMG "07b_book_detail.png" 15.5 9 "Hinh 5.2 - Trang chi tiet sach voi mo ta day du, thong tin tac gia, muc luc va nut them vao gio hang"
BL "Hinh anh bia sach chat luong cao (co the phong to) va cac hinh anh ben trong sach"
BL "Mo ta chi tiet: noi dung, doi tuong doc gia, cap do phu hop, so trang, nha xuat ban"
BL "Muc luc (Table of Contents) - xem truoc cau truc va noi dung cac chuong"
BL "Thong tin tac gia/bien tap vien voi ho so chuyen mon"
BL "Danh gia va nhan xet chi tiet tu nguoi doc da mua sach"
BL "Tinh trang kho hang: Con hang (so luong), Sap ve hang, Het hang"
BL "Nut 'Them vao gio hang' - them sach vao gio de thanh toan sau"
BL "Nut 'Mua ngay' - chuyen thang den trang thanh toan"
NOTE "Luu y: Giao hang qua ViettelPost den tat ca 63 tinh thanh toan quoc. Thoi gian giao: Noi thanh 1-2 ngay lam viec, Ngoai tinh 3-5 ngay lam viec. Phi van chuyen tinh theo khu vuc va can nang."
PB

Write-Host "=== CH.6 ==="
H1 "6. Thi online - VSTEP, OPIC & Kiem tra xep lop"
IMG "08_quiz_list.png" 15.5 8 "Hinh 6.1 - Trang danh sach bai thi online voi bo loc theo loai thi va bang xep hang ben phai"
P "He thong thi online cua MLS duoc thiet ke theo chuan quoc te, ho tro nhieu loai bai thi khac nhau tu kiem tra ngu phap thong thuong den cac ky thi duoc Bo Giao duc & Dao tao Viet Nam cong nhan nhu VSTEP va OPIC."
H2 "6.1 Cac loai bai thi"
TBL @("Loai thi","Mo ta","Ky nang kiem tra","Chung chi") @(
    ,@("Tong quat","Kiem tra ngu phap, tu vung va ky nang doc hieu theo tung cap do CEFR","Doc, Ngu phap, Tu vung","Khong"),
    ,@("OPIC","Oral Proficiency Interview - AI phan tich am thanh va cham diem theo tieu chi CEFR","Ky nang Noi (Speaking)","Co (OPIC Certificate)"),
    ,@("VSTEP","Vietnamese Standardized Test - chuan hoa quoc gia, 4 ky nang day du theo khung CEFR B1-C1","Nghe, Doc, Viet, Noi","Co (VSTEP Certificate)"),
    ,@("Live Exam","Bai thi truc tiep do giao vien to chuc theo thoi gian thuc. Hoc vien tham gia bang ma phong thi","Tuy de thi cua GV","Khong")
)
H2 "6.2 Lam bai thi"
BL "Buoc 1: Truy cap 'Thi online' tu thanh dieu huong"
BL "Buoc 2: Chon loai thi (Tong quat / OPIC / VSTEP / Live) tu cac tab loc"
BL "Buoc 3: Nhan vao bai thi muon lam de xem thong tin chi tiet: so cau, thoi gian, do kho, so nguoi da thi"
BL "Buoc 4: Nhan 'Bat dau thi' de vao phong thi - dong ho dem nguoc bat dau chay"
BL "Buoc 5: Tra loi tung cau hoi - co the danh dau cau chua chac de xem lai"
BL "Buoc 6: Nhan 'Nop bai' khi hoan thanh - ket qua hien thi ngay lap tuc voi diem so va dap an dung/sai"
H2 "6.3 Bang xep hang (Leaderboard)"
P "Bang xep hang o sidebar phai trang Thi online cap nhat lien tuc, hien thi Top 10 hoc vien co diem tong cao nhat. Nguoi dung co the xem theo 3 ky: Tuan nay, Thang nay va Ca nam. Day la nguon dong luc hoc tap tich cuc cho cong dong MLS."
H2 "6.4 Kiem tra xep lop (Placement Test)"
IMG "17_placement_test.png" 15.5 7 "Hinh 6.2 - Trang kiem tra xep lop danh cho hoc vien moi chua biet trinh do cua minh"
BL "Bai kiem tra gom 3 phan: Nghe hieu (20 cau), Doc hieu (20 cau) va Ngu phap/Tu vung (20 cau)"
BL "Thoi gian lam bai: 45 phut - he thong AI phan tich ket qua va tu dong xep vao cap do phu hop (A1 den C2)"
BL "Ket qua di kem voi lo trinh hoc tap de xuat cu the: nen hoc khoa nao, on tap phan nao"
BL "Sau 30 ngay co the lam lai de kiem tra tien bo"
PB

Write-Host "=== CH.7 ==="
H1 "7. Nhom hoc tap & Chat"
IMG "09_groups.png" 15.5 8 "Hinh 7.1 - Trang danh sach nhom hoc tap voi cac nhom cong khai va rieng tu"
P "Tinh nang Nhom hoc tap (Study Groups) cua MLS tao ra moi truong hoc cong dong - noi hoc vien ket noi, ho tro nhau va hoc cung giao vien theo nhom nho. Day la tinh nang duoc nhieu hoc vien MLS yeu thich vi tao cam giac hoc trong lop hoc that su du o bat cu dau."
H2 "7.1 Tim kiem va tham gia nhom"
BL "Nhom cong khai - Bat ky hoc vien nao cung co the tham gia bang cach nhan nut 'Tham gia'"
BL "Nhom rieng tu - Chi tham gia bang ma moi (invite code) do giao vien/truong nhom cung cap"
BL "Tim kiem nhom theo ten, chu de (Giao tiep hang ngay, Kinh doanh, Chuan bi VSTEP...) hoac cap do"
BL "Xem thong tin nhom: so thanh vien, giao vien phu trach, muc do hoat dong, ngon ngu su dung"
H2 "7.2 Hoat dong trong nhom"
BL "Chat van ban thoi gian thuc - Gui tin nhan, hoi dap ngay trong nhom"
BL "Chia se file va hinh anh - Tai lieu hoc tap, bai tap, ghi chu"
BL "Bai dang (Posts) - Giao vien dang thong bao, bai tap, tai lieu cho ca nhom"
BL "Tuong tac: Like bai dang, binh luan, tag thanh vien"
BL "Chia se tien do hoc tap - Bao cao ket qua bai thi, khoa hoc vua hoan thanh"
BL "Tham gia buoi hoc/on tap truc tiep do giao vien to chuc trong nhom"
PB

Write-Host "=== CH.8 ==="
H1 "8. Ho so ca nhan & Tien do hoc tap"
P "Trang Ho so ca nhan la trung tam quan ly thong tin, theo doi tien do hoc tap va cac hoat dong ca nhan. Truy cap bang cach nhan vao avatar/ten o goc phai tren thanh dieu huong."
H2 "8.1 Thong tin ca nhan"
BL "Anh dai dien (avatar) - Tai len anh moi hoac chon tu thu vien co san"
BL "Ho va ten day du - Ten nay xuat hien tren chung chi va trong cac nhom hoc"
BL "Ngay sinh - Dung de ca nhan hoa noi dung hoc phu hop voi do tuoi"
BL "Quoc tich / Ngon ngu me de - Giup AI dieu chinh phuong phap day phu hop"
BL "Muc tieu hoc tap - Giao tiep hang ngay, Cong viec, Du lich, Luyen thi"
BL "Thay doi mat khau - Can nhap mat khau cu de xac thuc"
H2 "8.2 Thong ke hoc tap"
BL "Tong so gio hoc tich luy - Tinh tu ngay dang ky den hien tai"
BL "So bai hoc da hoan thanh - Theo tung khoa va tong cong"
BL "Diem thi trung binh - Cap nhat sau moi bai thi"
BL "Chuoi ngay hoc lien tiep (Streak) - Khuyen khich duy tri thoi quen hoc deu dan"
BL "Thu hang tren Leaderboard - Xep hang so voi hoc vien khac trong cung tuan/thang"
BL "Lich su cac bai thi da lam - Xem lai dap an, diem so, thoi gian lam bai"
BL "Danh sach chung chi - Tai xuong PDF chung chi hoan thanh khoa hoc"
PB

Write-Host "=== CH.9 ==="
H1 "9. Gio hang & Quy trinh thanh toan"
IMG "18_cart.png" 15.5 7 "Hinh 9.1 - Trang gio hang hien thi danh sach sach da chon, so luong, gia va o nhap voucher"
P "He thong mua sam cua MLS duoc thiet ke don gian, an toan va ho tro nhieu phuong thuc thanh toan pho bien tai Viet Nam. Moi giao dich duoc ma hoa bao mat theo tieu chuan SSL."
H2 "9.1 Quy trinh thanh toan tung buoc"
BL "Buoc 1: Vao Gio hang, kiem tra lai danh sach sach va so luong"
BL "Buoc 2: Nhap ma voucher giam gia (neu co) vao o 'Ma giam gia' va nhan 'Ap dung'"
BL "Buoc 3: Nhan 'Tien hanh thanh toan'"
BL "Buoc 4: Nhap dia chi giao hang day du: Ten nguoi nhan, So dien thoai, Dia chi chi tiet, Phuong/Xa, Quan/Huyen, Tinh/Thanh pho"
BL "Buoc 5: Chon phuong thuc van chuyen (Tieu chuan / Nhanh) - xem thoi gian giao du kien va phi van chuyen"
BL "Buoc 6: Chon phuong thuc thanh toan: Chuyen khoan ngan hang, Vi MoMo, ZaloPay, VNPay, Thanh toan khi nhan hang (COD)"
BL "Buoc 7: Kiem tra lai toan bo thong tin don hang va nhan 'Dat hang' de xac nhan"
BL "Buoc 8: Nhan email xac nhan don hang voi ma don hang de theo doi"
H2 "9.2 Theo doi va quan ly don hang"
BL "Xem trang thai don hang: Cho xu ly -> Da xac nhan -> Dang dong goi -> Da giao ViettelPost -> Dang giao -> Da nhan"
BL "Theo doi van don ViettelPost bang cach nhan vao ma van don"
BL "Yeu cau doi/tra hang trong vong 7 ngay ke tu ngay nhan (neu sach loi, sai don)"
NOTE "Luu y: Don hang co the bi huy tu dong neu chua thanh toan trong vong 24 gio (voi hinh thuc chuyen khoan). Phi COD thu khi giao hang. Hoa don VAT duoc xuat theo yeu cau."
PB

Write-Host "=== CH.10 ==="
H1 "10. Cong thong tin Giao vien (Teacher Portal)"
IMG "20_teacher_dashboard.png" 15.5 8 "Hinh 10.1 - Cong thong tin Giao vien voi menu day du: Khoa hoc, Bai thi, Ngan hang cau hoi, Nhom va cau hinh OPIC/VSTEP"
P "Giao vien truy cap vao Cong thong tin rieng biet tai /teacher - noi quan ly toan bo hoat dong giang day tu tao khoa hoc, soan de thi den theo doi tien do hoc vien va quan ly nhom hoc tap."
H2 "10.1 Quan ly Khoa hoc"
BL "Tao khoa hoc moi: Dien ten khoa, mo ta chi tiet, doi tuong hoc vien, cap do CEFR, ngon ngu giang day, anh bia va gia"
BL "Xay dung chuong trinh: Tao cau truc theo Chuong (Chapter) -> Bai hoc (Lesson)"
BL "Upload noi dung bai hoc: Video bai giang MP4, tai lieu PDF, bai tap dinh kem"
BL "Thiet lap bai kiem tra cuoi chuong - Hoc vien phai dat diem yeu cau moi hoc chuong tiep"
BL "Quan ly hoc vien: Xem danh sach dang ky, tien do cua tung hoc vien, gui tin nhan"
BL "Xem thong ke: Tong luot xem, thoi gian hoc trung binh, ty le hoan thanh, doanh thu"
BL "Sau khi hoan thien, gui khoa hoc de Admin duyet va dang tai cong khai"
H2 "10.2 Quan ly Bai thi"
IMG "21_teacher_quizzes.png" 15.5 8 "Hinh 10.2 - Trang quan ly bai thi cua Giao vien, hien thi danh sach de thi va thong ke"
BL "Tao de thi moi: Dat tieu de, mo ta, loai thi (Tong quat/OPIC/VSTEP), thoi gian lam bai, so lan cho phep thi lai"
BL "Lay cau hoi tu Ngan hang cau hoi hoac tao cau hoi moi truc tiep trong de"
BL "Thiet lap thang diem va diem dau (passing score) cho tung de thi"
BL "Xem ket qua: Diem trung binh ca lop, phan bo diem, cau hoi hoc vien hay sai nhat"
H2 "10.3 Ngan hang cau hoi"
IMG "22_teacher_questions.png" 15.5 8 "Hinh 10.3 - Ngan hang cau hoi voi bo loc theo ky nang, cap do va loai cau hoi"
BL "Cau hoi trac nghiem (Multiple Choice) - 4 lua chon, chon 1 hoac nhieu dap an dung"
BL "Cau dien tu (Fill in the Blank) - Hoc vien go tu/cum tu vao o trong"
BL "Cau hoi nghe (Listening) - Dinh kem file audio, hoc vien nghe roi tra loi"
BL "Cau hoi Noi - OPIC Speaking: Hoc vien ghi am cau tra loi, AI danh gia phat am, ngu dieu, tu vung, ngu phap"
BL "Cau viet luan - VSTEP Writing: Hoc vien viet doan van/bai luan, AI phan tich cau truc, tu vung, ngu phap va cham diem chi tiet"
BL "Phan loai cau hoi theo: Ky nang (Nghe/Doc/Noi/Viet/Ngu phap), Cap do CEFR, Chu de, Do kho"
H2 "10.4 Thi truc tiep (Live Exam)"
BL "Tao phong thi -> chia se ma tham gia cho hoc vien"
BL "Hoc vien tham gia bang ma phong - khong can link dai phuc tap"
BL "Man hinh giao vien: Nhin thay hoc vien dang vao phong theo thoi gian thuc, bat dau thi khi du nguoi"
BL "Trong khi thi: Giao vien theo doi tien do lam bai cua tung hoc vien, co the gui thong bao"
BL "Ket thuc thi: Ket qua hien thi ngay - bang xep hang diem so, phan tich tung cau"
H2 "10.5 Quan ly nhom hoc tap"
BL "Tao va quan ly nhom: Dat ten, mo ta, chu de, so thanh vien toi da, loai nhom (cong khai/rieng tu)"
BL "Duyet thanh vien xin gia nhap (voi nhom rieng tu)"
BL "Dang bai, chia se tai lieu va thong bao cho toan nhom"
BL "Xem thong ke hoat dong nhom: so tin nhan, thanh vien tich cuc"
PB

Write-Host "=== CH.11 ==="
H1 "11. Bang quan tri Admin"
IMG "03_admin_dashboard.png" 15.5 9 "Hinh 11.1 - Bang dieu khien Admin voi menu day du ben trai va tong quan Analytics ben phai"
P "Bang quan tri Admin (/admin) la khu vuc danh rieng cho Quan tri vien cua nen tang MLS. Tai day, nguoi co quyen Admin co the giam sat toan bo hoat dong he thong, quan ly du lieu va cau hinh nen tang."
H2 "11.1 Dashboard Analytics - Thong ke tong quan"
BL "Bo loc thoi gian: Xem so lieu theo 7 ngay, 30 ngay hoac 90 ngay gan nhat"
BL "Tab Tong quan (Overview): Doanh thu, so don hang, so hoc vien moi, so khoa hoc duoc dang ky"
BL "Tab Nguoi dung (Users): Bieu do tang truong nguoi dung moi theo ngay"
BL "Tab Luot xem (Views): Thong ke luot xem video bai hoc theo ngay"
BL "Tab Doanh so (Sales): Bieu do doanh thu theo ngay, Top 10 sach ban chay, phan tich trang thai don hang"
H2 "11.2 Quan ly Khoa hoc"
IMG "10_admin_courses.png" 15.5 8 "Hinh 11.2 - Trang quan ly khoa hoc cua Admin voi bo loc va danh sach day du"
BL "Xem danh sach toan bo khoa hoc cua tat ca giao vien, loc theo trang thai: Nhap, Cho duyet, Da dang, Da an"
BL "Duyet khoa hoc: Xem noi dung, kiem tra chat luong va phe duyet hoac tu choi kem ly do"
BL "Chinh sua thong tin khoa hoc, them/xoa bai hoc, thay doi gia"
BL "An/hien khoa hoc tren trang cong khai; Xoa vinh vien khoa hoc (can xac nhan 2 lan)"
BL "Quan ly danh muc va the tag cho he thong phan loai"
H2 "11.3 Quan ly Sach"
IMG "11_admin_books.png" 15.5 8 "Hinh 11.3 - Trang quan ly sach voi danh sach day du, tinh trang kho va nut them sach moi"
BL "Them sach moi: Nhap ISBN, tieu de, tac gia, nha xuat ban, nam xuat ban, gia ban, so trang, cap do, the loai"
BL "Upload anh bia (bat buoc) va anh ben trong sach (tuy chon)"
BL "Quan ly ton kho: Nhap so luong, dat nguong canh bao het hang"
BL "Chinh sua thong tin va gia sach bat ky luc nao; An/hien sach khong con phan phoi"
H2 "11.4 Quan ly Don hang"
IMG "12_admin_orders.png" 15.5 8 "Hinh 11.4 - Trang quan ly don hang voi bo loc trang thai va o tim kiem"
BL "Xem danh sach don hang, loc theo trang thai: Cho xu ly, Cho thanh toan, Da thanh toan, Dang xu ly, Hoan thanh, Da huy, That bai"
BL "Tim kiem don hang theo ma don, email khach hang, so dien thoai, ten nguoi nhan"
BL "Xem chi tiet don: danh sach sach, dia chi giao hang, phuong thuc thanh toan, lich su trang thai"
BL "Tao van don ViettelPost: Nhap thong tin, in phieu giao hang truc tiep tu he thong"
BL "Hoan tien (Refund) cho don hang loi hoac khach huy theo chinh sach"
H2 "11.5 Quan ly Voucher"
IMG "13_admin_vouchers.png" 15.5 8 "Hinh 11.5 - Trang quan ly voucher voi danh sach ma giam gia dang hoat dong va lich su su dung"
BL "Tao voucher moi: Nhap ma tuy chinh hoac tao ngau nhien, chon loai giam gia (% hoac so tien co dinh)"
BL "Thiet lap dieu kien ap dung: Don hang toi thieu, danh muc san pham ap dung, gioi han 1 lan/tai khoan"
BL "Dat thoi han su dung: Ngay bat dau va ngay het han voucher"
BL "Gioi han tong so lan su dung tren toan he thong"
BL "Xem thong ke: So lan da dung, tong gia tri chiet khau da cap"
H2 "11.6 Quan ly Nguoi dung"
IMG "14_admin_users.png" 15.5 8 "Hinh 11.6 - Trang quan ly nguoi dung voi danh sach tai khoan, vai tro va cong cu quan ly"
BL "Xem danh sach tat ca nguoi dung, tim kiem theo email, ten, trang thai, vai tro"
BL "Xem chi tiet ho so: thong tin ca nhan, khoa hoc da dang ky, lich su thi, don hang"
BL "Phan quyen: Hoc vien -> Giao vien -> Content Manager -> Admin -> SuperAdmin"
BL "Kich hoat/Khoa tai khoan - Khoa tam thoi (co the mo) hoac vo hieu hoa vinh vien"
BL "Reset mat khau cho nguoi dung quen mat khau va khong nhan duoc email"
BL "Xem lich su dang nhap: Thoi gian, thiet bi, dia chi IP"
PB

Write-Host "=== CH.12 ==="
H1 "12. Cau hoi thuong gap (FAQ)"
H3 "Toi quen mat khau, phai lam gi?"
P "Tai trang dang nhap, nhan lien ket 'Quen mat khau?' phia duoi o nhap mat khau. Nhap dia chi email da dang ky va nhan 'Gui email'. Kiem tra hop thu (ke ca thu muc Spam/Junk) va nhan link dat lai mat khau. Link co hieu luc trong 1 gio. Neu khong nhan duoc email sau 5 phut, thu lai hoac lien he bo phan ho tro."
H3 "Khoa hoc co het han sau khi dang ky khong?"
P "Khong - khoa hoc tren MLS khong co han truy cap. Sau khi dang ky (mien phi hoac co phi), ban co the hoc lai bat cu luc nao, xem lai video khong gioi han lan. Tuy nhien, noi dung khoa hoc co the duoc giao vien cap nhat theo thoi gian."
H3 "Toi co the hoc MLS tren dien thoai khong?"
P "Co. MLS co ung dung di dong day du tinh nang cho ca iOS (tai tu App Store) va Android (tai tu Google Play). Tat ca du lieu hoc tap, tien do va ket qua thi deu dong bo tu dong giua may tinh va dien thoai qua tai khoan."
H3 "Lam sao biet minh o cap do nao cua CEFR?"
P "Thuc hien bai Kiem tra xep lop (Placement Test) mien phi tu muc 'Thi online'. Bai kiem tra khoang 45 phut, bao gom Nghe, Doc va Ngu phap. He thong AI tu dong phan tich ket qua va xep ban vao cap do phu hop tu A1 den C2, dong thoi goi y khoa hoc phu hop de bat dau."
H3 "Chung chi hoan thanh khoa hoc co gia tri gi?"
P "Chung chi Hoan thanh khoa hoc MLS duoc cap sau khi hoc vien hoan thanh 100% noi dung va dat diem kiem tra cuoi khoa. Chung chi nay la bang chung ve no luc hoc tap va co the dung trong ho so xin viec. Rieng chung chi VSTEP va OPIC duoc Bo Giao duc & Dao tao Viet Nam cong nhan chinh thuc."
H3 "Toi mua sach nhung nhan duoc sach sai/hong, phai lam gi?"
P "Chup anh sach loi/sai va lien he ngay bo phan ho tro qua email support@mls.edu.vn hoac Chat truc tuyen tren website trong vong 48 gio ke tu khi nhan hang. Dinh kem ma don hang va anh minh chung. Chung toi se xu ly doi/tra trong 3-5 ngay lam viec va chiu toan bo chi phi van chuyen."
H3 "Toi muon tro thanh Giao vien tren MLS, can lam gi?"
P "De dang ky tro thanh Giao vien tren MLS: (1) Dien form dang ky Giao vien tai /teacher-register hoac gui email den teacher@mls.edu.vn, (2) Dinh kem ho so: CV, bang cap/chung chi day tieng Viet, video gioi thieu ngan 2-3 phut, (3) Doi ngu MLS xet duyet trong 5-7 ngay lam viec, (4) Sau khi duoc duyet, nhan email huong dan kich hoat tai khoan Giao vien."
PB

Write-Host "=== CH.13 ==="
H1 "13. Thong tin lien he & Ho tro"
P "Doi ngu MLS luon san sang ho tro nguoi dung qua nhieu kenh khac nhau. Thoi gian lam viec chinh thuc: Thu Hai - Thu Sau, 8:00 - 18:00 (gio Ha Noi, UTC+7)."
TBL @("Kenh ho tro","Dia chi / Thong tin","Thoi gian phan hoi") @(
    ,@("Email ho tro ky thuat","support@mls.edu.vn","Trong vong 24 gio lam viec"),
    ,@("Email Giao vien","teacher@mls.edu.vn","Trong vong 48 gio lam viec"),
    ,@("Chat truc tuyen","Bieu tuong chat goc duoi phai website","Trong gio lam viec: < 5 phut"),
    ,@("Cong dong hoc vien","Nhom Facebook: MLS Vietnamese Learners","Giai dap boi cong dong 24/7"),
    ,@("Kenh YouTube","youtube.com/@MLSVietnamese","Video huong dan mien phi"),
    ,@("Van phong","Ha Noi, Viet Nam","Hen gap truoc qua email")
)
AddSP
$sel.ParagraphFormat.Alignment = 1
SetFont 11 $false $true $cGray
$sel.TypeText("--- Het tai lieu huong dan su dung MLS v1.0 - Thang 6/2026 ---"); $sel.TypeParagraph()
$sel.ParagraphFormat.Alignment = 0

Write-Host "`n=== DANG LUU ==="
if (Test-Path $OUT) { Remove-Item $OUT -Force }
$doc.SaveAs2($OUT, 16)
$doc.Close($false); $word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null

$info = Get-Item $OUT
Write-Host "`nHOAN THANH!"
Write-Host "File: $OUT"
Write-Host "Kich thuoc: $([math]::Round($info.Length/1MB,2)) MB"
Write-Host "Thoi gian: $(Get-Date -Format 'HH:mm:ss dd/MM/yyyy')"