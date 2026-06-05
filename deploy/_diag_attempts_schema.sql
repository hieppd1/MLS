SET search_path TO tenant_demo;
-- Check QuizAttempts table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'tenant_demo'
  AND table_name = 'QuizAttempts'
ORDER BY ordinal_position;
