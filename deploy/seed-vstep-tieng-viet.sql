\encoding UTF8
-- ============================================================================
-- VSTEP Tiếng Việt — Seed dữ liệu giả lập (Demo)
-- Nội dung: Dạy/thi tiếng Việt cho người học (người Việt hoặc người nước ngoài)
--
-- 4 bài quiz (1 bài / phần thi):
--   VSTEPListening  — 8 câu MCQ, 3 PassageGroups (hội thoại / thông báo / bài giảng)
--   VSTEPReading    — 12 câu MCQ, 3 PassageGroups (điền từ / đọc hiểu 1 / đọc hiểu 2)
--   VSTEPWriting    — 2 câu EssayWritingVSTEP (Task 1: thư chính thức, Task 2: bài luận)
--   VSTEPSpeaking   — 3 câu SpeakingRecording (Phần 1-3)
--
-- Thang điểm: 0–10 / phần; Band = trung bình 4 phần
--   BelowA2 (<2.5) | A2 (2.5-3.9) | B1 (4.0-5.9) | B2 (6.0-7.9) | C1 (≥8.0 & min≥6.0)
--
-- Chạy:
--   psql -h localhost -U postgres -d mls -f seed-vstep-tieng-viet.sql
--   hoặc trong psql: \i seed-vstep-tieng-viet.sql
-- ============================================================================

SET search_path TO tenant_demo;

DO $$
DECLARE
    v_created_by UUID;

    -- ── Quiz IDs ──────────────────────────────────────────────────────────
    qz_listen UUID := gen_random_uuid();
    qz_read   UUID := gen_random_uuid();
    qz_write  UUID := gen_random_uuid();
    qz_speak  UUID := gen_random_uuid();

    -- ── Passage Group IDs ─────────────────────────────────────────────────
    pg_L1 UUID := gen_random_uuid();  -- Nghe: Hội thoại ngắn
    pg_L2 UUID := gen_random_uuid();  -- Nghe: Thông báo
    pg_L3 UUID := gen_random_uuid();  -- Nghe: Bài giảng

    pg_R1 UUID := gen_random_uuid();  -- Đọc: Điền từ (cloze)
    pg_R2 UUID := gen_random_uuid();  -- Đọc: Đọc hiểu 1 (giáo dục)
    pg_R3 UUID := gen_random_uuid();  -- Đọc: Đọc hiểu 2 (môi trường)

    -- ── Question IDs — LISTENING (8 câu) ─────────────────────────────────
    L1 UUID := gen_random_uuid();  L2 UUID := gen_random_uuid();   -- Group 1 (2 câu)
    L3 UUID := gen_random_uuid();  L4 UUID := gen_random_uuid();   -- Group 2 (3 câu)
    L5 UUID := gen_random_uuid();
    L6 UUID := gen_random_uuid();  L7 UUID := gen_random_uuid();   -- Group 3 (3 câu)
    L8 UUID := gen_random_uuid();

    -- ── Question IDs — READING (12 câu) ──────────────────────────────────
    R1  UUID := gen_random_uuid();  R2  UUID := gen_random_uuid();  -- Group 1: cloze (4 câu)
    R3  UUID := gen_random_uuid();  R4  UUID := gen_random_uuid();
    R5  UUID := gen_random_uuid();  R6  UUID := gen_random_uuid();  -- Group 2: comprehension (4 câu)
    R7  UUID := gen_random_uuid();  R8  UUID := gen_random_uuid();
    R9  UUID := gen_random_uuid();  R10 UUID := gen_random_uuid();  -- Group 3: comprehension (4 câu)
    R11 UUID := gen_random_uuid();  R12 UUID := gen_random_uuid();

    -- ── Question IDs — WRITING (2 tasks) ──────────────────────────────────
    W1 UUID := gen_random_uuid();
    W2 UUID := gen_random_uuid();

    -- ── Question IDs — SPEAKING (3 parts) ────────────────────────────────
    S1 UUID := gen_random_uuid();
    S2 UUID := gen_random_uuid();
    S3 UUID := gen_random_uuid();

    -- ── QuizQuestion IDs ──────────────────────────────────────────────────
    qqL1 UUID := gen_random_uuid(); qqL2 UUID := gen_random_uuid();
    qqL3 UUID := gen_random_uuid(); qqL4 UUID := gen_random_uuid(); qqL5 UUID := gen_random_uuid();
    qqL6 UUID := gen_random_uuid(); qqL7 UUID := gen_random_uuid(); qqL8 UUID := gen_random_uuid();

    qqR1  UUID := gen_random_uuid(); qqR2  UUID := gen_random_uuid();
    qqR3  UUID := gen_random_uuid(); qqR4  UUID := gen_random_uuid();
    qqR5  UUID := gen_random_uuid(); qqR6  UUID := gen_random_uuid();
    qqR7  UUID := gen_random_uuid(); qqR8  UUID := gen_random_uuid();
    qqR9  UUID := gen_random_uuid(); qqR10 UUID := gen_random_uuid();
    qqR11 UUID := gen_random_uuid(); qqR12 UUID := gen_random_uuid();

    qqW1 UUID := gen_random_uuid(); qqW2 UUID := gen_random_uuid();
    qqS1 UUID := gen_random_uuid(); qqS2 UUID := gen_random_uuid(); qqS3 UUID := gen_random_uuid();

BEGIN
    -- Lấy user đầu tiên (Teacher/Admin) làm CreatedBy
    SELECT "Id" INTO v_created_by FROM "Users" LIMIT 1;
    IF v_created_by IS NULL THEN
        RAISE EXCEPTION 'Không có user nào trong DB. Hãy tạo user trước.';
    END IF;

    -- Bỏ qua nếu đã tồn tại
    IF EXISTS (
        SELECT 1 FROM "Quizzes"
        WHERE "Title" LIKE 'VSTEP Tiếng Việt%' AND "Status" = 'Published'
        LIMIT 1
    ) THEN
        RAISE NOTICE '⚠️  VSTEP Tiếng Việt demo đã tồn tại — bỏ qua.';
        RETURN;
    END IF;

    -- ══════════════════════════════════════════════════════════════════════
    -- BƯỚC 1: TẠO 4 QUIZ
    -- ══════════════════════════════════════════════════════════════════════

    INSERT INTO "Quizzes" (
        "Id","Title","Description","QuizType","SkillType","Status",
        "Level","Duration","TotalScore","PassingScore",
        "RandomQuestion","RandomAnswer","AllowRetry","RetryLimit",
        "ShowCorrectAnswer","ShowExplanation","ExamMode","Language","CreatedBy","CreatedAt"
    ) VALUES

    -- Phần Nghe (35 phút thực tế; demo 8 câu)
    (qz_listen,
     'VSTEP Tiếng Việt — Phần Nghe (Demo)',
     'Bài thi nghe hiểu tiếng Việt chuẩn VSTEP. Gồm 3 dạng: hội thoại ngắn, thông báo và bài giảng. Demo 8 câu.',
     'VSTEPListening','Listening','Published',
     3, 2100, 10, 5,
     FALSE, FALSE, TRUE, NULL, FALSE, FALSE,
     'VSTEP', 'vi', v_created_by, NOW()),

    -- Phần Đọc (50 phút thực tế; demo 12 câu)
    (qz_read,
     'VSTEP Tiếng Việt — Phần Đọc (Demo)',
     'Bài thi đọc hiểu tiếng Việt chuẩn VSTEP. Gồm điền từ và đọc hiểu đoạn văn. Demo 12 câu.',
     'VSTEPReading','Reading','Published',
     3, 3000, 10, 5,
     FALSE, FALSE, TRUE, NULL, FALSE, FALSE,
     'VSTEP', 'vi', v_created_by, NOW()),

    -- Phần Viết (50 phút thực tế; demo 2 nhiệm vụ)
    (qz_write,
     'VSTEP Tiếng Việt — Phần Viết (Demo)',
     'Bài thi viết tiếng Việt chuẩn VSTEP. Task 1: Viết thư chính thức (150 từ). Task 2: Viết bài luận (300 từ).',
     'VSTEPWriting','Writing','Published',
     3, 3000, 10, 5,
     FALSE, FALSE, TRUE, NULL, FALSE, FALSE,
     'VSTEP', 'vi', v_created_by, NOW()),

    -- Phần Nói (15 phút thực tế; demo 3 phần)
    (qz_speak,
     'VSTEP Tiếng Việt — Phần Nói (Demo)',
     'Bài thi nói tiếng Việt chuẩn VSTEP. 3 phần: câu hỏi cá nhân, mô tả chủ đề, thảo luận xã hội. AI chấm điểm.',
     'VSTEPSpeaking','Speaking','Published',
     3, 900, 10, 5,
     FALSE, FALSE, TRUE, NULL, FALSE, FALSE,
     'VSTEP', 'vi', v_created_by, NOW());

    -- ══════════════════════════════════════════════════════════════════════
    -- BƯỚC 2: TẠO CÂU HỎI — PHẦN NGHE (8 câu)
    -- ══════════════════════════════════════════════════════════════════════

    INSERT INTO "Questions" (
        "Id","Content","Type","SkillType","Difficulty",
        "DefaultScore","Explanation","IsPublic","IsDeleted",
        "ExamModeTag","AudioPlayLimit","Tags","CreatedBy","CreatedAt"
    ) VALUES

    -- ── GROUP 1: Hội thoại ngắn (2 câu) ────────────────────────────────
    (L1,
     '[Hội thoại] Hai người bạn gặp nhau tại công viên. Nghe đoạn hội thoại và trả lời:' || chr(10) ||
     'Họ đang nói về điều gì?',
     'AudioListeningMCQ','Listening','Easy',
     1.25, 'Trong đoạn hội thoại, hai bạn thảo luận về kế hoạch tổ chức picnic cuối tuần.',
     TRUE, FALSE, 'vstep', 2,
     '["vstep","listening","dialogue","group1"]', v_created_by, NOW()),

    (L2,
     '[Hội thoại] (Tiếp đoạn hội thoại trên)' || chr(10) ||
     'Họ quyết định gặp nhau ở đâu?',
     'AudioListeningMCQ','Listening','Easy',
     1.25, 'Hai người đồng ý gặp nhau tại cổng vào công viên Thống Nhất lúc 8 giờ sáng.',
     TRUE, FALSE, 'vstep', 2,
     '["vstep","listening","dialogue","group1"]', v_created_by, NOW()),

    -- ── GROUP 2: Thông báo ngắn (3 câu) ────────────────────────────────
    (L3,
     '[Thông báo] Nghe thông báo của nhà trường và trả lời:' || chr(10) ||
     'Thông báo nói về điều gì?',
     'AudioListeningMCQ','Listening','Medium',
     1.25, 'Thông báo đề cập đến việc thay đổi lịch thi học kỳ do điều kiện thời tiết.',
     TRUE, FALSE, 'vstep', 2,
     '["vstep","listening","announcement","group2"]', v_created_by, NOW()),

    (L4,
     '[Thông báo] (Tiếp thông báo trên)' || chr(10) ||
     'Lịch thi thay đổi bắt đầu từ khi nào?',
     'AudioListeningMCQ','Listening','Medium',
     1.25, 'Theo thông báo, lịch thi mới có hiệu lực từ tuần tới, cụ thể là thứ Hai ngày 1.',
     TRUE, FALSE, 'vstep', 2,
     '["vstep","listening","announcement","group2"]', v_created_by, NOW()),

    (L5,
     '[Thông báo] (Tiếp thông báo trên)' || chr(10) ||
     'Học sinh cần làm gì để biết lịch thi mới chi tiết?',
     'AudioListeningMCQ','Listening','Medium',
     1.25, 'Thông báo yêu cầu học sinh kiểm tra bảng thông báo chính thức hoặc website nhà trường.',
     TRUE, FALSE, 'vstep', 2,
     '["vstep","listening","announcement","group2"]', v_created_by, NOW()),

    -- ── GROUP 3: Bài giảng (3 câu) ──────────────────────────────────────
    (L6,
     '[Bài giảng] Nghe bài giảng về văn hóa Tết Nguyên Đán và trả lời:' || chr(10) ||
     'Chủ đề chính của bài giảng là gì?',
     'AudioListeningMCQ','Listening','Hard',
     1.25, 'Bài giảng giới thiệu toàn diện về nguồn gốc, ý nghĩa và các phong tục của Tết Nguyên Đán.',
     TRUE, FALSE, 'vstep', 2,
     '["vstep","listening","lecture","group3","culture"]', v_created_by, NOW()),

    (L7,
     '[Bài giảng] (Tiếp bài giảng trên)' || chr(10) ||
     'Theo bài giảng, phong tục nào gắn liền với ý nghĩa "cầu may mắn đầu năm"?',
     'AudioListeningMCQ','Listening','Hard',
     1.25, 'Bài giảng đề cập đến tục đi lễ chùa đầu năm và xin chữ là hai phong tục cầu may phổ biến.',
     TRUE, FALSE, 'vstep', 2,
     '["vstep","listening","lecture","group3","culture"]', v_created_by, NOW()),

    (L8,
     '[Bài giảng] (Tiếp bài giảng trên)' || chr(10) ||
     'Theo bài giảng, ý nghĩa của việc gói bánh chưng trong ngày Tết là gì?',
     'AudioListeningMCQ','Listening','Hard',
     1.25, 'Giảng viên giải thích bánh chưng tượng trưng cho đất, thể hiện lòng biết ơn tổ tiên và sự gắn kết gia đình.',
     TRUE, FALSE, 'vstep', 2,
     '["vstep","listening","lecture","group3","culture"]', v_created_by, NOW());


    -- ══════════════════════════════════════════════════════════════════════
    -- BƯỚC 3: ĐÁP ÁN PHẦN NGHE (QuestionOptions)
    -- ══════════════════════════════════════════════════════════════════════

    -- L1 — Họ đang nói về điều gì?
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","FeedbackIfSelected","CreatedAt") VALUES
    (gen_random_uuid(), L1, 'Kế hoạch đi du lịch nước ngoài',      FALSE, 1, 'Không đúng — họ nói về kế hoạch cuối tuần trong nước.', NOW()),
    (gen_random_uuid(), L1, 'Kế hoạch picnic cuối tuần',             TRUE,  2, '✓ Đúng! Họ đang lên kế hoạch picnic vào cuối tuần.', NOW()),
    (gen_random_uuid(), L1, 'Công việc và áp lực cuộc sống',          FALSE, 3, 'Không đúng — nội dung không liên quan đến công việc.', NOW()),
    (gen_random_uuid(), L1, 'Vấn đề học tập và điểm số',              FALSE, 4, 'Không đúng — họ không nhắc đến học tập.', NOW());

    -- L2 — Họ gặp nhau ở đâu?
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","FeedbackIfSelected","CreatedAt") VALUES
    (gen_random_uuid(), L2, 'Trước cửa hàng cà phê gần nhà',         FALSE, 1, 'Không đúng.', NOW()),
    (gen_random_uuid(), L2, 'Cổng vào công viên Thống Nhất',          TRUE,  2, '✓ Đúng! Điểm hẹn là cổng vào công viên Thống Nhất lúc 8 giờ.', NOW()),
    (gen_random_uuid(), L2, 'Bến xe buýt số 5',                        FALSE, 3, 'Không đúng.', NOW()),
    (gen_random_uuid(), L2, 'Sân vận động trung tâm',                   FALSE, 4, 'Không đúng.', NOW());

    -- L3 — Thông báo nói về điều gì?
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","FeedbackIfSelected","CreatedAt") VALUES
    (gen_random_uuid(), L3, 'Kế hoạch tổ chức hoạt động ngoại khóa',  FALSE, 1, 'Không đúng.', NOW()),
    (gen_random_uuid(), L3, 'Thay đổi lịch thi học kỳ',                TRUE,  2, '✓ Đúng! Nhà trường thông báo thay đổi lịch thi.', NOW()),
    (gen_random_uuid(), L3, 'Quy định mới về đồng phục học sinh',       FALSE, 3, 'Không đúng.', NOW()),
    (gen_random_uuid(), L3, 'Thông tin về học bổng mới',                FALSE, 4, 'Không đúng.', NOW());

    -- L4 — Lịch thi thay đổi từ khi nào?
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","FeedbackIfSelected","CreatedAt") VALUES
    (gen_random_uuid(), L4, 'Ngay hôm nay',                             FALSE, 1, 'Không đúng.', NOW()),
    (gen_random_uuid(), L4, 'Tuần tới, thứ Hai ngày 1',                  TRUE,  2, '✓ Đúng! Hiệu lực từ thứ Hai đầu tuần tới.', NOW()),
    (gen_random_uuid(), L4, 'Đầu học kỳ mới vào tháng 9',               FALSE, 3, 'Không đúng.', NOW()),
    (gen_random_uuid(), L4, 'Sau kỳ nghỉ Tết',                            FALSE, 4, 'Không đúng.', NOW());

    -- L5 — Học sinh cần làm gì?
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","FeedbackIfSelected","CreatedAt") VALUES
    (gen_random_uuid(), L5, 'Gọi điện trực tiếp cho giáo viên chủ nhiệm',    FALSE, 1, 'Không đúng.', NOW()),
    (gen_random_uuid(), L5, 'Kiểm tra bảng thông báo hoặc website nhà trường', TRUE, 2, '✓ Đúng!', NOW()),
    (gen_random_uuid(), L5, 'Đến phòng giám thị để hỏi',                        FALSE, 3, 'Không đúng.', NOW()),
    (gen_random_uuid(), L5, 'Chờ giáo viên thông báo trong giờ học',             FALSE, 4, 'Không đúng.', NOW());

    -- L6 — Chủ đề bài giảng?
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","FeedbackIfSelected","CreatedAt") VALUES
    (gen_random_uuid(), L6, 'Lịch sử hình thành nước Việt Nam',          FALSE, 1, 'Không đúng.', NOW()),
    (gen_random_uuid(), L6, 'Ẩm thực truyền thống ngày Tết',             FALSE, 2, 'Gần đúng nhưng không đủ — bài giảng bao quát hơn.', NOW()),
    (gen_random_uuid(), L6, 'Tết Nguyên Đán — nguồn gốc và phong tục',   TRUE,  3, '✓ Đúng! Bài giảng giới thiệu toàn diện về Tết.', NOW()),
    (gen_random_uuid(), L6, 'Âm nhạc và nghệ thuật dân gian Việt Nam',   FALSE, 4, 'Không đúng.', NOW());

    -- L7 — Phong tục cầu may?
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","FeedbackIfSelected","CreatedAt") VALUES
    (gen_random_uuid(), L7, 'Gói bánh chưng và luộc bánh',               FALSE, 1, 'Không đúng — đây là phong tục đón Tết, không phải cầu may.', NOW()),
    (gen_random_uuid(), L7, 'Đi lễ chùa và xin chữ đầu năm',             TRUE,  2, '✓ Đúng! Hai phong tục cầu may phổ biến được đề cập.', NOW()),
    (gen_random_uuid(), L7, 'Mặc áo dài và chụp ảnh',                     FALSE, 3, 'Không đúng.', NOW()),
    (gen_random_uuid(), L7, 'Múa lân và đốt pháo hoa',                    FALSE, 4, 'Không đúng — đốt pháo đã bị cấm.', NOW());

    -- L8 — Ý nghĩa bánh chưng?
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","FeedbackIfSelected","CreatedAt") VALUES
    (gen_random_uuid(), L8, 'Biểu tượng của sự thịnh vượng và giàu có',  FALSE, 1, 'Không đúng.', NOW()),
    (gen_random_uuid(), L8, 'Tượng trưng cho đất, lòng biết ơn tổ tiên và gắn kết gia đình', TRUE, 2, '✓ Đúng!', NOW()),
    (gen_random_uuid(), L8, 'Thể hiện tài năng nội trợ của người phụ nữ', FALSE, 3, 'Không đúng.', NOW()),
    (gen_random_uuid(), L8, 'Món ăn đặc trưng mỗi vùng miền',             FALSE, 4, 'Không đúng.', NOW());


    -- ══════════════════════════════════════════════════════════════════════
    -- BƯỚC 4: TẠO CÂU HỎI — PHẦN ĐỌC (12 câu)
    -- ══════════════════════════════════════════════════════════════════════

    INSERT INTO "Questions" (
        "Id","Content","Type","SkillType","Difficulty",
        "DefaultScore","Explanation","IsPublic","IsDeleted",
        "ExamModeTag","Tags","CreatedBy","CreatedAt"
    ) VALUES

    -- ── GROUP 1: Điền từ vào chỗ trống (4 câu) ──────────────────────────
    -- Đoạn văn:
    -- "Hà Nội là ___(1)___ của Việt Nam, với lịch sử hơn một nghìn năm ___(2)___.
    --  Thành phố nổi tiếng với ___(3)___ Hoàn Kiếm và Văn Miếu — Quốc Tử Giám,
    --  ___(4)___ thu hút hàng triệu du khách mỗi năm."

    (R1,
     '[Điền từ] Hà Nội là ___(1)___ của Việt Nam, với lịch sử hơn một nghìn năm hình thành và phát triển.' || chr(10) ||
     'Chọn từ phù hợp nhất điền vào chỗ (1):',
     'SingleChoice','Reading','Easy',
     0.83, 'Hà Nội là "thủ đô" của Việt Nam, không phải thành phố lớn nhất (TP.HCM mới là thành phố đông dân nhất).',
     TRUE, FALSE, 'vstep', '["vstep","reading","cloze","group1"]', v_created_by, NOW()),

    (R2,
     '[Điền từ] Thành phố này ___(2)___ nổi tiếng với Hồ Hoàn Kiếm và Văn Miếu — Quốc Tử Giám.' || chr(10) ||
     'Chọn từ phù hợp nhất điền vào chỗ (2):',
     'SingleChoice','Reading','Easy',
     0.83, '"Đặc biệt" là trạng từ phù hợp nhất trong ngữ cảnh ca ngợi các địa danh nổi bật.',
     TRUE, FALSE, 'vstep', '["vstep","reading","cloze","group1"]', v_created_by, NOW()),

    (R3,
     '[Điền từ] Đây là những ___(3)___ lịch sử có giá trị văn hóa và giáo dục rất cao.' || chr(10) ||
     'Chọn từ phù hợp nhất điền vào chỗ (3):',
     'SingleChoice','Reading','Easy',
     0.83, '"Di tích" là danh từ chỉ các địa điểm có giá trị lịch sử, văn hóa được bảo tồn.',
     TRUE, FALSE, 'vstep', '["vstep","reading","cloze","group1"]', v_created_by, NOW()),

    (R4,
     '[Điền từ] Mỗi năm, Hà Nội ___(4)___ hàng triệu du khách trong và ngoài nước đến tham quan.' || chr(10) ||
     'Chọn từ phù hợp nhất điền vào chỗ (4):',
     'SingleChoice','Reading','Easy',
     0.83, '"Đón tiếp" hoặc "thu hút" đều phù hợp, nhưng trong ngữ cảnh này "thu hút" tự nhiên hơn.',
     TRUE, FALSE, 'vstep', '["vstep","reading","cloze","group1"]', v_created_by, NOW()),

    -- ── GROUP 2: Đọc hiểu — Giáo dục Việt Nam (4 câu) ───────────────────
    -- Đoạn văn (kèm trong câu hỏi đầu tiên của group):
    (R5,
     '[Đọc hiểu 1] Đọc đoạn văn sau và trả lời các câu hỏi:' || chr(10) || chr(10) ||
     '"Giáo dục Việt Nam đang trải qua giai đoạn đổi mới quan trọng. Chương trình giáo dục phổ thông 2018' || chr(10) ||
     'chuyển từ tiếp cận nội dung sang tiếp cận năng lực, chú trọng phát triển kỹ năng thực tế cho học sinh.' || chr(10) ||
     'Môn Tin học và Ngoại ngữ được tăng cường từ cấp Tiểu học. Phương pháp học tập tích cực' || chr(10) ||
     'như học qua dự án (PBL) và học hợp tác được khuyến khích rộng rãi trong các trường học."' || chr(10) || chr(10) ||
     'Mục tiêu chính của Chương trình giáo dục phổ thông 2018 là gì?',
     'SingleChoice','Reading','Medium',
     0.83, 'Đoạn văn nêu rõ: chuyển từ tiếp cận nội dung sang tiếp cận NĂNG LỰC.',
     TRUE, FALSE, 'vstep', '["vstep","reading","comprehension","group2","education"]', v_created_by, NOW()),

    (R6,
     '[Đọc hiểu 1] (Tiếp đoạn văn về giáo dục)' || chr(10) ||
     'Theo đoạn văn, môn học nào được tăng cường từ bậc Tiểu học?',
     'SingleChoice','Reading','Medium',
     0.83, 'Đoạn văn đề cập "Môn Tin học và Ngoại ngữ được tăng cường từ cấp Tiểu học".',
     TRUE, FALSE, 'vstep', '["vstep","reading","comprehension","group2","education"]', v_created_by, NOW()),

    (R7,
     '[Đọc hiểu 1] (Tiếp đoạn văn về giáo dục)' || chr(10) ||
     'PBL trong đoạn văn được hiểu là phương pháp học tập nào?',
     'SingleChoice','Reading','Medium',
     0.83, 'PBL = Project-Based Learning = học qua dự án, được đề cập rõ trong đoạn văn.',
     TRUE, FALSE, 'vstep', '["vstep","reading","comprehension","group2","education"]', v_created_by, NOW()),

    (R8,
     '[Đọc hiểu 1] (Tiếp đoạn văn về giáo dục)' || chr(10) ||
     'Từ "tích cực" trong câu "phương pháp học tập tích cực" có nghĩa là gì trong ngữ cảnh này?',
     'SingleChoice','Reading','Hard',
     0.83, 'Trong ngữ cảnh giáo dục, "học tập tích cực" (active learning) có nghĩa là học viên CHỦ ĐỘNG tham gia, không thụ động.',
     TRUE, FALSE, 'vstep', '["vstep","reading","comprehension","group2","education","vocabulary"]', v_created_by, NOW()),

    -- ── GROUP 3: Đọc hiểu — Môi trường Việt Nam (4 câu) ─────────────────
    (R9,
     '[Đọc hiểu 2] Đọc đoạn văn sau và trả lời các câu hỏi:' || chr(10) || chr(10) ||
     '"Ô nhiễm không khí tại các thành phố lớn của Việt Nam đang ở mức báo động.' || chr(10) ||
     'Theo số liệu năm 2024, Hà Nội và TP.HCM thường xuyên nằm trong danh sách các thành phố' || chr(10) ||
     'có chỉ số chất lượng không khí (AQI) ở mức kém. Nguyên nhân chủ yếu đến từ phương tiện' || chr(10) ||
     'giao thông cá nhân, hoạt động xây dựng và các cơ sở công nghiệp xung quanh. Chính phủ đã' || chr(10) ||
     'triển khai nhiều biện pháp như phát triển xe buýt điện, trồng thêm cây xanh đô thị và' || chr(10) ||
     'kiểm soát khí thải công nghiệp để cải thiện tình hình."' || chr(10) || chr(10) ||
     'Vấn đề chính được đề cập trong đoạn văn là gì?',
     'SingleChoice','Reading','Medium',
     0.83, 'Toàn đoạn văn tập trung vào vấn đề ô nhiễm không khí tại các thành phố lớn Việt Nam.',
     TRUE, FALSE, 'vstep', '["vstep","reading","comprehension","group3","environment"]', v_created_by, NOW()),

    (R10,
     '[Đọc hiểu 2] (Tiếp đoạn văn về môi trường)' || chr(10) ||
     'Theo đoạn văn, đâu KHÔNG PHẢI nguyên nhân gây ô nhiễm không khí?',
     'SingleChoice','Reading','Medium',
     0.83, 'Đoạn văn nêu 3 nguyên nhân: phương tiện cá nhân, xây dựng, công nghiệp. Rác thải sinh hoạt không được đề cập.',
     TRUE, FALSE, 'vstep', '["vstep","reading","comprehension","group3","environment"]', v_created_by, NOW()),

    (R11,
     '[Đọc hiểu 2] (Tiếp đoạn văn về môi trường)' || chr(10) ||
     'AQI trong đoạn văn là viết tắt của cụm từ nào?',
     'SingleChoice','Reading','Medium',
     0.83, 'AQI = Air Quality Index = Chỉ số chất lượng không khí, được đề cập rõ trong đoạn.',
     TRUE, FALSE, 'vstep', '["vstep","reading","comprehension","group3","environment","vocabulary"]', v_created_by, NOW()),

    (R12,
     '[Đọc hiểu 2] (Tiếp đoạn văn về môi trường)' || chr(10) ||
     'Biện pháp nào dưới đây KHÔNG được đề cập trong đoạn văn như một giải pháp của Chính phủ?',
     'SingleChoice','Reading','Hard',
     0.83, 'Đoạn văn đề cập xe buýt điện, trồng cây xanh và kiểm soát khí thải công nghiệp. Cấm xe máy không được đề cập.',
     TRUE, FALSE, 'vstep', '["vstep","reading","comprehension","group3","environment"]', v_created_by, NOW());


    -- ══════════════════════════════════════════════════════════════════════
    -- BƯỚC 5: ĐÁP ÁN PHẦN ĐỌC
    -- ══════════════════════════════════════════════════════════════════════

    -- R1 — Điền từ (1) — Thủ đô
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","FeedbackIfSelected","CreatedAt") VALUES
    (gen_random_uuid(), R1, 'thành phố lớn nhất',    FALSE, 1, 'TP.HCM mới là thành phố lớn nhất về dân số.', NOW()),
    (gen_random_uuid(), R1, 'thủ đô',                 TRUE,  2, '✓ Đúng! Hà Nội là thủ đô của Việt Nam.', NOW()),
    (gen_random_uuid(), R1, 'cảng biển trung tâm',   FALSE, 3, 'Không phù hợp — Hà Nội không phải cảng biển.', NOW()),
    (gen_random_uuid(), R1, 'trung tâm tài chính',   FALSE, 4, 'TP.HCM mới là trung tâm tài chính lớn nhất.', NOW());

    -- R2 — Điền từ (2) — đặc biệt
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","FeedbackIfSelected","CreatedAt") VALUES
    (gen_random_uuid(), R2, 'chủ yếu',   FALSE, 1, 'Không phù hợp về mặt ngữ nghĩa.', NOW()),
    (gen_random_uuid(), R2, 'đặc biệt',  TRUE,  2, '✓ Đúng! "Đặc biệt nổi tiếng" phù hợp nhất.', NOW()),
    (gen_random_uuid(), R2, 'thường',    FALSE, 3, '"Thường nổi tiếng" nghe mâu thuẫn.', NOW()),
    (gen_random_uuid(), R2, 'vô cùng',   FALSE, 4, 'Có thể dùng được nhưng "đặc biệt" tự nhiên hơn.', NOW());

    -- R3 — Điền từ (3) — di tích
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","FeedbackIfSelected","CreatedAt") VALUES
    (gen_random_uuid(), R3, 'công trình',  FALSE, 1, 'Quá chung chung.', NOW()),
    (gen_random_uuid(), R3, 'di tích',     TRUE,  2, '✓ Đúng! "Di tích lịch sử" là cụm từ chuyên dụng.', NOW()),
    (gen_random_uuid(), R3, 'danh lam',    FALSE, 3, '"Danh lam thắng cảnh" cần đi kèm "thắng cảnh".', NOW()),
    (gen_random_uuid(), R3, 'địa điểm',   FALSE, 4, 'Quá chung chung, không đặc trưng.', NOW());

    -- R4 — Điền từ (4) — thu hút
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","FeedbackIfSelected","CreatedAt") VALUES
    (gen_random_uuid(), R4, 'chào đón',   FALSE, 1, 'Cần chủ ngữ có chủ ý; thành phố không "chào đón".', NOW()),
    (gen_random_uuid(), R4, 'thu hút',    TRUE,  2, '✓ Đúng! "Hà Nội thu hút du khách" là cách nói tự nhiên nhất.', NOW()),
    (gen_random_uuid(), R4, 'tiếp nhận', FALSE, 3, 'Thiếu tự nhiên trong ngữ cảnh du lịch.', NOW()),
    (gen_random_uuid(), R4, 'mời gọi',   FALSE, 4, '"Mời gọi" thường dùng trong văn học, không phải báo chí.', NOW());

    -- R5 — Mục tiêu Chương trình 2018
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","FeedbackIfSelected","CreatedAt") VALUES
    (gen_random_uuid(), R5, 'Tăng số lượng môn học bắt buộc',              FALSE, 1, 'Không đúng — mục tiêu là thay đổi cách tiếp cận.', NOW()),
    (gen_random_uuid(), R5, 'Chuyển từ tiếp cận nội dung sang tiếp cận năng lực', TRUE, 2, '✓ Đúng! Đây là mục tiêu cốt lõi được nêu rõ.', NOW()),
    (gen_random_uuid(), R5, 'Giảm tải chương trình học cho học sinh',       FALSE, 3, 'Không phải trọng tâm chính được đề cập.', NOW()),
    (gen_random_uuid(), R5, 'Thống nhất sách giáo khoa toàn quốc',          FALSE, 4, 'Không được đề cập trong đoạn văn.', NOW());

    -- R6 — Môn học tăng cường Tiểu học
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","FeedbackIfSelected","CreatedAt") VALUES
    (gen_random_uuid(), R6, 'Âm nhạc và Mỹ thuật',         FALSE, 1, 'Không được đề cập.', NOW()),
    (gen_random_uuid(), R6, 'Tin học và Ngoại ngữ',         TRUE,  2, '✓ Đúng! Đoạn văn nêu rõ hai môn này.', NOW()),
    (gen_random_uuid(), R6, 'Thể dục và Kỹ năng sống',      FALSE, 3, 'Không được đề cập.', NOW()),
    (gen_random_uuid(), R6, 'Toán và Khoa học tự nhiên',    FALSE, 4, 'Không được đề cập.', NOW());

    -- R7 — PBL là gì?
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","FeedbackIfSelected","CreatedAt") VALUES
    (gen_random_uuid(), R7, 'Học theo sách giáo khoa có hình ảnh minh họa', FALSE, 1, 'Không đúng.', NOW()),
    (gen_random_uuid(), R7, 'Học qua dự án thực tế',                         TRUE,  2, '✓ Đúng! PBL = Project-Based Learning.', NOW()),
    (gen_random_uuid(), R7, 'Học trực tuyến qua máy tính bảng',               FALSE, 3, 'Không đúng.', NOW()),
    (gen_random_uuid(), R7, 'Học cá nhân không có giáo viên hướng dẫn',       FALSE, 4, 'Không đúng.', NOW());

    -- R8 — "Tích cực" nghĩa là gì?
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","FeedbackIfSelected","CreatedAt") VALUES
    (gen_random_uuid(), R8, 'Vui vẻ, lạc quan trong học tập',                     FALSE, 1, 'Đây là nghĩa của "tích cực" theo nghĩa thái độ.', NOW()),
    (gen_random_uuid(), R8, 'Người học chủ động tham gia, không thụ động tiếp thu', TRUE, 2, '✓ Đúng! Trong giáo dục, "active learning" = học tập chủ động.', NOW()),
    (gen_random_uuid(), R8, 'Học nhiều giờ mỗi ngày',                               FALSE, 3, 'Không đúng trong ngữ cảnh này.', NOW()),
    (gen_random_uuid(), R8, 'Học nhóm với nhiều bạn bè',                             FALSE, 4, 'Gần đúng nhưng "học hợp tác" đã được đề cập riêng.', NOW());

    -- R9 — Vấn đề chính đoạn văn 2
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","FeedbackIfSelected","CreatedAt") VALUES
    (gen_random_uuid(), R9, 'Kẹt xe tại các thành phố lớn',                FALSE, 1, 'Không phải trọng tâm chính.', NOW()),
    (gen_random_uuid(), R9, 'Ô nhiễm không khí tại các đô thị Việt Nam',   TRUE,  2, '✓ Đúng! Toàn bộ đoạn nói về vấn đề này.', NOW()),
    (gen_random_uuid(), R9, 'Thiếu hụt điện năng mùa hè',                   FALSE, 3, 'Không được đề cập.', NOW()),
    (gen_random_uuid(), R9, 'Rác thải nhựa và ô nhiễm nguồn nước',          FALSE, 4, 'Không được đề cập.', NOW());

    -- R10 — Không phải nguyên nhân ô nhiễm
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","FeedbackIfSelected","CreatedAt") VALUES
    (gen_random_uuid(), R10, 'Phương tiện giao thông cá nhân',   FALSE, 1, 'Đây là nguyên nhân được đề cập.', NOW()),
    (gen_random_uuid(), R10, 'Hoạt động xây dựng',                FALSE, 2, 'Đây là nguyên nhân được đề cập.', NOW()),
    (gen_random_uuid(), R10, 'Rác thải sinh hoạt của người dân', TRUE,  3, '✓ Đúng! Đây KHÔNG được đề cập trong đoạn văn.', NOW()),
    (gen_random_uuid(), R10, 'Các cơ sở công nghiệp xung quanh', FALSE, 4, 'Đây là nguyên nhân được đề cập.', NOW());

    -- R11 — AQI là viết tắt của gì?
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","FeedbackIfSelected","CreatedAt") VALUES
    (gen_random_uuid(), R11, 'Air Quality Indicator',      FALSE, 1, 'Gần đúng về chữ cái nhưng sai từ cuối.', NOW()),
    (gen_random_uuid(), R11, 'Air Quality Index',          TRUE,  2, '✓ Đúng! = Chỉ số chất lượng không khí.', NOW()),
    (gen_random_uuid(), R11, 'Atmosphere Quality Index',   FALSE, 3, 'Không đúng.', NOW()),
    (gen_random_uuid(), R11, 'Annual Quality Index',       FALSE, 4, 'Không đúng.', NOW());

    -- R12 — Biện pháp không được đề cập
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","FeedbackIfSelected","CreatedAt") VALUES
    (gen_random_uuid(), R12, 'Phát triển xe buýt điện',             FALSE, 1, 'Được đề cập rõ.', NOW()),
    (gen_random_uuid(), R12, 'Trồng thêm cây xanh đô thị',          FALSE, 2, 'Được đề cập rõ.', NOW()),
    (gen_random_uuid(), R12, 'Cấm xe máy trong nội đô',             TRUE,  3, '✓ Đúng! Biện pháp này KHÔNG được đề cập.', NOW()),
    (gen_random_uuid(), R12, 'Kiểm soát khí thải công nghiệp',      FALSE, 4, 'Được đề cập rõ.', NOW());


    -- ══════════════════════════════════════════════════════════════════════
    -- BƯỚC 6: TẠO CÂU HỎI — PHẦN VIẾT (2 tasks)
    -- ══════════════════════════════════════════════════════════════════════

    INSERT INTO "Questions" (
        "Id","Content","Type","SkillType","Difficulty",
        "DefaultScore","Explanation","ReferenceText","IsPublic","IsDeleted",
        "ExamModeTag","SpeakingTimeLimitSec","Tags","CreatedBy","CreatedAt"
    ) VALUES

    (W1,
     'VSTEP Viết — Task 1: Viết thư chính thức (khoảng 150 từ)' || chr(10) || chr(10) ||
     'Bạn là học sinh tên Minh Anh, học tại Trường THPT Nguyễn Du, Hà Nội.' || chr(10) ||
     'Gần đây, căn tin nhà trường phục vụ thức ăn không đảm bảo vệ sinh:' || chr(10) ||
     'thức ăn nguội lạnh, không có nhãn ngày sản xuất, và khu vực bàn ghế không sạch sẽ.' || chr(10) || chr(10) ||
     'Hãy viết thư chính thức gửi Ban Giám hiệu nhà trường để:' || chr(10) ||
     '   1. Nêu rõ vấn đề bạn đã gặp phải (thời gian, chi tiết cụ thể)' || chr(10) ||
     '   2. Trình bày ảnh hưởng của vấn đề đến học sinh' || chr(10) ||
     '   3. Đề xuất ít nhất 2 giải pháp cụ thể' || chr(10) || chr(10) ||
     'Lưu ý: Dùng văn phong trang trọng, đúng thể thức thư hành chính.',
     'EssayWritingVSTEP','Writing','Medium',
     5.0,
     'Tiêu chí chấm: (1) Nội dung đầy đủ 3 phần (2đ); (2) Từ vựng phong phú (1đ); (3) Ngữ pháp chính xác (1đ); (4) Bố cục rõ ràng (1đ).',
     'Kính gửi Ban Giám hiệu Trường THPT Nguyễn Du,' || chr(10) ||
     'Tôi là Nguyễn Minh Anh, học sinh lớp 11A2. Tôi viết thư này để phản ánh vấn đề vệ sinh an toàn thực phẩm tại căn tin nhà trường.' || chr(10) ||
     'Trong tuần qua (từ ngày 20 đến 24/5), tôi đã nhiều lần nhận thấy thức ăn trong căn tin không đảm bảo: cơm nguội lạnh, thức ăn không có nhãn ngày sản xuất, bàn ghế chưa được lau chùi sạch sẽ...',
     TRUE, FALSE, 'vstep', 2700,
     '["vstep","writing","task1","formal_letter","food_safety"]', v_created_by, NOW()),

    (W2,
     'VSTEP Viết — Task 2: Bài luận trình bày quan điểm (khoảng 300 từ)' || chr(10) || chr(10) ||
     'Đề bài:' || chr(10) ||
     '"Một số ý kiến cho rằng học sinh nên được phép sử dụng điện thoại thông minh trong lớp học' || chr(10) ||
     'vì nó hỗ trợ tra cứu thông tin và học tập hiệu quả hơn. Tuy nhiên, nhiều giáo viên' || chr(10) ||
     'cho rằng điện thoại gây mất tập trung và làm giảm chất lượng học tập."' || chr(10) || chr(10) ||
     'Bạn đồng ý hay không đồng ý với việc cho phép dùng điện thoại trong lớp?' || chr(10) ||
     'Hãy viết bài luận trình bày quan điểm của bạn với:' || chr(10) ||
     '   • Mở bài: Giới thiệu vấn đề và nêu luận điểm chính' || chr(10) ||
     '   • Thân bài: Ít nhất 2 luận điểm có ví dụ cụ thể' || chr(10) ||
     '   • Kết bài: Tóm tắt và đưa ra đề xuất',
     'EssayWritingVSTEP','Writing','Hard',
     5.0,
     'Tiêu chí chấm: (1) Luận điểm rõ ràng, có lập luận (2đ); (2) Từ vựng học thuật (1đ); (3) Ngữ pháp đa dạng (1đ); (4) Liên kết câu và đoạn mạch lạc (1đ).',
     'Trong kỷ nguyên số hóa, việc tích hợp công nghệ vào giáo dục là xu hướng tất yếu. Bản thân tôi cho rằng học sinh NÊN được phép sử dụng điện thoại thông minh trong lớp học, nhưng với điều kiện có quy định rõ ràng...',
     TRUE, FALSE, 'vstep', 3000,
     '["vstep","writing","task2","opinion_essay","technology","education"]', v_created_by, NOW());


    -- ══════════════════════════════════════════════════════════════════════
    -- BƯỚC 7: TẠO CÂU HỎI — PHẦN NÓI (3 phần)
    -- ══════════════════════════════════════════════════════════════════════

    INSERT INTO "Questions" (
        "Id","Content","Type","SkillType","Difficulty",
        "DefaultScore","Explanation","ReferenceText","IsPublic","IsDeleted",
        "ExamModeTag","AudioPlayLimit","SpeakingTimeLimitSec","Tags","CreatedBy","CreatedAt"
    ) VALUES

    (S1,
     'VSTEP Nói — Phần 1: Câu hỏi cá nhân (2–3 phút)' || chr(10) || chr(10) ||
     'Giám khảo sẽ hỏi bạn một số câu hỏi về bản thân và cuộc sống hàng ngày.' || chr(10) ||
     'Hãy trả lời tự nhiên và đầy đủ. Bạn sẽ nghe lần lượt các câu hỏi:' || chr(10) || chr(10) ||
     '1. Bạn hãy giới thiệu ngắn gọn về bản thân (tên, tuổi, nghề nghiệp/học sinh).' || chr(10) ||
     '2. Bạn thích làm gì vào thời gian rảnh? Tại sao bạn thích hoạt động đó?' || chr(10) ||
     '3. Kể về một người bạn thân nhất của bạn — điều gì khiến bạn quý mến người đó?',
     'SpeakingRecording','Speaking','Easy',
     3.33,
     'Tiêu chí: Phát âm rõ ràng (1đ), Từ vựng phong phú (1đ), Ngữ pháp đúng (1đ), Sự lưu loát (0.33đ).',
     'Xin chào, tôi là Trần Thị Lan, 20 tuổi, hiện là sinh viên năm 2 trường Đại học Ngoại ngữ Hà Nội. ' ||
     'Khi rảnh, tôi thích đọc sách, đặc biệt là tiểu thuyết lịch sử vì chúng giúp tôi hiểu hơn về văn hóa dân tộc...',
     TRUE, FALSE, 'vstep', 1, 180,
     '["vstep","speaking","part1","personal_questions"]', v_created_by, NOW()),

    (S2,
     'VSTEP Nói — Phần 2: Mô tả và phát triển chủ đề (2 phút)' || chr(10) || chr(10) ||
     'Bạn sẽ có 1 phút chuẩn bị, sau đó nói trong 2 phút về chủ đề sau:' || chr(10) || chr(10) ||
     '📌 CHỦ ĐỀ: Mô tả một trải nghiệm du lịch đáng nhớ của bạn.' || chr(10) || chr(10) ||
     'Gợi ý các điểm cần đề cập:' || chr(10) ||
     '  • Bạn đã đi đâu và với ai?' || chr(10) ||
     '  • Bạn đã làm gì ở đó? Điều gì ấn tượng nhất?' || chr(10) ||
     '  • Chuyến đi đó có ý nghĩa như thế nào với bạn?' || chr(10) ||
     '  • Bạn có muốn quay lại không? Tại sao?',
     'SpeakingRecording','Speaking','Medium',
     3.33,
     'Tiêu chí: Độ phong phú nội dung (1đ), Tổ chức bài nói logic (1đ), Từ vựng mô tả/kể chuyện (1đ), Không dừng ngắt quá nhiều (0.33đ).',
     'Chuyến đi đáng nhớ nhất của tôi là lần đầu tiên đến Đà Nẵng cùng gia đình vào mùa hè năm ngoái. ' ||
     'Chúng tôi đã tham quan Bà Nà Hills và tôi thực sự choáng ngợp trước cây cầu Vàng nổi tiếng...',
     TRUE, FALSE, 'vstep', 1, 120,
     '["vstep","speaking","part2","topic_description","travel"]', v_created_by, NOW()),

    (S3,
     'VSTEP Nói — Phần 3: Thảo luận vấn đề xã hội (4–5 phút)' || chr(10) || chr(10) ||
     'Giám khảo sẽ thảo luận với bạn về chủ đề xã hội. Hãy đưa ra ý kiến, lý giải và phản biện.' || chr(10) || chr(10) ||
     '📌 CHỦ ĐỀ: Vai trò của công nghệ trong giáo dục hiện đại' || chr(10) || chr(10) ||
     'Câu hỏi thảo luận:' || chr(10) ||
     '  1. Công nghệ đã thay đổi cách học tập của học sinh như thế nào so với 10 năm trước?' || chr(10) ||
     '  2. Theo bạn, lợi ích lớn nhất và rủi ro lớn nhất của việc học trực tuyến là gì?' || chr(10) ||
     '  3. Có ý kiến cho rằng trong tương lai giáo viên sẽ bị AI thay thế. Bạn nghĩ gì về điều này?' || chr(10) ||
     '  4. Việt Nam cần làm gì để rút ngắn khoảng cách số (digital divide) giữa thành thị và nông thôn?',
     'SpeakingRecording','Speaking','Hard',
     3.34,
     'Tiêu chí: Khả năng lập luận phản biện (1.5đ), Từ vựng học thuật/xã hội (1đ), Ngữ pháp cấu trúc phức (1đ), Phát âm chuẩn và tự tin (0.84đ).',
     'Tôi tin rằng công nghệ đã tạo ra cuộc cách mạng thực sự trong giáo dục. Nền tảng học trực tuyến như Coursera hay Khan Academy đã dân chủ hóa kiến thức — bất kỳ ai có internet đều có thể học từ các giáo sư hàng đầu thế giới. ' ||
     'Tuy nhiên, điều này cũng đặt ra câu hỏi: liệu sự tương tác người — người trong lớp học truyền thống có thể bị thay thế không?',
     TRUE, FALSE, 'vstep', 1, 300,
     '["vstep","speaking","part3","discussion","technology","society"]', v_created_by, NOW());


    -- ══════════════════════════════════════════════════════════════════════
    -- BƯỚC 8: LIÊN KẾT CÂU HỎI VÀO QUIZ (QuizQuestions)
    -- ══════════════════════════════════════════════════════════════════════

    -- Phần Nghe: 8 câu × 1.25đ = 10đ
    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt") VALUES
    (qqL1, qz_listen, L1, 1, 1.25, NOW()), (qqL2, qz_listen, L2, 2, 1.25, NOW()),
    (qqL3, qz_listen, L3, 3, 1.25, NOW()), (qqL4, qz_listen, L4, 4, 1.25, NOW()),
    (qqL5, qz_listen, L5, 5, 1.25, NOW()), (qqL6, qz_listen, L6, 6, 1.25, NOW()),
    (qqL7, qz_listen, L7, 7, 1.25, NOW()), (qqL8, qz_listen, L8, 8, 1.25, NOW());

    -- Phần Đọc: 12 câu × 0.83đ ≈ 10đ
    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt") VALUES
    (qqR1, qz_read, R1, 1, 0.83, NOW()),   (qqR2, qz_read, R2,  2, 0.83, NOW()),
    (qqR3, qz_read, R3, 3, 0.83, NOW()),   (qqR4, qz_read, R4,  4, 0.83, NOW()),
    (qqR5, qz_read, R5, 5, 0.83, NOW()),   (qqR6, qz_read, R6,  6, 0.83, NOW()),
    (qqR7, qz_read, R7, 7, 0.83, NOW()),   (qqR8, qz_read, R8,  8, 0.83, NOW()),
    (qqR9, qz_read, R9, 9, 0.83, NOW()),   (qqR10, qz_read, R10,10, 0.83, NOW()),
    (qqR11, qz_read, R11,11, 0.87, NOW()), (qqR12, qz_read, R12,12, 0.87, NOW());

    -- Phần Viết: Task1 (5đ) + Task2 (5đ) = 10đ
    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt") VALUES
    (qqW1, qz_write, W1, 1, 5.0, NOW()),
    (qqW2, qz_write, W2, 2, 5.0, NOW());

    -- Phần Nói: Part1 (3.33đ) + Part2 (3.33đ) + Part3 (3.34đ) = 10đ
    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt") VALUES
    (qqS1, qz_speak, S1, 1, 3.33, NOW()),
    (qqS2, qz_speak, S2, 2, 3.33, NOW()),
    (qqS3, qz_speak, S3, 3, 3.34, NOW());


    -- ══════════════════════════════════════════════════════════════════════
    -- BƯỚC 9: TẠO PASSAGE GROUPS (Nghe + Đọc)
    -- ══════════════════════════════════════════════════════════════════════

    -- ── LISTENING PASSAGE GROUPS ────────────────────────────────────────
    INSERT INTO "PassageGroups" (
        "Id","QuizId","GroupIndex","PassageType",
        "PassageText","AudioUrl","QuestionIds",
        "AudioPlayLimit","PreListenSeconds","DisplayOrder","CreatedAt"
    ) VALUES

    (pg_L1, qz_listen, 1, 'listening_dialogue',
     '[Script - Hội thoại cuối tuần]' || chr(10) ||
     'Nam: Này Hoa, cuối tuần này mày có rảnh không?' || chr(10) ||
     'Hoa: Có, mày định làm gì vậy?' || chr(10) ||
     'Nam: Tao muốn rủ cả nhóm đi picnic ở công viên Thống Nhất. Trời đẹp mà.' || chr(10) ||
     'Hoa: Ý hay đó! Vậy mình gặp nhau ở cổng vào lúc mấy giờ?' || chr(10) ||
     'Nam: 8 giờ sáng nhé. Tao sẽ nhắn tin cho cả nhóm.',
     NULL,
     to_jsonb(ARRAY[L1, L2]::uuid[]),
     2, 20, 1, NOW()),

    (pg_L2, qz_listen, 2, 'listening_short',
     '[Script - Thông báo nhà trường]' || chr(10) ||
     'Thông báo đến toàn thể học sinh: Nhà trường xin thông báo, do ảnh hưởng của bão số 3,' || chr(10) ||
     'lịch thi học kỳ II sẽ có sự điều chỉnh. Lịch mới có hiệu lực từ tuần tới, thứ Hai ngày 1.' || chr(10) ||
     'Đề nghị các em kiểm tra lịch thi cập nhật trên bảng thông báo chính thức của trường' || chr(10) ||
     'hoặc website: thpt-nguyendu.edu.vn. Mọi thắc mắc vui lòng liên hệ phòng Đào tạo. Xin cảm ơn.',
     NULL,
     to_jsonb(ARRAY[L3, L4, L5]::uuid[]),
     2, 20, 2, NOW()),

    (pg_L3, qz_listen, 3, 'listening_lecture',
     '[Script - Bài giảng: Tết Nguyên Đán]' || chr(10) ||
     'Hôm nay chúng ta sẽ tìm hiểu về Tết Nguyên Đán — lễ hội quan trọng nhất trong năm của người Việt.' || chr(10) ||
     'Tết diễn ra vào đầu tháng Giêng âm lịch, thường rơi vào tháng 1 hoặc đầu tháng 2 dương lịch.' || chr(10) ||
     'Đây là dịp để gia đình sum họp, tưởng nhớ tổ tiên và cầu chúc năm mới tốt lành.' || chr(10) ||
     'Trong phong tục Tết, có hai hoạt động gắn liền với cầu may: đi lễ chùa đầu năm để xin bình an,' || chr(10) ||
     'và xin chữ Nho từ các ông đồ để cầu tài lộc. Ngoài ra, việc gói bánh chưng cũng rất đặc biệt.' || chr(10) ||
     'Bánh chưng hình vuông tượng trưng cho đất — triết lý âm dương của người Việt cổ.' || chr(10) ||
     'Khi cả gia đình cùng gói bánh, đó là lúc tình thân gắn kết và lòng biết ơn tổ tiên được thể hiện.',
     NULL,
     to_jsonb(ARRAY[L6, L7, L8]::uuid[]),
     2, 30, 3, NOW());

    -- ── READING PASSAGE GROUPS ──────────────────────────────────────────
    INSERT INTO "PassageGroups" (
        "Id","QuizId","GroupIndex","PassageType",
        "PassageText","AudioUrl","QuestionIds",
        "AudioPlayLimit","PreListenSeconds","DisplayOrder","CreatedAt"
    ) VALUES

    (pg_R1, qz_read, 1, 'reading',
     '── Điền từ vào chỗ trống ──' || chr(10) || chr(10) ||
     'Hà Nội là ___(1)___ của Việt Nam, với lịch sử hơn một nghìn năm hình thành và phát triển.' || chr(10) ||
     'Thành phố này ___(2)___ nổi tiếng với Hồ Hoàn Kiếm và Văn Miếu — Quốc Tử Giám.' || chr(10) ||
     'Đây là những ___(3)___ lịch sử có giá trị văn hóa và giáo dục rất cao.' || chr(10) ||
     'Mỗi năm, Hà Nội ___(4)___ hàng triệu du khách trong và ngoài nước đến tham quan.',
     NULL,
     to_jsonb(ARRAY[R1, R2, R3, R4]::uuid[]),
     1, 0, 1, NOW()),

    (pg_R2, qz_read, 2, 'reading',
     '── Đọc hiểu 1: Đổi mới giáo dục Việt Nam ──' || chr(10) || chr(10) ||
     'Giáo dục Việt Nam đang trải qua giai đoạn đổi mới quan trọng. Chương trình giáo dục phổ thông 2018' || chr(10) ||
     'chuyển từ tiếp cận nội dung sang tiếp cận năng lực, chú trọng phát triển kỹ năng thực tế cho học sinh.' || chr(10) ||
     'Môn Tin học và Ngoại ngữ được tăng cường từ cấp Tiểu học. Phương pháp học tập tích cực' || chr(10) ||
     'như học qua dự án (PBL) và học hợp tác được khuyến khích rộng rãi trong các trường học.',
     NULL,
     to_jsonb(ARRAY[R5, R6, R7, R8]::uuid[]),
     1, 0, 2, NOW()),

    (pg_R3, qz_read, 3, 'reading',
     '── Đọc hiểu 2: Ô nhiễm không khí đô thị ──' || chr(10) || chr(10) ||
     'Ô nhiễm không khí tại các thành phố lớn của Việt Nam đang ở mức báo động.' || chr(10) ||
     'Theo số liệu năm 2024, Hà Nội và TP.HCM thường xuyên nằm trong danh sách các thành phố' || chr(10) ||
     'có chỉ số chất lượng không khí (AQI) ở mức kém. Nguyên nhân chủ yếu đến từ phương tiện' || chr(10) ||
     'giao thông cá nhân, hoạt động xây dựng và các cơ sở công nghiệp xung quanh. Chính phủ đã' || chr(10) ||
     'triển khai nhiều biện pháp như phát triển xe buýt điện, trồng thêm cây xanh đô thị và' || chr(10) ||
     'kiểm soát khí thải công nghiệp để cải thiện tình hình.',
     NULL,
     to_jsonb(ARRAY[R9, R10, R11, R12]::uuid[]),
     1, 0, 3, NOW());


    RAISE NOTICE '✅ Seed VSTEP Tiếng Việt hoàn tất!';
    RAISE NOTICE '   Quiz Nghe  (VSTEPListening): %', qz_listen;
    RAISE NOTICE '   Quiz Đọc   (VSTEPReading):   %', qz_read;
    RAISE NOTICE '   Quiz Viết  (VSTEPWriting):   %', qz_write;
    RAISE NOTICE '   Quiz Nói   (VSTEPSpeaking):  %', qz_speak;
    RAISE NOTICE '';
    RAISE NOTICE '📝 Dùng quiz IDs trên để tạo VSTEPSession và test flow đầy đủ.';
    RAISE NOTICE '   Xem hướng dẫn: docs/VSTEP_TEST_GUIDE.md';

END $$;
