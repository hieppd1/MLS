SET search_path TO tenant_demo;
SELECT c."Id", c."Title", c."Status", c."Price"
FROM "Courses" c
JOIN "TeacherProfiles" tp ON tp."Id" = c."TeacherId"
WHERE tp."UserId" = 'ef5eb2b9-c497-4eb1-b9f7-28bcbf409516';
