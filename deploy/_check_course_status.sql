SET search_path TO tenant_demo, public;
SELECT "Id", "Title", "Status", "TeacherId"
FROM "Courses"
WHERE "TeacherId" = '28eba4f9-245a-45eb-b226-3588d389ae9c';
