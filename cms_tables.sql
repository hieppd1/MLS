SET search_path TO tenant_demo, public;

CREATE TABLE IF NOT EXISTS "Courses" (
  "Id" uuid NOT NULL PRIMARY KEY,
  "Title" varchar(500) NOT NULL,
  "Description" text,
  "Level" int NOT NULL DEFAULT 1,
  "ThumbnailUrl" text,
  "Status" varchar(50) NOT NULL DEFAULT 'Draft',
  "TeacherId" uuid,
  "CreatedBy" uuid NOT NULL,
  "PublishedAt" timestamptz,
  "CreatedAt" timestamptz NOT NULL DEFAULT now(),
  "UpdatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "CourseModules" (
  "Id" uuid NOT NULL PRIMARY KEY,
  "CourseId" uuid NOT NULL REFERENCES "Courses"("Id") ON DELETE CASCADE,
  "Title" varchar(500) NOT NULL,
  "Description" text,
  "OrderIndex" int NOT NULL DEFAULT 0,
  "CreatedAt" timestamptz NOT NULL DEFAULT now(),
  "UpdatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Lessons" (
  "Id" uuid NOT NULL PRIMARY KEY,
  "ModuleId" uuid NOT NULL REFERENCES "CourseModules"("Id") ON DELETE CASCADE,
  "Title" varchar(500) NOT NULL,
  "Description" text,
  "OrderIndex" int NOT NULL DEFAULT 0,
  "IsFreeTrial" boolean NOT NULL DEFAULT false,
  "PassScore" int NOT NULL DEFAULT 70,
  "CreatedAt" timestamptz NOT NULL DEFAULT now(),
  "UpdatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "VideoAssets" (
  "Id" uuid NOT NULL PRIMARY KEY,
  "LessonId" uuid NOT NULL UNIQUE REFERENCES "Lessons"("Id") ON DELETE CASCADE,
  "Status" varchar(50) NOT NULL DEFAULT 'Pending',
  "HlsPath" text,
  "ThumbnailUrl" text,
  "DurationSeconds" int NOT NULL DEFAULT 0,
  "SizeBytes" bigint NOT NULL DEFAULT 0,
  "OriginalFileName" varchar(500),
  "CreatedAt" timestamptz NOT NULL DEFAULT now(),
  "UpdatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "LessonDocuments" (
  "Id" uuid NOT NULL PRIMARY KEY,
  "LessonId" uuid NOT NULL REFERENCES "Lessons"("Id") ON DELETE CASCADE,
  "Type" varchar(50) NOT NULL,
  "Title" varchar(500) NOT NULL,
  "FileUrl" text NOT NULL,
  "SizeBytes" bigint NOT NULL DEFAULT 0,
  "IsProtected" boolean NOT NULL DEFAULT true,
  "OrderIndex" int NOT NULL DEFAULT 0,
  "CreatedAt" timestamptz NOT NULL DEFAULT now(),
  "UpdatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "CourseEnrollments" (
  "Id" uuid NOT NULL PRIMARY KEY,
  "UserId" uuid NOT NULL,
  "CourseId" uuid NOT NULL REFERENCES "Courses"("Id") ON DELETE CASCADE,
  "EnrolledAt" timestamptz NOT NULL DEFAULT now(),
  "ExpiresAt" timestamptz,
  "Source" varchar(50) NOT NULL DEFAULT 'Admin',
  "OrderId" uuid,
  "CreatedAt" timestamptz NOT NULL DEFAULT now(),
  "UpdatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("UserId", "CourseId")
);

CREATE TABLE IF NOT EXISTS "LessonProgresses" (
  "Id" uuid NOT NULL PRIMARY KEY,
  "UserId" uuid NOT NULL,
  "LessonId" uuid NOT NULL REFERENCES "Lessons"("Id") ON DELETE CASCADE,
  "Status" varchar(50) NOT NULL DEFAULT 'NotStarted',
  "Score" int,
  "CompletedAt" timestamptz,
  "CreatedAt" timestamptz NOT NULL DEFAULT now(),
  "UpdatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("UserId", "LessonId")
);
