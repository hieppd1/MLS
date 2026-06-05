-- Phase 4 Migration: Book Reviews + BookReview index
-- Run: psql -U postgres -d mls -f deploy/phase4-migration.sql

SET search_path TO tenant_demo, public;

-- BookReviews table
CREATE TABLE IF NOT EXISTS tenant_demo."BookReviews" (
    "Id"                 uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "BookId"             uuid          NOT NULL REFERENCES tenant_demo."Books"("Id") ON DELETE CASCADE,
    "UserId"             uuid          NOT NULL,
    "Rating"             integer       NOT NULL CHECK ("Rating" BETWEEN 1 AND 5),
    "Title"              varchar(200),
    "Content"            varchar(2000) NOT NULL DEFAULT '',
    "IsVerifiedPurchase" boolean       NOT NULL DEFAULT false,
    "CreatedAt"          timestamptz   NOT NULL DEFAULT now(),
    "UpdatedAt"          timestamptz,
    CONSTRAINT "UQ_BookReviews_BookUser" UNIQUE ("BookId", "UserId")
);

CREATE INDEX IF NOT EXISTS "IX_BookReviews_BookId"  ON tenant_demo."BookReviews" ("BookId");
CREATE INDEX IF NOT EXISTS "IX_BookReviews_UserId"  ON tenant_demo."BookReviews" ("UserId");

-- Ensure Books has Rating/ReviewCount columns (added earlier but confirm)
ALTER TABLE tenant_demo."Books"
    ADD COLUMN IF NOT EXISTS "Rating"      numeric(3,1) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "ReviewCount" integer      NOT NULL DEFAULT 0;

SELECT 'Phase 4 migration completed.' AS result;
