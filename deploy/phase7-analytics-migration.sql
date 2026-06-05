-- ============================================================
-- Phase 7 Analytics + Course Chat Group Migration
-- Run against the tenant_demo schema
-- All statements are idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- ============================================================

SET search_path TO tenant_demo, public;

-- ── 1. Users: activity tracking ──────────────────────────────────────────────
ALTER TABLE "Users"
    ADD COLUMN IF NOT EXISTS "LastActiveAt" timestamp with time zone;

-- ── 2. UserProfiles: demographics ────────────────────────────────────────────
ALTER TABLE "UserProfiles"
    ADD COLUMN IF NOT EXISTS "Country"        varchar(100),
    ADD COLUMN IF NOT EXISTS "NativeLanguage" varchar(20);

-- ── 3. ChatGroups: course-linked group support ────────────────────────────────
ALTER TABLE "ChatGroups"
    ADD COLUMN IF NOT EXISTS "CourseId"      uuid,
    ADD COLUMN IF NOT EXISTS "IsCourseGroup" boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "IX_ChatGroups_CourseId"
    ON "ChatGroups" ("CourseId")
    WHERE "CourseId" IS NOT NULL;

-- ── 4. ContentViews: new table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ContentViews" (
    "Id"          uuid                        NOT NULL,
    "ContentType" character varying(20)       NOT NULL,
    "ContentId"   uuid                        NOT NULL,
    "UserId"      uuid,
    "ViewedAt"    timestamp with time zone    NOT NULL,
    "CreatedAt"   timestamp with time zone    NOT NULL DEFAULT now(),
    "UpdatedAt"   timestamp with time zone,
    CONSTRAINT "PK_ContentViews" PRIMARY KEY ("Id")
);

CREATE INDEX IF NOT EXISTS "IX_ContentViews_Type_Id_Date"
    ON "ContentViews" ("ContentType", "ContentId", "ViewedAt");

CREATE INDEX IF NOT EXISTS "IX_ContentViews_User_Type_Id"
    ON "ContentViews" ("UserId", "ContentType", "ContentId")
    WHERE "UserId" IS NOT NULL;

-- ── Done ─────────────────────────────────────────────────────────────────────
