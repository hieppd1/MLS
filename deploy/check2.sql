SET search_path = tenant_demo;

-- Sessions schema
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema='tenant_demo' AND table_name='Sessions' ORDER BY ordinal_position;

-- Lessons schema
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema='tenant_demo' AND table_name='Lessons' ORDER BY ordinal_position;

-- Modules for test 0001
SELECT "Id", "Title", "OrderIndex" FROM "CourseModules" 
WHERE "CourseId" = '8991e456-8acd-475f-8d70-26da5e3cb3a6' ORDER BY "OrderIndex";

-- Lessons for test 0001 modules
SELECT l."Id", l."Title", l."OrderIndex", l."VideoAssetId", l."IsFreeTrial"
FROM "Lessons" l
JOIN "CourseModules" m ON l."ModuleId" = m."Id"
WHERE m."CourseId" = '8991e456-8acd-475f-8d70-26da5e3cb3a6'
ORDER BY m."OrderIndex", l."OrderIndex";

-- Sessions for test 0001 modules
SELECT s."Id", s."Title", s."OrderIndex", s."VideoAssetId", s."DurationSeconds", s."PublishStatus"
FROM "Sessions" s
JOIN "CourseModules" m ON s."ModuleId" = m."Id"
WHERE m."CourseId" = '8991e456-8acd-475f-8d70-26da5e3cb3a6'
ORDER BY m."OrderIndex", s."OrderIndex";
