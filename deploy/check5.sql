SET search_path = tenant_demo;

-- VideoAssets full info (check LessonId column)
SELECT column_name FROM information_schema.columns 
WHERE table_schema='tenant_demo' AND table_name='VideoAssets' ORDER BY ordinal_position;

-- VideoAssets data with LessonId
SELECT va."Id", va."LessonId", va."Status", va."HlsPath", va."OriginalFileName" FROM "VideoAssets" va;

-- Segments schema
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema='tenant_demo' AND table_name='Segments' ORDER BY ordinal_position;
