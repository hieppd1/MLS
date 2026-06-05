-- Sprint 5.6: Link published quizzes to courses
-- Run in the tenant schema after phase5-migration.sql
SET search_path TO tenant_demo;

-- Show current state before update
SELECT q."Id", q."Title", q."QuizType", q."Status", q."CourseId", q."SessionId", q."VideoTriggerSecond"
FROM "Quizzes" q
ORDER BY q."CreatedAt";

-- Link the first 2 published non-placement quizzes (that have no course/session) to the first published course
WITH target_course AS (
    SELECT "Id" FROM "Courses" WHERE "Status" = 'Published' ORDER BY "CreatedAt" LIMIT 1
),
quizzes_to_link AS (
    SELECT q."Id"
    FROM "Quizzes" q
    WHERE q."Status" = 'Published'
      AND q."QuizType" != 'Placement'
      AND q."CourseId" IS NULL
      AND q."SessionId" IS NULL
    ORDER BY q."CreatedAt"
    LIMIT 2
)
UPDATE "Quizzes" q
SET "CourseId" = (SELECT "Id" FROM target_course),
    "UpdatedAt" = NOW()
FROM quizzes_to_link
WHERE q."Id" = quizzes_to_link."Id";

-- Link a video-trigger quiz to the first available video session
-- Only if a quiz exists with VideoTriggerSecond set but no SessionId
DO $$
DECLARE
    v_session_id UUID;
    v_quiz_id    UUID;
BEGIN
    -- Find a video session
    SELECT s."Id" INTO v_session_id
    FROM "Sessions" s
    WHERE s."SessionType" = 'Interactive'
    ORDER BY s."CreatedAt"
    LIMIT 1;

    -- Find an unlinked published quiz that has a VideoTriggerSecond
    SELECT q."Id" INTO v_quiz_id
    FROM "Quizzes" q
    WHERE q."Status" = 'Published'
      AND q."VideoTriggerSecond" IS NOT NULL
      AND q."SessionId" IS NULL
    ORDER BY q."CreatedAt"
    LIMIT 1;

    IF v_session_id IS NOT NULL AND v_quiz_id IS NOT NULL THEN
        UPDATE "Quizzes"
        SET "SessionId" = v_session_id, "UpdatedAt" = NOW()
        WHERE "Id" = v_quiz_id;

        RAISE NOTICE 'Linked quiz % to session % (video trigger)', v_quiz_id, v_session_id;
    ELSE
        RAISE NOTICE 'No video-trigger quiz or video session found to link';
    END IF;
END $$;

-- Verify result
SELECT q."Id", q."Title", q."QuizType", q."Status",
       q."CourseId", q."SessionId", q."VideoTriggerSecond"
FROM "Quizzes" q
ORDER BY q."CreatedAt";
