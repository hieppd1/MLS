SELECT column_name FROM information_schema.columns
WHERE table_schema = 'tenant_demo' AND table_name = 'CourseEnrollments'
ORDER BY ordinal_position;

SELECT * FROM tenant_demo."CourseEnrollments" LIMIT 3;
