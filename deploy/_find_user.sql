SELECT schemaname, tablename FROM pg_tables WHERE table_schema='tenant_demo' AND tablename ILIKE '%user%';
SELECT "Id", "Email" FROM tenant_demo."Users" LIMIT 3;
