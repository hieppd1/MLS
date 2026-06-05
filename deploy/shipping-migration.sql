-- Shipping module migration for existing tenants
-- Run against schema: tenant_demo (adjust SET search_path as needed)
-- Idempotent: safe to run multiple times

SET search_path TO tenant_demo, public;

-- ── 1. Add shipping columns to Orders ─────────────────────────────────────
ALTER TABLE IF EXISTS "Orders"
    ADD COLUMN IF NOT EXISTS "ShippingStatus"   varchar(30) NULL;

ALTER TABLE IF EXISTS "Orders"
    ADD COLUMN IF NOT EXISTS "ShippingProvider" varchar(50) NULL;

-- ── 2. Shipments table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Shipments" (
    "Id"              uuid            NOT NULL,
    "OrderId"         uuid            NOT NULL,
    "Provider"        varchar(50)     NOT NULL DEFAULT 'ViettelPost',
    "TrackingNumber"  varchar(100)    NULL,
    "Status"          varchar(30)     NOT NULL DEFAULT 'Pending',
    "ShippingFee"     decimal(18,2)   NOT NULL DEFAULT 0,
    "ReceiverName"    varchar(255)    NOT NULL,
    "ReceiverPhone"   varchar(20)     NOT NULL,
    "ReceiverAddress" text            NOT NULL,
    "ProvinceCode"    varchar(20)     NULL,
    "DistrictCode"    varchar(20)     NULL,
    "WardCode"        varchar(20)     NULL,
    "RawResponse"     text            NULL,
    "CreatedAt"       timestamptz     NOT NULL,
    "UpdatedAt"       timestamptz     NULL,
    CONSTRAINT "PK_Shipments" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Shipments_Orders"
        FOREIGN KEY ("OrderId") REFERENCES "Orders"("Id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "IX_Shipments_OrderId"
    ON "Shipments"("OrderId");

CREATE INDEX IF NOT EXISTS "IX_Shipments_TrackingNumber"
    ON "Shipments"("TrackingNumber");

-- ── 3. ShipmentTrackingLogs table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ShipmentTrackingLogs" (
    "Id"          uuid        NOT NULL,
    "ShipmentId"  uuid        NOT NULL,
    "Status"      varchar(50) NOT NULL,
    "Description" text        NULL,
    "RawData"     text        NULL,
    "CreatedAt"   timestamptz NOT NULL,
    "UpdatedAt"   timestamptz NULL,
    CONSTRAINT "PK_ShipmentTrackingLogs" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_ShipmentTrackingLogs_Shipments"
        FOREIGN KEY ("ShipmentId") REFERENCES "Shipments"("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_ShipmentTrackingLogs_ShipmentId"
    ON "ShipmentTrackingLogs"("ShipmentId");

-- ── Done ──────────────────────────────────────────────────────────────────
SELECT 'Shipping migration completed.' AS result;
