using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MLS.Domain.Entities;
using MLS.Infrastructure.Persistence;

namespace MLS.Infrastructure.Tenancy;

/// <summary>
/// Creates a new PostgreSQL schema for a tenant and runs all DDL to set up tables.
/// Seeds default roles (Student, Teacher, ContentManager, Support, Admin).
/// </summary>
public class TenantProvisioner(
    ApplicationDbContext db,
    ILogger<TenantProvisioner> logger)
{
    private static readonly Regex SafeSchema = new(@"^[a-z0-9_]+$", RegexOptions.Compiled);

    public async Task ProvisionAsync(string schemaName, CancellationToken ct = default)
    {
        if (!SafeSchema.IsMatch(schemaName))
            throw new ArgumentException($"Invalid schema name: {schemaName}");

        logger.LogInformation("Provisioning tenant schema: {Schema}", schemaName);

        await CreateSchemaAsync(schemaName, ct);
        await SetSearchPath(schemaName, ct);
        await CreateTablesAsync(schemaName, ct);
        await SeedDefaultRolesAsync(schemaName, ct);

        logger.LogInformation("Tenant schema provisioned: {Schema}", schemaName);
    }

    /// <summary>
    /// Applies incremental schema changes for existing tenants (safe to run multiple times).
    /// </summary>
    public async Task UpgradeSchemaAsync(string schemaName, CancellationToken ct = default)
    {
        if (!SafeSchema.IsMatch(schemaName))
            throw new ArgumentException($"Invalid schema name: {schemaName}");

        logger.LogInformation("Upgrading tenant schema: {Schema}", schemaName);
        await SetSearchPath(schemaName, ct);
#pragma warning disable EF1002
        // Add new columns to existing tables (idempotent — IF EXISTS guards against fresh schemas)
        await db.Database.ExecuteSqlRawAsync($@"
            ALTER TABLE IF EXISTS ""{schemaName}"".""UserProfiles"" ADD COLUMN IF NOT EXISTS ""Gender"" varchar(10) NULL;
            ALTER TABLE IF EXISTS ""{schemaName}"".""UserProfiles"" ADD COLUMN IF NOT EXISTS ""Address"" varchar(500) NULL;
            ALTER TABLE IF EXISTS ""{schemaName}"".""UserProfiles"" ADD COLUMN IF NOT EXISTS ""Country"" varchar(100) NULL;
            ALTER TABLE IF EXISTS ""{schemaName}"".""UserProfiles"" ADD COLUMN IF NOT EXISTS ""NativeLanguage"" varchar(20) NULL;
            ALTER TABLE IF EXISTS ""{schemaName}"".""UserProfiles"" ADD COLUMN IF NOT EXISTS ""PreferredLocale"" text NULL;
        ", ct);
        await db.Database.ExecuteSqlRawAsync($@"
            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""BannerSlides"" (
                ""Id"" uuid NOT NULL,
                ""Title"" varchar(200) NOT NULL,
                ""Subtitle"" varchar(300) NULL,
                ""Description"" varchar(500) NULL,
                ""ImageUrl"" varchar(500) NULL,
                ""LinkUrl"" varchar(500) NULL,
                ""BadgeText"" varchar(100) NULL,
                ""CtaText"" varchar(100) NULL,
                ""BgColor"" varchar(20) NULL,
                ""TextColor"" varchar(20) NULL,
                ""OrderIndex"" int NOT NULL DEFAULT 0,
                ""IsActive"" boolean NOT NULL DEFAULT true,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_BannerSlides"" PRIMARY KEY (""Id"")
            );
            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""TeacherProfiles"" (
                ""Id"" uuid NOT NULL,
                ""UserId"" uuid NOT NULL,
                ""DisplayName"" varchar(200) NOT NULL,
                ""Slug"" varchar(200) NOT NULL,
                ""AvatarUrl"" varchar(500) NULL,
                ""CoverUrl"" varchar(500) NULL,
                ""Headline"" varchar(300) NULL,
                ""Bio"" text NULL,
                ""ExperienceYears"" int NOT NULL DEFAULT 0,
                ""Specialization"" varchar(200) NULL,
                ""FacebookUrl"" varchar(500) NULL,
                ""YoutubeUrl"" varchar(500) NULL,
                ""TiktokUrl"" varchar(500) NULL,
                ""WebsiteUrl"" varchar(500) NULL,
                ""IsVerified"" boolean NOT NULL DEFAULT false,
                ""IsPublic"" boolean NOT NULL DEFAULT true,
                ""FollowerCount"" int NOT NULL DEFAULT 0,
                ""CourseCount"" int NOT NULL DEFAULT 0,
                ""RatingAverage"" decimal(3,2) NOT NULL DEFAULT 0,
                ""TotalViews"" bigint NOT NULL DEFAULT 0,
                ""TotalStudents"" bigint NOT NULL DEFAULT 0,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_TeacherProfiles"" PRIMARY KEY (""Id""),
                CONSTRAINT ""UQ_TeacherProfiles_Slug"" UNIQUE (""Slug""),
                CONSTRAINT ""UQ_TeacherProfiles_UserId"" UNIQUE (""UserId"")
            );
            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""TeacherFollowers"" (
                ""Id"" uuid NOT NULL,
                ""TeacherProfileId"" uuid NOT NULL,
                ""StudentId"" uuid NOT NULL,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_TeacherFollowers"" PRIMARY KEY (""Id""),
                CONSTRAINT ""UQ_TeacherFollowers_TeacherStudent"" UNIQUE (""TeacherProfileId"", ""StudentId""),
                CONSTRAINT ""FK_TeacherFollowers_TeacherProfiles"" FOREIGN KEY (""TeacherProfileId"") REFERENCES ""{schemaName}"".""TeacherProfiles""(""Id"") ON DELETE CASCADE
            );", ct);

        // V4: Interactive Learning tables
        await db.Database.ExecuteSqlRawAsync($@"
            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""SessionVideoAssets"" (
                ""Id"" uuid NOT NULL,
                ""SessionId"" uuid NOT NULL,
                ""Status"" varchar(30) NOT NULL DEFAULT 'Pending',
                ""HlsPath"" varchar(500) NULL,
                ""ThumbnailUrl"" varchar(500) NULL,
                ""DurationSeconds"" int NOT NULL DEFAULT 0,
                ""SizeBytes"" bigint NOT NULL DEFAULT 0,
                ""OriginalFileName"" varchar(255) NULL,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_SessionVideoAssets"" PRIMARY KEY (""Id"")
            );

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""Sessions"" (
                ""Id"" uuid NOT NULL,
                ""ModuleId"" uuid NOT NULL,
                ""Title"" varchar(300) NOT NULL,
                ""Description"" text NULL,
                ""OrderIndex"" int NOT NULL DEFAULT 0,
                ""IsFreeTrial"" boolean NOT NULL DEFAULT false,
                ""PublishStatus"" varchar(20) NOT NULL DEFAULT 'Draft',
                ""SessionType"" varchar(20) NOT NULL DEFAULT 'Interactive',
                ""VideoAssetId"" uuid NULL,
                ""DurationSeconds"" int NOT NULL DEFAULT 0,
                ""DurationMinutes"" int NOT NULL DEFAULT 0,
                ""ThumbnailUrl"" varchar(500) NULL,
                ""Content"" text NULL,
                ""AudioUrl"" varchar(500) NULL,
                ""DocumentUrl"" varchar(500) NULL,
                ""Transcript"" text NULL,
                ""PassScore"" int NOT NULL DEFAULT 70,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_Sessions"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_Sessions_Modules"" FOREIGN KEY (""ModuleId"") REFERENCES ""{schemaName}"".""CourseModules""(""Id"") ON DELETE CASCADE,
                CONSTRAINT ""FK_Sessions_VideoAsset"" FOREIGN KEY (""VideoAssetId"") REFERENCES ""{schemaName}"".""SessionVideoAssets""(""Id"") ON DELETE SET NULL
            );

            DO $do$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_SessionVideoAssets_Sessions') THEN
                    ALTER TABLE ""{schemaName}"".""SessionVideoAssets""
                    ADD CONSTRAINT ""FK_SessionVideoAssets_Sessions""
                    FOREIGN KEY (""SessionId"") REFERENCES ""{schemaName}"".""Sessions""(""Id"") ON DELETE CASCADE;
                END IF;
            END $do$;

            CREATE INDEX IF NOT EXISTS ""IX_Sessions_ModuleId_OrderIndex"" ON ""{schemaName}"".""Sessions""(""ModuleId"", ""OrderIndex"");

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""Segments"" (
                ""Id"" uuid NOT NULL,
                ""SessionId"" uuid NOT NULL,
                ""Title"" varchar(200) NOT NULL,
                ""Description"" text NULL,
                ""StartTime"" int NOT NULL DEFAULT 0,
                ""EndTime"" int NOT NULL DEFAULT 0,
                ""OrderIndex"" int NOT NULL DEFAULT 0,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_Segments"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_Segments_Sessions"" FOREIGN KEY (""SessionId"") REFERENCES ""{schemaName}"".""Sessions""(""Id"") ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS ""IX_Segments_SessionId_OrderIndex"" ON ""{schemaName}"".""Segments""(""SessionId"", ""OrderIndex"");

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""LearningAssets"" (
                ""Id"" uuid NOT NULL,
                ""SegmentId"" uuid NOT NULL,
                ""Type"" varchar(30) NOT NULL,
                ""Title"" varchar(200) NOT NULL,
                ""Description"" text NULL,
                ""StartTime"" int NOT NULL DEFAULT 0,
                ""EndTime"" int NULL,
                ""OrderIndex"" int NOT NULL DEFAULT 0,
                ""Metadata"" jsonb NOT NULL DEFAULT jsonb_build_object(),
                ""IsPublic"" boolean NOT NULL DEFAULT true,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_LearningAssets"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_LearningAssets_Segments"" FOREIGN KEY (""SegmentId"") REFERENCES ""{schemaName}"".""Segments""(""Id"") ON DELETE CASCADE
            );
            -- Add EndTime for existing tables (idempotent upgrade)
            ALTER TABLE IF EXISTS ""{schemaName}"".""LearningAssets""
                ADD COLUMN IF NOT EXISTS ""EndTime"" int NULL;
            CREATE INDEX IF NOT EXISTS ""IX_LearningAssets_SegmentId_OrderIndex"" ON ""{schemaName}"".""LearningAssets""(""SegmentId"", ""OrderIndex"");

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""SessionProgresses"" (
                ""Id"" uuid NOT NULL,
                ""UserId"" uuid NOT NULL,
                ""SessionId"" uuid NOT NULL,
                ""Status"" varchar(20) NOT NULL DEFAULT 'NotStarted',
                ""WatchedSeconds"" int NOT NULL DEFAULT 0,
                ""WatchPercentage"" double precision NOT NULL DEFAULT 0,
                ""LastPositionSeconds"" int NOT NULL DEFAULT 0,
                ""CompletedAt"" timestamptz NULL,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_SessionProgresses"" PRIMARY KEY (""Id""),
                CONSTRAINT ""UQ_SessionProgresses_UserSession"" UNIQUE (""UserId"", ""SessionId""),
                CONSTRAINT ""FK_SessionProgresses_Sessions"" FOREIGN KEY (""SessionId"") REFERENCES ""{schemaName}"".""Sessions""(""Id"") ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""SegmentProgresses"" (
                ""Id"" uuid NOT NULL,
                ""UserId"" uuid NOT NULL,
                ""SegmentId"" uuid NOT NULL,
                ""IsViewed"" boolean NOT NULL DEFAULT false,
                ""IsCompleted"" boolean NOT NULL DEFAULT false,
                ""ViewedAt"" timestamptz NULL,
                ""CompletedAt"" timestamptz NULL,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_SegmentProgresses"" PRIMARY KEY (""Id""),
                CONSTRAINT ""UQ_SegmentProgresses_UserSegment"" UNIQUE (""UserId"", ""SegmentId""),
                CONSTRAINT ""FK_SegmentProgresses_Segments"" FOREIGN KEY (""SegmentId"") REFERENCES ""{schemaName}"".""Segments""(""Id"") ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""LearningAssetInteractions"" (
                ""Id"" uuid NOT NULL,
                ""UserId"" uuid NOT NULL,
                ""AssetId"" uuid NOT NULL,
                ""InteractionType"" varchar(20) NOT NULL,
                ""Score"" int NULL,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_LearningAssetInteractions"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_LearningAssetInteractions_Assets"" FOREIGN KEY (""AssetId"") REFERENCES ""{schemaName}"".""LearningAssets""(""Id"") ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS ""IX_LearningAssetInteractions_UserAsset"" ON ""{schemaName}"".""LearningAssetInteractions""(""UserId"", ""AssetId"", ""InteractionType"");
        ", ct);

        // V4: Merge Lessons → Sessions (add new content columns, migrate data)
        await db.Database.ExecuteSqlRawAsync($@"
            -- Add content fields to Sessions (idempotent)
            ALTER TABLE IF EXISTS ""{schemaName}"".""Sessions"" ADD COLUMN IF NOT EXISTS ""SessionType"" varchar(20) NOT NULL DEFAULT 'Interactive';
            ALTER TABLE IF EXISTS ""{schemaName}"".""Sessions"" ADD COLUMN IF NOT EXISTS ""Content"" text NULL;
            ALTER TABLE IF EXISTS ""{schemaName}"".""Sessions"" ADD COLUMN IF NOT EXISTS ""AudioUrl"" varchar(500) NULL;
            ALTER TABLE IF EXISTS ""{schemaName}"".""Sessions"" ADD COLUMN IF NOT EXISTS ""DocumentUrl"" varchar(500) NULL;
            ALTER TABLE IF EXISTS ""{schemaName}"".""Sessions"" ADD COLUMN IF NOT EXISTS ""Transcript"" text NULL;
            ALTER TABLE IF EXISTS ""{schemaName}"".""Sessions"" ADD COLUMN IF NOT EXISTS ""PassScore"" int NOT NULL DEFAULT 70;
            ALTER TABLE IF EXISTS ""{schemaName}"".""Sessions"" ADD COLUMN IF NOT EXISTS ""DurationMinutes"" int NOT NULL DEFAULT 0;

            -- Migrate existing Lessons rows → Sessions (idempotent via ON CONFLICT DO NOTHING)
            INSERT INTO ""{schemaName}"".""Sessions""
                (""Id"", ""ModuleId"", ""Title"", ""Description"", ""OrderIndex"", ""IsFreeTrial"",
                 ""PublishStatus"", ""SessionType"", ""Content"", ""AudioUrl"", ""DocumentUrl"",
                 ""Transcript"", ""PassScore"", ""DurationMinutes"", ""ThumbnailUrl"", ""CreatedAt"")
            SELECT
                l.""Id"", l.""ModuleId"", l.""Title"", l.""Description"", l.""OrderIndex"", l.""IsFreeTrial"",
                l.""PublishStatus"",
                CASE l.""LessonType""
                    WHEN 'Reading' THEN 'Reading'
                    WHEN 'Audio'   THEN 'Audio'
                    WHEN 'Pdf'     THEN 'Pdf'
                    WHEN 'Quiz'    THEN 'Quiz'
                    ELSE 'Video'
                END,
                l.""Content"", l.""AudioUrl"", l.""DocumentUrl"",
                l.""Transcript"", l.""PassScore"", l.""DurationMinutes"", l.""ThumbnailUrl"", l.""CreatedAt""
            FROM ""{schemaName}"".""Lessons"" l
            WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '{schemaName}' AND table_name = 'Lessons')
            ON CONFLICT (""Id"") DO NOTHING;

            -- Create default Segment for each migrated Lesson that has none yet
            INSERT INTO ""{schemaName}"".""Segments""
                (""Id"", ""SessionId"", ""Title"", ""StartTime"", ""EndTime"", ""OrderIndex"", ""CreatedAt"")
            SELECT gen_random_uuid(), l.""Id"", 'Nội dung chính', 0, 0, 0, now()
            FROM ""{schemaName}"".""Lessons"" l
            WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '{schemaName}' AND table_name = 'Lessons')
              AND EXISTS  (SELECT 1 FROM ""{schemaName}"".""Sessions"" s WHERE s.""Id"" = l.""Id"")
              AND NOT EXISTS (SELECT 1 FROM ""{schemaName}"".""Segments"" seg WHERE seg.""SessionId"" = l.""Id"");
        ", ct);

        // Phase 2D: Realtime Comments
        await db.Database.ExecuteSqlRawAsync($@"
            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""VideoComments"" (
                ""Id"" uuid NOT NULL,
                ""SessionId"" uuid NOT NULL,
                ""SegmentId"" uuid NULL,
                ""UserId"" uuid NOT NULL,
                ""ParentCommentId"" uuid NULL,
                ""Content"" text NOT NULL,
                ""TimestampSecond"" int NOT NULL DEFAULT 0,
                ""LikeCount"" int NOT NULL DEFAULT 0,
                ""IsPinned"" boolean NOT NULL DEFAULT false,
                ""Status"" varchar(20) NOT NULL DEFAULT 'Active',
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_VideoComments"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_VideoComments_Sessions"" FOREIGN KEY (""SessionId"") REFERENCES ""{schemaName}"".""Sessions""(""Id"") ON DELETE CASCADE,
                CONSTRAINT ""FK_VideoComments_Users"" FOREIGN KEY (""UserId"") REFERENCES ""{schemaName}"".""Users""(""Id"") ON DELETE CASCADE,
                CONSTRAINT ""FK_VideoComments_Parent"" FOREIGN KEY (""ParentCommentId"") REFERENCES ""{schemaName}"".""VideoComments""(""Id"") ON DELETE RESTRICT
            );
            CREATE INDEX IF NOT EXISTS ""IX_VideoComments_SessionId_Timestamp"" ON ""{schemaName}"".""VideoComments""(""SessionId"", ""TimestampSecond"");
            CREATE INDEX IF NOT EXISTS ""IX_VideoComments_UserId"" ON ""{schemaName}"".""VideoComments""(""UserId"");

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""CommentReactions"" (
                ""Id"" uuid NOT NULL,
                ""CommentId"" uuid NOT NULL,
                ""UserId"" uuid NOT NULL,
                ""ReactionType"" varchar(20) NOT NULL DEFAULT 'Like',
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_CommentReactions"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_CommentReactions_Comments"" FOREIGN KEY (""CommentId"") REFERENCES ""{schemaName}"".""VideoComments""(""Id"") ON DELETE CASCADE,
                CONSTRAINT ""UQ_CommentReactions_CommentUser"" UNIQUE (""CommentId"", ""UserId"")
            );
        ", ct);

        // Phase 2D: Course Pricing
        await db.Database.ExecuteSqlRawAsync($@"
            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""CoursePackages"" (
                ""Id"" uuid NOT NULL,
                ""CourseId"" uuid NOT NULL,
                ""PackageType"" varchar(20) NOT NULL,
                ""Title"" varchar(200) NOT NULL,
                ""Description"" text NULL,
                ""OriginalPrice"" decimal(18,2) NOT NULL DEFAULT 0,
                ""SalePrice"" decimal(18,2) NOT NULL DEFAULT 0,
                ""DurationDay"" int NOT NULL DEFAULT 0,
                ""Status"" varchar(20) NOT NULL DEFAULT 'Draft',
                ""MonthlyTestQuota"" int NULL,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_CoursePackages"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_CoursePackages_Courses"" FOREIGN KEY (""CourseId"") REFERENCES ""{schemaName}"".""Courses""(""Id"") ON DELETE CASCADE,
                CONSTRAINT ""UQ_CoursePackages_CourseType"" UNIQUE (""CourseId"", ""PackageType"")
            );

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""PackageEntitlements"" (
                ""Id"" uuid NOT NULL,
                ""PackageId"" uuid NOT NULL,
                ""FeatureCode"" varchar(100) NOT NULL,
                ""Enabled"" boolean NOT NULL DEFAULT true,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_PackageEntitlements"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_PackageEntitlements_Packages"" FOREIGN KEY (""PackageId"") REFERENCES ""{schemaName}"".""CoursePackages""(""Id"") ON DELETE CASCADE,
                CONSTRAINT ""UQ_PackageEntitlements_PackageFeature"" UNIQUE (""PackageId"", ""FeatureCode"")
            );

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""StudentPackages"" (
                ""Id"" uuid NOT NULL,
                ""StudentId"" uuid NOT NULL,
                ""PackageId"" uuid NOT NULL,
                ""StartDate"" timestamptz NOT NULL,
                ""ExpiredDate"" timestamptz NULL,
                ""Status"" varchar(20) NOT NULL DEFAULT 'Active',
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_StudentPackages"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_StudentPackages_Users"" FOREIGN KEY (""StudentId"") REFERENCES ""{schemaName}"".""Users""(""Id"") ON DELETE CASCADE,
                CONSTRAINT ""FK_StudentPackages_Packages"" FOREIGN KEY (""PackageId"") REFERENCES ""{schemaName}"".""CoursePackages""(""Id"") ON DELETE RESTRICT,
                CONSTRAINT ""UQ_StudentPackages_StudentPackage"" UNIQUE (""StudentId"", ""PackageId"")
            );
            CREATE INDEX IF NOT EXISTS ""IX_StudentPackages_StudentStatus"" ON ""{schemaName}"".""StudentPackages""(""StudentId"", ""Status"");

            -- Course Reviews
            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""CourseReviews"" (
                ""Id"" uuid NOT NULL,
                ""CourseId"" uuid NOT NULL,
                ""UserId"" uuid NOT NULL,
                ""Rating"" int NOT NULL,
                ""Title"" varchar(200) NULL,
                ""Content"" text NOT NULL DEFAULT '',
                ""IsVerifiedPurchase"" boolean NOT NULL DEFAULT false,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_CourseReviews"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_CourseReviews_Courses"" FOREIGN KEY (""CourseId"") REFERENCES ""{schemaName}"".""Courses""(""Id"") ON DELETE CASCADE,
                CONSTRAINT ""FK_CourseReviews_Users"" FOREIGN KEY (""UserId"") REFERENCES ""{schemaName}"".""Users""(""Id"") ON DELETE CASCADE,
                CONSTRAINT ""UQ_CourseReviews_UserCourse"" UNIQUE (""UserId"", ""CourseId"")
            );
            CREATE INDEX IF NOT EXISTS ""IX_CourseReviews_CourseId"" ON ""{schemaName}"".""CourseReviews""(""CourseId"");
        ", ct);

        // Shipping module — idempotent for existing tenants
        await db.Database.ExecuteSqlRawAsync($@"
            ALTER TABLE IF EXISTS ""{schemaName}"".""Orders""
                ADD COLUMN IF NOT EXISTS ""ShippingStatus""   varchar(30) NULL;
            ALTER TABLE IF EXISTS ""{schemaName}"".""Orders""
                ADD COLUMN IF NOT EXISTS ""ShippingProvider"" varchar(50) NULL;

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""Shipments"" (
                ""Id""              uuid            NOT NULL,
                ""OrderId""         uuid            NOT NULL,
                ""Provider""        varchar(50)     NOT NULL DEFAULT 'ViettelPost',
                ""TrackingNumber""  varchar(100)    NULL,
                ""Status""          varchar(30)     NOT NULL DEFAULT 'Pending',
                ""ShippingFee""     decimal(18,2)   NOT NULL DEFAULT 0,
                ""ReceiverName""    varchar(255)    NOT NULL,
                ""ReceiverPhone""   varchar(20)     NOT NULL,
                ""ReceiverAddress"" text            NOT NULL,
                ""ProvinceCode""    varchar(20)     NULL,
                ""DistrictCode""    varchar(20)     NULL,
                ""WardCode""        varchar(20)     NULL,
                ""RawResponse""     text            NULL,
                ""CreatedAt""       timestamptz     NOT NULL,
                ""UpdatedAt""       timestamptz     NULL,
                CONSTRAINT ""PK_Shipments"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_Shipments_Orders"" FOREIGN KEY (""OrderId"")
                    REFERENCES ""{schemaName}"".""Orders""(""Id"") ON DELETE RESTRICT
            );
            CREATE INDEX IF NOT EXISTS ""IX_Shipments_OrderId""        ON ""{schemaName}"".""Shipments""(""OrderId"");
            CREATE INDEX IF NOT EXISTS ""IX_Shipments_TrackingNumber""  ON ""{schemaName}"".""Shipments""(""TrackingNumber"");

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""ShipmentTrackingLogs"" (
                ""Id""          uuid        NOT NULL,
                ""ShipmentId""  uuid        NOT NULL,
                ""Status""      varchar(50) NOT NULL,
                ""Description"" text        NULL,
                ""RawData""     text        NULL,
                ""CreatedAt""   timestamptz NOT NULL,
                ""UpdatedAt""   timestamptz NULL,
                CONSTRAINT ""PK_ShipmentTrackingLogs"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_ShipmentTrackingLogs_Shipments"" FOREIGN KEY (""ShipmentId"")
                    REFERENCES ""{schemaName}"".""Shipments""(""Id"") ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS ""IX_ShipmentTrackingLogs_ShipmentId"" ON ""{schemaName}"".""ShipmentTrackingLogs""(""ShipmentId"");
        ", ct);
#pragma warning restore EF1002
    }

    private async Task CreateSchemaAsync(string schemaName, CancellationToken ct)
    {
        // schema name validated above — safe to interpolate
#pragma warning disable EF1002
        await db.Database.ExecuteSqlRawAsync(
            $"CREATE SCHEMA IF NOT EXISTS \"{schemaName}\"", ct);
#pragma warning restore EF1002
    }

    private async Task SetSearchPath(string schemaName, CancellationToken ct)
    {
#pragma warning disable EF1002
        await db.Database.ExecuteSqlRawAsync(
            $"SET search_path TO \"{schemaName}\", public", ct);
#pragma warning restore EF1002
    }

    private async Task CreateTablesAsync(string schemaName, CancellationToken ct)
    {
        // Create all tenant tables using explicit DDL
#pragma warning disable EF1002
        await db.Database.ExecuteSqlRawAsync($@"
            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""Roles"" (
                ""Id"" uuid NOT NULL DEFAULT gen_random_uuid(),
                ""Name"" varchar(50) NOT NULL,
                ""Description"" varchar(255) NULL,
                ""Permissions"" jsonb NOT NULL DEFAULT '[]',
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_Roles"" PRIMARY KEY (""Id""),
                CONSTRAINT ""UQ_Roles_Name"" UNIQUE (""Name"")
            );

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""Users"" (
                ""Id"" uuid NOT NULL,
                ""Email"" varchar(255) NOT NULL,
                ""Phone"" varchar(20) NULL,
                ""PasswordHash"" varchar(512) NULL,
                ""GoogleId"" varchar(128) NULL,
                ""Status"" varchar(30) NOT NULL DEFAULT 'PendingVerification',
                ""MoodleUserId"" bigint NULL,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_Users"" PRIMARY KEY (""Id""),
                CONSTRAINT ""UQ_Users_Email"" UNIQUE (""Email"")
            );

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""UserProfiles"" (
                ""Id"" uuid NOT NULL,
                ""UserId"" uuid NOT NULL,
                ""FullName"" varchar(100) NOT NULL,
                ""AvatarUrl"" varchar(512) NULL,
                ""DateOfBirth"" date NULL,
                ""Gender"" varchar(10) NULL,
                ""Address"" varchar(500) NULL,
                ""CurrentLevel"" varchar(50) NULL,
                ""Country"" varchar(100) NULL,
                ""NativeLanguage"" varchar(20) NULL,
                ""PreferredLocale"" text NULL,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_UserProfiles"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_UserProfiles_Users"" FOREIGN KEY (""UserId"") REFERENCES ""{schemaName}"".""Users""(""Id"") ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""UserRoles"" (
                ""UserId"" uuid NOT NULL,
                ""RoleId"" uuid NOT NULL,
                ""AssignedAt"" timestamptz NOT NULL,
                CONSTRAINT ""PK_UserRoles"" PRIMARY KEY (""UserId"", ""RoleId""),
                CONSTRAINT ""FK_UserRoles_Users"" FOREIGN KEY (""UserId"") REFERENCES ""{schemaName}"".""Users""(""Id"") ON DELETE CASCADE,
                CONSTRAINT ""FK_UserRoles_Roles"" FOREIGN KEY (""RoleId"") REFERENCES ""{schemaName}"".""Roles""(""Id"") ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""RefreshTokens"" (
                ""Id"" uuid NOT NULL,
                ""UserId"" uuid NOT NULL,
                ""TokenHash"" varchar(128) NOT NULL,
                ""DeviceId"" varchar(128) NULL,
                ""ExpiresAt"" timestamptz NOT NULL,
                ""RevokedAt"" timestamptz NULL,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_RefreshTokens"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_RefreshTokens_Users"" FOREIGN KEY (""UserId"") REFERENCES ""{schemaName}"".""Users""(""Id"") ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS ""IX_RefreshTokens_TokenHash"" ON ""{schemaName}"".""RefreshTokens""(""TokenHash"");

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""OtpVerifications"" (
                ""Id"" uuid NOT NULL,
                ""Target"" varchar(255) NOT NULL,
                ""CodeHash"" varchar(128) NOT NULL,
                ""Type"" varchar(30) NOT NULL,
                ""ExpiresAt"" timestamptz NOT NULL,
                ""UsedAt"" timestamptz NULL,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_OtpVerifications"" PRIMARY KEY (""Id"")
            );

            -- ── CMS Tables ────────────────────────────────────────────────────

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""Courses"" (
                ""Id"" uuid NOT NULL,
                ""Title"" varchar(300) NOT NULL,
                ""Code"" varchar(50) NULL,
                ""Description"" text NULL,
                ""ShortDescription"" varchar(500) NULL,
                ""Slug"" varchar(350) NULL,
                ""Level"" int NOT NULL DEFAULT 1,
                ""Language"" varchar(10) NOT NULL DEFAULT 'VI',
                ""ThumbnailUrl"" varchar(500) NULL,
                ""BannerUrl"" varchar(500) NULL,
                ""Tags"" text NULL,
                ""Outcomes"" text NULL,
                ""Requirements"" text NULL,
                ""TargetAudience"" text NULL,
                ""Duration"" int NULL,
                ""Status"" varchar(30) NOT NULL DEFAULT 'Draft',
                ""Visibility"" varchar(20) NOT NULL DEFAULT 'Public',
                ""IsFree"" boolean NOT NULL DEFAULT false,
                ""CertificateEnabled"" boolean NOT NULL DEFAULT false,
                ""CompletionRequired"" boolean NOT NULL DEFAULT false,
                ""StartDate"" timestamptz NULL,
                ""EndDate"" timestamptz NULL,
                ""TeacherId"" uuid NULL,
                ""CreatedBy"" uuid NOT NULL,
                ""PublishedAt"" timestamptz NULL,
                ""Price"" decimal(18,2) NOT NULL DEFAULT 0,
                ""DiscountPrice"" decimal(18,2) NULL,
                ""DiscountEndsAt"" timestamptz NULL,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_Courses"" PRIMARY KEY (""Id"")
            );

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""LearningLevels"" (
                ""Id"" uuid NOT NULL,
                ""Name"" varchar(200) NOT NULL,
                ""Description"" varchar(500) NULL,
                ""OrderIndex"" int NOT NULL DEFAULT 0,
                ""IsActive"" boolean NOT NULL DEFAULT true,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_LearningLevels"" PRIMARY KEY (""Id"")
            );

            INSERT INTO ""{schemaName}"".""LearningLevels"" (""Id"", ""Name"", ""Description"", ""OrderIndex"", ""IsActive"", ""CreatedAt"")
            SELECT gen_random_uuid(), v.name, v.descr, v.idx, true, NOW()
            FROM (VALUES
                ('Cấp 1 – Beginner',        'Dành cho người mới bắt đầu hoàn toàn', 0),
                ('Cấp 2 – Elementary',       'Đã có kiến thức cơ bản', 1),
                ('Cấp 3 – Pre-Intermediate', 'Trình độ trước trung cấp', 2),
                ('Cấp 4 – Intermediate',     'Trình độ trung cấp', 3),
                ('Cấp 5 – Upper-Intermediate','Trình độ trên trung cấp', 4),
                ('Cấp 6 – Advanced',         'Trình độ nâng cao', 5)
            ) AS v(name, descr, idx)
            WHERE NOT EXISTS (SELECT 1 FROM ""{schemaName}"".""LearningLevels"" LIMIT 1);

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""CourseLevels"" (
                ""Id"" uuid NOT NULL,
                ""CourseId"" uuid NOT NULL,
                ""Name"" varchar(200) NOT NULL,
                ""Description"" varchar(1000) NULL,
                ""OrderIndex"" int NOT NULL DEFAULT 0,
                ""IsPublished"" boolean NOT NULL DEFAULT false,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_CourseLevels"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_CourseLevels_Courses"" FOREIGN KEY (""CourseId"") REFERENCES ""{schemaName}"".""Courses""(""Id"") ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""CourseModules"" (
                ""Id"" uuid NOT NULL,
                ""CourseId"" uuid NOT NULL,
                ""LevelId"" uuid NULL,
                ""Title"" varchar(300) NOT NULL,
                ""Description"" text NULL,
                ""ThumbnailUrl"" varchar(500) NULL,
                ""EstimatedDuration"" int NOT NULL DEFAULT 0,
                ""OrderIndex"" int NOT NULL DEFAULT 0,
                ""IsLocked"" boolean NOT NULL DEFAULT false,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_CourseModules"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_CourseModules_Courses"" FOREIGN KEY (""CourseId"") REFERENCES ""{schemaName}"".""Courses""(""Id"") ON DELETE CASCADE,
                CONSTRAINT ""FK_CourseModules_CourseLevels"" FOREIGN KEY (""LevelId"") REFERENCES ""{schemaName}"".""CourseLevels""(""Id"") ON DELETE SET NULL
            );
            ALTER TABLE ""{schemaName}"".""CourseModules"" ADD COLUMN IF NOT EXISTS ""ThumbnailUrl"" varchar(500) NULL;
            ALTER TABLE ""{schemaName}"".""CourseModules"" ADD COLUMN IF NOT EXISTS ""EstimatedDuration"" int NOT NULL DEFAULT 0;
            ALTER TABLE ""{schemaName}"".""CourseModules"" ALTER COLUMN ""Description"" TYPE text;
            ALTER TABLE IF EXISTS ""{schemaName}"".""Courses"" ADD COLUMN IF NOT EXISTS ""Outcomes"" text NULL;
            ALTER TABLE IF EXISTS ""{schemaName}"".""Courses"" ADD COLUMN IF NOT EXISTS ""Requirements"" text NULL;
            ALTER TABLE IF EXISTS ""{schemaName}"".""Courses"" ADD COLUMN IF NOT EXISTS ""TargetAudience"" text NULL;

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""Lessons"" (
                ""Id"" uuid NOT NULL,
                ""ModuleId"" uuid NOT NULL,
                ""Title"" varchar(300) NOT NULL,
                ""Description"" varchar(2000) NULL,
                ""Content"" text NULL,
                ""ThumbnailUrl"" varchar(500) NULL,
                ""AudioUrl"" varchar(500) NULL,
                ""DocumentUrl"" varchar(500) NULL,
                ""Transcript"" text NULL,
                ""DurationMinutes"" int NOT NULL DEFAULT 0,
                ""LessonType"" varchar(20) NOT NULL DEFAULT 'Video',
                ""PublishStatus"" varchar(20) NOT NULL DEFAULT 'Draft',
                ""OrderIndex"" int NOT NULL DEFAULT 0,
                ""IsFreeTrial"" boolean NOT NULL DEFAULT false,
                ""PassScore"" int NOT NULL DEFAULT 70,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_Lessons"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_Lessons_CourseModules"" FOREIGN KEY (""ModuleId"") REFERENCES ""{schemaName}"".""CourseModules""(""Id"") ON DELETE CASCADE
            );
            ALTER TABLE ""{schemaName}"".""Lessons"" ADD COLUMN IF NOT EXISTS ""ThumbnailUrl"" varchar(500) NULL;
            ALTER TABLE ""{schemaName}"".""Lessons"" ADD COLUMN IF NOT EXISTS ""AudioUrl"" varchar(500) NULL;
            ALTER TABLE ""{schemaName}"".""Lessons"" ADD COLUMN IF NOT EXISTS ""DocumentUrl"" varchar(500) NULL;
            ALTER TABLE ""{schemaName}"".""Lessons"" ADD COLUMN IF NOT EXISTS ""Transcript"" text NULL;
            ALTER TABLE ""{schemaName}"".""Lessons"" ADD COLUMN IF NOT EXISTS ""DurationMinutes"" int NOT NULL DEFAULT 0;
            ALTER TABLE ""{schemaName}"".""Lessons"" ADD COLUMN IF NOT EXISTS ""PublishStatus"" varchar(20) NOT NULL DEFAULT 'Draft';

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""VideoAssets"" (
                ""Id"" uuid NOT NULL,
                ""LessonId"" uuid NOT NULL,
                ""Status"" varchar(30) NOT NULL DEFAULT 'Pending',
                ""HlsPath"" varchar(500) NULL,
                ""ThumbnailUrl"" varchar(500) NULL,
                ""DurationSeconds"" int NOT NULL DEFAULT 0,
                ""SizeBytes"" bigint NOT NULL DEFAULT 0,
                ""OriginalFileName"" varchar(255) NULL,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_VideoAssets"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_VideoAssets_Lessons"" FOREIGN KEY (""LessonId"") REFERENCES ""{schemaName}"".""Lessons""(""Id"") ON DELETE CASCADE,
                CONSTRAINT ""UQ_VideoAssets_LessonId"" UNIQUE (""LessonId"")
            );

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""LessonDocuments"" (
                ""Id"" uuid NOT NULL,
                ""LessonId"" uuid NOT NULL,
                ""Type"" varchar(20) NOT NULL,
                ""Title"" varchar(300) NOT NULL,
                ""FileUrl"" varchar(500) NOT NULL,
                ""SizeBytes"" bigint NOT NULL DEFAULT 0,
                ""IsProtected"" boolean NOT NULL DEFAULT true,
                ""OrderIndex"" int NOT NULL DEFAULT 0,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_LessonDocuments"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_LessonDocuments_Lessons"" FOREIGN KEY (""LessonId"") REFERENCES ""{schemaName}"".""Lessons""(""Id"") ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""CourseEnrollments"" (
                ""Id"" uuid NOT NULL,
                ""UserId"" uuid NOT NULL,
                ""CourseId"" uuid NOT NULL,
                ""EnrolledAt"" timestamptz NOT NULL,
                ""ExpiresAt"" timestamptz NULL,
                ""Source"" varchar(20) NOT NULL DEFAULT 'Admin',
                ""OrderId"" uuid NULL,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_CourseEnrollments"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_CourseEnrollments_Courses"" FOREIGN KEY (""CourseId"") REFERENCES ""{schemaName}"".""Courses""(""Id"") ON DELETE CASCADE,
                CONSTRAINT ""UQ_CourseEnrollments_UserCourse"" UNIQUE (""UserId"", ""CourseId"")
            );

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""LessonProgresses"" (
                ""Id"" uuid NOT NULL,
                ""UserId"" uuid NOT NULL,
                ""LessonId"" uuid NOT NULL,
                ""Status"" varchar(20) NOT NULL DEFAULT 'NotStarted',
                ""Score"" int NULL,
                ""CompletedAt"" timestamptz NULL,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_LessonProgresses"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_LessonProgresses_Lessons"" FOREIGN KEY (""LessonId"") REFERENCES ""{schemaName}"".""Lessons""(""Id"") ON DELETE CASCADE,
                CONSTRAINT ""UQ_LessonProgresses_UserLesson"" UNIQUE (""UserId"", ""LessonId"")
            );
            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""VideoTrackings"" (
                ""Id"" uuid NOT NULL,
                ""UserId"" uuid NOT NULL,
                ""LessonId"" uuid NOT NULL,
                ""PositionSeconds"" int NOT NULL DEFAULT 0,
                ""DurationSeconds"" int NOT NULL DEFAULT 0,
                ""LastUpdatedAt"" timestamptz NOT NULL,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_VideoTrackings"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_VideoTrackings_Lessons"" FOREIGN KEY (""LessonId"") REFERENCES ""{schemaName}"".""Lessons""(""Id"") ON DELETE CASCADE,
                CONSTRAINT ""UQ_VideoTrackings_UserLesson"" UNIQUE (""UserId"", ""LessonId"")
            );
            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""BannerSlides"" (
                ""Id"" uuid NOT NULL,
                ""Title"" varchar(200) NOT NULL,
                ""Subtitle"" varchar(300) NULL,
                ""Description"" varchar(500) NULL,
                ""ImageUrl"" varchar(500) NULL,
                ""LinkUrl"" varchar(500) NULL,
                ""BadgeText"" varchar(100) NULL,
                ""CtaText"" varchar(100) NULL,
                ""BgColor"" varchar(20) NULL,
                ""TextColor"" varchar(20) NULL,
                ""OrderIndex"" int NOT NULL DEFAULT 0,
                ""IsActive"" boolean NOT NULL DEFAULT true,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_BannerSlides"" PRIMARY KEY (""Id"")
            );
            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""TeacherProfiles"" (
                ""Id"" uuid NOT NULL,
                ""UserId"" uuid NOT NULL,
                ""DisplayName"" varchar(200) NOT NULL,
                ""Slug"" varchar(200) NOT NULL,
                ""AvatarUrl"" varchar(500) NULL,
                ""CoverUrl"" varchar(500) NULL,
                ""Headline"" varchar(300) NULL,
                ""Bio"" text NULL,
                ""ExperienceYears"" int NOT NULL DEFAULT 0,
                ""Specialization"" varchar(200) NULL,
                ""FacebookUrl"" varchar(500) NULL,
                ""YoutubeUrl"" varchar(500) NULL,
                ""TiktokUrl"" varchar(500) NULL,
                ""WebsiteUrl"" varchar(500) NULL,
                ""IsVerified"" boolean NOT NULL DEFAULT false,
                ""IsPublic"" boolean NOT NULL DEFAULT true,
                ""FollowerCount"" int NOT NULL DEFAULT 0,
                ""CourseCount"" int NOT NULL DEFAULT 0,
                ""RatingAverage"" decimal(3,2) NOT NULL DEFAULT 0,
                ""TotalViews"" bigint NOT NULL DEFAULT 0,
                ""TotalStudents"" bigint NOT NULL DEFAULT 0,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_TeacherProfiles"" PRIMARY KEY (""Id""),
                CONSTRAINT ""UQ_TeacherProfiles_Slug"" UNIQUE (""Slug""),
                CONSTRAINT ""UQ_TeacherProfiles_UserId"" UNIQUE (""UserId"")
            );
            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""TeacherFollowers"" (
                ""Id"" uuid NOT NULL,
                ""TeacherProfileId"" uuid NOT NULL,
                ""StudentId"" uuid NOT NULL,
                ""CreatedAt"" timestamptz NOT NULL,
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_TeacherFollowers"" PRIMARY KEY (""Id""),
                CONSTRAINT ""UQ_TeacherFollowers_TeacherStudent"" UNIQUE (""TeacherProfileId"", ""StudentId""),
                CONSTRAINT ""FK_TeacherFollowers_TeacherProfiles"" FOREIGN KEY (""TeacherProfileId"") REFERENCES ""{schemaName}"".""TeacherProfiles""(""Id"") ON DELETE CASCADE
            );        ", ct);

        // Shipping module tables
        await db.Database.ExecuteSqlRawAsync($@"
            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""Shipments"" (
                ""Id""              uuid            NOT NULL,
                ""OrderId""         uuid            NOT NULL,
                ""Provider""        varchar(50)     NOT NULL DEFAULT 'ViettelPost',
                ""TrackingNumber""  varchar(100)    NULL,
                ""Status""          varchar(30)     NOT NULL DEFAULT 'Pending',
                ""ShippingFee""     decimal(18,2)   NOT NULL DEFAULT 0,
                ""ReceiverName""    varchar(255)    NOT NULL,
                ""ReceiverPhone""   varchar(20)     NOT NULL,
                ""ReceiverAddress"" text            NOT NULL,
                ""ProvinceCode""    varchar(20)     NULL,
                ""DistrictCode""    varchar(20)     NULL,
                ""WardCode""        varchar(20)     NULL,
                ""RawResponse""     text            NULL,
                ""CreatedAt""       timestamptz     NOT NULL,
                ""UpdatedAt""       timestamptz     NULL,
                CONSTRAINT ""PK_Shipments"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_Shipments_Orders"" FOREIGN KEY (""OrderId"")
                    REFERENCES ""{schemaName}"".""Orders""(""Id"") ON DELETE RESTRICT
            );
            CREATE INDEX IF NOT EXISTS ""IX_Shipments_OrderId""        ON ""{schemaName}"".""Shipments""(""OrderId"");
            CREATE INDEX IF NOT EXISTS ""IX_Shipments_TrackingNumber""  ON ""{schemaName}"".""Shipments""(""TrackingNumber"");

            CREATE TABLE IF NOT EXISTS ""{schemaName}"".""ShipmentTrackingLogs"" (
                ""Id""          uuid        NOT NULL,
                ""ShipmentId""  uuid        NOT NULL,
                ""Status""      varchar(50) NOT NULL,
                ""Description"" text        NULL,
                ""RawData""     text        NULL,
                ""CreatedAt""   timestamptz NOT NULL,
                ""UpdatedAt""   timestamptz NULL,
                CONSTRAINT ""PK_ShipmentTrackingLogs"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_ShipmentTrackingLogs_Shipments"" FOREIGN KEY (""ShipmentId"")
                    REFERENCES ""{schemaName}"".""Shipments""(""Id"") ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS ""IX_ShipmentTrackingLogs_ShipmentId"" ON ""{schemaName}"".""ShipmentTrackingLogs""(""ShipmentId"");

            -- Add shipping columns to Orders if not present
            ALTER TABLE IF EXISTS ""{schemaName}"".""Orders""
                ADD COLUMN IF NOT EXISTS ""ShippingStatus""   varchar(30) NULL;
            ALTER TABLE IF EXISTS ""{schemaName}"".""Orders""
                ADD COLUMN IF NOT EXISTS ""ShippingProvider"" varchar(50) NULL;
        ", ct);
#pragma warning restore EF1002
    }

    private async Task SeedDefaultRolesAsync(string schemaName, CancellationToken ct)
    {
        // Use raw SQL with explicit schema to avoid EF Core connection-pool search_path issues.
#pragma warning disable EF1002
        await db.Database.ExecuteSqlRawAsync($@"
            INSERT INTO ""{schemaName}"".""Roles"" (""Id"", ""Name"", ""Description"", ""Permissions"", ""CreatedAt"")
            VALUES
                (gen_random_uuid(), 'SuperAdmin',     NULL, '[]'::jsonb, NOW()),
                (gen_random_uuid(), 'Admin',          NULL, '[]'::jsonb, NOW()),
                (gen_random_uuid(), 'Teacher',        NULL, '[]'::jsonb, NOW()),
                (gen_random_uuid(), 'ContentManager', NULL, '[]'::jsonb, NOW()),
                (gen_random_uuid(), 'Support',        NULL, '[]'::jsonb, NOW()),
                (gen_random_uuid(), 'Student',        NULL, '[]'::jsonb, NOW())
            ON CONFLICT (""Name"") DO NOTHING", ct);
#pragma warning restore EF1002
    }
}
