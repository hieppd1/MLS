SELECT "Id", "Title", "QuizType"
FROM tenant_demo."Quizzes"
WHERE "QuizType" = 'RealtimeQuiz'
LIMIT 5;
