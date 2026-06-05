-- ============================================================
-- Phase 6.7 Migration: Notifications + Q&A + Device Tokens
-- Safe to run multiple times (idempotent)
-- Target schema: tenant_demo (and any tenant_* schema)
-- ============================================================

-- 1. Notifications
CREATE TABLE IF NOT EXISTS "Notifications" (
    "Id"         uuid        NOT NULL DEFAULT gen_random_uuid(),
    "UserId"     uuid        NOT NULL,
    "Type"       varchar(50) NOT NULL,
    "Title"      varchar(255) NOT NULL,
    "Body"       text        NOT NULL,
    "LinkUrl"    varchar(500),
    "IsRead"     boolean     NOT NULL DEFAULT FALSE,
    "CreatedAt"  timestamptz NOT NULL DEFAULT now(),
    "UpdatedAt"  timestamptz,
    CONSTRAINT "PK_Notifications" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Notifications_Users" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_Notifications_User_IsRead_CreatedAt"
    ON "Notifications" ("UserId", "IsRead", "CreatedAt" DESC);

-- 2. UserDeviceTokens (FCM)
CREATE TABLE IF NOT EXISTS "UserDeviceTokens" (
    "Id"         uuid        NOT NULL DEFAULT gen_random_uuid(),
    "UserId"     uuid        NOT NULL,
    "Token"      varchar(500) NOT NULL,
    "Platform"   varchar(20) NOT NULL,
    "CreatedAt"  timestamptz NOT NULL DEFAULT now(),
    "UpdatedAt"  timestamptz,
    CONSTRAINT "PK_UserDeviceTokens" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_UserDeviceTokens_Users" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE,
    CONSTRAINT "UQ_UserDeviceTokens_User_Platform" UNIQUE ("UserId", "Platform")
);

CREATE INDEX IF NOT EXISTS "IX_UserDeviceTokens_UserId"
    ON "UserDeviceTokens" ("UserId");

-- 3. LessonComments
CREATE TABLE IF NOT EXISTS "LessonComments" (
    "Id"          uuid        NOT NULL DEFAULT gen_random_uuid(),
    "LessonId"    uuid,
    "SessionId"   uuid,
    "AuthorId"    uuid        NOT NULL,
    "ParentId"    uuid,
    "Content"     text        NOT NULL,
    "UpvoteCount" integer     NOT NULL DEFAULT 0,
    "IsDeleted"   boolean     NOT NULL DEFAULT FALSE,
    "IsPinned"    boolean     NOT NULL DEFAULT FALSE,
    "CreatedAt"   timestamptz NOT NULL DEFAULT now(),
    "UpdatedAt"   timestamptz,
    CONSTRAINT "PK_LessonComments" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_LessonComments_Author" FOREIGN KEY ("AuthorId") REFERENCES "Users"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_LessonComments_Parent" FOREIGN KEY ("ParentId") REFERENCES "LessonComments"("Id") ON DELETE RESTRICT,
    CONSTRAINT "CK_LessonComments_Target" CHECK ("LessonId" IS NOT NULL OR "SessionId" IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS "IX_LessonComments_Lesson"
    ON "LessonComments" ("LessonId", "CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_LessonComments_Session"
    ON "LessonComments" ("SessionId", "CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_LessonComments_Parent"
    ON "LessonComments" ("ParentId");

-- 4. LessonCommentUpvotes
CREATE TABLE IF NOT EXISTS "LessonCommentUpvotes" (
    "CommentId"  uuid NOT NULL,
    "UserId"     uuid NOT NULL,
    "CreatedAt"  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "PK_LessonCommentUpvotes" PRIMARY KEY ("CommentId", "UserId"),
    CONSTRAINT "FK_LessonCommentUpvotes_Comment" FOREIGN KEY ("CommentId") REFERENCES "LessonComments"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_LessonCommentUpvotes_User" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE
);
