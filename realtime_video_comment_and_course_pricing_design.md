# TÀI LIỆU PHÂN TÍCH NGHIỆP VỤ & THIẾT KẾ HỆ THỐNG

## REALTIME VIDEO COMMENT & COURSE PRICING SYSTEM

---

# 1. GIỚI THIỆU

## 1.1 Mục tiêu

Tài liệu mô tả:

- Phân tích nghiệp vụ
- Thiết kế hệ thống
- Database design
- API design
- Realtime architecture
- UI/UX flow

cho:

1. Realtime Video Comment System
2. Course Pricing & Package Management

---

# 2. REALTIME VIDEO COMMENT SYSTEM

## 2.1 Mục tiêu nghiệp vụ

Cho phép học viên:

- comment trực tiếp trên video
- comment theo timestamp
- xem comment realtime
- click comment để jump video
- thảo luận theo từng đoạn bài học
- ghi chú kiến thức theo từng phút

Mục tiêu:

- tăng engagement
- tăng replay rate
- tăng collaborative learning
- tăng retention

---

## 2.2 Chức năng nghiệp vụ

### Student

- Comment theo timestamp
- Reply comment
- Like comment
- Report comment
- Jump video theo comment
- Xem comment realtime

### Teacher

- Reply comment
- Pin comment
- Moderate comment
- Highlight comment

### Admin

- Quản lý moderation
- Report handling
- Chống spam
- Analytics

---

## 2.3 Flow nghiệp vụ

### Comment theo timestamp

```text
Student xem video
      ↓
Video đang ở phút 05:20
      ↓
Student nhập comment
      ↓
Hệ thống lưu timestamp = 320s
      ↓
Realtime broadcast comment
```

### Jump theo comment

```text
User click comment
      ↓
Frontend lấy timestamp
      ↓
Video seek tới timestamp
```

---

## 2.4 Kiến trúc hệ thống

```text
Frontend Video Player
        ↓
Realtime Websocket Gateway
        ↓
Comment Service
        ↓
-------------------------
| PostgreSQL            |
| Redis                 |
| Websocket Hub         |
-------------------------
```

---

## 2.5 Công nghệ đề xuất

| Thành phần | Công nghệ |
|---|---|
| Backend | ASP.NET Core |
| Realtime | SignalR |
| Database | PostgreSQL |
| Cache | Redis |
| Pub/Sub | Redis Pub/Sub |

---

## 2.6 Database Design

### VideoComment

| Field | Type |
|---|---|
| id | UUID |
| videoId | UUID |
| segmentId | UUID |
| userId | UUID |
| parentCommentId | UUID |
| content | text |
| timestampSecond | int |
| likeCount | int |
| isPinned | boolean |
| status | enum |
| createdAt | datetime |

---

### CommentReaction

| Field | Type |
|---|---|
| id | UUID |
| commentId | UUID |
| userId | UUID |
| reactionType | enum |

---

## 2.7 API Design

### Create Comment

```http
POST /api/video-comments
```

### Get Comments By Video

```http
GET /api/video-comments/video/{videoId}
```

### Like Comment

```http
POST /api/video-comments/{id}/like
```

### Pin Comment

```http
POST /api/video-comments/{id}/pin
```

---

## 2.8 Websocket Design

### Websocket Channel

```text
ws/video-comments/{videoId}
```

### Events

- comment_created
- comment_updated
- comment_deleted
- comment_liked
- comment_pinned

---

## 2.9 UI/UX Design

### Timeline Marker

```text
|----●------●---●------|
```

### Comment Panel

```text
----------------------------------
| Video Player                   |
----------------------------------
| Timeline Marker                |
----------------------------------
| Realtime Comments              |
----------------------------------
```

---

# 3. COURSE PRICING & PACKAGE SYSTEM

## 3.1 Mục tiêu nghiệp vụ

Hỗ trợ nhiều phân vùng giá:

- Basic
- Standard
- Advance

Mục tiêu:

- upsell package
- bundle khóa học
- monetize AI features
- phân quyền theo package

---

## 3.2 Mô tả package

### Basic

- Video learning
- Basic quiz
- Self-learning

### Standard

- Toàn bộ Basic
- Combo sách
- Grammar package
- Vocabulary package

### Advance

- Toàn bộ Standard
- Speaking AI
- Writing AI
- Teacher support
- Practical learning

---

## 3.3 Flow nghiệp vụ

### Purchase Package

```text
Student chọn package
      ↓
Thanh toán
      ↓
Tạo entitlement
      ↓
Unlock feature
```

### Upgrade Package

```text
Student đang dùng Basic
      ↓
Muốn dùng Speaking AI
      ↓
Popup upgrade Advance
      ↓
Thanh toán upgrade
```

---

## 3.4 Kiến trúc hệ thống

```text
Frontend Pricing UI
        ↓
Package Service
        ↓
Entitlement Service
        ↓
PostgreSQL
Redis
```

---

## 3.5 Database Design

### CoursePackage

| Field | Type |
|---|---|
| id | UUID |
| courseId | UUID |
| packageType | enum |
| title | varchar |
| description | text |
| originalPrice | decimal |
| salePrice | decimal |
| durationDay | int |
| status | enum |

---

### PackageEntitlement

| Field | Type |
|---|---|
| id | UUID |
| packageId | UUID |
| featureCode | varchar |
| enabled | boolean |

---

### StudentPackage

| Field | Type |
|---|---|
| id | UUID |
| studentId | UUID |
| packageId | UUID |
| startDate | datetime |
| expiredDate | datetime |
| status | enum |

---

## 3.6 Feature Mapping

| Feature | Basic | Standard | Advance |
|---|---|---|---|
| Video Learning | ✓ | ✓ | ✓ |
| Basic Quiz | ✓ | ✓ | ✓ |
| Vocabulary | ✗ | ✓ | ✓ |
| Grammar Practice | ✗ | ✓ | ✓ |
| Speaking AI | ✗ | ✗ | ✓ |
| Writing AI | ✗ | ✗ | ✓ |
| Teacher Support | ✗ | ✗ | ✓ |

---

## 3.7 API Design

### Get Packages

```http
GET /api/course-packages/course/{courseId}
```

### Purchase Package

```http
POST /api/course-packages/purchase
```

### Upgrade Package

```http
POST /api/course-packages/upgrade
```

### Validate Access

```http
GET /api/course-packages/access
```

---

# 4. KẾT LUẬN

Hệ thống được thiết kế theo hướng:

- scalable
- realtime
- extensible
- AI-ready

Phù hợp triển khai:

- EdTech platform
- LMS hiện đại
- AI learning system
- enterprise learning platform
