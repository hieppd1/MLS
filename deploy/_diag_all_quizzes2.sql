SET search_path TO tenant_demo;
SET client_encoding = 'UTF8';
SELECT q."Id", q."QuizType", q."Status",
       (SELECT COUNT(*) FROM "QuizQuestions" qq WHERE qq."QuizId" = q."Id") AS qcount
FROM "Quizzes" q
ORDER BY q."CreatedAt" DESC;
