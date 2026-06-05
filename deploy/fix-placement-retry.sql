SET search_path TO tenant_demo;
-- Remove RetryLimit from placement test quiz (cooldown is handled by /placement/result, not RetryLimit)
UPDATE "Quizzes"
SET "RetryLimit" = NULL, "AllowRetry" = true
WHERE "QuizType" = 'PlacementTest';

-- Verify
SELECT "Id", "QuizType", "RetryLimit", "AllowRetry" FROM "Quizzes" WHERE "QuizType" = 'PlacementTest';
