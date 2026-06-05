\encoding UTF8
-- ============================================================================
-- Seed dữ liệu giả lập đầy đủ — Học tiếng Việt cho người nước ngoài (VSL)
-- 3 mode: Standard (3 quiz), OPIC (2 quiz), LiveQuiz/Realtime (2 quiz)
-- VSTEP đã có riêng trong seed-vstep-tieng-viet.sql
-- Idempotent: dùng UUID cố định + ON CONFLICT DO NOTHING
-- ============================================================================

SET client_encoding = 'UTF8';
SET search_path TO tenant_demo;

DO $$
DECLARE
    v_created_by UUID;

    -- ── STANDARD MODE quizzes ──────────────────────────────────────────────
    qz_std_greet  UUID := 'a1a1a1a1-0001-0000-0000-000000000001'; -- PracticeQuiz: Chào hỏi
    qz_std_gram   UUID := 'a1a1a1a1-0002-0000-0000-000000000001'; -- GrammarQuiz
    qz_std_vocab  UUID := 'a1a1a1a1-0003-0000-0000-000000000001'; -- VocabularyQuiz

    -- ── OPIC quizzes ────────────────────────────────────────────────────────
    qz_opic_mock  UUID := 'a2a2a2a2-0001-0000-0000-000000000001'; -- OPICMockTest
    qz_opic_mini  UUID := 'a2a2a2a2-0002-0000-0000-000000000001'; -- OPICMiniTest

    -- ── LiveQuiz / Realtime quizzes ────────────────────────────────────────
    qz_live_vocab UUID := 'a3a3a3a3-0001-0000-0000-000000000001'; -- RealtimeQuiz: từ vựng
    qz_live_cul   UUID := 'a3a3a3a3-0002-0000-0000-000000000001'; -- RealtimeQuiz: văn hoá
BEGIN
    SELECT "Id" INTO v_created_by FROM "Users" WHERE "Email"='giaovien1@demo.local' LIMIT 1;
    IF v_created_by IS NULL THEN
        SELECT "Id" INTO v_created_by FROM "Users" LIMIT 1;
    END IF;
    IF v_created_by IS NULL THEN
        RAISE EXCEPTION 'Khong co user nao trong DB.';
    END IF;
    RAISE NOTICE 'CreatedBy = %', v_created_by;

    -- ══════════════════════════════════════════════════════════════════════
    -- BƯỚC 1: TẠO QUIZZES
    -- ══════════════════════════════════════════════════════════════════════
    INSERT INTO "Quizzes" (
        "Id","Title","Description","QuizType","SkillType","Status",
        "Level","Duration","TotalScore","PassingScore",
        "RandomQuestion","RandomAnswer","AllowRetry","RetryLimit",
        "ShowCorrectAnswer","ShowExplanation","ExamMode","Language",
        "CreatedBy","CreatedAt"
    ) VALUES
    -- STANDARD: PracticeQuiz - Giao tiếp cơ bản
    (qz_std_greet,
     'Tiếng Việt giao tiếp — Chào hỏi và Giới thiệu',
     'Bài luyện tập tiếng Việt cho người mới bắt đầu. Học cách chào hỏi, giới thiệu bản thân, hỏi tên tuổi, nghề nghiệp. Trình độ A1-A2.',
     'PracticeQuiz','Mixed','Published',
     1, 900, 12, 7,
     FALSE, FALSE, TRUE, 3, TRUE, TRUE,
     'Standard','vi', v_created_by, NOW()),
    -- STANDARD: GrammarQuiz - Ngữ pháp lượng từ
    (qz_std_gram,
     'Ngữ pháp tiếng Việt — Lượng từ và Đại từ xưng hô',
     'Bài thi ngữ pháp tiếng Việt: lượng từ (cái, con, chiếc, quyển...) và đại từ xưng hô (tôi, bạn, anh, chị, ông, bà...). Trình độ A2.',
     'GrammarQuiz','Grammar','Published',
     2, 900, 10, 6,
     FALSE, FALSE, TRUE, 3, TRUE, TRUE,
     'Standard','vi', v_created_by, NOW()),
    -- STANDARD: VocabularyQuiz - Từ vựng chủ đề
    (qz_std_vocab,
     'Từ vựng tiếng Việt — Gia đình, Ẩm thực, Thời tiết',
     'Bài kiểm tra từ vựng tiếng Việt theo 3 chủ đề: gia đình, món ăn Việt Nam, thời tiết. Trình độ A1-A2.',
     'VocabularyQuiz','Vocabulary','Published',
     1, 600, 12, 7,
     FALSE, FALSE, TRUE, 3, TRUE, TRUE,
     'Standard','vi', v_created_by, NOW()),

    -- OPIC: MockTest đầy đủ
    (qz_opic_mock,
     'OPIC Tiếng Việt — Bài thi mô phỏng đầy đủ',
     'Bộ 12 câu hỏi nói tiếng Việt theo chuẩn OPIC. 4 combo × 3 câu: Tự giới thiệu, Sở thích, Du lịch, Đóng vai tình huống.',
     'OPICMockTest','Speaking','Published',
     3, 1800, 120, 0,
     FALSE, FALSE, TRUE, NULL, FALSE, FALSE,
     'OPIC','vi', v_created_by, NOW()),
    -- OPIC: MiniTest ngắn
    (qz_opic_mini,
     'OPIC Tiếng Việt — Mini Test (Cuộc sống hàng ngày)',
     'Bài thi OPIC ngắn 6 câu nói tiếng Việt về cuộc sống hàng ngày, gia đình, công việc.',
     'OPICMiniTest','Speaking','Published',
     2, 900, 60, 0,
     FALSE, FALSE, TRUE, NULL, FALSE, FALSE,
     'OPIC','vi', v_created_by, NOW()),

    -- LIVE QUIZ: Từ vựng
    (qz_live_vocab,
     'Live Quiz — Đua tốc độ từ vựng tiếng Việt',
     'Quiz trực tiếp trong lớp học. 10 câu trắc nghiệm về từ vựng cơ bản. Học sinh trả lời nhanh để được điểm cao.',
     'RealtimeQuiz','Vocabulary','Published',
     1, 5, 100, 0,
     FALSE, FALSE, FALSE, 1, TRUE, FALSE,
     'Standard','vi', v_created_by, NOW()),
    -- LIVE QUIZ: Văn hoá
    (qz_live_cul,
     'Live Quiz — Đố vui văn hoá Việt Nam',
     'Quiz trực tiếp dành cho người học tiếng Việt. 10 câu đố vui về phong tục, ẩm thực, danh lam thắng cảnh Việt Nam.',
     'RealtimeQuiz','Mixed','Published',
     2, 5, 100, 0,
     FALSE, FALSE, FALSE, 1, TRUE, FALSE,
     'Standard','vi', v_created_by, NOW())
    ON CONFLICT ("Id") DO NOTHING;

    -- ══════════════════════════════════════════════════════════════════════
    -- BƯỚC 2: TẠO QUESTIONS + OPTIONS — STANDARD PracticeQuiz (Chào hỏi)
    -- 12 câu trộn loại: SingleChoice, MultipleChoice, TrueFalse, FillBlank
    -- ══════════════════════════════════════════════════════════════════════
    -- Q1: SingleChoice
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore",
        "Explanation","IsPublic","IsDeleted","Tags","CreatedBy","CreatedAt") VALUES
    ('b1a10001-0000-0000-0000-000000000001',
     'Khi gặp một người Việt Nam vào buổi sáng, bạn sẽ chào thế nào lịch sự nhất?',
     'SingleChoice','Vocabulary','Easy',1,
     '"Chào buổi sáng" là cách chào phổ biến, lịch sự. "Xin chào" cũng đúng nhưng trang trọng hơn.',
     TRUE,FALSE,'["vi","greeting","a1"]',v_created_by,NOW())
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000001','Tạm biệt!',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000001','Chào buổi sáng!',TRUE,2,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000001','Xin lỗi!',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000001','Cảm ơn!',FALSE,4,NOW())
    ON CONFLICT DO NOTHING;

    -- Q2: SingleChoice — câu hỏi tên
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore",
        "Explanation","IsPublic","IsDeleted","Tags","CreatedBy","CreatedAt") VALUES
    ('b1a10001-0000-0000-0000-000000000002',
     'Câu nào dùng để hỏi tên một người?',
     'SingleChoice','Vocabulary','Easy',1,
     '"Bạn tên là gì?" là cách hỏi tên thông dụng nhất.',
     TRUE,FALSE,'["vi","greeting","a1"]',v_created_by,NOW())
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000002','Bạn bao nhiêu tuổi?',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000002','Bạn tên là gì?',TRUE,2,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000002','Bạn ở đâu?',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000002','Bạn làm nghề gì?',FALSE,4,NOW())
    ON CONFLICT DO NOTHING;

    -- Q3: SingleChoice — đại từ
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore",
        "Explanation","IsPublic","IsDeleted","Tags","CreatedBy","CreatedAt") VALUES
    ('b1a10001-0000-0000-0000-000000000003',
     'Khi nói chuyện với người lớn tuổi hơn (ngang tuổi bố/mẹ bạn), bạn nên xưng hô là?',
     'SingleChoice','Grammar','Medium',1,
     'Với người ngang tuổi bố mẹ: gọi "cô/chú" và xưng "cháu".',
     TRUE,FALSE,'["vi","grammar","pronouns"]',v_created_by,NOW())
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000003','Bạn — tôi',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000003','Anh/chị — em',FALSE,2,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000003','Cô/chú — cháu',TRUE,3,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000003','Ông/bà — con',FALSE,4,NOW())
    ON CONFLICT DO NOTHING;

    -- Q4: MultipleChoice — câu chào
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore",
        "Explanation","IsPublic","IsDeleted","Tags","CreatedBy","CreatedAt") VALUES
    ('b1a10001-0000-0000-0000-000000000004',
     'Những câu nào dưới đây là câu chào hỏi tiếng Việt? (Chọn tất cả đáp án đúng)',
     'MultipleChoice','Vocabulary','Easy',1,
     'Cả "Xin chào", "Chào bạn", "Chào buổi sáng" đều là câu chào.',
     TRUE,FALSE,'["vi","greeting"]',v_created_by,NOW())
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000004','Xin chào',TRUE,1,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000004','Cảm ơn nhiều',FALSE,2,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000004','Chào bạn',TRUE,3,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000004','Chào buổi sáng',TRUE,4,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000004','Hẹn gặp lại',FALSE,5,NOW())
    ON CONFLICT DO NOTHING;

    -- Q5: TrueFalse
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore",
        "Explanation","IsPublic","IsDeleted","Tags","CreatedBy","CreatedAt") VALUES
    ('b1a10001-0000-0000-0000-000000000005',
     'Đúng hay sai: "Cảm ơn" và "Cám ơn" đều được dùng phổ biến trong tiếng Việt.',
     'TrueFalse','Vocabulary','Medium',1,
     'Đúng. Hai cách viết đều được chấp nhận, "cảm ơn" phổ biến hơn ở miền Bắc.',
     TRUE,FALSE,'["vi","vocab"]',v_created_by,NOW())
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000005','Đúng',TRUE,1,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000005','Sai',FALSE,2,NOW())
    ON CONFLICT DO NOTHING;

    -- Q6: FillBlank
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore",
        "Explanation","IsPublic","IsDeleted","Tags","CreatedBy","CreatedAt") VALUES
    ('b1a10001-0000-0000-0000-000000000006',
     'Điền từ thích hợp: "Tôi ___ là Mai. Rất vui được làm quen với bạn."',
     'FillBlank','Grammar','Easy',1,
     '"Tên" là từ phù hợp: "Tôi tên là Mai".',
     TRUE,FALSE,'["vi","grammar"]',v_created_by,NOW())
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000006','tên',TRUE,1,NOW())
    ON CONFLICT DO NOTHING;

    -- Q7: SingleChoice
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore",
        "Explanation","IsPublic","IsDeleted","Tags","CreatedBy","CreatedAt") VALUES
    ('b1a10001-0000-0000-0000-000000000007',
     'Khi muốn hỏi quốc tịch của ai đó, bạn nói:',
     'SingleChoice','Vocabulary','Easy',1,
     '"Bạn là người nước nào?" là câu hỏi quốc tịch chuẩn.',
     TRUE,FALSE,'["vi","greeting"]',v_created_by,NOW())
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000007','Bạn ở đâu?',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000007','Bạn là người nước nào?',TRUE,2,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000007','Bạn đi đâu?',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000007','Bạn ăn gì?',FALSE,4,NOW())
    ON CONFLICT DO NOTHING;

    -- Q8: FillBlank
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore",
        "Explanation","IsPublic","IsDeleted","Tags","CreatedBy","CreatedAt") VALUES
    ('b1a10001-0000-0000-0000-000000000008',
     'Điền từ chỉ số tuổi: "Tôi ___ 25 tuổi."',
     'FillBlank','Grammar','Easy',1,
     '"Năm nay" là cách diễn đạt tự nhiên. Hoặc đơn giản "tôi 25 tuổi" cũng đúng.',
     TRUE,FALSE,'["vi","grammar"]',v_created_by,NOW())
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000008','năm nay',TRUE,1,NOW())
    ON CONFLICT DO NOTHING;

    -- Q9: SingleChoice — tạm biệt
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore",
        "Explanation","IsPublic","IsDeleted","Tags","CreatedBy","CreatedAt") VALUES
    ('b1a10001-0000-0000-0000-000000000009',
     'Câu nào dùng để chào tạm biệt và sẽ gặp lại?',
     'SingleChoice','Vocabulary','Easy',1,
     '"Hẹn gặp lại" = see you again.',
     TRUE,FALSE,'["vi","greeting"]',v_created_by,NOW())
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000009','Hẹn gặp lại',TRUE,1,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000009','Xin chào',FALSE,2,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000009','Cảm ơn',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-000000000009','Không có gì',FALSE,4,NOW())
    ON CONFLICT DO NOTHING;

    -- Q10: TrueFalse
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore",
        "Explanation","IsPublic","IsDeleted","Tags","CreatedBy","CreatedAt") VALUES
    ('b1a10001-0000-0000-0000-00000000000a',
     'Đúng hay sai: Khi giới thiệu nghề nghiệp, người Việt thường dùng cấu trúc "Tôi là + nghề".',
     'TrueFalse','Grammar','Medium',1,
     'Đúng. VD: "Tôi là giáo viên", "Tôi là sinh viên".',
     TRUE,FALSE,'["vi","grammar"]',v_created_by,NOW())
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
    (gen_random_uuid(),'b1a10001-0000-0000-0000-00000000000a','Đúng',TRUE,1,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-00000000000a','Sai',FALSE,2,NOW())
    ON CONFLICT DO NOTHING;

    -- Q11: SingleChoice
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore",
        "Explanation","IsPublic","IsDeleted","Tags","CreatedBy","CreatedAt") VALUES
    ('b1a10001-0000-0000-0000-00000000000b',
     'Để cảm ơn ai đó đã giúp bạn, bạn nói:',
     'SingleChoice','Vocabulary','Easy',1,
     '"Cảm ơn bạn rất nhiều" thể hiện sự cảm ơn chân thành.',
     TRUE,FALSE,'["vi","vocab"]',v_created_by,NOW())
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
    (gen_random_uuid(),'b1a10001-0000-0000-0000-00000000000b','Xin lỗi',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-00000000000b','Cảm ơn bạn rất nhiều',TRUE,2,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-00000000000b','Không có chi',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-00000000000b','Vui quá',FALSE,4,NOW())
    ON CONFLICT DO NOTHING;

    -- Q12: SingleChoice
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore",
        "Explanation","IsPublic","IsDeleted","Tags","CreatedBy","CreatedAt") VALUES
    ('b1a10001-0000-0000-0000-00000000000c',
     'Phản hồi lịch sự khi ai đó cảm ơn bạn là:',
     'SingleChoice','Vocabulary','Easy',1,
     '"Không có gì" = You''re welcome.',
     TRUE,FALSE,'["vi","vocab"]',v_created_by,NOW())
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
    (gen_random_uuid(),'b1a10001-0000-0000-0000-00000000000c','Tạm biệt',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-00000000000c','Không có gì',TRUE,2,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-00000000000c','Xin chào',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a10001-0000-0000-0000-00000000000c','Tôi đói',FALSE,4,NOW())
    ON CONFLICT DO NOTHING;

    -- Link 12 câu vào PracticeQuiz Greet
    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt")
    SELECT gen_random_uuid(), qz_std_greet, qid, ord, 1, NOW()
    FROM (VALUES
        ('b1a10001-0000-0000-0000-000000000001'::uuid, 1),
        ('b1a10001-0000-0000-0000-000000000002'::uuid, 2),
        ('b1a10001-0000-0000-0000-000000000003'::uuid, 3),
        ('b1a10001-0000-0000-0000-000000000004'::uuid, 4),
        ('b1a10001-0000-0000-0000-000000000005'::uuid, 5),
        ('b1a10001-0000-0000-0000-000000000006'::uuid, 6),
        ('b1a10001-0000-0000-0000-000000000007'::uuid, 7),
        ('b1a10001-0000-0000-0000-000000000008'::uuid, 8),
        ('b1a10001-0000-0000-0000-000000000009'::uuid, 9),
        ('b1a10001-0000-0000-0000-00000000000a'::uuid, 10),
        ('b1a10001-0000-0000-0000-00000000000b'::uuid, 11),
        ('b1a10001-0000-0000-0000-00000000000c'::uuid, 12)
    ) AS t(qid, ord)
    WHERE NOT EXISTS (
        SELECT 1 FROM "QuizQuestions" WHERE "QuizId"=qz_std_greet AND "QuestionId"=t.qid
    );

    -- ══════════════════════════════════════════════════════════════════════
    -- BƯỚC 3: STANDARD GrammarQuiz — 10 câu lượng từ & đại từ
    -- ══════════════════════════════════════════════════════════════════════
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore",
        "Explanation","IsPublic","IsDeleted","Tags","CreatedBy","CreatedAt") VALUES
    ('b1a20001-0000-0000-0000-000000000001',
     'Lượng từ nào dùng cho "sách"?',
     'SingleChoice','Grammar','Easy',1,'Dùng "quyển": quyển sách. Cũng có thể "cuốn sách".',
     TRUE,FALSE,'["vi","grammar","classifier"]',v_created_by,NOW()),
    ('b1a20001-0000-0000-0000-000000000002',
     'Lượng từ nào dùng cho "chó"?',
     'SingleChoice','Grammar','Easy',1,'Dùng "con": con chó. Lượng từ "con" cho động vật.',
     TRUE,FALSE,'["vi","grammar","classifier"]',v_created_by,NOW()),
    ('b1a20001-0000-0000-0000-000000000003',
     'Lượng từ nào dùng cho "bàn"?',
     'SingleChoice','Grammar','Easy',1,'Dùng "cái": cái bàn. "Cái" cho đồ vật vô tri.',
     TRUE,FALSE,'["vi","grammar","classifier"]',v_created_by,NOW()),
    ('b1a20001-0000-0000-0000-000000000004',
     'Lượng từ nào dùng cho "xe đạp"?',
     'SingleChoice','Grammar','Easy',1,'Dùng "chiếc": chiếc xe đạp. "Chiếc" cho phương tiện.',
     TRUE,FALSE,'["vi","grammar","classifier"]',v_created_by,NOW()),
    ('b1a20001-0000-0000-0000-000000000005',
     'Khi nói với em trai/em gái nhỏ hơn, bạn nên xưng hô:',
     'SingleChoice','Grammar','Medium',1,'Anh/chị — em. Vai vế: bạn là "anh/chị", em là "em".',
     TRUE,FALSE,'["vi","grammar","pronouns"]',v_created_by,NOW()),
    ('b1a20001-0000-0000-0000-000000000006',
     'Đại từ "chúng tôi" có nghĩa là:',
     'SingleChoice','Grammar','Medium',1,'"Chúng tôi" = we (loại trừ người nghe). "Chúng ta" = we (gồm cả người nghe).',
     TRUE,FALSE,'["vi","grammar","pronouns"]',v_created_by,NOW()),
    ('b1a20001-0000-0000-0000-000000000007',
     'Câu nào dùng đại từ ĐÚNG khi nói với ông/bà của mình?',
     'SingleChoice','Grammar','Medium',1,'Với ông bà: gọi "ông/bà" và xưng "cháu" (hoặc "con" ở miền Nam).',
     TRUE,FALSE,'["vi","grammar","pronouns"]',v_created_by,NOW()),
    ('b1a20001-0000-0000-0000-000000000008',
     'Lượng từ "tờ" thường dùng cho:',
     'SingleChoice','Grammar','Medium',1,'"Tờ" dùng cho giấy mỏng: tờ giấy, tờ báo, tờ tiền.',
     TRUE,FALSE,'["vi","grammar","classifier"]',v_created_by,NOW()),
    ('b1a20001-0000-0000-0000-000000000009',
     'Đúng hay sai: "Cô ấy" và "chị ấy" có thể dùng thay nhau khi nói về người phụ nữ trưởng thành.',
     'TrueFalse','Grammar','Hard',1,'Sai. "Cô" chỉ người ngang tuổi cô của mình. "Chị" chỉ người hơn mình chút.',
     TRUE,FALSE,'["vi","grammar"]',v_created_by,NOW()),
    ('b1a20001-0000-0000-0000-00000000000a',
     'Điền lượng từ thích hợp: "Hôm qua tôi mua hai ___ áo mới."',
     'FillBlank','Grammar','Medium',1,'"Cái" hoặc "chiếc" đều đúng cho áo.',
     TRUE,FALSE,'["vi","grammar"]',v_created_by,NOW())
    ON CONFLICT ("Id") DO NOTHING;

    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
    -- Q1 sách
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000001','con',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000001','quyển',TRUE,2,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000001','chiếc',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000001','tờ',FALSE,4,NOW()),
    -- Q2 chó
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000002','cái',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000002','con',TRUE,2,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000002','quyển',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000002','chiếc',FALSE,4,NOW()),
    -- Q3 bàn
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000003','con',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000003','cái',TRUE,2,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000003','tờ',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000003','quyển',FALSE,4,NOW()),
    -- Q4 xe đạp
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000004','tờ',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000004','chiếc',TRUE,2,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000004','con',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000004','quyển',FALSE,4,NOW()),
    -- Q5 xưng hô em
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000005','Tôi — bạn',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000005','Anh/chị — em',TRUE,2,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000005','Cô/chú — cháu',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000005','Ông — bà',FALSE,4,NOW()),
    -- Q6 chúng tôi
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000006','Tôi và bạn',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000006','Tôi và những người khác (không gồm bạn)',TRUE,2,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000006','Chỉ riêng mình tôi',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000006','Tất cả mọi người',FALSE,4,NOW()),
    -- Q7 ông bà
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000007','Bạn ơi, bạn ăn cơm chưa?',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000007','Ông ơi, cháu chào ông ạ!',TRUE,2,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000007','Cô ơi, em chào cô!',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000007','Em ơi, anh chào em!',FALSE,4,NOW()),
    -- Q8 tờ
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000008','Động vật',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000008','Giấy mỏng (giấy, báo, tiền)',TRUE,2,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000008','Phương tiện',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000008','Đồ ăn',FALSE,4,NOW()),
    -- Q9 cô/chị
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000009','Đúng',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a20001-0000-0000-0000-000000000009','Sai',TRUE,2,NOW()),
    -- Q10 fillblank
    (gen_random_uuid(),'b1a20001-0000-0000-0000-00000000000a','cái',TRUE,1,NOW())
    ON CONFLICT DO NOTHING;

    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt")
    SELECT gen_random_uuid(), qz_std_gram, qid, ord, 1, NOW()
    FROM (VALUES
        ('b1a20001-0000-0000-0000-000000000001'::uuid,1),
        ('b1a20001-0000-0000-0000-000000000002'::uuid,2),
        ('b1a20001-0000-0000-0000-000000000003'::uuid,3),
        ('b1a20001-0000-0000-0000-000000000004'::uuid,4),
        ('b1a20001-0000-0000-0000-000000000005'::uuid,5),
        ('b1a20001-0000-0000-0000-000000000006'::uuid,6),
        ('b1a20001-0000-0000-0000-000000000007'::uuid,7),
        ('b1a20001-0000-0000-0000-000000000008'::uuid,8),
        ('b1a20001-0000-0000-0000-000000000009'::uuid,9),
        ('b1a20001-0000-0000-0000-00000000000a'::uuid,10)
    ) AS t(qid, ord)
    WHERE NOT EXISTS (
        SELECT 1 FROM "QuizQuestions" WHERE "QuizId"=qz_std_gram AND "QuestionId"=t.qid
    );

    -- ══════════════════════════════════════════════════════════════════════
    -- BƯỚC 4: STANDARD VocabularyQuiz — 12 câu (gia đình, ẩm thực, thời tiết)
    -- ══════════════════════════════════════════════════════════════════════
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore",
        "Explanation","IsPublic","IsDeleted","Tags","CreatedBy","CreatedAt") VALUES
    ('b1a30001-0000-0000-0000-000000000001',
     'Trong tiếng Việt, "bố" và từ nào sau đây có nghĩa giống nhau?',
     'SingleChoice','Vocabulary','Easy',1,'"Cha" và "ba" là từ đồng nghĩa với "bố".',
     TRUE,FALSE,'["vi","vocab","family"]',v_created_by,NOW()),
    ('b1a30001-0000-0000-0000-000000000002',
     'Em gái của mẹ bạn gọi là gì?',
     'SingleChoice','Vocabulary','Medium',1,'"Dì" là em gái của mẹ. "Cô" là em gái của bố.',
     TRUE,FALSE,'["vi","vocab","family"]',v_created_by,NOW()),
    ('b1a30001-0000-0000-0000-000000000003',
     'Anh trai của bố bạn gọi là gì?',
     'SingleChoice','Vocabulary','Medium',1,'"Bác" là anh/chị của bố mẹ. "Chú" là em trai bố.',
     TRUE,FALSE,'["vi","vocab","family"]',v_created_by,NOW()),
    ('b1a30001-0000-0000-0000-000000000004',
     'Món "phở" là món gì?',
     'SingleChoice','Vocabulary','Easy',1,'Phở là món soup mì gạo với thịt bò hoặc gà, đặc sản Việt Nam.',
     TRUE,FALSE,'["vi","vocab","food"]',v_created_by,NOW()),
    ('b1a30001-0000-0000-0000-000000000005',
     '"Bánh mì" trong tiếng Anh là?',
     'SingleChoice','Vocabulary','Easy',1,'Bánh mì = bread (cũng là tên món bánh mì sandwich Việt Nam).',
     TRUE,FALSE,'["vi","vocab","food"]',v_created_by,NOW()),
    ('b1a30001-0000-0000-0000-000000000006',
     'Món "gỏi cuốn" làm từ gì?',
     'SingleChoice','Vocabulary','Medium',1,'Gỏi cuốn = spring roll, có bánh tráng, tôm, thịt heo, rau, bún.',
     TRUE,FALSE,'["vi","vocab","food"]',v_created_by,NOW()),
    ('b1a30001-0000-0000-0000-000000000007',
     '"Trời nắng" nghĩa là gì?',
     'SingleChoice','Vocabulary','Easy',1,'Trời nắng = it is sunny.',
     TRUE,FALSE,'["vi","vocab","weather"]',v_created_by,NOW()),
    ('b1a30001-0000-0000-0000-000000000008',
     'Mùa nào ở Việt Nam thường có mưa nhiều nhất?',
     'SingleChoice','Vocabulary','Medium',1,'Mùa mưa (tháng 5-10) ở miền Nam, mùa hè ở miền Bắc.',
     TRUE,FALSE,'["vi","vocab","weather"]',v_created_by,NOW()),
    ('b1a30001-0000-0000-0000-000000000009',
     'Từ nào KHÔNG chỉ thời tiết?',
     'SingleChoice','Vocabulary','Medium',1,'"Bóng đá" là môn thể thao, không phải thời tiết.',
     TRUE,FALSE,'["vi","vocab","weather"]',v_created_by,NOW()),
    ('b1a30001-0000-0000-0000-00000000000a',
     'Điền từ: "Hôm nay trời ___, tôi cần mặc áo ấm."',
     'FillBlank','Vocabulary','Easy',1,'"Lạnh" — trời lạnh thì cần mặc ấm.',
     TRUE,FALSE,'["vi","vocab","weather"]',v_created_by,NOW()),
    ('b1a30001-0000-0000-0000-00000000000b',
     'Chọn các từ chỉ thành viên gia đình: (chọn nhiều)',
     'MultipleChoice','Vocabulary','Easy',1,'Ông, bà, anh, chị đều chỉ người trong gia đình. "Mưa" không phải.',
     TRUE,FALSE,'["vi","vocab","family"]',v_created_by,NOW()),
    ('b1a30001-0000-0000-0000-00000000000c',
     'Đúng hay sai: "Cơm" là món ăn chính của người Việt Nam.',
     'TrueFalse','Vocabulary','Easy',1,'Đúng. Cơm trắng là thực phẩm chính hàng ngày.',
     TRUE,FALSE,'["vi","vocab","food"]',v_created_by,NOW())
    ON CONFLICT ("Id") DO NOTHING;

    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
    -- Q1 bố
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000001','Mẹ',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000001','Cha / Ba',TRUE,2,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000001','Ông',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000001','Anh',FALSE,4,NOW()),
    -- Q2 em gái của mẹ
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000002','Cô',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000002','Dì',TRUE,2,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000002','Bác',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000002','Chú',FALSE,4,NOW()),
    -- Q3 anh trai của bố
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000003','Chú',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000003','Bác',TRUE,2,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000003','Cậu',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000003','Dượng',FALSE,4,NOW()),
    -- Q4 phở
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000004','Bánh ngọt',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000004','Soup mì gạo với thịt bò/gà',TRUE,2,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000004','Salad rau',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000004','Đồ uống',FALSE,4,NOW()),
    -- Q5 bánh mì
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000005','Rice',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000005','Bread',TRUE,2,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000005','Noodle',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000005','Cake',FALSE,4,NOW()),
    -- Q6 gỏi cuốn
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000006','Bánh tráng cuốn tôm thịt và rau',TRUE,1,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000006','Bánh ngọt nhân kem',FALSE,2,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000006','Bánh chiên giòn',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000006','Mì xào',FALSE,4,NOW()),
    -- Q7 trời nắng
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000007','It is sunny',TRUE,1,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000007','It is raining',FALSE,2,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000007','It is cold',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000007','It is windy',FALSE,4,NOW()),
    -- Q8 mùa mưa
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000008','Mùa xuân',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000008','Mùa mưa / mùa hè',TRUE,2,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000008','Mùa thu',FALSE,3,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000008','Mùa đông',FALSE,4,NOW()),
    -- Q9 không phải thời tiết
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000009','Mưa',FALSE,1,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000009','Nắng',FALSE,2,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000009','Bóng đá',TRUE,3,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-000000000009','Gió',FALSE,4,NOW()),
    -- Q10 fill blank
    (gen_random_uuid(),'b1a30001-0000-0000-0000-00000000000a','lạnh',TRUE,1,NOW()),
    -- Q11 multi
    (gen_random_uuid(),'b1a30001-0000-0000-0000-00000000000b','Ông',TRUE,1,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-00000000000b','Bà',TRUE,2,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-00000000000b','Anh',TRUE,3,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-00000000000b','Mưa',FALSE,4,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-00000000000b','Chị',TRUE,5,NOW()),
    -- Q12 TF cơm
    (gen_random_uuid(),'b1a30001-0000-0000-0000-00000000000c','Đúng',TRUE,1,NOW()),
    (gen_random_uuid(),'b1a30001-0000-0000-0000-00000000000c','Sai',FALSE,2,NOW())
    ON CONFLICT DO NOTHING;

    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt")
    SELECT gen_random_uuid(), qz_std_vocab, qid, ord, 1, NOW()
    FROM (VALUES
        ('b1a30001-0000-0000-0000-000000000001'::uuid,1),
        ('b1a30001-0000-0000-0000-000000000002'::uuid,2),
        ('b1a30001-0000-0000-0000-000000000003'::uuid,3),
        ('b1a30001-0000-0000-0000-000000000004'::uuid,4),
        ('b1a30001-0000-0000-0000-000000000005'::uuid,5),
        ('b1a30001-0000-0000-0000-000000000006'::uuid,6),
        ('b1a30001-0000-0000-0000-000000000007'::uuid,7),
        ('b1a30001-0000-0000-0000-000000000008'::uuid,8),
        ('b1a30001-0000-0000-0000-000000000009'::uuid,9),
        ('b1a30001-0000-0000-0000-00000000000a'::uuid,10),
        ('b1a30001-0000-0000-0000-00000000000b'::uuid,11),
        ('b1a30001-0000-0000-0000-00000000000c'::uuid,12)
    ) AS t(qid, ord)
    WHERE NOT EXISTS (
        SELECT 1 FROM "QuizQuestions" WHERE "QuizId"=qz_std_vocab AND "QuestionId"=t.qid
    );

    -- ══════════════════════════════════════════════════════════════════════
    -- BƯỚC 5: OPIC MockTest tiếng Việt — 12 câu SpeakingRecording (4 combo × 3)
    -- ══════════════════════════════════════════════════════════════════════
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore",
        "IsPublic","IsDeleted","ExamModeTag","AudioPlayLimit","SpeakingTimeLimitSec",
        "Tags","CreatedBy","CreatedAt") VALUES
    -- COMBO 1 — Tự giới thiệu
    ('b2a10001-0000-0000-0000-000000000001',
     'Bằng tiếng Việt, hãy giới thiệu về bản thân bạn: tên, tuổi, quê quán, và lý do bạn học tiếng Việt.',
     'SpeakingRecording','Speaking','Easy',10,TRUE,FALSE,'opic',2,90,
     '["opic","vi","self_intro","combo1"]',v_created_by,NOW()),
    ('b2a10001-0000-0000-0000-000000000002',
     'Hãy mô tả gia đình bạn bằng tiếng Việt: có bao nhiêu người, mỗi người làm nghề gì, bạn thân với ai nhất?',
     'SpeakingRecording','Speaking','Medium',10,TRUE,FALSE,'opic',2,90,
     '["opic","vi","self_intro","combo1"]',v_created_by,NOW()),
    ('b2a10001-0000-0000-0000-000000000003',
     'Hãy kể về một ngày bình thường của bạn bằng tiếng Việt — từ sáng đến tối, bạn làm những gì?',
     'SpeakingRecording','Speaking','Medium',10,TRUE,FALSE,'opic',2,90,
     '["opic","vi","self_intro","combo1"]',v_created_by,NOW()),
    -- COMBO 2 — Sở thích
    ('b2a10001-0000-0000-0000-000000000004',
     'Sở thích của bạn là gì? Hãy kể bằng tiếng Việt một sở thích bạn yêu thích nhất và tại sao.',
     'SpeakingRecording','Speaking','Medium',10,TRUE,FALSE,'opic',2,90,
     '["opic","vi","hobbies","combo2"]',v_created_by,NOW()),
    ('b2a10001-0000-0000-0000-000000000005',
     'Bạn thích nghe nhạc Việt Nam không? Hãy kể về một bài hát hoặc ca sĩ Việt Nam bạn biết.',
     'SpeakingRecording','Speaking','Medium',10,TRUE,FALSE,'opic',2,90,
     '["opic","vi","hobbies","combo2"]',v_created_by,NOW()),
    ('b2a10001-0000-0000-0000-000000000006',
     'Vào cuối tuần, bạn thường làm gì để thư giãn? Hãy mô tả chi tiết bằng tiếng Việt.',
     'SpeakingRecording','Speaking','Medium',10,TRUE,FALSE,'opic',2,90,
     '["opic","vi","hobbies","combo2"]',v_created_by,NOW()),
    -- COMBO 3 — Du lịch / Việt Nam
    ('b2a10001-0000-0000-0000-000000000007',
     'Hãy kể bằng tiếng Việt về một địa điểm ở Việt Nam mà bạn đã đến hoặc muốn đến. Vì sao?',
     'SpeakingRecording','Speaking','Medium',10,TRUE,FALSE,'opic',2,90,
     '["opic","vi","travel","combo3"]',v_created_by,NOW()),
    ('b2a10001-0000-0000-0000-000000000008',
     'Hãy so sánh thức ăn Việt Nam với thức ăn ở nước bạn. Bạn thích món Việt nào nhất?',
     'SpeakingRecording','Speaking','Hard',10,TRUE,FALSE,'opic',2,90,
     '["opic","vi","travel","combo3"]',v_created_by,NOW()),
    ('b2a10001-0000-0000-0000-000000000009',
     'Nếu bạn có một tuần ở Hà Nội, bạn sẽ làm gì? Hãy nói bằng tiếng Việt.',
     'SpeakingRecording','Speaking','Hard',10,TRUE,FALSE,'opic',2,90,
     '["opic","vi","travel","combo3"]',v_created_by,NOW()),
    -- COMBO 4 — Đóng vai (RolePlay)
    ('b2a10001-0000-0000-0000-00000000000a',
     'Đóng vai: Bạn đang ở chợ Việt Nam và muốn mua trái cây. Hãy hỏi giá và mặc cả với người bán bằng tiếng Việt.',
     'OPICRolePlay','Speaking','Hard',10,TRUE,FALSE,'opic',2,90,
     '["opic","vi","roleplay","combo4"]',v_created_by,NOW()),
    ('b2a10001-0000-0000-0000-00000000000b',
     'Đóng vai: Bạn vào một quán phở và muốn gọi món. Hãy nói chuyện với người phục vụ bằng tiếng Việt.',
     'OPICRolePlay','Speaking','Hard',10,TRUE,FALSE,'opic',2,90,
     '["opic","vi","roleplay","combo4"]',v_created_by,NOW()),
    ('b2a10001-0000-0000-0000-00000000000c',
     'Đóng vai: Bạn đi taxi từ sân bay về khách sạn. Hãy nói chuyện với tài xế: chào hỏi, nói địa chỉ, hỏi giá tiền.',
     'OPICRolePlay','Speaking','Hard',10,TRUE,FALSE,'opic',2,90,
     '["opic","vi","roleplay","combo4"]',v_created_by,NOW())
    ON CONFLICT ("Id") DO NOTHING;

    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt")
    SELECT gen_random_uuid(), qz_opic_mock, qid, ord, 10, NOW()
    FROM (VALUES
        ('b2a10001-0000-0000-0000-000000000001'::uuid,1),
        ('b2a10001-0000-0000-0000-000000000002'::uuid,2),
        ('b2a10001-0000-0000-0000-000000000003'::uuid,3),
        ('b2a10001-0000-0000-0000-000000000004'::uuid,4),
        ('b2a10001-0000-0000-0000-000000000005'::uuid,5),
        ('b2a10001-0000-0000-0000-000000000006'::uuid,6),
        ('b2a10001-0000-0000-0000-000000000007'::uuid,7),
        ('b2a10001-0000-0000-0000-000000000008'::uuid,8),
        ('b2a10001-0000-0000-0000-000000000009'::uuid,9),
        ('b2a10001-0000-0000-0000-00000000000a'::uuid,10),
        ('b2a10001-0000-0000-0000-00000000000b'::uuid,11),
        ('b2a10001-0000-0000-0000-00000000000c'::uuid,12)
    ) AS t(qid, ord)
    WHERE NOT EXISTS (
        SELECT 1 FROM "QuizQuestions" WHERE "QuizId"=qz_opic_mock AND "QuestionId"=t.qid
    );

    -- ══════════════════════════════════════════════════════════════════════
    -- BƯỚC 6: OPIC MiniTest tiếng Việt — 6 câu (cuộc sống hàng ngày)
    -- ══════════════════════════════════════════════════════════════════════
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore",
        "IsPublic","IsDeleted","ExamModeTag","AudioPlayLimit","SpeakingTimeLimitSec",
        "Tags","CreatedBy","CreatedAt") VALUES
    ('b2a20001-0000-0000-0000-000000000001',
     'Bạn dậy lúc mấy giờ mỗi sáng? Hãy nói bằng tiếng Việt và kể những việc bạn làm trước khi đi học/làm.',
     'SpeakingRecording','Speaking','Easy',10,TRUE,FALSE,'opic',2,60,
     '["opic","vi","mini","daily"]',v_created_by,NOW()),
    ('b2a20001-0000-0000-0000-000000000002',
     'Bữa sáng hôm nay bạn ăn gì? Hãy mô tả bằng tiếng Việt.',
     'SpeakingRecording','Speaking','Easy',10,TRUE,FALSE,'opic',2,60,
     '["opic","vi","mini","daily"]',v_created_by,NOW()),
    ('b2a20001-0000-0000-0000-000000000003',
     'Bạn thường đi học/đi làm bằng phương tiện gì? Tại sao bạn chọn phương tiện đó?',
     'SpeakingRecording','Speaking','Medium',10,TRUE,FALSE,'opic',2,60,
     '["opic","vi","mini","daily"]',v_created_by,NOW()),
    ('b2a20001-0000-0000-0000-000000000004',
     'Hãy kể về người bạn thân nhất của bạn bằng tiếng Việt.',
     'SpeakingRecording','Speaking','Medium',10,TRUE,FALSE,'opic',2,60,
     '["opic","vi","mini","daily"]',v_created_by,NOW()),
    ('b2a20001-0000-0000-0000-000000000005',
     'Buổi tối, bạn thường làm gì sau khi ăn cơm? Hãy nói bằng tiếng Việt.',
     'SpeakingRecording','Speaking','Medium',10,TRUE,FALSE,'opic',2,60,
     '["opic","vi","mini","daily"]',v_created_by,NOW()),
    ('b2a20001-0000-0000-0000-000000000006',
     'Đóng vai: Bạn gọi điện cho bạn để mời đi xem phim cuối tuần. Hãy nói chuyện bằng tiếng Việt.',
     'OPICRolePlay','Speaking','Hard',10,TRUE,FALSE,'opic',2,60,
     '["opic","vi","mini","roleplay"]',v_created_by,NOW())
    ON CONFLICT ("Id") DO NOTHING;

    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt")
    SELECT gen_random_uuid(), qz_opic_mini, qid, ord, 10, NOW()
    FROM (VALUES
        ('b2a20001-0000-0000-0000-000000000001'::uuid,1),
        ('b2a20001-0000-0000-0000-000000000002'::uuid,2),
        ('b2a20001-0000-0000-0000-000000000003'::uuid,3),
        ('b2a20001-0000-0000-0000-000000000004'::uuid,4),
        ('b2a20001-0000-0000-0000-000000000005'::uuid,5),
        ('b2a20001-0000-0000-0000-000000000006'::uuid,6)
    ) AS t(qid, ord)
    WHERE NOT EXISTS (
        SELECT 1 FROM "QuizQuestions" WHERE "QuizId"=qz_opic_mini AND "QuestionId"=t.qid
    );

    -- ══════════════════════════════════════════════════════════════════════
    -- BƯỚC 7: LIVE QUIZ #1 — Từ vựng tiếng Việt (10 câu MCQ)
    -- ══════════════════════════════════════════════════════════════════════
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore",
        "Explanation","IsPublic","IsDeleted","Tags","CreatedBy","CreatedAt") VALUES
    ('b3a10001-0000-0000-0000-000000000001',
     '"Xin chào" trong tiếng Anh là?',
     'SingleChoice','Vocabulary','Easy',10,'Xin chào = Hello.',TRUE,FALSE,'["vi","live","vocab"]',v_created_by,NOW()),
    ('b3a10001-0000-0000-0000-000000000002',
     'Số "năm" trong tiếng Việt là số mấy?',
     'SingleChoice','Vocabulary','Easy',10,'Năm = 5.',TRUE,FALSE,'["vi","live","number"]',v_created_by,NOW()),
    ('b3a10001-0000-0000-0000-000000000003',
     '"Nước" có nghĩa là gì?',
     'SingleChoice','Vocabulary','Easy',10,'Nước = water (cũng có nghĩa: country).',TRUE,FALSE,'["vi","live","vocab"]',v_created_by,NOW()),
    ('b3a10001-0000-0000-0000-000000000004',
     'Màu nào dịch từ "đỏ"?',
     'SingleChoice','Vocabulary','Easy',10,'Đỏ = red.',TRUE,FALSE,'["vi","live","color"]',v_created_by,NOW()),
    ('b3a10001-0000-0000-0000-000000000005',
     '"Cảm ơn" có nghĩa là?',
     'SingleChoice','Vocabulary','Easy',10,'Cảm ơn = Thank you.',TRUE,FALSE,'["vi","live","vocab"]',v_created_by,NOW()),
    ('b3a10001-0000-0000-0000-000000000006',
     'Từ nào nghĩa là "sách"?',
     'SingleChoice','Vocabulary','Easy',10,'Sách = book.',TRUE,FALSE,'["vi","live","vocab"]',v_created_by,NOW()),
    ('b3a10001-0000-0000-0000-000000000007',
     '"Hôm nay" có nghĩa là gì?',
     'SingleChoice','Vocabulary','Easy',10,'Hôm nay = today.',TRUE,FALSE,'["vi","live","time"]',v_created_by,NOW()),
    ('b3a10001-0000-0000-0000-000000000008',
     'Từ nào nghĩa là "đẹp"?',
     'SingleChoice','Vocabulary','Easy',10,'Đẹp = beautiful.',TRUE,FALSE,'["vi","live","adj"]',v_created_by,NOW()),
    ('b3a10001-0000-0000-0000-000000000009',
     '"Ăn cơm" nghĩa là gì?',
     'SingleChoice','Vocabulary','Medium',10,'Ăn cơm = to eat rice / to have a meal.',TRUE,FALSE,'["vi","live","food"]',v_created_by,NOW()),
    ('b3a10001-0000-0000-0000-00000000000a',
     '"Tôi yêu Việt Nam" có nghĩa là?',
     'SingleChoice','Vocabulary','Medium',10,'Tôi yêu Việt Nam = I love Vietnam.',TRUE,FALSE,'["vi","live","sentence"]',v_created_by,NOW())
    ON CONFLICT ("Id") DO NOTHING;

    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
    -- Q1 xin chào
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000001','Goodbye',FALSE,1,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000001','Hello',TRUE,2,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000001','Sorry',FALSE,3,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000001','Thank you',FALSE,4,NOW()),
    -- Q2 năm
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000002','3',FALSE,1,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000002','5',TRUE,2,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000002','7',FALSE,3,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000002','9',FALSE,4,NOW()),
    -- Q3 nước
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000003','Fire',FALSE,1,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000003','Water',TRUE,2,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000003','Air',FALSE,3,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000003','Earth',FALSE,4,NOW()),
    -- Q4 đỏ
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000004','Blue',FALSE,1,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000004','Green',FALSE,2,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000004','Red',TRUE,3,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000004','Yellow',FALSE,4,NOW()),
    -- Q5 cảm ơn
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000005','Sorry',FALSE,1,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000005','Thank you',TRUE,2,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000005','Goodbye',FALSE,3,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000005','Hello',FALSE,4,NOW()),
    -- Q6 sách
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000006','Pen',FALSE,1,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000006','Book',TRUE,2,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000006','Paper',FALSE,3,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000006','Table',FALSE,4,NOW()),
    -- Q7 hôm nay
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000007','Yesterday',FALSE,1,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000007','Today',TRUE,2,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000007','Tomorrow',FALSE,3,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000007','Now',FALSE,4,NOW()),
    -- Q8 đẹp
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000008','Ugly',FALSE,1,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000008','Beautiful',TRUE,2,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000008','Big',FALSE,3,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000008','Small',FALSE,4,NOW()),
    -- Q9 ăn cơm
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000009','To drink water',FALSE,1,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000009','To eat rice / to have a meal',TRUE,2,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000009','To sleep',FALSE,3,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-000000000009','To run',FALSE,4,NOW()),
    -- Q10 tôi yêu vn
    (gen_random_uuid(),'b3a10001-0000-0000-0000-00000000000a','I miss Vietnam',FALSE,1,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-00000000000a','I love Vietnam',TRUE,2,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-00000000000a','I am Vietnamese',FALSE,3,NOW()),
    (gen_random_uuid(),'b3a10001-0000-0000-0000-00000000000a','I live in Vietnam',FALSE,4,NOW())
    ON CONFLICT DO NOTHING;

    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt")
    SELECT gen_random_uuid(), qz_live_vocab, qid, ord, 10, NOW()
    FROM (VALUES
        ('b3a10001-0000-0000-0000-000000000001'::uuid,1),
        ('b3a10001-0000-0000-0000-000000000002'::uuid,2),
        ('b3a10001-0000-0000-0000-000000000003'::uuid,3),
        ('b3a10001-0000-0000-0000-000000000004'::uuid,4),
        ('b3a10001-0000-0000-0000-000000000005'::uuid,5),
        ('b3a10001-0000-0000-0000-000000000006'::uuid,6),
        ('b3a10001-0000-0000-0000-000000000007'::uuid,7),
        ('b3a10001-0000-0000-0000-000000000008'::uuid,8),
        ('b3a10001-0000-0000-0000-000000000009'::uuid,9),
        ('b3a10001-0000-0000-0000-00000000000a'::uuid,10)
    ) AS t(qid, ord)
    WHERE NOT EXISTS (
        SELECT 1 FROM "QuizQuestions" WHERE "QuizId"=qz_live_vocab AND "QuestionId"=t.qid
    );

    -- ══════════════════════════════════════════════════════════════════════
    -- BƯỚC 8: LIVE QUIZ #2 — Đố vui văn hoá Việt Nam (10 câu MCQ)
    -- ══════════════════════════════════════════════════════════════════════
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore",
        "Explanation","IsPublic","IsDeleted","Tags","CreatedBy","CreatedAt") VALUES
    ('b3a20001-0000-0000-0000-000000000001',
     'Thủ đô của Việt Nam là gì?',
     'SingleChoice','Mixed','Easy',10,'Hà Nội là thủ đô. TP.HCM là thành phố lớn nhất.',TRUE,FALSE,'["vi","live","culture"]',v_created_by,NOW()),
    ('b3a20001-0000-0000-0000-000000000002',
     'Tết Nguyên Đán của người Việt thường rơi vào tháng nào dương lịch?',
     'SingleChoice','Mixed','Medium',10,'Tết âm lịch rơi vào cuối tháng 1 hoặc đầu tháng 2 dương lịch.',TRUE,FALSE,'["vi","live","culture"]',v_created_by,NOW()),
    ('b3a20001-0000-0000-0000-000000000003',
     'Áo dài là trang phục truyền thống của ai?',
     'SingleChoice','Mixed','Easy',10,'Áo dài là quốc phục Việt Nam, đặc biệt cho phụ nữ.',TRUE,FALSE,'["vi","live","culture"]',v_created_by,NOW()),
    ('b3a20001-0000-0000-0000-000000000004',
     'Vịnh Hạ Long được công nhận là di sản thiên nhiên thế giới bởi tổ chức nào?',
     'SingleChoice','Mixed','Medium',10,'UNESCO công nhận Vịnh Hạ Long năm 1994.',TRUE,FALSE,'["vi","live","culture"]',v_created_by,NOW()),
    ('b3a20001-0000-0000-0000-000000000005',
     'Món bánh nào KHÔNG phải đặc sản miền Bắc Việt Nam?',
     'SingleChoice','Mixed','Medium',10,'Bánh tét là đặc sản miền Nam (gói lá chuối, hình trụ).',TRUE,FALSE,'["vi","live","culture"]',v_created_by,NOW()),
    ('b3a20001-0000-0000-0000-000000000006',
     'Phở thường ăn với loại bánh gì?',
     'SingleChoice','Mixed','Easy',10,'Phở dùng bánh phở (bánh bún làm từ bột gạo, dẹt).',TRUE,FALSE,'["vi","live","culture"]',v_created_by,NOW()),
    ('b3a20001-0000-0000-0000-000000000007',
     'Việt Nam có bao nhiêu mùa?',
     'SingleChoice','Mixed','Easy',10,'Miền Bắc có 4 mùa, miền Nam chỉ có 2 mùa (khô và mưa).',TRUE,FALSE,'["vi","live","culture"]',v_created_by,NOW()),
    ('b3a20001-0000-0000-0000-000000000008',
     'Đồng tiền Việt Nam có tên là gì?',
     'SingleChoice','Mixed','Easy',10,'Đồng (VND) là đơn vị tiền tệ Việt Nam.',TRUE,FALSE,'["vi","live","culture"]',v_created_by,NOW()),
    ('b3a20001-0000-0000-0000-000000000009',
     'Nhà thơ nào được coi là đại thi hào dân tộc Việt Nam (tác giả Truyện Kiều)?',
     'SingleChoice','Mixed','Hard',10,'Nguyễn Du (1765-1820), tác giả Truyện Kiều.',TRUE,FALSE,'["vi","live","culture"]',v_created_by,NOW()),
    ('b3a20001-0000-0000-0000-00000000000a',
     'Phố cổ Hội An nằm ở tỉnh nào?',
     'SingleChoice','Mixed','Medium',10,'Hội An thuộc tỉnh Quảng Nam, miền Trung Việt Nam.',TRUE,FALSE,'["vi","live","culture"]',v_created_by,NOW())
    ON CONFLICT ("Id") DO NOTHING;

    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
    -- Q1 thủ đô
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000001','TP. Hồ Chí Minh',FALSE,1,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000001','Hà Nội',TRUE,2,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000001','Đà Nẵng',FALSE,3,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000001','Huế',FALSE,4,NOW()),
    -- Q2 Tết
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000002','Tháng 12',FALSE,1,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000002','Tháng 1 - 2',TRUE,2,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000002','Tháng 4 - 5',FALSE,3,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000002','Tháng 9 - 10',FALSE,4,NOW()),
    -- Q3 áo dài
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000003','Trung Quốc',FALSE,1,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000003','Việt Nam',TRUE,2,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000003','Nhật Bản',FALSE,3,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000003','Hàn Quốc',FALSE,4,NOW()),
    -- Q4 Hạ Long
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000004','WHO',FALSE,1,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000004','UNESCO',TRUE,2,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000004','ASEAN',FALSE,3,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000004','APEC',FALSE,4,NOW()),
    -- Q5 bánh tét
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000005','Bánh chưng',FALSE,1,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000005','Bánh giầy',FALSE,2,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000005','Bánh tét',TRUE,3,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000005','Bánh cốm',FALSE,4,NOW()),
    -- Q6 phở
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000006','Bánh tráng',FALSE,1,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000006','Bánh phở',TRUE,2,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000006','Bún tươi',FALSE,3,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000006','Miến',FALSE,4,NOW()),
    -- Q7 mùa
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000007','2',FALSE,1,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000007','3',FALSE,2,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000007','4 (miền Bắc) hoặc 2 (miền Nam)',TRUE,3,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000007','5',FALSE,4,NOW()),
    -- Q8 đồng
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000008','Baht',FALSE,1,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000008','Đồng (VND)',TRUE,2,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000008','Won',FALSE,3,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000008','Yen',FALSE,4,NOW()),
    -- Q9 Nguyễn Du
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000009','Hồ Xuân Hương',FALSE,1,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000009','Nguyễn Du',TRUE,2,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000009','Nguyễn Trãi',FALSE,3,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-000000000009','Xuân Diệu',FALSE,4,NOW()),
    -- Q10 Hội An
    (gen_random_uuid(),'b3a20001-0000-0000-0000-00000000000a','Quảng Ninh',FALSE,1,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-00000000000a','Quảng Nam',TRUE,2,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-00000000000a','Quảng Bình',FALSE,3,NOW()),
    (gen_random_uuid(),'b3a20001-0000-0000-0000-00000000000a','Quảng Trị',FALSE,4,NOW())
    ON CONFLICT DO NOTHING;

    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt")
    SELECT gen_random_uuid(), qz_live_cul, qid, ord, 10, NOW()
    FROM (VALUES
        ('b3a20001-0000-0000-0000-000000000001'::uuid,1),
        ('b3a20001-0000-0000-0000-000000000002'::uuid,2),
        ('b3a20001-0000-0000-0000-000000000003'::uuid,3),
        ('b3a20001-0000-0000-0000-000000000004'::uuid,4),
        ('b3a20001-0000-0000-0000-000000000005'::uuid,5),
        ('b3a20001-0000-0000-0000-000000000006'::uuid,6),
        ('b3a20001-0000-0000-0000-000000000007'::uuid,7),
        ('b3a20001-0000-0000-0000-000000000008'::uuid,8),
        ('b3a20001-0000-0000-0000-000000000009'::uuid,9),
        ('b3a20001-0000-0000-0000-00000000000a'::uuid,10)
    ) AS t(qid, ord)
    WHERE NOT EXISTS (
        SELECT 1 FROM "QuizQuestions" WHERE "QuizId"=qz_live_cul AND "QuestionId"=t.qid
    );

    RAISE NOTICE 'DONE: 7 quizzes seeded (3 Standard + 2 OPIC + 2 LiveQuiz) for Vietnamese learning.';
END $$;

-- Summary report
SELECT
    q."ExamMode",
    q."QuizType",
    q."Title",
    q."Language",
    COUNT(qq."Id") AS questions
FROM tenant_demo."Quizzes" q
LEFT JOIN tenant_demo."QuizQuestions" qq ON qq."QuizId" = q."Id"
WHERE q."Id" IN (
    'a1a1a1a1-0001-0000-0000-000000000001',
    'a1a1a1a1-0002-0000-0000-000000000001',
    'a1a1a1a1-0003-0000-0000-000000000001',
    'a2a2a2a2-0001-0000-0000-000000000001',
    'a2a2a2a2-0002-0000-0000-000000000001',
    'a3a3a3a3-0001-0000-0000-000000000001',
    'a3a3a3a3-0002-0000-0000-000000000001'
)
GROUP BY q."ExamMode", q."QuizType", q."Title", q."Language"
ORDER BY q."ExamMode", q."QuizType";
