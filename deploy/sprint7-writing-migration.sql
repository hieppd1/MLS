-- Sprint 7: Writing AI — WritingSubmissions table
-- Run in schema: tenant_demo

SET search_path TO tenant_demo, public;

-- ── 1. Create WritingSubmissions table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "WritingSubmissions" (
    "Id"                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "AttemptAnswerId"       UUID         NOT NULL REFERENCES "AttemptAnswers"("Id") ON DELETE RESTRICT,
    "UserId"                UUID         NOT NULL,
    "EssayText"             TEXT         NOT NULL,
    "WordCount"             INT          NOT NULL DEFAULT 0,
    "TaskType"              VARCHAR(20),
    "EssayType"             VARCHAR(30),
    "GrammarErrors"         JSONB,
    "VocabularyAnalysis"    JSONB,
    "GrammarScore"          DECIMAL(5,2),
    "VocabularyScore"       DECIMAL(5,2),
    "CoherenceScore"        DECIMAL(5,2),
    "TaskAchievementScore"  DECIMAL(5,2),
    "FinalScore"            DECIMAL(5,2),
    "LlmFeedback"           TEXT,
    "GradingStatus"         VARCHAR(20)  NOT NULL DEFAULT 'Pending',
    "ExamModeTag"           VARCHAR(50),
    "ProcessedAt"           TIMESTAMPTZ,
    "CreatedAt"             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "UpdatedAt"             TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_writing_answer ON "WritingSubmissions"("AttemptAnswerId");
CREATE INDEX IF NOT EXISTS idx_writing_user   ON "WritingSubmissions"("UserId");
CREATE INDEX IF NOT EXISTS idx_writing_status ON "WritingSubmissions"("GradingStatus")
    WHERE "GradingStatus" IN ('Pending', 'Processing');

-- ── 2. Add writing-related fields to Questions (if not exist) ──────────────────
ALTER TABLE "Questions"
    ADD COLUMN IF NOT EXISTS "WritingMinWords"    INT,
    ADD COLUMN IF NOT EXISTS "WritingMaxWords"    INT,
    ADD COLUMN IF NOT EXISTS "WritingTaskType"    VARCHAR(20),
    ADD COLUMN IF NOT EXISTS "WritingPrompt"      TEXT,
    ADD COLUMN IF NOT EXISTS "BulletPoints"       JSONB;   -- for VSTEP Letter task points

COMMENT ON TABLE "WritingSubmissions" IS 'Sprint 7: Writing AI submissions with LLM grading';
