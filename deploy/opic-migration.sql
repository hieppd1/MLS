-- ============================================================================
-- OPIC Mode Migration  (Phase 3.2)
-- Run against schema: tenant_demo
-- ============================================================================

SET search_path TO tenant_demo;

-- ── 1. Extend existing tables ─────────────────────────────────────────────────

ALTER TABLE "Questions"
    ADD COLUMN IF NOT EXISTS "AudioPlayLimit" INT;

ALTER TABLE "QuizAttempts"
    ADD COLUMN IF NOT EXISTS "ExamMeta" JSONB;

-- ── 2. OPICTopicSurveys ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "OPICTopicSurveys" (
    "Id"               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "UserId"           UUID        NOT NULL,
    "Language"         VARCHAR(10) NOT NULL DEFAULT 'vi',
    "SelectedTopics"   JSONB       NOT NULL DEFAULT '[]',
    "TargetLevel"      VARCHAR(10),
    "ChosenDifficulty" INT         NOT NULL DEFAULT 3,
    "CreatedAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),
    "UpdatedAt"        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "IX_OPICTopicSurveys_UserId_Language"
    ON "OPICTopicSurveys" ("UserId", "Language");

-- ── 3. OPICSessions ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "OPICSessions" (
    "Id"               UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "UserId"           UUID         NOT NULL,
    "SurveyId"         UUID,
    "Language"         VARCHAR(10)  NOT NULL DEFAULT 'vi',
    "SessionState"     VARCHAR(30)  NOT NULL DEFAULT 'Orientation',
    "ChosenDifficulty" INT          NOT NULL DEFAULT 3,
    "MidAdjustChoice"  VARCHAR(10),
    "FinalDifficulty"  INT,
    "OPICLevelResult"  VARCHAR(10),
    "OverallScore"     NUMERIC(5,2),
    "IsCompleted"      BOOLEAN      NOT NULL DEFAULT FALSE,
    "StartedAt"        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "CompletedAt"      TIMESTAMPTZ,
    "CreatedAt"        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "UpdatedAt"        TIMESTAMPTZ,
    CONSTRAINT "FK_OPICSessions_Survey"
        FOREIGN KEY ("SurveyId") REFERENCES "OPICTopicSurveys" ("Id")
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "IX_OPICSessions_UserId"
    ON "OPICSessions" ("UserId");

CREATE INDEX IF NOT EXISTS "IX_OPICSessions_UserId_Language_StartedAt"
    ON "OPICSessions" ("UserId", "Language", "StartedAt" DESC);

-- ── 4. OPICComboGroups ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "OPICComboGroups" (
    "Id"            UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "SessionId"     UUID         NOT NULL,
    "ComboIndex"    INT          NOT NULL,     -- 1–5
    "TopicCategory" VARCHAR(100) NOT NULL,
    "TopicType"     VARCHAR(50)  NOT NULL,
    "ComboQuestions" JSONB       NOT NULL DEFAULT '[]',   -- [questionId,...]
    "CreatedAt"     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "UpdatedAt"     TIMESTAMPTZ,
    CONSTRAINT "FK_OPICComboGroups_Session"
        FOREIGN KEY ("SessionId") REFERENCES "OPICSessions" ("Id")
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_OPICComboGroups_SessionId"
    ON "OPICComboGroups" ("SessionId");

-- ── 5. OPICAttemptRefs ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "OPICAttemptRefs" (
    "Id"            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "SessionId"     UUID        NOT NULL,
    "AttemptId"     UUID        NOT NULL,
    "QuestionIndex" INT         NOT NULL,   -- 1–15
    "CreatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
    "UpdatedAt"     TIMESTAMPTZ,
    CONSTRAINT "FK_OPICAttemptRefs_Session"
        FOREIGN KEY ("SessionId") REFERENCES "OPICSessions" ("Id")
        ON DELETE CASCADE,
    CONSTRAINT "UQ_OPICAttemptRefs_Session_Question"
        UNIQUE ("SessionId", "QuestionIndex")
);

CREATE INDEX IF NOT EXISTS "IX_OPICAttemptRefs_SessionId"
    ON "OPICAttemptRefs" ("SessionId");

-- ── 6. OPICLevelResults ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "OPICLevelResults" (
    "Id"                    UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "UserId"                UUID         NOT NULL,
    "SessionId"             UUID         NOT NULL,
    "Language"              VARCHAR(10)  NOT NULL DEFAULT 'vi',
    "AssignedLevel"         VARCHAR(10)  NOT NULL,   -- NH|IL|IM1|IM2|IM3|IH|AL
    "OverallScore"          NUMERIC(5,2) NOT NULL,
    "PronunciationScore"    NUMERIC(5,2) NOT NULL DEFAULT 0,
    "FluencyScore"          NUMERIC(5,2) NOT NULL DEFAULT 0,
    "CoherenceScore"        NUMERIC(5,2) NOT NULL DEFAULT 0,
    "VocabularyScore"       NUMERIC(5,2) NOT NULL DEFAULT 0,
    "TaskAchievementScore"  NUMERIC(5,2) NOT NULL DEFAULT 0,
    "LlmLevelJustification" JSONB,
    "StrongestSkill"        VARCHAR(50),
    "WeakestSkill"          VARCHAR(50),
    "ImprovementAdvice"     TEXT,
    "TestedAt"              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "CreatedAt"             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "UpdatedAt"             TIMESTAMPTZ,
    CONSTRAINT "FK_OPICLevelResults_Session"
        FOREIGN KEY ("SessionId") REFERENCES "OPICSessions" ("Id")
        ON DELETE CASCADE,
    CONSTRAINT "UQ_OPICLevelResults_Session"
        UNIQUE ("SessionId")
);

CREATE INDEX IF NOT EXISTS "IX_OPICLevelResults_UserId_Language"
    ON "OPICLevelResults" ("UserId", "Language");

-- ── 7. OPICScriptTemplates ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "OPICScriptTemplates" (
    "Id"              UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "CreatedBy"       UUID         NOT NULL,
    "Language"        VARCHAR(10)  NOT NULL DEFAULT 'vi',
    "TopicCategory"   VARCHAR(100) NOT NULL,
    "ComboType"       VARCHAR(50)  NOT NULL,
    "TargetLevel"     VARCHAR(10),
    "OpeningTemplate" TEXT         NOT NULL DEFAULT '',
    "BodyTemplate"    TEXT         NOT NULL DEFAULT '',
    "ClosingTemplate" TEXT         NOT NULL DEFAULT '',
    "VocabList"       JSONB,
    "UsefulPhrases"   JSONB,
    "IsPublished"     BOOLEAN      NOT NULL DEFAULT FALSE,
    "CreatedAt"       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "UpdatedAt"       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "IX_OPICScriptTemplates_Published_Language"
    ON "OPICScriptTemplates" ("IsPublished", "Language");

-- ── Done ──────────────────────────────────────────────────────────────────────

DO $$
BEGIN
    RAISE NOTICE 'OPIC migration completed successfully.';
END $$;
