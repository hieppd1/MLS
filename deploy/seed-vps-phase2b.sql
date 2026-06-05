-- =============================================================================
-- SEED: Phase 2B Demo Data for VPS production database
-- Run via: docker exec mls_postgres psql -U mls_user -d mls -f /tmp/seed-vps-phase2b.sql
-- Target: Course "Tiếng Anh Giao Tiếp Cơ Bản" (d0000001-...-001)
--         Sessions in Module 1 (e0000001-...-001)
-- Safe to re-run: uses INSERT ... ON CONFLICT DO NOTHING
-- =============================================================================
SET search_path = tenant_demo;
BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Publish Sessions 1 & 2 + set DurationSeconds
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE "Sessions" SET
  "PublishStatus" = 'Published',
  "IsFreeTrial"   = true,
  "DurationSeconds" = 480,
  "UpdatedAt" = NOW()
WHERE "Id" = 'f0000001-0000-0000-0000-000000000001';

UPDATE "Sessions" SET
  "PublishStatus" = 'Published',
  "IsFreeTrial"   = false,
  "DurationSeconds" = 600,
  "UpdatedAt" = NOW()
WHERE "Id" = 'f0000001-0000-0000-0000-000000000002';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CREATE SessionVideoAssets
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO "SessionVideoAssets" (
  "Id", "SessionId", "Status", "HlsPath", "ThumbnailUrl",
  "DurationSeconds", "SizeBytes", "OriginalFileName", "CreatedAt", "UpdatedAt"
) VALUES (
  'a1000001-0000-0000-0000-000000000001',
  'f0000001-0000-0000-0000-000000000001',
  'Ready',
  'demo/videos/2c56db8a-57c5-46c8-af95-9dd0749159de.mp4',
  NULL,
  480, 30520006,
  'hello-nice-to-meet-you.mp4',
  NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "SessionVideoAssets" (
  "Id", "SessionId", "Status", "HlsPath", "ThumbnailUrl",
  "DurationSeconds", "SizeBytes", "OriginalFileName", "CreatedAt", "UpdatedAt"
) VALUES (
  'a1000001-0000-0000-0000-000000000002',
  'f0000001-0000-0000-0000-000000000002',
  'Ready',
  'demo/videos/ba87bc29-6bd1-4dac-ad4e-f0563104b105.mp4',
  NULL,
  600, 30520006,
  'gioi-thieu-nghe-nghiep.mp4',
  NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- Link videos to sessions
UPDATE "Sessions" SET
  "VideoAssetId" = 'a1000001-0000-0000-0000-000000000001',
  "UpdatedAt" = NOW()
WHERE "Id" = 'f0000001-0000-0000-0000-000000000001';

UPDATE "Sessions" SET
  "VideoAssetId" = 'a1000001-0000-0000-0000-000000000002',
  "UpdatedAt" = NOW()
WHERE "Id" = 'f0000001-0000-0000-0000-000000000002';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CREATE Segments for Session 1
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO "Segments" (
  "Id", "SessionId", "Title", "Description", "StartTime", "EndTime", "OrderIndex", "CreatedAt", "UpdatedAt"
) VALUES
  ('b1000001-0000-0000-0000-000000000001',
   'f0000001-0000-0000-0000-000000000001',
   'Part 1: Lời Chào Cơ Bản',
   'Học các cụm từ chào hỏi phổ biến trong tiếng Anh',
   0, 150, 0, NOW(), NOW()),
  ('b1000001-0000-0000-0000-000000000002',
   'f0000001-0000-0000-0000-000000000001',
   'Part 2: Giới Thiệu Bản Thân',
   'Cách giới thiệu tên, quốc tịch và nghề nghiệp',
   150, 320, 1, NOW(), NOW()),
  ('b1000001-0000-0000-0000-000000000003',
   'f0000001-0000-0000-0000-000000000001',
   'Part 3: Luyện Tập Hội Thoại',
   'Thực hành đoạn hội thoại giới thiệu hoàn chỉnh',
   320, 480, 2, NOW(), NOW())
ON CONFLICT ("Id") DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CREATE Segments for Session 2
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO "Segments" (
  "Id", "SessionId", "Title", "Description", "StartTime", "EndTime", "OrderIndex", "CreatedAt", "UpdatedAt"
) VALUES
  ('b2000001-0000-0000-0000-000000000001',
   'f0000001-0000-0000-0000-000000000002',
   'Part 1: Các Nghề Nghiệp Phổ Biến',
   'Từ vựng về nghề nghiệp — doctor, teacher, engineer, designer...',
   0, 280, 0, NOW(), NOW()),
  ('b2000001-0000-0000-0000-000000000002',
   'f0000001-0000-0000-0000-000000000002',
   'Part 2: Hỏi Về Công Việc',
   'Cấu trúc câu hỏi và trả lời về công việc, nơi làm việc',
   280, 600, 1, NOW(), NOW())
ON CONFLICT ("Id") DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. CREATE LearningAssets for Session 1 segments
-- ─────────────────────────────────────────────────────────────────────────────

-- Segment 1: Part 1 – NoteBlock at t=10
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic", "CreatedAt", "UpdatedAt"
) VALUES (
  'c1000001-0000-0000-0000-000000000001',
  'b1000001-0000-0000-0000-000000000001',
  'NoteBlock', 'Lưu Ý: Cách Dùng "Hello"', NULL,
  10, 150, 0,
  '{"content":"''Hello'' là lời chào thông dụng nhất. Dùng trong cả tình huống trang trọng và thân mật. Khác với ''Hi'' chỉ dùng khi thân mật.","highlights":["Dùng được cả trang trọng lẫn thân mật","Phát âm: /həˈloʊ/","Các biến thể: Howdy, Hey, Greetings"]}',
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- Segment 1: Part 1 – VocabularyBlock at t=30
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic", "CreatedAt", "UpdatedAt"
) VALUES (
  'c1000001-0000-0000-0000-000000000002',
  'b1000001-0000-0000-0000-000000000001',
  'VocabularyBlock', 'Từ Vựng: Lời Chào', NULL,
  30, 150, 1,
  '{"words":[{"word":"Hello","ipa":"/həˈloʊ/","meaning":"Xin chào (trang trọng/thông thường)","example":"Hello, my name is Minh."},{"word":"Hi","ipa":"/haɪ/","meaning":"Chào (thân mật)","example":"Hi there! How are you?"},{"word":"Greetings","ipa":"/ˈɡriːtɪŋz/","meaning":"Lời chào hỏi (trang trọng)","example":"Greetings from Vietnam!"},{"word":"Nice to meet you","ipa":"/naɪs tuː miːt juː/","meaning":"Rất vui được gặp bạn","example":"Nice to meet you, I''m Anna."}]}',
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- Segment 2: Part 2 – GrammarBlock at t=160
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic", "CreatedAt", "UpdatedAt"
) VALUES (
  'c1000001-0000-0000-0000-000000000003',
  'b1000001-0000-0000-0000-000000000002',
  'GrammarBlock', 'Cấu Trúc: Giới Thiệu Bản Thân', NULL,
  160, 320, 0,
  '{"pattern":"My name is [Name]. I am from [Country]. I am a/an [Job].","examples":["My name is Minh. I am from Vietnam. I am a software engineer.","Hi, I''m Sarah. I''m from the UK. I''m a teacher.","Hello, I''m David. I''m from Australia. I''m a doctor."],"keywords":["My name is","I am from","I am a/an","Nice to meet you"]}',
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- Segment 2: Part 2 – NoteBlock at t=200
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic", "CreatedAt", "UpdatedAt"
) VALUES (
  'c1000001-0000-0000-0000-000000000004',
  'b1000001-0000-0000-0000-000000000002',
  'NoteBlock', 'Mẹo: "I am" vs "I''m"', NULL,
  200, 320, 1,
  '{"content":"Trong hội thoại thông thường, người ta thường dùng dạng rút gọn ''I''m'' thay cho ''I am''. Cả hai đều đúng ngữ pháp, nhưng ''I''m'' nghe tự nhiên hơn khi nói.","highlights":["I am = I''m (dạng rút gọn)","Không rút gọn khi kết thúc câu: ''Yes, I am'' (KHÔNG: ''Yes, I''m'')","Dùng dạng rút gọn khi nói chuyện thân mật"]}',
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. CREATE LearningAssets for Session 2 segments
-- ─────────────────────────────────────────────────────────────────────────────

-- Segment 1 of S2: NoteBlock at t=10
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic", "CreatedAt", "UpdatedAt"
) VALUES (
  'c2000001-0000-0000-0000-000000000001',
  'b2000001-0000-0000-0000-000000000001',
  'NoteBlock', 'Lưu Ý: Mạo Từ Trước Nghề Nghiệp', NULL,
  10, 280, 0,
  '{"content":"Luôn dùng mạo từ ''a'' hoặc ''an'' trước danh từ chỉ nghề nghiệp khi giới thiệu. Dùng ''an'' trước từ bắt đầu bằng nguyên âm (a, e, i, o, u).","highlights":["I am a teacher (không nói: I am teacher)","I am an engineer (''an'' vì ''engineer'' bắt đầu bằng ''e'')","I am a doctor, a nurse, a writer"]}',
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- Segment 1 of S2: VocabularyBlock at t=40
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic", "CreatedAt", "UpdatedAt"
) VALUES (
  'c2000001-0000-0000-0000-000000000002',
  'b2000001-0000-0000-0000-000000000001',
  'VocabularyBlock', 'Từ Vựng: Nghề Nghiệp', NULL,
  40, 280, 1,
  '{"words":[{"word":"Doctor","ipa":"/ˈdɒktər/","meaning":"Bác sĩ","example":"She is a doctor at a local hospital."},{"word":"Engineer","ipa":"/ˌendʒɪˈnɪər/","meaning":"Kỹ sư","example":"He works as a software engineer."},{"word":"Teacher","ipa":"/ˈtiːtʃər/","meaning":"Giáo viên","example":"My mother is a teacher."},{"word":"Designer","ipa":"/dɪˈzaɪnər/","meaning":"Nhà thiết kế","example":"I''m a graphic designer."},{"word":"Accountant","ipa":"/əˈkaʊntənt/","meaning":"Kế toán","example":"She is an accountant at a big firm."}]}',
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- Segment 2 of S2: GrammarBlock at t=300
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic", "CreatedAt", "UpdatedAt"
) VALUES (
  'c2000001-0000-0000-0000-000000000003',
  'b2000001-0000-0000-0000-000000000002',
  'GrammarBlock', 'Câu Hỏi Về Nghề Nghiệp', NULL,
  300, 600, 0,
  '{"pattern":"What do you do (for a living)? / What is your job?","examples":["— What do you do? — I''m a teacher.","— What do you do for a living? — I work as an engineer.","— What is your job? — I''m a freelance designer."],"keywords":["What do you do?","What is your job?","I work as a/an","I am a/an"]}',
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Enrollments already seeded in base VPS seed (hocvien1 and hocvien2)
-- ─────────────────────────────────────────────────────────────────────────────
-- Skipped: hocvien1 + hocvien2 already enrolled in Tiếng Anh Giao Tiếp Cơ Bản

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Verify results
-- ─────────────────────────────────────────────────────────────────────────────
SELECT 'Sessions' as entity, COUNT(*) as rows FROM "Sessions" WHERE "PublishStatus" = 'Published'
UNION ALL SELECT 'SessionVideoAssets', COUNT(*) FROM "SessionVideoAssets"
UNION ALL SELECT 'Segments', COUNT(*) FROM "Segments"
UNION ALL SELECT 'LearningAssets', COUNT(*) FROM "LearningAssets";

COMMIT;
