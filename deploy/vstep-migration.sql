-- Phase 3.3 — VSTEP Mode Migration
-- Run against schema: tenant_demo
SET search_path TO tenant_demo;

-- PassageGroups: links reading passages or audio clips to their questions
CREATE TABLE IF NOT EXISTS "PassageGroups" (
    "Id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "QuizId"          UUID NOT NULL REFERENCES "Quizzes"("Id") ON DELETE CASCADE,
    "GroupIndex"      INT NOT NULL,
    "PassageType"     VARCHAR(30) NOT NULL DEFAULT 'reading',
    "PassageText"     TEXT,
    "AudioUrl"        TEXT,
    "AudioPlayLimit"  INT NOT NULL DEFAULT 2,
    "PreListenSeconds" INT NOT NULL DEFAULT 20,
    "QuestionIds"     JSONB NOT NULL DEFAULT '[]',
    "DisplayOrder"    INT NOT NULL DEFAULT 0,
    "CreatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "UpdatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_passage_groups_quiz ON "PassageGroups"("QuizId");
CREATE INDEX IF NOT EXISTS idx_passage_groups_quiz_idx ON "PassageGroups"("QuizId", "GroupIndex");

-- VSTEPSessions: wrapper for the 4-part exam
CREATE TABLE IF NOT EXISTS "VSTEPSessions" (
    "Id"                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId"             UUID NOT NULL,
    "TargetBand"         VARCHAR(10),
    "CurrentPart"        VARCHAR(20) NOT NULL DEFAULT 'Listening',
    "PartState"          JSONB,
    "ListeningScore"     DECIMAL(4,2),
    "ReadingScore"       DECIMAL(4,2),
    "WritingScore"       DECIMAL(4,2),
    "SpeakingScore"      DECIMAL(4,2),
    "OverallScore"       DECIMAL(4,2),
    "AssignedBand"       VARCHAR(10),
    "AssignedLevel"      INT,
    "ListeningAttemptId" UUID REFERENCES "QuizAttempts"("Id"),
    "ReadingAttemptId"   UUID REFERENCES "QuizAttempts"("Id"),
    "WritingAttemptId"   UUID REFERENCES "QuizAttempts"("Id"),
    "SpeakingAttemptId"  UUID REFERENCES "QuizAttempts"("Id"),
    "IsCompleted"        BOOLEAN NOT NULL DEFAULT FALSE,
    "StartedAt"          TIMESTAMPTZ NOT NULL DEFAULT now(),
    "CompletedAt"        TIMESTAMPTZ,
    "CreatedAt"          TIMESTAMPTZ NOT NULL DEFAULT now(),
    "UpdatedAt"          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vstep_sessions_user ON "VSTEPSessions"("UserId");
CREATE INDEX IF NOT EXISTS idx_vstep_sessions_user_completed ON "VSTEPSessions"("UserId", "IsCompleted");

-- VSTEPBandResults: final 4-skill band result
CREATE TABLE IF NOT EXISTS "VSTEPBandResults" (
    "Id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId"           UUID NOT NULL,
    "SessionId"        UUID NOT NULL REFERENCES "VSTEPSessions"("Id") ON DELETE CASCADE,
    "AssignedBand"     VARCHAR(10) NOT NULL,
    "AssignedLevel"    INT NOT NULL,
    "ListeningScore"   DECIMAL(4,2) NOT NULL,
    "ReadingScore"     DECIMAL(4,2) NOT NULL,
    "WritingScore"     DECIMAL(4,2) NOT NULL,
    "SpeakingScore"    DECIMAL(4,2) NOT NULL,
    "OverallScore"     DECIMAL(4,2) NOT NULL,
    "SkillBreakdown"   JSONB,
    "RecommendedCourses" JSONB,
    "TestedAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
    "CreatedAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),
    "UpdatedAt"        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vstep_band_session ON "VSTEPBandResults"("SessionId");
CREATE INDEX IF NOT EXISTS idx_vstep_band_user ON "VSTEPBandResults"("UserId");
