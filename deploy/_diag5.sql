SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'tenant_demo' AND table_name = 'SessionVideoAssets'
ORDER BY ordinal_position;

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'tenant_demo' AND table_name = 'Segments'
ORDER BY ordinal_position;

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'tenant_demo' AND table_name = 'LearningAssets'
ORDER BY ordinal_position;

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'tenant_demo' AND table_name = 'Sessions'
ORDER BY ordinal_position;
