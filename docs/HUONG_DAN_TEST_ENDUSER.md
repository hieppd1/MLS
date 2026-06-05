# Hướng Dẫn Sử Dụng — OPIC Tiếng Việt (End User)

> **Dành cho:** Giáo viên & Học viên  
> **URL hệ thống:** `http://localhost:3000`  
> **Phiên bản:** Phase 3.2 · Tháng 5/2026

---

## Sơ đồ chức năng theo vai trò

```
┌─────────────────────────────────────────────────────────────────────┐
│                       HEADER — MLS (thanh điều hướng trên cùng)     │
│  Logo │ Trang chủ │ Khoá học │ Sách │ Thi thử        [Avatar ▼]    │
│                                                                     │
│                                        Avatar dropdown:             │
│                                        ├─ Trang cá nhân             │
│                                        ├─ Khoá học của tôi          │
│                                        ├─ 🎤 Luyện OPIC     ← MỚI  │
│                                        ├─ 📋 Portal Giáo viên ← MỚI│
│                                        │   (chỉ hiện với Teacher)   │
│                                        ├─ Cài đặt                   │
│                                        └─ Đăng xuất                 │
└─────────────────────────────────────────────────────────────────────┘

VAI TRÒ GIÁO VIÊN                    VAI TRÒ HỌC VIÊN
─────────────────────                ──────────────────
Vào: Avatar → Portal Giáo viên       Vào: Avatar → Luyện OPIC
     (/teacher)                           (/opic/survey)

Sidebar bên trái:                    Luồng thi:
├─ Quiz & Câu hỏi                    ├─ Chọn chủ đề (Survey)
│  ├─ Quản lý Quiz         ←──────── │  (giáo viên đã tạo quiz)
│  ├─ Ngân hàng câu hỏi              ├─ Thi Phiên 1 (câu 1–7)
│  ├─ Kiểm tra xếp lớp               ├─ Mid-Adjust
│  └─ Realtime Quiz                  ├─ Thi Phiên 2 (câu 8–15)
├─ Khóa học                          └─ Xem kết quả
│  └─ Khóa học của tôi
├─ OPIC
│  ├─ Phân tích (Analytics)
│  ├─ Học viên
│  └─ Script mẫu
└─ Cấu hình
   └─ Cấu hình danh mục  ← Cấu hình Loại Quiz từ DB
```

---

## PHẦN A — Giáo viên: Thiết lập bài thi OPIC

### A.1 Đăng nhập và vào Portal

1. Mở `http://localhost:3000`
2. Nhấn **Đăng nhập** (góc trên phải)
3. Nhập `teacher01@demo.com` / `Test@123` → nhấn **Đăng nhập**
4. Sau khi đăng nhập: nhấn vào **avatar / tên** góc trên phải
5. Trong dropdown chọn **📋 Portal Giáo viên**
6. → Chuyển đến `http://localhost:3000/teacher`

> Sidebar bên trái màu xanh navy hiện ra với các nhóm chức năng.

---

### A.2 Cấu hình Loại Quiz (từ database)

> Bước này thực hiện **một lần** khi cài đặt hệ thống. Các loại quiz sẽ hiển thị trong dropdown khi tạo quiz mới.

1. Sidebar → **Cấu hình** → **Cấu hình danh mục**  
   URL: `/teacher/config`
2. Kéo xuống section **"Loại Quiz"** (badge "Lưu DB · API live")
3. Kiểm tra tab **OPIC**: phải thấy ít nhất 2 dòng:

   | Value | Label |
   |-------|-------|
   | OPICMockTest | OPIC Thi thử (Mock Test) |
   | OPICMiniTest | OPIC Ngắn (Mini Test) |

4. Nếu muốn **sửa tên hiển thị**: nhấn **Sửa** ở cuối hàng → đổi Label → **Lưu**
5. Nếu muốn **thêm loại mới**: nhấn **+ Thêm loại** → chọn nền tảng OPIC → nhập Value & Label → **Tạo**

---

### A.3 Tạo quiz OPIC mới

1. Sidebar → **Quiz & Câu hỏi** → **Quản lý Quiz**  
   URL: `/teacher/quizzes`
2. Nhấn **+ Tạo Quiz mới** (góc trên phải)  
   URL: `/teacher/quizzes/new`
3. **Bước 1 — Thông tin cơ bản:**
   - Tiêu đề: `OPIC Mock Test — Học Tiếng Việt`
   - Nền tảng (Platform): chọn **OPIC**
   - Loại Quiz: chọn **OPIC Thi thử (Mock Test)**
   - Độ khó: **3 — Trung cấp 1**
   - Thời gian: `40` phút
   - Điểm đạt: `60`
4. Nhấn **Tiếp theo →**
5. **Bước 2 — Câu hỏi:** (sẽ thêm câu hỏi ở bước A.4 & A.5)  
   Nhấn **Tiếp theo →** để bỏ qua tạm thời
6. **Bước 3 & 4:** điền mô tả nếu cần → nhấn **Tạo Quiz**
7. → Chuyển đến trang chi tiết quiz `/teacher/quizzes/{id}`

---

### A.4 Tạo câu hỏi audio (Speaking)

1. Sidebar → **Quiz & Câu hỏi** → **Ngân hàng câu hỏi**  
   URL: `/teacher/questions`
2. Nhấn **+ Thêm câu hỏi**
3. Điền form:

   | Trường | Giá trị ví dụ |
   |--------|---------------|
   | Loại câu hỏi | **Speaking** |
   | Nội dung (hiển thị cho GV) | `Hãy tự giới thiệu và kể về hành trình học tiếng Việt của bạn.` |
   | Upload Audio | Nhấn **📎 Chọn file** → chọn file `.mp3` từ máy tính → nhấn **Upload** |
   | (hoặc nhập URL) | Dán URL công khai của file MP3 vào ô `https://...` nếu đã có sẵn |
   | Thời gian nói (giây) | `60` |
   | Số lần nghe lại | `2` |
   | Loại combo OPIC | **orientation** |
   | Kỹ năng | **Speaking** |
   | Độ khó | **3** |
   | Tags | `OPIC, tieng-viet, orientation` |

4. Nhấn **Lưu câu hỏi**
5. Lặp lại cho 14 câu còn lại theo bảng ở mục A.5

#### Bảng 15 câu hỏi chủ đề Học Tiếng Việt

| # | Loại combo | Nội dung câu hỏi | Thời gian | Nghe lại |
|---|-----------|------------------|-----------|---------|
| 1 | orientation | Tự giới thiệu và kể hành trình học tiếng Việt | 60s | 2 |
| 2 | describe | Mô tả một buổi học tiếng Việt điển hình của bạn | 90s | 2 |
| 3 | describe | Miêu tả người thầy/cô dạy tiếng Việt bạn nhớ nhất | 90s | 2 |
| 4 | routine | Thói quen luyện tiếng Việt mỗi ngày của bạn | 90s | 2 |
| 5 | routine | Tài liệu / ứng dụng bạn dùng để học tiếng Việt | 90s | 2 |
| 6 | experience | Lần bạn gặp khó khăn khi học và cách vượt qua | 120s | 2 |
| 7 | experience | Lần đầu nói chuyện với người Việt bằng tiếng Việt | 120s | 2 |
| 8 | question-asking | Hỏi 3 câu về cách người Việt học ngoại ngữ | 90s | 2 |
| 9 | question-asking | Hỏi 3 câu về chương trình học tiếng Việt | 90s | 2 |
| 10 | roleplay | Gọi điện hỏi thông tin đăng ký trung tâm tiếng Việt | 120s | 1 |
| 11 | roleplay | Thảo luận kế hoạch ôn thi OPIC với bạn học | 120s | 1 |
| 12 | describe | Mô tả cuốn sách / tài liệu tiếng Việt hữu ích nhất | 90s | 2 |
| 13 | experience | Dùng tiếng Việt trong tình huống thực tế ngoài lớp | 120s | 2 |
| 14 | experience | Điều gì khiến bạn tiếp tục học tiếng Việt đến nay | 120s | 2 |
| 15 | routine | Kế hoạch nâng cao tiếng Việt trong 6 tháng tới | 90s | 2 |

---

### A.5 Thêm câu hỏi vào quiz

1. Sidebar → **Quản lý Quiz** → tìm quiz vừa tạo → nhấn **Sửa**
2. Chọn tab **Câu hỏi**
3. Nhấn **+ Thêm câu hỏi từ ngân hàng**
4. Bộ lọc: chọn `Kỹ năng = Speaking`, `Tag = OPIC`
5. Tích chọn 15 câu vừa tạo → nhấn **Thêm vào quiz**
6. Kéo thả để sắp xếp thứ tự đúng (câu 1 → 15)
7. Kiểm tra tab **⚙ Cài đặt OPIC**:
   - Stat card "Có audio": phải là **15/15**
   - Stat card "Đã gắn loại": phải là **15/15**

---

### A.6 Cài đặt OPIC từng câu (nếu cần chỉnh sửa)

1. Trong tab **Câu hỏi** của quiz, mỗi câu có nút **Cài đặt** ở cuối dòng
2. Nhấn **Cài đặt** → modal hiện ra:
   - **Loại câu** (ExamModeTag): orientation / describe / routine / experience / roleplay / question-asking
   - **Upload Audio**: nhấn **📎 Chọn file** → chọn file `.mp3` → nhấn **Upload**; hoặc dán URL công khai vào ô bên dưới
   - **Thời gian trả lời**: số giây
   - **Số lần nghe**: 1 hoặc 2
3. Nhấn **Lưu cài đặt**

---

### A.7 Tạo Script mẫu để gợi ý cho học viên

> Script mẫu giúp học viên biết cách trả lời theo cấu trúc chuẩn OPIC.

1. Sidebar → **OPIC** → **Script mẫu**  
   URL: `/teacher/opic/scripts`
2. Nhấn **+ Thêm script**  
   URL: `/teacher/opic/scripts/new`
3. Điền form:

   | Trường | Ví dụ — Script Describe |
   |--------|------------------------|
   | Chủ đề | Giáo dục |
   | Loại combo | Miêu tả (Describe) |
   | Cấp độ mục tiêu | IM2 |
   | Ngôn ngữ | Tiếng Việt |
   | Mở đầu | `Tôi muốn kể về [đối tượng]. Đây là [tổng quan ngắn].` |
   | Thân bài | `Về [đặc điểm 1], tôi nhận thấy [chi tiết]. Ngoài ra [đặc điểm 2] cũng rất [tính từ].` |
   | Kết thúc | `Tóm lại, [đối tượng] đã [tác động]. Tôi nghĩ [nhận xét cá nhân].` |

4. Nhấn **Tạo script** → script xuất hiện trong danh sách
5. Tạo thêm script cho: **Routine** (IM2) và **Experience** (IH)

---

### A.8 Publish quiz

1. Mở quiz → tab **Tổng quan** (hoặc **Cài đặt**)
2. Bật toggle **Công khai** (Published) → màu xanh
3. → Học viên có thể bắt đầu thi

---

## PHẦN B — Học viên: Thi OPIC

### B.1 Đăng nhập và vào trang OPIC

1. Mở `http://localhost:3000`
2. Nhấn **Đăng nhập** → `student@demo.com` / `Test@123`
3. Sau khi đăng nhập: nhấn **avatar** góc trên phải
4. Chọn **🎤 Luyện OPIC**
5. → Chuyển đến `http://localhost:3000/opic/survey`

---

### B.2 Làm khảo sát chủ đề (Survey)

> Hệ thống dùng thông tin này để chọn câu hỏi phù hợp với bạn.

**Trang Survey gồm 3 phần:**

#### Phần 1 — Chọn chủ đề (chọn ít nhất 3)

Nhấn vào các ô chủ đề để chọn (viền xanh = đã chọn):

| Nhóm | Các chủ đề có thể chọn |
|------|----------------------|
| Giải trí | Âm nhạc, Phim ảnh, Thể thao, Đọc sách |
| Cuộc sống | Nấu ăn, Du lịch, Mua sắm, Sức khỏe, Gia đình |
| Chuyên môn | Giáo dục, Công nghệ, Môi trường |
| Khác | Thú cưng, Sở thích, Thời trang, Tình nguyện |

> **Kịch bản test:** Chọn **Giáo dục, Du lịch, Sức khỏe, Gia đình, Sở thích**

#### Phần 2 — Chọn cấp độ mục tiêu (tuỳ chọn)

Chọn cấp độ muốn đạt: IL → IM1 → IM2 → IM3 → IH → AL

> **Kịch bản test:** Chọn **IM2**

#### Phần 3 — Chọn độ khó hiện tại

| Mức | Mô tả |
|-----|-------|
| 1 — Cơ bản 1 | Hoàn toàn mới bắt đầu |
| 2 — Cơ bản 2 | Biết chút ít |
| **3 — Trung cấp 1** | **Có thể giao tiếp đơn giản** ← chọn mức này |
| 4 — Trung cấp 2 | Giao tiếp tự tin |
| 5 — Nâng cao 1 | Thành thạo khá |
| 6 — Nâng cao 2 | Gần như bản ngữ |

**→ Nhấn "Bắt đầu thi"**

Nếu chọn < 3 chủ đề sẽ hiện thông báo lỗi đỏ.

---

### B.3 Màn hình thi — Phiên 1 (Câu 1–7)

URL tự động chuyển đến `/opic/{sessionId}/play`

**Giao diện màn hình thi:**

```
┌─────────────────────────────────────────────────────────┐
│  OPIC Mock Test                    Câu 3 / 15  ████░░  │
│─────────────────────────────────────────────────────────│
│                                                         │
│  🔊  [▶ Nghe câu hỏi]   (còn 2 lần)                   │
│                                                         │
│  Miêu tả người thầy/cô dạy tiếng Việt bạn nhớ nhất.   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │      [ 🎤 Bắt đầu ghi âm ]                     │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ⏱ Thời gian còn lại: 01:25                           │
│                                       [Câu tiếp theo →]│
└─────────────────────────────────────────────────────────┘
```

**Các bước thực hiện mỗi câu:**

1. **Nghe câu hỏi**: Nhấn **▶ Nghe câu hỏi** → audio phát qua loa/tai nghe
   - Số lần nghe còn lại hiển thị bên cạnh (ví dụ "còn 2 lần")
   - Khi hết lượt nghe, nút bị disable
2. **Chuẩn bị**: Đọc nội dung câu hỏi (hiển thị dưới nút audio)
3. **Ghi âm**: Nhấn **🎤 Bắt đầu ghi âm**
   - Lần đầu: trình duyệt hỏi quyền microphone → nhấn **Cho phép**
   - Nút chuyển đỏ với animation sóng âm
   - Nói câu trả lời bình thường vào microphone
4. **Dừng ghi âm**: Nhấn **⏹ Dừng** khi nói xong
   - Xuất hiện audio preview và nút **🔄 Ghi lại** nếu muốn
5. **Qua câu tiếp**: Nhấn **Câu tiếp theo →**
   - Nếu chưa ghi âm → hiện cảnh báo đỏ "Vui lòng ghi âm trước khi tiếp tục"
6. Lặp lại đến hết câu 7

> **Lưu ý:** Đồng hồ đếm ngược theo `speakingTimeLimitSec`. Khi hết giờ, hệ thống tự chuyển câu tiếp.

---

### B.4 Màn hình Mid-Adjust (giữa câu 7 và 8)

Sau câu 7, hệ thống hiện màn hình đánh giá giữa kỳ:

```
┌─────────────────────────────────────────────────────────┐
│              Đánh giá giữa kỳ                           │
│─────────────────────────────────────────────────────────│
│  Bạn đã hoàn thành 7 câu đầu.                          │
│  Hãy chọn mức độ cho 8 câu tiếp theo:                  │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  😌 Dễ hơn  │  │ 😊 Giữ nguyên│  │ 💪 Khó hơn  │  │
│  │  (Easier)   │  │   (Same)     │  │  (Harder)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  * Chọn "Dễ hơn" nếu thấy câu hỏi quá khó             │
│  * Chọn "Giữ nguyên" nếu cảm thấy vừa phải            │
│  * Chọn "Khó hơn" nếu muốn thử thách                  │
│                                                         │
│                        [Tiếp tục →]                    │
└─────────────────────────────────────────────────────────┘
```

**Kịch bản test:**
- Nhấn **Giữ nguyên** → nhấn **Tiếp tục →**

---

### B.5 Màn hình thi — Phiên 2 (Câu 8–15)

Tương tự Phiên 1. Lặp lại các bước nghe → ghi âm → qua câu cho 8 câu còn lại.

Câu cuối (câu 15) sẽ hiện nút **Nộp bài & Xem kết quả** thay vì "Câu tiếp theo →".

---

### B.6 Nộp bài

1. Sau câu 15: nhấn **Nộp bài & Xem kết quả**
2. Hiện popup xác nhận: _"Bạn chắc chắn muốn nộp bài?"_
3. Nhấn **Xác nhận** → hệ thống xử lý (loading spinner ~2-3 giây)
4. → Chuyển đến trang kết quả `/opic/{sessionId}/result`

---

### B.7 Trang kết quả

```
┌─────────────────────────────────────────────────────────┐
│                Kết quả OPIC của bạn                     │
│─────────────────────────────────────────────────────────│
│                                                         │
│       ┌──────────┐                                      │
│       │   IM2    │  ← Level badge (màu cam)             │
│       │  65.5đ   │                                      │
│       └──────────┘                                      │
│                                                         │
│  Kỹ năng chi tiết:                                      │
│  Phát âm    ████████░░  68đ                            │
│  Lưu loát   ███████░░░  64đ                            │
│  Mạch lạc   ████████░░  67đ                            │
│  Từ vựng    ████████░░  65đ                            │
│  Nhiệm vụ  ███████░░░  60đ  ← yếu nhất                │
│                                                         │
│  💡 Gợi ý cải thiện:                                   │
│  Luyện tập trả lời đúng trọng tâm câu hỏi roleplay.   │
│                                                         │
│  [Xem lịch sử]          [Thi lại]                      │
└─────────────────────────────────────────────────────────┘
```

**Màu Level badge:**

| Level | Màu | Ý nghĩa |
|-------|-----|---------|
| NH | Xám | Novice High |
| IL | Đỏ | Intermediate Low |
| IM1 | Cam đậm | Intermediate Mid 1 |
| IM2 | Cam | Intermediate Mid 2 |
| IM3 | Vàng | Intermediate Mid 3 |
| IH | Xanh lam | Intermediate High |
| AL | Xanh lá | Advanced Low |

---

### B.8 Lịch sử các lần thi

1. Từ trang kết quả: nhấn **Xem lịch sử**
   Hoặc: Avatar dropdown → Luyện OPIC → tab **Lịch sử**  
   URL: `/opic/history`
2. Danh sách các session đã thi:
   - **Hoàn thành**: hiện level badge + nút **Xem kết quả**
   - **Đang làm**: hiện nút **Tiếp tục**
3. Nhấn **+ Thi mới** → quay về Survey

---

## PHẦN C — Giáo viên: Theo dõi kết quả học viên

### C.1 Trang Analytics OPIC

1. Portal → **OPIC** → **Phân tích**  
   URL: `/teacher/opic`
2. Đọc các chỉ số:

   | Thẻ thống kê | Mô tả |
   |-------------|-------|
   | Tổng phiên thi | Số session đã tạo |
   | Đã hoàn thành | Số session `isCompleted = true` |
   | Tỷ lệ hoàn thành | % hoàn thành |
   | Điểm trung bình | Overall score trung bình |
   | Level phổ biến | Level xuất hiện nhiều nhất |

3. **Biểu đồ phân bố cấp độ**: cột ngang NH → IL → IM1 → IM2 → IM3 → IH → AL
4. **5 kỹ năng trung bình**: bars Phát âm / Lưu loát / Mạch lạc / Từ vựng / Nhiệm vụ

---

### C.2 Danh sách kết quả học viên

1. Nhấn **Xem học viên →** (từ Analytics) hoặc Sidebar → **OPIC** → **Học viên**  
   URL: `/teacher/opic/students`
2. Bảng hiện:
   - Tên học viên, Level badge (màu), Tổng điểm, 5 mini skill bars, Ngôn ngữ, Ngày thi
3. **Lọc theo level**: nhấn dropdown "Tất cả" → chọn "IM2" → chỉ hiện IM2
4. Hover vào mini skill bar → tooltip điểm số từng kỹ năng

---

### C.3 Xem và chỉnh Script mẫu

1. Sidebar → **OPIC** → **Script mẫu**  
   URL: `/teacher/opic/scripts`
2. Mỗi card hiện: Loại combo, Chủ đề, Cấp độ, Ngôn ngữ, trạng thái Published/Draft
3. Nhấn **▼** trên card → mở rộng xem Opening / Body / Closing template
4. Nhấn **Sửa** → chỉnh sửa nội dung → **Lưu**
5. Nhấn toggle **Published** → script hiện/ẩn với học viên

---

## PHẦN D — Các loại OPIC hiện có

> ⚠ **Lưu ý hiện tại:** Phiên thi OPIC adaptive (oral interview) luôn dùng cấu trúc 15 câu (Mock Test). Mini Test (8 câu) đang trong kế hoạch phát triển.

| Loại Quiz | Số câu | Thời gian | Mid-Adjust | Trạng thái |
|-----------|--------|-----------|------------|------------|
| **OPICMockTest** | 15 câu (7+8) | ~40 phút | ✅ Có | ✅ Hoạt động |
| **OPICMiniTest** | 8 câu (4+4) | ~20 phút | ❌ Không | 🔧 Đang phát triển |

Để mở Mini Test: cần bổ sung trường `quizType` trong form Survey → học viên chọn loại trước khi thi.

---

## PHẦN E — Checklist test đầy đủ

### E.1 Checklist Giáo viên

- [ ] Đăng nhập teacher01@demo.com → Avatar → Portal Giáo viên → vào /teacher
- [ ] Config → Cấu hình danh mục → tab OPIC → xác nhận 2 loại quiz (MockTest, MiniTest)
- [ ] Tạo quiz OPICMockTest "Học Tiếng Việt" (/teacher/quizzes/new)
- [ ] Tạo ít nhất 3 câu hỏi Speaking với audioUrl, speakingTimeLimitSec, examModeTag
- [ ] Thêm câu hỏi vào quiz → kiểm tra tab ⚙ Cài đặt OPIC (15/15 audio)
- [ ] Tạo 1 script mẫu Describe cho chủ đề Giáo dục (/teacher/opic/scripts/new)
- [ ] Publish quiz
- [ ] Kiểm tra /teacher/opic → Tổng phiên thi, Phân bố level

### E.2 Checklist Học viên

- [ ] Đăng nhập student@demo.com → Avatar → Luyện OPIC → vào /opic/survey
- [ ] Chọn ít nhất 3 chủ đề → chọn độ khó 3 → nhấn Bắt đầu thi
- [ ] Nghe câu hỏi audio câu 1 (nút ▶ Play)
- [ ] Ghi âm câu 1 (cấp quyền microphone nếu được hỏi)
- [ ] Hoàn thành câu 1–7 (Phiên 1)
- [ ] Màn hình Mid-Adjust → chọn Giữ nguyên → Tiếp tục
- [ ] Hoàn thành câu 8–15 (Phiên 2)
- [ ] Nhấn Nộp bài & Xem kết quả
- [ ] Trang kết quả hiện Level badge + 5 skill bars + gợi ý cải thiện
- [ ] Nhấn Xem lịch sử → session vừa thi xuất hiện với trạng thái Hoàn thành

### E.3 Checklist Xác nhận cuối

- [ ] Teacher portal → OPIC → Học viên → student@demo.com xuất hiện với Level đúng
- [ ] Teacher portal → OPIC → Phân tích → Tổng phiên thi tăng thêm 1
- [ ] Trang /teacher/config → tab OPIC → label "OPIC Thi thử (Mock Test)" hiển thị đúng tiếng Việt (không bị garbled)

---

## PHẦN F — Xử lý sự cố thường gặp

| Vấn đề | Nguyên nhân | Cách xử lý |
|--------|-------------|-----------|
| Không thấy "Portal Giáo viên" trong dropdown | Tài khoản không phải Teacher/Admin | Đăng nhập bằng teacher01@demo.com |
| Survey yêu cầu chọn thêm chủ đề | Chọn < 3 chủ đề | Chọn đủ ít nhất 3 ô |
| Trình duyệt không hỏi quyền microphone | Đã từ chối trước đó | Vào Settings → Site settings → Microphone → Cho phép localhost:3000 |
| Nút "Câu tiếp theo" bị khoá (màu xám) | Chưa ghi âm | Nhấn 🎤 Bắt đầu ghi âm → nói → Dừng trước |
| Trang kết quả hiện "đang chấm" | Session chưa finalize | Đợi ~3 giây rồi tải lại trang |
| Label Loại Quiz bị lỗi ký tự | Encoding cũ trong DB | Vào /teacher/config → Sửa → nhập lại label đúng |
| Audio không phát | audioUrl không hợp lệ hoặc CORS | Kiểm tra URL MP3 có accessible không; dùng URL public |
| 401 Unauthorized | Token hết hạn | Đăng xuất → đăng nhập lại |
