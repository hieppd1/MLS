SELECT u."Id", u."Email", string_agg(r."Name", ',') AS roles
FROM tenant_demo."Users" u
JOIN tenant_demo."UserRoles" ur ON ur."UserId"=u."Id"
JOIN tenant_demo."Roles" r ON r."Id"=ur."RoleId"
GROUP BY u."Id", u."Email"
HAVING string_agg(r."Name", ',') ILIKE '%Admin%' OR string_agg(r."Name", ',') ILIKE '%Support%'
LIMIT 30;

