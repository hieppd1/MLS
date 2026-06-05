-- ============================================================
-- Seed: Phase 3A Test Data
-- Tao: 1 PracticeQuiz du 6 loai cau hoi + 1 SegmentQuiz (video trigger)
-- Schema: tenant_demo
-- Chay: psql -U postgres -d mls -f deploy/seed-phase3a-testdata.sql
-- ============================================================
SET client_encoding = 'UTF8';
SET search_path TO tenant_demo;

DO $$
DECLARE
    admin_id       UUID;
    course_id      UUID;
    session_id     UUID;

    -- Fixed IDs để có thể chạy lại an toàn (idempotent)
    pq_id   UUID := 'aaaaaaaa-0001-0000-0000-000000000001';  -- PracticeQuiz
    vq_id   UUID := 'aaaaaaaa-0001-0000-0000-000000000002';  -- SegmentQuiz (video)

    -- Questions for practice quiz
    q_sc1   UUID := 'bbbbbbbb-0001-0000-0000-000000000001';  -- SingleChoice
    q_mc1   UUID := 'bbbbbbbb-0001-0000-0000-000000000002';  -- MultipleChoice
    q_tf1   UUID := 'bbbbbbbb-0001-0000-0000-000000000003';  -- TrueFalse
    q_fb1   UUID := 'bbbbbbbb-0001-0000-0000-000000000004';  -- FillBlank
    q_ma1   UUID := 'bbbbbbbb-0001-0000-0000-000000000005';  -- Matching
    q_or1   UUID := 'bbbbbbbb-0001-0000-0000-000000000006';  -- Ordering

    -- Question for video quiz
    q_vq1   UUID := 'cccccccc-0001-0000-0000-000000000001';  -- SingleChoice

BEGIN
    -- ── Lookup existing data ───────────────────────────────────────────────
    SELECT "Id" INTO admin_id FROM "Users" LIMIT 1;
    SELECT "Id" INTO course_id FROM "Courses" LIMIT 1;
    SELECT "Id" INTO session_id
    FROM "Sessions"
    WHERE "SessionType" = 'Interactive'
    LIMIT 1;

    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'No users found. Please seed users first.';
    END IF;

    RAISE NOTICE 'Using admin_id=%', admin_id;
    RAISE NOTICE 'Using course_id=%', course_id;
    RAISE NOTICE 'Using session_id=%', session_id;

    -- ── Cleanup previous run ───────────────────────────────────────────────
    DELETE FROM "AttemptAnswers"
    WHERE "AttemptId" IN (SELECT "Id" FROM "QuizAttempts" WHERE "QuizId" IN (pq_id, vq_id));
    DELETE FROM "QuizAttempts"  WHERE "QuizId" IN (pq_id, vq_id);
    DELETE FROM "QuizQuestions" WHERE "QuizId" IN (pq_id, vq_id);
    DELETE FROM "Quizzes"       WHERE "Id"     IN (pq_id, vq_id);

    DELETE FROM "QuestionOptions" WHERE "QuestionId" IN (q_sc1, q_mc1, q_tf1, q_fb1, q_ma1, q_or1, q_vq1);
    DELETE FROM "Questions"       WHERE "Id"         IN (q_sc1, q_mc1, q_tf1, q_fb1, q_ma1, q_or1, q_vq1);

    -- ══════════════════════════════════════════════════════════════════════
    -- 1. PRACTICE QUIZ
    -- ══════════════════════════════════════════════════════════════════════
    INSERT INTO "Quizzes" (
        "Id","Title","Description","QuizType","SkillType","Status",
        "Level","Duration","TotalScore","PassingScore",
        "AllowRetry","RetryLimit","RandomQuestion","RandomAnswer",
        "ShowCorrectAnswer","ShowExplanation",
        "CourseId","CreatedBy","CreatedAt"
    ) VALUES (
        pq_id,
        'Practice Quiz — All Question Types',
        'Bài luyện tập có đủ 6 loại câu hỏi: Trắc nghiệm 1 đáp án, Nhiều đáp án, Đúng/Sai, Điền từ, Nối cặp, Sắp xếp thứ tự.',
        'PracticeQuiz', 'Mixed', 'Published',
        1, 600, 6.0, 4.0,
        true, 3, false, false,
        true, true,
        course_id, admin_id, NOW()
    );

    -- ── Q1: SingleChoice ─────────────────────────────────────────────────
    INSERT INTO "Questions" (
        "Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt"
    ) VALUES (
        q_sc1,
        'Which animal makes a "bark" sound?',
        'SingleChoice', 'Vocabulary', 'Easy', 1,
        'Dogs bark. Cats meow. Birds tweet. Fish make no sound.',
        true, admin_id, NOW()
    );
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q_sc1, 'Cat',   false, 1, NOW()),
        (gen_random_uuid(), q_sc1, 'Dog',   true,  2, NOW()),
        (gen_random_uuid(), q_sc1, 'Bird',  false, 3, NOW()),
        (gen_random_uuid(), q_sc1, 'Fish',  false, 4, NOW());

    -- ── Q2: MultipleChoice ───────────────────────────────────────────────
    INSERT INTO "Questions" (
        "Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt"
    ) VALUES (
        q_mc1,
        'Which of the following are fruits? (Select ALL that apply)',
        'MultipleChoice', 'Vocabulary', 'Easy', 1,
        'Apple, Banana, Orange are fruits. Carrot and Potato are vegetables.',
        true, admin_id, NOW()
    );
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q_mc1, 'Apple',   true,  1, NOW()),
        (gen_random_uuid(), q_mc1, 'Carrot',  false, 2, NOW()),
        (gen_random_uuid(), q_mc1, 'Banana',  true,  3, NOW()),
        (gen_random_uuid(), q_mc1, 'Orange',  true,  4, NOW()),
        (gen_random_uuid(), q_mc1, 'Potato',  false, 5, NOW());

    -- ── Q3: TrueFalse ────────────────────────────────────────────────────
    INSERT INTO "Questions" (
        "Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt"
    ) VALUES (
        q_tf1,
        'The Earth orbits around the Sun.',
        'TrueFalse', 'Reading', 'Easy', 1,
        'TRUE. Earth takes approximately 365.25 days to complete one orbit.',
        true, admin_id, NOW()
    );
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q_tf1, 'True',  true,  1, NOW()),
        (gen_random_uuid(), q_tf1, 'False', false, 2, NOW());

    -- ── Q4: FillBlank ────────────────────────────────────────────────────
    INSERT INTO "Questions" (
        "Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt"
    ) VALUES (
        q_fb1,
        'The capital city of France is ___.',
        'FillBlank', 'Reading', 'Easy', 1,
        'Paris is the capital and most populous city of France.',
        true, admin_id, NOW()
    );
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q_fb1, 'Paris', true, 1, NOW());

    -- ── Q5: Matching ─────────────────────────────────────────────────────
    INSERT INTO "Questions" (
        "Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt"
    ) VALUES (
        q_ma1,
        'Match each animal with the sound it makes:',
        'Matching', 'Vocabulary', 'Medium', 1,
        'Dog→Bark, Cat→Meow, Bird→Tweet, Cow→Moo',
        true, admin_id, NOW()
    );
    -- MatchKey = left column label, MatchValue = correct right column value
    INSERT INTO "QuestionOptions" (
        "Id","QuestionId","Content","IsCorrect","DisplayOrder","MatchKey","MatchValue","CreatedAt"
    ) VALUES
        (gen_random_uuid(), q_ma1, 'Dog',  true, 1, 'Dog',  'Bark',  NOW()),
        (gen_random_uuid(), q_ma1, 'Cat',  true, 2, 'Cat',  'Meow',  NOW()),
        (gen_random_uuid(), q_ma1, 'Bird', true, 3, 'Bird', 'Tweet', NOW()),
        (gen_random_uuid(), q_ma1, 'Cow',  true, 4, 'Cow',  'Moo',   NOW());

    -- ── Q6: Ordering ─────────────────────────────────────────────────────
    INSERT INTO "Questions" (
        "Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt"
    ) VALUES (
        q_or1,
        'Put the steps for making a cup of tea in the CORRECT order:',
        'Ordering', 'Reading', 'Medium', 1,
        'Correct order: 1-Boil water, 2-Add tea bag, 3-Pour water, 4-Wait 3 min, 5-Remove bag, 6-Add sugar',
        true, admin_id, NOW()
    );
    -- DisplayOrder = the CORRECT position; content appears scrambled in UI
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q_or1, 'Boil water',       true, 1, NOW()),
        (gen_random_uuid(), q_or1, 'Add tea bag',       true, 2, NOW()),
        (gen_random_uuid(), q_or1, 'Pour hot water',    true, 3, NOW()),
        (gen_random_uuid(), q_or1, 'Wait 3 minutes',    true, 4, NOW()),
        (gen_random_uuid(), q_or1, 'Remove the tea bag',true, 5, NOW()),
        (gen_random_uuid(), q_or1, 'Add sugar or milk', true, 6, NOW());

    -- ── Link questions to quiz ────────────────────────────────────────────
    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt") VALUES
        (gen_random_uuid(), pq_id, q_sc1, 1, 1.0, NOW()),
        (gen_random_uuid(), pq_id, q_mc1, 2, 1.0, NOW()),
        (gen_random_uuid(), pq_id, q_tf1, 3, 1.0, NOW()),
        (gen_random_uuid(), pq_id, q_fb1, 4, 1.0, NOW()),
        (gen_random_uuid(), pq_id, q_ma1, 5, 1.0, NOW()),
        (gen_random_uuid(), pq_id, q_or1, 6, 1.0, NOW());

    -- ══════════════════════════════════════════════════════════════════════
    -- 2. SEGMENT QUIZ (Video Trigger at second 10)
    -- ══════════════════════════════════════════════════════════════════════
    IF session_id IS NOT NULL THEN
        INSERT INTO "Quizzes" (
            "Id","Title","Description","QuizType","SkillType","Status",
            "Level","Duration","TotalScore","PassingScore",
            "AllowRetry","RetryLimit","RandomQuestion","RandomAnswer",
            "ShowCorrectAnswer","ShowExplanation",
            "SessionId","VideoTriggerSecond","CreatedBy","CreatedAt"
        ) VALUES (
            vq_id,
            'Video Quiz — Kiểm tra nhanh',
            'Câu hỏi xuất hiện tại giây thứ 10 của video. Trả lời để tiếp tục xem bài.',
            'SegmentQuiz', 'Listening', 'Published',
            1, 30, 1.0, 0.0,
            true, NULL, false, false,
            true, true,
            session_id, 10, admin_id, NOW()
        );

        INSERT INTO "Questions" (
            "Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt"
        ) VALUES (
            q_vq1,
            'Tiếng Việt có bao nhiêu phụ âm đầu?',
            'SingleChoice', 'Listening', 'Easy', 1,
            'Tiếng Việt có 22 phụ âm đầu (initial consonants).',
            true, admin_id, NOW()
        );
        INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
            (gen_random_uuid(), q_vq1, '17 phụ âm', false, 1, NOW()),
            (gen_random_uuid(), q_vq1, '20 phụ âm', false, 2, NOW()),
            (gen_random_uuid(), q_vq1, '22 phụ âm', true,  3, NOW()),
            (gen_random_uuid(), q_vq1, '25 phụ âm', false, 4, NOW());

        INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt") VALUES
            (gen_random_uuid(), vq_id, q_vq1, 1, 1.0, NOW());

        RAISE NOTICE 'Video Quiz ID: % linked to session: %', vq_id, session_id;
    ELSE
        RAISE NOTICE 'No Interactive session found — Video Quiz skipped.';
    END IF;

    -- ══════════════════════════════════════════════════════════════════════
    -- 3. FAKE ATTEMPTS for Analytics (on Practice Quiz)
    -- ══════════════════════════════════════════════════════════════════════
    INSERT INTO "QuizAttempts" (
        "Id","QuizId","UserId","State","GradingMethod",
        "StartedAt","SubmittedAt","GradedAt",
        "Score","Percentage","Passed","AttemptNumber","TimeTaken","CreatedAt"
    ) VALUES
    (
        gen_random_uuid(), pq_id, admin_id, 'Graded', 'Auto',
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '3 days' + INTERVAL '9 minutes',
        NOW() - INTERVAL '3 days' + INTERVAL '9 minutes',
        3.0, 50.0, false, 1, 540, NOW() - INTERVAL '3 days'
    ),
    (
        gen_random_uuid(), pq_id, admin_id, 'Graded', 'Auto',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days' + INTERVAL '7 minutes',
        NOW() - INTERVAL '2 days' + INTERVAL '7 minutes',
        5.0, 83.3, true, 2, 420, NOW() - INTERVAL '2 days'
    ),
    (
        gen_random_uuid(), pq_id, admin_id, 'Graded', 'Auto',
        NOW() - INTERVAL '1 hour',
        NOW() - INTERVAL '1 hour' + INTERVAL '5 minutes',
        NOW() - INTERVAL '1 hour' + INTERVAL '5 minutes',
        6.0, 100.0, true, 3, 300, NOW() - INTERVAL '1 hour'
    );

    RAISE NOTICE '=== Phase 3A seed completed! ===';
    RAISE NOTICE 'Practice Quiz ID: %', pq_id;
    RAISE NOTICE 'Course ID used:   %', course_id;
    RAISE NOTICE '';
    RAISE NOTICE 'Test URLs:';
    RAISE NOTICE '  Quiz player: http://localhost:3000/quiz/%/play', pq_id;
    RAISE NOTICE '  Placement:   http://localhost:3000/placement-test';

END $$;
