-- =============================================================
-- Sprint 6: Speaking AI — DB Migration
-- Run against: mls database, schema tenant_demo
-- =============================================================

SET search_path TO tenant_demo, public;

-- ── 1. Extend Quiz table ──────────────────────────────────────────────────────
ALTER TABLE "Quizzes"
    ADD COLUMN IF NOT EXISTS "ExamMode" VARCHAR(20) NOT NULL DEFAULT 'Standard',
    ADD COLUMN IF NOT EXISTS "Language"  VARCHAR(10) NOT NULL DEFAULT 'vi';

-- ── 2. Extend Question table ──────────────────────────────────────────────────
ALTER TABLE "Questions"
    ADD COLUMN IF NOT EXISTS "SpeakingTimeLimitSec" INT,
    ADD COLUMN IF NOT EXISTS "ReferenceText"         TEXT,
    ADD COLUMN IF NOT EXISTS "ExamModeTag"           VARCHAR(50);

-- ── 3. Create SpeakingSubmissions table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "SpeakingSubmissions" (
    "Id"                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "AttemptAnswerId"      UUID         NOT NULL REFERENCES "AttemptAnswers"("Id") ON DELETE RESTRICT,
    "UserId"               UUID         NOT NULL,
    "AudioUrl"             TEXT         NOT NULL,
    "TranscriptText"       TEXT,
    "TranscriptUrl"        TEXT,
    "PronunciationScore"   DECIMAL(5,2),
    "FluencyScore"         DECIMAL(5,2),
    "AccuracyScore"        DECIMAL(5,2),
    "CoherenceScore"       DECIMAL(5,2),
    "VocabularyScore"      DECIMAL(5,2),
    "TaskAchievementScore" DECIMAL(5,2),
    "FinalScore"           DECIMAL(5,2),
    "PhonemeAnalysis"      JSONB,
    "LlmFeedback"          TEXT,
    "GradingStatus"        VARCHAR(20)  NOT NULL DEFAULT 'Pending',
    "ExamModeTag"          VARCHAR(50),
    "ProcessedAt"          TIMESTAMPTZ,
    "CreatedAt"            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "UpdatedAt"            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_speaking_answer
    ON "SpeakingSubmissions"("AttemptAnswerId");

CREATE INDEX IF NOT EXISTS idx_speaking_user
    ON "SpeakingSubmissions"("UserId");

CREATE INDEX IF NOT EXISTS idx_speaking_status
    ON "SpeakingSubmissions"("GradingStatus")
    WHERE "GradingStatus" IN ('Pending', 'Processing');

-- ── 4. Verify ─────────────────────────────────────────────────────────────────
SELECT 'SpeakingSubmissions created ✓' AS status
WHERE EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'tenant_demo'
      AND table_name   = 'SpeakingSubmissions'
);

SELECT 'ExamMode column on Quizzes ✓' AS status
WHERE EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema  = 'tenant_demo'
      AND table_name    = 'Quizzes'
      AND column_name   = 'ExamMode'
);
