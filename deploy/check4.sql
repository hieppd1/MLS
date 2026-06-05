SET search_path = tenant_demo;

-- LessonDocuments data
SELECT ld."Id", ld."LessonId", ld."Type", ld."Title", ld."FileUrl" FROM "LessonDocuments" ld ORDER BY ld."LessonId", ld."OrderIndex";

-- Module IDs for test 0001 - check by joining with sessions/lessons
SELECT DISTINCT m."Id", m."OrderIndex" FROM "CourseModules" m
WHERE m."CourseId" = '8991e456-8acd-475f-8d70-26da5e3cb3a6' ORDER BY m."OrderIndex";

-- Check VideoAssets with linked sessions/lessons
SELECT va."Id", va."OriginalFileName", va."Status", va."HlsPath", va."DurationSeconds" FROM "VideoAssets" va ORDER BY va."CreatedAt";
