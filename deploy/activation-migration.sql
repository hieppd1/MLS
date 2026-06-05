-- Migration: ActivationCodes table
-- Run against: mls database, schema: tenant_demo

SET search_path TO tenant_demo;

CREATE TABLE IF NOT EXISTS "ActivationCodes" (
    "Id"           UUID         NOT NULL DEFAULT gen_random_uuid() CONSTRAINT "PK_ActivationCodes" PRIMARY KEY,
    "Code"         VARCHAR(20)  NOT NULL,
    "BookId"       UUID         NOT NULL REFERENCES "Books"("Id") ON DELETE CASCADE,
    "OrderId"      UUID         NOT NULL,
    "OrderItemId"  UUID         NOT NULL,
    "UserId"       UUID,
    "Status"       VARCHAR(20)  NOT NULL DEFAULT 'New',
    "ActivatedAt"  TIMESTAMPTZ,
    "ExpiresAt"    TIMESTAMPTZ,
    "CreatedAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UpdatedAt"    TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_ActivationCodes_Code"    ON "ActivationCodes"("Code");
CREATE INDEX        IF NOT EXISTS "IX_ActivationCodes_BookId"  ON "ActivationCodes"("BookId");
CREATE INDEX        IF NOT EXISTS "IX_ActivationCodes_OrderId" ON "ActivationCodes"("OrderId");
CREATE INDEX        IF NOT EXISTS "IX_ActivationCodes_UserId"  ON "ActivationCodes"("UserId");

-- Verify
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'tenant_demo' AND table_name = 'ActivationCodes';
