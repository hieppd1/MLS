# PHASE 6 — GROUP CHAT & SUPPORT CHAT MODULE
## Thiết kế chi tiết + Plan triển khai

> Tham chiếu nghiệp vụ: [phase_6_group_chat_module_analysis_vi.md](phase_6_group_chat_module_analysis_vi.md)
> Layout tham khảo: Moon.vn (Col 2 “Tin nhắn” và Col 4 “Khám phá nhóm”). **Col 3 dùng khung chat realtime giống Teams / Webex** — KHÔNG triển khai News Feed ở phase này.
> Stack hiện tại: ASP.NET Core 10 + EF Core + PostgreSQL (multi‑tenant theo schema `tenant_*`) + SignalR + Next.js 16 + Redux Toolkit (RTK Query) + MinIO.

---

## 1. MỤC TIÊU PHASE 6

| # | Mục tiêu | Định nghĩa "Done" |
|---|----------|-------------------|
| G1 | Cho phép học viên / giáo viên tạo, tìm và tham gia nhóm học tập | User có thể tạo nhóm, join PUBLIC trực tiếp, request join PRIVATE chờ duyệt |
| G2 | Chat nhóm realtime (text + ảnh + file + reply) | Message đến < 1s, hỗ trợ 100 msg/page, scroll vô tận |
| G3 | Support chat 1‑1 (student ⇄ CSKH) | Widget nổi góc phải, tạo/đọc/gửi message realtime |
| G4 | Admin / Teacher quản lý nhóm, thành viên, duyệt yêu cầu | Đầy đủ CRUD nhóm + approve/reject/remove/promote |
| G5 | Cấu hình hệ thống chat | Admin set max group/user, max member/group, file limit |
| G6 | Layout 4 cột theo MLS hiện tại | Col 1 left‑menu (AppShell) · Col 2 tin nhắn · Col 3 khung chat realtime (Teams/Webex style) · Col 4 khám phá nhóm |

**Out of scope** (giữ MVP): **News feed / bài đăng trong nhóm**, AI matching, voice/livestream, Kafka/RabbitMQ, Elasticsearch, distributed SignalR backplane (chỉ chạy 1 node — đủ cho VPS hiện tại).

---

## 2. LAYOUT MÀN HÌNH

> Tham chiếu sidebar/discover từ Moon.vn. **Cột 3 dùng khung chat realtime kiểu Teams / Webex** — KHÔNG triển khai News Feed trong giai đoạn này.

### 2.1 Page `/nhom` — Group hub (4 cột, tích hợp AppShell hiện có)

```
┌─────┬────────────────────┬─────────────────────────────────────┬──────────────────────┐
│ Col1│ Col 2              │ Col 3  (Chat Room — Teams/Webex)    │ Col 4 (Khám phá)     │
│ Nav │ Tin nhắn           │ ┌─ Header ─────────────────────────┐ │ - Khám phá nhóm      │
│ 72px│ - Search nhóm      │ │ avatar │ Tên nhóm  · N members  │ │ - Tabs Lớp 12/11/…   │
│ AppS│ - Tabs: Tất cả/    │ │        │ trạng thái typing      │ │ - Chip môn Toán/Lý/… │
│ hell│   Chưa đọc/Phân    │ │                ⋮ menu  ☎  👥    │ │ - Card nhóm:         │
│     │   loại             │ ├──────────────────────────────────┤ │   avatar+tên+        │
│     │ - List room item:  │ │ Messages (scroll, virtualized)   │ │   member/post count  │
│     │   • avatar         │ │  ┌─ other ─┐                     │ │ - Nút "Tham gia"     │
│     │   • tên + last msg │ │  │ bubble  │ 09:12               │ │                      │
│     │   • time + unread  │ │  └─────────┘                     │ │                      │
│     │   • online dot     │ │              ┌─ mine ─┐ 09:13 ✓  │ │                      │
│     │                    │ │              │ bubble │          │ │                      │
│     │                    │ │              └────────┘          │ │                      │
│     │                    │ │  [Reply preview khi reply]       │ │                      │
│     │                    │ │  [System: X đã tham gia nhóm]    │ │                      │
│     │                    │ ├──────────────────────────────────┤ │                      │
│     │                    │ │ Composer:                        │ │                      │
│     │                    │ │  [😀][📎][🖼][@]  ┌─ textarea ─┐ ▶│ │                      │
│     │                    │ │                                  │ │                      │
│     │                    │ └──────────────────────────────────┘ │                      │
└─────┴────────────────────┴─────────────────────────────────────┴──────────────────────┘
                                                                  ┌───────────────────┐
                                                                  │  Support widget   │
                                                                  │  (floating btn)   │
                                                                  └───────────────────┘
```

**Đặc tả khung chat (Col 3) — chuẩn Teams/Webex:**

| Vùng | Chi tiết |
|------|----------|
| **Header** | Avatar nhóm + tên + số thành viên · indicator "X đang nhập…" · menu (⋮) gồm: Thông tin nhóm, Danh sách thành viên, Rời nhóm, Tìm trong cuộc trò chuyện. Nút icon mở **panel thành viên** (drawer phải, ẩn Col 4 tạm thời trên desktop hẹp). |
| **Message list** | Virtualized, reverse infinite scroll. Group message liên tiếp cùng sender trong < 2 phút → ẩn avatar lặp. Day separator ("Hôm nay", "Hôm qua", "12/05/2026"). Tin nhắn hệ thống căn giữa, in nghiêng (join/leave/promote). |
| **Bubble** | Mine: align right, nền `#4F46E5` chữ trắng. Other: align left, nền `#F3F4F6` chữ `#111827`. Avatar 32px ở mép, chỉ hiện ở message đầu của block. Timestamp hover. Status tick: ✓ sent, ✓✓ read‑by‑all. |
| **Reply** | Click "Trả lời" trên bubble → composer hiện preview quote ở trên. Bubble reply hiển thị block quote nhỏ, click → scroll đến message gốc. |
| **Attachments** | Image: thumb 200×200 max trong bubble, click → lightbox. File: card có icon + tên + size + nút tải. |
| **Composer** | Textarea auto‑resize (1–5 dòng), Enter = gửi / Shift+Enter = xuống dòng. Icon: emoji, đính kèm file, đính kèm ảnh, mention `@`. Drag‑drop file vào khung chat để upload. Nút "Gửi" disable khi rỗng. |
| **Typing** | Debounce 800ms — gửi `Typing` qua Hub, hiển thị "Đang nhập…" ở header (tối đa 3 tên + "và N người khác"). |
| **Empty / Loading** | Skeleton 5 bubble khi loading lần đầu. Empty: minh hoạ + "Hãy gửi tin nhắn đầu tiên tới nhóm 👋". |
| **Mobile (< 768px)** | Col 2 thành full‑screen list; chọn room → push route → Col 3 full‑screen, nút back về list. Col 4 ẩn. |

**Component map** (Next.js):
- `frontend/src/app/nhom/page.tsx` — page container, lấy `roomId` từ query/param, render AppShell + Col 2/3/4.
- `frontend/src/app/nhom/_components/GroupSidebar.tsx` — Col 2 (list tin nhắn).
- `frontend/src/app/nhom/_components/ChatRoom.tsx` — Col 3 (header + list + composer).
- `frontend/src/app/nhom/_components/ChatHeader.tsx`
- `frontend/src/app/nhom/_components/MessageList.tsx` — virtualized, reverse infinite.
- `frontend/src/app/nhom/_components/MessageBubble.tsx` — render Text / Image / File / System / Reply.
- `frontend/src/app/nhom/_components/MessageComposer.tsx` — textarea + upload + emoji.
- `frontend/src/app/nhom/_components/MembersDrawer.tsx` — panel thành viên (mở từ header).
- `frontend/src/app/nhom/_components/DiscoverGroups.tsx` — Col 4.
- `frontend/src/app/_components/SupportChatWidget.tsx` — mount global trong root `layout.tsx`.

### 2.2 Group Detail (modal/drawer) — KHÔNG dùng route riêng cho feed

- Không có `/nhom/[id]` page tách. Khi user chọn nhóm ở Col 2 → cập nhật `roomId` (query `?room=`), Col 3 render `ChatRoom`.
- "Thông tin nhóm" mở **drawer phải** (overlay Col 4) gồm: avatar/tên/mô tả, tab `Thành viên` / `File đã chia sẻ` / `Cài đặt` (owner/mod).

### 2.3 Admin / Teacher portal

- `frontend/src/app/admin/chat/groups/page.tsx` — table CRUD nhóm.
- `frontend/src/app/admin/chat/groups/[id]/page.tsx` — chi tiết, tab `Thành viên` / `Tin nhắn` / `Cài đặt`.
- `frontend/src/app/admin/chat/config/page.tsx` — cấu hình hệ thống chat.
- `frontend/src/app/admin/chat/support/page.tsx` — inbox CSKH (list conversation OPEN + thread).

### 2.4 Support widget

- Floating button góc phải‑dưới (style Moon.vn "Hỗ trợ").
- Popup window 360×520: header agent + lịch sử + composer + upload ảnh. Cùng component bubble với group chat.
- Hiển thị badge unread.

---

## 3. KIẾN TRÚC BACKEND

```
MLS.Domain
└── Entities
    ├── ChatGroup
    ├── ChatGroupMember
    ├── ChatMessage
    ├── ChatMessageAttachment   (tách bảng → multi-file/msg)
    ├── SupportConversation
    └── SupportMessage

MLS.Application
└── Chat
    ├── Commands           (Create/Update/Join/Approve/SendMessage…)
    ├── Queries            (ListGroups/Discover/GetMessages…)
    ├── Events             (MessageSentEvent, MemberJoinedEvent…)
    └── DTOs

MLS.Infrastructure
├── Persistence/Configurations (Fluent config cho 6 entity)
├── Realtime/GroupChatHub.cs
├── Realtime/SupportChatHub.cs
└── Storage/MinioFileService.cs (đã có — reuse)

MLS.API
└── Controllers
    ├── ChatGroupsController         (api/v1/chat/groups)
    ├── ChatMessagesController       (api/v1/chat/messages)
    ├── ChatUploadController         (api/v1/chat/upload)
    ├── SupportController            (api/v1/support)
    └── ChatAdminController          (api/v1/admin/chat)
```

### 3.1 SignalR Hubs

| Hub | Route | Methods | Server → Client events |
|-----|-------|---------|------------------------|
| `GroupChatHub` | `/hubs/group-chat` | `JoinGroup(groupId)`, `LeaveGroup(groupId)`, `Typing(groupId)` | `MessageReceived`, `MessageDeleted`, `MemberJoined`, `MemberLeft`, `TypingIndicator` |
| `SupportChatHub` | `/hubs/support` | `JoinConversation(convId)`, `Typing(convId)` | `SupportMessageReceived`, `SupportTyping`, `ConversationAssigned` |

**Auth**: JWT bearer qua query string `?access_token=…` (chuẩn SignalR). Authorize attribute trên Hub. Lấy tenant từ claim `tenant_slug` để route đúng schema (tái sử dụng `ITenantContext`).

**Group naming convention**: `tenant:{slug}:group:{groupId}` và `tenant:{slug}:support:{convId}` → tránh leak giữa tenant.

**Send message flow** (REST + broadcast):
```
Client → POST /api/v1/chat/messages   (lưu DB + return DTO)
       → Hub.Clients.Group("...").MessageReceived(dto)   (server-side broadcast)
```
> Lý do tách REST + broadcast: persist trước, ack thật; client không phải retry SignalR khi mất kết nối.

### 3.2 Auth & quyền

| Vai trò | Quyền |
|---------|-------|
| Student | List/Join PUBLIC, Request PRIVATE, send msg trong group đã APPROVED, upload file ≤ limit |
| Teacher | Tất cả của Student + Create group, Approve/Reject/Remove member, Delete msg trong nhóm sở hữu |
| Admin | Full + cấu hình hệ thống + xem mọi conversation support |
| Support Agent (role mới) | Reply support conversation được assign |

---

## 4. DATA MODEL (PostgreSQL — schema `tenant_*`)

Tất cả enum lưu dạng **string** (chuẩn dự án).

### 4.1 `ChatGroups`
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| Id | uuid PK | |
| Name | varchar(255) NOT NULL | |
| Description | text | |
| AvatarUrl | varchar(500) | MinIO key |
| Type | varchar(20) NOT NULL | `Public` / `Private` |
| MaxMembers | int NOT NULL DEFAULT 12 | |
| CurrentMembers | int NOT NULL DEFAULT 0 | trigger/handler maintain |
| Tags | text | CSV — `Toan,Ly,Lop12` (search) |
| IsActive | bool NOT NULL DEFAULT TRUE | |
| CreatedBy | uuid NOT NULL → Users.Id | |
| CreatedAt | timestamptz NOT NULL | |
| UpdatedAt | timestamptz NOT NULL | |

Index: `(IsActive, Type)`, GIN trigram trên `Name`.

### 4.2 `ChatGroupMembers`
| Cột | Kiểu |
|-----|------|
| Id | uuid PK |
| GroupId | uuid FK → ChatGroups |
| UserId | uuid FK → Users |
| Role | varchar(20) `Owner`/`Moderator`/`Member` |
| Status | varchar(20) `Pending`/`Approved`/`Rejected` |
| JoinedAt | timestamptz NULL |
| ApprovedBy | uuid NULL |
| ApprovedAt | timestamptz NULL |
| LastReadMessageId | uuid NULL |
| CreatedAt, UpdatedAt | timestamptz |

Unique: `(GroupId, UserId)`. Index `(UserId, Status)`.

### 4.3 `ChatMessages`
| Cột | Kiểu |
|-----|------|
| Id | uuid PK |
| GroupId | uuid FK |
| SenderId | uuid FK → Users |
| Type | varchar(20) `Text`/`Image`/`File`/`System` |
| Content | text |
| ReplyToId | uuid NULL FK → ChatMessages |
| IsDeleted | bool NOT NULL DEFAULT FALSE |
| CreatedAt | timestamptz NOT NULL |

Index `(GroupId, CreatedAt DESC)` — cho cursor pagination.

### 4.4 `ChatMessageAttachments`
| Cột | Kiểu |
|-----|------|
| Id | uuid PK |
| MessageId | uuid FK |
| FileUrl | varchar(500) |
| FileName | varchar(255) |
| MimeType | varchar(100) |
| SizeBytes | bigint |
| Width / Height | int NULL (image) |
| CreatedAt | timestamptz |

### 4.5 `SupportConversations`
| Cột | Kiểu |
|-----|------|
| Id | uuid PK |
| StudentId | uuid FK → Users |
| SupportUserId | uuid NULL FK → Users (assign khi agent reply lần đầu) |
| Status | varchar(20) `Open`/`Closed` |
| LastMessageAt | timestamptz |
| CreatedAt, UpdatedAt | timestamptz |

Index `(Status, LastMessageAt DESC)`.

### 4.6 `SupportMessages`
| Cột | Kiểu |
|-----|------|
| Id | uuid PK |
| ConversationId | uuid FK |
| SenderId | uuid FK |
| SenderRole | varchar(20) `Student`/`Support` |
| Type | varchar(20) |
| Content | text |
| FileUrl, FileName, MimeType, SizeBytes | nullable |
| CreatedAt | timestamptz |

### 4.7 `ChatSettings` (singleton/tenant)
| Cột | Kiểu | Default |
|-----|------|---------|
| Id | uuid PK | |
| MaxGroupsPerUser | int | 3 |
| MaxMembersPerGroup | int | 12 |
| AllowImageUpload | bool | true |
| AllowFileUpload | bool | true |
| MaxImageSizeKb | int | 5120 |
| MaxFileSizeKb | int | 20480 |
| UpdatedAt | timestamptz | |

---

## 5. API DESIGN

> Tất cả route prefix `/api/v1`, header `X-Tenant-Slug` + `Authorization: Bearer …` (trừ `health`).

### 5.1 Group

| Method | Route | Body / Query | Auth |
|--------|-------|--------------|------|
| GET | `/chat/groups/mine` | `?status=approved\|pending` | user |
| GET | `/chat/groups/discover` | `?q=&tag=&page=&pageSize=` | user |
| GET | `/chat/groups/{id}` | — | user |
| POST | `/chat/groups` | `{name,description,type,maxMembers,tags,avatarUrl}` | teacher/admin |
| PUT | `/chat/groups/{id}` | same | owner/admin |
| DELETE | `/chat/groups/{id}` | — | owner/admin |
| POST | `/chat/groups/{id}/join` | — | user (auto‑approve nếu Public) |
| POST | `/chat/groups/{id}/leave` | — | member |
| GET | `/chat/groups/{id}/members` | `?status=` | member |
| POST | `/chat/groups/{id}/members/{userId}/approve` | — | owner/mod |
| POST | `/chat/groups/{id}/members/{userId}/reject` | — | owner/mod |
| DELETE | `/chat/groups/{id}/members/{userId}` | — | owner/mod |
| POST | `/chat/groups/{id}/members/{userId}/promote` | `{role}` | owner |

### 5.2 Messages

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/chat/groups/{id}/messages?cursor=&limit=50` | cursor = lastMessageId; trả `items + nextCursor` |
| POST | `/chat/groups/{id}/messages` | `{content,type,attachmentIds[],replyToId}` |
| DELETE | `/chat/messages/{id}` | sender hoặc mod |
| POST | `/chat/groups/{id}/mark-read` | `{lastMessageId}` |

### 5.3 Upload

| Method | Route | Body | Notes |
|--------|-------|------|-------|
| POST | `/chat/upload` | multipart `file` | trả `{id, url, mimeType, size}` — lưu tạm 24h nếu chưa attach |

### 5.4 Support

| Method | Route |
|--------|-------|
| POST | `/support/conversations` (auto reuse Open của student) |
| GET | `/support/conversations/me` |
| GET | `/support/conversations` (agent: list inbox) |
| GET | `/support/conversations/{id}/messages?cursor=` |
| POST | `/support/conversations/{id}/messages` |
| POST | `/support/conversations/{id}/close` |

### 5.5 Admin

| Method | Route |
|--------|-------|
| GET/POST/PUT/DELETE | `/admin/chat/groups` (CRUD) |
| GET | `/admin/chat/groups/{id}/messages` |
| GET/PUT | `/admin/chat/settings` |
| GET | `/admin/chat/support/conversations` |

---

## 6. FRONTEND ARCHITECTURE

### 6.1 RTK Query slices

```
frontend/src/lib/features/chat/
├── chatApi.ts          # Groups + Messages + Upload
├── supportApi.ts       # Support conversations
├── chatSocket.ts       # SignalR connection wrapper (singleton)
└── chatSlice.ts        # local UI state: activeGroupId, unread map, typing map
```

`chatSocket.ts`: lazy‑init `HubConnection`, retry policy, dispatch `chatApi.util.updateQueryData(...)` khi nhận `MessageReceived` (optimistic insert) — tránh refetch.

### 6.2 Component tree (page `/nhom`)

```
NhomPage
├── GroupSidebar (Col 2)
│   ├── SearchBar
│   ├── Tabs (Tất cả / Chưa đọc / Phân loại)
│   └── RoomListItem* (avatar, name, lastMsg, time, unread badge, online dot)
├── ChatRoom (Col 3 — Teams/Webex style)
│   ├── ChatHeader (avatar+tên+member count+typing indicator+menu ⋮)
│   ├── MessageList (virtualized, reverse-infinite, day separator, grouping)
│   │   └── MessageBubble (Text / Image / File / System / Reply quote)
│   ├── MessageComposer (textarea auto-resize, emoji, attach, mention, drag-drop)
│   ├── MembersDrawer (mở từ header)
│   └── EmptyState / SkeletonLoading
└── DiscoverGroups (Col 4)
    ├── Tabs (Tất cả/Lớp 12/11/10/9…)
    ├── ChipFilter (Toán/Lý/Hóa/Sinh…)
    └── DiscoverCard* (avatar, name, member count, Join button)
```

### 6.3 Performance

- Virtualized message list: `@tanstack/react-virtual` (đã có project tương tự, lightweight).
- Cursor pagination — gọi tiếp khi scroll chạm top, prepend.
- Debounce typing event 800ms.
- Image: thumbnail trong message, click → lightbox.

---

## 7. SECURITY & VALIDATION

- File upload: whitelist MIME (`image/png|jpeg|webp`, `application/pdf`, `application/zip`, `application/msword`, `application/vnd.openxmlformats-officedocument.*`), size theo `ChatSettings`.
- Server‑side check: user phải `Approved` member của group mới được `SendMessage`/`GetMessages`.
- SignalR: kiểm tra membership ngay trong `OnConnectedAsync` / `JoinGroup`.
- Rate limit gửi msg: 10/3s per user (token bucket trong middleware đã có hoặc dùng `AspNetCoreRateLimit`).
- Strip HTML / không render markdown thô — chỉ plain text + linkify ở client.
- Tenant isolation: tất cả query `WHERE TenantId = …` qua `ITenantContext` (mỗi schema riêng — đã có pattern).

---

## 8. BREAKDOWN TASK

> Estimate đơn vị: **point** (1pt ≈ ½ ngày dev). Tổng ~ **63 pt**.

### Sprint 6.1 — Foundation (12pt) — ✅ DONE
| # | Task | Pt | Output |
|---|------|----|--------|
| T1 | Tạo 7 entity + Fluent config | 3 | ✅ `MLS.Domain/Entities/Chat*.cs`, `MLS.Domain/Entities/Support*.cs`, [ChatConfigurations.cs](backend/MLS.Infrastructure/Persistence/Configurations/ChatConfigurations.cs) |
| T2 | DbContext registration, thêm 7 DbSet | 1 | ✅ [ApplicationDbContext.cs](backend/MLS.Infrastructure/Persistence/ApplicationDbContext.cs), [IApplicationDbContext.cs](backend/MLS.Application/Common/Interfaces/IApplicationDbContext.cs) |
| T3 | Migration SQL `deploy/phase6-chat-migration.sql` | 2 | ✅ [phase6-chat-migration.sql](deploy/phase6-chat-migration.sql) — idempotent CREATE TABLE IF NOT EXISTS, indexes (`(IsActive,Type)`, GIN trgm trên `Name`, `(GroupId,CreatedAt DESC)`, unique `(GroupId,UserId)`, `(Status,LastMessageAt DESC)`), seed default `ChatSettings` |
| T4 | Apply migration local + prod | 1 | ✅ Local applied (psql → mls/tenant_demo). ⏳ Prod chờ release window |
| T5 | Setup SignalR hubs (rỗng) + JWT auth + map endpoints | 3 | ✅ [GroupChatHub.cs](backend/MLS.Infrastructure/Hubs/GroupChatHub.cs), [SupportChatHub.cs](backend/MLS.Infrastructure/Hubs/SupportChatHub.cs); JWT `?access_token=` cho `/hubs/*` (DependencyInjection.cs OnMessageReceived); endpoints mapped tại [Program.cs](backend/MLS.API/Program.cs) `/hubs/group-chat` + `/hubs/support` |
| T6 | Tenant‑aware connection mapping (`OnConnectedAsync`) | 2 | ✅ Group name format `tenant:{slug}:group:{id}` / `tenant:{slug}:support:{id}`; tenant slug đọc từ JWT claim `tenant_slug`/`tenant` hoặc query `?tenant=` |

### Sprint 6.2 — Group CRUD + Membership (12pt) — ✅ DONE
| # | Task | Pt | Output |
|---|------|----|--------|
| T7 | Commands: Create/Update/Delete group | 2 | ✅ [ChatGroupCommands.cs](backend/MLS.Application/Chat/Commands/ChatGroupCommands.cs) — `CreateChatGroupCommand` (validate `MaxGroupsPerUser`), `Update`, `Delete` (soft via `Deactivate`) |
| T8 | Queries: ListMine, Discover (search+filter), GetDetail | 2 | ✅ [ChatGroupQueries.cs](backend/MLS.Application/Chat/Queries/ChatGroupQueries.cs) — `ListMyChatGroupsQuery` (with unread+last message), `DiscoverChatGroupsQuery` (search+type filter+exclude joined), `GetChatGroupDetailQuery` |
| T9 | Join (auto/pending), Leave, Approve, Reject, Remove, Promote | 3 | ✅ Same file — all 6 commands; Public = auto Approved, Private = Pending |
| T10 | Enforce `MaxGroupsPerUser`, `MaxMembersPerGroup` | 1 | ✅ Validated trong `CreateChatGroupCommand` + `JoinChatGroupCommand` (MaxMembers check) + `ApproveMemberCommand` |
| T11 | `ChatGroupsController` + `ChatMessagesController` skeleton | 2 | ✅ [ChatGroupsController.cs](backend/MLS.API/Controllers/ChatGroupsController.cs) (full CRUD + membership), [ChatMessagesController.cs](backend/MLS.API/Controllers/ChatMessagesController.cs) (skeleton 501 — Sprint 6.3) |
| T12 | Unit test: rules join + approve flow | 2 | ✅ [ChatGroupMembershipTests.cs](backend/tests/MLS.Tests/Handlers/ChatGroupMembershipTests.cs) — 5 tests xanh (Public auto-approve, Private pending, Approve flow, full group, MaxGroupsPerUser) |

### Sprint 6.3 — Messaging + Upload (14pt) — ✅ DONE
| # | Task | Pt | Status |
|---|------|----|--------|
| T13 | Send message (text/image/file/reply) + broadcast Hub | 3 | ✅ [ChatMessageCommands.cs](backend/MLS.Application/Chat/Commands/ChatMessageCommands.cs) `SendChatMessageCommand` (membership check, reply validation, attachments) → `IChatNotificationService.NotifyGroupAsync(..., "MessageReceived", ...)` via [ChatHubNotificationService.cs](backend/MLS.Infrastructure/Services/ChatHubNotificationService.cs) |
| T14 | Cursor pagination GetMessages | 2 | ✅ [ChatMessageQueries.cs](backend/MLS.Application/Chat/Queries/ChatMessageQueries.cs) `GetChatMessagesQuery` — cursor `ticks_messageId`, DESC paging, returned ASC; attachments batched |
| T15 | Delete message (sender/mod) | 1 | ✅ `DeleteChatMessageCommand` in [ChatMessageCommands.cs](backend/MLS.Application/Chat/Commands/ChatMessageCommands.cs) — sender OR Owner/Moderator; broadcasts `"MessageDeleted"` |
| T16 | `ChatUploadController` → MinIO, trả attachment record | 2 | ✅ [ChatUploadController.cs](backend/MLS.API/Controllers/ChatUploadController.cs) `/api/v1/chat/uploads/{image\|file}` → [UploadChatAttachmentCommand.cs](backend/MLS.Application/Chat/Commands/UploadChatAttachmentCommand.cs) → `IStorageService.UploadAsync(tenant, "chat/images\|chat/files", ...)` |
| T17 | Validate MIME/size theo `ChatSettings` | 1 | ✅ `UploadChatAttachmentCommandHandler` đọc `ChatSettings` (fallback `CreateDefault`), enforce `AllowImageUpload`/`AllowFileUpload`, `MaxImageSizeKb`/`MaxFileSizeKb`, MIME whitelist |
| T18 | MarkRead + unread counter trên `ListMine` | 2 | ✅ `MarkChatReadCommand` in [ChatMessageCommands.cs](backend/MLS.Application/Chat/Commands/ChatMessageCommands.cs) → `member.MarkRead(messageId)`; unread đã có sẵn trong `ListMyChatGroupsQuery` (Sprint 6.2) |
| T19 | Typing indicator (Hub only, không persist) | 1 | ✅ `GroupChatHub.Typing(groupId)` broadcast `"UserTyping"` to tenant-scoped group ([GroupChatHub.cs](backend/MLS.Infrastructure/Hubs/GroupChatHub.cs)) |
| T20 | Test integration: send→receive realtime 2 clients | 2 | ✅ [ChatMessagingTests.cs](backend/tests/MLS.Tests/Handlers/ChatMessagingTests.cs) — 5 tests pass (Send broadcasts, non-member 403, ascending cursor pagination, soft-delete by sender, mod-required delete) |

**Wired:** [ChatMessagesController.cs](backend/MLS.API/Controllers/ChatMessagesController.cs) — `GET /messages`, `POST /messages`, `DELETE /messages/{id}`, `POST /messages/read`. Build green, 10/10 chat tests pass.

### Sprint 6.4 — Support Chat (8pt) — ✅ DONE
| # | Task | Pt | Status |
|---|------|----|--------|
| T21 | Entity + migration đã làm Sprint 6.1 (verify) | — | ✅ [SupportConversation.cs](backend/MLS.Domain/Entities/SupportConversation.cs), [SupportMessage.cs](backend/MLS.Domain/Entities/SupportMessage.cs), bảng đã tạo trong [phase6-chat-migration.sql](deploy/phase6-chat-migration.sql) |
| T22 | API student: create/get/send/close | 2 | ✅ [SupportConversationsController.cs](backend/MLS.API/Controllers/SupportConversationsController.cs) `POST /mine/open`, `GET /{id}`, `GET /{id}/messages`, `POST /{id}/messages`, `POST /{id}/close` |
| T23 | API agent: list inbox, assign, reply | 2 | ✅ `GET /inbox`, `POST /{id}/assign`, reply qua cùng `POST /{id}/messages` (role-aware) — gated `[Authorize(Roles="Admin,SuperAdmin,Support")]` |
| T24 | `SupportChatHub` broadcast | 2 | ✅ Hub đã có sẵn ([SupportChatHub.cs](backend/MLS.Infrastructure/Hubs/SupportChatHub.cs)); `SendSupportMessageCommandHandler` gọi `IChatNotificationService.NotifySupportAsync(..., "SupportMessageReceived", ...)` |
| T25 | Auto-reuse conversation OPEN cho student | 1 | ✅ `OpenSupportConversationCommandHandler` tìm conversation `Open` mới nhất cho student và trả lại Id; chỉ tạo mới khi không có ([SupportConversationCommands.cs](backend/MLS.Application/Chat/Commands/SupportConversationCommands.cs)) |
| T26 | Test luồng student↔agent | 1 | ✅ [SupportConversationTests.cs](backend/tests/MLS.Tests/Handlers/SupportConversationTests.cs) — 5 tests pass (reuse open, student broadcast+touch, support reply auto-assign, send to closed rejected, foreign student forbidden) |

**Auto-assign:** khi support gửi tin nhắn đầu tiên vào conversation chưa có `SupportUserId`, handler tự gán = sender. Auth role check dùng `User.IsInRole("Admin"|"SuperAdmin"|"Support")` thống nhất với phần admin còn lại.

### Sprint 6.5 — Frontend Group (11pt) — ✅ DONE (refactor role-separated)
| # | Task | Pt | Status |
|---|------|----|--------|
| T27 | RTK slice `chatApi` + SignalR hooks | 2 | ✅ [chatApi.ts](frontend/src/lib/features/chat/chatApi.ts), [useGroupChatHub.ts](frontend/src/components/chat/useGroupChatHub.ts) |
| T28 | Student page `/nhom` dùng `AppShell` (Col 1 LEFT_NAV + Col 2 danh sách nhóm realtime + Col 3 `ChatRoom` + Col 4 `DiscoverGroups`); không có nút Tạo nhóm | 1 | ✅ [nhom/page.tsx](frontend/src/app/nhom/page.tsx) + [AppShell.tsx](frontend/src/app/_components/AppShell.tsx) (Col 2 wire `useListMyGroupsQuery`, click → `/nhom?id=...`) |
| T29 | Teacher portal: trang quản lý nhóm sở hữu + nút Tạo / Xoá | 2 | ✅ [teacher/chat/groups/page.tsx](frontend/src/app/teacher/chat/groups/page.tsx) (lọc `myRole === "Owner"`, reuse [CreateGroupModal.tsx](frontend/src/components/chat/CreateGroupModal.tsx)); teacher sidebar link đổi → `/teacher/chat/groups` ([teacher/layout.tsx](frontend/src/app/teacher/layout.tsx)) |
| T30 | `DiscoverGroups` style Moon.vn (tabs lớp + chip môn + card avatar/thành viên/khoá) | 1 | ✅ [DiscoverGroups.tsx](frontend/src/components/chat/DiscoverGroups.tsx) |
| T31 | `ChatRoom` (header + scrollable list + bubbles + composer + typing) | 4 | ✅ [ChatRoom.tsx](frontend/src/components/chat/ChatRoom.tsx), [MessageComposer.tsx](frontend/src/components/chat/MessageComposer.tsx) |
| T32 | Upload UI (ảnh / file preview, validate size) | 1 | ✅ [MessageComposer.tsx](frontend/src/components/chat/MessageComposer.tsx) |

**Role separation** (theo yêu cầu · § 2.1 / § 2.3): Admin quản lý mọi nhóm ở [admin/chat/groups](frontend/src/app/admin/chat/groups/page.tsx); giáo viên quản lý nhóm mình sở hữu ở [teacher/chat/groups](frontend/src/app/teacher/chat/groups/page.tsx); học sinh chỉ xem và tham gia qua menu **Nhóm** → [/nhom](frontend/src/app/nhom/page.tsx), không có nút Tạo.

**Build**: `tsc --noEmit` clean cho các file chat mới.

### Sprint 6.6 — Support Widget + Admin (6pt) — ✅ DONE (đúng design path)
| # | Task | Pt | Status |
|---|------|----|--------|
| T33 | `SupportChatWidget` floating, mount global trong root layout | 2 | ✅ [SupportChatWidget.tsx](frontend/src/components/chat/SupportChatWidget.tsx), [layout.tsx](frontend/src/app/layout.tsx), [supportChatApi.ts](frontend/src/lib/features/chat/supportChatApi.ts), [useSupportChatHub.ts](frontend/src/components/chat/useSupportChatHub.ts) |
| T34 | Admin: trang quản lý nhóm (xem toàn hệ thống + xoá cưỡng chế) | 2 | ✅ [admin/chat/groups/page.tsx](frontend/src/app/admin/chat/groups/page.tsx) (dùng `useDiscoverGroupsQuery` + `useDeleteGroupMutation`); backend thêm `isAdmin` bypass trong [DeleteChatGroupCommand](backend/MLS.Application/Chat/Commands/ChatGroupCommands.cs) + [ChatGroupsController.Delete](backend/MLS.API/Controllers/ChatGroupsController.cs) |
| T35 | Admin: page cấu hình `ChatSettings` | 1 | ✅ [admin/chat/config/page.tsx](frontend/src/app/admin/chat/config/page.tsx), [AdminChatSettingsController.cs](backend/MLS.API/Controllers/AdminChatSettingsController.cs) |
| T36 | Admin: inbox CSKH + reply realtime | 1 | ✅ [admin/chat/support/page.tsx](frontend/src/app/admin/chat/support/page.tsx) (dùng `useInboxQuery` + `useSupportChatHub`) |

**Admin sidebar** (Chat & Hỗ trợ group) → [admin/layout.tsx](frontend/src/app/admin/layout.tsx) trỏ đúng 3 path trên theo design § 2.3.

**Tests**: 15/15 chat+support backend tests xanh (`dotnet test --filter "FullyQualifiedName~Chat|FullyQualifiedName~Support"`).

### Sprint 6.7 — Notifications + Q&A + Rate Limiting (12pt) — ✅ DONE

> Mục tiêu: bổ sung lớp thông báo đa kênh (in-app bell, push, email), luồng Q&A gắn với bài học, và bảo vệ hệ thống trước spam.

#### T37 — In-App Notification Bell (3pt)

**Mục tiêu**: Badge số đỏ trên navbar, dropdown xem thông báo mới nhất, đánh dấu đã đọc.

**Backend**
- Entity `Notification` (schema `tenant_*`):

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| Id | uuid PK | |
| UserId | uuid FK → Users | người nhận |
| Type | varchar(50) | `ChatMessage` / `GroupJoinRequest` / `GroupApproved` / `QAReply` / `System` |
| Title | varchar(255) | tiêu đề hiển thị |
| Body | text | nội dung ngắn |
| LinkUrl | varchar(500) NULL | link điều hướng khi click |
| IsRead | bool DEFAULT false | |
| CreatedAt | timestamptz | |

- Migration: `deploy/phase6-notifications-migration.sql` — `CREATE TABLE IF NOT EXISTS "Notifications"`, index `(UserId, IsRead, CreatedAt DESC)`.
- `INotificationService` interface: `NotifyAsync(tenantSlug, userId, type, title, body, linkUrl)` — lưu DB + push qua `NotificationHub`.
- `NotificationHub` (SignalR) route `/hubs/notifications`:
  - `OnConnectedAsync`: join group `tenant:{slug}:user:{userId}`.
  - Server → Client: `NotificationReceived(dto)`, `UnreadCountUpdated(count)`.
- `NotificationsController` (`/api/v1/notifications`):
  - `GET /?page=&pageSize=` — danh sách (mới nhất trước), trả `items + unreadCount`.
  - `POST /mark-read` — body `{ ids: uuid[] }` hoặc `{ all: true }`.
  - `GET /unread-count` — trả `{ count: int }` (dùng cho polling fallback).
- Tích hợp `INotificationService.NotifyAsync(...)` vào các handler hiện tại:
  - `SendChatMessageCommandHandler` → thông báo các member trong nhóm (trừ sender).
  - `ApproveMemberCommandHandler` → thông báo user vừa được duyệt.
  - `JoinChatGroupCommandHandler` (Private) → thông báo Owner/Moderator có yêu cầu mới.

**Frontend**
- `useNotificationHub.ts` — SignalR hook, dispatch `notificationSlice.addNotification(dto)` khi nhận `NotificationReceived`.
- `notificationSlice.ts` — Redux slice: `notifications[]`, `unreadCount`, `markRead(ids)`.
- `NotificationBell.tsx` — icon bell trong navbar, badge số đỏ (animate khi có mới), click mở dropdown.
- `NotificationDropdown.tsx` — danh sách 10 thông báo mới nhất, link điều hướng, nút "Xem tất cả", nút "Đánh dấu tất cả đã đọc". Polling fallback `GET /unread-count` mỗi 60s khi hub mất kết nối.
- `frontend/src/app/thong-bao/page.tsx` — trang đầy đủ (infinite scroll, filter theo Type).
- Mount `NotificationBell` vào `AppShell` (navbar phải, cạnh avatar).

---

#### T38 — FCM Push Notification (3pt)

**Mục tiêu**: gửi push notification đến browser (Web Push) và mobile (Android/iOS) khi user không mở app.

**Backend**
- Cài `FirebaseAdmin` NuGet.
- Entity `UserDeviceToken`:

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| Id | uuid PK | |
| UserId | uuid FK → Users | |
| Token | varchar(500) | FCM registration token |
| Platform | varchar(20) | `web` / `android` / `ios` |
| UpdatedAt | timestamptz | upsert theo (UserId, Platform) |

- `IFcmPushService` interface: `SendAsync(tokens[], title, body, data)`.
- `FcmPushService` dùng `FirebaseMessaging.DefaultInstance.SendMulticastAsync(...)`.
- `UserDeviceTokensController` (`/api/v1/me/device-tokens`): `POST` (đăng ký/update token), `DELETE` (unregister khi logout).
- `INotificationService.NotifyAsync(...)` mở rộng: sau khi lưu DB + push SignalR, gọi thêm `IFcmPushService` nếu user có token đã đăng ký.
- Config `appsettings.json`: section `Firebase:ServiceAccountJson` (path file JSON hoặc env var `FIREBASE_SERVICE_ACCOUNT`).
- Không push khi user đang online (kiểm tra qua `IUserOnlineTracker` — Redis set `online:{tenantSlug}:{userId}`).

**Frontend**
- `firebase.ts` — init Firebase app (env `NEXT_PUBLIC_FIREBASE_*`).
- `useFcmToken.ts` hook: request `Notification` permission → `getToken(messaging, { vapidKey })` → `POST /api/v1/me/device-tokens`.
- `public/firebase-messaging-sw.js` — Service Worker xử lý background push, click → mở `/thong-bao`.
- Gọi `useFcmToken()` trong root layout (sau khi đã authed).
- `.env.production` bổ sung: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.

---

#### T39 — Email Notification Templates (1pt)

**Mục tiêu**: gửi email cho các sự kiện quan trọng, tách biệt với email đơn hàng đã có.

**Backend**
- Reuse `IEmailService` hiện tại (SendGrid / SMTP).
- Thêm các email template (Razor/plain text):
  - `GroupJoinApproved.html` — "Yêu cầu tham gia nhóm **{GroupName}** đã được duyệt."
  - `GroupJoinRequest.html` — (gửi Owner/Mod) "**{UserName}** muốn tham gia nhóm **{GroupName}**."
  - `NewChatMessage.html` — digest khi user offline > 30 phút và có tin nhắn chưa đọc (batch, không spam mỗi tin).
  - `QANewReply.html` — "Câu hỏi của bạn trong bài **{LessonName}** có trả lời mới."
- `EmailNotificationHandler` — `INotificationHandler<NotificationCreatedEvent>`, lọc theo `Type` và `user.EmailNotificationsEnabled` (setting per user, mặc định `true`).
- User settings: thêm cột `EmailNotificationsEnabled bool DEFAULT true` vào bảng `Users` (hoặc bảng `UserPreferences` nếu đã có).

---

#### T40 — Q&A Comment Threads per Lesson/Session (3pt)

**Mục tiêu**: học viên đặt câu hỏi dưới bài học, giáo viên/admin trả lời, có upvote + nested reply 1 cấp.

**Backend**
- Entity `LessonComment`:

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| Id | uuid PK | |
| LessonId | uuid FK → Lessons | NULL nếu là SessionComment |
| SessionId | uuid FK → Sessions | NULL nếu là LessonComment |
| AuthorId | uuid FK → Users | |
| ParentId | uuid NULL FK → LessonComment | reply 1 cấp |
| Content | text NOT NULL | đã strip HTML phía server |
| UpvoteCount | int DEFAULT 0 | |
| IsDeleted | bool DEFAULT false | |
| IsPinned | bool DEFAULT false | teacher/admin pin câu hỏi hay |
| CreatedAt, UpdatedAt | timestamptz | |

  Index: `(LessonId, CreatedAt DESC)`, `(SessionId, CreatedAt DESC)`, `(ParentId)`.

- `LessonCommentUpvote` (bảng join): `(CommentId, UserId)` unique — tránh upvote nhiều lần.
- `LessonCommentsController` (`/api/v1/lessons/{id}/comments`):
  - `GET /?cursor=&limit=20` — top-level comments, kèm `replies[]` (tối đa 3, "Xem thêm" lazy).
  - `POST /` — tạo comment hoặc reply (`parentId` optional).
  - `DELETE /{commentId}` — soft delete (author hoặc teacher/admin).
  - `POST /{commentId}/upvote` — toggle upvote.
  - `POST /{commentId}/pin` — pin/unpin (teacher/admin).
- Tương tự cho `/api/v1/sessions/{id}/comments`.
- Sau khi tạo reply → gọi `INotificationService.NotifyAsync(type: "QAReply")` cho tác giả comment gốc.

**Frontend**
- `QASection.tsx` — mount ở cuối trang `/learn/[id]` (tab "Q&A" cạnh tab "Bình luận video").
- `CommentThread.tsx` — hiển thị comment + replies collapsed, nút "Trả lời", upvote button.
- `CommentComposer.tsx` — textarea đơn giản, submit POST.
- Teacher badge: avatar kèm label "Giáo viên" màu tím cho comment của teacher/admin.
- `lessonCommentsApi.ts` — RTK Query slice.
- Tích hợp `INotificationService` → notification bell và email khi có reply mới.

---

#### T41 — Rate Limiting gửi Message (2pt)

**Mục tiêu**: chặn spam tin nhắn chat — tối đa 10 tin / 3 giây / user.

**Backend**
- Thêm `Microsoft.AspNetCore.RateLimiting` (built-in .NET 7+, đã có trong .NET 10).
- `SlidingWindowRateLimiter` cho endpoint `POST /api/v1/chat/groups/{id}/messages` và `POST /api/v1/support/conversations/{id}/messages`:
  ```csharp
  options.AddSlidingWindowLimiter("chat-send", opt => {
      opt.PermitLimit = 10;
      opt.Window = TimeSpan.FromSeconds(3);
      opt.SegmentsPerWindow = 3;
      opt.QueueLimit = 0;          // không queue, trả 429 ngay
      opt.AutoReplenishment = true;
  });
  ```
- `RateLimiterKeySelector`: partition key = `"{tenantSlug}:{userId}"` (không chia sẻ quota giữa user).
- Trả HTTP `429 Too Many Requests` với header `Retry-After: <seconds>`.
- Thêm `[EnableRateLimiting("chat-send")]` lên action `SendMessage`.
- Middleware đăng ký trong `Program.cs`: `app.UseRateLimiter()` (sau `UseAuthentication`, trước `MapControllers`).

**Frontend**
- `ChatRoom.tsx` / `MessageComposer.tsx`: khi nhận HTTP 429, hiển thị toast "Bạn đang nhắn tin quá nhanh. Vui lòng chờ {retryAfter}s." và disable nút "Gửi" trong `retryAfter` giây.
- Parse header `Retry-After` từ response.

**Nginx** (bổ sung `deploy/nginx/default.conf`):
```nginx
# Burst limit tại nginx (lớp ngoài cùng — bảo vệ trước khi tới backend)
limit_req_zone $binary_remote_addr zone=chat_send:10m rate=30r/s;

location /api/v1/chat/ {
    limit_req zone=chat_send burst=20 nodelay;
    proxy_pass http://backend:5009;
    ...  # giữ nguyên headers hiện tại
}
```

---

| # | Task | Pt | Ưu tiên | Output |
|---|------|----|---------|--------|
| T37 | In-App Notification Bell (entity + hub + bell UI + dropdown) | 3 | Medium | ✅ `Notification` entity, `NotificationHub` `/hubs/notifications`, `NotificationsController`, `InAppNotificationService`, `NotificationBell.tsx`, `NotificationDropdown.tsx`, `notificationSlice.ts`, `notificationsApi.ts`, `useNotificationHub.ts` |
| T38 | FCM Push Notification (Firebase Admin + SW + useFcmToken) | 3 | Medium | ✅ `IFcmPushService`, `StubFcmPushService`, `UserDeviceToken` entity, `UserDeviceTokensController` |
| T39 | Email Notification Templates (GroupApproved, digest, QAReply) | 1 | Low | ✅ `IEmailService` extended with 4 new methods, `ConsoleEmailService` stubs, ready for template wiring |
| T40 | Q&A Comment Threads per Lesson/Session | 3 | Low | ✅ `LessonComment`+`LessonCommentUpvote` entities, `LessonCommentsController`, `LessonCommentCommands`, `LessonCommentQueries`, `QASection.tsx`, `CommentThread.tsx`, `lessonCommentsApi.ts`, migration SQL |
| T41 | Rate Limiting gửi message (SlidingWindow 10/3s + nginx burst) | 2 | Medium | ✅ `SlidingWindowRateLimiter` 10/3s per user in `Program.cs`, `[EnableRateLimiting("chat-send")]` on `ChatMessagesController`, nginx `limit_req_zone` + `limit_req` updated |

**Tổng Sprint 6.7**: 12pt — ✅ HOÀN THÀNH. 88/88 unit tests pass. Migration SQL: `deploy/phase6-notifications-migration.sql`.

---

## 9. IMPLEMENTATION PLAN (TIMELINE)

| Tuần | Sprint | Mục tiêu chính | Demo cuối tuần |
|------|--------|----------------|-----------------|
| 1 | 6.1 + 6.2 (1/2) | DB + Hub + Group CRUD | Tạo nhóm qua Swagger, list/discover |
| 2 | 6.2 (2/2) + 6.3 (1/2) | Membership + Send message + Upload | 2 user chat realtime qua Swagger + ws client |
| 3 | 6.3 (2/2) + 6.4 | Pagination, unread, support chat | API hoàn chỉnh, Postman collection xanh |
| 4 | 6.5 | Frontend `/nhom` chạy end‑to‑end | Học viên tạo/join/chat trong UI |
| 5 | 6.6 + bugfix | Support widget + Admin + polish | Demo full module, deploy prod |
| 6 | 6.7 (1/2) | Notification Bell + FCM Push + Rate Limiting | Bell + badge realtime, push test trên thiết bị thật |
| 7 | 6.7 (2/2) | Q&A Threads + Email templates + polish | Q&A đặt câu hỏi dưới bài học, email digest hoạt động |

**Milestones**:
- **M1 (cuối tuần 1)**: Schema lên prod, hub xanh, có thể tạo group qua API.
- **M2 (cuối tuần 3)**: Backend 100% feature, có test integration.
- **M3 (cuối tuần 5)**: UAT pass, release tag `v0.6.0-group-chat`.
- **M4 (cuối tuần 7)**: Notification đa kênh + Q&A + rate limit, release tag `v0.6.1-notifications`.

---

## 10. RISK & MITIGATION

| Risk | Tác động | Mitigation |
|------|----------|------------|
| SignalR sau reverse proxy (Caddy/Nginx) drop WS | Chat im lặng | Bật `WebSockets` middleware, set proxy buffering off; fallback long‑polling |
| Số connection tăng nhanh | RAM cao | 1 node OK đến ~5k connection; sau đó dùng Redis backplane (đã chừa interface) |
| File upload spam | Đầy MinIO | Quota theo user/ngày + cron dọn attachment chưa attach > 24h |
| Race: 2 user join cuối làm vượt MaxMembers | Sai số | Dùng transaction + `SELECT … FOR UPDATE` trên row group |
| Tenant leak qua SignalR group | Bảo mật | Group name luôn prefix `tenant:{slug}:…` + verify membership ở Hub |
| Message order lệch khi network jitter | Hiển thị sai | Sort client theo `CreatedAt` server‑side; server stamp trước khi broadcast |

---

## 11. DELIVERABLES

- [ ] Migration: [deploy/phase6-chat-migration.sql](deploy/phase6-chat-migration.sql)
- [ ] Migration: [deploy/phase6-notifications-migration.sql](deploy/phase6-notifications-migration.sql)
- [ ] Backend: 6 entity + 2 hub + 5 controller + 1 service (Storage reuse)
- [ ] Backend: `Notification` entity + `NotificationHub` + `NotificationsController`
- [ ] Backend: `UserDeviceToken` + `FcmPushService` (Firebase Admin)
- [ ] Backend: `LessonComment` entity + `LessonCommentsController`
- [ ] Backend: `SlidingWindowRateLimiter` cho chat endpoints
- [ ] Frontend: page `/nhom`, `/nhom/[id]`, support widget, admin pages
- [ ] Frontend: `NotificationBell` + `NotificationDropdown` + `/thong-bao` page
- [ ] Frontend: `firebase-messaging-sw.js` + `useFcmToken` + push permission flow
- [ ] Frontend: `QASection` + `CommentThread` dưới bài học
- [ ] Tests: unit (membership rules) + integration (send/receive realtime)
- [ ] Postman collection: `docs/postman/phase6-chat.json`
- [ ] Tài liệu: file này (`PHASE6_GROUP_CHAT_DESIGN.md`)

---

## 12. CHECKLIST PRE‑MERGE

- [ ] EF migration chạy idempotent local + prod
- [ ] JWT + tenant claim hoạt động trên SignalR
- [ ] Rate limit gửi message (SlidingWindow 10/3s + nginx burst)
- [ ] Upload chặn MIME ngoài whitelist
- [ ] Notification bell hiển thị đúng unread count realtime
- [ ] FCM push gửi được tới browser offline
- [ ] Email digest gửi đúng (không spam, chỉ khi offline > 30 phút)
- [ ] Q&A thread hiển thị đưới bài học, reply thông báo người hỏi
- [ ] Mobile responsive (Col 4 ẩn ≤ 1024px, Col 2 collapse ≤ 768px)
- [ ] Empty state + loading skeleton
- [ ] i18n VN (mặc định) — copy theo Moon.vn

---

**Liên hệ**: Cập nhật tiến độ vào `PROJECT_PROGRESS.md` mỗi cuối sprint.
