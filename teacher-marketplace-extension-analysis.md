
# TEACHER MARKETPLACE EXTENSION
# PHÂN TÍCH NGHIỆP VỤ MỞ RỘNG PAGE GIÁO VIÊN
# DÙNG CHO COPILOT UPDATE DESIGN & IMPLEMENT

## 1. MỤC TIÊU

Mở rộng hệ thống LMS hiện tại để hỗ trợ:

- Public Teacher Page
- Teacher Branding
- Teacher Course Marketplace
- Teacher Follow System
- Teacher Analytics
- Teacher Social Layer

Không ảnh hưởng tới:
- Auth architecture
- RBAC
- LMS Core
- Quiz Engine
- Enrollment
- Completion Engine
- Payment flow
- Existing API structure

---

## 2. KIẾN TRÚC HIỆN TẠI

### Current Roles

- SuperAdmin
- Admin
- Teacher
- Student
- ContentManager
- Support

### Kết luận

Role hiện tại đã đủ để triển khai teacher marketplace.

Không cần thay đổi RBAC architecture.

Chỉ cần mở rộng domain Teacher.

---

## 3. ĐỊNH HƯỚNG NGHIỆP VỤ

### Hệ thống hiện tại

Traditional LMS

### Hệ thống mục tiêu

Marketplace LMS

### Ý nghĩa

Teacher trở thành:
- Creator
- Seller
- Influencer

Course trở thành:
- Commercial Product

---

## 4. KIẾN TRÚC MỞ RỘNG ĐỀ XUẤT

### Kiến trúc hiện tại

User
- Auth
- Roles
- Profile

### Kiến trúc mở rộng

User
- Auth
- Roles
- Profile
- TeacherProfile Extension

---

## 5. QUAN TRỌNG

### KHÔNG tạo Teacher entity riêng

Không nên:
- Teacher table độc lập hoàn toàn

Vì sẽ gây:
- duplicate user
- khó maintain
- khó auth
- khó RBAC
- khó scale

---

## 6. PHƯƠNG ÁN ĐÚNG

Teacher = User + TeacherProfile

---

## 7. DATA MODEL ĐỀ XUẤT

### 7.1 User

Giữ nguyên hệ thống hiện tại.

---

### 7.2 TeacherProfile

#### Mục tiêu

Lưu thông tin public branding của giáo viên.

#### Table

TeacherProfile

#### Fields

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| userId | UUID | FK tới User |
| displayName | varchar | Tên hiển thị |
| slug | varchar | SEO slug |
| avatarUrl | text | Avatar |
| coverUrl | text | Cover image |
| headline | varchar | Tiêu đề ngắn |
| bio | text | Giới thiệu |
| experienceYears | int | Số năm kinh nghiệm |
| specialization | varchar | Chuyên môn |
| facebookUrl | text | Facebook |
| youtubeUrl | text | Youtube |
| tiktokUrl | text | TikTok |
| websiteUrl | text | Website |
| isVerified | boolean | Verify teacher |
| isPublic | boolean | Public profile |
| followerCount | int | Tổng follower |
| courseCount | int | Tổng khóa học |
| ratingAverage | decimal | Rating |
| totalViews | bigint | Tổng lượt xem |
| totalStudents | bigint | Tổng học viên |
| createdAt | datetime | Created time |
| updatedAt | datetime | Updated time |

---

### 7.3 TeacherFollower

#### Mục tiêu

Theo dõi giáo viên.

#### Fields

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| teacherId | UUID | Teacher |
| studentId | UUID | Student |
| createdAt | datetime | Follow time |

---

### 7.4 TeacherAnalytics

#### Fields

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| teacherId | UUID | Teacher |
| totalViews | bigint | Tổng views |
| totalFollowers | bigint | Tổng followers |
| totalLikes | bigint | Tổng likes |
| totalRevenue | decimal | Tổng doanh thu |
| totalEnrollments | bigint | Tổng enroll |
| completionRate | decimal | Completion rate |
| updatedAt | datetime | Updated time |

---

### 7.5 Course Extension

Giữ nguyên Course architecture.

Chỉ bổ sung:
- ownerTeacherId

---

## 8. PHÂN TÍCH PAGE GIÁO VIÊN

### 8.1 Public Teacher Page

URL:
- /teacher/{slug}

Ví dụ:
- /teacher/le-van-tuan

---

### 8.2 Header Section

| UI | Data Source |
|---|---|
| Avatar | TeacherProfile.avatarUrl |
| Cover | TeacherProfile.coverUrl |
| Teacher Name | displayName |
| Verify Badge | isVerified |
| Bio | bio |
| Experience | experienceYears |
| Views | TeacherAnalytics.totalViews |
| Likes | TeacherAnalytics.totalLikes |
| Followers | TeacherAnalytics.totalFollowers |

---

### 8.3 Follow Button

Student follow Teacher.

Insert:
- TeacherFollower

---

### 8.4 Message Button

Reuse chat module hiện tại.

Bổ sung:
- conversationType = teacher_student

---

### 8.5 Shop Section

Ý nghĩa:
- Danh sách khóa học thuộc giáo viên

Query:
SELECT * FROM Courses
WHERE ownerTeacherId = ?
AND publishStatus = 'Published'

---

## 9. API DESIGN

### Get Teacher Profile

GET /api/teachers/{slug}

---

### Get Teacher Courses

GET /api/teachers/{id}/courses

---

### Follow Teacher

POST /api/teachers/{id}/follow

---

### Unfollow Teacher

DELETE /api/teachers/{id}/follow

---

### Teacher Analytics

GET /api/teacher-dashboard/analytics

---

## 10. TEACHER DASHBOARD

### Modules

- Profile Management
- Course Management
- Lesson Upload
- Quiz Management
- Student Analytics
- Revenue
- Followers
- Coupon

---

## 11. QUAN HỆ NGHIỆP VỤ

### Teacher và Course

Teacher 1 - N Courses

### Student và Teacher

Student N - N Teacher

Thông qua:
- TeacherFollower

---

## 12. KHÔNG ẢNH HƯỞNG KIẾN TRÚC HIỆN TẠI

| Module | Có thay đổi không |
|---|---|
| Auth | Không |
| JWT | Không |
| RBAC | Không |
| API Gateway | Không |
| LMS Core | Không |
| Enrollment | Không |
| Quiz Engine | Không |
| Completion Engine | Không |
| Payment | Không |

---

## 13. SOCIAL LAYER

Teacher page thực chất là:
- Social + Branding Layer

gắn trên LMS core hiện tại.

---

## 14. BUSINESS FLOW

Teacher đăng ký
↓
Admin verify teacher
↓
Teacher cập nhật profile
↓
Teacher tạo khóa học
↓
Publish khóa học
↓
Public teacher page được tạo
↓
Student follow teacher
↓
Student mua khóa học
↓
Analytics cập nhật

---

## 15. FRONTEND IMPLEMENTATION

### Web

- NextJS
- TailwindCSS
- shadcn/ui

### Components

- TeacherHeader
- TeacherStats
- TeacherBio
- TeacherCourseList
- TeacherFollowButton
- TeacherSocialLinks

---

## 16. BACKEND IMPLEMENTATION

### ASP.NET Core Modules

- TeacherProfileModule
- TeacherAnalyticsModule
- TeacherFollowerModule

### Services

- TeacherProfileService
- TeacherAnalyticsService
- TeacherFollowerService

---

## 17. DATABASE INDEX

Recommended indexes:
- idx_teacher_slug
- idx_teacher_followers
- idx_course_owner_teacher

---

## 18. SECURITY

### Public API

- teacher profile
- course listing

### Protected API

- follow teacher
- teacher dashboard
- analytics

---

## 19. PHASE TRIỂN KHAI

### Phase 1

- TeacherProfile
- Public teacher page
- Teacher course listing

### Phase 2

- Follow teacher
- Teacher analytics
- Revenue dashboard

### Phase 3

- Livestream
- Community
- Feed
- AI recommendation

---

## 20. KẾT LUẬN

Kiến trúc hiện tại đã phù hợp để mở rộng teacher marketplace.

Không cần redesign toàn bộ hệ thống.

Chỉ cần bổ sung:
- TeacherProfile
- TeacherFollower
- TeacherAnalytics
- Course ownership

để triển khai đầy đủ:
- Teacher Marketplace Layer

theo mô hình:
- Marketplace LMS / EdTech Platform
