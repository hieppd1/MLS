"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCreateQuizMutation } from "@/lib/features/quiz/quizApi";
import { useListQuestionsQuery, useAddQuestionToQuizMutation } from "@/lib/features/quiz/questionApi";
import type { QuestionListItem } from "@/lib/features/quiz/questionApi";
import { useListQuizTypesQuery } from "@/lib/features/quiz/quizConfigApi";
import {
  QUIZ_TYPES_BY_MODE,
  SKILL_TYPES,
  DIFFICULTY_LABEL,
  SKILL_LABEL,
} from "@/lib/config/portalConfig";

const MLS_NAVY = "#1565C0";
const MLS_RED = "#e5173f";

type Step = 0 | 1 | 2 | 3;
type ExamMode = "Standard" | "OPIC" | "VSTEP";

interface QuizForm {
  title: string;
  description: string;
  quizType: string;
  skillType: string;
  timeLimitSeconds: string;
  passingScore: string;
  shuffleQuestions: boolean;
  showCorrectAnswer: boolean;
}


const PLATFORM_CARDS_DATA: { mode: ExamMode; color: string; textColor: string; available: boolean; }[] = [
  { mode: "Standard", color: "#EFF6FF", textColor: "#1D4ED8", available: true },
  { mode: "OPIC", color: "#F0FDF4", textColor: "#15803D", available: true },
  { mode: "VSTEP", color: "#FFF7ED", textColor: "#C2410C", available: true },
];

const STEP_KEYS = ["step_platform", "step_info", "step_questions", "step_confirm"] as const;

const QUESTION_TYPE_KEYS: string[] = [
  "SingleChoice", "MultipleChoice", "TrueFalse", "FillBlank",
  "Speaking", "SpeakingRecording", "OPICRolePlay",
];

export default function NewQuizPage() {
  const t = useTranslations("teacher_quizzes_new");
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [examMode, setExamMode] = useState<ExamMode>("Standard");

  const SKILL_OPTIONS_LOCAL = useMemo(() => [{ value: "", label: t("all_skills") }, ...SKILL_TYPES], [t]);

  const PLATFORM_CARDS = useMemo(() => PLATFORM_CARDS_DATA.map((card) => ({
    ...card,
    label: card.mode === "Standard" ? t("platform_standard") : card.mode,
    desc: card.mode === "Standard" ? t("platform_standard_desc")
         : card.mode === "OPIC" ? t("platform_opic_desc")
         : t("platform_vstep_desc"),
  })), [t]);

  const tQType = useTranslations("question_type_labels");
  const QUESTION_TYPE_LABELS: Record<string, string> = useMemo(() => ({
    SingleChoice: tQType("single"),
    MultipleChoice: tQType("multiple"),
    TrueFalse: tQType("true_false"),
    FillBlank: tQType("fill_blank"),
    Speaking: tQType("speaking"),
    SpeakingRecording: tQType("recording"),
    OPICRolePlay: tQType("opic_roleplay"),
  }), [tQType]);

  // Load quiz types from API; fall back to static portalConfig values
  const { data: apiQuizTypes = [] } = useListQuizTypesQuery(
    { examMode, activeOnly: true },
    { skip: false }
  );

  // Build quiz type options: prefer API, fall back to static
  const currentQuizTypes = useMemo<{ value: string; label: string }[]>(() => {
    if (apiQuizTypes.length > 0) {
      return apiQuizTypes.map((qt) => ({ value: qt.value, label: qt.label }));
    }
    return QUIZ_TYPES_BY_MODE[examMode] as { value: string; label: string }[];
  }, [apiQuizTypes, examMode]);
  const [form, setForm] = useState<QuizForm>({
    title: "",
    description: "",
    quizType: "PracticeQuiz",
    skillType: "",
    timeLimitSeconds: "",
    passingScore: "70",
    shuffleQuestions: true,
    showCorrectAnswer: true,
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [qSearch, setQSearch] = useState("");
  const [qType, setQType] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [createQuiz, { isLoading: creating }] = useCreateQuizMutation();
  const [addQuestion] = useAddQuestionToQuizMutation();

  const { data: questions } = useListQuestionsQuery(
    { page: 1, pageSize: 50, search: qSearch || undefined, type: qType || undefined },
  );

  function setF(key: keyof QuizForm, val: string | boolean) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function selectPlatform(mode: ExamMode) {
    setExamMode(mode);
    // quizType will be set when currentQuizTypes reloads from API;
    // pre-set to first static value as immediate placeholder
    const first = QUIZ_TYPES_BY_MODE[mode as keyof typeof QUIZ_TYPES_BY_MODE][0];
    setF("quizType", first.value);
    setStep(1);
  }

  async function handleCreate() {
    if (!form.title.trim()) { setError(t("err_name")); return; }
    setError(null);
    try {
      const quiz = await createQuiz({
        title: form.title,
        description: form.description || undefined,
        quizType: form.quizType,
        skillType: form.skillType || undefined,
        examMode: examMode,
        timeLimitSeconds: form.timeLimitSeconds
          ? parseInt(form.timeLimitSeconds) * 60
          : undefined,
        passingScore: parseFloat(form.passingScore) || 70,
        shuffleQuestions: form.shuffleQuestions,
        showCorrectAnswer: form.showCorrectAnswer,
      }).unwrap();

      for (let i = 0; i < selectedIds.length; i++) {
        await addQuestion({
          quizId: quiz.id,
          questionId: selectedIds[i],
          displayOrder: i + 1,
        }).unwrap();
      }

      router.push(`/teacher/quizzes/${quiz.id}`);
    } catch {
      setError(t("toast_fail"));
    }
  }

  const toggleQuestion = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const platformLabel =
    examMode === "Standard" ? t("platform_standard_short") :
    examMode === "OPIC"     ? "OPIC" : "VSTEP";

  return (
    <div style={{ padding: 32, maxWidth: 820, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => router.back()}
          style={{
            display: "flex", alignItems: "center", gap: 6, color: "#6B7280",
            background: "none", border: "none", cursor: "pointer", fontSize: 14,
            marginBottom: 16, padding: 0,
          }}
        >
          {t("back")}
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>{t("title")}</h1>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
        {([0, 1, 2, 3] as Step[]).map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: s < 3 ? 1 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: step > s ? "#16A34A" : step === s ? MLS_NAVY : "#E5E7EB",
                  color: step >= s ? "#fff" : "#9CA3AF",
                  fontWeight: 700, fontSize: 14, flexShrink: 0,
                }}
              >
                {step > s ? "✓" : s + 1}
              </div>
              <span
                style={{
                  fontSize: 13,
                  color: step >= s ? (step === s ? MLS_NAVY : "#374151") : "#9CA3AF",
                  fontWeight: step === s ? 700 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                {STEP_KEYS[s] ? t(STEP_KEYS[s]) : ""}
              </span>
            </div>
            {i < 3 && (
              <div
                style={{
                  flex: 1, height: 2,
                  background: step > s ? "#16A34A" : "#E5E7EB",
                  margin: "0 12px",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div
          style={{
            marginBottom: 16, padding: "12px 16px", borderRadius: 10,
            background: "#FEF2F2", color: MLS_RED, fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* ── Step 0: Platform selector ────────────────────────────────────── */}
      {step === 0 && (
        <div>
          <p style={{ color: "#6B7280", marginBottom: 24, fontSize: 14 }}>
            {t("platform_desc")}{" "}
            <strong>{t("platform_note")}</strong>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {PLATFORM_CARDS.map((card) => (
              <button
                key={card.mode}
                onClick={() => selectPlatform(card.mode)}
                disabled={!card.available}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 16,
                  padding: "20px 24px", borderRadius: 14,
                  border: `2px solid ${card.available ? card.textColor + "40" : "#E5E7EB"}`,
                  background: card.available ? card.color : "#F9FAFB",
                  cursor: card.available ? "pointer" : "not-allowed",
                  textAlign: "left", opacity: card.available ? 1 : 0.6,
                }}
                onMouseEnter={(e) => {
                  if (card.available)
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${card.textColor}25`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 17, fontWeight: 700,
                      color: card.available ? card.textColor : "#9CA3AF",
                      marginBottom: 6,
                    }}
                  >
                    {card.label}
                  </div>
                  <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
                    {card.desc}
                  </div>
                </div>
                {card.available && (
                  <div style={{ color: card.textColor, fontSize: 22, marginTop: 2 }}>→</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 1: Basic info ───────────────────────────────────────────── */}
      {step === 1 && (
        <div
          style={{
            background: "#fff", borderRadius: 16, padding: 28,
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          }}
        >
          {/* Platform badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: "#6B7280" }}>{t("platform_label")}</span>
            <span
              style={{
                padding: "3px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                background:
                  examMode === "Standard" ? "#EFF6FF" :
                  examMode === "OPIC" ? "#F0FDF4" : "#FFF7ED",
                color:
                  examMode === "Standard" ? "#1D4ED8" :
                  examMode === "OPIC" ? "#15803D" : "#C2410C",
              }}
            >
              {platformLabel}
            </span>
            <button
              onClick={() => setStep(0)}
              style={{
                fontSize: 12, color: "#6B7280", background: "none",
                border: "none", cursor: "pointer", textDecoration: "underline",
              }}
            >
              {t("btn_change_platform")}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label
                style={{
                  display: "block", fontSize: 14, fontWeight: 600,
                  color: "#374151", marginBottom: 6,
                }}
              >
                {t("field_name")}
              </label>
              <input
                value={form.title}
                onChange={(e) => setF("title", e.target.value)}
                placeholder={t("name_ph")}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 8,
                  border: "1px solid #D1D5DB", fontSize: 14, outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block", fontSize: 14, fontWeight: 600,
                  color: "#374151", marginBottom: 6,
                }}
              >
                Mô tả
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setF("description", e.target.value)}
                rows={3}
                placeholder={t("desc_ph")}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 8,
                  border: "1px solid #D1D5DB", fontSize: 14, outline: "none",
                  resize: "vertical", boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label
                  style={{
                    display: "block", fontSize: 14, fontWeight: 600,
                    color: "#374151", marginBottom: 6,
                  }}
                >
                  Loại quiz
                </label>
                <select
                  value={form.quizType}
                  onChange={(e) => setF("quizType", e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 8,
                    border: "1px solid #D1D5DB", fontSize: 14, background: "#fff",
                  }}
                >
                  {currentQuizTypes.map((qt) => (
                    <option key={qt.value} value={qt.value}>
                      {qt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: "block", fontSize: 14, fontWeight: 600,
                    color: "#374151", marginBottom: 6,
                  }}
                >
                  Kỹ năng
                </label>
                <select
                  value={form.skillType}
                  onChange={(e) => setF("skillType", e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 8,
                    border: "1px solid #D1D5DB", fontSize: 14, background: "#fff",
                  }}
                >
                  {SKILL_OPTIONS_LOCAL.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: "block", fontSize: 14, fontWeight: 600,
                    color: "#374151", marginBottom: 6,
                  }}
                >
                  {t("field_duration")}
                </label>
                <input
                  value={form.timeLimitSeconds}
                  onChange={(e) => setF("timeLimitSeconds", e.target.value)}
                  type="number"
                  min="1"
                  placeholder={t("duration_ph")}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 8,
                    border: "1px solid #D1D5DB", fontSize: 14, boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block", fontSize: 14, fontWeight: 600,
                    color: "#374151", marginBottom: 6,
                  }}
                >
                  Điểm đậu (%)
                </label>
                <input
                  value={form.passingScore}
                  onChange={(e) => setF("passingScore", e.target.value)}
                  type="number"
                  min="0"
                  max="100"
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 8,
                    border: "1px solid #D1D5DB", fontSize: 14, boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              {(
                [
                  ["shuffleQuestions", t("chk_random")],
                  ["showCorrectAnswer", t("chk_show_answers")],
                ] as [keyof QuizForm, string][]
              ).map(([key, label]) => (
                <label
                  key={key}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    cursor: "pointer", fontSize: 14, color: "#374151",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form[key] as boolean}
                    onChange={(e) => setF(key, e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: MLS_NAVY }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
            <button
              onClick={() => setStep(0)}
              style={{
                padding: "12px 24px", borderRadius: 10, border: "1px solid #D1D5DB",
                background: "#fff", cursor: "pointer", fontWeight: 600,
              }}
            >
              ← Trở lại
            </button>
            <button
              onClick={() => {
                if (!form.title.trim()) { setError(t("err_name")); return; }
                setError(null);
                setStep(2);
              }}
              style={{
                padding: "12px 28px", borderRadius: 10, border: "none",
                background: MLS_NAVY, color: "#fff", cursor: "pointer",
                fontWeight: 700, fontSize: 15,
              }}
            >
              {t("btn_next")}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Question bank ─────────────────────────────────────────── */}
      {step === 2 && (
        <div
          style={{
            background: "#fff", borderRadius: 16, padding: 28,
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          }}
        >
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <input
              value={qSearch}
              onChange={(e) => setQSearch(e.target.value)}
              placeholder={t("search_ph")}
              style={{ flex: 1, padding: "8px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14 }}
            />
            <select
              value={qType}
              onChange={(e) => setQType(e.target.value)}
              style={{
                padding: "8px 14px", borderRadius: 8, border: "1px solid #D1D5DB",
                fontSize: 14, background: "#fff",
              }}
            >
              <option value="">{t("all_types")}</option>
              {Object.entries(QUESTION_TYPE_LABELS).map(([val, lbl]) => (
                <option key={val} value={val}>{lbl}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 12, fontSize: 13, color: "#6B7280" }}>
            {t.rich("selected", { n: selectedIds.length, strong: (chunks) => <strong>{chunks}</strong> })}
          </div>
          <div
            style={{
              display: "flex", flexDirection: "column", gap: 8,
              maxHeight: 400, overflowY: "auto",
            }}
          >
            {(questions?.items ?? []).map((q: QuestionListItem) => {
              const sel = selectedIds.includes(q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => toggleQuestion(q.id)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "12px 14px", borderRadius: 10,
                    border: `2px solid ${sel ? MLS_NAVY : "#E5E7EB"}`,
                    background: sel ? "#EFF6FF" : "#FAFAFA",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                      border: `2px solid ${sel ? MLS_NAVY : "#D1D5DB"}`,
                      background: sel ? MLS_NAVY : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginTop: 2,
                    }}
                  >
                    {sel && (
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#fff">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: "#111827", marginBottom: 4 }}>
                      {q.content.slice(0, 120)}
                      {q.content.length > 120 ? "..." : ""}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ fontSize: 11, background: "#E5E7EB", borderRadius: 4, padding: "2px 8px", color: "#6B7280" }}>
                        {QUESTION_TYPE_LABELS[q.type] ?? q.type}
                      </span>
                      <span style={{ fontSize: 11, background: "#E5E7EB", borderRadius: 4, padding: "2px 8px", color: "#6B7280" }}>
                        {DIFFICULTY_LABEL[q.difficulty] ?? q.difficulty}
                      </span>
                      <span style={{ fontSize: 11, background: "#E5E7EB", borderRadius: 4, padding: "2px 8px", color: "#6B7280" }}>
                        {SKILL_LABEL[q.skillType] ?? q.skillType}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            {(questions?.items ?? []).length === 0 && (
              <p style={{ textAlign: "center", color: "#9CA3AF", padding: "32px 0" }}>
                {t("no_questions")}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "space-between" }}>
            <button
              onClick={() => setStep(1)}
              style={{
                padding: "12px 24px", borderRadius: 10, border: "1px solid #D1D5DB",
                background: "#fff", cursor: "pointer", fontWeight: 600,
              }}
            >
              {t("btn_back")}
            </button>
            <button
              onClick={() => setStep(3)}
              style={{
                padding: "12px 28px", borderRadius: 10, border: "none",
                background: MLS_NAVY, color: "#fff", cursor: "pointer",
                fontWeight: 700, fontSize: 15,
              }}
            >
              {t("btn_next")}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Confirm ───────────────────────────────────────────────── */}
      {step === 3 && (
        <div
          style={{
            background: "#fff", borderRadius: 16, padding: 28,
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 20 }}>
            {t("confirm_heading")}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            {[
              { label: t("confirm_name"), value: form.title },
              { label: t("confirm_platform"), value: platformLabel },
              {
                label: t("confirm_type"),
                value:
                  currentQuizTypes.find((qt) => qt.value === form.quizType)?.label ??
                  form.quizType,
              },
              {
                label: t("confirm_skill"),
                value: form.skillType
                  ? (SKILL_LABEL[form.skillType] ?? form.skillType)
                  : t("confirm_all"),
              },
              {
                label: t("confirm_duration"),
                value: form.timeLimitSeconds
                  ? t("confirm_minutes", { n: form.timeLimitSeconds })
                  : t("confirm_unlimited"),
              },
              { label: t("confirm_pass_score"), value: `${form.passingScore}%` },
              { label: t("confirm_questions"), value: t("confirm_questions_n", { n: selectedIds.length }) },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 14px" }}
              >
                <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
            <button
              onClick={() => setStep(2)}
              style={{
                padding: "12px 24px", borderRadius: 10, border: "1px solid #D1D5DB",
                background: "#fff", cursor: "pointer", fontWeight: 600,
              }}
            >
              {t("btn_back")}
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              style={{
                padding: "12px 32px", borderRadius: 10, border: "none",
                background: MLS_NAVY, color: "#fff",
                cursor: creating ? "not-allowed" : "pointer",
                fontWeight: 700, fontSize: 15, opacity: creating ? 0.7 : 1,
              }}
            >
              {creating ? t("btn_creating") : t("btn_create")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
