-- ── Quiz Type Config migration ────────────────────────────────────────────────
-- Creates the quiz_type_configs table in the tenant schema and seeds
-- all built-in quiz types from portalConfig.ts

SET search_path TO tenant_demo;

-- 1. Create table
CREATE TABLE IF NOT EXISTS quiz_type_configs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_mode   VARCHAR(32) NOT NULL DEFAULT 'Standard',
    value       VARCHAR(64) NOT NULL,
    label       VARCHAR(128) NOT NULL,
    sort_order  INT         NOT NULL DEFAULT 0,
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ,
    UNIQUE (exam_mode, value)
);

CREATE INDEX IF NOT EXISTS idx_quiz_type_configs_exam_mode ON quiz_type_configs(exam_mode);
CREATE INDEX IF NOT EXISTS idx_quiz_type_configs_active    ON quiz_type_configs(is_active);

-- 2. Seed Standard types
INSERT INTO quiz_type_configs (exam_mode, value, label, sort_order) VALUES
  ('Standard', 'PlacementTest',  'Xếp lớp (Placement Test)',      1),
  ('Standard', 'SegmentQuiz',    'Theo bài học (Segment Quiz)',    2),
  ('Standard', 'PracticeQuiz',   'Luyện tập (Practice)',           3),
  ('Standard', 'MockTest',       'Thi thử (Mock Test)',            4),
  ('Standard', 'AdaptiveQuiz',   'Thích nghi (Adaptive)',          5),
  ('Standard', 'SpeakingTest',   'Nói (Speaking Test)',            6),
  ('Standard', 'WritingTest',    'Viết (Writing Test)',            7),
  ('Standard', 'GrammarQuiz',    'Ngữ pháp (Grammar Quiz)',        8),
  ('Standard', 'VocabularyQuiz', 'Từ vựng (Vocabulary Quiz)',      9),
  ('Standard', 'RealtimeQuiz',   'Thời gian thực (Realtime)',      10)
ON CONFLICT (exam_mode, value) DO NOTHING;

-- 3. Seed OPIC types
INSERT INTO quiz_type_configs (exam_mode, value, label, sort_order) VALUES
  ('OPIC', 'OPICMockTest', 'OPIC Thi thử (Mock Test)', 1),
  ('OPIC', 'OPICMiniTest', 'OPIC Ngắn (Mini Test)',     2)
ON CONFLICT (exam_mode, value) DO NOTHING;

-- 4. Seed VSTEP types
INSERT INTO quiz_type_configs (exam_mode, value, label, sort_order) VALUES
  ('VSTEP', 'VSTEPMockTest',  'VSTEP Thi thử tổng hợp', 1),
  ('VSTEP', 'VSTEPListening', 'VSTEP Nghe (Listening)',  2),
  ('VSTEP', 'VSTEPReading',   'VSTEP Đọc (Reading)',     3),
  ('VSTEP', 'VSTEPWriting',   'VSTEP Viết (Writing)',    4),
  ('VSTEP', 'VSTEPSpeaking',  'VSTEP Nói (Speaking)',    5)
ON CONFLICT (exam_mode, value) DO NOTHING;

SELECT 'quiz_type_configs seeded: ' || COUNT(*) || ' rows' FROM quiz_type_configs;
