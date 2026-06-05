-- ============================================================
-- MIGRATION: Lessons → Sessions
-- Chạy trong transaction — rollback toàn bộ nếu có lỗi
-- Áp dụng cho từng schema tenant (thay "tenant_demo" bằng slug thực)
-- ============================================================

-- HƯỚNG DẪN:
-- 1. Thay {SCHEMA} bằng tên schema tenant thực (VD: tenant_demo)
-- 2. Chạy script này cho mỗi tenant
-- 3. Sau khi xác nhận ổn định, chạy phần CLEANUP ở cuối

BEGIN;

-- ── Bước 1: Migrate Lessons → Sessions ──────────────────────────────────────

INSERT INTO {SCHEMA}."Sessions" (
    "Id", "ModuleId", "Title", "Description",
    "OrderIndex", "IsFreeTrial",
    "PublishStatus", "SessionType",
    "Content", "AudioUrl", "DocumentUrl", "Transcript",
    "PassScore", "DurationMinutes",
    "ThumbnailUrl", "VideoAssetId", "DurationSeconds",
    "CreatedAt", "UpdatedAt"
)
SELECT
    l."Id",                    -- Giữ nguyên ID để FK references vẫn hợp lệ tạm thời
    l."ModuleId",
    l."Title",
    l."Description",
    l."OrderIndex",
    l."IsFreeTrial",
    -- Map PublishStatus: Draft/Hidden → Draft, Published → Published
    CASE l."PublishStatus"
        WHEN 'Published' THEN 'Published'
        ELSE 'Draft'
    END,
    -- Map LessonType → SessionType
    CASE l."LessonType"
        WHEN 'Video'      THEN 'Interactive'
        WHEN 'Reading'    THEN 'Reading'
        WHEN 'Audio'      THEN 'Audio'
        WHEN 'Pdf'        THEN 'Pdf'
        WHEN 'Quiz'       THEN 'Quiz'
        WHEN 'Assignment' THEN 'Reading'   -- Assignment → Reading (HTML content)
        WHEN 'Live'       THEN 'Interactive'
        ELSE 'Interactive'
    END,
    l."Content",
    l."AudioUrl",
    l."DocumentUrl",
    l."Transcript",
    l."PassScore",
    l."DurationMinutes",
    l."ThumbnailUrl",
    NULL,       -- VideoAssetId: sẽ cập nhật từ VideoAssets ở bước tiếp
    0,          -- DurationSeconds: sẽ cập nhật từ VideoAssets ở bước tiếp
    l."CreatedAt",
    l."UpdatedAt"
FROM {SCHEMA}."Lessons" l
WHERE l."Id" NOT IN (SELECT "Id" FROM {SCHEMA}."Sessions");

-- ── Bước 2: Liên kết VideoAssets (Video lessons) → cập nhật Sessions ────────

-- Tạo SessionVideoAssets từ VideoAssets (lesson video đã xử lý xong)
INSERT INTO {SCHEMA}."SessionVideoAssets" (
    "Id", "SessionId", "Status",
    "HlsPath", "ThumbnailUrl", "DurationSeconds",
    "SizeBytes", "OriginalFileName",
    "CreatedAt", "UpdatedAt"
)
SELECT
    v."Id",
    v."LessonId",   -- LessonId = SessionId (cùng ID)
    v."Status",
    v."HlsPath",
    v."ThumbnailUrl",
    v."DurationSeconds",
    v."SizeBytes",
    v."OriginalFileName",
    v."CreatedAt",
    v."UpdatedAt"
FROM {SCHEMA}."VideoAssets" v
WHERE v."LessonId" IN (SELECT "Id" FROM {SCHEMA}."Sessions")
  AND v."LessonId" NOT IN (
      SELECT "SessionId" FROM {SCHEMA}."SessionVideoAssets" WHERE "SessionId" IS NOT NULL
  );

-- Cập nhật VideoAssetId và DurationSeconds trên Sessions
UPDATE {SCHEMA}."Sessions" s
SET
    "VideoAssetId"    = v."Id",
    "DurationSeconds" = v."DurationSeconds",
    "UpdatedAt"       = now()
FROM {SCHEMA}."SessionVideoAssets" v
WHERE v."SessionId" = s."Id"
  AND s."VideoAssetId" IS NULL;

-- ── Bước 3: Tạo default Segment cho mọi Session non-Interactive ─────────────

INSERT INTO {SCHEMA}."Segments" (
    "Id", "SessionId", "Title", "Description",
    "StartTime", "EndTime", "OrderIndex",
    "CreatedAt", "UpdatedAt"
)
SELECT
    gen_random_uuid(),
    s."Id",
    'Nội dung chính',
    NULL,
    0,
    0,
    0,
    now(),
    NULL
FROM {SCHEMA}."Sessions" s
WHERE s."SessionType" != 'Interactive'
  AND s."Id" NOT IN (
      SELECT DISTINCT "SessionId" FROM {SCHEMA}."Segments"
  );

-- ── Bước 4: Migrate LessonDocuments → LearningAssets (FileAttachment) ────────

INSERT INTO {SCHEMA}."LearningAssets" (
    "Id", "SegmentId", "Type", "Title",
    "Description", "StartTime", "OrderIndex",
    "Metadata", "IsPublic",
    "CreatedAt", "UpdatedAt"
)
SELECT
    d."Id",
    -- Tìm default segment của session tương ứng
    seg."Id",
    'FileAttachment',
    d."Title",
    NULL,
    0,
    d."OrderIndex",
    jsonb_build_object(
        'fileUrl',    d."FileUrl",
        'sizeBytes',  d."SizeBytes",
        'docType',    d."Type",
        'isProtected', d."IsProtected"
    ),
    true,
    d."CreatedAt",
    d."UpdatedAt"
FROM {SCHEMA}."LessonDocuments" d
JOIN {SCHEMA}."Segments" seg ON seg."SessionId" = d."LessonId"
WHERE d."Id" NOT IN (SELECT "Id" FROM {SCHEMA}."LearningAssets");

-- ── Bước 5: Migrate LessonProgresses → SessionProgresses ─────────────────────

INSERT INTO {SCHEMA}."SessionProgresses" (
    "Id", "UserId", "SessionId",
    "Status", "Score", "CompletedAt",
    "CreatedAt", "UpdatedAt"
)
SELECT
    lp."Id",
    lp."UserId",
    lp."LessonId",   -- LessonId = SessionId (cùng ID)
    lp."Status",
    lp."Score",
    lp."CompletedAt",
    lp."CreatedAt",
    lp."UpdatedAt"
FROM {SCHEMA}."LessonProgresses" lp
WHERE lp."LessonId" IN (SELECT "Id" FROM {SCHEMA}."Sessions")
  AND lp."Id" NOT IN (SELECT "Id" FROM {SCHEMA}."SessionProgresses");

-- ── Kiểm tra kết quả ─────────────────────────────────────────────────────────

DO $$
DECLARE
    lesson_count   INT;
    session_count  INT;
    segment_count  INT;
    progress_count INT;
BEGIN
    SELECT COUNT(*) INTO lesson_count  FROM {SCHEMA}."Lessons";
    SELECT COUNT(*) INTO session_count FROM {SCHEMA}."Sessions" WHERE "Id" IN (SELECT "Id" FROM {SCHEMA}."Lessons");
    SELECT COUNT(*) INTO segment_count FROM {SCHEMA}."Segments";
    SELECT COUNT(*) INTO progress_count FROM {SCHEMA}."SessionProgresses"
        WHERE "SessionId" IN (SELECT "Id" FROM {SCHEMA}."Lessons");

    RAISE NOTICE 'Lessons: %, Sessions migrated: %, Segments: %, Progresses migrated: %',
        lesson_count, session_count, segment_count, progress_count;

    IF lesson_count != session_count THEN
        RAISE EXCEPTION 'Migration mismatch: % lessons nhưng chỉ migrate được % sessions',
            lesson_count, session_count;
    END IF;
END $$;

COMMIT;

-- ============================================================
-- CLEANUP — Chỉ chạy sau khi đã verify ổn định (vài ngày/sprint)
-- ============================================================

-- BEGIN;
-- DELETE FROM {SCHEMA}."LessonDocuments";
-- DELETE FROM {SCHEMA}."LessonProgresses";
-- DELETE FROM {SCHEMA}."VideoAssets";
-- DELETE FROM {SCHEMA}."Lessons";
-- COMMIT;

-- Sau đó drop tables (khi đã deploy backend không còn dùng Lesson):
-- DROP TABLE IF EXISTS {SCHEMA}."LessonDocuments";
-- DROP TABLE IF EXISTS {SCHEMA}."LessonProgresses";
-- DROP TABLE IF EXISTS {SCHEMA}."VideoAssets";
-- DROP TABLE IF EXISTS {SCHEMA}."Lessons";
