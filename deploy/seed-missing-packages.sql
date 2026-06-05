-- Seed 3 default packages (Basic/Standard/Advance) for all courses that don't have packages yet
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
        RAISE NOTICE 'Seeding packages for course %', course_rec."Id";

        -- Basic
        pkg_id := gen_random_uuid();
        INSERT INTO "CoursePackages" ("Id", "CourseId", "PackageType", "Title", "Description",
            "OriginalPrice", "SalePrice", "DurationDay", "Status", "CreatedAt", "UpdatedAt")
        VALUES (pkg_id, course_rec."Id", 0, 'Gói Cơ Bản',
            'Khóa học cơ bản, có thể phát hoặc bán free',
            0, 0, 0, 0, now(), now());
        INSERT INTO "PackageEntitlements" ("Id", "PackageId", "FeatureCode", "Enabled", "CreatedAt", "UpdatedAt")
        VALUES
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
        INSERT INTO "CoursePackages" ("Id", "CourseId", "PackageType", "Title", "Description",
            "OriginalPrice", "SalePrice", "DurationDay", "Status", "CreatedAt", "UpdatedAt")
        VALUES (pkg_id, course_rec."Id", 1, 'Gói Tiêu Chuẩn',
            'Combo 3 bộ sách (từ vựng, ngữ pháp, luyện tập)',
            0, 0, 365, 0, now(), now());
        INSERT INTO "PackageEntitlements" ("Id", "PackageId", "FeatureCode", "Enabled", "CreatedAt", "UpdatedAt")
        VALUES
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
        INSERT INTO "CoursePackages" ("Id", "CourseId", "PackageType", "Title", "Description",
            "OriginalPrice", "SalePrice", "DurationDay", "Status", "CreatedAt", "UpdatedAt")
        VALUES (pkg_id, course_rec."Id", 2, 'Gói Nâng Cao',
            'Combo 3 bộ sách + học thực hành (AI + giáo viên 1-1)',
            0, 0, 365, 0, now(), now());
        INSERT INTO "PackageEntitlements" ("Id", "PackageId", "FeatureCode", "Enabled", "CreatedAt", "UpdatedAt")
        VALUES
            (gen_random_uuid(), pkg_id, 'video_learning',     true, now(), now()),
            (gen_random_uuid(), pkg_id, 'basic_quiz',         true, now(), now()),
            (gen_random_uuid(), pkg_id, 'vocabulary_package', true, now(), now()),
            (gen_random_uuid(), pkg_id, 'grammar_practice',   true, now(), now()),
            (gen_random_uuid(), pkg_id, 'realtime_comments',  true, now(), now()),
            (gen_random_uuid(), pkg_id, 'speaking_ai',        true, now(), now()),
            (gen_random_uuid(), pkg_id, 'writing_ai',         true, now(), now()),
            (gen_random_uuid(), pkg_id, 'teacher_support',    true, now(), now());

    END LOOP;

    RAISE NOTICE 'Done seeding packages.';
END $$;

-- Verify
SELECT c."Title", COUNT(cp."Id") AS package_count
FROM "Courses" c
LEFT JOIN "CoursePackages" cp ON cp."CourseId" = c."Id"
GROUP BY c."Id", c."Title"
ORDER BY c."Title";
