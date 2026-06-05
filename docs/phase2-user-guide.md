# Hướng Dẫn Sử Dụng — Phase 2: Interactive Sessions

> **Phiên bản:** Phase 2A (Non-Quiz)  
> **URL Production:** http://103.20.97.97  
> **Ngày cập nhật:** 15/05/2026

---

## 1. Tổng quan các tính năng Phase 2

Phase 2 bổ sung tính năng **Interactive Session Player** — một dạng bài học video tương tác được chia thành nhiều phân đoạn (Segments) với nội dung học tập (Learning Assets) xuất hiện theo tiến trình xem video.

| Tính năng | Route | Mô tả |
|-----------|-------|--------|
| **Session Player** | `/session/[id]` | Trình chiếu video tương tác theo phân đoạn |
| **Lesson Player** | `/lesson/[id]` | Trình chiếu bài học video thông thường |
| **Course Detail** | `/khoa-hoc/[id]` | Trang chi tiết khóa học hiển thị cả Lessons và Sessions |

---

## 2. Trang Chi Tiết Khóa Học — `/khoa-hoc/[id]`

### Cách truy cập
1. Đăng nhập vào hệ thống
2. Nhấn **Khoá học** trên navigation bar
3. Chọn khóa học muốn xem → nhấn "Chi tiết"

### Các tính năng mới

**Tab "Nội dung"** hiển thị đầy đủ cả Lessons lẫn Sessions trong từng module:

> 📸 _Ảnh màn hình: Trang Nội dung khóa học — Module 1 mở rộng hiển thị 3 sessions với badge "3 phần", "2 phần"_

- Mỗi module hiển thị số **nội dung** (lessons + sessions)
- Sessions được ký hiệu bằng icon màn hình/monitor và badge **"N phần"** (số segments)
- Lessons hiển thị thời lượng (phút)
- Nhấn vào module để expand/collapse danh sách nội dung
- Nhấn vào một session → chuyển đến **Session Player** (`/session/[id]`)

**Nút "Tiếp tục học"** — tự động dẫn đến bài học/session đầu tiên chưa hoàn thành.

---

## 3. Session Player — `/session/[id]`

Session Player là điểm nổi bật của Phase 2. Nó chia video thành nhiều phân đoạn thời gian, mỗi phân đoạn có thể chứa các learning asset (ghi chú, ngữ pháp, từ vựng) xuất hiện đúng thời điểm trong video.

### 3.1 Giao diện tổng quan

> 📸 _Ảnh màn hình: Session Player — Video player + Segment timeline + Active segment panel + Sidebar "PHÂN ĐOẠN (3)" với 3 segments, tiến độ 35%, nút "Hoàn thành Session"_

**Các thành phần chính:**

| Khu vực | Chức năng |
|---------|-----------|
| ① Header | Nút quay lại, tên session, % tiến độ, nút "Phân đoạn" (mobile) |
| ② Video Player | Phát video với đầy đủ điều khiển (play/pause, volume, speed, PiP, fullscreen) |
| ③ Segment Timeline | Thanh hiển thị các phân đoạn theo thời gian; màu sắc phân biệt trạng thái |
| ④ Active Segment Panel | Tên + mô tả phân đoạn đang xem, nút "Đánh dấu xong" |
| ⑤ Learning Assets | Nội dung học (NoteBlock/GrammarBlock/VocabularyBlock) xuất hiện dần theo video |
| ⑥ Segment Sidebar | Danh sách tất cả phân đoạn, tiến độ tổng, nút "Hoàn thành Session" |

---

### 3.2 Segment Timeline Bar

![Segment Timeline](../deploy/screenshots/session-player-full.png)

Thanh timeline nằm ngay dưới video player, hiển thị toàn bộ timeline của video được chia thành các phân đoạn:

> 📸 _Ảnh màn hình: Segment timeline bar — chia thành 3 khu vực màu: xanh đậm (đã xem), xanh nhạt (đang active), xám (chưa xem). Nhãn thời gian "00:35" (hiện tại) và "08:00" (tổng)_

- **Màu xanh nhạt (active):** Phân đoạn đang được xem
- **Màu xanh đậm (viewed):** Phân đoạn đã xem qua
- **Màu xám:** Phân đoạn chưa xem

Nhấn vào một phân đoạn trên timeline → video tự động seek đến thời điểm bắt đầu của phân đoạn đó.

**Nhãn thời gian** hiển thị ở hai đầu: thời điểm hiện tại và tổng thời lượng session.

---

### 3.3 Learning Asset Panels

Khi video phát đến thời điểm của một asset, nó tự động xuất hiện trong khu vực bên dưới active segment. Có 3 loại asset:

#### 📝 NoteBlock — Khối Ghi Chú

Hiển thị ghi chú, lưu ý quan trọng với highlight list:

```
┌─────────────────────────────────────────────────────────┐
│ 📝 Lưu Ý: Cách Dùng "Hello"                            │
│                                                         │
│ 'Hello' là lời chào thông dụng nhất. Dùng trong cả     │
│ tình huống trang trọng và thân mật...                   │
│                                                         │
│ ✓ Dùng được cả trang trọng lẫn thân mật                │
│ ✓ Phát âm: /həˈloʊ/                                     │
│ ✓ Các biến thể: Howdy, Hey, Greetings                   │
└─────────────────────────────────────────────────────────┘
```

**Màu sắc:** Vàng/amber (border + background)

#### 📐 GrammarBlock — Khối Ngữ Pháp

Hiển thị cấu trúc câu, ví dụ và từ khóa ngữ pháp:

```
┌─────────────────────────────────────────────────────────┐
│ 📐 Cấu Trúc: Giới Thiệu Bản Thân                       │
│                                                         │
│ Pattern:                                                │
│ My name is [Name]. I am from [Country]. I am a/an [Job] │
│                                                         │
│ Ví dụ:                                                  │
│ • My name is Minh. I am from Vietnam. I am a software...│
│ • Hi, I'm Sarah. I'm from the UK. I'm a teacher.       │
│                                                         │
│ Keywords: [My name is] [I am from] [I am a/an]         │
└─────────────────────────────────────────────────────────┘
```

**Màu sắc:** Xanh dương (border + background)

#### � GrammarBlock — Khối Ngữ Pháp (khi video đến t=02:50)

> 📸 _Ảnh màn hình: Segment 2 active (Part 2 highlighted trong sidebar), GrammarBlock "Cấu Trúc: Giới Thiệu Bản Thân" hiển thị với pattern và keywords_

#### �📚 VocabularyBlock — Khối Từ Vựng

Hiển thị danh sách từ vựng có thể mở rộng, với IPA, nghĩa và ví dụ:

```
┌─────────────────────────────────────────────────────────┐
│ 📚 Từ Vựng: Lời Chào                       4 từ  ∧     │
│                                                         │
│ Hello    /həˈloʊ/    Xin chào (trang trọng/thông thường)│
│ Hi       /haɪ/       Chào (thân mật)                    │
│ Greetings /ˈɡriːtɪŋz/ Lời chào hỏi (trang trọng)       │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

Nhấn vào từng từ để xem thêm ví dụ sử dụng.

**Màu sắc:** Xanh lá (border + background)

---

### 3.4 Segment Sidebar

> 📸 _Ảnh màn hình: Sidebar "PHÂN ĐOẠN (3)" — Tiến độ 0%, Segment 1 (eye icon = đang xem, highlighted), Segment 2 + 3 chưa xem. Nút "Hoàn thành Session" màu tím cố định cuối sidebar_

Sidebar hiển thị ở bên phải màn hình (desktop) hoặc có thể toggle bằng nút "Phân đoạn" (mobile).

**Thông tin trong sidebar:**
- Tiêu đề: **PHÂN ĐOẠN (N)** — số phân đoạn trong session
- Thanh tiến độ tổng thể (% đã hoàn thành)
- Danh sách từng phân đoạn:
  - Icon trạng thái: 👁 đã xem, ▶ đang active, số thứ tự (chưa xem)
  - Tên phân đoạn + khoảng thời gian (mm:ss – mm:ss)
  - Số tài nguyên học
- Nút **"Hoàn thành Session"** (màu tím, cố định dưới cùng)

Nhấn vào phân đoạn trong sidebar → video seek đến thời điểm bắt đầu của phân đoạn đó.

---

### 3.5 Workflow học một Session

```
1. Vào trang khóa học → nhấn tên Session
2. Session Player mở → video bắt đầu tải
3. Nhấn Play → video phát
4. Khi video đến phân đoạn mới:
   - Segment Timeline highlight phân đoạn đó
   - Active Segment Panel cập nhật thông tin
5. Khi video đến thời điểm của asset:
   - NoteBlock / GrammarBlock / VocabularyBlock xuất hiện
   - Tương tác với asset (nhấn xem từ vựng...)
6. Sau khi xem xong một phân đoạn:
   - Nhấn "Đánh dấu xong" để ghi nhận
   - Hoặc hệ thống tự động đánh dấu khi qua phân đoạn tiếp theo
7. Sau khi xem hết tất cả phân đoạn:
   - Nhấn "Hoàn thành Session" → session được đánh dấu hoàn thành
   - Tiến độ cập nhật trong course outline
```

---

## 4. Lesson Player — `/lesson/[id]`

Lesson Player là dạng bài học video đơn giản (không có segments/assets).

### Các tính năng
- Phát video HLS với điều khiển đầy đủ
- **Resume tự động:** Ghi nhớ vị trí đã xem, tiếp tục từ đó khi mở lại
- **Course Outline sidebar:** Hiển thị danh sách tất cả bài trong module
  - Lessons (icon film)
  - Sessions (icon monitor với badge "N phần")
  - Đánh dấu ✅ xanh cho bài đã hoàn thành
  - Thời lượng cho lessons, số segments cho sessions
- Nút **"Bài tiếp theo"** chuyển đến bài tiếp trong module
- Link **"Quay lại"** → trang chi tiết khóa học

---

## 5. API Endpoints (Phase 2)

Các endpoint backend cho student learning:

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `GET` | `/api/v1/sessions/{id}` | Lấy thông tin session + segments + assets + progress |
| `POST` | `/api/v1/sessions/{id}/start` | Bắt đầu session (tạo progress record) |
| `POST` | `/api/v1/sessions/{id}/video-position` | Lưu vị trí xem video |
| `POST` | `/api/v1/sessions/{id}/complete` | Đánh dấu hoàn thành session |
| `POST` | `/api/v1/segments/{id}/view` | Đánh dấu đã xem phân đoạn |
| `POST` | `/api/v1/segments/{id}/complete` | Đánh dấu hoàn thành phân đoạn |
| `POST` | `/api/v1/assets/{id}/interact` | Ghi lại tương tác với learning asset |

---

## 6. Cấu trúc dữ liệu Phase 2

### Database Schema (tenant_demo schema)

```
Courses
  └── CourseModules (OrderIndex)
       ├── Lessons (thường / không có segments)
       └── Sessions (interactive)
            ├── SessionVideoAssets (HLS video)
            └── Segments (phân đoạn theo thời gian)
                 └── LearningAssets (NoteBlock/GrammarBlock/VocabularyBlock)
```

### Các loại LearningAsset và Metadata format

**NoteBlock:**
```json
{
  "content": "Nội dung ghi chú...",
  "highlights": ["Điểm 1", "Điểm 2", "Điểm 3"]
}
```

**GrammarBlock:**
```json
{
  "pattern": "Subject + Verb + Object",
  "examples": ["Câu ví dụ 1", "Câu ví dụ 2"],
  "keywords": ["từ khóa 1", "từ khóa 2"]
}
```

**VocabularyBlock:**
```json
{
  "words": [
    {
      "word": "Hello",
      "ipa": "/həˈloʊ/",
      "meaning": "Xin chào",
      "example": "Hello, my name is Minh."
    }
  ]
}
```

---

## 7. Dữ liệu Demo (VPS Production)

Khóa học demo với đầy đủ Phase 2 data:

| Khóa học | ID |
|----------|-----|
| Tiếng Anh Giao Tiếp Cơ Bản | `d0000001-0000-0000-0000-000000000001` |

**Sessions có đầy đủ segments và learning assets:**

| Session | Segments | Assets |
|---------|----------|--------|
| Bài 1: Hello, Nice to Meet You! | 3 (Part 1, 2, 3) | NoteBlock + VocabularyBlock + GrammarBlock + NoteBlock |
| Bài 2: Giới Thiệu Nghề Nghiệp | 2 (Part 1, 2) | NoteBlock + VocabularyBlock + GrammarBlock |

**Tài khoản demo:**
| Email | Mật khẩu | Vai trò |
|-------|----------|---------|
| hocvien1@demo.local | Demo@123456 | Học viên (đã enrolled) |
| hocvien2@demo.local | Demo@123456 | Học viên (đã enrolled) |
| admin@demo.local | Demo@123456 | Admin |

---

## 8. Hướng dẫn phát triển Frontend (Phase 2A)

### Files đã tạo/cập nhật

| File | Loại | Mô tả |
|------|------|--------|
| `src/app/session/[id]/page.tsx` | NEW | Session player page |
| `src/app/lesson/[id]/page.tsx` | NEW | Lesson player (English URL) |
| `src/lib/features/learning/learningApi.ts` | NEW | RTK Query API slice |
| `src/lib/store.ts` | UPDATED | Thêm learningApi |
| `src/lib/features/courses/coursesApi.ts` | UPDATED | Thêm PublicSessionItem |
| `src/components/video/HlsPlayer.tsx` | UPDATED | Thêm startTime + seekRef props |
| `src/app/khoa-hoc/[id]/page.tsx` | UPDATED | Hiển thị sessions trong module |
| `src/app/courses/[id]/page.tsx` | UPDATED | Cập nhật lesson links |

### Route mapping

| Old URL | New URL |
|---------|---------|
| `/courses/lessons/[lessonId]` | `/lesson/[id]` |
| N/A (mới) | `/session/[id]` |

---

## 9. Ghi chú kỹ thuật

### Video Loading
- `HlsPlayer` component hỗ trợ cả HLS (`.m3u8`) và MP4 trực tiếp
- URL video: `{NEXT_PUBLIC_API_URL}/media/{hlsPath}`
- VPS media folder: `/opt/mls/media/`

### Progress Tracking
- Video position được lưu tự động mỗi 5 giây (debounced)
- Session tự động "start" khi render component
- Segment "viewed" khi video tiến vào trong khoảng thời gian của segment
- Learning assets tự động xuất hiện khi `currentTime >= asset.startTime`

### Backend API changes
- `PublicModuleItem` bổ sung `Sessions: PublicSessionItem[]`
- `PublicSessionItem` gồm: Id, Title, Description, OrderIndex, IsFreeTrial, IsLocked, DurationSeconds, SegmentCount
- Backend chỉ trả về sessions có `PublishStatus = Published`
