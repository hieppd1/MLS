SET search_path TO tenant_demo;

CREATE TABLE IF NOT EXISTS "CourseLevels" (
    "Id" uuid NOT NULL,
    "CourseId" uuid NOT NULL,
    "Name" varchar(200) NOT NULL,
    "Description" varchar(1000) NULL,
    "OrderIndex" int NOT NULL DEFAULT 0,
    "IsPublished" boolean NOT NULL DEFAULT false,
    "CreatedAt" timestamptz NOT NULL,
    "UpdatedAt" timestamptz NULL,
    CONSTRAINT "PK_CourseLevels" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_CourseLevels_Courses" FOREIGN KEY ("CourseId") REFERENCES "Courses"("Id") ON DELETE CASCADE
);

ALTER TABLE "CourseModules" ADD COLUMN IF NOT EXISTS "LevelId" uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'FK_CourseModules_CourseLevels'
    AND table_schema = 'tenant_demo'
  ) THEN
    ALTER TABLE "CourseModules" ADD CONSTRAINT "FK_CourseModules_CourseLevels" 
      FOREIGN KEY ("LevelId") REFERENCES "CourseLevels"("Id") ON DELETE SET NULL;
  END IF;
END $$;

SELECT 'Migration completed successfully' as result;
