SELECT column_name FROM information_schema.columns
WHERE table_schema = 'tenant_demo' AND table_name = 'Quizzes'
ORDER BY ordinal_position;

SELECT column_name FROM information_schema.columns
WHERE table_schema = 'tenant_demo' AND table_name = 'QuizQuestions'
ORDER BY ordinal_position;

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'tenant_demo' AND table_name ILIKE '%option%';
