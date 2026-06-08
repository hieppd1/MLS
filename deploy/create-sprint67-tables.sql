-- Sprint 67 tables: Notifications, UserDeviceTokens, LessonComments, LessonCommentUpvotes
-- All in tenant_demo schema (matches existing EF migrations)

SET search_path TO tenant_demo, public;

-- Notifications
CREATE TABLE IF NOT EXISTS "Notifications" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Type" character varying(50) NOT NULL,
    "Title" character varying(255) NOT NULL,
    "Body" text NOT NULL,
    "LinkUrl" character varying(500) NULL,
    "IsRead" boolean NOT NULL DEFAULT false,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    "UpdatedAt" timestamp with time zone NULL,
    CONSTRAINT "PK_Notifications" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Notifications_Users_UserId" FOREIGN KEY ("UserId")
        REFERENCES "Users" ("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId_IsRead_CreatedAt"
    ON "Notifications" ("UserId","IsRead","CreatedAt");

-- UserDeviceTokens
CREATE TABLE IF NOT EXISTS "UserDeviceTokens" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Token" character varying(500) NOT NULL,
    "Platform" character varying(20) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    "UpdatedAt" timestamp with time zone NULL,
    CONSTRAINT "PK_UserDeviceTokens" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_UserDeviceTokens_Users_UserId" FOREIGN KEY ("UserId")
        REFERENCES "Users" ("Id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_UserDeviceTokens_UserId_Platform"
    ON "UserDeviceTokens" ("UserId","Platform");

-- LessonComments
CREATE TABLE IF NOT EXISTS "LessonComments" (
    "Id" uuid NOT NULL,
    "LessonId" uuid NULL,
    "SessionId" uuid NULL,
    "AuthorId" uuid NOT NULL,
    "ParentId" uuid NULL,
    "Content" text NOT NULL,
    "UpvoteCount" integer NOT NULL DEFAULT 0,
    "IsDeleted" boolean NOT NULL DEFAULT false,
    "IsPinned" boolean NOT NULL DEFAULT false,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    "UpdatedAt" timestamp with time zone NULL,
    CONSTRAINT "PK_LessonComments" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_LessonComments_Users_AuthorId" FOREIGN KEY ("AuthorId")
        REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_LessonComments_LessonComments_ParentId" FOREIGN KEY ("ParentId")
        REFERENCES "LessonComments" ("Id") ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "IX_LessonComments_LessonId_CreatedAt"
    ON "LessonComments" ("LessonId","CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_LessonComments_SessionId_CreatedAt"
    ON "LessonComments" ("SessionId","CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_LessonComments_ParentId"
    ON "LessonComments" ("ParentId");

-- LessonCommentUpvotes
CREATE TABLE IF NOT EXISTS "LessonCommentUpvotes" (
    "CommentId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "PK_LessonCommentUpvotes" PRIMARY KEY ("CommentId","UserId"),
    CONSTRAINT "FK_LessonCommentUpvotes_LessonComments_CommentId" FOREIGN KEY ("CommentId")
        REFERENCES "LessonComments" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_LessonCommentUpvotes_Users_UserId" FOREIGN KEY ("UserId")
        REFERENCES "Users" ("Id") ON DELETE CASCADE
);
