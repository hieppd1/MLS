SET search_path TO tenant_demo;
SELECT u."Id", u."Email", up."FullName", up."AvatarUrl"
FROM "Users" u
LEFT JOIN "UserProfiles" up ON up."UserId" = u."Id"
WHERE u."Id" = 'ef5eb2b9-c497-4eb1-b9f7-28bcbf409516';
