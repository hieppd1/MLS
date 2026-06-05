-- ============================================================
-- Order Commerce Migration
-- Run against: mls database, search_path = tenant_demo
-- ============================================================

SET search_path TO tenant_demo;

-- ── Orders ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Orders" (
    "Id"              UUID        NOT NULL PRIMARY KEY,
    "OrderCode"       VARCHAR(40) NOT NULL UNIQUE,
    "UserId"          UUID        NOT NULL,
    "Status"          VARCHAR(30) NOT NULL DEFAULT 'Pending',
    "TotalAmount"     DECIMAL(18,2) NOT NULL DEFAULT 0,
    "DiscountAmount"  DECIMAL(18,2) NOT NULL DEFAULT 0,
    "FinalAmount"     DECIMAL(18,2) NOT NULL DEFAULT 0,
    "VoucherCode"     VARCHAR(50),
    "PaymentStatus"   VARCHAR(20) NOT NULL DEFAULT 'Unpaid',
    "PaymentMethod"   VARCHAR(20) NOT NULL DEFAULT 'BankTransfer',
    "PaymentNote"     VARCHAR(500),
    "PaidAt"          TIMESTAMPTZ,
    "ShippingJson"    TEXT,
    "CreatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id   ON "Orders"("UserId");
CREATE INDEX IF NOT EXISTS idx_orders_status    ON "Orders"("Status");
CREATE INDEX IF NOT EXISTS idx_orders_created   ON "Orders"("CreatedAt" DESC);

-- ── Order Items ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "OrderItems" (
    "Id"             UUID        NOT NULL PRIMARY KEY,
    "OrderId"        UUID        NOT NULL REFERENCES "Orders"("Id") ON DELETE CASCADE,
    "BookId"         UUID        NOT NULL,
    "BookTitle"      VARCHAR(500) NOT NULL,
    "BookType"       VARCHAR(30) NOT NULL,
    "BookSlug"       VARCHAR(350),
    "BookCoverColor" VARCHAR(20),
    "BookCoverEmoji" VARCHAR(10),
    "BookCoverUrl"   VARCHAR(1000),
    "Quantity"       INT         NOT NULL DEFAULT 1,
    "UnitPrice"      DECIMAL(18,2) NOT NULL,
    "TotalPrice"     DECIMAL(18,2) NOT NULL,
    "CreatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON "OrderItems"("OrderId");

SELECT 'Order migration complete.' AS result;
