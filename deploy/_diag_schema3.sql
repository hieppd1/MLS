SELECT column_name FROM information_schema.columns
WHERE table_schema = 'tenant_demo' AND table_name = 'Questions'
ORDER BY ordinal_position;

SELECT column_name FROM information_schema.columns
WHERE table_schema = 'tenant_demo' AND table_name = 'QuestionOptions'
ORDER BY ordinal_position;
