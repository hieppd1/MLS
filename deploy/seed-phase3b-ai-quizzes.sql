-- ============================================================
-- Seed: Phase 3B AI Test Quizzes
-- Tao: 1 SpeakingTest quiz + 1 WritingTest quiz (standard + VSTEP)
-- Schema: tenant_demo
-- Idempotent: dung INSERT ... ON CONFLICT DO NOTHING
-- Chay: docker exec -i <pg-container> psql -U postgres -d mls -f /path/seed-phase3b-ai-quizzes.sql
--   hoac: psql -U postgres -d mls -f deploy/seed-phase3b-ai-quizzes.sql
-- ============================================================
SET client_encoding = 'UTF8';
SET search_path TO tenant_demo;

DO $$
DECLARE
    admin_id         UUID;

    -- Fixed IDs (idempotent)
    sp_quiz_id  UUID := 'dddddddd-0001-0000-0000-000000000001';  -- SpeakingTest
    wr_quiz_id  UUID := 'dddddddd-0001-0000-0000-000000000002';  -- WritingTest (standard)
    wv_quiz_id  UUID := 'dddddddd-0001-0000-0000-000000000003';  -- WritingTest (VSTEP T1)

    q_sp1       UUID := 'eeeeeeee-0001-0000-0000-000000000001';  -- Speaking q1
    q_sp2       UUID := 'eeeeeeee-0001-0000-0000-000000000002';  -- Speaking q2
    q_wr1       UUID := 'eeeeeeee-0001-0000-0000-000000000011';  -- Writing standard
    q_wv1       UUID := 'eeeeeeee-0001-0000-0000-000000000021';  -- Writing VSTEP letter

BEGIN
    SELECT "Id" INTO admin_id FROM "Users" LIMIT 1;

    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'No users found. Run auth seed first.';
    END IF;

    -- ═══════════════════════════════════════════════════════════════
    -- QUIZ 1: Speaking Test (Standard)
    -- URL: /quiz/dddddddd-0001-0000-0000-000000000001/speaking
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO "Quizzes" (
        "Id", "Title", "Description", "QuizType", "SkillType", "Status",
        "Level", "Duration", "TotalScore", "PassingScore",
        "RandomQuestion", "RandomAnswer", "AllowRetry", "RetryLimit",
        "ShowCorrectAnswer", "ShowExplanation", "CreatedBy", "CreatedAt"
    ) VALUES (
        sp_quiz_id,
        'Speaking Test — Phát âm cơ bản',
        'Bài kiểm tra phát âm và độ lưu loát tiếng Anh. Ghi âm câu trả lời của bạn.',
        'SpeakingTest', 'Speaking', 'Published',
        2, 600, 10.0, 7.0,
        FALSE, FALSE, TRUE, 3,
        FALSE, FALSE, admin_id, NOW()
    ) ON CONFLICT ("Id") DO NOTHING;

    -- Speaking Question 1 — Describe a picture
    INSERT INTO "Questions" (
        "Id", "Content", "Type", "SkillType", "Difficulty",
        "Explanation", "DefaultScore", "IsPublic", "CreatedBy", "CreatedAt"
    ) VALUES (
        q_sp1,
        '<p><strong>Describe your daily routine in English.</strong></p><p>Talk for about 1 minute about what you do every day — from morning to evening. Include details about meals, work/study, and activities.</p>',
        'SpeakingRecording', 'Speaking', 'Easy',
        'Aim for 5-8 sentences. Use present simple tense for habits.',
        5.0, TRUE, admin_id, NOW()
    ) ON CONFLICT ("Id") DO NOTHING;

    -- Speaking Question 2 — Opinion question
    INSERT INTO "Questions" (
        "Id", "Content", "Type", "SkillType", "Difficulty",
        "Explanation", "DefaultScore", "IsPublic", "CreatedBy", "CreatedAt"
    ) VALUES (
        q_sp2,
        '<p><strong>Do you think technology has made life better or worse? Why?</strong></p><p>Give your opinion and support it with 2-3 examples. Speak for about 1 minute.</p>',
        'SpeakingRecording', 'Speaking', 'Medium',
        'Use phrases like "I believe...", "For example...", "In my opinion..."',
        5.0, TRUE, admin_id, NOW()
    ) ON CONFLICT ("Id") DO NOTHING;

    -- Link questions to speaking quiz
    INSERT INTO "QuizQuestions" ("Id", "QuizId", "QuestionId", "DisplayOrder", "Score", "CreatedAt")
    VALUES
        (gen_random_uuid(), sp_quiz_id, q_sp1, 1, 5.0, NOW()),
        (gen_random_uuid(), sp_quiz_id, q_sp2, 2, 5.0, NOW())
    ON CONFLICT DO NOTHING;

    -- ═══════════════════════════════════════════════════════════════
    -- QUIZ 2: Writing Test (Standard Essay)
    -- URL: /quiz/dddddddd-0001-0000-0000-000000000002/writing
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO "Quizzes" (
        "Id", "Title", "Description", "QuizType", "SkillType", "Status",
        "Level", "Duration", "TotalScore", "PassingScore",
        "RandomQuestion", "RandomAnswer", "AllowRetry", "RetryLimit",
        "ShowCorrectAnswer", "ShowExplanation", "CreatedBy", "CreatedAt"
    ) VALUES (
        wr_quiz_id,
        'Writing Test — Argumentative Essay',
        'Viết bài luận trình bày quan điểm. Cần viết tối thiểu 150 từ.',
        'WritingTest', 'Writing', 'Published',
        3, 2400, 10.0, 7.0,
        FALSE, FALSE, TRUE, 3,
        FALSE, FALSE, admin_id, NOW()
    ) ON CONFLICT ("Id") DO NOTHING;

    -- Writing question (standard essay)
    INSERT INTO "Questions" (
        "Id", "Content", "Type", "SkillType", "Difficulty",
        "Explanation", "DefaultScore", "IsPublic", "CreatedBy", "CreatedAt"
    ) VALUES (
        q_wr1,
        '<p><strong>Topic:</strong> Some people believe that social media has a positive effect on society, while others disagree.</p><p>Write an essay discussing both views and give your own opinion. Write at least <strong>150 words</strong>.</p>',
        'EssayWriting', 'Writing', 'Medium',
        'Structure: Introduction → Arguments for → Arguments against → Your opinion → Conclusion',
        10.0, TRUE, admin_id, NOW()
    ) ON CONFLICT ("Id") DO NOTHING;

    -- Set writing-specific columns if migration has been applied
    UPDATE "Questions" SET
        "WritingMinWords" = 150,
        "WritingMaxWords" = 400,
        "WritingTaskType" = 'essay_standard',
        "WritingPrompt"   = 'Discuss both views on social media''s effect on society and give your own opinion.'
    WHERE "Id" = q_wr1;

    INSERT INTO "QuizQuestions" ("Id", "QuizId", "QuestionId", "DisplayOrder", "Score", "CreatedAt")
    VALUES (gen_random_uuid(), wr_quiz_id, q_wr1, 1, 10.0, NOW())
    ON CONFLICT DO NOTHING;

    -- ═══════════════════════════════════════════════════════════════
    -- QUIZ 3: Writing Test (VSTEP T1 — Formal Letter)
    -- URL: /quiz/dddddddd-0001-0000-0000-000000000003/writing
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO "Quizzes" (
        "Id", "Title", "Description", "QuizType", "SkillType", "Status",
        "Level", "Duration", "TotalScore", "PassingScore",
        "RandomQuestion", "RandomAnswer", "AllowRetry", "RetryLimit",
        "ShowCorrectAnswer", "ShowExplanation", "CreatedBy", "CreatedAt"
    ) VALUES (
        wv_quiz_id,
        'VSTEP Writing Task 1 — Formal Letter',
        'Viết thư chính thức theo định dạng VSTEP. Tối thiểu 120 từ, tối đa 200 từ.',
        'WritingTest', 'Writing', 'Published',
        4, 1800, 10.0, 7.0,
        FALSE, FALSE, TRUE, 3,
        FALSE, FALSE, admin_id, NOW()
    ) ON CONFLICT ("Id") DO NOTHING;

    -- VSTEP Writing question (formal letter)
    INSERT INTO "Questions" (
        "Id", "Content", "Type", "SkillType", "Difficulty",
        "Explanation", "DefaultScore", "IsPublic", "CreatedBy", "CreatedAt"
    ) VALUES (
        q_wv1,
        '<p><strong>VSTEP Writing Task 1 — Letter of Complaint</strong></p><p>You recently bought a laptop from an electronics store, but it has several problems. Write a letter to the store manager. In your letter:</p><ul><li>Describe the problems with the laptop</li><li>Explain what actions you have taken so far</li><li>Say what you would like the manager to do</li></ul>',
        'EssayWriting', 'Writing', 'Hard',
        'Use formal letter format: Date, Salutation (Dear Mr/Ms...), 3 body paragraphs, Sign-off (Yours sincerely/faithfully)',
        10.0, TRUE, admin_id, NOW()
    ) ON CONFLICT ("Id") DO NOTHING;

    -- Set writing-specific columns if migration has been applied
    UPDATE "Questions" SET
        "WritingMinWords" = 120,
        "WritingMaxWords" = 200,
        "WritingTaskType" = 'letter',
        "WritingPrompt"   = 'Write a formal letter of complaint about a defective laptop.',
        "BulletPoints"    = '["Describe the problems with the laptop","Explain what actions you have taken so far","Say what you would like the manager to do"]'::jsonb
    WHERE "Id" = q_wv1;

    INSERT INTO "QuizQuestions" ("Id", "QuizId", "QuestionId", "DisplayOrder", "Score", "CreatedAt")
    VALUES (gen_random_uuid(), wv_quiz_id, q_wv1, 1, 10.0, NOW())
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Phase 3B seed complete:';
    RAISE NOTICE '  Speaking quiz: /quiz/dddddddd-0001-0000-0000-000000000001/speaking';
    RAISE NOTICE '  Writing quiz (standard): /quiz/dddddddd-0001-0000-0000-000000000002/writing';
    RAISE NOTICE '  Writing quiz (VSTEP T1): /quiz/dddddddd-0001-0000-0000-000000000003/writing';
END $$;
