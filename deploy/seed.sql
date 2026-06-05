-- =============================================================================
-- MLS Demo Seed Data — schema: tenant_demo
-- Password for all accounts: Demo@123456
-- Run: docker exec -i mls_postgres psql -U mls_user -d mls < /tmp/seed.sql
-- =============================================================================

\set schema tenant_demo
SET search_path TO tenant_demo, public;

-- =============================================================================
-- 1. USERS
-- =============================================================================
-- PasswordHash = BCrypt(Demo@123456, workFactor=12)
INSERT INTO "Users" ("Id","Email","Phone","PasswordHash","Status","CreatedAt")
VALUES
  ('a0000001-0000-0000-0000-000000000001','admin@demo.local',   NULL,'$2b$12$nLmuWX34OiYreLIltrxGh.EPTzFYFaomAq2V0xqPiw.xRsHsHQque','Active',NOW()),
  ('a0000001-0000-0000-0000-000000000002','giaovien1@demo.local',NULL,'$2b$12$nLmuWX34OiYreLIltrxGh.EPTzFYFaomAq2V0xqPiw.xRsHsHQque','Active',NOW()),
  ('a0000001-0000-0000-0000-000000000003','giaovien2@demo.local',NULL,'$2b$12$nLmuWX34OiYreLIltrxGh.EPTzFYFaomAq2V0xqPiw.xRsHsHQque','Active',NOW()),
  ('a0000001-0000-0000-0000-000000000004','hocvien1@demo.local', NULL,'$2b$12$nLmuWX34OiYreLIltrxGh.EPTzFYFaomAq2V0xqPiw.xRsHsHQque','Active',NOW()),
  ('a0000001-0000-0000-0000-000000000005','hocvien2@demo.local', NULL,'$2b$12$nLmuWX34OiYreLIltrxGh.EPTzFYFaomAq2V0xqPiw.xRsHsHQque','Active',NOW()),
  ('a0000001-0000-0000-0000-000000000006','hocvien3@demo.local', NULL,'$2b$12$nLmuWX34OiYreLIltrxGh.EPTzFYFaomAq2V0xqPiw.xRsHsHQque','Active',NOW())
ON CONFLICT ("Email") DO NOTHING;

-- =============================================================================
-- 2. USER PROFILES
-- =============================================================================
INSERT INTO "UserProfiles" ("Id","UserId","FullName","AvatarUrl","CreatedAt")
VALUES
  (gen_random_uuid(),'a0000001-0000-0000-0000-000000000001','Admin Demo',         NULL,NOW()),
  (gen_random_uuid(),'a0000001-0000-0000-0000-000000000002','Nguyễn Minh Tuấn',   'https://i.pravatar.cc/150?img=11',NOW()),
  (gen_random_uuid(),'a0000001-0000-0000-0000-000000000003','Trần Thị Lan',       'https://i.pravatar.cc/150?img=25',NOW()),
  (gen_random_uuid(),'a0000001-0000-0000-0000-000000000004','Phạm Văn Đức',       'https://i.pravatar.cc/150?img=52',NOW()),
  (gen_random_uuid(),'a0000001-0000-0000-0000-000000000005','Lê Thị Mai',         'https://i.pravatar.cc/150?img=47',NOW()),
  (gen_random_uuid(),'a0000001-0000-0000-0000-000000000006','Hoàng Văn Minh',     'https://i.pravatar.cc/150?img=60',NOW())
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 3. USER ROLES
-- =============================================================================
INSERT INTO "UserRoles" ("UserId","RoleId","AssignedAt")
SELECT 'a0000001-0000-0000-0000-000000000001', "Id", NOW() FROM "Roles" WHERE "Name" IN ('SuperAdmin','Admin')
ON CONFLICT DO NOTHING;

INSERT INTO "UserRoles" ("UserId","RoleId","AssignedAt")
SELECT 'a0000001-0000-0000-0000-000000000002', "Id", NOW() FROM "Roles" WHERE "Name" = 'Teacher'
ON CONFLICT DO NOTHING;

INSERT INTO "UserRoles" ("UserId","RoleId","AssignedAt")
SELECT 'a0000001-0000-0000-0000-000000000003', "Id", NOW() FROM "Roles" WHERE "Name" = 'Teacher'
ON CONFLICT DO NOTHING;

INSERT INTO "UserRoles" ("UserId","RoleId","AssignedAt")
SELECT 'a0000001-0000-0000-0000-000000000004', "Id", NOW() FROM "Roles" WHERE "Name" = 'Student'
ON CONFLICT DO NOTHING;

INSERT INTO "UserRoles" ("UserId","RoleId","AssignedAt")
SELECT 'a0000001-0000-0000-0000-000000000005', "Id", NOW() FROM "Roles" WHERE "Name" = 'Student'
ON CONFLICT DO NOTHING;

INSERT INTO "UserRoles" ("UserId","RoleId","AssignedAt")
SELECT 'a0000001-0000-0000-0000-000000000006', "Id", NOW() FROM "Roles" WHERE "Name" = 'Student'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 4. TEACHER PROFILES
-- =============================================================================
INSERT INTO "TeacherProfiles" (
  "Id","UserId","DisplayName","Slug","AvatarUrl","CoverUrl",
  "Headline","Bio","ExperienceYears","Specialization",
  "IsVerified","IsPublic","FollowerCount","CourseCount",
  "RatingAverage","TotalViews","TotalStudents","CreatedAt"
) VALUES
(
  'b0000001-0000-0000-0000-000000000001',
  'a0000001-0000-0000-0000-000000000002',
  'Nguyễn Minh Tuấn',
  'nguyen-minh-tuan',
  'https://i.pravatar.cc/150?img=11',
  'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=800',
  'Chuyên gia Tiếng Anh giao tiếp | 8 năm kinh nghiệm',
  'Thầy Tuấn có hơn 8 năm kinh nghiệm giảng dạy Tiếng Anh giao tiếp và luyện thi IELTS. Đã giúp hơn 2000 học viên đạt mục tiêu của mình.',
  8, 'Tiếng Anh Giao Tiếp & IELTS',
  true, true, 1240, 3, 4.85, 58000, 2100, NOW()
),
(
  'b0000001-0000-0000-0000-000000000002',
  'a0000001-0000-0000-0000-000000000003',
  'Trần Thị Lan',
  'tran-thi-lan',
  'https://i.pravatar.cc/150?img=25',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
  'Giáo viên Ngữ pháp Tiếng Anh | Thạc sĩ ĐH Hà Nội',
  'Cô Lan tốt nghiệp Thạc sĩ Ngôn ngữ Anh tại Đại học Hà Nội. Chuyên sâu về ngữ pháp và luyện thi TOEIC, đã giảng dạy 6 năm.',
  6, 'Ngữ Pháp & TOEIC',
  true, true, 876, 2, 4.72, 32000, 1450, NOW()
)
ON CONFLICT ("Slug") DO NOTHING;

-- =============================================================================
-- 5. BANNER SLIDES
-- =============================================================================
INSERT INTO "BannerSlides" (
  "Id","Title","Subtitle","Description","ImageUrl","LinkUrl",
  "BadgeText","CtaText","BgColor","TextColor","OrderIndex","IsActive","CreatedAt"
) VALUES
(
  'c0000001-0000-0000-0000-000000000001',
  'Học Tiếng Anh Giao Tiếp','Tự tin nói chuyện với người bản ngữ',
  'Khoá học từ cơ bản đến nâng cao, lộ trình rõ ràng, giáo viên nhiều kinh nghiệm',
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1200',
  '/khoa-hoc',
  'HOT','Khám phá ngay','#1a56db','#ffffff',0,true,NOW()
),
(
  'c0000001-0000-0000-0000-000000000002',
  'Luyện Thi IELTS 6.5+','Cam kết đầu ra — Hoàn tiền nếu không đạt',
  'Phương pháp học thông minh, luyện đề thực tế, giáo viên IELTS 8.0+',
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200',
  '/khoa-hoc',
  'NEW','Đăng ký thử miễn phí','#0e9f6e','#ffffff',1,true,NOW()
),
(
  'c0000001-0000-0000-0000-000000000003',
  'Khai Giảng 01/06/2026','Giảm 40% học phí khi đăng ký sớm',
  'Chương trình ưu đãi đặc biệt cho học viên đăng ký trước ngày khai giảng',
  'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1200',
  '/dang-ky',
  'SALE 40%','Đăng ký ngay','#e3a008','#1a1a1a',2,true,NOW()
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 6. COURSES
-- =============================================================================
INSERT INTO "Courses" (
  "Id","Title","Code","Description","ShortDescription","Slug",
  "Level","Language","ThumbnailUrl","Tags","Duration",
  "Status","Visibility","IsFree","CertificateEnabled","CompletionRequired",
  "TeacherId","CreatedBy","PublishedAt","Price","DiscountPrice","CreatedAt"
) VALUES
(
  'd0000001-0000-0000-0000-000000000001',
  'Tiếng Anh Giao Tiếp Cơ Bản','TAGT01',
  'Khoá học dành cho người mới bắt đầu học Tiếng Anh. Bạn sẽ học cách chào hỏi, giới thiệu bản thân, giao tiếp trong các tình huống hằng ngày một cách tự tin và tự nhiên.',
  'Học Tiếng Anh giao tiếp từ con số 0 — tự tin nói chuyện trong 60 ngày',
  'tieng-anh-giao-tiep-co-ban',
  1,'VI',
  'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600',
  'giao tiếp,cơ bản,beginner',
  1800,
  'Published','Public',false,true,false,
  'b0000001-0000-0000-0000-000000000001',
  'a0000001-0000-0000-0000-000000000002',
  NOW()-INTERVAL '10 days',
  499000,399000,NOW()-INTERVAL '15 days'
),
(
  'd0000001-0000-0000-0000-000000000002',
  'Ngữ Pháp Tiếng Anh Từ A-Z','NPTAZ01',
  'Khoá học ngữ pháp Tiếng Anh toàn diện từ cơ bản đến nâng cao. Hệ thống hoá toàn bộ các cấu trúc ngữ pháp quan trọng, luyện tập qua bài tập thực tế.',
  'Nắm vững toàn bộ ngữ pháp Tiếng Anh — từ thì cơ bản đến cấu trúc phức tạp',
  'ngu-phap-tieng-anh-tu-a-z',
  2,'VI',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600',
  'ngữ pháp,grammar,intermediate',
  2400,
  'Published','Public',false,true,true,
  'b0000001-0000-0000-0000-000000000002',
  'a0000001-0000-0000-0000-000000000003',
  NOW()-INTERVAL '5 days',
  699000,NULL,NOW()-INTERVAL '8 days'
),
(
  'd0000001-0000-0000-0000-000000000003',
  'Luyện Thi IELTS 6.5+','IELTS65',
  'Khoá học luyện thi IELTS toàn diện 4 kỹ năng: Nghe, Nói, Đọc, Viết. Phương pháp học theo từng band điểm, luyện đề thật sự từ Cambridge và British Council.',
  'Chinh phục IELTS 6.5 trong 3 tháng — cam kết đầu ra hoàn tiền',
  'luyen-thi-ielts-6-5',
  4,'VI',
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600',
  'IELTS,luyện thi,advanced',
  3600,
  'Published','Public',false,true,true,
  'b0000001-0000-0000-0000-000000000001',
  'a0000001-0000-0000-0000-000000000002',
  NOW()-INTERVAL '2 days',
  1299000,999000,NOW()-INTERVAL '12 days'
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 7. COURSE MODULES
-- =============================================================================
INSERT INTO "CourseModules" (
  "Id","CourseId","LevelId","Title","Description","OrderIndex","IsLocked","CreatedAt"
) VALUES
-- Course 1: Tiếng Anh Giao Tiếp Cơ Bản
('e0000001-0000-0000-0000-000000000001','d0000001-0000-0000-0000-000000000001',NULL,'Module 1: Chào Hỏi & Giới Thiệu Bản Thân','Học cách chào hỏi lịch sự, giới thiệu tên tuổi, nghề nghiệp và nơi ở trong Tiếng Anh',0,false,NOW()),
('e0000001-0000-0000-0000-000000000002','d0000001-0000-0000-0000-000000000001',NULL,'Module 2: Giao Tiếp Hằng Ngày','Các câu hỏi và trả lời thường dùng khi mua sắm, ăn uống, di chuyển',1,false,NOW()),
('e0000001-0000-0000-0000-000000000003','d0000001-0000-0000-0000-000000000001',NULL,'Module 3: Tình Huống Tại Nơi Làm Việc','Tiếng Anh trong môi trường công sở, họp hành, email',2,false,NOW()),
-- Course 2: Ngữ Pháp Tiếng Anh Từ A-Z
('e0000001-0000-0000-0000-000000000004','d0000001-0000-0000-0000-000000000002',NULL,'Module 1: Các Thì Trong Tiếng Anh','Hiện tại đơn, hiện tại tiếp diễn, quá khứ đơn, tương lai và sự khác biệt',0,false,NOW()),
('e0000001-0000-0000-0000-000000000005','d0000001-0000-0000-0000-000000000002',NULL,'Module 2: Câu Điều Kiện & Mệnh Đề Quan Hệ','If clause (Type 0-3), relative clauses với who/which/that/whose',1,false,NOW()),
-- Course 3: Luyện Thi IELTS 6.5+
('e0000001-0000-0000-0000-000000000006','d0000001-0000-0000-0000-000000000003',NULL,'Module 1: IELTS Listening','Chiến thuật nghe và điền đáp án, các dạng câu hỏi thường gặp trong Listening',0,false,NOW()),
('e0000001-0000-0000-0000-000000000007','d0000001-0000-0000-0000-000000000003',NULL,'Module 2: IELTS Reading','Kỹ năng skimming & scanning, xử lý True/False/Not Given, matching headings',1,false,NOW()),
('e0000001-0000-0000-0000-000000000008','d0000001-0000-0000-0000-000000000003',NULL,'Module 3: IELTS Writing Task 2','Cách lập dàn ý, viết mở bài - thân bài - kết luận đạt band 6.5+',2,false,NOW())
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 8. SESSIONS
-- =============================================================================
INSERT INTO "Sessions" (
  "Id","ModuleId","Title","Description","OrderIndex","IsFreeTrial","PublishStatus","DurationSeconds","CreatedAt"
) VALUES
-- Module 1 (Chào Hỏi)
('f0000001-0000-0000-0000-000000000001','e0000001-0000-0000-0000-000000000001','Bài 1: Hello, Nice to Meet You!','Học các mẫu câu chào hỏi lần đầu gặp gỡ — formal và informal',0,true,'Published',720,NOW()),
('f0000001-0000-0000-0000-000000000002','e0000001-0000-0000-0000-000000000001','Bài 2: Giới Thiệu Nghề Nghiệp','What do you do? — các nghề phổ biến và cách diễn đạt tự nhiên',1,false,'Published',900,NOW()),
('f0000001-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000001','Bài 3: Small Talk & Hỏi Thăm','How are you? Fine, thanks! — cách duy trì cuộc trò chuyện',2,false,'Published',840,NOW()),
-- Module 2 (Giao Tiếp Hằng Ngày)
('f0000001-0000-0000-0000-000000000004','e0000001-0000-0000-0000-000000000002','Bài 1: Tại Nhà Hàng','Gọi món, hỏi waiter, thanh toán — mẫu hội thoại thực tế',0,true,'Published',660,NOW()),
('f0000001-0000-0000-0000-000000000005','e0000001-0000-0000-0000-000000000002','Bài 2: Mua Sắm','How much is this? — trả giá, hỏi size, đổi hàng',1,false,'Published',780,NOW()),
-- Module 4 (Các Thì)
('f0000001-0000-0000-0000-000000000006','e0000001-0000-0000-0000-000000000004','Bài 1: Present Simple vs Continuous','Phân biệt và dùng đúng hai thì hiện tại hay nhầm lẫn nhất',0,true,'Published',1080,NOW()),
('f0000001-0000-0000-0000-000000000007','e0000001-0000-0000-0000-000000000004','Bài 2: Past Simple & Past Perfect','Kể chuyện trong quá khứ, trình tự sự kiện',1,false,'Published',1200,NOW()),
-- Module 6 (IELTS Listening)
('f0000001-0000-0000-0000-000000000008','e0000001-0000-0000-0000-000000000006','Bài 1: Làm Quen Với Format IELTS Listening','4 sections, question types, cách dùng 30 giây đọc câu hỏi trước',0,true,'Published',1440,NOW()),
('f0000001-0000-0000-0000-000000000009','e0000001-0000-0000-0000-000000000006','Bài 2: Section 1 — Form Completion','Điền thông tin vào form, luyện nghe số điện thoại, tên, địa chỉ',1,false,'Published',1560,NOW())
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 9. COURSE ENROLLMENTS
-- =============================================================================
INSERT INTO "CourseEnrollments" (
  "Id","UserId","CourseId","EnrolledAt","Source","CreatedAt"
) VALUES
-- Học viên 1 enrolled courses 1 & 3
(gen_random_uuid(),'a0000001-0000-0000-0000-000000000004','d0000001-0000-0000-0000-000000000001',NOW()-INTERVAL '7 days','Admin',NOW()-INTERVAL '7 days'),
(gen_random_uuid(),'a0000001-0000-0000-0000-000000000004','d0000001-0000-0000-0000-000000000003',NOW()-INTERVAL '3 days','Admin',NOW()-INTERVAL '3 days'),
-- Học viên 2 enrolled course 1 & 2
(gen_random_uuid(),'a0000001-0000-0000-0000-000000000005','d0000001-0000-0000-0000-000000000001',NOW()-INTERVAL '5 days','Admin',NOW()-INTERVAL '5 days'),
(gen_random_uuid(),'a0000001-0000-0000-0000-000000000005','d0000001-0000-0000-0000-000000000002',NOW()-INTERVAL '4 days','Admin',NOW()-INTERVAL '4 days'),
-- Học viên 3 enrolled all 3 courses
(gen_random_uuid(),'a0000001-0000-0000-0000-000000000006','d0000001-0000-0000-0000-000000000001',NOW()-INTERVAL '9 days','Admin',NOW()-INTERVAL '9 days'),
(gen_random_uuid(),'a0000001-0000-0000-0000-000000000006','d0000001-0000-0000-0000-000000000002',NOW()-INTERVAL '6 days','Admin',NOW()-INTERVAL '6 days'),
(gen_random_uuid(),'a0000001-0000-0000-0000-000000000006','d0000001-0000-0000-0000-000000000003',NOW()-INTERVAL '1 day', 'Admin',NOW()-INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 10. UPDATE COURSE STATS
-- =============================================================================
UPDATE "Courses" SET "UpdatedAt" = NOW() WHERE "Id" IN (
  'd0000001-0000-0000-0000-000000000001',
  'd0000001-0000-0000-0000-000000000002',
  'd0000001-0000-0000-0000-000000000003'
);

-- =============================================================================
-- VERIFY
-- =============================================================================
SELECT 'Users'             AS "Table", COUNT(*) AS "Rows" FROM "Users"
UNION ALL
SELECT 'Roles',            COUNT(*) FROM "Roles"
UNION ALL
SELECT 'TeacherProfiles',  COUNT(*) FROM "TeacherProfiles"
UNION ALL
SELECT 'BannerSlides',     COUNT(*) FROM "BannerSlides"
UNION ALL
SELECT 'Courses',          COUNT(*) FROM "Courses"
UNION ALL
SELECT 'CourseModules',    COUNT(*) FROM "CourseModules"
UNION ALL
SELECT 'Sessions',         COUNT(*) FROM "Sessions"
UNION ALL
SELECT 'CourseEnrollments',COUNT(*) FROM "CourseEnrollments";
