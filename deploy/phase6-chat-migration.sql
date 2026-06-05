-- ============================================================
-- Phase 6 Migration: Group Chat & Support Chat
-- Run against DB: mls, schema: tenant_demo
-- Idempotent — safe to re-run.
-- ============================================================

SET search_path TO tenant_demo, public;

-- ────────────────────────────────────────────────────────────
-- 1. ChatGroups
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_demo."ChatGroups" (
    "Id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name"           VARCHAR(200) NOT NULL,
    "Description"    VARCHAR(2000),
    "AvatarUrl"      VARCHAR(1000),
    "Type"           VARCHAR(20)  NOT NULL DEFAULT 'Public',
    "MaxMembers"     INT          NOT NULL DEFAULT 12,
    "CurrentMembers" INT          NOT NULL DEFAULT 0,
    "Tags"           VARCHAR(500),
    "IsActive"       BOOLEAN      NOT NULL DEFAULT TRUE,
    "CreatedBy"      UUID         NOT NULL,
    "CreatedAt"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UpdatedAt"      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "IX_ChatGroups_IsActive_Type"
    ON tenant_demo."ChatGroups" ("IsActive", "Type");
CREATE INDEX IF NOT EXISTS "IX_ChatGroups_CreatedBy"
    ON tenant_demo."ChatGroups" ("CreatedBy");

-- Trigram search on Name (requires pg_trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "IX_ChatGroups_Name_Trgm"
    ON tenant_demo."ChatGroups" USING gin ("Name" gin_trgm_ops);

-- ────────────────────────────────────────────────────────────
-- 2. ChatGroupMembers
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_demo."ChatGroupMembers" (
    "Id"                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "GroupId"            UUID         NOT NULL REFERENCES tenant_demo."ChatGroups"("Id") ON DELETE CASCADE,
    "UserId"             UUID         NOT NULL,
    "Role"               VARCHAR(20)  NOT NULL DEFAULT 'Member',
    "Status"             VARCHAR(20)  NOT NULL DEFAULT 'Pending',
    "JoinedAt"           TIMESTAMPTZ,
    "ApprovedBy"         UUID,
    "ApprovedAt"         TIMESTAMPTZ,
    "LastReadMessageId"  UUID,
    "CreatedAt"          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UpdatedAt"          TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS "UX_ChatGroupMembers_Group_User"
    ON tenant_demo."ChatGroupMembers" ("GroupId", "UserId");
CREATE INDEX IF NOT EXISTS "IX_ChatGroupMembers_User_Status"
    ON tenant_demo."ChatGroupMembers" ("UserId", "Status");

-- ────────────────────────────────────────────────────────────
-- 3. ChatMessages
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_demo."ChatMessages" (
    "Id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "GroupId"    UUID        NOT NULL REFERENCES tenant_demo."ChatGroups"("Id") ON DELETE CASCADE,
    "SenderId"   UUID        NOT NULL,
    "Type"       VARCHAR(20) NOT NULL DEFAULT 'Text',
    "Content"    TEXT,
    "ReplyToId"  UUID        REFERENCES tenant_demo."ChatMessages"("Id") ON DELETE SET NULL,
    "IsDeleted"  BOOLEAN     NOT NULL DEFAULT FALSE,
    "CreatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "IX_ChatMessages_Group_Created"
    ON tenant_demo."ChatMessages" ("GroupId", "CreatedAt" DESC);
CREATE INDEX IF NOT EXISTS "IX_ChatMessages_Sender"
    ON tenant_demo."ChatMessages" ("SenderId");

-- ────────────────────────────────────────────────────────────
-- 4. ChatMessageAttachments
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_demo."ChatMessageAttachments" (
    "Id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "MessageId"  UUID        NOT NULL REFERENCES tenant_demo."ChatMessages"("Id") ON DELETE CASCADE,
    "FileUrl"    VARCHAR(1000) NOT NULL,
    "FileName"   VARCHAR(500)  NOT NULL,
    "MimeType"   VARCHAR(150),
    "SizeBytes"  BIGINT       NOT NULL DEFAULT 0,
    "Width"      INT,
    "Height"     INT,
    "CreatedAt"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UpdatedAt"  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "IX_ChatMessageAttachments_Message"
    ON tenant_demo."ChatMessageAttachments" ("MessageId");

-- ────────────────────────────────────────────────────────────
-- 5. SupportConversations
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_demo."SupportConversations" (
    "Id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "StudentId"      UUID         NOT NULL,
    "SupportUserId"  UUID,
    "Status"         VARCHAR(20)  NOT NULL DEFAULT 'Open',
    "LastMessageAt"  TIMESTAMPTZ,
    "CreatedAt"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UpdatedAt"      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "IX_SupportConversations_Status_LastMsg"
    ON tenant_demo."SupportConversations" ("Status", "LastMessageAt" DESC);
CREATE INDEX IF NOT EXISTS "IX_SupportConversations_Student"
    ON tenant_demo."SupportConversations" ("StudentId");
CREATE INDEX IF NOT EXISTS "IX_SupportConversations_Support"
    ON tenant_demo."SupportConversations" ("SupportUserId");

-- ────────────────────────────────────────────────────────────
-- 6. SupportMessages
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_demo."SupportMessages" (
    "Id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ConversationId"  UUID        NOT NULL REFERENCES tenant_demo."SupportConversations"("Id") ON DELETE CASCADE,
    "SenderId"        UUID        NOT NULL,
    "SenderRole"      VARCHAR(20) NOT NULL,
    "Type"            VARCHAR(20) NOT NULL DEFAULT 'Text',
    "Content"         TEXT,
    "FileUrl"         VARCHAR(1000),
    "FileName"        VARCHAR(500),
    "MimeType"        VARCHAR(150),
    "SizeBytes"       BIGINT,
    "CreatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "IX_SupportMessages_Conv_Created"
    ON tenant_demo."SupportMessages" ("ConversationId", "CreatedAt" DESC);

-- ────────────────────────────────────────────────────────────
-- 7. ChatSettings (singleton; one row per tenant)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_demo."ChatSettings" (
    "Id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "MaxGroupsPerUser"    INT         NOT NULL DEFAULT 3,
    "MaxMembersPerGroup"  INT         NOT NULL DEFAULT 12,
    "AllowImageUpload"    BOOLEAN     NOT NULL DEFAULT TRUE,
    "AllowFileUpload"     BOOLEAN     NOT NULL DEFAULT TRUE,
    "MaxImageSizeKb"      INT         NOT NULL DEFAULT 5120,
    "MaxFileSizeKb"       INT         NOT NULL DEFAULT 20480,
    "AllowedMimeTypes"    VARCHAR(2000),
    "CreatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"           TIMESTAMPTZ
);

-- Seed default settings row if table is empty
INSERT INTO tenant_demo."ChatSettings" ("Id")
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM tenant_demo."ChatSettings");

-- ============================================================
-- DONE
-- ============================================================
