// ── Central portal configuration constants ────────────────────────────────────
// All dropdowns/selects across teacher portal import from here (Phase 1).
// Phase 2: replace with API-backed values from /api/v1/portal/config.

export const QUESTION_TYPES = [
  { value: "SingleChoice",    label: "1 đáp án" },
  { value: "MultipleChoice",  label: "Nhiều đáp án" },
  { value: "TrueFalse",       label: "Đúng / Sai" },
  { value: "FillBlank",       label: "Điền vào chỗ trống" },
  { value: "Matching",        label: "Ghép đôi" },
  { value: "Ordering",        label: "Sắp xếp thứ tự" },
  { value: "Speaking",        label: "Nói (Speaking)" },
  { value: "SpeakingRecording", label: "Ghi âm (Recording)" },
  { value: "OPICRolePlay",    label: "OPIC Nhập vai" },
];

export const SKILL_TYPES = [
  { value: "Reading",    label: "Đọc (Reading)" },
  { value: "Listening",  label: "Nghe (Listening)" },
  { value: "Speaking",   label: "Nói (Speaking)" },
  { value: "Writing",    label: "Viết (Writing)" },
  { value: "Grammar",    label: "Ngữ pháp (Grammar)" },
  { value: "Vocabulary", label: "Từ vựng (Vocabulary)" },
  { value: "Mixed",      label: "Tổng hợp (Mixed)" },
];

export const DIFFICULTIES = [
  { value: "Easy",   label: "Dễ" },
  { value: "Medium", label: "Trung bình" },
  { value: "Hard",   label: "Khó" },
];

export const QUIZ_STATUSES = [
  { value: "Draft",     label: "Bản nháp" },
  { value: "Published", label: "Đã xuất bản" },
  { value: "Archived",  label: "Đã lưu trữ" },
];

export const QUIZ_TYPES_BY_MODE = {
  Standard: [
    { value: "PlacementTest",  label: "Xếp lớp (Placement Test)" },
    { value: "SegmentQuiz",    label: "Theo bài học (Segment Quiz)" },
    { value: "PracticeQuiz",   label: "Luyện tập (Practice)" },
    { value: "MockTest",       label: "Thi thử (Mock Test)" },
    { value: "AdaptiveQuiz",   label: "Thích nghi (Adaptive)" },
    { value: "SpeakingTest",   label: "Nói (Speaking Test)" },
    { value: "WritingTest",    label: "Viết (Writing Test)" },
    { value: "GrammarQuiz",    label: "Ngữ pháp (Grammar Quiz)" },
    { value: "VocabularyQuiz", label: "Từ vựng (Vocabulary Quiz)" },
    { value: "RealtimeQuiz",   label: "Thời gian thực (Realtime)" },
  ],
  OPIC: [
    { value: "OPICMockTest", label: "OPIC Thi thử (Mock Test)" },
    { value: "OPICMiniTest", label: "OPIC Ngắn (Mini Test)" },
  ],
  VSTEP: [
    { value: "VSTEPMockTest",  label: "VSTEP Thi thử tổng hợp" },
    { value: "VSTEPListening", label: "VSTEP Nghe (Listening)" },
    { value: "VSTEPReading",   label: "VSTEP Đọc (Reading)" },
    { value: "VSTEPWriting",   label: "VSTEP Viết (Writing)" },
    { value: "VSTEPSpeaking",  label: "VSTEP Nói (Speaking)" },
  ],
} as const;

// Flat lookup: quizType value → Vietnamese label
export const QUIZ_TYPE_LABEL: Record<string, string> = {
  ...Object.fromEntries(QUIZ_TYPES_BY_MODE.Standard.map((t) => [t.value, t.label])),
  ...Object.fromEntries(QUIZ_TYPES_BY_MODE.OPIC.map((t) => [t.value, t.label])),
  ...Object.fromEntries(QUIZ_TYPES_BY_MODE.VSTEP.map((t) => [t.value, t.label])),
};

export const EXAM_MODES = [
  { value: "Standard", label: "Tiêu chuẩn", bg: "#EFF6FF", color: "#1D4ED8" },
  { value: "OPIC",     label: "OPIC",        bg: "#F0FDF4", color: "#15803D" },
  { value: "VSTEP",    label: "VSTEP",       bg: "#FFF7ED", color: "#C2410C" },
];

export const EXAM_MODE_LABEL: Record<string, string> = Object.fromEntries(
  EXAM_MODES.map((m) => [m.value, m.label])
);

export const EXAM_MODE_COLOR: Record<string, { bg: string; color: string }> = Object.fromEntries(
  EXAM_MODES.map((m) => [m.value, { bg: m.bg, color: m.color }])
);

export const SKILL_LABEL: Record<string, string> = Object.fromEntries(
  SKILL_TYPES.map((s) => [s.value, s.label])
);

export const DIFFICULTY_LABEL: Record<string, string> = Object.fromEntries(
  DIFFICULTIES.map((d) => [d.value, d.label])
);
