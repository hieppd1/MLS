-- =============================================================================
-- SEED: Khóa học "Tiếng Việt Cơ Bản cho Người Nước Ngoài"
-- 3 session gắn với 3 video demo thực tế (Day 1/2/4 của series 123Vietnamese)
--
-- Video files cần có trên server tại /opt/mls/media/demo/videos/:
--   viet-phu-am-day1.mp4        (47.7 MB ~800s)
--   viet-nguyen-am-day2.mp4     (16.9 MB ~270s)
--   viet-chao-hoi-day4.mp4      (54.1 MB ~900s)
--
-- Chạy: docker exec -i mls_postgres psql -U mls_user -d mls < /tmp/seed-viet-course.sql
-- =============================================================================

SET client_encoding = 'UTF8';
SET search_path TO tenant_demo, public;

BEGIN;

-- =============================================================================
-- 1. COURSE
-- =============================================================================
INSERT INTO "Courses" (
  "Id","Title","Code","Description","ShortDescription","Slug",
  "Level","Language","ThumbnailUrl","Tags","Duration",
  "Status","Visibility","IsFree","CertificateEnabled","CompletionRequired",
  "TeacherId","CreatedBy","PublishedAt","Price","DiscountPrice","CreatedAt"
) VALUES (
  'd0000002-0000-0000-0000-000000000001',
  'Tiếng Việt Cơ Bản cho Người Nước Ngoài',
  'VIET01',
  'Khóa học tiếng Việt dành cho người nước ngoài mới bắt đầu. Bạn sẽ học cách phát âm chuẩn các phụ âm, nguyên âm, sau đó thực hành chào hỏi và giao tiếp cơ bản trong cuộc sống hàng ngày.',
  'Học tiếng Việt từ con số 0 — phát âm chuẩn, giao tiếp tự nhiên',
  'tieng-viet-co-ban-cho-nguoi-nuoc-ngoai',
  1, 'VI',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
  'tiếng Việt,Vietnamese,beginner,phát âm',
  1970,
  'Published', 'Public', false, true, false,
  'b0000001-0000-0000-0000-000000000001',
  'a0000001-0000-0000-0000-000000000002',
  NOW() - INTERVAL '3 days',
  399000, 299000,
  NOW() - INTERVAL '5 days'
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- 2. MODULE
-- =============================================================================
INSERT INTO "CourseModules" (
  "Id","CourseId","LevelId","Title","Description","OrderIndex","IsLocked","CreatedAt"
) VALUES (
  'e0000002-0000-0000-0000-000000000001',
  'd0000002-0000-0000-0000-000000000001',
  NULL,
  'Module 1: Âm Thanh Tiếng Việt',
  'Nắm vững hệ thống phụ âm, nguyên âm và thanh điệu — nền tảng để phát âm chuẩn tiếng Việt',
  0, false, NOW()
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- 3. SESSIONS
-- =============================================================================
INSERT INTO "Sessions" (
  "Id","ModuleId","Title","Description","OrderIndex",
  "IsFreeTrial","PublishStatus","SessionType","DurationSeconds","CreatedAt","UpdatedAt"
) VALUES
-- Session 1: Phụ Âm
(
  'f0000003-0000-0000-0000-000000000001',
  'e0000002-0000-0000-0000-000000000001',
  'Bài 1: Phụ Âm Tiếng Việt',
  'Học toàn bộ 22 phụ âm đầu và các phụ âm cuối trong tiếng Việt. Từng âm được phát âm chậm, rõ với ví dụ từ thực tế.',
  0, true, 'Published', 'Interactive', 800,
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
-- Session 2: Nguyên Âm Đơn
(
  'f0000003-0000-0000-0000-000000000002',
  'e0000002-0000-0000-0000-000000000001',
  'Bài 2: Nguyên Âm Đơn Tiếng Việt',
  'Hệ thống 11 nguyên âm đơn của tiếng Việt: a, ă, â, e, ê, i, o, ô, ơ, u, ư. Cách đặt miệng, lưỡi và luyện phát âm từng âm.',
  1, false, 'Published', 'Interactive', 270,
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
-- Session 3: Chào Hỏi & Tạm Biệt
(
  'f0000003-0000-0000-0000-000000000003',
  'e0000002-0000-0000-0000-000000000001',
  'Bài 3: Chào Hỏi & Tạm Biệt',
  'Thực hành các mẫu câu chào hỏi, hỏi thăm sức khỏe, giới thiệu bản thân và tạm biệt thường dùng trong cuộc sống hàng ngày.',
  2, false, 'Published', 'Interactive', 900,
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 4. SESSION VIDEO ASSETS
-- =============================================================================
INSERT INTO "SessionVideoAssets" (
  "Id","SessionId","Status","HlsPath","ThumbnailUrl",
  "DurationSeconds","SizeBytes","OriginalFileName","CreatedAt","UpdatedAt"
) VALUES
(
  'a3000001-0000-0000-0000-000000000001',
  'f0000003-0000-0000-0000-000000000001',
  'Ready',
  'demo/videos/viet-phu-am-day1.mp4',
  NULL,
  800, 50019942,
  'YTDown_YouTube_1-Day-tieng-Viet-Phu-am-123Vietnamese_Media_5bVqUZBvmz4_004_360p.mp4',
  NOW(), NOW()
),
(
  'a3000001-0000-0000-0000-000000000002',
  'f0000003-0000-0000-0000-000000000002',
  'Ready',
  'demo/videos/viet-nguyen-am-day2.mp4',
  NULL,
  270, 17726054,
  'YTDown_YouTube_2-Day-tieng-Viet-Nguyen-am-don-123Vietna_Media_wLmERFUxdyA_003_360p.mp4',
  NOW(), NOW()
),
(
  'a3000001-0000-0000-0000-000000000003',
  'f0000003-0000-0000-0000-000000000003',
  'Ready',
  'demo/videos/viet-chao-hoi-day4.mp4',
  NULL,
  900, 56729190,
  'YTDown_YouTube_4-Day-tieng-Viet-Chao-hoi-tam-biet-va-da_Media_bm133KdODU0_003_360p.mp4',
  NOW(), NOW()
)
ON CONFLICT DO NOTHING;

-- Link video assets to sessions
UPDATE "Sessions" SET "VideoAssetId" = 'a3000001-0000-0000-0000-000000000001', "UpdatedAt" = NOW()
WHERE "Id" = 'f0000003-0000-0000-0000-000000000001';

UPDATE "Sessions" SET "VideoAssetId" = 'a3000001-0000-0000-0000-000000000002', "UpdatedAt" = NOW()
WHERE "Id" = 'f0000003-0000-0000-0000-000000000002';

UPDATE "Sessions" SET "VideoAssetId" = 'a3000001-0000-0000-0000-000000000003', "UpdatedAt" = NOW()
WHERE "Id" = 'f0000003-0000-0000-0000-000000000003';

-- =============================================================================
-- 5. SEGMENTS — Session 1: Phụ Âm (800s)
-- =============================================================================
INSERT INTO "Segments" (
  "Id","SessionId","Title","Description","StartTime","EndTime","OrderIndex","CreatedAt","UpdatedAt"
) VALUES
(
  'c3000001-0000-0000-0000-000000000001',
  'f0000003-0000-0000-0000-000000000001',
  'Giới thiệu: Hệ thống phụ âm tiếng Việt',
  'Tổng quan về 22 phụ âm đầu và các phụ âm cuối. Điểm khác biệt với tiếng Anh.',
  0, 90, 0, NOW(), NOW()
),
(
  'c3000001-0000-0000-0000-000000000002',
  'f0000003-0000-0000-0000-000000000001',
  'Nhóm 1: B, C/K/Q, CH, D/GI, Đ',
  'Phụ âm môi B, hai biến thể của K (c/k/q), phụ âm CH, D đọc như Z (miền Nam) hoặc Y (miền Bắc), và Đ.',
  90, 270, 1, NOW(), NOW()
),
(
  'c3000001-0000-0000-0000-000000000003',
  'f0000003-0000-0000-0000-000000000001',
  'Nhóm 2: G/GH, H, KH, L, M, N',
  'Phụ âm cổ G (viết GH trước i/e/ê), H không bật hơi, KH hơi gần X, L rung lưỡi, M và N mũi.',
  270, 450, 2, NOW(), NOW()
),
(
  'c3000001-0000-0000-0000-000000000004',
  'f0000003-0000-0000-0000-000000000001',
  'Nhóm 3: NG/NGH, NH, PH, R, S/X, T/TH/TR',
  'Âm mũi NG (ngân nga), NH như "ny", PH = F, R cuộn lưỡi (miền Nam), S và X gần giống nhau, T bật hơi nhẹ, TH và TR đặc trưng.',
  450, 650, 3, NOW(), NOW()
),
(
  'c3000001-0000-0000-0000-000000000005',
  'f0000003-0000-0000-0000-000000000001',
  'Phụ âm cuối & luyện tập tổng hợp',
  'Các phụ âm cuối -c, -ch, -m, -n, -ng, -nh, -p, -t. Luyện đọc từ ghép có phụ âm đầu và cuối.',
  650, 800, 4, NOW(), NOW()
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 6. SEGMENTS — Session 2: Nguyên Âm Đơn (270s)
-- =============================================================================
INSERT INTO "Segments" (
  "Id","SessionId","Title","Description","StartTime","EndTime","OrderIndex","CreatedAt","UpdatedAt"
) VALUES
(
  'c3000002-0000-0000-0000-000000000001',
  'f0000003-0000-0000-0000-000000000002',
  'Giới thiệu: 11 nguyên âm đơn',
  'Tổng quan bảng nguyên âm tiếng Việt. So sánh với tiếng Anh — tiếng Việt có nhiều nguyên âm hơn.',
  0, 60, 0, NOW(), NOW()
),
(
  'c3000002-0000-0000-0000-000000000002',
  'f0000003-0000-0000-0000-000000000002',
  'Nguyên âm hàng trước: A, Ă, Â',
  'A — miệng mở rộng; Ă — ngắn hơn A; Â — âm giữa, miệng hé mở.',
  60, 150, 1, NOW(), NOW()
),
(
  'c3000002-0000-0000-0000-000000000003',
  'f0000003-0000-0000-0000-000000000002',
  'Nguyên âm hàng giữa: E, Ê, I/Y',
  'E — như "e" tiếng Anh trong "bed"; Ê — miệng hé, môi trải ra; I/Y — i cao, ngắn.',
  150, 210, 2, NOW(), NOW()
),
(
  'c3000002-0000-0000-0000-000000000004',
  'f0000003-0000-0000-0000-000000000002',
  'Nguyên âm hàng sau: O, Ô, Ơ, U, Ư',
  'O tròn môi; Ô tròn hơn; Ơ không tròn môi; U tròn khép; Ư không tròn môi khép.',
  210, 270, 3, NOW(), NOW()
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 7. SEGMENTS — Session 3: Chào Hỏi & Tạm Biệt (900s)
-- =============================================================================
INSERT INTO "Segments" (
  "Id","SessionId","Title","Description","StartTime","EndTime","OrderIndex","CreatedAt","UpdatedAt"
) VALUES
(
  'c3000003-0000-0000-0000-000000000001',
  'f0000003-0000-0000-0000-000000000003',
  'Giới thiệu: Văn hóa chào hỏi Việt Nam',
  'Người Việt dùng đại từ nhân xưng thay vì I/You. Anh/Chị/Em/Bạn — cách chọn đúng đại từ.',
  0, 120, 0, NOW(), NOW()
),
(
  'c3000003-0000-0000-0000-000000000002',
  'f0000003-0000-0000-0000-000000000003',
  'Xin chào! — Các hình thức chào cơ bản',
  'Xin chào / Chào anh/chị / Chào buổi sáng/chiều/tối. Cách phát âm đúng và ngữ cảnh sử dụng.',
  120, 330, 1, NOW(), NOW()
),
(
  'c3000003-0000-0000-0000-000000000003',
  'f0000003-0000-0000-0000-000000000003',
  'Hỏi thăm sức khỏe',
  'Bạn có khỏe không? / Khỏe, cảm ơn! / Bình thường. / Không khỏe lắm. Cách trả lời lịch sự.',
  330, 510, 2, NOW(), NOW()
),
(
  'c3000003-0000-0000-0000-000000000004',
  'f0000003-0000-0000-0000-000000000003',
  'Giới thiệu bản thân',
  'Tôi tên là... / Tôi là người... / Tôi đến từ... / Tôi học tiếng Việt được... Mẫu câu tự giới thiệu hoàn chỉnh.',
  510, 720, 3, NOW(), NOW()
),
(
  'c3000003-0000-0000-0000-000000000005',
  'f0000003-0000-0000-0000-000000000003',
  'Tạm biệt & Hẹn gặp lại',
  'Tạm biệt / Chào nhé / Hẹn gặp lại / Hẹn gặp mai / Chúc ngủ ngon. Các tình huống chia tay khác nhau.',
  720, 900, 4, NOW(), NOW()
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 8. LEARNING ASSETS — Session 1: Phụ Âm
-- =============================================================================

-- Seg 1: Giới thiệu → NoteBlock tổng quan bảng chữ
INSERT INTO "LearningAssets" (
  "Id","SegmentId","Type","Title","Description",
  "StartTime","EndTime","OrderIndex","Metadata","IsPublic","CreatedAt","UpdatedAt"
) VALUES (
  '1a300001-0000-0000-0000-000000000001',
  'c3000001-0000-0000-0000-000000000001',
  'NoteBlock',
  'Bảng phụ âm tiếng Việt',
  'Toàn bộ 22 phụ âm đầu và 8 phụ âm cuối trong tiếng Việt',
  10, NULL, 0,
  '{"content":"## Phụ âm đầu (22 âm)\n| Chữ viết | IPA | Ví dụ |\n|---|---|---|\n| b | /ɓ/ | ba (three) |\n| c / k / q | /k/ | ca, khi, quà |\n| ch | /c/ | chào |\n| d (Bắc) / gi | /z/ | dài, già |\n| đ | /ɗ/ | đi |\n| g / gh | /ɣ/ | ga, ghế |\n| h | /h/ | hoa |\n| kh | /x/ | không |\n| l | /l/ | làm |\n| m | /m/ | mẹ |\n| n | /n/ | nhà |\n| ng / ngh | /ŋ/ | ngon, nghề |\n| nh | /ɲ/ | nhà |\n| ph | /f/ | phở |\n| r | /r/ | rau |\n| s | /s/ | sách |\n| t | /t/ | tay |\n| th | /tʰ/ | thầy |\n| tr | /ʈ/ | trời |\n| v | /v/ | vui |\n| x | /s/ | xe |\n\n## Phụ âm cuối (8 âm)\n-c, -ch, -m, -n, -ng, -nh, -p, -t"}'::jsonb,
  true, NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Seg 2: Nhóm 1 → VocabularyBlock từ ví dụ phụ âm B-Đ
INSERT INTO "LearningAssets" (
  "Id","SegmentId","Type","Title","Description",
  "StartTime","EndTime","OrderIndex","Metadata","IsPublic","CreatedAt","UpdatedAt"
) VALUES (
  '1a300001-0000-0000-0000-000000000002',
  'c3000001-0000-0000-0000-000000000002',
  'VocabularyBlock',
  'Từ vựng: Phụ âm B, C/K/Q, CH, D, Đ',
  'Từ thực tế minh họa từng phụ âm trong nhóm 1',
  100, NULL, 0,
  '{"words":[{"word":"bạn","pronunciation":"baan (falling tone)","meaning":"friend","example":"Bạn là người nước ngoài à?"},{"word":"cảm ơn","pronunciation":"kahm un","meaning":"thank you","example":"Cảm ơn bạn rất nhiều!"},{"word":"chào","pronunciation":"chow","meaning":"hello / goodbye","example":"Xin chào!"},{"word":"đi","pronunciation":"dee","meaning":"to go","example":"Tôi đi học."},{"word":"quà","pronunciation":"kwaa","meaning":"gift","example":"Đây là quà cho bạn."}]}'::jsonb,
  true, NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Seg 3: Nhóm 2 → VocabularyBlock từ ví dụ G-N
INSERT INTO "LearningAssets" (
  "Id","SegmentId","Type","Title","Description",
  "StartTime","EndTime","OrderIndex","Metadata","IsPublic","CreatedAt","UpdatedAt"
) VALUES (
  '1a300001-0000-0000-0000-000000000003',
  'c3000001-0000-0000-0000-000000000003',
  'VocabularyBlock',
  'Từ vựng: Phụ âm G, H, KH, L, M, N',
  'Từ thực tế minh họa từng phụ âm trong nhóm 2',
  280, NULL, 0,
  '{"words":[{"word":"ghế","pronunciation":"geh","meaning":"chair","example":"Mời ngồi ghế."},{"word":"hoa","pronunciation":"hwaa","meaning":"flower","example":"Hoa rất đẹp."},{"word":"không","pronunciation":"khom","meaning":"no / not","example":"Tôi không hiểu."},{"word":"làm ơn","pronunciation":"laam un","meaning":"please","example":"Làm ơn nói chậm hơn."},{"word":"mẹ","pronunciation":"meh","meaning":"mother","example":"Mẹ tôi người Việt Nam."},{"word":"nhà","pronunciation":"nyaa","meaning":"house / home","example":"Nhà tôi ở Hà Nội."}]}'::jsonb,
  true, NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Seg 4: Nhóm 3 → GrammarBlock quy tắc D/GI vs R/S
INSERT INTO "LearningAssets" (
  "Id","SegmentId","Type","Title","Description",
  "StartTime","EndTime","OrderIndex","Metadata","IsPublic","CreatedAt","UpdatedAt"
) VALUES (
  '1a300001-0000-0000-0000-000000000004',
  'c3000001-0000-0000-0000-000000000004',
  'GrammarBlock',
  'Quy tắc phát âm vùng miền: Bắc vs Nam',
  'Một số phụ âm phát âm khác nhau giữa miền Bắc và miền Nam Việt Nam',
  460, NULL, 0,
  '{"title":"Khác biệt phát âm Bắc — Nam","rules":[{"rule":"D và GI","north":"Đọc như /z/ — dài, già","south":"Đọc như /j/ — dài, già"},{"rule":"R","north":"Đọc như /z/ — rau, rừng","south":"Đọc nhẹ như /r/ cuộn lưỡi"},{"rule":"X và S","north":"X = /s/, S = /s/ (giống nhau)","south":"Phân biệt rõ hơn ở một số vùng"},{"rule":"TR","north":"Đọc như /ʈ/ — trời, trắng","south":"Gần với /tʃ/ — nghe gần CH"}],"tip":"Cả hai cách phát âm đều đúng. Người Việt hiểu được cả hai giọng. Nên chọn một giọng và nhất quán."}'::jsonb,
  true, NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Seg 5: Phụ âm cuối → QuizBlock
INSERT INTO "LearningAssets" (
  "Id","SegmentId","Type","Title","Description",
  "StartTime","EndTime","OrderIndex","Metadata","IsPublic","CreatedAt","UpdatedAt"
) VALUES (
  '1a300001-0000-0000-0000-000000000005',
  'c3000001-0000-0000-0000-000000000005',
  'QuizBlock',
  'Quiz: Phụ Âm Tiếng Việt',
  'Kiểm tra hiểu biết về phụ âm đầu và phụ âm cuối',
  660, 800, 0,
  '{"passScore":70,"timeLimit":120,"questions":[{"text":"Chữ \"ch\" trong tiếng Việt đọc giống âm nào trong tiếng Anh?","type":"MCQ","options":["\"ch\" trong \"church\"","\"k\" trong \"king\"","\"sh\" trong \"ship\"","\"j\" trong \"jam\""],"correct":0,"explanation":"\"ch\" tiếng Việt đọc giống \"ch\" trong \"church\" — âm /c/ bật hơi nhẹ."},{"text":"Phụ âm nào KHÔNG xuất hiện ở cuối từ trong tiếng Việt?","type":"MCQ","options":["-m","-l","-n","-p"],"correct":1,"explanation":"Tiếng Việt không có phụ âm cuối -l. Các phụ âm cuối là: -c, -ch, -m, -n, -ng, -nh, -p, -t."},{"text":"\"không\" nghĩa là gì?","type":"MCQ","options":["yes","hello","no / not","thank you"],"correct":2,"explanation":"\"không\" = no / not. Ví dụ: Tôi không hiểu = I don''t understand."},{"text":"Phụ âm \"ph\" trong tiếng Việt đọc như âm gì?","type":"MCQ","options":["/p/","/f/","/ph/ bật hơi","/b/"],"correct":1,"explanation":"\"ph\" = /f/ như \"f\" trong \"food\". Ví dụ: phở, phải, phần."}]}'::jsonb,
  true, NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- 9. LEARNING ASSETS — Session 2: Nguyên Âm Đơn
-- =============================================================================

-- Seg 1: Giới thiệu → NoteBlock bảng tổng quan
INSERT INTO "LearningAssets" (
  "Id","SegmentId","Type","Title","Description",
  "StartTime","EndTime","OrderIndex","Metadata","IsPublic","CreatedAt","UpdatedAt"
) VALUES (
  '1a300002-0000-0000-0000-000000000001',
  'c3000002-0000-0000-0000-000000000001',
  'NoteBlock',
  'Bảng 11 nguyên âm đơn tiếng Việt',
  'Tổng quan với IPA và cách đặt miệng',
  5, NULL, 0,
  '{"content":"## 11 Nguyên Âm Đơn\n\n| Âm | IPA | Môi | Lưỡi | Ví dụ |\n|---|---|---|---|---|\n| a | /aː/ | Mở rộng | Thấp | ba, ma, ta |\n| ă | /a/ | Mở rộng ngắn | Thấp ngắn | ăn, tắm |\n| â | /əː/ | Hé mở | Giữa | ân, cân |\n| e | /ɛ/ | Hé, trải | Giữa-thấp | xe, me |\n| ê | /e/ | Trải | Giữa-cao | bê, chê |\n| i / y | /i/ | Trải khép | Cao | đi, ý |\n| o | /ɔ/ | Tròn | Thấp | bo, mo |\n| ô | /o/ | Tròn vừa | Giữa | tô, bô |\n| ơ | /əː/ | Hé, không tròn | Giữa | bơ, cơm |\n| u | /u/ | Tròn khép | Cao | tu, bu |\n| ư | /ɯ/ | Không tròn khép | Cao | tư, bư |\n\n💡 **Mẹo**: ă ngắn hơn a; â và ơ đều là âm giữa nhưng â ngắn hơn ơ."}'::jsonb,
  true, NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Seg 2: A, Ă, Â → VocabularyBlock
INSERT INTO "LearningAssets" (
  "Id","SegmentId","Type","Title","Description",
  "StartTime","EndTime","OrderIndex","Metadata","IsPublic","CreatedAt","UpdatedAt"
) VALUES (
  '1a300002-0000-0000-0000-000000000002',
  'c3000002-0000-0000-0000-000000000002',
  'VocabularyBlock',
  'Từ vựng: Âm A, Ă, Â',
  'Từ thực tế luyện nguyên âm hàng trước',
  65, NULL, 0,
  '{"words":[{"word":"ba","pronunciation":"baa (ngang)","meaning":"three / father","example":"Ba tôi tên là Nam."},{"word":"ăn","pronunciation":"an (ngang, short)","meaning":"to eat","example":"Bạn có muốn ăn phở không?"},{"word":"ân","pronunciation":"un (ngang, mid)","meaning":"grace / favor","example":"Cảm ơn = Thank you (tạm dịch)"},{"word":"năm","pronunciation":"naam","meaning":"five / year","example":"Năm nay tôi học tiếng Việt."},{"word":"cân","pronunciation":"kun","meaning":"kilogram / to weigh","example":"Tôi nặng 65 cân."}]}'::jsonb,
  true, NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Seg 3: E, Ê, I → VocabularyBlock
INSERT INTO "LearningAssets" (
  "Id","SegmentId","Type","Title","Description",
  "StartTime","EndTime","OrderIndex","Metadata","IsPublic","CreatedAt","UpdatedAt"
) VALUES (
  '1a300002-0000-0000-0000-000000000003',
  'c3000002-0000-0000-0000-000000000003',
  'VocabularyBlock',
  'Từ vựng: Âm E, Ê, I/Y',
  'Từ thực tế luyện nguyên âm hàng giữa',
  155, NULL, 0,
  '{"words":[{"word":"xe","pronunciation":"seh","meaning":"vehicle / car","example":"Tôi đi xe máy."},{"word":"bê","pronunciation":"beh","meaning":"calf (animal) / to carry","example":"Bê nhẹ nhàng thôi!"},{"word":"đi","pronunciation":"dee","meaning":"to go","example":"Chúng ta đi ăn nhé."},{"word":"bí","pronunciation":"bee (falling)","meaning":"secret / pumpkin","example":"Bí ẩn = mystery"},{"word":"kỳ","pronunciation":"kee (falling, long)","meaning":"period / strange","example":"Kỳ này tôi học tiếng Việt."}]}'::jsonb,
  true, NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Seg 4: O, Ô, Ơ, U, Ư → QuizBlock
INSERT INTO "LearningAssets" (
  "Id","SegmentId","Type","Title","Description",
  "StartTime","EndTime","OrderIndex","Metadata","IsPublic","CreatedAt","UpdatedAt"
) VALUES (
  '1a300002-0000-0000-0000-000000000004',
  'c3000002-0000-0000-0000-000000000004',
  'QuizBlock',
  'Quiz: Phân biệt O/Ô/Ơ và U/Ư',
  'Kiểm tra khả năng phân biệt các cặp nguyên âm dễ nhầm lẫn',
  215, 270, 0,
  '{"passScore":70,"timeLimit":90,"questions":[{"text":"\"Phở\" chứa nguyên âm nào?","type":"MCQ","options":["o","ô","ơ","u"],"correct":2,"explanation":"Phở = /fəː/ — âm ơ (không tròn môi, miệng hé mở). Đây là âm đặc trưng khó nhất với người nước ngoài."},{"text":"Điểm khác biệt giữa \"u\" và \"ư\" là gì?","type":"MCQ","options":["u ngắn hơn ư","u tròn môi, ư không tròn môi","ư cao hơn u","Không có sự khác biệt"],"correct":1,"explanation":"u = /u/ tròn môi như \"oo\" trong \"moon\"; ư = /ɯ/ không tròn môi, đặc trưng của tiếng Việt."},{"text":"Từ nào chứa nguyên âm \"ô\"?","type":"MCQ","options":["bơ","bô","bo","bổ"],"correct":1,"explanation":"bô = /bo/ với ô tròn môi vừa. bơ dùng ơ, bo dùng o, bổ cũng dùng ô nhưng có thanh hỏi."}]}'::jsonb,
  true, NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- 10. LEARNING ASSETS — Session 3: Chào Hỏi
-- =============================================================================

-- Seg 1: Văn hóa → NoteBlock đại từ nhân xưng
INSERT INTO "LearningAssets" (
  "Id","SegmentId","Type","Title","Description",
  "StartTime","EndTime","OrderIndex","Metadata","IsPublic","CreatedAt","UpdatedAt"
) VALUES (
  '1a300003-0000-0000-0000-000000000001',
  'c3000003-0000-0000-0000-000000000001',
  'NoteBlock',
  'Đại từ nhân xưng tiếng Việt',
  'Hướng dẫn chọn đại từ đúng theo tuổi và mối quan hệ',
  10, NULL, 0,
  '{"content":"## Đại từ nhân xưng (Pronouns)\n\nTiếng Việt dùng đại từ theo **mối quan hệ & tuổi tác** thay vì I/You cố định.\n\n| Đại từ | Dùng khi | Tự xưng là |\n|---|---|---|\n| **tôi** | Trung lập, lịch sự | tôi |\n| **bạn** | Với người cùng tuổi, thân thiện | bạn |\n| **anh** | Gọi người nam lớn tuổi hơn | em |\n| **chị** | Gọi người nữ lớn tuổi hơn | em |\n| **em** | Gọi người nhỏ tuổi hơn | anh/chị |\n| **ông** | Gọi ông lão / người già nam | cháu |\n| **bà** | Gọi bà lão / người già nữ | cháu |\n\n💡 **Gợi ý cho người nước ngoài**: Dùng **\"tôi\"** tự xưng và **\"bạn\"** gọi người khác là an toàn nhất trong mọi tình huống."}'::jsonb,
  true, NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Seg 2: Xin chào → VocabularyBlock lời chào
INSERT INTO "LearningAssets" (
  "Id","SegmentId","Type","Title","Description",
  "StartTime","EndTime","OrderIndex","Metadata","IsPublic","CreatedAt","UpdatedAt"
) VALUES (
  '1a300003-0000-0000-0000-000000000002',
  'c3000003-0000-0000-0000-000000000002',
  'VocabularyBlock',
  'Từ vựng: Các lời chào thông dụng',
  'Tập hợp đầy đủ các cách chào theo thời điểm và ngữ cảnh',
  130, NULL, 0,
  '{"words":[{"word":"Xin chào","pronunciation":"sin chow","meaning":"Hello (formal)","example":"Xin chào, tôi tên là John."},{"word":"Chào bạn","pronunciation":"chow baan","meaning":"Hi (informal, to peer)","example":"Chào bạn! Lâu không gặp."},{"word":"Chào buổi sáng","pronunciation":"chow bwoi saang","meaning":"Good morning","example":"Chào buổi sáng! Bạn có khỏe không?"},{"word":"Chào buổi chiều","pronunciation":"chow bwoi chyew","meaning":"Good afternoon","example":"Chào buổi chiều anh ơi!"},{"word":"Chào buổi tối","pronunciation":"chow bwoi toi","meaning":"Good evening","example":"Chào buổi tối! Mời vào nhà."}]}'::jsonb,
  true, NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Seg 3: Hỏi thăm → GrammarBlock cấu trúc câu hỏi
INSERT INTO "LearningAssets" (
  "Id","SegmentId","Type","Title","Description",
  "StartTime","EndTime","OrderIndex","Metadata","IsPublic","CreatedAt","UpdatedAt"
) VALUES (
  '1a300003-0000-0000-0000-000000000003',
  'c3000003-0000-0000-0000-000000000003',
  'GrammarBlock',
  'Cấu trúc câu hỏi thăm sức khỏe',
  'Mẫu câu hỏi "có...không?" và các câu trả lời thông dụng',
  340, NULL, 0,
  '{"title":"Mẫu câu: Có...không? (Do you...?)","rules":[{"rule":"Câu hỏi: Bạn có khỏe không?","explanation":"Có [adjective/verb] không? = Are you [adj]? / Do you [verb]? Trả lời Yes: Có, tôi [adj]. / No: Không, tôi không [adj]."},{"rule":"Các câu trả lời","explanation":"✓ Khỏe, cảm ơn! (Fine, thank you!)\n✓ Bình thường. (So-so.)\n✓ Không khỏe lắm. (Not so well.)\n✓ Mệt lắm. (Very tired.)"},{"rule":"Mở rộng: hỏi về sở thích","explanation":"Bạn có thích phở không? = Do you like pho?\nCó, tôi thích lắm! = Yes, I like it a lot!"}],"examples":[{"vn":"Bạn có khỏe không?","en":"Are you well?"},{"vn":"Khỏe, cảm ơn bạn!","en":"Fine, thank you!"},{"vn":"Bạn có đói không?","en":"Are you hungry?"}]}'::jsonb,
  true, NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Seg 4: Giới thiệu bản thân → VocabularyBlock + ExerciseBlock
INSERT INTO "LearningAssets" (
  "Id","SegmentId","Type","Title","Description",
  "StartTime","EndTime","OrderIndex","Metadata","IsPublic","CreatedAt","UpdatedAt"
) VALUES (
  '1a300003-0000-0000-0000-000000000004',
  'c3000003-0000-0000-0000-000000000004',
  'VocabularyBlock',
  'Từ vựng: Giới thiệu bản thân',
  'Các từ và cụm từ cần để giới thiệu bản thân bằng tiếng Việt',
  515, NULL, 0,
  '{"words":[{"word":"Tôi tên là...","pronunciation":"toi ten laa","meaning":"My name is...","example":"Tôi tên là Maria."},{"word":"Tôi là người...","pronunciation":"toi laa ngwoi","meaning":"I am from... (nationality)","example":"Tôi là người Mỹ."},{"word":"Tôi đến từ...","pronunciation":"toi den too","meaning":"I come from...","example":"Tôi đến từ California."},{"word":"Tôi học tiếng Việt","pronunciation":"toi hok tyeng vyet","meaning":"I am learning Vietnamese","example":"Tôi đang học tiếng Việt được 2 tháng."},{"word":"Rất vui được gặp bạn","pronunciation":"rut vwi duoc gap baan","meaning":"Nice to meet you","example":"Rất vui được gặp bạn! Bạn tên là gì?"}]}'::jsonb,
  true, NOW(), NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO "LearningAssets" (
  "Id","SegmentId","Type","Title","Description",
  "StartTime","EndTime","OrderIndex","Metadata","IsPublic","CreatedAt","UpdatedAt"
) VALUES (
  '1a300003-0000-0000-0000-000000000005',
  'c3000003-0000-0000-0000-000000000004',
  'ExerciseBlock',
  'Bài tập: Hoàn thành lời giới thiệu',
  'Điền vào chỗ trống để hoàn thiện đoạn tự giới thiệu',
  600, 720, 1,
  '{"type":"FillInBlank","items":[{"sentence":"___ tên là Sarah. (My name is Sarah)","answer":"Tôi"},{"sentence":"Tôi ___ người Anh. (I am British)","answer":"là"},{"sentence":"Tôi đến ___ London. (I come from London)","answer":"từ"},{"sentence":"Rất vui được ___ bạn! (Nice to meet you)","answer":"gặp"},{"sentence":"Tôi đang học tiếng Việt ___ 3 tháng. (for 3 months)","answer":"được"}]}'::jsonb,
  true, NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Seg 5: Tạm biệt → VocabularyBlock + QuizBlock tổng kết
INSERT INTO "LearningAssets" (
  "Id","SegmentId","Type","Title","Description",
  "StartTime","EndTime","OrderIndex","Metadata","IsPublic","CreatedAt","UpdatedAt"
) VALUES (
  '1a300003-0000-0000-0000-000000000006',
  'c3000003-0000-0000-0000-000000000005',
  'VocabularyBlock',
  'Từ vựng: Tạm biệt & Lời chúc',
  'Các cách tạm biệt và lời chúc lịch sự trong tiếng Việt',
  725, NULL, 0,
  '{"words":[{"word":"Tạm biệt","pronunciation":"tam byet","meaning":"Goodbye (formal)","example":"Tạm biệt, hẹn gặp lại!"},{"word":"Chào nhé","pronunciation":"chow nyeh","meaning":"Bye (informal)","example":"Thôi chào nhé, tôi đi đây."},{"word":"Hẹn gặp lại","pronunciation":"hen gap lai","meaning":"See you again","example":"Hẹn gặp lại vào tuần sau!"},{"word":"Hẹn gặp mai","pronunciation":"hen gap mai","meaning":"See you tomorrow","example":"Hẹn gặp mai bạn nhé."},{"word":"Chúc ngủ ngon","pronunciation":"chook ngoo ngon","meaning":"Good night","example":"Chúc ngủ ngon! Ngủ ngon nhé."},{"word":"Chúc một ngày tốt lành","pronunciation":"chook mot ngay tot lanh","meaning":"Have a good day","example":"Chúc bạn một ngày tốt lành!"}]}'::jsonb,
  true, NOW(), NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO "LearningAssets" (
  "Id","SegmentId","Type","Title","Description",
  "StartTime","EndTime","OrderIndex","Metadata","IsPublic","CreatedAt","UpdatedAt"
) VALUES (
  '1a300003-0000-0000-0000-000000000007',
  'c3000003-0000-0000-0000-000000000005',
  'QuizBlock',
  'Quiz tổng kết: Chào hỏi & Tạm biệt',
  'Ôn lại toàn bộ nội dung bài học chào hỏi',
  800, 900, 1,
  '{"passScore":70,"timeLimit":120,"questions":[{"text":"\"Bạn có khỏe không?\" nghĩa là gì?","type":"MCQ","options":["Good morning!","Are you well?","My name is...","See you later!"],"correct":1,"explanation":"Bạn có khỏe không? = Are you well? / How are you? Đây là câu hỏi thăm sức khỏe phổ biến nhất."},{"text":"Người nước ngoài mới học nên dùng đại từ nào để tự xưng?","type":"MCQ","options":["em","anh","tôi","mình"],"correct":2,"explanation":"\"tôi\" là đại từ trung lập và lịch sự nhất, phù hợp mọi tình huống khi mới học."},{"text":"\"Rất vui được gặp bạn\" dùng trong tình huống nào?","type":"MCQ","options":["Khi tạm biệt","Khi gặp lần đầu","Khi hỏi thăm sức khỏe","Khi xin lỗi"],"correct":1,"explanation":"\"Rất vui được gặp bạn\" = Nice to meet you — dùng khi gặp ai đó lần đầu."},{"text":"\"Hẹn gặp mai\" có nghĩa là gì?","type":"MCQ","options":["Good night","See you tomorrow","Have a good day","Goodbye forever"],"correct":1,"explanation":"Hẹn = appointment/see, gặp = meet, mai = tomorrow. → See you tomorrow!"}]}'::jsonb,
  true, NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- 11. ENROLLMENTS — cho học viên demo
-- =============================================================================
INSERT INTO "CourseEnrollments" (
  "Id","UserId","CourseId","EnrolledAt","Source","CreatedAt"
) VALUES
(gen_random_uuid(),'a0000001-0000-0000-0000-000000000004','d0000002-0000-0000-0000-000000000001',NOW()-INTERVAL '2 days','Admin',NOW()-INTERVAL '2 days'),
(gen_random_uuid(),'a0000001-0000-0000-0000-000000000005','d0000002-0000-0000-0000-000000000001',NOW()-INTERVAL '1 day', 'Admin',NOW()-INTERVAL '1 day'),
(gen_random_uuid(),'a0000001-0000-0000-0000-000000000006','d0000002-0000-0000-0000-000000000001',NOW()-INTERVAL '3 days','Admin',NOW()-INTERVAL '3 days')
ON CONFLICT DO NOTHING;

COMMIT;

-- =============================================================================
-- VERIFY
-- =============================================================================
SELECT 'Course'    AS "Item", "Title" FROM "Courses"     WHERE "Id" = 'd0000002-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Module',   "Title" FROM "CourseModules" WHERE "Id" = 'e0000002-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Session',  "Title" FROM "Sessions"      WHERE "ModuleId" = 'e0000002-0000-0000-0000-000000000001'
UNION ALL
SELECT 'VideoAsset', "OriginalFileName" FROM "SessionVideoAssets"
  WHERE "Id" IN ('a3000001-0000-0000-0000-000000000001','a3000001-0000-0000-0000-000000000002','a3000001-0000-0000-0000-000000000003');

SELECT 'Segments: ' || COUNT(*) AS "Info" FROM "Segments" WHERE "SessionId" IN (
  'f0000003-0000-0000-0000-000000000001',
  'f0000003-0000-0000-0000-000000000002',
  'f0000003-0000-0000-0000-000000000003'
);

SELECT 'LearningAssets: ' || COUNT(*) AS "Info" FROM "LearningAssets" WHERE "SegmentId" IN (
  SELECT "Id" FROM "Segments" WHERE "SessionId" IN (
    'f0000003-0000-0000-0000-000000000001',
    'f0000003-0000-0000-0000-000000000002',
    'f0000003-0000-0000-0000-000000000003'
  )
);
