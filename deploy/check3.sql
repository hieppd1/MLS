SET search_path = tenant_demo;

-- Modules for test 0001
SELECT "Id", "Title", "OrderIndex" FROM "CourseModules" 
WHERE "CourseId" = '8991e456-8acd-475f-8d70-26da5e3cb3a6' ORDER BY "OrderIndex";

-- All lessons with modules info
SELECT l."Id", l."Title", l."LessonType", l."ModuleId", l."OrderIndex", l."DurationMinutes", l."PublishStatus"
FROM "Lessons" l ORDER BY l."ModuleId", l."OrderIndex";

-- Check LessonDocuments
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema='tenant_demo' AND table_name='LessonDocuments' ORDER BY ordinal_position;

-- All sessions  
SELECT s."Id", s."Title", s."ModuleId", s."OrderIndex", s."VideoAssetId", s."DurationSeconds", s."PublishStatus"
FROM "Sessions" s ORDER BY s."ModuleId", s."OrderIndex";

-- SessionVideoAssets table
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema='tenant_demo' AND table_name='SessionVideoAssets' ORDER BY ordinal_position;

-- CourseEnrollments
SELECT "Id", "UserId", "CourseId", "EnrolledAt" FROM "CourseEnrollments" LIMIT 10;
