-- Seed data: Add QuizBlock, ExerciseBlock, PPTBlock, FileAttachment
-- to existing "test 0001" sessions for testing the asset panels
-- Course:   8991e456-8acd-475f-8d70-26da5e3cb3a6  (test 0001)
-- Session1: 0f78b81f-a5fc-4f2a-8b72-8d718b6c0b92  (Session 1: Introduction to Vietnamese)
-- Session2: a2000001-0000-0000-0000-000000000001  (Session 2: Common Greetings)
-- Session3: b25ba2cb-3d07-4ff8-93ec-b8d12b5d1095  (Session 3: Advanced)
-- Seg1-3:   b1000001-0000-0000-0000-000000000003  (Part 3: Practice Dialogue, 360-480s)
-- Seg2-2:   b2000001-0000-0000-0000-000000000002  (Numbers & Basic Phrases, 300-600s)
-- Seg3-1:   f3b7238f-7140-42d2-a9a0-f14e2ec83edc  (advanced seg 01, 0-480s)

SET client_encoding = 'UTF8';
SET search_path TO tenant_demo, public;

-- ─────────────────────────────────────────────────────
-- 1. QuizBlock — Session 1, Part 3: Practice Dialogue
--    OrderIndex=5 (safe, won't collide)
-- ─────────────────────────────────────────────────────
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic",
  "CreatedAt", "UpdatedAt"
) VALUES (
  'd0000001-0000-0000-0000-000000000001',
  'b1000001-0000-0000-0000-000000000003',
  'QuizBlock',
  'Quiz: Tone Marks & Greetings',
  'Test your knowledge of Vietnamese tones and basic greetings',
  465, 480, 5,
  '{"passScore":70,"timeLimit":90,"questions":[{"text":"Which tone mark represents the RISING tone (sac)?","type":"MCQ","options":["Grave accent (huyen)","Acute accent (sac)","Tilde (nga)","No mark (ngang)"],"correct":1,"explanation":"Acute accent (sac) = rising high tone. E.g. sach (clean)."},{"text":"What does ''Xin chao'' mean?","type":"MCQ","options":["Goodbye","Thank you","Hello","Excuse me"],"correct":2,"explanation":"Xin chao is the standard Vietnamese greeting meaning Hello."},{"text":"Which pronoun does a younger person use to address an older man?","type":"MCQ","options":["Toi","Ban","Anh","Em"],"correct":2,"explanation":"Anh = older brother / respected male. Em = younger person speaking about themselves."}]}'::jsonb,
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- ─────────────────────────────────────────────────────
-- 2. ExerciseBlock — Session 2, Numbers & Basic Phrases
--    OrderIndex=5 (safe)
-- ─────────────────────────────────────────────────────
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic",
  "CreatedAt", "UpdatedAt"
) VALUES (
  'd0000001-0000-0000-0000-000000000002',
  'b2000001-0000-0000-0000-000000000002',
  'ExerciseBlock',
  'Fill in the Blank: Numbers',
  'Complete the sentences with the correct Vietnamese number',
  320, 400, 5,
  '{"type":"FillInBlank","items":[{"sentence":"Mot ___ Ba (1 __ 3)","answer":"Hai"},{"sentence":"Nam ___ Bay (5 __ 7)","answer":"Sau"},{"sentence":"Chin ___ Muoi Mot (9 __ 11)","answer":"Muoi"},{"sentence":"Toi co ___ quyen sach (I have __ books = 3)","answer":"Ba"}]}'::jsonb,
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- ─────────────────────────────────────────────────────
-- 3. PPTBlock — Session 3, Advanced Seg 01
--    OrderIndex=5 (safe, no fileUrl yet - to be uploaded)
-- ─────────────────────────────────────────────────────
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic",
  "CreatedAt", "UpdatedAt"
) VALUES (
  'd0000001-0000-0000-0000-000000000003',
  'f3b7238f-7140-42d2-a9a0-f14e2ec83edc',
  'PPTBlock',
  'Slide: Vietnamese Grammar Overview',
  'Comprehensive slides covering all grammar patterns in this session',
  30, 200, 5,
  '{"fileName":"Vietnamese_Grammar_Overview.pdf","slideCount":12}'::jsonb,
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- ─────────────────────────────────────────────────────
-- 4. FileAttachment — Session 3, Advanced Seg 01
--    OrderIndex=6
-- ─────────────────────────────────────────────────────
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic",
  "CreatedAt", "UpdatedAt"
) VALUES (
  'd0000001-0000-0000-0000-000000000004',
  'f3b7238f-7140-42d2-a9a0-f14e2ec83edc',
  'FileAttachment',
  'Download: Vocabulary Reference Sheet',
  'Full vocabulary list with IPA pronunciation and example sentences',
  60, 120, 6,
  '{"fileName":"Vietnamese_Vocabulary_Sheet.pdf","fileSize":204800}'::jsonb,
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- ─────────────────────────────────────────────────────
-- Verify: show inserted assets
-- ─────────────────────────────────────────────────────
SELECT la."Id", la."Type", la."Title", la."StartTime", la."OrderIndex"
FROM "LearningAssets" la
WHERE la."Id" IN (
  'd0000001-0000-0000-0000-000000000001',
  'd0000001-0000-0000-0000-000000000002',
  'd0000001-0000-0000-0000-000000000003',
  'd0000001-0000-0000-0000-000000000004'
)
ORDER BY la."Id";
