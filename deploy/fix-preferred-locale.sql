-- Fix missing PreferredLocale column in tenant_demo schema
SET search_path TO tenant_demo;

ALTER TABLE "UserProfiles" ADD COLUMN IF NOT EXISTS "PreferredLocale" text NULL;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'tenant_demo'
  AND table_name = 'UserProfiles' 
  AND column_name = 'PreferredLocale';
