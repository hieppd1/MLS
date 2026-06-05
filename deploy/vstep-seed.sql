-- =============================================================================
-- VSTEP Mock Test Seed Data
-- Platform: English proficiency test for Vietnamese learners (VSTEP standard)
-- Schema: tenant_demo
-- Run: psql -h localhost -U postgres -d mls -f deploy/vstep-seed.sql
-- =============================================================================

\echo '=== VSTEP Seed: Starting ==='

-- Idempotent cleanup (remove existing VSTEP seed data)
DELETE FROM tenant_demo."PassageGroups"
  WHERE "QuizId" IN (SELECT "Id" FROM tenant_demo."Quizzes" WHERE "ExamMode" = 'VSTEP');
DELETE FROM tenant_demo."QuizQuestions"
  WHERE "QuizId" IN (SELECT "Id" FROM tenant_demo."Quizzes" WHERE "ExamMode" = 'VSTEP');
DELETE FROM tenant_demo."QuestionOptions" WHERE "QuestionId" IN (
  SELECT "Id" FROM tenant_demo."Questions" WHERE "SkillType" IN ('Listening','Reading','Writing','Speaking') AND "CreatedBy" IN (
    SELECT "Id" FROM tenant_demo."Users" LIMIT 50
  )
);
-- Only delete VSTEP-seeded questions (WritingTask / SpeakingRecording type or those linked to VSTEP quizzes)
DELETE FROM tenant_demo."Questions" WHERE "Id" IN (
  SELECT "QuestionId" FROM tenant_demo."QuizQuestions"
  WHERE "QuizId" IN (SELECT "Id" FROM tenant_demo."Quizzes" WHERE "ExamMode" = 'VSTEP')
);
DELETE FROM tenant_demo."Quizzes" WHERE "ExamMode" = 'VSTEP';

DO $$
DECLARE
  v_teacher_id   uuid;
  v_quiz_id      uuid := gen_random_uuid();
  -- Listening quiz (part 1 of the MockTest)
  v_listen_id    uuid := gen_random_uuid();
  -- Reading quiz  (part 2)
  v_read_id      uuid := gen_random_uuid();
  -- Writing quiz  (part 3)
  v_write_id     uuid := gen_random_uuid();
  -- Speaking quiz (part 4)
  v_speak_id     uuid := gen_random_uuid();

  -- Listening questions (10 sample)
  lq1 uuid := gen_random_uuid(); lq2 uuid := gen_random_uuid();
  lq3 uuid := gen_random_uuid(); lq4 uuid := gen_random_uuid();
  lq5 uuid := gen_random_uuid(); lq6 uuid := gen_random_uuid();
  lq7 uuid := gen_random_uuid(); lq8 uuid := gen_random_uuid();
  lq9 uuid := gen_random_uuid(); lq10 uuid := gen_random_uuid();

  -- Reading questions (10 sample)
  rq1 uuid := gen_random_uuid(); rq2 uuid := gen_random_uuid();
  rq3 uuid := gen_random_uuid(); rq4 uuid := gen_random_uuid();
  rq5 uuid := gen_random_uuid(); rq6 uuid := gen_random_uuid();
  rq7 uuid := gen_random_uuid(); rq8 uuid := gen_random_uuid();
  rq9 uuid := gen_random_uuid(); rq10 uuid := gen_random_uuid();

  -- Writing questions (2 tasks)
  wq1 uuid := gen_random_uuid(); wq2 uuid := gen_random_uuid();

  -- Speaking questions (3 parts)
  sq1 uuid := gen_random_uuid(); sq2 uuid := gen_random_uuid();
  sq3 uuid := gen_random_uuid();

  -- PassageGroups
  pg1 uuid := gen_random_uuid(); pg2 uuid := gen_random_uuid();
  pg3 uuid := gen_random_uuid(); pg4 uuid := gen_random_uuid();
  pg5 uuid := gen_random_uuid();

  v_link uuid;
BEGIN

  -- ── Resolve teacher ────────────────────────────────────────────────────────
  SELECT u."Id" INTO v_teacher_id
  FROM tenant_demo."Users" u
  JOIN tenant_demo."UserRoles" ur ON ur."UserId" = u."Id"
  JOIN tenant_demo."Roles" r ON r."Id" = ur."RoleId"
  WHERE r."Name" IN ('Teacher','Admin')
  ORDER BY u."CreatedAt"
  LIMIT 1;

  IF v_teacher_id IS NULL THEN
    -- fallback: first user in table
    SELECT "Id" INTO v_teacher_id FROM tenant_demo."Users" ORDER BY "CreatedAt" LIMIT 1;
  END IF;

  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'No user found in tenant_demo.Users';
  END IF;

  RAISE NOTICE 'Using teacher: %', v_teacher_id;

  -- ==========================================================================
  -- 1. MAIN VSTEP MOCK TEST QUIZ
  -- ==========================================================================
  INSERT INTO tenant_demo."Quizzes" (
    "Id","Title","Description","QuizType","ExamMode",
    "Status","Duration","PassingScore","RandomQuestion","ShowCorrectAnswer",
    "CreatedAt","UpdatedAt","CreatedBy"
  ) VALUES (
    v_quiz_id,
    'VSTEP Mock Test — Đề thi thử tiếng Anh chuẩn VSTEP',
    'Bài thi thử theo chuẩn VSTEP gồm 4 phần: Nghe (35 câu, 40 phút), Đọc (40 câu, 60 phút), Viết (2 tasks, 60 phút), Nói (3 phần, 12 phút). Thang điểm 0–10 mỗi kỹ năng. Xếp band A2/B1/B2/C1.',
    'VSTEPMockTest','VSTEP',
    'Published', 10320, 4.0, FALSE, FALSE,
    now(), now(), v_teacher_id
  );

  -- ==========================================================================
  -- 2. SUB-QUIZZES (one per skill part)
  -- ==========================================================================
  INSERT INTO tenant_demo."Quizzes" (
    "Id","Title","Description","QuizType","ExamMode",
    "Status","Duration","PassingScore","RandomQuestion","ShowCorrectAnswer",
    "CreatedAt","UpdatedAt","CreatedBy"
  ) VALUES
  (v_listen_id,
   'VSTEP Listening — Nghe hiểu (35 câu)',
   'Phần nghe: 35 câu hỏi trắc nghiệm, nghe băng 1 lần, thời gian 40 phút.',
   'VSTEPListening','VSTEP','Published',2400,4.0,FALSE,FALSE,now(),now(),v_teacher_id),
  (v_read_id,
   'VSTEP Reading — Đọc hiểu (40 câu)',
   'Phần đọc: 40 câu hỏi trắc nghiệm, đọc 4 đoạn văn, thời gian 60 phút.',
   'VSTEPReading','VSTEP','Published',3600,4.0,FALSE,FALSE,now(),now(),v_teacher_id),
  (v_write_id,
   'VSTEP Writing — Viết (2 tasks)',
   'Task 1: Viết thư/email ≥120 từ. Task 2: Viết luận ≥250 từ. Thời gian 60 phút.',
   'VSTEPWriting','VSTEP','Published',3600,4.0,FALSE,FALSE,now(),now(),v_teacher_id),
  (v_speak_id,
   'VSTEP Speaking — Nói (3 phần)',
   'Phần nói: 3 phần, tổng 12 phút. Phần 1: Trả lời câu hỏi cá nhân. Phần 2: Mô tả hình. Phần 3: Thảo luận chủ đề.',
   'VSTEPSpeaking','VSTEP','Published',720,4.0,FALSE,FALSE,now(),now(),v_teacher_id);

  -- ==========================================================================
  -- 3. LISTENING QUESTIONS (10 MCQ — skill: Listening)
  -- ==========================================================================
  INSERT INTO tenant_demo."Questions" (
    "Id","Content","Type","SkillType","Difficulty","DefaultScore","AudioUrl","AudioPlayLimit",
    "CreatedAt","UpdatedAt","CreatedBy"
  ) VALUES
  (lq1,
   'You will hear a conversation between two colleagues. What does the man suggest they do first?',
   'SingleChoice','Listening','Easy',1.0,
   'https://cdn.example.com/vstep/audio/listening_part1_01.mp3',2,
   now(),now(),v_teacher_id),
  (lq2,
   'Listen to the announcement. What time does the meeting start?',
   'SingleChoice','Listening','Easy',1.0,
   'https://cdn.example.com/vstep/audio/listening_part1_02.mp3',2,
   now(),now(),v_teacher_id),
  (lq3,
   'You will hear a short talk about climate change. What is the main purpose of the talk?',
   'SingleChoice','Listening','Medium',1.0,
   'https://cdn.example.com/vstep/audio/listening_part2_01.mp3',2,
   now(),now(),v_teacher_id),
  (lq4,
   'According to the speaker, which factor most significantly contributes to urban pollution?',
   'SingleChoice','Listening','Medium',1.0,
   'https://cdn.example.com/vstep/audio/listening_part2_02.mp3',2,
   now(),now(),v_teacher_id),
  (lq5,
   'What does the woman mean when she says "the ball is in your court"?',
   'SingleChoice','Listening','Medium',1.0,
   'https://cdn.example.com/vstep/audio/listening_part2_03.mp3',2,
   now(),now(),v_teacher_id),
  (lq6,
   'Listen to the lecture. Which of the following best summarizes the professor''s argument?',
   'SingleChoice','Listening','Hard',1.0,
   'https://cdn.example.com/vstep/audio/listening_part3_01.mp3',1,
   now(),now(),v_teacher_id),
  (lq7,
   'The speaker implies that the new policy will most likely lead to which outcome?',
   'SingleChoice','Listening','Hard',1.0,
   'https://cdn.example.com/vstep/audio/listening_part3_02.mp3',1,
   now(),now(),v_teacher_id),
  (lq8,
   'What is the tone of the speaker in the last part of the interview?',
   'SingleChoice','Listening','Hard',1.0,
   'https://cdn.example.com/vstep/audio/listening_part3_03.mp3',1,
   now(),now(),v_teacher_id),
  (lq9,
   'You will hear a discussion about technology in education. What is the main concern expressed?',
   'SingleChoice','Listening','Medium',1.0,
   'https://cdn.example.com/vstep/audio/listening_part2_04.mp3',2,
   now(),now(),v_teacher_id),
  (lq10,
   'Based on the dialogue, what will the speakers most likely do next?',
   'SingleChoice','Listening','Easy',1.0,
   'https://cdn.example.com/vstep/audio/listening_part1_03.mp3',2,
   now(),now(),v_teacher_id);

  -- Listening question options (4 per question)
  INSERT INTO tenant_demo."QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder") VALUES
  -- lq1
  (gen_random_uuid(),lq1,'Review the project proposal together',    TRUE,  1),
  (gen_random_uuid(),lq1,'Send an email to the client',             FALSE, 2),
  (gen_random_uuid(),lq1,'Schedule a meeting for next week',        FALSE, 3),
  (gen_random_uuid(),lq1,'Submit the report to the manager',        FALSE, 4),
  -- lq2
  (gen_random_uuid(),lq2,'9:00 AM',  FALSE, 1),
  (gen_random_uuid(),lq2,'10:30 AM', TRUE,  2),
  (gen_random_uuid(),lq2,'2:00 PM',  FALSE, 3),
  (gen_random_uuid(),lq2,'3:30 PM',  FALSE, 4),
  -- lq3
  (gen_random_uuid(),lq3,'To warn about the dangers of deforestation',TRUE, 1),
  (gen_random_uuid(),lq3,'To explain the science of global warming',  FALSE,2),
  (gen_random_uuid(),lq3,'To promote renewable energy solutions',     FALSE,3),
  (gen_random_uuid(),lq3,'To criticize government environmental policy',FALSE,4),
  -- lq4
  (gen_random_uuid(),lq4,'Industrial emissions',      TRUE,  1),
  (gen_random_uuid(),lq4,'Population growth',         FALSE, 2),
  (gen_random_uuid(),lq4,'Agricultural waste',        FALSE, 3),
  (gen_random_uuid(),lq4,'Traffic noise',             FALSE, 4),
  -- lq5
  (gen_random_uuid(),lq5,'It is now your responsibility to decide', TRUE,  1),
  (gen_random_uuid(),lq5,'You should play a sport',                  FALSE, 2),
  (gen_random_uuid(),lq5,'The matter is very serious',               FALSE, 3),
  (gen_random_uuid(),lq5,'You need to go to court',                  FALSE, 4),
  -- lq6
  (gen_random_uuid(),lq6,'Technology enhances critical thinking in students',   FALSE,1),
  (gen_random_uuid(),lq6,'Excessive screen time negatively affects learning',   TRUE, 2),
  (gen_random_uuid(),lq6,'Online education is superior to classroom learning',  FALSE,3),
  (gen_random_uuid(),lq6,'Students prefer digital textbooks over paper',        FALSE,4),
  -- lq7
  (gen_random_uuid(),lq7,'Increased unemployment among young workers',    TRUE,  1),
  (gen_random_uuid(),lq7,'Higher economic growth in rural areas',         FALSE, 2),
  (gen_random_uuid(),lq7,'Reduction in government spending on education', FALSE, 3),
  (gen_random_uuid(),lq7,'Improved healthcare services nationwide',       FALSE, 4),
  -- lq8
  (gen_random_uuid(),lq8,'Confident and optimistic', FALSE,1),
  (gen_random_uuid(),lq8,'Frustrated and dismissive',FALSE,2),
  (gen_random_uuid(),lq8,'Cautious and uncertain',   TRUE, 3),
  (gen_random_uuid(),lq8,'Excited and enthusiastic', FALSE,4),
  -- lq9
  (gen_random_uuid(),lq9,'Students becoming overly dependent on devices',    TRUE,  1),
  (gen_random_uuid(),lq9,'High cost of educational technology',              FALSE, 2),
  (gen_random_uuid(),lq9,'Lack of qualified technology teachers',            FALSE, 3),
  (gen_random_uuid(),lq9,'Slow internet connectivity in schools',            FALSE, 4),
  -- lq10
  (gen_random_uuid(),lq10,'Contact the hotel and change the reservation',  TRUE,  1),
  (gen_random_uuid(),lq10,'Cancel the entire trip',                         FALSE, 2),
  (gen_random_uuid(),lq10,'Ask their manager for advice',                   FALSE, 3),
  (gen_random_uuid(),lq10,'Book a different airline',                       FALSE, 4);

  -- ==========================================================================
  -- 4. READING QUESTIONS (10 MCQ — skill: Reading)
  -- ==========================================================================
  INSERT INTO tenant_demo."Questions" (
    "Id","Content","Type","SkillType","Difficulty","DefaultScore",
    "CreatedAt","UpdatedAt","CreatedBy"
  ) VALUES
  (rq1,'According to the passage, what is the primary reason for the decline in bee populations?',
   'SingleChoice','Reading','Medium',1.0,now(),now(),v_teacher_id),
  (rq2,'The word "proliferation" in paragraph 2 is closest in meaning to:',
   'SingleChoice','Reading','Medium',1.0,now(),now(),v_teacher_id),
  (rq3,'Which of the following can be inferred from the passage?',
   'SingleChoice','Reading','Hard',1.0,now(),now(),v_teacher_id),
  (rq4,'What does the author suggest as a solution to urban food insecurity?',
   'SingleChoice','Reading','Medium',1.0,now(),now(),v_teacher_id),
  (rq5,'Based on the passage, which statement about renewable energy is TRUE?',
   'SingleChoice','Reading','Medium',1.0,now(),now(),v_teacher_id),
  (rq6,'The passage is primarily concerned with:',
   'SingleChoice','Reading','Easy',1.0,now(),now(),v_teacher_id),
  (rq7,'In paragraph 3, the author''s tone can best be described as:',
   'SingleChoice','Reading','Hard',1.0,now(),now(),v_teacher_id),
  (rq8,'According to the passage, digital literacy programs are most effective when:',
   'SingleChoice','Reading','Hard',1.0,now(),now(),v_teacher_id),
  (rq9,'Which of the following titles would be MOST appropriate for this passage?',
   'SingleChoice','Reading','Medium',1.0,now(),now(),v_teacher_id),
  (rq10,'The passage implies that cultural exchange programs contribute to:',
   'SingleChoice','Reading','Easy',1.0,now(),now(),v_teacher_id);

  -- Reading options
  INSERT INTO tenant_demo."QuestionOptions" ("Id","QuestionId","Content","IsCorrect","DisplayOrder") VALUES
  -- rq1
  (gen_random_uuid(),rq1,'Widespread use of pesticides in agriculture',       TRUE,  1),
  (gen_random_uuid(),rq1,'Climate change and rising temperatures',            FALSE, 2),
  (gen_random_uuid(),rq1,'Reduction in flowering plant diversity',            FALSE, 3),
  (gen_random_uuid(),rq1,'Competition from invasive insect species',          FALSE, 4),
  -- rq2
  (gen_random_uuid(),rq2,'Rapid growth or spread',   TRUE,  1),
  (gen_random_uuid(),rq2,'Gradual disappearance',    FALSE, 2),
  (gen_random_uuid(),rq2,'Strict regulation',        FALSE, 3),
  (gen_random_uuid(),rq2,'Scientific measurement',   FALSE, 4),
  -- rq3
  (gen_random_uuid(),rq3,'Governments have failed to address environmental issues adequately',TRUE, 1),
  (gen_random_uuid(),rq3,'Scientists disagree about the causes of climate change',          FALSE,2),
  (gen_random_uuid(),rq3,'Economic growth always leads to environmental degradation',       FALSE,3),
  (gen_random_uuid(),rq3,'Individuals have little power to influence environmental policy', FALSE,4),
  -- rq4
  (gen_random_uuid(),rq4,'Expanding community gardens in residential areas',   TRUE,  1),
  (gen_random_uuid(),rq4,'Increasing imports of affordable food products',     FALSE, 2),
  (gen_random_uuid(),rq4,'Building larger supermarkets in city centers',       FALSE, 3),
  (gen_random_uuid(),rq4,'Providing food vouchers to low-income families',     FALSE, 4),
  -- rq5
  (gen_random_uuid(),rq5,'Solar energy is the fastest-growing energy sector globally',   TRUE,  1),
  (gen_random_uuid(),rq5,'Wind energy produces more electricity than solar energy',       FALSE, 2),
  (gen_random_uuid(),rq5,'Renewable energy is more expensive than fossil fuels',          FALSE, 3),
  (gen_random_uuid(),rq5,'Most countries rely entirely on renewable energy sources',      FALSE, 4),
  -- rq6
  (gen_random_uuid(),rq6,'The economic benefits of globalization',     FALSE,1),
  (gen_random_uuid(),rq6,'The impact of technology on modern education',TRUE, 2),
  (gen_random_uuid(),rq6,'Environmental challenges in developing nations',FALSE,3),
  (gen_random_uuid(),rq6,'The history of international trade agreements', FALSE,4),
  -- rq7
  (gen_random_uuid(),rq7,'Critical yet constructive', TRUE,  1),
  (gen_random_uuid(),rq7,'Neutral and objective',     FALSE, 2),
  (gen_random_uuid(),rq7,'Enthusiastic and celebratory',FALSE,3),
  (gen_random_uuid(),rq7,'Dismissive and negative',   FALSE, 4),
  -- rq8
  (gen_random_uuid(),rq8,'Integrated into existing school curricula',         TRUE,  1),
  (gen_random_uuid(),rq8,'Taught as a standalone extracurricular activity',   FALSE, 2),
  (gen_random_uuid(),rq8,'Focused exclusively on social media skills',        FALSE, 3),
  (gen_random_uuid(),rq8,'Delivered only through online platforms',           FALSE, 4),
  -- rq9
  (gen_random_uuid(),rq9,'"Bridging the Digital Divide in Modern Education"', TRUE,  1),
  (gen_random_uuid(),rq9,'"The Rise of Artificial Intelligence"',             FALSE, 2),
  (gen_random_uuid(),rq9,'"Economic Impacts of Internet Connectivity"',       FALSE, 3),
  (gen_random_uuid(),rq9,'"Social Media and Youth Mental Health"',            FALSE, 4),
  -- rq10
  (gen_random_uuid(),rq10,'Greater mutual understanding between nations',    TRUE,  1),
  (gen_random_uuid(),rq10,'Increased economic inequality between cultures',  FALSE, 2),
  (gen_random_uuid(),rq10,'Loss of national identity and traditions',        FALSE, 3),
  (gen_random_uuid(),rq10,'Political conflict between participating nations',FALSE, 4);

  -- ==========================================================================
  -- 5. WRITING QUESTIONS (2 tasks)
  -- ==========================================================================
  INSERT INTO tenant_demo."Questions" (
    "Id","Content","Type","SkillType","Difficulty","DefaultScore",
    "CreatedAt","UpdatedAt","CreatedBy"
  ) VALUES
  (wq1,
   E'TASK 1 — Letter/Email Writing (120+ words)\n\nYou have recently moved to a new city for work. Write a letter to your friend back home. In your letter:\n• Describe your new city and accommodation\n• Tell them about your new job and colleagues\n• Invite them to visit you\n\nWrite at least 120 words.',
   'WritingTask','Writing','Medium',10.0,now(),now(),v_teacher_id),
  (wq2,
   E'TASK 2 — Essay Writing (250+ words)\n\nSome people believe that technology has made people more isolated and reduced face-to-face communication. Others argue that technology helps people stay connected.\n\nDiscuss both views and give your own opinion. Use specific reasons and examples to support your answer.\n\nWrite at least 250 words.',
   'WritingTask','Writing','Hard',10.0,now(),now(),v_teacher_id);

  -- ==========================================================================
  -- 6. SPEAKING QUESTIONS (3 parts)
  -- ==========================================================================
  INSERT INTO tenant_demo."Questions" (
    "Id","Content","Type","SkillType","Difficulty","DefaultScore",
    "SpeakingTimeLimitSec","ExamModeTag",
    "CreatedAt","UpdatedAt","CreatedBy"
  ) VALUES
  (sq1,
   E'PART 1 — Personal Questions (4 minutes)\n\nAnswer the following questions about yourself:\n1. Can you tell me about your hometown? What do you like most about it?\n2. What do you do in your free time? Why do you enjoy these activities?\n3. How important is English in your daily life or career?\n\nYou will have 4 minutes to answer all questions.',
   'SpeakingRecording','Speaking','Easy',10.0,
   240,'part1',
   now(),now(),v_teacher_id),
  (sq2,
   E'PART 2 — Picture Description (4 minutes)\n\nLook at the picture and speak about what you see. In your response:\n• Describe what is happening in the picture\n• Suggest what may have happened before/after the scene\n• Give your personal opinion about the situation shown\n\n[The image shows a busy outdoor market with vendors and shoppers.]\n\nYou will have 4 minutes to respond.',
   'SpeakingRecording','Speaking','Medium',10.0,
   240,'part2',
   now(),now(),v_teacher_id),
  (sq3,
   E'PART 3 — Discussion Topic (4 minutes)\n\nDiscuss the following topic:\n\n"Remote work has become increasingly common. What are the advantages and disadvantages of working from home for both employees and employers? What is your personal view on this trend?"\n\nYou will have 4 minutes to discuss the topic fully.',
   'SpeakingRecording','Speaking','Hard',10.0,
   240,'part3',
   now(),now(),v_teacher_id);

  -- ==========================================================================
  -- 7. LINK QUESTIONS TO QUIZZES
  -- ==========================================================================
  -- Listening questions
  INSERT INTO tenant_demo."QuizQuestions"("Id","QuizId","QuestionId","DisplayOrder","CreatedAt")
  SELECT gen_random_uuid(), v_listen_id, qid, ord, now()
  FROM (VALUES (lq1,1),(lq2,2),(lq3,3),(lq4,4),(lq5,5),(lq6,6),(lq7,7),(lq8,8),(lq9,9),(lq10,10)) AS t(qid,ord);

  INSERT INTO tenant_demo."QuizQuestions"("Id","QuizId","QuestionId","DisplayOrder","CreatedAt")
  SELECT gen_random_uuid(), v_quiz_id, qid, ord, now()
  FROM (VALUES (lq1,1),(lq2,2),(lq3,3),(lq4,4),(lq5,5),(lq6,6),(lq7,7),(lq8,8),(lq9,9),(lq10,10)) AS t(qid,ord);

  -- Reading questions (offset by 100 in main quiz)
  INSERT INTO tenant_demo."QuizQuestions"("Id","QuizId","QuestionId","DisplayOrder","CreatedAt")
  SELECT gen_random_uuid(), v_read_id, qid, ord, now()
  FROM (VALUES (rq1,1),(rq2,2),(rq3,3),(rq4,4),(rq5,5),(rq6,6),(rq7,7),(rq8,8),(rq9,9),(rq10,10)) AS t(qid,ord);

  INSERT INTO tenant_demo."QuizQuestions"("Id","QuizId","QuestionId","DisplayOrder","CreatedAt")
  SELECT gen_random_uuid(), v_quiz_id, qid, ord+100, now()
  FROM (VALUES (rq1,1),(rq2,2),(rq3,3),(rq4,4),(rq5,5),(rq6,6),(rq7,7),(rq8,8),(rq9,9),(rq10,10)) AS t(qid,ord);

  -- Writing questions
  INSERT INTO tenant_demo."QuizQuestions"("Id","QuizId","QuestionId","DisplayOrder","CreatedAt")
  VALUES
  (gen_random_uuid(), v_write_id, wq1, 1, now()),
  (gen_random_uuid(), v_write_id, wq2, 2, now()),
  (gen_random_uuid(), v_quiz_id,  wq1, 201, now()),
  (gen_random_uuid(), v_quiz_id,  wq2, 202, now());

  -- Speaking questions
  INSERT INTO tenant_demo."QuizQuestions"("Id","QuizId","QuestionId","DisplayOrder","CreatedAt")
  VALUES
  (gen_random_uuid(), v_speak_id, sq1, 1, now()),
  (gen_random_uuid(), v_speak_id, sq2, 2, now()),
  (gen_random_uuid(), v_speak_id, sq3, 3, now()),
  (gen_random_uuid(), v_quiz_id,  sq1, 301, now()),
  (gen_random_uuid(), v_quiz_id,  sq2, 302, now()),
  (gen_random_uuid(), v_quiz_id,  sq3, 303, now());

  -- ==========================================================================
  -- 8. PASSAGE GROUPS
  -- ==========================================================================
  -- Listening PassageGroup 1: Part 1 (questions 1-2, daily conversations)
  INSERT INTO tenant_demo."PassageGroups" (
    "Id","QuizId","GroupIndex","PassageType",
    "PassageText","AudioUrl","AudioPlayLimit","PreListenSeconds",
    "QuestionIds","DisplayOrder","CreatedAt"
  ) VALUES (
    pg1, v_listen_id, 0, 'listening',
    NULL,
    'https://cdn.example.com/vstep/audio/listening_part1_conversations.mp3',
    2, 20,
    to_jsonb(ARRAY[lq1, lq2]::uuid[]),
    0, now()
  );

  -- Listening PassageGroup 2: Part 2 (questions 3-5+9, talks & discussions)
  INSERT INTO tenant_demo."PassageGroups" (
    "Id","QuizId","GroupIndex","PassageType",
    "PassageText","AudioUrl","AudioPlayLimit","PreListenSeconds",
    "QuestionIds","DisplayOrder","CreatedAt"
  ) VALUES (
    pg2, v_listen_id, 1, 'listening',
    NULL,
    'https://cdn.example.com/vstep/audio/listening_part2_talks.mp3',
    2, 20,
    to_jsonb(ARRAY[lq3, lq4, lq5, lq9]::uuid[]),
    1, now()
  );

  -- Listening PassageGroup 3: Part 3 (questions 6-8+10, lectures)
  INSERT INTO tenant_demo."PassageGroups" (
    "Id","QuizId","GroupIndex","PassageType",
    "PassageText","AudioUrl","AudioPlayLimit","PreListenSeconds",
    "QuestionIds","DisplayOrder","CreatedAt"
  ) VALUES (
    pg3, v_listen_id, 2, 'listening',
    NULL,
    'https://cdn.example.com/vstep/audio/listening_part3_lectures.mp3',
    1, 30,
    to_jsonb(ARRAY[lq6, lq7, lq8, lq10]::uuid[]),
    2, now()
  );

  -- Reading PassageGroup 1: Passage A (environment & ecology)
  INSERT INTO tenant_demo."PassageGroups" (
    "Id","QuizId","GroupIndex","PassageType",
    "PassageText","AudioUrl","AudioPlayLimit","PreListenSeconds",
    "QuestionIds","DisplayOrder","CreatedAt"
  ) VALUES (
    pg4, v_read_id, 0, 'reading',
    E'The Declining Bee Population: A Global Crisis\n\nBee populations worldwide have been declining at an alarming rate over the past decade. Scientists point to several interconnected causes, but extensive research has identified the widespread use of pesticides in modern agriculture as the primary driver of this crisis. Neonicotinoid pesticides, in particular, have been shown to impair bees'' navigation systems, reproduction, and immune defenses.\n\nThe proliferation of industrial farming has drastically reduced the availability of diverse wildflower habitats that bees depend on for nutrition. Monoculture crops — vast fields planted with a single plant species — offer little nutritional variety and bloom for only a short period each year, leaving bees without food for the remainder of the season.\n\nWhile climate change is also a contributing factor, as shifting temperatures disrupt the synchronization between flower blooming and bee activity cycles, researchers emphasize that removing pesticide exposure would yield the most immediate positive impact. Several European countries have now banned neonicotinoids, and early results suggest bee populations are beginning to recover in affected regions.',
    NULL, 0, 0,
    to_jsonb(ARRAY[rq1, rq2, rq3]::uuid[]),
    0, now()
  );

  -- Reading PassageGroup 2: Passage B (technology & society)
  INSERT INTO tenant_demo."PassageGroups" (
    "Id","QuizId","GroupIndex","PassageType",
    "PassageText","AudioUrl","AudioPlayLimit","PreListenSeconds",
    "QuestionIds","DisplayOrder","CreatedAt"
  ) VALUES (
    pg5, v_read_id, 1, 'reading',
    E'Digital Literacy in the 21st Century Classroom\n\nAs technology becomes increasingly integrated into all aspects of modern life, the ability to navigate digital environments effectively — commonly referred to as digital literacy — has become an essential skill for citizens of the 21st century. The impact of technology on modern education is perhaps the most visible and consequential arena where this shift is occurring.\n\nResearchers have found that digital literacy programs are most effective when integrated into existing school curricula rather than taught as isolated subjects. When students learn to evaluate online information sources while studying history, or use data visualization tools in science class, they develop practical skills in context rather than in abstraction.\n\nHowever, critics argue that the rapid adoption of digital tools in classrooms has created new inequalities. Schools in affluent areas often have greater access to the latest technology, while those in less wealthy communities struggle with outdated equipment and unreliable internet connections. Bridging this digital divide requires targeted government investment and policy intervention.\n\nDespite these challenges, educators broadly agree that developing students'' critical thinking skills in digital environments — including the ability to identify misinformation and understand algorithmic bias — is now as fundamental as traditional literacy and numeracy.',
    NULL, 0, 0,
    to_jsonb(ARRAY[rq6, rq8, rq9]::uuid[]),
    1, now()
  );

  RAISE NOTICE '=== VSTEP Seed completed successfully ===';
  RAISE NOTICE 'Main quiz ID:      %', v_quiz_id;
  RAISE NOTICE 'Listening quiz ID: %', v_listen_id;
  RAISE NOTICE 'Reading quiz ID:   %', v_read_id;
  RAISE NOTICE 'Writing quiz ID:   %', v_write_id;
  RAISE NOTICE 'Speaking quiz ID:  %', v_speak_id;
END;
$$;

-- =============================================================================
-- Quick verification
-- =============================================================================
SELECT 'Quizzes' AS tbl, COUNT(*) FROM tenant_demo."Quizzes"     WHERE "ExamMode" = 'VSTEP'
UNION ALL
SELECT 'Questions (L)',  COUNT(*) FROM tenant_demo."Questions"   WHERE "SkillType" = 'Listening'
UNION ALL
SELECT 'Questions (R)',  COUNT(*) FROM tenant_demo."Questions"   WHERE "SkillType" = 'Reading'
UNION ALL
SELECT 'Questions (W)',  COUNT(*) FROM tenant_demo."Questions"   WHERE "SkillType" = 'Writing'
UNION ALL
SELECT 'Questions (S)',  COUNT(*) FROM tenant_demo."Questions"   WHERE "SkillType" = 'Speaking'
UNION ALL
SELECT 'PassageGroups',  COUNT(*) FROM tenant_demo."PassageGroups";

\echo '=== VSTEP Seed: Done ==='
