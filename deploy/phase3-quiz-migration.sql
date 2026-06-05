-- =====================================================================
-- Sprint 1 — Phase 3A: Quiz Engine Tables
-- Apply to tenant schema: tenant_demo
-- =====================================================================

SET search_path TO tenant_demo, public;

-- Quizzes
CREATE TABLE IF NOT EXISTS "Quizzes" (
    "Id"                  UUID         NOT NULL DEFAULT gen_random_uuid(),
    "Title"               VARCHAR(300) NOT NULL,
    "Description"         TEXT,
    "QuizType"            VARCHAR(30)  NOT NULL DEFAULT 'PracticeQuiz',
    "SkillType"           VARCHAR(30)  NOT NULL DEFAULT 'Mixed',
    "Status"              VARCHAR(20)  NOT NULL DEFAULT 'Draft',
    "Level"               INT          NOT NULL DEFAULT 1,
    "Duration"            INT,
    "TotalScore"          DECIMAL(8,2) NOT NULL DEFAULT 10,
    "PassingScore"        DECIMAL(8,2) NOT NULL DEFAULT 7,
    "RandomQuestion"      BOOLEAN      NOT NULL DEFAULT FALSE,
    "RandomAnswer"        BOOLEAN      NOT NULL DEFAULT FALSE,
    "AllowRetry"          BOOLEAN      NOT NULL DEFAULT TRUE,
    "RetryLimit"          INT,
    "ShowCorrectAnswer"   BOOLEAN      NOT NULL DEFAULT TRUE,
    "ShowExplanation"     BOOLEAN      NOT NULL DEFAULT TRUE,
    "CreatedBy"           UUID         NOT NULL,
    "CourseId"            UUID         REFERENCES "Courses"("Id") ON DELETE SET NULL,
    "SessionId"           UUID         REFERENCES "Sessions"("Id") ON DELETE SET NULL,
    "VideoTriggerSecond"  INT,
    "CreatedAt"           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UpdatedAt"           TIMESTAMPTZ,
    CONSTRAINT "PK_Quizzes" PRIMARY KEY ("Id")
);

CREATE INDEX IF NOT EXISTS "IX_Quizzes_CourseId"
    ON "Quizzes"("CourseId") WHERE "CourseId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "IX_Quizzes_SessionId"
    ON "Quizzes"("SessionId") WHERE "SessionId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "IX_Quizzes_QuizType"
    ON "Quizzes"("QuizType");
CREATE INDEX IF NOT EXISTS "IX_Quizzes_Status"
    ON "Quizzes"("Status");

-- Questions (Question Bank)
CREATE TABLE IF NOT EXISTS "Questions" (
    "Id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
    "Content"      TEXT         NOT NULL,
    "AudioUrl"     VARCHAR(1000),
    "ImageUrl"     VARCHAR(1000),
    "VideoUrl"     VARCHAR(1000),
    "Type"         VARCHAR(30)  NOT NULL DEFAULT 'SingleChoice',
    "SkillType"    VARCHAR(30)  NOT NULL DEFAULT 'Mixed',
    "Difficulty"   VARCHAR(10)  NOT NULL DEFAULT 'Medium',
    "Explanation"  TEXT,
    "DefaultScore" DECIMAL(6,2) NOT NULL DEFAULT 1.0,
    "Tags"         TEXT,
    "IsPublic"     BOOLEAN      NOT NULL DEFAULT FALSE,
    "CreatedBy"    UUID         NOT NULL,
    "CreatedAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UpdatedAt"    TIMESTAMPTZ,
    CONSTRAINT "PK_Questions" PRIMARY KEY ("Id")
);

CREATE INDEX IF NOT EXISTS "IX_Questions_Type"       ON "Questions"("Type");
CREATE INDEX IF NOT EXISTS "IX_Questions_SkillType"  ON "Questions"("SkillType");
CREATE INDEX IF NOT EXISTS "IX_Questions_CreatedBy"  ON "Questions"("CreatedBy");
CREATE INDEX IF NOT EXISTS "IX_Questions_Difficulty" ON "Questions"("Difficulty");

-- QuestionOptions
CREATE TABLE IF NOT EXISTS "QuestionOptions" (
    "Id"                 UUID        NOT NULL DEFAULT gen_random_uuid(),
    "QuestionId"         UUID        NOT NULL REFERENCES "Questions"("Id") ON DELETE CASCADE,
    "Content"            TEXT        NOT NULL,
    "IsCorrect"          BOOLEAN     NOT NULL DEFAULT FALSE,
    "DisplayOrder"       INT         NOT NULL DEFAULT 0,
    "MatchKey"           VARCHAR(100),
    "MatchValue"         VARCHAR(500),
    "FeedbackIfSelected" TEXT,
    "CreatedAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"          TIMESTAMPTZ,
    CONSTRAINT "PK_QuestionOptions" PRIMARY KEY ("Id")
);

CREATE INDEX IF NOT EXISTS "IX_QuestionOptions_QuestionId" ON "QuestionOptions"("QuestionId");

-- QuizQuestions (join table)
CREATE TABLE IF NOT EXISTS "QuizQuestions" (
    "Id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
    "QuizId"       UUID         NOT NULL REFERENCES "Quizzes"("Id")    ON DELETE CASCADE,
    "QuestionId"   UUID         NOT NULL REFERENCES "Questions"("Id")  ON DELETE CASCADE,
    "DisplayOrder" INT          NOT NULL DEFAULT 0,
    "Score"        DECIMAL(6,2) NOT NULL DEFAULT 1.0,
    "CreatedAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UpdatedAt"    TIMESTAMPTZ,
    CONSTRAINT "PK_QuizQuestions" PRIMARY KEY ("Id"),
    CONSTRAINT "UQ_QuizQuestions_QuizId_QuestionId" UNIQUE ("QuizId", "QuestionId")
);

CREATE INDEX IF NOT EXISTS "IX_QuizQuestions_QuizId" ON "QuizQuestions"("QuizId");

-- QuizAttempts
CREATE TABLE IF NOT EXISTS "QuizAttempts" (
    "Id"             UUID         NOT NULL DEFAULT gen_random_uuid(),
    "QuizId"         UUID         NOT NULL REFERENCES "Quizzes"("Id") ON DELETE RESTRICT,
    "UserId"         UUID         NOT NULL,
    "State"          VARCHAR(20)  NOT NULL DEFAULT 'InProgress',
    "GradingMethod"  VARCHAR(10)  NOT NULL DEFAULT 'Auto',
    "StartedAt"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "SubmittedAt"    TIMESTAMPTZ,
    "GradedAt"       TIMESTAMPTZ,
    "Score"          DECIMAL(8,2),
    "AiScore"        DECIMAL(8,2),
    "Percentage"     DECIMAL(5,2),
    "Passed"         BOOLEAN      NOT NULL DEFAULT FALSE,
    "AttemptNumber"  INT          NOT NULL DEFAULT 1,
    "TimeTaken"      INT,
    "AntiCheatLog"   TEXT,
    "CreatedAt"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UpdatedAt"      TIMESTAMPTZ,
    CONSTRAINT "PK_QuizAttempts" PRIMARY KEY ("Id")
);

CREATE INDEX IF NOT EXISTS "IX_QuizAttempts_UserId"     ON "QuizAttempts"("UserId");
CREATE INDEX IF NOT EXISTS "IX_QuizAttempts_QuizId"     ON "QuizAttempts"("QuizId");
CREATE INDEX IF NOT EXISTS "IX_QuizAttempts_State"      ON "QuizAttempts"("State");
CREATE INDEX IF NOT EXISTS "IX_QuizAttempts_UserId_QuizId" ON "QuizAttempts"("UserId","QuizId");

-- AttemptAnswers
CREATE TABLE IF NOT EXISTS "AttemptAnswers" (
    "Id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
    "AttemptId"   UUID        NOT NULL REFERENCES "QuizAttempts"("Id") ON DELETE CASCADE,
    "QuestionId"  UUID        NOT NULL REFERENCES "Questions"("Id")    ON DELETE RESTRICT,
    "AnswerValue" TEXT,
    "AudioUrl"    VARCHAR(1000),
    "EssayText"   TEXT,
    "IsCorrect"   BOOLEAN,
    "Score"       DECIMAL(6,2),
    "AiScore"     DECIMAL(6,2),
    "AiFeedback"  TEXT,
    "IsSkipped"   BOOLEAN     NOT NULL DEFAULT FALSE,
    "CreatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMPTZ,
    CONSTRAINT "PK_AttemptAnswers" PRIMARY KEY ("Id")
);

CREATE INDEX IF NOT EXISTS "IX_AttemptAnswers_AttemptId" ON "AttemptAnswers"("AttemptId");

-- PlacementResults
CREATE TABLE IF NOT EXISTS "PlacementResults" (
    "Id"               UUID        NOT NULL DEFAULT gen_random_uuid(),
    "UserId"           UUID        NOT NULL,
    "QuizId"           UUID        NOT NULL REFERENCES "Quizzes"("Id")       ON DELETE RESTRICT,
    "AttemptId"        UUID        NOT NULL REFERENCES "QuizAttempts"("Id")  ON DELETE RESTRICT,
    "AssignedLevel"    INT         NOT NULL,
    "SkillBreakdown"   TEXT,
    "RecommendedPath"  TEXT,
    "TestedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "CreatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"        TIMESTAMPTZ,
    CONSTRAINT "PK_PlacementResults" PRIMARY KEY ("Id")
);

CREATE INDEX IF NOT EXISTS "IX_PlacementResults_UserId"           ON "PlacementResults"("UserId");
CREATE INDEX IF NOT EXISTS "IX_PlacementResults_UserId_TestedAt"  ON "PlacementResults"("UserId","TestedAt");

-- Mark migration as applied in public schema
INSERT INTO public."__EFMigrationsHistory" ("MigrationId","ProductVersion")
VALUES ('20260522_AddQuizTables','10.0.7')
ON CONFLICT DO NOTHING;
