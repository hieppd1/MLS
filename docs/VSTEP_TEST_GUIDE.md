# Hướng dẫn Test E2E — VSTEP Tiếng Việt (Demo)

> **Mục tiêu**: Giả lập toàn bộ trải nghiệm thi VSTEP từ góc nhìn học sinh trên trình duyệt  
> **URL**: `http://localhost:3000` | **Thời gian ước tính**: 20–30 phút

---

## Chuẩn bị trước khi test

### 1. Khởi động hệ thống

```powershell
# Terminal 1 — Backend
$env:ASPNETCORE_ENVIRONMENT = "Development"
cd "D:\HiepPD\MLS\backend\MLS.API"
dotnet run

# Terminal 2 — Frontend
cd "D:\HiepPD\MLS\frontend"
npm run dev
```

Kiểm tra: `http://localhost:5009/health` trả `OK` và `http://localhost:3000` load được.

### 2. Seed dữ liệu VSTEP (nếu chưa có)

```powershell
$env:PGPASSWORD = "123@123aA"; $env:PGCLIENTENCODING = "UTF8"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -d mls `
    --set=client_encoding=UTF8 -f "D:\HiepPD\MLS\deploy\seed-vstep-tieng-viet.sql"
```

---

## BƯỚC 1 — Đăng nhập

1. Mở `http://localhost:3000/auth/login`
2. Điền thông tin tài khoản học sinh:
   - **Email**: `student@demo.com`
   - **Password**: `Demo@123`
3. Nhấn **Đăng nhập**

**Kỳ vọng**: Chuyển về trang chủ, thấy tên user ở header.

---

## BƯỚC 2 — Vào trang Thi Online

1. Từ menu điều hướng trái, nhấn **Thi online**  
   hoặc truy cập trực tiếp: `http://localhost:3000/thi-online`

**Kỳ vọng**: Thấy danh sách bài thi được chia theo loại (VSTEP Listening, VSTEP Reading, VSTEP Writing, VSTEP Speaking, VSTEP Mock Test…).

---

## BƯỚC 3 — Bắt đầu phần thi từ danh sách

> Có thể test từng phần riêng lẻ **hoặc** thi đầy đủ 4 kỹ năng (Mock Test).

### Cách A: Thi từng phần riêng

1. Tìm card tương ứng (ví dụ: **"VSTEP Listening — Nghe hiểu tổng hợp"**)
2. Nhấn nút **Làm bài**

**Kỳ vọng**: Chuyển sang trang `/vstep?quizId=<id>` — hiển thị quiz đã được pre-select với nhãn ✅.

3. Chọn band mục tiêu (tùy chọn: `B1`, `B2`, …)
4. Nhấn **Bắt đầu thi VSTEP →**

**Kỳ vọng**: Session được tạo, tự động chuyển sang trang phần thi đúng (ví dụ `/vstep/[sessionId]/listening`) — **không cần nhập ID thủ công**.

### Cách B: Thi đầy đủ 4 kỹ năng (Mock Test)

1. Tìm card **"VSTEP Mock Test"**
2. Nhấn **Làm bài** → chọn band → **Bắt đầu thi**

**Kỳ vọng**: Chuyển sang session hub `/vstep/[sessionId]` với 4 card phần thi.  
Ghi lại `sessionId` từ URL để dùng các bước sau.

---

## BƯỚC 4 — Phần Nghe

> Áp dụng nếu đến từ **Cách A** (VSTEP Listening) hoặc nhấn card **Nghe** trong session hub.

**Kỳ vọng khi vào trang**: Bài thi tự động bắt đầu, load ngay 3 đoạn ngữ liệu và 8 câu hỏi MCQ — không có màn hình nhập ID.

### Đọc ngữ liệu và trả lời câu hỏi

Trang chia thành 3 nhóm bài (PassageGroup):

| Group | Loại | Số câu |
|-------|------|--------|
| 1 | Hội thoại ngắn — kế hoạch cuối tuần | 2 câu |
| 2 | Thông báo nhà trường — lịch thi | 3 câu |
| 3 | Bài giảng — Tết Nguyên Đán | 3 câu |

> Trong demo không có file audio thật. Đọc script hiển thị trong ô văn bản để trả lời.

Đáp án đúng để test điểm cao:

| Câu | Đáp án đúng |
|-----|-------------|
| L1 — Họ nói về điều gì? | Kế hoạch picnic cuối tuần |
| L2 — Gặp nhau ở đâu? | Cổng vào công viên Thống Nhất |
| L3 — Thông báo về gì? | Thay đổi lịch thi học kỳ |
| L4 — Từ khi nào? | Tuần tới, thứ Hai ngày 1 |
| L5 — Học sinh cần làm gì? | Kiểm tra bảng thông báo hoặc website |
| L6 — Chủ đề bài giảng? | Tết Nguyên Đán — nguồn gốc và phong tục |
| L7 — Phong tục cầu may? | Đi lễ chùa và xin chữ đầu năm |
| L8 — Ý nghĩa bánh chưng? | Tượng trưng cho đất, lòng biết ơn tổ tiên |

### Nộp bài Nghe

Nhấn **Nộp bài**.

**Kỳ vọng**: Hiển thị điểm (ví dụ 8.75 / 10) và nút **"Tiếp tục phần Đọc →"**.

---

## BƯỚC 5 — Phần Đọc

> Áp dụng nếu đến từ **Cách A** (VSTEP Reading) hoặc nhấn card **Đọc** trong session hub.

**Kỳ vọng khi vào trang**: Bài thi tự động bắt đầu, load ngay 3 nhóm bài và 12 câu hỏi MCQ.

### Làm bài Đọc (12 câu, 3 groups)

**Group 1 — Điền từ: Đoạn văn về Hà Nội**

| Câu | Đáp án đúng |
|-----|-------------|
| R1 — Điền từ (1) | thủ đô |
| R2 — Điền từ (2) | đặc biệt |
| R3 — Điền từ (3) | di tích |
| R4 — Điền từ (4) | thu hút |

**Group 2 — Đọc hiểu: Đổi mới giáo dục 2018**

| Câu | Đáp án đúng |
|-----|-------------|
| R5 — Mục tiêu Chương trình 2018? | Chuyển từ tiếp cận nội dung sang tiếp cận năng lực |
| R6 — Môn học tăng cường Tiểu học? | Tin học và Ngoại ngữ |
| R7 — PBL là gì? | Học qua dự án thực tế |
| R8 — "Tích cực" nghĩa là gì? | Người học chủ động tham gia, không thụ động |

**Group 3 — Đọc hiểu: Ô nhiễm không khí**

| Câu | Đáp án đúng |
|-----|-------------|
| R9 — Vấn đề chính? | Ô nhiễm không khí tại các đô thị Việt Nam |
| R10 — KHÔNG phải nguyên nhân? | Rác thải sinh hoạt của người dân |
| R11 — AQI là gì? | Air Quality Index |
| R12 — Biện pháp không được đề cập? | Cấm xe máy trong nội đô |

### Nộp bài Đọc

Nhấn **Nộp bài** → kỳ vọng điểm 10.0 / 10 nếu đúng hết.

---

## BƯỚC 6 — Phần Viết

> Áp dụng nếu đến từ **Cách A** (VSTEP Writing) hoặc nhấn card **Viết** trong session hub.

**Kỳ vọng khi vào trang**: Hiển thị ngay 2 textarea Task 1 và Task 2 — không có màn hình nhập ID.

### Task 1 — Thư chính thức (tối thiểu 120 từ)

Dán bài mẫu (thư phản ánh vệ sinh căn tin) vào ô Task 1 — xem nội dung mẫu trong phần cũ nếu cần.

### Task 2 — Bài luận (tối thiểu 250 từ)

Dán bài mẫu (tranh luận về điện thoại trong lớp) vào ô Task 2.

### Nộp bài Viết

Nhấn **Nộp bài**.

**Kỳ vọng**:
- Hiển thị "Phần Viết đã hoàn thành"
- Ghi chú: "Bài viết sẽ được chấm bởi giáo viên / AI"
- Có nút **"Tiếp tục phần Nói →"**

---

## BƯỚC 7 — Phần Nói

> Áp dụng nếu đến từ **Cách A** (VSTEP Speaking) hoặc nhấn card **Nói** trong session hub.

**Kỳ vọng khi vào trang**: Hiển thị ngay 3 phần ghi âm — không có màn hình nhập ID.

### Cấp quyền microphone

Trình duyệt sẽ hỏi quyền truy cập microphone. Nhấn **Cho phép**.

### Ghi âm 3 phần

| Phần | Nội dung | Thời gian |
|------|----------|-----------|
| P1 — Tự giới thiệu | Tên, tuổi, nghề nghiệp, sở thích | 120 giây |
| P2 — Mô tả chủ đề | Trải nghiệm du lịch đáng nhớ | 180 giây |
| P3 — Thảo luận | Vai trò công nghệ trong giáo dục | 300 giây |

Với mỗi phần: nhấn **Bắt đầu ghi** → nói → nhấn **Dừng**.

### Nộp bài Nói

Nhấn **Nộp bài** sau khi ghi âm cả 3 phần.

**Kỳ vọng**: Hiển thị "Phần Nói đã hoàn thành" + nút **"Xem tổng kết →"**.

---

## BƯỚC 8 — Xem kết quả Band

### Vào trang kết quả

Nhấn **"Xem tổng kết"** hoặc truy cập:  
`http://localhost:3000/vstep/[sessionId]/result`

**Kỳ vọng**: Hiển thị Band + tổng điểm + điểm từng phần.

> Sau khi AI chấm Viết và Nói (thường vài giây), reload trang để thấy band cập nhật.

### Bảng band theo kịch bản

| Kịch bản | Nghe | Đọc | Viết | Nói | Band |
|----------|------|-----|------|-----|------|
| Đúng hết, AI chấm tốt | 10.0 | 10.0 | 8.0 | 8.5 | **C1** |
| MCQ đúng hết, viết/nói khá | 10.0 | 10.0 | 6.5 | 7.0 | **C1** |
| Đúng 6/8 Nghe, 9/12 Đọc | 7.5 | 7.5 | 7.0 | 7.0 | **B2** |
| Demo trên (Viết/Nói chưa chấm) | 8.75 | 10.0 | 0 | 0 | **B1** |

---

## Checklist E2E

### Setup
- [ ] Backend chạy tại `http://localhost:5009`
- [ ] Frontend chạy tại `http://localhost:3000`
- [ ] Seed SQL chạy thành công

### Flow học sinh
- [ ] Đăng nhập thành công, thấy tên user ở header
- [ ] Trang `/thi-online` hiển thị danh sách bài thi VSTEP
- [ ] Nhấn "Làm bài" → chuyển sang `/vstep?quizId=<id>` với quiz pre-selected (✅)
- [ ] Nhấn "Bắt đầu thi" → tự động chuyển đến đúng trang phần thi

### Phần Nghe
- [ ] Bài thi tự động bắt đầu (không cần nhập ID)
- [ ] 3 PassageGroups hiển thị script văn bản
- [ ] Chọn đáp án, nộp bài → điểm hiển thị đúng
- [ ] Card Nghe trong session hub chuyển sang "đã hoàn thành"

### Phần Đọc
- [ ] Bài thi tự động bắt đầu (không cần nhập ID)
- [ ] 3 nhóm bài load đúng, có thể chuyển tab giữa các passage
- [ ] Nộp bài → điểm hiển thị đúng

### Phần Viết
- [ ] 2 textarea hiển thị ngay (không cần nhập ID)
- [ ] Nộp < 120 từ Task 1 → hiện lỗi, không cho submit
- [ ] Nộp < 250 từ Task 2 → hiện lỗi, không cho submit
- [ ] Dán đủ text → nộp thành công, ghi chú "AI chấm"

### Phần Nói
- [ ] 3 phần ghi âm hiển thị ngay (không cần nhập ID)
- [ ] Trình duyệt hỏi quyền microphone
- [ ] Ghi âm → dừng → trạng thái "đã ghi"
- [ ] Nộp 3 phần → thành công

### Kết quả
- [ ] Trang `/result` hiển thị Band + tổng điểm
- [ ] Điểm từng phần hiển thị đúng
- [ ] Nút "Thi lại" quay về `/vstep`

---

## Xử lý sự cố

| Vấn đề | Giải pháp |
|--------|-----------|
| "Không tìm thấy phiên thi" | Kiểm tra sessionId trong URL; tạo session mới |
| Bài thi không tự động bắt đầu | Kiểm tra URL có `?quizId=<id>`; backend đang chạy? |
| Phần Viết không cho nộp | Task 1 >= 120 từ, Task 2 >= 250 từ (có đếm từ dưới ô) |
| Microphone không hoạt động | Kiểm tra quyền Chrome: `chrome://settings/content/microphone` |
| Band thấp hơn dự kiến | Viết/Nói tạm = 0; chờ AI chấm rồi reload; hoặc xem note dưới |

**Set điểm thủ công để test band nhanh** (dùng Swagger `http://localhost:5009/swagger`):

```
POST /api/v1/vstep/sessions/{sessionId}/submit-part
Body: { "part": "Writing", "score": 7.5 }
Body: { "part": "Speaking", "score": 8.0 }
```

---

## Luồng tóm tắt

```
/thi-online
  ↓ Tìm đề VSTEP → nhấn "Làm bài"
/vstep?quizId=<id>
  ↓ Quiz pre-selected ✅ → chọn band → Bắt đầu thi
/vstep/[sessionId]/listening?quizId=<id>   ← auto-start, không nhập ID
  ↓ 8 câu MCQ → nộp bài
/vstep/[sessionId]/reading?quizId=<id>    ← auto-start
  ↓ 12 câu MCQ → nộp bài
/vstep/[sessionId]/writing?quizId=<id>    ← auto-start
  ↓ 2 textarea (120/250 từ) → nộp bài
/vstep/[sessionId]/speaking?quizId=<id>   ← auto-start
  ↓ ghi âm 3 phần → nộp bài
/vstep/[sessionId]/result
  → Band + điểm từng phần
```