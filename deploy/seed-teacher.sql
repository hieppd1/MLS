SET search_path TO tenant_demo, public;
-- Link courses to existing teacher profile (Le Van Tuan)
UPDATE "Courses"
SET "TeacherId" = '28eba4f9-245a-45eb-b226-3588d389ae9c'
WHERE "Id" IN (
  '8991e456-8acd-475f-8d70-26da5e3cb3a6',
  'd605e518-2b73-4785-905d-55c2bae6b73c',
  'ebae771b-a4e4-4c6d-8041-f1e4e553c032',
  'd5f3b5c6-2d1e-49d8-9f79-fff9d3980a51'
);

SELECT c."Id", c."Title", t."DisplayName", t."Slug"
FROM "Courses" c
JOIN "TeacherProfiles" t ON t."Id" = c."TeacherId"
WHERE c."TeacherId" IS NOT NULL;
