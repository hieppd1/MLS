-- ============================================================
-- PHASE 3 QUIZ — REVIEW FIXES MIGRATION
-- Generated from phase3_quiz_design_REVIEW.md
-- Apply on schema: tenant_demo (run via psql or pgAdmin)
-- ============================================================

-- ── R2: ExpiresAt on QuizAttempts ────────────────────────────────────────────
ALTER TABLE "QuizAttempts"
    ADD COLUMN IF NOT EXISTS "ExpiresAt" TIMESTAMPTZ;

-- ── Y13: Soft delete for Questions ───────────────────────────────────────────
ALTER TABLE "Questions"
    ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Questions"
    ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMPTZ;

-- Backfill: mark any questions that are no longer in any quiz as deleted
-- (Optional — comment out if you want to keep all existing questions active)
-- UPDATE "Questions" SET "IsDeleted" = TRUE, "DeletedAt" = now()
-- WHERE "Id" NOT IN (SELECT DISTINCT "QuestionId" FROM "QuizQuestions");

-- ── G1: Performance indexes ───────────────────────────────────────────────────

-- Partial index on InProgress attempts per user (common lookup)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attempts_user_state
    ON "QuizAttempts"("UserId", "State")
    WHERE "State" = 'InProgress';

-- Composite index for answer lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_answers_attempt_question
    ON "AttemptAnswers"("AttemptId", "QuestionId");

-- Placement results ordered by date (cooldown check)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_placement_user_date
    ON "PlacementResults"("UserId", "TestedAt" DESC);

-- Active questions filter (used by global query filter)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_isdeleted
    ON "Questions"("IsDeleted")
    WHERE "IsDeleted" = FALSE;

-- ── G2: DisplayOrder unique constraint on QuizQuestions ──────────────────────
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_quiz_questions_order
    ON "QuizQuestions"("QuizId", "DisplayOrder");

-- ── G5: Level check constraints ───────────────────────────────────────────────
ALTER TABLE "PlacementResults"
    DROP CONSTRAINT IF EXISTS chk_placement_level;
ALTER TABLE "PlacementResults"
    ADD CONSTRAINT chk_placement_level
    CHECK ("AssignedLevel" BETWEEN 1 AND 6);

-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT
    column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name IN ('QuizAttempts', 'Questions')
  AND column_name IN ('ExpiresAt', 'IsDeleted', 'DeletedAt')
ORDER BY table_name, column_name;
