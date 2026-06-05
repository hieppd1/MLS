SET search_path=tenant_demo;
SELECT column_name FROM information_schema.columns WHERE table_schema='tenant_demo' AND table_name='Users' ORDER BY ordinal_position;
SELECT "Id", "Email" FROM "Users" ORDER BY "CreatedAt" LIMIT 15;
