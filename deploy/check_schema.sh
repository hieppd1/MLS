#!/bin/bash
docker exec mls_postgres psql -U mls_user -d mls -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'tenant_demo' AND table_name = 'session_assets' ORDER BY ordinal_position;"
