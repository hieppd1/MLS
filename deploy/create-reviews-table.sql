-- Run this in psql: psql -U postgres -d mls
CREATE TABLE IF NOT EXISTS tenant_demo."CourseReviews" (
    "Id" uuid NOT NULL,
    "CourseId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Rating" int NOT NULL,
    "Title" varchar(200) NULL,
    "Content" text NOT NULL DEFAULT '',
    "IsVerifiedPurchase" boolean NOT NULL DEFAULT false,
    "CreatedAt" timestamptz NOT NULL,
    "UpdatedAt" timestamptz NULL,
    CONSTRAINT "PK_CourseReviews" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_CourseReviews_Courses" FOREIGN KEY ("CourseId") REFERENCES tenant_demo."Courses"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_CourseReviews_Users" FOREIGN KEY ("UserId") REFERENCES tenant_demo."Users"("Id") ON DELETE CASCADE,
    CONSTRAINT "UQ_CourseReviews_UserCourse" UNIQUE ("UserId", "CourseId")
);
CREATE INDEX IF NOT EXISTS "IX_CourseReviews_CourseId" ON tenant_demo."CourseReviews"("CourseId");
