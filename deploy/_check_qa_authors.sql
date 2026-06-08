SET search_path TO tenant_demo, public;
SELECT c."Id", c."AuthorId", up."FullName"
FROM "LessonComments" c
LEFT JOIN "UserProfiles" up ON up."UserId" = c."AuthorId"
LIMIT 5;
