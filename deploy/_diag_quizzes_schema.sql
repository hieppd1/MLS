SET search_path TO tenant_demo;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'tenant_demo'
  AND table_name = 'Quizzes'
ORDER BY ordinal_position;
