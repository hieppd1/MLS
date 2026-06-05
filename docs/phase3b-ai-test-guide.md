# Phase 3B — Hướng dẫn Test UI
# Speaking AI (Sprint 6) + Writing AI (Sprint 7)

> **Frontend**: `http://localhost:3000`  
> **Backend**: `http://localhost:5009`  
> **Tài khoản test**: `student@demo.com` / `Test@123`, tenant `demo`

---

## Bước 0 — Cài đặt dữ liệu test

Trước khi test UI, cần chạy seed để tạo quiz Speaking/Writing mẫu.

### 0.1 Khởi động services

```powershell
# Backend (nếu chưa chạy)
cd backend/MLS.API
dotnet run --urls http://localhost:5009

# Frontend (nếu chưa chạy)
cd frontend
npm run dev
```

### 0.2 Chạy seed quiz AI mẫu

Mở pgAdmin hoặc DBeaver, kết nối PostgreSQL local, chọn schema `tenant_demo`, rồi chạy file:

```
deploy/seed-phase3b-ai-quizzes.sql
```

Sau khi seed thành công, 3 quiz mới được tạo với ID cố định:

| Quiz | URL trực tiếp |
|------|--------------|
| Speaking Test | `http://localhost:3000/quiz/dddddddd-0001-0000-0000-000000000001/speaking` |
| Writing — Argumentative Essay | `http://localhost:3000/quiz/dddddddd-0001-0000-0000-000000000002/writing` |
| Writing — VSTEP T1 Letter | `http://localhost:3000/quiz/dddddddd-0001-0000-0000-000000000003/writing` |

### 0.3 Đăng nhập vào UI

1. Mở `http://localhost:3000`
2. Đăng nhập: `student@demo.com` / `Test@123`
3. Kiểm tra đã login thành công (thấy tên user ở header)

---

## 1. Test Speaking AI — Luồng UI đầy đủ

### 1.1 Vào trang Speaking Quiz

Điều hướng đến:
```
http://localhost:3000/quiz/dddddddd-0001-0000-0000-000000000001/speaking
```

**Màn hình mong đợi:**
- Trang load, hiện câu hỏi đầu tiên (nội dung về "daily routine")
- Nút **"Bắt đầu ghi âm"** (hoặc microphone icon) ở trung tâm
- Không có spinner hoặc lỗi trắng trang

> **Nếu thấy lỗi 401**: Token đã hết hạn → đăng nhập lại  
> **Nếu redirect về home**: Quiz chưa có trong DB → chạy seed (Bước 0.2)

---

### 1.2 Ghi âm

1. Click **"Bắt đầu ghi âm"**
2. Browser sẽ hỏi quyền microphone — click **Cho phép / Allow**
3. **Kiểm tra khi đang ghi:**
   - [ ] Nút chuyển sang **"Dừng ghi"** (màu đỏ hoặc có animation nhấp nháy)
   - [ ] Waveform/sóng âm hiện và rung động theo giọng nói
   - [ ] Bộ đếm thời gian chạy lên
4. Nói khoảng 10–20 giây (nội dung bất kỳ)
5. Click **"Dừng ghi"**
6. **Kiểm tra sau khi dừng:**
   - [ ] Waveform dừng
   - [ ] Hiện audio player để nghe lại bản ghi
   - [ ] Nút **"Nộp bài"** / **"Upload"** được enabled

---

### 1.3 Nộp bài và chờ kết quả

1. Click **"Nộp bài"**
2. **Kiểm tra trạng thái xử lý:**
   - [ ] Spinner hiện với text "Đang xử lý..." hoặc "Đang chấm bài..."
   - [ ] Nút Nộp bài bị disabled (tránh double submit)
3. Sau ~3–5 giây (mock AI worker):
   - [ ] **Tự động redirect** đến trang AI Result
   - URL sẽ là dạng: `/quiz/dddddddd-0001-0000-0000-000000000001/ai-result/{submissionId}`

---

### 1.4 Xem kết quả Speaking

**Kiểm tra nội dung trang AI Result:**

| Thành phần | Mong đợi |
|-----------|---------|
| Score hero (điểm lớn ở top) | Ví dụ: **7.1 / 10** |
| Card **Pronunciation** | Score 0–100 (ví dụ: 72.5) |
| Card **Fluency** | Score 0–100 |
| Card **Accuracy** | Score 0–100 |
| Transcript text | "Mock transcript of the recorded speech." |
| LLM Feedback | Đoạn văn markdown về cách cải thiện phát âm |
| Audio player | Nút "Nghe lại" play được audio vừa ghi |
| Nút "Làm lại" | Click → về trang speaking để ghi lại |

**Kiểm tra KHÔNG hiện** (speaking ≠ writing):
- [ ] Không có card Grammar
- [ ] Không có card Vocabulary
- [ ] Không có card Coherence
- [ ] Không có card Task Achievement

---

### 1.5 Xác minh SignalR qua DevTools

1. Mở DevTools (F12) → tab **Network**
2. Filter: `WS` (WebSocket)
3. Submit bài speaking → tìm kết nối tới `/hubs/quiz`
4. Click vào kết nối → tab **Messages**
5. **Kiểm tra nhận được 2 event:**
   - Event 1: `{"submissionId":"...","status":"Processing","type":"speaking"}`
   - Event 2: `{"submissionId":"...","status":"Done","type":"speaking","finalScore":71.5}`

---

## 2. Test Writing AI — Standard Essay

### 2.1 Vào trang Writing Quiz

Điều hướng đến:
```
http://localhost:3000/quiz/dddddddd-0001-0000-0000-000000000002/writing
```

**Màn hình mong đợi:**
- Hiện đề bài (về quan điểm social media)
- Textarea lớn để nhập bài
- Word count badge: **"0 / 150 từ"** màu **ĐỎ** (chưa đủ số từ tối thiểu)
- Nút **"Nộp bài"** bị disabled (màu xám)

---

### 2.2 Test word count badge — 3 trạng thái

**Trạng thái 1 — Quá ít từ (< 150):**
1. Gõ vào textarea: "Hello world this is a short test."
2. Kiểm tra ngay lập tức:
   - [ ] Badge hiện số từ đúng (ví dụ: "7 / 150 từ")
   - [ ] Badge màu **ĐỎ**
   - [ ] Nút "Nộp bài" vẫn **disabled**

**Trạng thái 2 — Đủ từ (≥ 150, ≤ 400):**
1. Paste đoạn văn sau vào textarea (≈ 170 từ):

```
Social media has become an integral part of modern life, connecting billions of people worldwide. Proponents argue that it enables real-time communication, spreads important information quickly, and gives ordinary people a platform to express their views. For example, social movements like climate activism have gained enormous momentum through platforms like Twitter and Instagram.

However, critics point out serious drawbacks. Social media has been linked to increased rates of anxiety and depression, particularly among teenagers. Moreover, misinformation spreads rapidly on these platforms, potentially influencing elections and public health decisions. The addictive design of social media apps also contributes to reduced productivity and attention spans.

In my opinion, social media is a powerful tool that depends entirely on how we choose to use it. When used mindfully, it can strengthen communities and amplify important voices. However, stricter regulation and better digital literacy education are needed to mitigate its negative effects. Ultimately, the responsibility lies with both individuals and platform developers to foster healthier online environments.
```

2. Kiểm tra:
   - [ ] Badge hiện ≥ 150 từ
   - [ ] Badge màu **XANH**
   - [ ] Nút "Nộp bài" **enabled** (có thể click)

**Trạng thái 3 — Quá nhiều từ (> 400):**
1. Copy thêm đoạn trên paste vào cuối bài (tổng > 400 từ)
2. Kiểm tra:
   - [ ] Badge màu **ĐỎ** (vượt giới hạn)
   - [ ] Nút "Nộp bài" **disabled** lại

---

### 2.3 Test auto-save draft

1. Gõ khoảng 50 từ vào textarea (không cần đủ để submit)
2. **Không submit** — đóng tab (Ctrl+W) hoặc navigate sang trang khác
3. Mở lại URL: `http://localhost:3000/quiz/dddddddd-0001-0000-0000-000000000002/writing`
4. Kiểm tra:
   - [ ] Text vừa gõ **hiện lại** trong textarea (restore từ sessionStorage)
   - [ ] Word count badge cập nhật đúng theo số từ đã gõ

---

### 2.4 Nộp bài Standard Essay

1. Đảm bảo có ≥ 150 từ trong textarea → nút "Nộp bài" enabled
2. Click **"Nộp bài"**
3. Kiểm tra:
   - [ ] Spinner "Đang chấm bài..." hiện
   - [ ] Sau ~3–5 giây: **redirect tự động** đến trang AI Result
   - [ ] URL có `?type=writing`: `.../ai-result/{submissionId}?type=writing`

---

### 2.5 Xem kết quả Writing

**Kiểm tra nội dung trang AI Result:**

| Thành phần | Mong đợi |
|-----------|---------|
| Score hero | Ví dụ: **7.4 / 10** |
| Card **Grammar** | Score 0–100 |
| Card **Vocabulary** | Score 0–100 |
| Card **Coherence** | Score 0–100 |
| Card **Task Achievement** | Score 0–100 |
| Word count | Hiện số từ đã viết |
| LLM Feedback | Đoạn văn markdown về cách cải thiện bài viết |
| Nút "Làm lại" | Click → về trang writing |

**Kiểm tra KHÔNG hiện** (writing ≠ speaking):
- [ ] Không có card Pronunciation
- [ ] Không có card Fluency
- [ ] Không có card Accuracy
- [ ] Không có audio player

---

## 3. Test Writing AI — VSTEP T1 Formal Letter

### 3.1 Vào trang VSTEP Letter

Điều hướng đến:
```
http://localhost:3000/quiz/dddddddd-0001-0000-0000-000000000003/writing
```

**Kiểm tra giao diện đặc biệt của VSTEP Letter:**
- [ ] **Gold/Yellow banner** hiện ở đầu editor: "Định dạng thư tiếng Anh" hoặc "Letter Format Guide"
  - Hiện cấu trúc gợi ý: Date → Salutation → Body paragraphs → Sign-off
- [ ] **Green banner** với danh sách 3 bullet points:
  - "Describe the problems with the laptop"
  - "Explain what actions you have taken so far"
  - "Say what you would like the manager to do"
- [ ] Word count **tối thiểu 120, tối đa 200 từ** (khác với Essay: 150–400)
- [ ] Badge đỏ khi < 120 từ, xanh khi 120–200 từ, đỏ khi > 200 từ

---

### 3.2 Nhập bài thư mẫu và nộp

Paste bài thư sau (~135 từ, nằm trong 120–200):

```
23 May 2026

Dear Manager,

I am writing to complain about a laptop I purchased from your store two weeks ago. Since I bought it, the laptop has had several serious problems that make it impossible to use for work.

First, the battery life is extremely poor — it lasts only one hour, despite the advertised eight hours. Second, the screen flickers constantly, which causes significant eye strain after just a few minutes of use. Third, several keys on the keyboard are stuck and do not respond when pressed.

I have called your customer service hotline twice but received no satisfactory response. I would therefore like a full refund or a replacement laptop within seven days.

I look forward to hearing from you soon.

Yours faithfully,
John Smith
```

1. Paste bài trên vào textarea
2. Kiểm tra badge → màu **XANH** (≥ 120 và ≤ 200 từ)
3. Click **"Nộp bài"** → spinner → redirect đến AI Result
4. Kiểm tra trang kết quả:
   - [ ] Hiện 4 score cards (Grammar, Vocabulary, Coherence, Task Achievement)
   - [ ] Final Score dùng công thức VSTEP Letter: `0.30×G + 0.30×V + 0.40×Task`

---

## 4. So sánh trang AI Result — Speaking vs Writing

Mở 2 tab song song:
- **Tab 1**: Kết quả Speaking (không có `?type=`)
- **Tab 2**: Kết quả Writing (có `?type=writing`)

| | Speaking result | Writing result |
|--|----------------|---------------|
| Card Pronunciation | ✅ Hiện | ❌ Ẩn |
| Card Fluency | ✅ Hiện | ❌ Ẩn |
| Card Accuracy | ✅ Hiện | ❌ Ẩn |
| Card Grammar | ❌ Ẩn | ✅ Hiện |
| Card Vocabulary | ❌ Ẩn | ✅ Hiện |
| Card Coherence | ❌ Ẩn | ✅ Hiện |
| Card Task Achievement | ❌ Ẩn | ✅ Hiện |
| Transcript text | ✅ Hiện | ❌ Ẩn |
| Audio player | ✅ Hiện | ❌ Ẩn |
| Word count | ❌ Ẩn | ✅ Hiện |
| LLM Feedback | ✅ Hiện | ✅ Hiện |

---

## 5. Kiểm tra các trạng thái loading (qua DB)

Dùng pgAdmin/DBeaver để test UI khi submission ở các trạng thái khác nhau.

**Test "Failed" state:**
```sql
UPDATE tenant_demo."WritingSubmissions"
SET "GradingStatus" = 'Failed'
WHERE "Id" = '{submissionId}';
```
→ Reload trang result: [ ] Hiện thông báo lỗi, không crash trắng trang

**Test "Pending" state:**
```sql
UPDATE tenant_demo."WritingSubmissions"
SET "GradingStatus" = 'Pending', "FinalScore" = NULL
WHERE "Id" = '{submissionId}';
```
→ Reload trang result: [ ] Hiện spinner/skeleton, không hiện score cards rỗng

**Restore về Done:**
```sql
UPDATE tenant_demo."WritingSubmissions"
SET "GradingStatus" = 'Done'
WHERE "Id" = '{submissionId}';
```

---

## 6. Checklist kiểm tra nhanh (Smoke Test ~10 phút)

```
[ ] 1.  Seed chạy thành công trong pgAdmin (không có ERROR)
[ ] 2.  Login http://localhost:3000 với student@demo.com / Test@123
[ ] 3.  Vào /quiz/dddddddd-0001-0000-0000-000000000001/speaking — trang load OK
[ ] 4.  Click "Bắt đầu ghi âm" → browser hỏi quyền mic → Cho phép
[ ] 5.  Ghi ~10 giây → Dừng ghi → thấy audio player preview
[ ] 6.  Click "Nộp bài" → spinner → sau 3-5s redirect tự động
[ ] 7.  Trang AI Result: thấy 3 cards Pronunciation / Fluency / Accuracy
[ ] 8.  Không thấy card Grammar/Vocabulary/Coherence trên trang speaking result
[ ] 9.  Vào /quiz/dddddddd-0001-0000-0000-000000000002/writing — trang load OK
[ ] 10. Word count badge màu ĐỎ (0 từ), nút Nộp bài disabled
[ ] 11. Paste 150+ từ → badge chuyển XANH → nút Nộp bài enabled
[ ] 12. Xóa đến còn < 150 từ → badge ĐỎ lại → nút disabled
[ ] 13. Paste lại 150+ từ → nộp bài → spinner → redirect có ?type=writing
[ ] 14. Trang AI Result: thấy 4 cards Grammar / Vocabulary / Coherence / Task
[ ] 15. Không thấy card Pronunciation/Fluency/Accuracy trên trang writing result
[ ] 16. Vào /quiz/dddddddd-0001-0000-0000-000000000003/writing
[ ] 17. Thấy gold banner letter format guide
[ ] 18. Thấy green banner với 3 bullet points
[ ] 19. Min 120 từ, max 200 từ (badge đỏ khi < 120, xanh 120-200, đỏ > 200)
[ ] 20. Paste bài thư mẫu (~135 từ) → badge XANH → nộp bài thành công
```

---

## 7. Troubleshooting

| Vấn đề | Nguyên nhân có thể | Cách xử lý |
|--------|------------------|-----------|
| Trang trắng khi vào `/speaking` | Quiz chưa tồn tại trong DB | Chạy seed lại (Bước 0.2) |
| Microphone không hoạt động | Browser chặn mic trên `http://` | Dùng Chrome → Settings → Site Settings → Mic → Allow localhost |
| Spinner không tắt sau submit | Backend worker chưa khởi động | Kiểm tra `dotnet run` đang chạy ở port 5009 |
| Không tự redirect sau submit | Frontend error | Mở DevTools → Console → xem lỗi JavaScript |
| AI Result page lỗi | submissionId không hợp lệ | Kiểm tra URL có submissionId đúng không |
| Badge màu không thay đổi | Hydration mismatch | Hard reload Ctrl+Shift+R |
| VSTEP banners không hiện | `WritingMinWords` chưa được set | Chạy lại phần UPDATE trong seed SQL qua pgAdmin |
| 401 Unauthorized | Token hết hạn | Đăng nhập lại tại http://localhost:3000 |

---

*Tài liệu tạo sau khi hoàn thành Sprint 6 (Speaking AI) và Sprint 7 (Writing AI).*  
*DB seed: `deploy/seed-phase3b-ai-quizzes.sql` · Migration: `deploy/sprint7-writing-migration.sql`*