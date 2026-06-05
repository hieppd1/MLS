-- ============================================================
-- Phase 5 Migration: Course Commerce + Invoice System
-- Run against DB: mls, schema: tenant_demo
-- ============================================================

SET search_path TO tenant_demo, public;

-- ────────────────────────────────────────────────────────────
-- 1. OrderItems: make BookId nullable, add ItemType / Course cols
-- ────────────────────────────────────────────────────────────

ALTER TABLE tenant_demo."OrderItems"
    ALTER COLUMN "BookId" DROP NOT NULL;

ALTER TABLE tenant_demo."OrderItems"
    ADD COLUMN IF NOT EXISTS "ItemType"   VARCHAR(20) NOT NULL DEFAULT 'Book',
    ADD COLUMN IF NOT EXISTS "CourseId"   UUID NULL REFERENCES tenant_demo."Courses"("Id") ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS "CourseSlug" VARCHAR(500) NULL;

CREATE INDEX IF NOT EXISTS "IX_OrderItems_CourseId"
    ON tenant_demo."OrderItems" ("CourseId")
    WHERE "CourseId" IS NOT NULL;

-- ────────────────────────────────────────────────────────────
-- 2. Invoices table
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_demo."Invoices" (
    "Id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "OrderId"        UUID NOT NULL REFERENCES tenant_demo."Orders"("Id") ON DELETE CASCADE,
    "InvoiceNumber"  VARCHAR(30) NOT NULL,
    "IssuedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "BuyerName"      VARCHAR(200),
    "BuyerEmail"     VARCHAR(200),
    "BuyerPhone"     VARCHAR(20),
    "BuyerAddress"   VARCHAR(500),
    "BuyerTaxCode"   VARCHAR(50),
    "TotalAmount"    NUMERIC(18,2) NOT NULL,
    "DiscountAmount" NUMERIC(18,2) NOT NULL DEFAULT 0,
    "FinalAmount"    NUMERIC(18,2) NOT NULL,
    "VatAmount"      NUMERIC(18,2) NOT NULL DEFAULT 0,
    "Notes"          TEXT,
    "PdfUrl"         VARCHAR(1000),
    "CreatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "UQ_Invoices_OrderId"       UNIQUE ("OrderId"),
    CONSTRAINT "UQ_Invoices_InvoiceNumber" UNIQUE ("InvoiceNumber")
);

CREATE INDEX IF NOT EXISTS "IX_Invoices_OrderId"
    ON tenant_demo."Invoices" ("OrderId");

-- Backfill for installations created before UpdatedAt was added
ALTER TABLE tenant_demo."Invoices"
    ADD COLUMN IF NOT EXISTS "UpdatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ────────────────────────────────────────────────────────────
-- Done
-- ────────────────────────────────────────────────────────────
SELECT 'Phase 5 migration completed.' AS result;
