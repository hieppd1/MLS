SELECT m."Id" as module_id, m."Title" as module_title, m."OrderIndex"
FROM tenant_demo."CourseModules" m
WHERE m."CourseId" = '8991e456-8acd-475f-8d70-26da5e3cb3a6'
ORDER BY m."OrderIndex";

SELECT s."Id" as session_id, s."Title" as session_title, s."SessionType", s."PublishStatus"
FROM tenant_demo."Sessions" s
JOIN tenant_demo."CourseModules" m ON m."Id" = s."ModuleId"
WHERE m."CourseId" = '8991e456-8acd-475f-8d70-26da5e3cb3a6'
LIMIT 20;
