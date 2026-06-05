SET search_path TO tenant_demo;

CREATE TABLE IF NOT EXISTS "LearningLevels" (
    "Id" uuid NOT NULL,
    "Name" varchar(200) NOT NULL,
    "Description" varchar(500) NULL,
    "OrderIndex" int NOT NULL DEFAULT 0,
    "IsActive" boolean NOT NULL DEFAULT true,
    "CreatedAt" timestamptz NOT NULL,
    "UpdatedAt" timestamptz NULL,
    CONSTRAINT "PK_LearningLevels" PRIMARY KEY ("Id")
);

INSERT INTO "LearningLevels" ("Id", "Name", "Description", "OrderIndex", "IsActive", "CreatedAt")
SELECT gen_random_uuid(), v.name, v.desc, v.idx, true, NOW()
FROM (VALUES
    ('Cấp 1 – Beginner',         'Dành cho người mới bắt đầu hoàn toàn', 0),
    ('Cấp 2 – Elementary',       'Đã có kiến thức cơ bản', 1),
    ('Cấp 3 – Pre-Intermediate', 'Trình độ trước trung cấp', 2),
    ('Cấp 4 – Intermediate',     'Trình độ trung cấp', 3),
    ('Cấp 5 – Upper-Intermediate','Trình độ trên trung cấp', 4),
    ('Cấp 6 – Advanced',         'Trình độ nâng cao', 5)
) AS v(name, desc, idx)
WHERE NOT EXISTS (SELECT 1 FROM "LearningLevels" LIMIT 1);

SELECT COUNT(*) as "LearningLevels count" FROM "LearningLevels";
