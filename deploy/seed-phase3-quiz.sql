-- ============================================================
-- Seed: Phase 3 Quiz Engine — 1 Placement Quiz + 30 Questions
-- Schema: tenant_demo
-- Run: psql -h localhost -U postgres -d mls -f seed-phase3-quiz.sql
-- ============================================================
SET search_path = tenant_demo;

DO $$
DECLARE
    quiz_id        UUID := '11111111-1111-1111-1111-000000000001';
    admin_id       UUID;

    -- Question IDs (30 questions)
    q01 UUID := gen_random_uuid(); q02 UUID := gen_random_uuid();
    q03 UUID := gen_random_uuid(); q04 UUID := gen_random_uuid();
    q05 UUID := gen_random_uuid(); q06 UUID := gen_random_uuid();
    q07 UUID := gen_random_uuid(); q08 UUID := gen_random_uuid();
    q09 UUID := gen_random_uuid(); q10 UUID := gen_random_uuid();
    q11 UUID := gen_random_uuid(); q12 UUID := gen_random_uuid();
    q13 UUID := gen_random_uuid(); q14 UUID := gen_random_uuid();
    q15 UUID := gen_random_uuid(); q16 UUID := gen_random_uuid();
    q17 UUID := gen_random_uuid(); q18 UUID := gen_random_uuid();
    q19 UUID := gen_random_uuid(); q20 UUID := gen_random_uuid();
    q21 UUID := gen_random_uuid(); q22 UUID := gen_random_uuid();
    q23 UUID := gen_random_uuid(); q24 UUID := gen_random_uuid();
    q25 UUID := gen_random_uuid(); q26 UUID := gen_random_uuid();
    q27 UUID := gen_random_uuid(); q28 UUID := gen_random_uuid();
    q29 UUID := gen_random_uuid(); q30 UUID := gen_random_uuid();
BEGIN
    -- Get any admin/teacher user
    SELECT "Id" INTO admin_id FROM "Users" LIMIT 1;

    -- ── 1. Placement Quiz ────────────────────────────────────────────────────
    DELETE FROM "Quizzes" WHERE "Id" = quiz_id;
    INSERT INTO "Quizzes" (
        "Id", "Title", "Description", "QuizType", "SkillType", "Status",
        "Level", "Duration", "TotalScore", "PassingScore",
        "AllowRetry", "RetryLimit", "RandomQuestion", "RandomAnswer",
        "ShowCorrectAnswer", "ShowExplanation", "CreatedBy", "CreatedAt"
    ) VALUES (
        quiz_id,
        'English Placement Test',
        'Comprehensive English placement test to determine your level (1–6). Covers Grammar, Vocabulary, Reading, Listening and Writing.',
        'PlacementTest', 'Mixed', 'Published',
        1, 1800, 30.0, 15.0,
        true, 2, true, true,
        true, true, admin_id, NOW()
    );

    -- ── 2. Questions ─────────────────────────────────────────────────────────

    -- === GRAMMAR (10 questions) ===

    -- G1: Simple Present
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q01, 'She ___ to school every day.', 'SingleChoice', 'Grammar', 'Easy', 1, 'Third person singular uses "goes".', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q01, 'go',    false, 1, NOW()),
        (gen_random_uuid(), q01, 'goes',  true,  2, NOW()),
        (gen_random_uuid(), q01, 'going', false, 3, NOW()),
        (gen_random_uuid(), q01, 'gone',  false, 4, NOW());

    -- G2: Past Simple vs Past Continuous
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q02, 'While I ___ TV, my phone rang.', 'SingleChoice', 'Grammar', 'Medium', 1, 'Past continuous for background action: "was watching".', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q02, 'watched',      false, 1, NOW()),
        (gen_random_uuid(), q02, 'was watching', true,  2, NOW()),
        (gen_random_uuid(), q02, 'am watching',  false, 3, NOW()),
        (gen_random_uuid(), q02, 'have watched', false, 4, NOW());

    -- G3: Present Perfect
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q03, 'I ___ never ___ sushi before.', 'FillBlank', 'Grammar', 'Medium', 1, 'Present perfect with "never": "have never eaten".', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q03, 'have never eaten', true, 1, NOW());

    -- G4: Conditional Type 2
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q04, 'If I ___ rich, I would travel the world.', 'SingleChoice', 'Grammar', 'Hard', 1, 'Type 2 conditional uses past tense in the if-clause: "were".', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q04, 'am',    false, 1, NOW()),
        (gen_random_uuid(), q04, 'was',   false, 2, NOW()),
        (gen_random_uuid(), q04, 'were',  true,  3, NOW()),
        (gen_random_uuid(), q04, 'would be', false, 4, NOW());

    -- G5: Passive Voice
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q05, 'The letter ___ yesterday.', 'SingleChoice', 'Grammar', 'Medium', 1, 'Passive voice past: "was sent".', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q05, 'sent',      false, 1, NOW()),
        (gen_random_uuid(), q05, 'was sent',  true,  2, NOW()),
        (gen_random_uuid(), q05, 'is sent',   false, 3, NOW()),
        (gen_random_uuid(), q05, 'has sent',  false, 4, NOW());

    -- G6: Articles
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q06, 'She is ___ engineer.', 'SingleChoice', 'Grammar', 'Easy', 1, '"an" before vowel sounds: "an engineer".', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q06, 'a',   false, 1, NOW()),
        (gen_random_uuid(), q06, 'an',  true,  2, NOW()),
        (gen_random_uuid(), q06, 'the', false, 3, NOW()),
        (gen_random_uuid(), q06, '—',   false, 4, NOW());

    -- G7: Reported Speech
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q07, 'He said he ___ tired.', 'SingleChoice', 'Grammar', 'Hard', 1, 'Backshift: "was" (not "is") in reported speech.', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q07, 'is',   false, 1, NOW()),
        (gen_random_uuid(), q07, 'was',  true,  2, NOW()),
        (gen_random_uuid(), q07, 'were', false, 3, NOW()),
        (gen_random_uuid(), q07, 'has been', false, 4, NOW());

    -- G8: TrueFalse — Modal
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q08, '"Must" can express obligation and necessity. (True / False)', 'TrueFalse', 'Grammar', 'Easy', 1, '"Must" expresses strong obligation or necessity — TRUE.', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q08, 'True',  true,  1, NOW()),
        (gen_random_uuid(), q08, 'False', false, 2, NOW());

    -- G9: Comparatives
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q09, 'This exam is ___ difficult than the last one.', 'SingleChoice', 'Grammar', 'Easy', 1, 'Comparative adjective: "more difficult".', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q09, 'difficulter',     false, 1, NOW()),
        (gen_random_uuid(), q09, 'more difficult',  true,  2, NOW()),
        (gen_random_uuid(), q09, 'most difficult',  false, 3, NOW()),
        (gen_random_uuid(), q09, 'as difficult',    false, 4, NOW());

    -- G10: Choose multiple correct prepositions
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q10, 'Which sentences are grammatically correct? (Select all that apply)', 'MultipleChoice', 'Grammar', 'Hard', 1, '"Interested in" and "good at" are correct collocations.', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q10, 'She is interested in music.',     true,  1, NOW()),
        (gen_random_uuid(), q10, 'He is good at maths.',            true,  2, NOW()),
        (gen_random_uuid(), q10, 'They are angry of him.',          false, 3, NOW()),
        (gen_random_uuid(), q10, 'We are bored of waiting.',        false, 4, NOW());

    -- === VOCABULARY (10 questions) ===

    -- V1
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q11, 'What is the synonym of "happy"?', 'SingleChoice', 'Vocabulary', 'Easy', 1, '"Joyful" is a synonym of "happy".', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q11, 'sad',     false, 1, NOW()),
        (gen_random_uuid(), q11, 'angry',   false, 2, NOW()),
        (gen_random_uuid(), q11, 'joyful',  true,  3, NOW()),
        (gen_random_uuid(), q11, 'tired',   false, 4, NOW());

    -- V2
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q12, 'The antonym of "ancient" is ___', 'FillBlank', 'Vocabulary', 'Medium', 1, 'The antonym of "ancient" is "modern" or "contemporary".', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q12, 'modern', true, 1, NOW());

    -- V3
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q13, 'Which word means "to make something larger"?', 'SingleChoice', 'Vocabulary', 'Medium', 1, '"Expand" means to make something larger.', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q13, 'reduce',  false, 1, NOW()),
        (gen_random_uuid(), q13, 'expand',  true,  2, NOW()),
        (gen_random_uuid(), q13, 'shrink',  false, 3, NOW()),
        (gen_random_uuid(), q13, 'divide',  false, 4, NOW());

    -- V4
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q14, 'Choose the words that describe positive emotions. (Select all that apply)', 'MultipleChoice', 'Vocabulary', 'Easy', 1, '"Elated" and "content" describe positive emotions.', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q14, 'Elated',     true,  1, NOW()),
        (gen_random_uuid(), q14, 'Content',    true,  2, NOW()),
        (gen_random_uuid(), q14, 'Anxious',    false, 3, NOW()),
        (gen_random_uuid(), q14, 'Melancholy', false, 4, NOW());

    -- V5
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q15, '"Benevolent" means kind and generous. (True / False)', 'TrueFalse', 'Vocabulary', 'Medium', 1, '"Benevolent" means well-meaning and kindly — TRUE.', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q15, 'True',  true,  1, NOW()),
        (gen_random_uuid(), q15, 'False', false, 2, NOW());

    -- V6
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q16, 'A "physician" is a type of ___', 'SingleChoice', 'Vocabulary', 'Easy', 1, 'A physician is a doctor.', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q16, 'teacher', false, 1, NOW()),
        (gen_random_uuid(), q16, 'doctor',  true,  2, NOW()),
        (gen_random_uuid(), q16, 'lawyer',  false, 3, NOW()),
        (gen_random_uuid(), q16, 'pilot',   false, 4, NOW());

    -- V7
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q17, 'The word "verbose" means using too many ___.', 'FillBlank', 'Vocabulary', 'Hard', 1, '"Verbose" means using more words than needed — answer: "words".', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q17, 'words', true, 1, NOW());

    -- V8
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q18, 'Which of these are academic collocations? (Select all)', 'MultipleChoice', 'Vocabulary', 'Hard', 1, '"Conduct research" and "draw a conclusion" are standard academic collocations.', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q18, 'Conduct research',    true,  1, NOW()),
        (gen_random_uuid(), q18, 'Draw a conclusion',   true,  2, NOW()),
        (gen_random_uuid(), q18, 'Make a research',     false, 3, NOW()),
        (gen_random_uuid(), q18, 'Do a conclusion',     false, 4, NOW());

    -- V9
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q19, '"Ambiguous" means having only one possible meaning. (True / False)', 'TrueFalse', 'Vocabulary', 'Medium', 1, '"Ambiguous" means having multiple interpretations — FALSE.', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q19, 'True',  false, 1, NOW()),
        (gen_random_uuid(), q19, 'False', true,  2, NOW());

    -- V10
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q20, 'The prefix "mis-" in "misunderstand" means ___', 'SingleChoice', 'Vocabulary', 'Medium', 1, '"Mis-" means wrongly or badly.', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q20, 'again',   false, 1, NOW()),
        (gen_random_uuid(), q20, 'wrongly', true,  2, NOW()),
        (gen_random_uuid(), q20, 'before',  false, 3, NOW()),
        (gen_random_uuid(), q20, 'not',     false, 4, NOW());

    -- === READING (5 questions) ===

    -- R1
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q21,
        'Read: "The Amazon rainforest produces 20% of the world''s oxygen and is home to 10% of all species." — What is the main idea?',
        'SingleChoice', 'Reading', 'Medium', 1,
        'The main idea is the importance of the Amazon rainforest to global biodiversity and oxygen supply.',
        true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q21, 'The Amazon is a dangerous place.',                      false, 1, NOW()),
        (gen_random_uuid(), q21, 'The Amazon plays a vital ecological role.',             true,  2, NOW()),
        (gen_random_uuid(), q21, 'Most species live outside the Amazon.',                 false, 3, NOW()),
        (gen_random_uuid(), q21, 'Oxygen is only produced in rainforests.',               false, 4, NOW());

    -- R2
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q22,
        'Read: "Despite the rain, the farmers were pleased because they had been hoping for precipitation for weeks." — Why were the farmers pleased?',
        'SingleChoice', 'Reading', 'Medium', 1,
        'They were happy because the long-awaited rain finally arrived.',
        true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q22, 'They enjoy bad weather.',                               false, 1, NOW()),
        (gen_random_uuid(), q22, 'The rain they needed finally came.',                    true,  2, NOW()),
        (gen_random_uuid(), q22, 'They harvested all the crops.',                         false, 3, NOW()),
        (gen_random_uuid(), q22, 'Rain came too late for the crops.',                     false, 4, NOW());

    -- R3: True/False inference
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q23,
        'Read: "All smartphones require an internet connection to function." — Is this statement true or false?',
        'TrueFalse', 'Reading', 'Easy', 1,
        'Many smartphone functions work offline — FALSE.',
        true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q23, 'True',  false, 1, NOW()),
        (gen_random_uuid(), q23, 'False', true,  2, NOW());

    -- R4
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q24,
        'Read the sentence: "The scientist''s findings were met with skepticism." — What does "skepticism" most likely mean here?',
        'SingleChoice', 'Reading', 'Hard', 1, '"Skepticism" means doubt or disbelief.', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q24, 'enthusiasm', false, 1, NOW()),
        (gen_random_uuid(), q24, 'doubt',      true,  2, NOW()),
        (gen_random_uuid(), q24, 'praise',     false, 3, NOW()),
        (gen_random_uuid(), q24, 'anger',      false, 4, NOW());

    -- R5: FillBlank summary
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q25,
        'Read: "Climate change affects not just temperature but also rainfall patterns, sea levels, and biodiversity." The passage says climate change affects ___ main areas.',
        'FillBlank', 'Reading', 'Medium', 1, 'The passage lists 3 areas besides temperature: rainfall, sea levels, biodiversity — but counting temperature: 4 total. Expected answer: "four" or "4".', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q25, 'four', true, 1, NOW());

    -- === LISTENING (5 questions — text-based simulation) ===

    -- L1
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q26,
        '[Audio transcript] "Good morning! I''d like to book a table for two at 7 PM on Friday." — What does the caller want?',
        'SingleChoice', 'Listening', 'Easy', 1, 'The caller wants to reserve a table for two people.', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q26, 'To cancel a reservation.',         false, 1, NOW()),
        (gen_random_uuid(), q26, 'To book a table for two people.',  true,  2, NOW()),
        (gen_random_uuid(), q26, 'To order food for delivery.',      false, 3, NOW()),
        (gen_random_uuid(), q26, 'To complain about service.',       false, 4, NOW());

    -- L2
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q27,
        '[Audio] "The train to London departs at 14:45 from platform 3. Please ensure you have your ticket ready." — What time does the train depart?',
        'FillBlank', 'Listening', 'Easy', 1, 'The train departs at 14:45.', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q27, '14:45', true, 1, NOW());

    -- L3
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q28,
        '[Audio] The speaker says the meeting has been moved to Wednesday at 3 PM. — The meeting was originally on Monday. (True / False)',
        'TrueFalse', 'Listening', 'Medium', 1, 'The audio does not mention the original day, so we cannot confirm it was Monday — the statement is FALSE (or cannot be determined).', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q28, 'True',  false, 1, NOW()),
        (gen_random_uuid(), q28, 'False', true,  2, NOW());

    -- L4
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q29,
        '[Audio] A news report says: "Temperatures will reach a high of 35°C on Saturday, with light winds and clear skies." — Select all correct statements.',
        'MultipleChoice', 'Listening', 'Medium', 1, 'Temperature: 35°C and clear skies on Saturday are both confirmed.', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q29, 'Saturday will be sunny.',          true,  1, NOW()),
        (gen_random_uuid(), q29, 'Temperature will reach 35°C.',     true,  2, NOW()),
        (gen_random_uuid(), q29, 'Strong winds are expected.',        false, 3, NOW()),
        (gen_random_uuid(), q29, 'Rain is forecast for Saturday.',    false, 4, NOW());

    -- L5
    INSERT INTO "Questions" ("Id","Content","Type","SkillType","Difficulty","DefaultScore","Explanation","IsPublic","CreatedBy","CreatedAt")
    VALUES (q30,
        '[Audio] A professor says: "For the assignment, you need to write 500 words minimum and submit it by the end of next week." — What is the minimum word count?',
        'SingleChoice', 'Listening', 'Easy', 1, 'The professor says 500 words minimum.', true, admin_id, NOW());
    INSERT INTO "QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder","CreatedAt") VALUES
        (gen_random_uuid(), q30, '300',  false, 1, NOW()),
        (gen_random_uuid(), q30, '500',  true,  2, NOW()),
        (gen_random_uuid(), q30, '800',  false, 3, NOW()),
        (gen_random_uuid(), q30, '1000', false, 4, NOW());

    -- ── 3. Link Questions to Quiz ────────────────────────────────────────────
    INSERT INTO "QuizQuestions" ("Id","QuizId","QuestionId","DisplayOrder","Score","CreatedAt")
    VALUES
        (gen_random_uuid(), quiz_id, q01,  1,  1, NOW()),
        (gen_random_uuid(), quiz_id, q02,  2,  1, NOW()),
        (gen_random_uuid(), quiz_id, q03,  3,  1, NOW()),
        (gen_random_uuid(), quiz_id, q04,  4,  1, NOW()),
        (gen_random_uuid(), quiz_id, q05,  5,  1, NOW()),
        (gen_random_uuid(), quiz_id, q06,  6,  1, NOW()),
        (gen_random_uuid(), quiz_id, q07,  7,  1, NOW()),
        (gen_random_uuid(), quiz_id, q08,  8,  1, NOW()),
        (gen_random_uuid(), quiz_id, q09,  9,  1, NOW()),
        (gen_random_uuid(), quiz_id, q10, 10,  1, NOW()),
        (gen_random_uuid(), quiz_id, q11, 11,  1, NOW()),
        (gen_random_uuid(), quiz_id, q12, 12,  1, NOW()),
        (gen_random_uuid(), quiz_id, q13, 13,  1, NOW()),
        (gen_random_uuid(), quiz_id, q14, 14,  1, NOW()),
        (gen_random_uuid(), quiz_id, q15, 15,  1, NOW()),
        (gen_random_uuid(), quiz_id, q16, 16,  1, NOW()),
        (gen_random_uuid(), quiz_id, q17, 17,  1, NOW()),
        (gen_random_uuid(), quiz_id, q18, 18,  1, NOW()),
        (gen_random_uuid(), quiz_id, q19, 19,  1, NOW()),
        (gen_random_uuid(), quiz_id, q20, 20,  1, NOW()),
        (gen_random_uuid(), quiz_id, q21, 21,  1, NOW()),
        (gen_random_uuid(), quiz_id, q22, 22,  1, NOW()),
        (gen_random_uuid(), quiz_id, q23, 23,  1, NOW()),
        (gen_random_uuid(), quiz_id, q24, 24,  1, NOW()),
        (gen_random_uuid(), quiz_id, q25, 25,  1, NOW()),
        (gen_random_uuid(), quiz_id, q26, 26,  1, NOW()),
        (gen_random_uuid(), quiz_id, q27, 27,  1, NOW()),
        (gen_random_uuid(), quiz_id, q28, 28,  1, NOW()),
        (gen_random_uuid(), quiz_id, q29, 29,  1, NOW()),
        (gen_random_uuid(), quiz_id, q30, 30,  1, NOW());

    RAISE NOTICE 'Placement Quiz + 30 Questions seeded successfully.';
END $$;
