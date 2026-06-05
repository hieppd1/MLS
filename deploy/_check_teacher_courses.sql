SET search_path TO tenant_demo, public;
SELECT t."Id" as teacher_id, t."DisplayName", COUNT(c."Id") as course_count
FROM "TeacherProfiles" t
LEFT JOIN "Courses" c ON c."TeacherId" = t."Id"
WHERE t."Slug" = 'le-van-tuan'
GROUP BY t."Id", t."DisplayName";
