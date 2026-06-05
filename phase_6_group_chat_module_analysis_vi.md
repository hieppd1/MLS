# PHÂN TÍCH NGHIỆP VỤ — MODULE NHÓM CHAT (MOON.VN STYLE)

---

# 1. TỔNG QUAN

## 1.1 Mục tiêu

Xây dựng module:

- Nhóm học tập realtime
- Chat nhóm realtime
- Chat hỗ trợ học viên
- Quản lý nhóm trong Admin/Teacher Portal

Thiết kế đơn giản theo mô hình Moon.vn:

- Dễ triển khai
- Dễ maintain
- Ít hạ tầng
- Chi phí thấp
- Phù hợp MVP/Production giai đoạn đầu

---

# 2. PHẠM VI MODULE

Module gồm 2 phần chính:

---

# 2.1 GROUP CHAT

Cho phép:

- Tạo nhóm học tập
- Join nhóm
- Chat realtime
- Gửi ảnh/file
- Quản lý thành viên nhóm

---

# 2.2 SUPPORT CHAT

Cho phép:

- Học viên chat với nhân viên tư vấn
- Nhân viên tư vấn phản hồi realtime

---

# 3. KIẾN TRÚC ĐỀ XUẤT

```text
Frontend (ReactJS / React Native)
        ↓
SignalR WebSocket
        ↓
.NET Chat API
        ↓
PostgreSQL
        ↓
MinIO / S3 Storage
```

---

# 4. PHÂN TÍCH NGHIỆP VỤ NHÓM CHAT

---

# 4.1 LOẠI NHÓM

## PUBLIC

- Người dùng có thể join trực tiếp

---

## PRIVATE

- Người dùng gửi yêu cầu join
- Teacher/Admin duyệt

---

# 4.2 QUY TẮC NGHIỆP VỤ

---

## Rule 1 — Giới hạn số nhóm

Một user chỉ được join tối đa:

```text
3 nhóm
```

Giá trị này có thể cấu hình trong Admin.

---

## Rule 2 — Giới hạn số thành viên nhóm

Ví dụ:

```text
12 thành viên / nhóm
```

Có thể cấu hình.

---

## Rule 3 — Join nhóm private

Flow:

```text
Student request join
↓
Teacher/Admin approve
↓
Student được tham gia chat
```

---

## Rule 4 — Chat realtime

Khi user gửi message:

```text
Message được broadcast realtime
↓
Tất cả thành viên online đều nhận được
```

---

## Rule 5 — Chỉ thành viên mới xem được chat

Người chưa join nhóm:

- Không xem message
- Không gửi message

---

# 5. USER FLOW

---

# 5.1 FLOW JOIN NHÓM

```text
Mở trang nhóm
↓
Chọn nhóm
↓
Join nhóm
↓
Nếu PUBLIC → vào luôn
Nếu PRIVATE → chờ duyệt
```

---

# 5.2 FLOW CHAT ROOM

```text
Mở room chat
↓
Load lịch sử chat
↓
Gửi text/image/file
↓
SignalR broadcast
↓
Các thành viên khác nhận realtime
```

---

# 5.3 FLOW CHAT HỖ TRỢ

```text
Student click icon hỗ trợ
↓
Tạo conversation
↓
Nhân viên tư vấn reply
```

---

# 6. DATABASE DESIGN

---

# 6.1 BẢNG ChatGroup

| Field | Type | Description |
|---|---|---|
| id | uuid | ID nhóm |
| name | varchar(255) | Tên nhóm |
| description | text | Mô tả |
| avatarUrl | varchar(500) | Avatar nhóm |
| type | varchar(20) | PUBLIC / PRIVATE |
| maxMembers | int | Số member tối đa |
| currentMembers | int | Số member hiện tại |
| isActive | boolean | Trạng thái hoạt động |
| createdBy | uuid | Người tạo |
| createdAt | timestamptz | Ngày tạo |
| updatedAt | timestamptz | Ngày cập nhật |

---

# 6.2 BẢNG ChatGroupMember

| Field | Type | Description |
|---|---|---|
| id | uuid | ID |
| groupId | uuid | Nhóm |
| userId | uuid | Thành viên |
| role | varchar(20) | OWNER / MODERATOR / MEMBER |
| status | varchar(20) | PENDING / APPROVED / REJECTED |
| joinedAt | timestamptz | Thời gian join |
| approvedBy | uuid | Người duyệt |
| approvedAt | timestamptz | Ngày duyệt |

---

# 6.3 BẢNG ChatMessage

| Field | Type | Description |
|---|---|---|
| id | uuid | ID |
| groupId | uuid | Nhóm chat |
| senderId | uuid | Người gửi |
| type | varchar(20) | TEXT / IMAGE / FILE |
| message | text | Nội dung |
| fileUrl | varchar(500) | File upload |
| fileName | varchar(255) | Tên file |
| replyToId | uuid | Reply message |
| createdAt | timestamptz | Ngày gửi |

---

# 6.4 BẢNG SupportConversation

| Field | Type | Description |
|---|---|---|
| id | uuid | ID |
| studentId | uuid | Học viên |
| supportUserId | uuid | Nhân viên tư vấn |
| status | varchar(20) | OPEN / CLOSED |
| createdAt | timestamptz | Ngày tạo |

---

# 6.5 BẢNG SupportMessage

| Field | Type | Description |
|---|---|---|
| id | uuid | ID |
| conversationId | uuid | Hội thoại |
| senderId | uuid | Người gửi |
| type | varchar(20) | TEXT / IMAGE / FILE |
| message | text | Nội dung |
| fileUrl | varchar(500) | File |
| createdAt | timestamptz | Ngày gửi |

---

# 7. SIGNALR DESIGN

---

# 7.1 HUBS

## GroupChatHub

Xử lý:

- Chat nhóm
- Join room
- Leave room
- Broadcast message

---

## SupportChatHub

Xử lý:

- Chat support
- Typing
- Notification

---

# 7.2 EVENTS

## GroupChat Events

| Event |
|---|
| message.send |
| message.receive |
| member.join |
| member.leave |

---

## SupportChat Events

| Event |
|---|
| support.message |
| support.typing |

---

# 8. API DESIGN

---

# 8.1 GROUP APIs

---

## Lấy danh sách nhóm

```http
GET /api/chat/groups
```

---

## Lấy chi tiết nhóm

```http
GET /api/chat/groups/{id}
```

---

## Tạo nhóm

```http
POST /api/chat/groups
```

---

## Cập nhật nhóm

```http
PUT /api/chat/groups/{id}
```

---

## Xóa nhóm

```http
DELETE /api/chat/groups/{id}
```

---

## Join nhóm

```http
POST /api/chat/groups/{id}/join
```

---

## Duyệt thành viên

```http
POST /api/chat/groups/{id}/approve
```

---

## Remove thành viên

```http
POST /api/chat/groups/{id}/remove-member
```

---

## Rời nhóm

```http
POST /api/chat/groups/{id}/leave
```

---

## Load messages

```http
GET /api/chat/groups/{id}/messages
```

---

## Upload file

```http
POST /api/chat/upload
```

---

# 8.2 SUPPORT APIs

---

## Tạo conversation

```http
POST /api/support/conversations
```

---

## Load messages

```http
GET /api/support/conversations/{id}/messages
```

---

## Gửi message support

```http
POST /api/support/messages
```

---

# 9. ADMIN / TEACHER PORTAL

---

# 9.1 QUẢN LÝ NHÓM

Teacher/Admin có thể:

- Tạo nhóm
- Sửa nhóm
- Xóa nhóm
- Khóa nhóm
- Upload avatar
- Quản lý thành viên

---

# 9.2 DANH SÁCH THÀNH VIÊN

Hiển thị:

| Field |
|---|
| Avatar |
| Tên |
| Email |
| Vai trò |
| Trạng thái |
| Ngày tham gia |

---

# 9.3 ACTIONS

| Action |
|---|
| Approve |
| Reject |
| Remove |
| Promote moderator |

---

# 9.4 CẤU HÌNH CHAT

Admin có thể cấu hình:

| Config |
|---|
| Max group per user |
| Max member per group |
| Allow upload image |
| Allow upload file |
| Max file size |

---

# 10. USER INTERFACE

---

# 10.1 PAGE NHÓM

Layout:

---

## LEFT SIDEBAR

Hiển thị:

- Danh sách nhóm
- Search nhóm
- Unread count

---

## CENTER CONTENT

Hiển thị:

- Nội dung nhóm
- Bài post
- Hoạt động nhóm

---

## RIGHT SIDEBAR

Hiển thị:

- Khám phá nhóm
- Join button

---

# 10.2 CHAT ROOM UI

Thiết kế giống Moon.vn.

Bao gồm:

| Feature |
|---|
| Chat realtime |
| Reply message |
| Gửi ảnh |
| Gửi file |
| Auto scroll |
| Unread badge |

---

# 10.3 SUPPORT CHAT UI

Hiển thị icon support góc phải.

Cho phép:

- Tạo hội thoại
- Chat realtime
- Upload ảnh/file

---

# 11. FILE STORAGE

---

# 11.1 FILE TYPES

Cho phép upload:

| Type |
|---|
| image |
| pdf |
| doc/docx |
| zip |

---

# 11.2 STORAGE

Đề xuất:

## MinIO

Cho môi trường VPS.

---

## AWS S3

Cho production scale lớn.

---

# 12. PHÂN QUYỀN

---

# 12.1 STUDENT

| Permission |
|---|
| Join nhóm |
| Leave nhóm |
| Gửi message |
| Upload file |

---

# 12.2 TEACHER

| Permission |
|---|
| Tạo nhóm |
| Duyệt member |
| Remove member |
| Delete message |

---

# 12.3 ADMIN

Full quyền hệ thống.

---

# 13. NON-FUNCTIONAL REQUIREMENTS

---

# 13.1 PERFORMANCE

- Realtime latency < 1s
- Load 100 messages < 2s

---

# 13.2 SECURITY

- JWT Authentication
- Validate file upload
- Chỉ member được chat

---

# 13.3 FILE LIMIT

| Config | Value |
|---|---|
| Max image size | 5MB |
| Max file size | 20MB |

---

# 14. KHÔNG TRIỂN KHAI GIAI ĐOẠN NÀY

Để tránh over-engineering.

---

# KHÔNG BAO GỒM

- AI matching
- AI assistant
- Voice room
- Livestream
- Kafka
- RabbitMQ
- Elasticsearch
- Distributed websocket
- Multi-tenant
- Recommendation engine

---

# 15. KIẾN TRÚC CUỐI CÙNG

```text
Frontend (ReactJS / React Native)
        ↓
SignalR
        ↓
.NET Chat Service
        ↓
PostgreSQL
        ↓
MinIO / S3
```

---

# 16. KẾT LUẬN

Module này đáp ứng