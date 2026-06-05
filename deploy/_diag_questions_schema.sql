SET search_path TO tenant_demo;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'tenant_demo'
  AND table_name = 'Questions'
ORDER BY ordinal_position;
