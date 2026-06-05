SET search_path = tenant_demo;

-- Courses
SELECT "Id", "Title", "Status" FROM "Courses" ORDER BY "CreatedAt";

-- Modules  
SELECT "Id", "Title", "CourseId", "OrderIndex" FROM "CourseModules" ORDER BY "CourseId", "OrderIndex";

-- Lessons
SELECT "Id", "Title", "Type", "VideoAssetId", "ModuleId" FROM "Lessons" ORDER BY "ModuleId", "OrderIndex";

-- Sessions
SELECT "Id", "Title", "ModuleId", "EstimatedMinutes", "VideoAssetId", "PublishStatus" FROM "Sessions" ORDER BY "ModuleId", "OrderIndex";

-- Segments
SELECT "Id", "Title", "SessionId", "StartTime", "EndTime", "OrderIndex" FROM "Segments" ORDER BY "SessionId", "OrderIndex";

-- LearningAssets
SELECT "Id", "Type", "Title", "SegmentId", "StartTime", "OrderIndex" FROM "LearningAssets" ORDER BY "SegmentId", "OrderIndex";

-- VideoAssets
SELECT "Id", "OriginalFileName", "Status", "HlsPath", "DurationSeconds" FROM "VideoAssets" ORDER BY "CreatedAt";

-- Users
SELECT "Id", "Email", "CreatedAt" FROM "Users" ORDER BY "CreatedAt";
