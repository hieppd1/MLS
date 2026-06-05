-- =============================================================
-- Sprint 8: Adaptive Quiz — Seed Data
-- Requires: ExamMode column (added in sprint6-speaking-migration.sql)
-- Run against: mls database, schema tenant_demo
-- =============================================================
SET search_path TO tenant_demo, public;

-- Seed 1 Adaptive Quiz with 9 questions (3 Easy, 3 Medium, 3 Hard) for testing
DO $$
DECLARE
    q_id      UUID := 'eeeeeeee-0001-0000-0000-000000000001';
    a_id      UUID;
    b_id      UUID;
    c_id      UUID;
    teacher_id UUID;
BEGIN
    -- Get teacher
    SELECT u."Id" INTO teacher_id
    FROM "Users" u
    JOIN "UserRoles" ur ON ur."UserId" = u."Id"
    JOIN "Roles" r ON r."Id" = ur."RoleId"
    WHERE r."Name" = 'Teacher' LIMIT 1;

    IF teacher_id IS NULL THEN
        -- Fallback: first user
        SELECT "Id" INTO teacher_id FROM "Users" LIMIT 1;
    END IF;

    -- Insert quiz
    INSERT INTO "Quizzes" (
        "Id", "Title", "Description", "QuizType", "SkillType", "Status",
        "Level", "Duration", "TotalScore", "PassingScore",
        "RandomQuestion", "RandomAnswer", "AllowRetry", "ShowCorrectAnswer", "ShowExplanation",
        "CreatedBy", "ExamMode", "Language", "CreatedAt", "UpdatedAt"
    ) VALUES (
        q_id,
        'Adaptive Grammar Quiz (Demo)',
        'Adaptive grammar quiz - difficulty adjusts based on your answers.',
        'AdaptiveQuiz', 'Grammar', 'Published',
        1, NULL, 10, 6,
        false, false, true, true, true,
        teacher_id, 'Standard', 'en', now(), now()
    )
    ON CONFLICT ("Id") DO NOTHING;

    -- ── EASY questions ───────────────────────────────────────────────────────

    -- Q1 Easy
    a_id := gen_random_uuid();
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","CreatedBy","IsPublic","IsDeleted","CreatedAt","UpdatedAt")
    VALUES (a_id, 'She ___ a doctor.', 'SingleChoice', 'Grammar', 'Easy', 1, teacher_id, true, false, now(), now())
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt")
    VALUES (gen_random_uuid(), a_id, 'is', true, 1, now()),
           (gen_random_uuid(), a_id, 'are', false, 2, now()),
           (gen_random_uuid(), a_id, 'am', false, 3, now()),
           (gen_random_uuid(), a_id, 'be', false, 4, now())
    ON CONFLICT DO NOTHING;
    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt")
    VALUES (gen_random_uuid(), q_id, a_id, 1, 1, now()) ON CONFLICT DO NOTHING;

    -- Q2 Easy
    a_id := gen_random_uuid();
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","CreatedBy","IsPublic","IsDeleted","CreatedAt","UpdatedAt")
    VALUES (a_id, 'They ___ students.', 'SingleChoice', 'Grammar', 'Easy', 1, teacher_id, true, false, now(), now())
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt")
    VALUES (gen_random_uuid(), a_id, 'are', true, 1, now()),
           (gen_random_uuid(), a_id, 'is', false, 2, now()),
           (gen_random_uuid(), a_id, 'was', false, 3, now()),
           (gen_random_uuid(), a_id, 'am', false, 4, now())
    ON CONFLICT DO NOTHING;
    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt")
    VALUES (gen_random_uuid(), q_id, a_id, 2, 1, now()) ON CONFLICT DO NOTHING;

    -- Q3 Easy
    a_id := gen_random_uuid();
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","CreatedBy","IsPublic","IsDeleted","CreatedAt","UpdatedAt")
    VALUES (a_id, 'I ___ from Vietnam.', 'SingleChoice', 'Grammar', 'Easy', 1, teacher_id, true, false, now(), now())
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt")
    VALUES (gen_random_uuid(), a_id, 'am', true, 1, now()),
           (gen_random_uuid(), a_id, 'is', false, 2, now()),
           (gen_random_uuid(), a_id, 'are', false, 3, now()),
           (gen_random_uuid(), a_id, 'were', false, 4, now())
    ON CONFLICT DO NOTHING;
    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt")
    VALUES (gen_random_uuid(), q_id, a_id, 3, 1, now()) ON CONFLICT DO NOTHING;

    -- ── MEDIUM questions ─────────────────────────────────────────────────────

    -- Q4 Medium
    b_id := gen_random_uuid();
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","CreatedBy","IsPublic","IsDeleted","CreatedAt","UpdatedAt")
    VALUES (b_id, 'By the time she arrived, they ___ for two hours.', 'SingleChoice', 'Grammar', 'Medium', 1, teacher_id, true, false, now(), now())
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt")
    VALUES (gen_random_uuid(), b_id, 'had been waiting', true, 1, now()),
           (gen_random_uuid(), b_id, 'have been waiting', false, 2, now()),
           (gen_random_uuid(), b_id, 'were waiting', false, 3, now()),
           (gen_random_uuid(), b_id, 'waited', false, 4, now())
    ON CONFLICT DO NOTHING;
    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt")
    VALUES (gen_random_uuid(), q_id, b_id, 4, 1, now()) ON CONFLICT DO NOTHING;

    -- Q5 Medium
    b_id := gen_random_uuid();
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","CreatedBy","IsPublic","IsDeleted","CreatedAt","UpdatedAt")
    VALUES (b_id, 'She suggested that he ___ the report immediately.', 'SingleChoice', 'Grammar', 'Medium', 1, teacher_id, true, false, now(), now())
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt")
    VALUES (gen_random_uuid(), b_id, 'submit', true, 1, now()),
           (gen_random_uuid(), b_id, 'submits', false, 2, now()),
           (gen_random_uuid(), b_id, 'submitted', false, 3, now()),
           (gen_random_uuid(), b_id, 'to submit', false, 4, now())
    ON CONFLICT DO NOTHING;
    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt")
    VALUES (gen_random_uuid(), q_id, b_id, 5, 1, now()) ON CONFLICT DO NOTHING;

    -- Q6 Medium
    b_id := gen_random_uuid();
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","CreatedBy","IsPublic","IsDeleted","CreatedAt","UpdatedAt")
    VALUES (b_id, 'The book, ___ was published last year, became a bestseller.', 'SingleChoice', 'Grammar', 'Medium', 1, teacher_id, true, false, now(), now())
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt")
    VALUES (gen_random_uuid(), b_id, 'which', true, 1, now()),
           (gen_random_uuid(), b_id, 'that', false, 2, now()),
           (gen_random_uuid(), b_id, 'what', false, 3, now()),
           (gen_random_uuid(), b_id, 'who', false, 4, now())
    ON CONFLICT DO NOTHING;
    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt")
    VALUES (gen_random_uuid(), q_id, b_id, 6, 1, now()) ON CONFLICT DO NOTHING;

    -- ── HARD questions ───────────────────────────────────────────────────────

    -- Q7 Hard
    c_id := gen_random_uuid();
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","CreatedBy","IsPublic","IsDeleted","CreatedAt","UpdatedAt")
    VALUES (c_id, 'Had she studied harder, she ___ the exam.', 'SingleChoice', 'Grammar', 'Hard', 1, teacher_id, true, false, now(), now())
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt")
    VALUES (gen_random_uuid(), c_id, 'would have passed', true, 1, now()),
           (gen_random_uuid(), c_id, 'would pass', false, 2, now()),
           (gen_random_uuid(), c_id, 'will have passed', false, 3, now()),
           (gen_random_uuid(), c_id, 'had passed', false, 4, now())
    ON CONFLICT DO NOTHING;
    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt")
    VALUES (gen_random_uuid(), q_id, c_id, 7, 1, now()) ON CONFLICT DO NOTHING;

    -- Q8 Hard
    c_id := gen_random_uuid();
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","CreatedBy","IsPublic","IsDeleted","CreatedAt","UpdatedAt")
    VALUES (c_id, 'It is imperative that every citizen ___ the right to vote.', 'SingleChoice', 'Grammar', 'Hard', 1, teacher_id, true, false, now(), now())
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt")
    VALUES (gen_random_uuid(), c_id, 'be granted', true, 1, now()),
           (gen_random_uuid(), c_id, 'is granted', false, 2, now()),
           (gen_random_uuid(), c_id, 'was granted', false, 3, now()),
           (gen_random_uuid(), c_id, 'should grant', false, 4, now())
    ON CONFLICT DO NOTHING;
    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt")
    VALUES (gen_random_uuid(), q_id, c_id, 8, 1, now()) ON CONFLICT DO NOTHING;

    -- Q9 Hard
    c_id := gen_random_uuid();
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","CreatedBy","IsPublic","IsDeleted","CreatedAt","UpdatedAt")
    VALUES (c_id, 'No sooner ___ than it began to rain.', 'SingleChoice', 'Grammar', 'Hard', 1, teacher_id, true, false, now(), now())
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt")
    VALUES (gen_random_uuid(), c_id, 'had they left', true, 1, now()),
           (gen_random_uuid(), c_id, 'they had left', false, 2, now()),
           (gen_random_uuid(), c_id, 'did they leave', false, 3, now()),
           (gen_random_uuid(), c_id, 'they left', false, 4, now())
    ON CONFLICT DO NOTHING;
    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt")
    VALUES (gen_random_uuid(), q_id, c_id, 9, 1, now()) ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Sprint 8 Adaptive Quiz seeded successfully. Quiz ID: %', q_id;
END $$;

-- Verify
SELECT q."Id", q."Title", q."QuizType", q."Status",
       COUNT(qq."Id") AS question_count
FROM "Quizzes" q
LEFT JOIN "QuizQuestions" qq ON qq."QuizId" = q."Id"
WHERE q."QuizType" = 'AdaptiveQuiz'
GROUP BY q."Id", q."Title", q."QuizType", q."Status";
