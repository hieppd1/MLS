-- Migration: add QuizId to OPICSessions (student selects quiz on survey page)
-- Run this against the mls database

ALTER TABLE tenant_demo."OPICSessions"
    ADD COLUMN IF NOT EXISTS "QuizId" uuid NULL;

-- Optional FK (add only if Quizzes table exists in same schema)
-- ALTER TABLE tenant_demo."OPICSessions"
--     ADD CONSTRAINT "FK_OPICSessions_Quizzes_QuizId"
--     FOREIGN KEY ("QuizId") REFERENCES tenant_demo."Quizzes"("Id") ON DELETE SET NULL;
