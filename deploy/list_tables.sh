#!/bin/bash
docker exec mls_postgres psql -U mls_user -d mls -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'tenant_demo' ORDER BY table_name;"
