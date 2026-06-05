SELECT "Id", "Title", "Status" 
FROM tenant_demo."Courses" 
WHERE "Title" ILIKE '%test%' OR "Title" ILIKE '%0001%' 
ORDER BY "Title" 
LIMIT 10;

SELECT m."Id" as module_id, m."Title" as module_title, c."Title" as course_title
FROM tenant_demo."CourseModules" m
JOIN tenant_demo."Courses" c ON c."Id" = m."CourseId"
WHERE c."Title" ILIKE '%test%' OR c."Title" ILIKE '%0001%'
LIMIT 20;

SELECT s."Id" as session_id, s."Title" as session_title, s."SessionType", s."PublishStatus",
       m."Title" as module_title
FROM tenant_demo."Sessions" s
JOIN tenant_demo."CourseModules" m ON m."Id" = s."ModuleId"
JOIN tenant_demo."Courses" c ON c."Id" = m."CourseId"
WHERE c."Title" ILIKE '%test%' OR c."Title" ILIKE '%0001%'
LIMIT 20;
