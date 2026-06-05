-- Sprint 9-10: Seed a RealtimeQuiz with 5 questions for testing
-- Quiz ID: ffffffff-0001-0000-0000-000000000001
-- Uses existing teacher user: 8ac6f1bf-4c6c-4098-bdd5-ff7e18d0dd58

-- Step 1: Create the quiz
INSERT INTO tenant_demo."Quizzes" (
    "Id", "Title", "Description", "QuizType", "SkillType",
    "Status", "Duration", "TotalScore", "PassingScore",
    "AllowRetry", "RetryLimit", "ShowCorrectAnswer",
    "CreatedBy", "CreatedAt", "UpdatedAt"
)
VALUES (
    'ffffffff-0001-0000-0000-000000000001'::uuid,
    'Live Quiz - English Grammar Battle',
    'Realtime quiz for classroom competition',
    'RealtimeQuiz',
    'Grammar',
    'Published',
    5, 1000, 0, false, 0, true,
    '8ac6f1bf-4c6c-4098-bdd5-ff7e18d0dd58'::uuid,
    NOW(), NOW()
)
ON CONFLICT ("Id") DO NOTHING;

-- Step 2: Create standalone Questions
INSERT INTO tenant_demo."Questions" (
    "Id", "Content", "Type", "SkillType", "Difficulty",
    "DefaultScore", "IsPublic", "IsDeleted",
    "CreatedBy", "CreatedAt", "UpdatedAt"
)
VALUES
(
    'ffffffff-0001-0001-0000-000000000001'::uuid,
    'What is the past tense of "go"?',
    'MultipleChoice', 'Grammar', 'Easy', 10, true, false,
    '8ac6f1bf-4c6c-4098-bdd5-ff7e18d0dd58'::uuid, NOW(), NOW()
),
(
    'ffffffff-0001-0002-0000-000000000001'::uuid,
    'Which sentence is grammatically correct?',
    'MultipleChoice', 'Grammar', 'Easy', 10, true, false,
    '8ac6f1bf-4c6c-4098-bdd5-ff7e18d0dd58'::uuid, NOW(), NOW()
),
(
    'ffffffff-0001-0003-0000-000000000001'::uuid,
    'Choose the correct preposition: "He is good ___ math."',
    'MultipleChoice', 'Grammar', 'Medium', 10, true, false,
    '8ac6f1bf-4c6c-4098-bdd5-ff7e18d0dd58'::uuid, NOW(), NOW()
),
(
    'ffffffff-0001-0004-0000-000000000001'::uuid,
    'What is the plural of "child"?',
    'MultipleChoice', 'Grammar', 'Easy', 10, true, false,
    '8ac6f1bf-4c6c-4098-bdd5-ff7e18d0dd58'::uuid, NOW(), NOW()
),
(
    'ffffffff-0001-0005-0000-000000000001'::uuid,
    'Which word is an adverb?',
    'MultipleChoice', 'Grammar', 'Medium', 10, true, false,
    '8ac6f1bf-4c6c-4098-bdd5-ff7e18d0dd58'::uuid, NOW(), NOW()
)
ON CONFLICT ("Id") DO NOTHING;

-- Step 3: Link Questions to Quiz via QuizQuestions join table
INSERT INTO tenant_demo."QuizQuestions" ("Id", "QuizId", "QuestionId", "DisplayOrder", "Score", "CreatedAt", "UpdatedAt")
VALUES
('ffffffff-0001-0001-0001-000000000001'::uuid, 'ffffffff-0001-0000-0000-000000000001'::uuid, 'ffffffff-0001-0001-0000-000000000001'::uuid, 1, 10, NOW(), NOW()),
('ffffffff-0001-0002-0001-000000000001'::uuid, 'ffffffff-0001-0000-0000-000000000001'::uuid, 'ffffffff-0001-0002-0000-000000000001'::uuid, 2, 10, NOW(), NOW()),
('ffffffff-0001-0003-0001-000000000001'::uuid, 'ffffffff-0001-0000-0000-000000000001'::uuid, 'ffffffff-0001-0003-0000-000000000001'::uuid, 3, 10, NOW(), NOW()),
('ffffffff-0001-0004-0001-000000000001'::uuid, 'ffffffff-0001-0000-0000-000000000001'::uuid, 'ffffffff-0001-0004-0000-000000000001'::uuid, 4, 10, NOW(), NOW()),
('ffffffff-0001-0005-0001-000000000001'::uuid, 'ffffffff-0001-0000-0000-000000000001'::uuid, 'ffffffff-0001-0005-0000-000000000001'::uuid, 5, 10, NOW(), NOW())
ON CONFLICT ("Id") DO NOTHING;

-- Step 4: Answer options
-- Q1: "went" is correct
INSERT INTO tenant_demo."QuestionOptions" ("Id", "QuestionId", "Content", "IsCorrect", "DisplayOrder", "CreatedAt", "UpdatedAt")
VALUES
('ffffffff-0001-0001-0001-100000000001'::uuid, 'ffffffff-0001-0001-0000-000000000001'::uuid, 'goed',  false, 1, NOW(), NOW()),
('ffffffff-0001-0001-0002-100000000001'::uuid, 'ffffffff-0001-0001-0000-000000000001'::uuid, 'went',  true,  2, NOW(), NOW()),
('ffffffff-0001-0001-0003-100000000001'::uuid, 'ffffffff-0001-0001-0000-000000000001'::uuid, 'gone',  false, 3, NOW(), NOW()),
('ffffffff-0001-0001-0004-100000000001'::uuid, 'ffffffff-0001-0001-0000-000000000001'::uuid, 'going', false, 4, NOW(), NOW())
ON CONFLICT ("Id") DO NOTHING;

-- Q2: "She goes..." is correct
INSERT INTO tenant_demo."QuestionOptions" ("Id", "QuestionId", "Content", "IsCorrect", "DisplayOrder", "CreatedAt", "UpdatedAt")
VALUES
('ffffffff-0001-0002-0001-100000000001'::uuid, 'ffffffff-0001-0002-0000-000000000001'::uuid, 'She go to school every day.',    false, 1, NOW(), NOW()),
('ffffffff-0001-0002-0002-100000000001'::uuid, 'ffffffff-0001-0002-0000-000000000001'::uuid, 'She goes to school every day.',  true,  2, NOW(), NOW()),
('ffffffff-0001-0002-0003-100000000001'::uuid, 'ffffffff-0001-0002-0000-000000000001'::uuid, 'She going to school every day.', false, 3, NOW(), NOW()),
('ffffffff-0001-0002-0004-100000000001'::uuid, 'ffffffff-0001-0002-0000-000000000001'::uuid, 'She gone to school every day.',  false, 4, NOW(), NOW())
ON CONFLICT ("Id") DO NOTHING;

-- Q3: "at" is correct
INSERT INTO tenant_demo."QuestionOptions" ("Id", "QuestionId", "Content", "IsCorrect", "DisplayOrder", "CreatedAt", "UpdatedAt")
VALUES
('ffffffff-0001-0003-0001-100000000001'::uuid, 'ffffffff-0001-0003-0000-000000000001'::uuid, 'in', false, 1, NOW(), NOW()),
('ffffffff-0001-0003-0002-100000000001'::uuid, 'ffffffff-0001-0003-0000-000000000001'::uuid, 'at', true,  2, NOW(), NOW()),
('ffffffff-0001-0003-0003-100000000001'::uuid, 'ffffffff-0001-0003-0000-000000000001'::uuid, 'on', false, 3, NOW(), NOW()),
('ffffffff-0001-0003-0004-100000000001'::uuid, 'ffffffff-0001-0003-0000-000000000001'::uuid, 'of', false, 4, NOW(), NOW())
ON CONFLICT ("Id") DO NOTHING;

-- Q4: "children" is correct
INSERT INTO tenant_demo."QuestionOptions" ("Id", "QuestionId", "Content", "IsCorrect", "DisplayOrder", "CreatedAt", "UpdatedAt")
VALUES
('ffffffff-0001-0004-0001-100000000001'::uuid, 'ffffffff-0001-0004-0000-000000000001'::uuid, 'childs',    false, 1, NOW(), NOW()),
('ffffffff-0001-0004-0002-100000000001'::uuid, 'ffffffff-0001-0004-0000-000000000001'::uuid, 'children',  true,  2, NOW(), NOW()),
('ffffffff-0001-0004-0003-100000000001'::uuid, 'ffffffff-0001-0004-0000-000000000001'::uuid, 'childes',   false, 3, NOW(), NOW()),
('ffffffff-0001-0004-0004-100000000001'::uuid, 'ffffffff-0001-0004-0000-000000000001'::uuid, 'childrens', false, 4, NOW(), NOW())
ON CONFLICT ("Id") DO NOTHING;

-- Q5: "quickly" is correct
INSERT INTO tenant_demo."QuestionOptions" ("Id", "QuestionId", "Content", "IsCorrect", "DisplayOrder", "CreatedAt", "UpdatedAt")
VALUES
('ffffffff-0001-0005-0001-100000000001'::uuid, 'ffffffff-0001-0005-0000-000000000001'::uuid, 'quick',     false, 1, NOW(), NOW()),
('ffffffff-0001-0005-0002-100000000001'::uuid, 'ffffffff-0001-0005-0000-000000000001'::uuid, 'quickness', false, 2, NOW(), NOW()),
('ffffffff-0001-0005-0003-100000000001'::uuid, 'ffffffff-0001-0005-0000-000000000001'::uuid, 'quickly',   true,  3, NOW(), NOW()),
('ffffffff-0001-0005-0004-100000000001'::uuid, 'ffffffff-0001-0005-0000-000000000001'::uuid, 'quicken',   false, 4, NOW(), NOW())
ON CONFLICT ("Id") DO NOTHING;

SELECT 'Seeded: ' || q."Title" || ', questions: ' || COUNT(qq."Id")::text AS result
FROM tenant_demo."Quizzes" q
JOIN tenant_demo."QuizQuestions" qq ON qq."QuizId" = q."Id"
WHERE q."Id" = 'ffffffff-0001-0000-0000-000000000001'::uuid
GROUP BY q."Id", q."Title";
