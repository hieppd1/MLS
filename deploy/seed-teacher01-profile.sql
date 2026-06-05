-- Seed TeacherProfile for Teacher01 and create test courses
SET search_path TO tenant_demo;

-- Step 1: Create TeacherProfile for Teacher01
-- Slug = userId so existing URL /giao-vien/ef5eb2b9-... still works
WITH new_profile AS (
  INSERT INTO "TeacherProfiles" (
    "Id", "UserId", "DisplayName", "Slug", "AvatarUrl",
    "Bio", "Headline", "ExperienceYears", "Specialization",
    "IsVerified", "IsPublic",
    "FollowerCount", "CourseCount", "RatingAverage", "TotalStudents", "TotalViews",
    "CreatedAt", "UpdatedAt"
  ) VALUES (
    gen_random_uuid(),
    'ef5eb2b9-c497-4eb1-b9f7-28bcbf409516',
    'Teacher01',
    'ef5eb2b9-c497-4eb1-b9f7-28bcbf409516',
    'demo/avatars/ef5eb2b9-c497-4eb1-b9f7-28bcbf409516.png',
    'Giáo viên tiếng Anh với hơn 5 năm kinh nghiệm luyện thi IELTS và TOEIC. Tôi áp dụng phương pháp giảng dạy hiện đại, tập trung vào giao tiếp thực tế và kỹ năng thi cử hiệu quả.',
    'Giáo viên tiếng Anh | Luyện thi IELTS & TOEIC',
    5,
    'Tiếng Anh, IELTS, TOEIC',
    true, true,
    85, 3, 4.5, 150, 520,
    NOW(), NOW()
  )
  ON CONFLICT ("Id") DO NOTHING
  RETURNING "Id"
),

-- Step 2: Create 3 Published test courses for Teacher01
course1 AS (
  INSERT INTO "Courses" (
    "Id", "Title", "ShortDescription", "Description",
    "Level", "Status", "TeacherId", "CreatedBy",
    "Price", "IsFree", "Slug", "Visibility", "Language",
    "CertificateEnabled", "CompletionRequired",
    "PublishedAt", "CreatedAt", "UpdatedAt"
  )
  SELECT
    gen_random_uuid(),
    'IELTS Speaking - Luyện nói từ 0',
    'Khóa học luyện kỹ năng Speaking IELTS từ cơ bản đến nâng cao, giúp bạn đạt band 6.5+',
    'Khóa học toàn diện về IELTS Speaking với các bài tập thực hành, mô phỏng thi thật và phản hồi chi tiết từ giáo viên.',
    3, 'Published', p."Id",
    'ef5eb2b9-c497-4eb1-b9f7-28bcbf409516',
    1500000, false, 'ielts-speaking-luyen-noi-tu-0', 'Public', 'vi',
    false, false,
    NOW(), NOW(), NOW()
  FROM new_profile p
  RETURNING "Id"
),
course2 AS (
  INSERT INTO "Courses" (
    "Id", "Title", "ShortDescription", "Description",
    "Level", "Status", "TeacherId", "CreatedBy",
    "Price", "DiscountPrice", "IsFree", "Slug", "Visibility", "Language",
    "CertificateEnabled", "CompletionRequired",
    "PublishedAt", "CreatedAt", "UpdatedAt"
  )
  SELECT
    gen_random_uuid(),
    'TOEIC 600+ - Chinh phục trong 60 ngày',
    'Lộ trình học TOEIC 60 ngày giúp bạn đạt 600+ điểm với phương pháp khoa học và hiệu quả.',
    'Khóa học TOEIC được thiết kế dành riêng cho người đi làm, với lịch học linh hoạt và bài tập thực hành đa dạng.',
    2, 'Published', p."Id",
    'ef5eb2b9-c497-4eb1-b9f7-28bcbf409516',
    2000000, 1200000, false, 'toeic-600-chinh-phuc-60-ngay', 'Public', 'vi',
    false, false,
    NOW(), NOW(), NOW()
  FROM new_profile p
  RETURNING "Id"
),
course3 AS (
  INSERT INTO "Courses" (
    "Id", "Title", "ShortDescription", "Description",
    "Level", "Status", "TeacherId", "CreatedBy",
    "Price", "IsFree", "Slug", "Visibility", "Language",
    "CertificateEnabled", "CompletionRequired",
    "PublishedAt", "CreatedAt", "UpdatedAt"
  )
  SELECT
    gen_random_uuid(),
    'Tiếng Anh giao tiếp hàng ngày',
    'Học tiếng Anh giao tiếp thực tế cho người đi làm và sinh viên, tập trung vào các tình huống hằng ngày.',
    'Khóa học giao tiếp tiếng Anh tập trung vào các chủ đề thực tế: tại công sở, du lịch, mua sắm và giao tiếp xã hội.',
    1, 'Published', p."Id",
    'ef5eb2b9-c497-4eb1-b9f7-28bcbf409516',
    500000, false, 'tieng-anh-giao-tiep-hang-ngay', 'Public', 'vi',
    false, false,
    NOW(), NOW(), NOW()
  FROM new_profile p
  RETURNING "Id"
)

-- Update CourseCount on the new profile
UPDATE "TeacherProfiles" SET "CourseCount" = 3
WHERE "UserId" = 'ef5eb2b9-c497-4eb1-b9f7-28bcbf409516';

-- Show result
SELECT "Id", "DisplayName", "Slug", "CourseCount" FROM "TeacherProfiles" WHERE "UserId" = 'ef5eb2b9-c497-4eb1-b9f7-28bcbf409516';
