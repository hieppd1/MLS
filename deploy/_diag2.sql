SELECT m."Id", m."Title", m."CourseId", c."Title" as "CourseName"
FROM tenant_demo."Modules" m
JOIN tenant_demo."Courses" c ON c."Id" = m."CourseId"
ORDER BY c."CreatedAt", m."OrderIndex";

SELECT s."Id", s."Title", s."ModuleId", s."PublishStatus"
FROM tenant_demo."Sessions" s
ORDER BY s."CreatedAt" LIMIT 10;

SELECT va."Id", va."HlsUrl", va."LessonId", va."SessionId"
FROM tenant_demo."VideoAssets" va LIMIT 5;
