SET search_path TO tenant_demo;
SELECT q."Id", q."Title", q."QuizType", q."Status"
FROM "Quizzes" q
WHERE q."QuizType" = 'PlacementQuiz'
LIMIT 5;
