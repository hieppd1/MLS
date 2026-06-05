SET search_path TO tenant_demo;

-- Add ExpiresAt to QuizAttempts
ALTER TABLE "QuizAttempts"
    ADD COLUMN IF NOT EXISTS "ExpiresAt" TIMESTAMPTZ;

-- Add IsDeleted + DeletedAt to Questions (if missing)
ALTER TABLE "Questions"
    ADD COLUMN IF NOT EXISTS "IsDeleted"  BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "DeletedAt"  TIMESTAMPTZ;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_attempts_user_state
    ON "QuizAttempts"("UserId", "State");

CREATE INDEX IF NOT EXISTS idx_answers_attempt_question
    ON "AttemptAnswers"("AttemptId", "QuestionId");

CREATE INDEX IF NOT EXISTS idx_placement_user_date
    ON "PlacementResults"("UserId", "TestedAt");

CREATE INDEX IF NOT EXISTS idx_questions_isdeleted
    ON "Questions"("IsDeleted");

CREATE INDEX IF NOT EXISTS idx_quiz_questions_order
    ON "QuizQuestions"("QuizId", "DisplayOrder");

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'tenant_demo'
  AND table_name = 'QuizAttempts'
  AND column_name = 'ExpiresAt';
