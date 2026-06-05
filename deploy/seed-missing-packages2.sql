SET search_path TO tenant_demo, public;

DO $$
DECLARE
    course_rec RECORD;
    pkg_id UUID;
BEGIN
    FOR course_rec IN
        SELECT "Id" FROM "Courses"
        WHERE NOT EXISTS (
            SELECT 1 FROM "CoursePackages" cp WHERE cp."CourseId" = "Courses"."Id"
        )
    LOOP
        -- Basic (EF Core stores enums as strings)
        pkg_id := gen_random_uuid();
        INSERT INTO "CoursePackages" ("Id","CourseId","PackageType","Title","Description","OriginalPrice","SalePrice","DurationDay","Status","CreatedAt","UpdatedAt")
        VALUES (pkg_id, course_rec."Id", 'Basic', 'Gói Cơ Bản', 'Truy cập video bài học và quiz cơ bản', 0, 0, 0, 'Active', now(), now());
        INSERT INTO "PackageEntitlements" ("Id","PackageId","FeatureCode","Enabled","CreatedAt","UpdatedAt") VALUES
            (gen_random_uuid(), pkg_id, 'video_learning',     true,  now(), now()),
            (gen_random_uuid(), pkg_id, 'basic_quiz',         true,  now(), now()),
            (gen_random_uuid(), pkg_id, 'vocabulary_package', false, now(), now()),
            (gen_random_uuid(), pkg_id, 'grammar_practice',   false, now(), now()),
            (gen_random_uuid(), pkg_id, 'realtime_comments',  false, now(), now()),
            (gen_random_uuid(), pkg_id, 'speaking_ai',        false, now(), now()),
            (gen_random_uuid(), pkg_id, 'writing_ai',         false, now(), now()),
            (gen_random_uuid(), pkg_id, 'teacher_support',    false, now(), now());

        -- Standard
        pkg_id := gen_random_uuid();
        INSERT INTO "CoursePackages" ("Id","CourseId","PackageType","Title","Description","OriginalPrice","SalePrice","DurationDay","Status","CreatedAt","UpdatedAt")
        VALUES (pkg_id, course_rec."Id", 'Standard', 'Gói Tiêu Chuẩn', 'Đầy đủ video, quiz, từ vựng, ngữ pháp + bình luận realtime', 599000, 499000, 365, 'Active', now(), now());
        INSERT INTO "PackageEntitlements" ("Id","PackageId","FeatureCode","Enabled","CreatedAt","UpdatedAt") VALUES
            (gen_random_uuid(), pkg_id, 'video_learning',     true,  now(), now()),
            (gen_random_uuid(), pkg_id, 'basic_quiz',         true,  now(), now()),
            (gen_random_uuid(), pkg_id, 'vocabulary_package', true,  now(), now()),
            (gen_random_uuid(), pkg_id, 'grammar_practice',   true,  now(), now()),
            (gen_random_uuid(), pkg_id, 'realtime_comments',  true,  now(), now()),
            (gen_random_uuid(), pkg_id, 'speaking_ai',        false, now(), now()),
            (gen_random_uuid(), pkg_id, 'writing_ai',         false, now(), now()),
            (gen_random_uuid(), pkg_id, 'teacher_support',    false, now(), now());

        -- Advance
        pkg_id := gen_random_uuid();
        INSERT INTO "CoursePackages" ("Id","CourseId","PackageType","Title","Description","OriginalPrice","SalePrice","DurationDay","Status","CreatedAt","UpdatedAt")
        VALUES (pkg_id, course_rec."Id", 'Advance', 'Gói Nâng Cao', 'Tất cả tính năng + AI speaking/writing + hỗ trợ giáo viên', 999000, 799000, 365, 'Active', now(), now());
        INSERT INTO "PackageEntitlements" ("Id","PackageId","FeatureCode","Enabled","CreatedAt","UpdatedAt") VALUES
            (gen_random_uuid(), pkg_id, 'video_learning',     true, now(), now()),
            (gen_random_uuid(), pkg_id, 'basic_quiz',         true, now(), now()),
            (gen_random_uuid(), pkg_id, 'vocabulary_package', true, now(), now()),
            (gen_random_uuid(), pkg_id, 'grammar_practice',   true, now(), now()),
            (gen_random_uuid(), pkg_id, 'realtime_comments',  true, now(), now()),
            (gen_random_uuid(), pkg_id, 'speaking_ai',        true, now(), now()),
            (gen_random_uuid(), pkg_id, 'writing_ai',         true, now(), now()),
            (gen_random_uuid(), pkg_id, 'teacher_support',    true, now(), now());

    END LOOP;
END $$;

SELECT COUNT(*) AS total_packages FROM "CoursePackages";
