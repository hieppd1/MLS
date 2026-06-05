SET search_path TO tenant_demo;
SELECT q."Id", q."Title", q."QuizType", q."Status",
       (SELECT COUNT(*) FROM "QuizQuestions" qq WHERE qq."QuizId" = q."Id") AS question_count
FROM "Quizzes" q
ORDER BY q."CreatedAt" DESC;
