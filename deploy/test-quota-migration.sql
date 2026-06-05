-- Migration: Test Attempt Quota System (2026-05-28)
-- MonthlyTestQuota: NULL=use default, 0=unlimited, n=tests per month

SET search_path TO tenant_demo, public;

-- 1. Add column
ALTER TABLE "CoursePackages"
    ADD COLUMN IF NOT EXISTS "MonthlyTestQuota" INTEGER NULL;

-- 2. Seed defaults based on PackageType (stored as string)
UPDATE "CoursePackages"
   SET "MonthlyTestQuota" = CASE "PackageType"
       WHEN 'Basic'    THEN 2
       WHEN 'Standard' THEN 4
       WHEN 'Advance'  THEN 4
       ELSE 2
   END
WHERE "MonthlyTestQuota" IS NULL;

-- 3. Verify
SELECT "Id", "Title", "PackageType", "MonthlyTestQuota", "Status"
FROM   "CoursePackages"
ORDER  BY "PackageType";
