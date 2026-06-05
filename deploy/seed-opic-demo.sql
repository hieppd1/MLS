-- ============================================================================
-- OPIC Demo Seed — 15 câu hỏi nói tiếng Việt (giả lập thi OPIC)
-- Run: SET search_path TO tenant_demo; then execute
-- ============================================================================

SET search_path TO tenant_demo;

DO $$
DECLARE
    v_created_by UUID;
    v_quiz_id    UUID := gen_random_uuid();

    -- Question UUIDs (combo1=tự giới thiệu, combo2=sở thích, combo3=du lịch,
    --                  combo4=công việc, combo5=đóng vai)
    q01 UUID := gen_random_uuid(); q02 UUID := gen_random_uuid(); q03 UUID := gen_random_uuid();
    q04 UUID := gen_random_uuid(); q05 UUID := gen_random_uuid(); q06 UUID := gen_random_uuid();
    q07 UUID := gen_random_uuid(); q08 UUID := gen_random_uuid(); q09 UUID := gen_random_uuid();
    q10 UUID := gen_random_uuid(); q11 UUID := gen_random_uuid(); q12 UUID := gen_random_uuid();
    q13 UUID := gen_random_uuid(); q14 UUID := gen_random_uuid(); q15 UUID := gen_random_uuid();

    qq01 UUID := gen_random_uuid(); qq02 UUID := gen_random_uuid(); qq03 UUID := gen_random_uuid();
    qq04 UUID := gen_random_uuid(); qq05 UUID := gen_random_uuid(); qq06 UUID := gen_random_uuid();
    qq07 UUID := gen_random_uuid(); qq08 UUID := gen_random_uuid(); qq09 UUID := gen_random_uuid();
    qq10 UUID := gen_random_uuid(); qq11 UUID := gen_random_uuid(); qq12 UUID := gen_random_uuid();
    qq13 UUID := gen_random_uuid(); qq14 UUID := gen_random_uuid(); qq15 UUID := gen_random_uuid();
BEGIN
    -- Lấy user đầu tiên làm CreatedBy
    SELECT "Id" INTO v_created_by FROM "Users" LIMIT 1;
    IF v_created_by IS NULL THEN
        RAISE EXCEPTION 'Không có user nào trong DB. Seed users trước.';
    END IF;

    -- Bỏ qua nếu đã có quiz OPIC demo
    IF EXISTS (
        SELECT 1 FROM "Quizzes"
        WHERE "QuizType" = 'OPICMockTest' AND "Language" = 'vi' AND "Status" = 'Published'
    ) THEN
        RAISE NOTICE 'OPIC demo quiz đã tồn tại — bỏ qua.';
        RETURN;
    END IF;

    -- ── Tạo Quiz ──────────────────────────────────────────────────────────────
    INSERT INTO "Quizzes" (
        "Id", "Title", "Description", "QuizType", "SkillType", "Status",
        "Level", "Duration", "TotalScore", "PassingScore",
        "RandomQuestion", "RandomAnswer", "AllowRetry", "RetryLimit",
        "ShowCorrectAnswer", "ShowExplanation",
        "ExamMode", "Language", "CreatedBy", "CreatedAt"
    ) VALUES (
        v_quiz_id,
        'OPIC Tiếng Anh — Bài thi mô phỏng (Demo)',
        'Bộ 15 câu hỏi nói tiếng Anh theo chuẩn OPIC. 5 combo × 3 câu. Chủ đề: Tự giới thiệu, Sở thích, Du lịch, Công việc, Đóng vai.',
        'OPICMockTest', 'Speaking', 'Published',
        3, 1800, 150, 0,
        FALSE, FALSE, TRUE, NULL,
        FALSE, FALSE,
        'OPIC', 'vi', v_created_by, NOW()
    );

    -- ══════════════════════════════════════════════════════════════════════════
    -- COMBO 1 — Tự giới thiệu (Self Introduction)
    -- ══════════════════════════════════════════════════════════════════════════

    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty",
        "DefaultScore","IsPublic","IsDeleted","ExamModeTag","AudioPlayLimit",
        "SpeakingTimeLimitSec","Tags","CreatedBy","CreatedAt")
    VALUES
    (q01,
     'Hãy giới thiệu về bản thân bạn: tên, tuổi, nghề nghiệp và nơi bạn đang sinh sống.',
     'SpeakingRecording','Speaking','Medium',10,TRUE,FALSE,'opic',2,120,
     '["opic","self_intro","combo1"]',v_created_by,NOW()),
    (q02,
     'Kể về gia đình của bạn — có bao nhiêu thành viên, mỗi người làm gì, và gia đình bạn có truyền thống đặc biệt nào không?',
     'SpeakingRecording','Speaking','Medium',10,TRUE,FALSE,'opic',2,120,
     '["opic","self_intro","combo1"]',v_created_by,NOW()),
    (q03,
     'Hãy mô tả một ngày điển hình của bạn từ lúc thức dậy đến khi đi ngủ. Bạn dành thời gian nhiều nhất cho việc gì?',
     'SpeakingRecording','Speaking','Medium',10,TRUE,FALSE,'opic',2,120,
     '["opic","self_intro","combo1"]',v_created_by,NOW());

    -- ══════════════════════════════════════════════════════════════════════════
    -- COMBO 2 — Sở thích & Hoạt động (Hobbies)
    -- ══════════════════════════════════════════════════════════════════════════

    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty",
        "DefaultScore","IsPublic","IsDeleted","ExamModeTag","AudioPlayLimit",
        "SpeakingTimeLimitSec","Tags","CreatedBy","CreatedAt")
    VALUES
    (q04,
     'Bạn thích làm gì vào thời gian rảnh? Hãy kể chi tiết về một sở thích bạn yêu thích nhất và tại sao bạn bắt đầu theo đuổi nó.',
     'SpeakingRecording','Speaking','Medium',10,TRUE,FALSE,'opic',2,120,
     '["opic","hobbies","combo2"]',v_created_by,NOW()),
    (q05,
     'Bạn thường nghe nhạc hoặc xem phim thể loại nào? Hãy kể về một bài hát, album, hoặc bộ phim mà bạn yêu thích gần đây.',
     'SpeakingRecording','Speaking','Medium',10,TRUE,FALSE,'opic',2,120,
     '["opic","hobbies","combo2"]',v_created_by,NOW()),
    (q06,
     'Kể về lần gần nhất bạn tham gia một hoạt động thể thao hoặc vận động thể chất. Bạn cảm thấy thế nào sau đó?',
     'SpeakingRecording','Speaking','Medium',10,TRUE,FALSE,'opic',2,120,
     '["opic","hobbies","combo2"]',v_created_by,NOW());

    -- ══════════════════════════════════════════════════════════════════════════
    -- COMBO 3 — Du lịch & Kỳ nghỉ (Travel)
    -- ══════════════════════════════════════════════════════════════════════════

    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty",
        "DefaultScore","IsPublic","IsDeleted","ExamModeTag","AudioPlayLimit",
        "SpeakingTimeLimitSec","Tags","CreatedBy","CreatedAt")
    VALUES
    (q07,
     'Kể về một chuyến du lịch đáng nhớ nhất của bạn. Bạn đi đâu, với ai, và điều gì khiến chuyến đi đó đặc biệt?',
     'SpeakingRecording','Speaking','Medium',10,TRUE,FALSE,'opic',2,120,
     '["opic","travel","combo3"]',v_created_by,NOW()),
    (q08,
     'Bạn thích đi du lịch một mình hay theo nhóm? Hãy so sánh hai hình thức này và cho biết bạn thích kiểu nào hơn, vì sao?',
     'SpeakingRecording','Speaking','Medium',10,TRUE,FALSE,'opic',2,120,
     '["opic","travel","combo3"]',v_created_by,NOW()),
    (q09,
     'Nếu được đi bất kỳ đâu trên thế giới vào tuần tới, bạn sẽ chọn điểm đến nào và tại sao? Bạn sẽ làm gì ở đó?',
     'SpeakingRecording','Speaking','Hard',10,TRUE,FALSE,'opic',2,120,
     '["opic","travel","combo3"]',v_created_by,NOW());

    -- ══════════════════════════════════════════════════════════════════════════
    -- COMBO 4 — Công việc & Học tập (Work / Study)
    -- ══════════════════════════════════════════════════════════════════════════

    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty",
        "DefaultScore","IsPublic","IsDeleted","ExamModeTag","AudioPlayLimit",
        "SpeakingTimeLimitSec","Tags","CreatedBy","CreatedAt")
    VALUES
    (q10,
     'Hãy mô tả công việc hoặc chương trình học hiện tại của bạn. Trách nhiệm chính của bạn là gì?',
     'SpeakingRecording','Speaking','Medium',10,TRUE,FALSE,'opic',2,120,
     '["opic","work_study","combo4"]',v_created_by,NOW()),
    (q11,
     'Điều gì bạn thích nhất và ít thích nhất về công việc hoặc việc học của bạn? Tại sao?',
     'SpeakingRecording','Speaking','Medium',10,TRUE,FALSE,'opic',2,120,
     '["opic","work_study","combo4"]',v_created_by,NOW()),
    (q12,
     'Kể về một thách thức lớn mà bạn đã phải đối mặt trong công việc hoặc học tập và cách bạn đã vượt qua nó.',
     'SpeakingRecording','Speaking','Hard',10,TRUE,FALSE,'opic',2,120,
     '["opic","work_study","combo4"]',v_created_by,NOW());

    -- ══════════════════════════════════════════════════════════════════════════
    -- COMBO 5 — Đóng vai (Role-Play)
    -- ══════════════════════════════════════════════════════════════════════════

    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty",
        "DefaultScore","IsPublic","IsDeleted","ExamModeTag","AudioPlayLimit",
        "SpeakingTimeLimitSec","Tags","CreatedBy","CreatedAt")
    VALUES
    (q13,
     '[Đóng vai] Bạn đang gọi điện đến nhà hàng để đặt bàn cho 4 người vào tối thứ Bảy. Hãy thực hiện cuộc gọi: xin phép đặt bàn, hỏi về menu đặc biệt, và xác nhận thời gian.',
     'OPICRolePlay','Speaking','Hard',10,TRUE,FALSE,'opic',2,150,
     '["opic","roleplay","combo5"]',v_created_by,NOW()),
    (q14,
     '[Đóng vai] Bạn bị lạc đường và cần hỏi người qua đường để đến nhà ga trung tâm. Hãy hỏi đường, xác nhận lại chỉ dẫn, và cảm ơn.',
     'OPICRolePlay','Speaking','Hard',10,TRUE,FALSE,'opic',2,150,
     '["opic","roleplay","combo5"]',v_created_by,NOW()),
    (q15,
     'Bạn vừa hoàn thành bài thi OPIC hôm nay. Hãy nói về những gì bạn nghĩ bạn đã làm tốt, những phần cần cải thiện, và mục tiêu tiếng Anh của bạn trong 6 tháng tới.',
     'SpeakingRecording','Speaking','Hard',10,TRUE,FALSE,'opic',2,150,
     '["opic","reflection","combo5"]',v_created_by,NOW());

    -- ── QuizQuestions (link quiz → questions) ─────────────────────────────────
    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt")
    VALUES
    (qq01,v_quiz_id,q01, 1,10,NOW()),
    (qq02,v_quiz_id,q02, 2,10,NOW()),
    (qq03,v_quiz_id,q03, 3,10,NOW()),
    (qq04,v_quiz_id,q04, 4,10,NOW()),
    (qq05,v_quiz_id,q05, 5,10,NOW()),
    (qq06,v_quiz_id,q06, 6,10,NOW()),
    (qq07,v_quiz_id,q07, 7,10,NOW()),
    (qq08,v_quiz_id,q08, 8,10,NOW()),
    (qq09,v_quiz_id,q09, 9,10,NOW()),
    (qq10,v_quiz_id,q10,10,10,NOW()),
    (qq11,v_quiz_id,q11,11,10,NOW()),
    (qq12,v_quiz_id,q12,12,10,NOW()),
    (qq13,v_quiz_id,q13,13,10,NOW()),
    (qq14,v_quiz_id,q14,14,10,NOW()),
    (qq15,v_quiz_id,q15,15,10,NOW());

    RAISE NOTICE 'OPIC demo quiz tạo thành công: %', v_quiz_id;
END $$;
