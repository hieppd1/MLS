SELECT cm."Id", cm."Title", cm."CourseId", c."Title" as "CourseName"
FROM tenant_demo."CourseModules" cm
JOIN tenant_demo."Courses" c ON c."Id" = cm."CourseId"
ORDER BY c."CreatedAt", cm."OrderIndex";

SELECT s."Id", s."Title", s."ModuleId", s."PublishStatus", s."VideoAssetId"
FROM tenant_demo."Sessions" s ORDER BY s."OrderIndex" LIMIT 5;

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'tenant_demo' AND table_name = 'VideoAssets'
ORDER BY ordinal_position;
