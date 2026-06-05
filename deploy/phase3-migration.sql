-- Phase 3 Migration: Vouchers table
-- Run against DB: mls, schema: tenant_demo

SET search_path TO tenant_demo;

CREATE TABLE IF NOT EXISTS tenant_demo."Vouchers" (
    "Id"               uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "Code"             varchar(50)   NOT NULL,
    "Description"      varchar(500),
    "Type"             varchar(20)   NOT NULL DEFAULT 'Percentage',
    "Value"            numeric(18,2) NOT NULL DEFAULT 0,
    "MinOrderAmount"   numeric(18,2),
    "MaxDiscountAmount" numeric(18,2),
    "UsageLimit"       integer,
    "UsageCount"       integer       NOT NULL DEFAULT 0,
    "StartsAt"         timestamptz,
    "ExpiresAt"        timestamptz,
    "Status"           varchar(20)   NOT NULL DEFAULT 'Active',
    "IsPublic"         boolean       NOT NULL DEFAULT true,
    "CreatedAt"        timestamptz   NOT NULL DEFAULT now(),
    "UpdatedAt"        timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_Vouchers_Code"
    ON tenant_demo."Vouchers" ("Code");

-- Seed a few demo vouchers
INSERT INTO tenant_demo."Vouchers"
    ("Id", "Code", "Description", "Type", "Value", "MinOrderAmount", "MaxDiscountAmount", "UsageLimit", "Status", "IsPublic")
VALUES
    (gen_random_uuid(), 'WELCOME10', 'Giảm 10% cho đơn hàng đầu tiên', 'Percentage', 10, 50000, 50000, 100, 'Active', true),
    (gen_random_uuid(), 'SAVE50K',   'Giảm 50.000đ cho đơn từ 200.000đ', 'FixedAmount', 50000, 200000, 50000, 200, 'Active', true),
    (gen_random_uuid(), 'BOOK20',    'Giảm 20% không giới hạn tối đa', 'Percentage', 20, 100000, NULL, 50, 'Active', true)
ON CONFLICT ("Code") DO NOTHING;

SELECT 'Vouchers table created.' AS result;
SELECT COUNT(*) AS voucher_count FROM tenant_demo."Vouchers";
