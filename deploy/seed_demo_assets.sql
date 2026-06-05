-- Seed demo LearningAssets for session f0000004 (Public Speaking)
-- Segments:
--   b400000a-...-000001 => "Tâm lý học thuyết trình: 75% người sợ?"
--   b400000a-...-000002 => "Kỹ thuật 5-4-3-2-1 & Breathing"
--   b400000a-...-000003 => "Luyện tập micro-presentation hàng ngày"
-- Existing:
--   2a00000a-...-000001 => NoteBlock (seg1, order 0)
--   2a00000a-...-000002 => QuizBlock (seg3, order 0)

SET search_path TO tenant_demo;

INSERT INTO "LearningAssets" ("Id", "SegmentId", "Type", "Title", "Description", "StartTime", "EndTime", "OrderIndex", "Metadata", "IsPublic", "CreatedAt", "UpdatedAt")
VALUES

-- GrammarBlock: Cấu trúc câu mở đầu thuyết trình
(
  '2a00000a-0000-0000-0000-000000000003',
  'b400000a-0000-0000-0000-000000000001',
  'GrammarBlock',
  'Cấu trúc câu mở đầu thuyết trình',
  'Các mẫu câu thường dùng khi bắt đầu một bài thuyết trình bằng tiếng Anh',
  0, 0, 1,
  '{
    "pattern": "Let me start by... / I''d like to begin with... / My presentation is about...",
    "examples": [
      {"vi": "Hôm nay tôi sẽ trình bày về kỹ năng thuyết trình.", "en": "Today I will present about presentation skills."},
      {"vi": "Cho phép tôi bắt đầu với một câu hỏi.", "en": "Allow me to start with a question."},
      {"vi": "Bài thuyết trình của tôi có 3 phần chính.", "en": "My presentation has 3 main parts."}
    ],
    "keywords": ["Let me start by", "I''d like to begin", "My presentation is about", "In conclusion", "To summarize", "Moving on to"]
  }'::jsonb,
  true,
  NOW(), NOW()
),

-- VocabularyBlock: Từ vựng thuyết trình
(
  '2a00000a-0000-0000-0000-000000000004',
  'b400000a-0000-0000-0000-000000000002',
  'VocabularyBlock',
  'Từ vựng thuyết trình chuyên nghiệp',
  'Các từ vựng tiếng Anh quan trọng liên quan đến kỹ năng thuyết trình',
  0, 0, 0,
  '{
    "words": [
      {
        "word": "Glossophobia",
        "ipa": "/ˌɡlɒsəˈfoʊbiə/",
        "meaning": "Chứng sợ nói trước đám đông",
        "audioUrl": "",
        "example": "Glossophobia affects about 73% of the population.",
        "exampleTranslation": "Glossophobia ảnh hưởng khoảng 73% dân số."
      },
      {
        "word": "Audience",
        "ipa": "/ˈɔːdiəns/",
        "meaning": "Khán giả, người nghe",
        "audioUrl": "",
        "example": "Know your audience before you start presenting.",
        "exampleTranslation": "Hãy hiểu khán giả trước khi bạn bắt đầu thuyết trình."
      },
      {
        "word": "Rehearse",
        "ipa": "/rɪˈhɜːrs/",
        "meaning": "Tập luyện, diễn tập",
        "audioUrl": "",
        "example": "Rehearse your presentation at least three times.",
        "exampleTranslation": "Diễn tập bài thuyết trình ít nhất 3 lần."
      },
      {
        "word": "Eye contact",
        "ipa": "/aɪ ˈkɒntækt/",
        "meaning": "Giao tiếp bằng mắt",
        "audioUrl": "",
        "example": "Maintain eye contact for 3 to 5 seconds per person.",
        "exampleTranslation": "Duy trì giao tiếp bằng mắt 3-5 giây với mỗi người."
      },
      {
        "word": "Confident",
        "ipa": "/ˈkɒnfɪdənt/",
        "meaning": "Tự tin",
        "audioUrl": "",
        "example": "Stand tall and look confident even when nervous.",
        "exampleTranslation": "Đứng thẳng và trông tự tin dù đang hồi hộp."
      }
    ]
  }'::jsonb,
  true,
  NOW(), NOW()
),

-- ExerciseBlock: Bài tập điền từ
(
  '2a00000a-0000-0000-0000-000000000005',
  'b400000a-0000-0000-0000-000000000003',
  'ExerciseBlock',
  'Bài tập: Kiểm tra kiến thức thuyết trình',
  'Điền vào chỗ trống để kiểm tra kiến thức về kỹ năng thuyết trình',
  0, 0, 1,
  '{
    "type": "fill_in_blank",
    "items": [
      {
        "sentence": "Kỹ thuật ___ giúp bạn bình tĩnh nhanh trong 5 giây (do Mel Robbins sáng tạo).",
        "answer": "5-4-3-2-1"
      },
      {
        "sentence": "Tốc độ nói lý tưởng khi thuyết trình là ___ từ/phút.",
        "answer": "130-150"
      },
      {
        "sentence": "Quy tắc ___ slide: tối đa 6 dòng, mỗi dòng không quá 6 từ.",
        "answer": "6x6"
      },
      {
        "sentence": "Power Pose nên giữ trong ___ phút để tăng testosterone và giảm cortisol.",
        "answer": "2"
      },
      {
        "sentence": "Cấu trúc bài thuyết trình: Opening ___ %, Body 70-75%, Closing 10-15%.",
        "answer": "10-15"
      }
    ]
  }'::jsonb,
  true,
  NOW(), NOW()
);

SELECT "Id", "Type", "Title", "OrderIndex" FROM "LearningAssets"
WHERE "SegmentId" IN (
  'b400000a-0000-0000-0000-000000000001',
  'b400000a-0000-0000-0000-000000000002',
  'b400000a-0000-0000-0000-000000000003'
)
ORDER BY "SegmentId", "OrderIndex";
