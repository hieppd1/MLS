-- ============================================================
-- Book Commerce Migration
-- Run: psql -U postgres -d mls -f book-commerce-migration.sql
-- Schema: tenant_demo
-- ============================================================

SET search_path TO tenant_demo;

-- 1. Book Categories
CREATE TABLE IF NOT EXISTS "BookCategories" (
    "Id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
    "Name"        TEXT         NOT NULL,
    "Slug"        TEXT         NOT NULL,
    "Description" TEXT,
    "SortOrder"   INT          NOT NULL DEFAULT 0,
    "CreatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "UpdatedAt"   TIMESTAMPTZ,
    CONSTRAINT "PK_BookCategories" PRIMARY KEY ("Id"),
    CONSTRAINT "UQ_BookCategories_Slug" UNIQUE ("Slug")
);

-- 2. Books
CREATE TABLE IF NOT EXISTS "Books" (
    "Id"              UUID           NOT NULL DEFAULT gen_random_uuid(),
    "Title"           TEXT           NOT NULL,
    "Slug"            TEXT           NOT NULL,
    "Description"     TEXT,
    "ShortDescription" VARCHAR(500),
    "Author"          VARCHAR(200),
    "Publisher"       VARCHAR(200),
    "Isbn"            VARCHAR(50),
    "CoverColor"      VARCHAR(20)    NOT NULL DEFAULT '#1a3a5c',
    "CoverEmoji"      VARCHAR(10)    NOT NULL DEFAULT '📚',
    "CoverUrl"        VARCHAR(500),
    "Type"            VARCHAR(20)    NOT NULL DEFAULT 'Ebook',
    "CategoryId"      UUID           REFERENCES "BookCategories"("Id") ON DELETE SET NULL,
    "Level"           VARCHAR(10),
    "Tags"            TEXT,
    "Price"           DECIMAL(18,2)  NOT NULL DEFAULT 0,
    "DiscountPrice"   DECIMAL(18,2),
    "DiscountEndsAt"  TIMESTAMPTZ,
    "PageCount"       INT,
    "FileUrl"         VARCHAR(500),
    "FileSizeMb"      DECIMAL(10,2),
    "SampleUrl"       VARCHAR(500),
    "Status"          VARCHAR(20)    NOT NULL DEFAULT 'Draft',
    "IsFeatured"      BOOLEAN        NOT NULL DEFAULT false,
    "SortOrder"       INT            NOT NULL DEFAULT 0,
    "Rating"          DECIMAL(3,2)   NOT NULL DEFAULT 0,
    "ReviewCount"     INT            NOT NULL DEFAULT 0,
    "PurchaseCount"   INT            NOT NULL DEFAULT 0,
    "CreatedBy"       UUID           NOT NULL,
    "CreatedAt"       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    "UpdatedAt"       TIMESTAMPTZ,
    CONSTRAINT "PK_Books" PRIMARY KEY ("Id"),
    CONSTRAINT "UQ_Books_Slug" UNIQUE ("Slug")
);

CREATE INDEX IF NOT EXISTS "IX_Books_Status"     ON "Books" ("Status");
CREATE INDEX IF NOT EXISTS "IX_Books_Type"       ON "Books" ("Type");
CREATE INDEX IF NOT EXISTS "IX_Books_IsFeatured" ON "Books" ("IsFeatured");
CREATE INDEX IF NOT EXISTS "IX_Books_CategoryId" ON "Books" ("CategoryId");

-- 3. Ebook Entitlements (what users can read)
CREATE TABLE IF NOT EXISTS "EbookEntitlements" (
    "Id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
    "UserId"      UUID         NOT NULL,
    "BookId"      UUID         NOT NULL REFERENCES "Books"("Id") ON DELETE CASCADE,
    "Source"      VARCHAR(20)  NOT NULL DEFAULT 'Purchase',
    "ExpiresAt"   TIMESTAMPTZ,
    "LastReadAt"  TIMESTAMPTZ,
    "ProgressPct" INT          NOT NULL DEFAULT 0,
    "CreatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "UpdatedAt"   TIMESTAMPTZ,
    CONSTRAINT "PK_EbookEntitlements" PRIMARY KEY ("Id"),
    CONSTRAINT "UQ_EbookEntitlements_UserBook" UNIQUE ("UserId", "BookId")
);

CREATE INDEX IF NOT EXISTS "IX_EbookEntitlements_UserId" ON "EbookEntitlements" ("UserId");
