-- =============================================================================
-- SEED: Phase 2B Demo Data for "test 0001" course (local dev)
-- Run: psql -h localhost -U postgres -d mls -f deploy/seed-local-phase2b.sql
-- Safe to re-run: uses INSERT ... ON CONFLICT DO NOTHING
-- =============================================================================
SET search_path = tenant_demo;
BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PUBLISH existing Lessons so they appear in course detail
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE "Lessons" SET "PublishStatus" = 'Published', "DurationMinutes" = 8
WHERE "Id" IN (
  '4ce6d21c-9a30-4ba5-8d18-cf459bda719a',  -- Bai 01 (Video)
  '1498fbf1-dad1-42ff-adf6-6b6469f4800e'   -- Bai 02 (Video)
);

UPDATE "Lessons" SET "PublishStatus" = 'Published', "DurationMinutes" = 10
WHERE "Id" IN (
  '5745b010-b126-4fe7-bc65-3fc9d221f558',  -- Session 01 (Video)
  '42d62397-2f09-4122-91f0-cbe54781db20'   -- Session 02 (Video)
);

UPDATE "Lessons" SET "PublishStatus" = 'Published', "DurationMinutes" = 5, "Content" = 
'<h2>Introduction to Vietnamese Grammar</h2><p>Vietnamese is an analytic language with no inflection. Nouns and verbs are not modified for tense, gender, or number. Instead, context and separate particles convey these meanings.</p><h3>Key Features</h3><ul><li>No verb conjugation</li><li>Tonal language (6 tones)</li><li>SVO sentence structure</li></ul>'
WHERE "Id" = '8c111c59-f522-4465-a684-7d467c36e4c1';  -- Session 3 (Reading)

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. UPDATE existing Session "Simple" → rename + publish + keep DurationSeconds
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE "Sessions" SET
  "Title" = 'Session 1: Introduction to Vietnamese',
  "Description" = 'In this interactive session, explore the fundamentals of Vietnamese language with vocabulary, grammar patterns, and conversation practice.',
  "IsFreeTrial" = true,
  "DurationSeconds" = 480,
  "PublishStatus" = 'Published',
  "UpdatedAt" = NOW()
WHERE "Id" = '0f78b81f-a5fc-4f2a-8b72-8d718b6c0b92';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CREATE SessionVideoAsset for Session 1 (reuse P1 video HLS path)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO "SessionVideoAssets" (
  "Id", "SessionId", "Status", "HlsPath", "ThumbnailUrl",
  "DurationSeconds", "SizeBytes", "OriginalFileName", "CreatedAt", "UpdatedAt"
) VALUES (
  'a1000001-0000-0000-0000-000000000001',
  '0f78b81f-a5fc-4f2a-8b72-8d718b6c0b92',
  'Ready',
  'demo/videos/7a68122e-fff3-4c36-bfda-e73f4bbd6263.mp4',
  NULL,
  480, 0,
  'session1-intro.mp4',
  NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- Link video to session
UPDATE "Sessions" SET
  "VideoAssetId" = 'a1000001-0000-0000-0000-000000000001',
  "UpdatedAt" = NOW()
WHERE "Id" = '0f78b81f-a5fc-4f2a-8b72-8d718b6c0b92';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CREATE Session 2 in Module 1
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO "Sessions" (
  "Id", "ModuleId", "Title", "Description",
  "OrderIndex", "IsFreeTrial", "PublishStatus",
  "VideoAssetId", "DurationSeconds", "ThumbnailUrl",
  "CreatedAt", "UpdatedAt"
) VALUES (
  'a2000001-0000-0000-0000-000000000001',
  '77c67212-3bfb-4d47-b5f3-713836167e04',
  'Session 2: Common Greetings',
  'Practice everyday greetings and basic phrases used in Vietnamese daily conversation. Includes vocabulary drills and pronunciation tips.',
  1,
  false,
  'Published',
  NULL,
  600,
  NULL,
  NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- SessionVideoAsset for Session 2 (20-Vietnamese-Words video)
INSERT INTO "SessionVideoAssets" (
  "Id", "SessionId", "Status", "HlsPath", "ThumbnailUrl",
  "DurationSeconds", "SizeBytes", "OriginalFileName", "CreatedAt", "UpdatedAt"
) VALUES (
  'a1000001-0000-0000-0000-000000000002',
  'a2000001-0000-0000-0000-000000000001',
  'Ready',
  'demo/videos/e1b7888e-df02-42e4-bf8e-1259822c1db2.mp4',
  NULL,
  600, 0,
  'session2-greetings.mp4',
  NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- Link video to session 2
UPDATE "Sessions" SET
  "VideoAssetId" = 'a1000001-0000-0000-0000-000000000002',
  "UpdatedAt" = NOW()
WHERE "Id" = 'a2000001-0000-0000-0000-000000000001';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. CREATE Segments for Session 1 (3 segments, total 480s)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO "Segments" (
  "Id", "SessionId", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "CreatedAt", "UpdatedAt"
) VALUES
  (
    'b1000001-0000-0000-0000-000000000001',
    '0f78b81f-a5fc-4f2a-8b72-8d718b6c0b92',
    'Part 1: Getting Started',
    'Introduction to Vietnamese pronunciation basics and essential grammar structure.',
    0, 120, 0, NOW(), NOW()
  ),
  (
    'b1000001-0000-0000-0000-000000000002',
    '0f78b81f-a5fc-4f2a-8b72-8d718b6c0b92',
    'Part 2: Core Vocabulary',
    'Learn 10 essential Vietnamese words used in everyday conversation.',
    120, 360, 1, NOW(), NOW()
  ),
  (
    'b1000001-0000-0000-0000-000000000003',
    '0f78b81f-a5fc-4f2a-8b72-8d718b6c0b92',
    'Part 3: Practice Dialogue',
    'Apply what you learned in a real-world conversation scenario.',
    360, 480, 2, NOW(), NOW()
  )
ON CONFLICT ("Id") DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. CREATE Segments for Session 2 (2 segments, total 600s)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO "Segments" (
  "Id", "SessionId", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "CreatedAt", "UpdatedAt"
) VALUES
  (
    'b2000001-0000-0000-0000-000000000001',
    'a2000001-0000-0000-0000-000000000001',
    'Greetings & Introductions',
    'How to greet people and introduce yourself in Vietnamese.',
    0, 300, 0, NOW(), NOW()
  ),
  (
    'b2000001-0000-0000-0000-000000000002',
    'a2000001-0000-0000-0000-000000000001',
    'Numbers & Basic Phrases',
    'Count to 10 and use common daily phrases.',
    300, 600, 1, NOW(), NOW()
  )
ON CONFLICT ("Id") DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. CREATE LearningAssets for Session 1 Segments
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Segment 1 Assets ──────────────────────────────────────────────────────────
-- Asset 1.1: NoteBlock @ 10s
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic",
  "CreatedAt", "UpdatedAt"
) VALUES (
  'c1000001-0000-0000-0000-000000000001',
  'b1000001-0000-0000-0000-000000000001',
  'NoteBlock',
  'About This Session',
  'Key points to remember in this lesson',
  10, NULL, 0,
  '{"content":"Vietnamese is a tonal language with 6 tones. Each tone changes the meaning of a word completely. Pay close attention to the diacritical marks above vowels - they indicate the tone.","highlights":["6 tones","diacritical marks","pronunciation"]}',
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- Asset 1.2: GrammarBlock @ 45s
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic",
  "CreatedAt", "UpdatedAt"
) VALUES (
  'c1000001-0000-0000-0000-000000000002',
  'b1000001-0000-0000-0000-000000000001',
  'GrammarBlock',
  'Basic Sentence Structure (SVO)',
  'Subject + Verb + Object pattern in Vietnamese',
  45, 90, 1,
  '{"pattern":"Subject + Verb + Object","examples":[{"vi":"Toi an com","en":"I eat rice"},{"vi":"Anh ay doc sach","en":"He reads a book"},{"vi":"Co ay uong nuoc","en":"She drinks water"}],"keywords":["Subject","Verb","Object","SVO","sentence structure"]}',
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- ── Segment 2 Assets ──────────────────────────────────────────────────────────
-- Asset 2.1: VocabularyBlock @ 130s
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic",
  "CreatedAt", "UpdatedAt"
) VALUES (
  'c1000001-0000-0000-0000-000000000003',
  'b1000001-0000-0000-0000-000000000002',
  'VocabularyBlock',
  'Essential Greetings Vocabulary',
  '8 most common greeting words',
  130, NULL, 0,
  '{"words":[{"word":"xin chao","ipa":"/sin tɕao/","meaning":"hello","example":"Xin chao, ban khoe khong?","exampleTranslation":"Hello, how are you?"},{"word":"cam on","ipa":"/kɐm ɔn/","meaning":"thank you","example":"Cam on ban rat nhieu","exampleTranslation":"Thank you very much"},{"word":"xin loi","ipa":"/sin lɔɪ/","meaning":"sorry / excuse me","example":"Xin loi, ban co the noi cham hon khong?","exampleTranslation":"Sorry, could you speak more slowly?"},{"word":"tam biet","ipa":"/tɑm biɛt/","meaning":"goodbye","example":"Tam biet, hen gap lai","exampleTranslation":"Goodbye, see you again"},{"word":"vang","ipa":"/vaŋ/","meaning":"yes","example":"Vang, toi hieu roi","exampleTranslation":"Yes, I understand"},{"word":"khong","ipa":"/xoŋ/","meaning":"no","example":"Khong, cam on","exampleTranslation":"No, thank you"},{"word":"toi","ipa":"/toɪ/","meaning":"I / me","example":"Toi la sinh vien","exampleTranslation":"I am a student"},{"word":"ban","ipa":"/ɓan/","meaning":"you / friend","example":"Ban ten gi?","exampleTranslation":"What is your name?"}]}',
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- Asset 2.2: GrammarBlock @ 250s
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic",
  "CreatedAt", "UpdatedAt"
) VALUES (
  'c1000001-0000-0000-0000-000000000004',
  'b1000001-0000-0000-0000-000000000002',
  'GrammarBlock',
  'Asking Questions in Vietnamese',
  'How to form Yes/No and Wh- questions',
  250, 320, 1,
  '{"pattern":"Statement + khong? (Yes/No Question)","examples":[{"vi":"Ban khoe khong?","en":"Are you well?"},{"vi":"Day la sach khong?","en":"Is this a book?"},{"vi":"Ban ten gi? (Wh-question)","en":"What is your name?"}],"keywords":["question","khong","gi","the nao","ai","bao nhieu"]}',
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- Asset 2.3: NoteBlock @ 300s
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic",
  "CreatedAt", "UpdatedAt"
) VALUES (
  'c1000001-0000-0000-0000-000000000005',
  'b1000001-0000-0000-0000-000000000002',
  'NoteBlock',
  'Pronunciation Tip',
  'Common mispronunciation pitfall for English speakers',
  300, NULL, 2,
  '{"content":"English speakers often struggle with Vietnamese tones. The word \"ma\" can mean ghost (ma), but/cheek (ma with accent), rice seedling (ma with hook), horse (ngua), tomb (mo), or mother (me) - all depending on the tone! Practice each tone with a native speaker recording.","highlights":["tones","pronunciation","ma","6 different meanings"]}',
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- ── Segment 3 Assets ──────────────────────────────────────────────────────────
-- Asset 3.1: NoteBlock @ 370s
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic",
  "CreatedAt", "UpdatedAt"
) VALUES (
  'c1000001-0000-0000-0000-000000000006',
  'b1000001-0000-0000-0000-000000000003',
  'NoteBlock',
  'Dialogue Practice Tips',
  'How to approach this conversation exercise',
  370, NULL, 0,
  '{"content":"In the following dialogue, you will hear a typical first meeting between two Vietnamese people. Listen for the greeting patterns, the use of title + name (e.g. anh/chi/em), and how questions are answered. Try to repeat each phrase aloud!","highlights":["title + name","anh","chi","em","greeting patterns"]}',
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- Asset 3.2: GrammarBlock @ 420s
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic",
  "CreatedAt", "UpdatedAt"
) VALUES (
  'c1000001-0000-0000-0000-000000000007',
  'b1000001-0000-0000-0000-000000000003',
  'GrammarBlock',
  'Vietnamese Personal Pronouns',
  'Using anh, chi, em, toi correctly by age and context',
  420, 480, 1,
  '{"pattern":"[Pronoun based on age/relation] + [Verb] + [Object]","examples":[{"vi":"Anh la ai? (addressing older male)","en":"Who are you? (to an older male)"},{"vi":"Chi uong gi? (addressing older female)","en":"What are you drinking? (to an older female)"},{"vi":"Em hieu roi (yourself as younger)","en":"I understand (said by younger person)"}],"keywords":["anh","chi","em","toi","ban","pronouns","age-based"]}',
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. CREATE LearningAssets for Session 2 Segments
-- ─────────────────────────────────────────────────────────────────────────────

-- Asset Seg2-1.1: VocabularyBlock @ 10s (Greetings segment)
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic",
  "CreatedAt", "UpdatedAt"
) VALUES (
  'c2000001-0000-0000-0000-000000000001',
  'b2000001-0000-0000-0000-000000000001',
  'VocabularyBlock',
  'Greetings & Titles',
  'Essential titles and greeting words',
  10, NULL, 0,
  '{"words":[{"word":"chao","ipa":"/tɕao/","meaning":"hello (informal)","example":"Chao ban!","exampleTranslation":"Hi friend!"},{"word":"xin chao","ipa":"/sin tɕao/","meaning":"hello (formal)","example":"Xin chao, toi ten la Nam","exampleTranslation":"Hello, my name is Nam"},{"word":"co","ipa":"/ko/","meaning":"Ms. / she (young woman)","example":"Co ay ten la Lan","exampleTranslation":"Her name is Lan"},{"word":"ong","ipa":"/oŋ/","meaning":"Mr. / grandfather","example":"Ong ay la giao vien","exampleTranslation":"He is a teacher"},{"word":"ba","ipa":"/ɓa/","meaning":"Mrs. / grandmother","example":"Ba ay khoe khong?","exampleTranslation":"Is she well?"}]}',
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- Asset Seg2-1.2: GrammarBlock @ 120s
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic",
  "CreatedAt", "UpdatedAt"
) VALUES (
  'c2000001-0000-0000-0000-000000000002',
  'b2000001-0000-0000-0000-000000000001',
  'GrammarBlock',
  'Self-Introduction Pattern',
  'How to introduce yourself in Vietnamese',
  120, 200, 1,
  '{"pattern":"Toi ten la [Name] / Toi la [Name]","examples":[{"vi":"Toi ten la Minh. Toi la sinh vien.","en":"My name is Minh. I am a student."},{"vi":"Xin chao, toi la giao vien tieng Anh.","en":"Hello, I am an English teacher."},{"vi":"Toi den tu Ha Noi.","en":"I come from Hanoi."}],"keywords":["ten la","la","sinh vien","giao vien","den tu"]}',
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- Asset Seg2-2.1: VocabularyBlock @ 310s (Numbers segment)
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic",
  "CreatedAt", "UpdatedAt"
) VALUES (
  'c2000001-0000-0000-0000-000000000003',
  'b2000001-0000-0000-0000-000000000002',
  'VocabularyBlock',
  'Numbers 1-10',
  'Count from one to ten in Vietnamese',
  310, NULL, 0,
  '{"words":[{"word":"mot","ipa":"/mot/","meaning":"one (1)","example":"Mot cai banh","exampleTranslation":"One cake"},{"word":"hai","ipa":"/haɪ/","meaning":"two (2)","example":"Hai ban be","exampleTranslation":"Two friends"},{"word":"ba","ipa":"/ɓa/","meaning":"three (3)","example":"Ba nguoi","exampleTranslation":"Three people"},{"word":"bon","ipa":"/ɓon/","meaning":"four (4)","example":"Bon cai ghe","exampleTranslation":"Four chairs"},{"word":"nam","ipa":"/nam/","meaning":"five (5)","example":"Nam dong ho","exampleTranslation":"Five clocks"},{"word":"sau","ipa":"/saʊ/","meaning":"six (6)","example":"Sau quyen sach","exampleTranslation":"Six books"},{"word":"bay","ipa":"/ɓaj/","meaning":"seven (7)","example":"Bay cai but","exampleTranslation":"Seven pens"},{"word":"tam","ipa":"/tam/","meaning":"eight (8)","example":"Tam coc che","exampleTranslation":"Eight cups of tea"},{"word":"chin","ipa":"/tɕin/","meaning":"nine (9)","example":"Chin bong hoa","exampleTranslation":"Nine flowers"},{"word":"muoi","ipa":"/muɔɪ/","meaning":"ten (10)","example":"Muoi hoc sinh","exampleTranslation":"Ten students"}]}',
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- Asset Seg2-2.2: NoteBlock @ 500s
INSERT INTO "LearningAssets" (
  "Id", "SegmentId", "Type", "Title", "Description",
  "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic",
  "CreatedAt", "UpdatedAt"
) VALUES (
  'c2000001-0000-0000-0000-000000000004',
  'b2000001-0000-0000-0000-000000000002',
  'NoteBlock',
  'Numbers in Practice',
  'How Vietnamese numbers are used in real conversation',
  500, NULL, 1,
  '{"content":"In Vietnamese, numbers come BEFORE the classifier (measure word). For example: \"hai quyen sach\" = two (books) not \"quyen sach hai\". Common classifiers: con (animals), cai (objects), nguoi (people), quyen (books), to (sheets).","highlights":["classifier","measure word","con","cai","nguoi","quyen"]}',
  true, NOW(), NOW()
) ON CONFLICT ("Id") DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. ADD ENROLLMENT for existing student users
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO "CourseEnrollments" ("Id", "UserId", "CourseId", "EnrolledAt")
VALUES 
  ('d1000001-0000-0000-0000-000000000001',
   '3c35647e-672d-4dcb-add7-73fc01e82ca6',  -- student@demo.com
   '8991e456-8acd-475f-8d70-26da5e3cb3a6',  -- test 0001
   NOW())
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "CourseEnrollments" ("Id", "UserId", "CourseId", "EnrolledAt")
VALUES 
  ('d1000001-0000-0000-0000-000000000002',
   'c6f6b1dc-b9d7-41d1-9c22-dbc548e14753',  -- sudent01@gmail.com
   '8991e456-8acd-475f-8d70-26da5e3cb3a6',  -- test 0001
   NOW())
ON CONFLICT ("Id") DO NOTHING;

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY
-- ─────────────────────────────────────────────────────────────────────────────
SELECT 'Course' AS entity, COUNT(*) AS rows FROM "Courses" WHERE "Id" = '8991e456-8acd-475f-8d70-26da5e3cb3a6'
UNION ALL SELECT 'Lessons Published', COUNT(*) FROM "Lessons" WHERE "PublishStatus" = 'Published'
UNION ALL SELECT 'Sessions', COUNT(*) FROM "Sessions" WHERE "ModuleId" IN ('77c67212-3bfb-4d47-b5f3-713836167e04','f7297383-6570-49b7-8cfa-0c0e3c755bb8')
UNION ALL SELECT 'SessionVideoAssets', COUNT(*) FROM "SessionVideoAssets"
UNION ALL SELECT 'Segments', COUNT(*) FROM "Segments"
UNION ALL SELECT 'LearningAssets', COUNT(*) FROM "LearningAssets"
UNION ALL SELECT 'Enrollments', COUNT(*) FROM "CourseEnrollments";
