DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM tenant_demo."LearningLevels" LIMIT 1) THEN
    INSERT INTO tenant_demo."LearningLevels" ("Id", "Name", "Description", "OrderIndex", "IsActive", "CreatedAt")
    VALUES
      (gen_random_uuid(), 'Cap 1 - Beginner',          'Danh cho nguoi moi bat dau',  0, true, NOW()),
      (gen_random_uuid(), 'Cap 2 - Elementary',         'Da co kien thuc co ban',      1, true, NOW()),
      (gen_random_uuid(), 'Cap 3 - Pre-Intermediate',   'Trinh do truoc trung cap',    2, true, NOW()),
      (gen_random_uuid(), 'Cap 4 - Intermediate',       'Trinh do trung cap',          3, true, NOW()),
      (gen_random_uuid(), 'Cap 5 - Upper-Intermediate', 'Trinh do tren trung cap',     4, true, NOW()),
      (gen_random_uuid(), 'Cap 6 - Advanced',           'Trinh do nang cao',           5, true, NOW());
  END IF;
END $$;
SELECT COUNT(*) FROM tenant_demo."LearningLevels";
