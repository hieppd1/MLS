-- Find UserProfiles table in all schemas
SELECT schemaname, tablename 
FROM pg_tables 
WHERE tablename ILIKE 'UserProfiles' 
ORDER BY schemaname;

-- Also list all schemas
SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;
