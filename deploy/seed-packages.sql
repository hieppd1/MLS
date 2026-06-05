-- =============================================================================
-- Seed: CoursePackages + PackageEntitlements (demo data)
-- Run against the tenant schema (adjust SET search_path as needed):
--   docker exec -i mls_postgres psql -U mls_user -d mls -c "\i /tmp/seed-packages.sql"
-- Or locally:
--   psql -U mls_user -d mls -f seed-packages.sql
-- =============================================================================

-- Detect schema automatically (works for both tenant_demo and local dev)
DO $$
DECLARE
  v_schema TEXT;
  v_course_id UUID;
  v_pkg_basic_id   UUID := gen_random_uuid();
  v_pkg_std_id     UUID := gen_random_uuid();
  v_pkg_adv_id     UUID := gen_random_uuid();
BEGIN
  -- Try to detect schema: pick the first schema that has a Courses table
  SELECT table_schema INTO v_schema
  FROM information_schema.tables
  WHERE table_name = 'Courses'
    AND table_schema NOT IN ('pg_catalog','information_schema','public')
  ORDER BY table_schema
  LIMIT 1;

  IF v_schema IS NULL THEN
    -- fallback: public
    v_schema := 'public';
  END IF;

  EXECUTE format('SET search_path TO %I, public', v_schema);

  -- Pick the first Published (or any) course
  SELECT "Id" INTO v_course_id
  FROM "Courses"
  WHERE "Status" IN ('Published', 'Draft', 'Hidden')
  ORDER BY "CreatedAt" ASC
  LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE NOTICE 'No course found in schema %. Seeding skipped.', v_schema;
    RETURN;
  END IF;

  RAISE NOTICE 'Seeding packages for course % in schema %', v_course_id, v_schema;

  -- ── Clean previous demo packages ──────────────────────────────────────────
  DELETE FROM "PackageEntitlements"
  WHERE "PackageId" IN (
    SELECT "Id" FROM "CoursePackages" WHERE "CourseId" = v_course_id
  );
  DELETE FROM "CoursePackages" WHERE "CourseId" = v_course_id;

  -- ── Basic package (Active — free/low tier) ──────────────────────────────
  INSERT INTO "CoursePackages"
    ("Id","CourseId","PackageType","Title","Description","OriginalPrice","SalePrice","DurationDay","Status","CreatedAt","UpdatedAt")
  VALUES
    (v_pkg_basic_id, v_course_id, 0, 'Gói Cơ Bản',
     'Khóa học cơ bản, có thể phát hoặc bán free',
     0, 0, 0, 2, NOW(), NOW());

  INSERT INTO "PackageEntitlements" ("Id","PackageId","FeatureCode","Enabled","CreatedAt")
  VALUES
    (gen_random_uuid(), v_pkg_basic_id, 'video_learning',     TRUE,  NOW()),
    (gen_random_uuid(), v_pkg_basic_id, 'basic_quiz',         TRUE,  NOW()),
    (gen_random_uuid(), v_pkg_basic_id, 'vocabulary_package', FALSE, NOW()),
    (gen_random_uuid(), v_pkg_basic_id, 'grammar_practice',   FALSE, NOW()),
    (gen_random_uuid(), v_pkg_basic_id, 'realtime_comments',  FALSE, NOW()),
    (gen_random_uuid(), v_pkg_basic_id, 'speaking_ai',        FALSE, NOW()),
    (gen_random_uuid(), v_pkg_basic_id, 'writing_ai',         FALSE, NOW()),
    (gen_random_uuid(), v_pkg_basic_id, 'teacher_support',    FALSE, NOW());

  -- ── Standard package (Active — combo 3 bộ sách) ──────────────────────────
  INSERT INTO "CoursePackages"
    ("Id","CourseId","PackageType","Title","Description","OriginalPrice","SalePrice","DurationDay","Status","CreatedAt","UpdatedAt")
  VALUES
    (v_pkg_std_id, v_course_id, 1, 'Gói Tiêu Chuẩn',
     'Combo 3 bộ sách (từ vựng, ngữ pháp, luyện tập)',
     599000, 499000, 365, 2, NOW(), NOW());

  INSERT INTO "PackageEntitlements" ("Id","PackageId","FeatureCode","Enabled","CreatedAt")
  VALUES
    (gen_random_uuid(), v_pkg_std_id, 'video_learning',     TRUE,  NOW()),
    (gen_random_uuid(), v_pkg_std_id, 'basic_quiz',         TRUE,  NOW()),
    (gen_random_uuid(), v_pkg_std_id, 'vocabulary_package', TRUE,  NOW()),
    (gen_random_uuid(), v_pkg_std_id, 'grammar_practice',   TRUE,  NOW()),
    (gen_random_uuid(), v_pkg_std_id, 'realtime_comments',  TRUE,  NOW()),
    (gen_random_uuid(), v_pkg_std_id, 'speaking_ai',        FALSE, NOW()),
    (gen_random_uuid(), v_pkg_std_id, 'writing_ai',         FALSE, NOW()),
    (gen_random_uuid(), v_pkg_std_id, 'teacher_support',    FALSE, NOW());

  -- ── Advance package (Active — combo 3 bộ sách + học thực hành) ───────────
  INSERT INTO "CoursePackages"
    ("Id","CourseId","PackageType","Title","Description","OriginalPrice","SalePrice","DurationDay","Status","CreatedAt","UpdatedAt")
  VALUES
    (v_pkg_adv_id, v_course_id, 2, 'Gói Nâng Cao',
     'Combo 3 bộ sách + học thực hành (AI + giáo viên 1-1)',
     999000, 799000, 365, 2, NOW(), NOW());

  INSERT INTO "PackageEntitlements" ("Id","PackageId","FeatureCode","Enabled","CreatedAt")
  VALUES
    (gen_random_uuid(), v_pkg_adv_id, 'video_learning',     TRUE, NOW()),
    (gen_random_uuid(), v_pkg_adv_id, 'basic_quiz',         TRUE, NOW()),
    (gen_random_uuid(), v_pkg_adv_id, 'vocabulary_package', TRUE, NOW()),
    (gen_random_uuid(), v_pkg_adv_id, 'grammar_practice',   TRUE, NOW()),
    (gen_random_uuid(), v_pkg_adv_id, 'realtime_comments',  TRUE, NOW()),
    (gen_random_uuid(), v_pkg_adv_id, 'speaking_ai',        TRUE, NOW()),
    (gen_random_uuid(), v_pkg_adv_id, 'writing_ai',         TRUE, NOW()),
    (gen_random_uuid(), v_pkg_adv_id, 'teacher_support',    TRUE, NOW());

  RAISE NOTICE 'Done! Seeded 3 packages (Basic=Draft, Standard=Active, Advance=Active) for course %', v_course_id;
END $$;
