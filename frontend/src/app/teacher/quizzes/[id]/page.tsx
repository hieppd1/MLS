"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  useGetQuizQuery,
  useUpdateQuizMutation,
  usePublishQuizMutation,
  useArchiveQuizMutation,
  useDeleteQuizMutation,
} from "@/lib/features/quiz/quizApi";
import {
  useListQuestionsQuery,
  useAddQuestionToQuizMutation,
  useRemoveQuestionFromQuizMutation,
  useUpdateQuestionMutation,
} from "@/lib/features/quiz/questionApi";
import type { QuizQuestionDto } from "@/lib/features/quiz/quizApi";
import type { QuestionListItem } from "@/lib/features/quiz/questionApi";
import { useListQuizTypesQuery } from "@/lib/features/quiz/quizConfigApi";
import {
  useGetPassagesQuery,
  useCreatePassageMutation,
  useDeletePassageMutation,
} from "@/lib/features/quiz/vstepApi";
import type { PassageGroupDto } from "@/lib/features/quiz/vstepApi";
import { SKILL_TYPES, QUIZ_TYPE_LABEL } from "@/lib/config/portalConfig";

const MLS_NAVY = "#1565C0";
const MLS_RED = "#e5173f";

const OPIC_EXAM_MODE_TAGS = ["", "orientation", "describe", "routine", "experience", "roleplay", "question-asking"];
const OPIC_EXAM_MODE_KEY_MAP: Record<string, string> = {
  orientation:       "self_intro",
  describe:          "describe",
  routine:           "routine",
  experience:        "experience",
  roleplay:          "roleplay",
  "question-asking": "qasking",
};

const OPIC_TYPE_COLOR: Record<string, string> = {
  orientation: "#1565C0", describe: "#7C3AED", routine: "#0891B2",
  experience: "#059669", roleplay: "#D97706", "question-asking": "#DC2626",
};

function DiffBadge({ d }: { d: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Easy:   { bg: "#DCFCE7", color: "#16A34A" },
    Medium: { bg: "#FEF3C7", color: "#D97706" },
    Hard:   { bg: "#FEE2E2", color: "#DC2626" },
  };
  const s = map[d] ?? { bg: "#F3F4F6", color: "#6B7280" };
  return <span style={{ fontSize: 11, borderRadius: 4, padding: "2px 8px", background: s.bg, color: s.color, fontWeight: 600 }}>{d}</span>;
}

const IS_OPIC = (quiz: { examMode?: string; quizType: string }) =>
  quiz.examMode === "OPIC" || quiz.quizType === "OPICMockTest" || quiz.quizType === "OPICMiniTest";

const IS_VSTEP = (quiz: { examMode?: string; quizType: string }) =>
  quiz.examMode === "VSTEP" || quiz.quizType?.startsWith("VSTEP");

function OPICQuestionModal({
  q, onClose, onSave,
}: {
  q: QuizQuestionDto;
  onClose: () => void;
  onSave: (patch: { audioUrl?: string; speakingTimeLimitSec?: number; examModeTag?: string; audioPlayLimit?: number }) => void;
}) {
  const t = useTranslations("teacher_quiz_detail");
  const tCombo = useTranslations("opic_combo_labels");
  const [audioUrl, setAudioUrl] = useState(q.audioUrl ?? "");
  const [timeLimitSec, setTimeLimitSec] = useState(q.speakingTimeLimitSec ?? 120);
  const [examModeTag, setExamModeTag] = useState(q.examModeTag ?? "");
  const [playLimit, setPlayLimit] = useState<number>(2);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 480, maxWidth: "92vw" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: 0 }}>{t("opic_modal_title")}</h3>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: "#9CA3AF" }}>x</button>
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 16, padding: "10px 14px", background: "#F9FAFB", borderRadius: 8 }}>
          {q.content.slice(0, 120)}{q.content.length > 120 ? "..." : ""}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              {t("opic_field_type")}
            </label>
            <select value={examModeTag} onChange={(e) => setExamModeTag(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, background: "#fff" }}>
              {OPIC_EXAM_MODE_TAGS.map((tag) => (
                <option key={tag} value={tag}>{tag === "" ? t("opic_type_default") : tCombo(OPIC_EXAM_MODE_KEY_MAP[tag] ?? "describe")}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              {t("opic_field_audio")}
            </label>
            <input value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)}
              placeholder="https://..."
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              {t("opic_field_time")}
              </label>
              <input type="number" min={15} max={300} value={timeLimitSec}
                onChange={(e) => setTimeLimitSec(parseInt(e.target.value) || 120)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                {t("opic_field_plays")}
              </label>
              <select value={playLimit} onChange={(e) => setPlayLimit(parseInt(e.target.value))}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, background: "#fff" }}>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
          <button onClick={onClose}
            style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer", fontSize: 13, color: "#374151" }}>
            {t("btn_cancel")}
          </button>
          <button onClick={() => onSave({ audioUrl: audioUrl || undefined, speakingTimeLimitSec: timeLimitSec, examModeTag: examModeTag || undefined, audioPlayLimit: playLimit })}
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: MLS_NAVY, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            {t("btn_save_opic")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditQuizPage() {
  const t = useTranslations("teacher_quiz_detail");
  const tCombo = useTranslations("opic_combo_labels");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: quiz, isLoading, refetch } = useGetQuizQuery(id, { skip: !id });
  const [updateQuiz, { isLoading: updating }] = useUpdateQuizMutation();
  const [publishQuiz] = usePublishQuizMutation();
  const [archiveQuiz] = useArchiveQuizMutation();
  const [deleteQuiz] = useDeleteQuizMutation();
  const [addQuestion] = useAddQuestionToQuizMutation();
  const [removeQuestion] = useRemoveQuestionFromQuizMutation();
  const [updateQuestion] = useUpdateQuestionMutation();
  const { data: allQuizTypes = [] } = useListQuizTypesQuery({ activeOnly: true });

  const isOpicQuiz = quiz ? IS_OPIC(quiz) : false;
  const isVstepQuiz = quiz ? IS_VSTEP(quiz) : false;

  const { data: passages = [] } = useGetPassagesQuery(id, { skip: !isVstepQuiz });
  const [createPassage] = useCreatePassageMutation();
  const [deletePassage] = useDeletePassageMutation();

  type TabType = "settings" | "questions" | "opic" | "passages";
  const [tab, setTab] = useState<TabType>("settings");
  const [showAddModal, setShowAddModal] = useState(false);
  const [opicEditQ, setOpicEditQ] = useState<QuizQuestionDto | null>(null);
  const [qSearch, setQSearch] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: bankQuestions } = useListQuestionsQuery(
    { page: 1, pageSize: 50, search: qSearch || undefined },
    { skip: !showAddModal }
  );

  const [form, setForm] = useState<{
    title?: string; description?: string; quizType?: string; skillType?: string;
    timeLimitSeconds?: string; passingScore?: string; shuffleQuestions?: boolean; showCorrectAnswer?: boolean;
  }>({});

  function showMsg(type: "success" | "error", text: string) {
    setMsg({ type, text }); setTimeout(() => setMsg(null), 3500);
  }

  // Quiz type options: loaded from DB config API, fallback to portalConfig static map
  const quizTypeOptions = allQuizTypes.length > 0
    ? allQuizTypes.map((qt) => ({ value: qt.value, label: qt.label }))
    : Object.entries(QUIZ_TYPE_LABEL).map(([value, label]) => ({ value, label }));

  function fieldVal<K extends keyof typeof form>(key: K, fallback: unknown) {
    return key in form ? form[key] : fallback;
  }

  async function handleSaveSettings() {
    if (!quiz) return;
    try {
      await updateQuiz({
        id,
        ...form,
        timeLimitSeconds: form.timeLimitSeconds !== undefined
          ? (form.timeLimitSeconds ? parseInt(form.timeLimitSeconds) * 60 : undefined)
          : undefined,
        passingScore: form.passingScore !== undefined ? parseFloat(form.passingScore) : undefined,
      }).unwrap();
      setForm({});
      showMsg("success", t("toast_save_ok"));
    } catch {
      showMsg("error", t("toast_save_fail"));
    }
  }

  async function handleAddQuestion(qId: string) {
    if (!quiz) return;
    try {
      await addQuestion({ quizId: id, questionId: qId, displayOrder: (quiz.questions?.length ?? 0) + 1 }).unwrap();
      refetch();
      showMsg("success", t("toast_add_q_ok"));
    } catch {
      showMsg("error", t("toast_add_q_fail"));
    }
  }

  async function handleRemoveQuestion(questionId: string) {
    try {
      await removeQuestion({ quizId: id, questionId }).unwrap();
      refetch();
      showMsg("success", t("toast_delete_q_ok"));
    } catch {
      showMsg("error", t("toast_delete_q_fail"));
    }
  }

  async function handleSaveOPICQuestion(
    q: QuizQuestionDto,
    patch: { audioUrl?: string; speakingTimeLimitSec?: number; examModeTag?: string; audioPlayLimit?: number }
  ) {
    try {
      await updateQuestion({
        id: q.questionId,
        content: q.content,
        type: q.type,
        skillType: q.skillType,
        difficulty: q.difficulty,
        score: q.score,
        audioUrl: patch.audioUrl ?? q.audioUrl ?? undefined,
        options: [],
        speakingTimeLimitSec: patch.speakingTimeLimitSec,
        examModeTag: patch.examModeTag,
        audioPlayLimit: patch.audioPlayLimit,
      }).unwrap();
      refetch();
      setOpicEditQ(null);
      showMsg("success", t("toast_opic_ok"));
    } catch {
      showMsg("error", t("toast_opic_fail"));
    }
  }

  async function handlePublish() {
    try { await publishQuiz(id).unwrap(); showMsg("success", t("toast_publish_ok")); refetch(); }
    catch { showMsg("error", t("toast_publish_fail")); }
  }

  async function handleArchive() {
    try { await archiveQuiz(id).unwrap(); showMsg("success", t("toast_archive_ok")); refetch(); }
    catch { showMsg("error", t("toast_action_fail")); }
  }

  if (isLoading) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#9CA3AF" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 40, height: 40, border: "4px solid #E5E7EB", borderTopColor: MLS_NAVY, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
        {t("loading")}
      </div>
    );
  }

  if (!quiz) return <div style={{ padding: 32, color: "#6B7280" }}>{t("not_found")}</div>;

  const currentlyInQuiz = new Set(quiz.questions.map((q) => q.questionId));

  const opicGroups: Record<string, QuizQuestionDto[]> = {};
  if (isOpicQuiz) {
    for (const q of quiz.questions) {
      const tag = q.examModeTag ?? "untagged";
      if (!opicGroups[tag]) opicGroups[tag] = [];
      opicGroups[tag].push(q);
    }
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: "settings",  label: t("tab_settings") },
    { key: "questions", label: t("tab_questions", { n: quiz.questions.length }) },
    ...(isOpicQuiz  ? [{ key: "opic"     as TabType, label: t("tab_opic") }]    : []),
    ...(isVstepQuiz ? [{ key: "passages" as TabType, label: t("tab_passages", { n: passages.length }) }] : []),
  ];

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Link href="/teacher/quizzes" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
            ← {t("back")}
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>{quiz.title}</h1>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>{quiz.questions.length} · {quiz.quizType}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {quiz.status === "Draft"     && <button onClick={handlePublish} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #16A34A", color: "#16A34A", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>{t("btn_publish")}</button>}
          {quiz.status === "Published" && <button onClick={handleArchive} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #D97706", color: "#D97706", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>{t("btn_archive")}</button>}
          <Link href={`/teacher/quizzes/${id}/analytics`} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #7C3AED", color: "#7C3AED", textDecoration: "none", fontWeight: 600, fontSize: 13 }}>{t("btn_stats")}</Link>
        </div>
      </div>

      {msg && (
        <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 8, background: msg.type === "success" ? "#F0FDF4" : "#FEF2F2", color: msg.type === "success" ? "#16A34A" : MLS_RED, fontSize: 13 }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid #E5E7EB" }}>
        {tabs.map((tabItem) => (
          <button key={tabItem.key} onClick={() => setTab(tabItem.key)} style={{
            padding: "10px 24px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14,
            background: "transparent", color: tab === tabItem.key ? MLS_NAVY : "#6B7280",
            borderBottom: tab === tabItem.key ? `2px solid ${MLS_NAVY}` : "none", marginBottom: -2,
          }}>
            {tabItem.label}
          </button>
        ))}
      </div>

      {tab === "settings" && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", maxWidth: 680 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{t("field_title")}</label>
              <input
                value={(fieldVal("title", quiz.title) as string)}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{t("field_description")}</label>
              <textarea
                value={(fieldVal("description", quiz.description ?? "") as string)}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{t("field_type")}</label>
                <select value={(fieldVal("quizType", quiz.quizType) as string)}
                  onChange={(e) => setForm((f) => ({ ...f, quizType: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, background: "#fff" }}>
                  {quizTypeOptions.map((qt) => <option key={qt.value} value={qt.value}>{qt.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{t("field_skill")}</label>
                <select value={(fieldVal("skillType", quiz.skillType ?? "") as string)}
                  onChange={(e) => setForm((f) => ({ ...f, skillType: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, background: "#fff" }}>
                  {SKILL_TYPES.map((skill) => <option key={skill.value} value={skill.value}>{skill.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{t("field_duration")}</label>
                <input type="number" min="1"
                  value={(fieldVal("timeLimitSeconds", quiz.timeLimitSeconds ? Math.floor(quiz.timeLimitSeconds / 60) : "") as string | number)}
                  onChange={(e) => setForm((f) => ({ ...f, timeLimitSeconds: e.target.value }))}
                  placeholder={t("duration_ph")}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{t("field_pass_score")}</label>
                <input type="number" min="0" max="100"
                  value={(fieldVal("passingScore", quiz.passingScore) as string | number)}
                  onChange={(e) => setForm((f) => ({ ...f, passingScore: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              {([["shuffleQuestions", t("chk_random")], ["showCorrectAnswer", t("chk_show_answers")]] as const).map(([key, label]) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                  <input type="checkbox"
                    checked={(fieldVal(key as "shuffleQuestions" | "showCorrectAnswer", quiz[key as "shuffleQuestions" | "showCorrectAnswer"]) as boolean)}
                    onChange={(e) => setForm((f) => ({ ...f, [key as string]: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: MLS_NAVY }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <button onClick={handleSaveSettings} disabled={updating}
              style={{ padding: "11px 28px", borderRadius: 10, border: "none", background: MLS_NAVY, color: "#fff", cursor: updating ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14, opacity: updating ? 0.7 : 1 }}>
              {updating ? t("btn_saving") : t("btn_save")}
            </button>
          </div>
        </div>
      )}

      {tab === "questions" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button onClick={() => setShowAddModal(true)}
              style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: MLS_NAVY, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
              {t("btn_add_question")}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {quiz.questions.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF" }}>{t("questions_empty")}</div>
            )}
            {quiz.questions.map((q: QuizQuestionDto, i: number) => (
              <div key={q.linkId} style={{
                background: "#fff", borderRadius: 12, padding: "16px 18px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                display: "flex", alignItems: "flex-start", gap: 14,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 700, color: MLS_NAVY, fontSize: 14 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: "#111827", marginBottom: 8, lineHeight: 1.5 }}
                    dangerouslySetInnerHTML={{ __html: q.content.slice(0, 200) + (q.content.length > 200 ? "..." : "") }} />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, background: "#EFF6FF", borderRadius: 4, padding: "2px 8px", color: MLS_NAVY }}>{q.type}</span>
                    <span style={{ fontSize: 11, background: "#F3F4F6", borderRadius: 4, padding: "2px 8px", color: "#6B7280" }}>{q.skillType}</span>
                    <DiffBadge d={q.difficulty} />
                    <span style={{ fontSize: 11, background: "#F3F4F6", borderRadius: 4, padding: "2px 8px", color: "#6B7280" }}>{q.score} pts</span>
                    {q.examModeTag && (
                      <span style={{ fontSize: 11, borderRadius: 4, padding: "2px 8px", fontWeight: 600, background: (OPIC_TYPE_COLOR[q.examModeTag] ?? "#6B7280") + "20", color: OPIC_TYPE_COLOR[q.examModeTag] ?? "#6B7280" }}>
                        {tCombo(OPIC_EXAM_MODE_KEY_MAP[q.examModeTag] ?? "describe")}
                      </span>
                    )}
                    {q.speakingTimeLimitSec && (
                      <span style={{ fontSize: 11, background: "#F0FDF4", borderRadius: 4, padding: "2px 8px", color: "#16A34A" }}>{q.speakingTimeLimitSec}s</span>
                    )}
                    {q.audioUrl && (
                      <span style={{ fontSize: 11, background: "#FFF7ED", borderRadius: 4, padding: "2px 8px", color: "#D97706" }}>audio</span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {isOpicQuiz && (
                    <button onClick={() => { setOpicEditQ(q); setTab("opic"); }}
                      style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${MLS_NAVY}`, color: MLS_NAVY, background: "transparent", cursor: "pointer", fontSize: 12 }}>
                      {t("btn_opic_settings")}
                    </button>
                  )}
                  <button onClick={() => handleRemoveQuestion(q.questionId)}
                    style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${MLS_RED}`, color: MLS_RED, background: "transparent", cursor: "pointer", fontSize: 12 }}>
                    {t("btn_delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "opic" && isOpicQuiz && (
        <div style={{ maxWidth: 760 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
            {[
              { label: t("opic_stats_total"), value: quiz.questions.length,                          color: MLS_NAVY  },
              { label: t("opic_stats_audio"),       value: quiz.questions.filter(q => q.audioUrl).length,   color: "#D97706" },
              { label: t("opic_stats_typed"),          value: quiz.questions.filter(q => q.examModeTag).length, color: "#059669" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>{t("opic_config_heading")}</h2>
              <button onClick={() => setTab("questions")}
                style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${MLS_NAVY}`, color: MLS_NAVY, background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                {t("btn_add_question")}
              </button>
            </div>

            {quiz.questions.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF" }}>{t("opic_empty")}</div>
            )}

            {Object.entries(opicGroups).map(([tag, questions]) => {
              const color = OPIC_TYPE_COLOR[tag] ?? "#6B7280";
              const label = tCombo(OPIC_EXAM_MODE_KEY_MAP[tag] ?? "describe");
              return (
                <div key={tag} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{label}</span>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>({questions.length})</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {questions.map((q, i) => (
                      <div key={q.linkId} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px", borderRadius: 10,
                        border: "1px solid #E5E7EB", background: "#FAFAFA",
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", width: 20 }}>#{i + 1}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: "#111827" }}>{q.content.slice(0, 100)}{q.content.length > 100 ? "..." : ""}</div>
                          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                            {q.audioUrl
                              ? <span style={{ fontSize: 11, color: "#D97706" }}>audio</span>
                              : <span style={{ fontSize: 11, color: "#9CA3AF" }}>{t("opic_no_audio")}</span>
                            }
                            <span style={{ fontSize: 11, color: "#6B7280" }}>{q.speakingTimeLimitSec ?? 120}s</span>
                          </div>
                        </div>
                        <button onClick={() => setOpicEditQ(q)}
                          style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${color}`, color, background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                          {t("btn_opic_settings")}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: 24, padding: "14px 16px", borderRadius: 10, background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: MLS_NAVY, marginBottom: 6 }}>Hướng dẫn cấu hình OPIC</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#374151", lineHeight: 1.8 }}>
                <li>OPIC MockTest cần 15 câu: 1 orientation + 2 describe/routine + 1 roleplay + 1 q-asking mỗi combo</li>
                <li>Gắn loại câu (ExamModeTag) cho từng câu qua nút Cài đặt</li>
                <li>Upload URL file MP3 để tự phát khi học viên bắt đầu trả lời</li>
                <li>Thời gian nói mặc định là 120 giây mỗi câu</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === "passages" && isVstepQuiz && (
        <VSTEPPassagesPanel
          quizId={id}
          passages={passages}
          questions={quiz.questions}
          onCreatePassage={async (req) => {
            try {
              await createPassage({ quizId: id, ...req }).unwrap();
              showMsg("success", t("toast_passage_create_ok"));
            } catch { showMsg("error", t("toast_passage_create_fail")); }
          }}
          onDeletePassage={async (pgId) => {
            try {
              await deletePassage({ id: pgId, quizId: id }).unwrap();
              showMsg("success", t("toast_passage_delete_ok"));
            } catch { showMsg("error", t("toast_passage_delete_fail")); }
          }}
        />
      )}

      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "90%", maxWidth: 640, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{t("add_modal_title")}</h3>
              <button onClick={() => setShowAddModal(false)} style={{ padding: 6, border: "none", background: "none", cursor: "pointer", fontSize: 20, color: "#9CA3AF" }}>x</button>
            </div>
            <input value={qSearch} onChange={(e) => setQSearch(e.target.value)} placeholder={t("search_ph")}
              style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, marginBottom: 12 }} />
            <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {(bankQuestions?.items ?? []).map((q: QuestionListItem) => {
                const inQuiz = currentlyInQuiz.has(q.id);
                return (
                  <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", background: inQuiz ? "#F0FDF4" : "#fff" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "#111827" }}>{q.content.slice(0, 100)}{q.content.length > 100 ? "..." : ""}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: 11, background: "#E5E7EB", borderRadius: 4, padding: "1px 6px", color: "#6B7280" }}>{q.type}</span>
                        <span style={{ fontSize: 11, background: "#E5E7EB", borderRadius: 4, padding: "1px 6px", color: "#6B7280" }}>{q.difficulty}</span>
                      </div>
                    </div>
                    {inQuiz ? (
                      <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>{t("btn_added")}</span>
                    ) : (
                      <button onClick={() => handleAddQuestion(q.id)}
                        style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: MLS_NAVY, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                        {t("btn_add")}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {opicEditQ && (
        <OPICQuestionModal
          q={opicEditQ}
          onClose={() => setOpicEditQ(null)}
          onSave={(patch) => handleSaveOPICQuestion(opicEditQ, patch)}
        />
      )}
    </div>
  );
}

// ── VSTEP Passages Panel ──────────────────────────────────────────────────────

interface VSTEPPassagesPanelProps {
  quizId: string;
  passages: PassageGroupDto[];
  questions: QuizQuestionDto[];
  onCreatePassage: (req: {
    groupIndex: number; passageType: string; passageText?: string; audioUrl?: string;
    audioPlayLimit: number; preListenSeconds: number; questionIds: string[]; displayOrder: number;
  }) => Promise<void>;
  onDeletePassage: (id: string) => Promise<void>;
}

function VSTEPPassagesPanel({ quizId: _quizId, passages, questions, onCreatePassage, onDeletePassage }: VSTEPPassagesPanelProps) {
  const t = useTranslations("teacher_quiz_detail");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    passageType: "reading" as "reading" | "listening",
    passageText: "",
    audioUrl: "",
    audioPlayLimit: 2,
    preListenSeconds: 20,
    selectedQIds: [] as string[],
  });

  const nextIndex = passages.length;

  function toggleQ(qId: string) {
    setForm((f) => ({
      ...f,
      selectedQIds: f.selectedQIds.includes(qId)
        ? f.selectedQIds.filter((x) => x !== qId)
        : [...f.selectedQIds, qId],
    }));
  }

  async function handleCreate() {
    await onCreatePassage({
      groupIndex: nextIndex,
      passageType: form.passageType,
      passageText: form.passageText || undefined,
      audioUrl: form.audioUrl || undefined,
      audioPlayLimit: form.audioPlayLimit,
      preListenSeconds: form.preListenSeconds,
      questionIds: form.selectedQIds,
      displayOrder: nextIndex,
    });
    setShowForm(false);
    setForm({ passageType: "reading", passageText: "", audioUrl: "", audioPlayLimit: 2, preListenSeconds: 20, selectedQIds: [] });
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>{t("passage_heading")}</h2>
          <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>{t("passage_subtitle")}</p>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#1565C0", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
          {t("btn_add_passage")}
        </button>
      </div>

      {passages.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF", background: "#F9FAFB", borderRadius: 12, border: "1px dashed #D1D5DB" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{t("passage_empty")}</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>{t("passage_empty_hint")}</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {passages.map((pg, i) => {
          const qMap = new Map(questions.map((q) => [q.questionId, q]));
          return (
            <div key={pg.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
                      background: pg.passageType === "listening" ? "#FFF7ED" : "#EFF6FF",
                      color: pg.passageType === "listening" ? "#C2410C" : "#1D4ED8" }}>
                      {pg.passageType === "listening" ? "🎧 Nghe" : "📖 Đọc"}
                    </span>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>Nhóm {i + 1} · {pg.questionIds.length} câu hỏi</span>
                    {pg.passageType === "listening" && (
                      <span style={{ fontSize: 12, color: "#6B7280" }}>Nghe {pg.audioPlayLimit}x · {pg.preListenSeconds}s chuẩn bị</span>
                    )}
                  </div>

                  {pg.passageText && (
                    <div style={{ fontSize: 13, color: "#374151", padding: "10px 12px", background: "#F9FAFB", borderRadius: 8, marginBottom: 8, lineHeight: 1.6,
                      maxHeight: 80, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {pg.passageText.slice(0, 200)}{pg.passageText.length > 200 ? "..." : ""}
                    </div>
                  )}

                  {pg.audioUrl && (
                    <div style={{ fontSize: 12, color: "#D97706", marginBottom: 8 }}>
                      🔊 <a href={pg.audioUrl} target="_blank" rel="noreferrer" style={{ color: "#D97706" }}>{pg.audioUrl.slice(0, 60)}{pg.audioUrl.length > 60 ? "..." : ""}</a>
                    </div>
                  )}

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {pg.questionIds.map((qId) => {
                      const q = qMap.get(qId);
                      return (
                        <span key={qId} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "#E0F2FE", color: "#0369A1" }}>
                          {q ? q.content.slice(0, 40) + (q.content.length > 40 ? "…" : "") : qId.slice(0, 8) + "…"}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <button onClick={() => onDeletePassage(pg.id)}
                  style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #FCA5A5", color: "#DC2626", background: "transparent", cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}>
                  {t("btn_delete")}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div style={{ marginTop: 16, background: "#fff", borderRadius: 14, border: "1px solid #C7D2FE", padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginTop: 0, marginBottom: 18 }}>{t("passage_add_title")}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{t("passage_field_type")}</label>
              <select value={form.passageType} onChange={(e) => setForm((f) => ({ ...f, passageType: e.target.value as "reading" | "listening" }))}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, width: 220 }}>
                <option value="reading">📖 Reading</option>
                <option value="listening">🎧 Listening</option>
              </select>
            </div>

            {form.passageType === "reading" && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{t("passage_field_content")}</label>
                <textarea value={form.passageText} onChange={(e) => setForm((f) => ({ ...f, passageText: e.target.value }))}
                  rows={5} placeholder={t("passage_content_ph")}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
              </div>
            )}

            {form.passageType === "listening" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{t("passage_field_audio")}</label>
                  <input value={form.audioUrl} onChange={(e) => setForm((f) => ({ ...f, audioUrl: e.target.value }))}
                    placeholder={t("passage_audio_ph")}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{t("passage_field_plays")}</label>
                  <select value={form.audioPlayLimit} onChange={(e) => setForm((f) => ({ ...f, audioPlayLimit: parseInt(e.target.value) }))}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13 }}>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{t("passage_field_prep_time")}</label>
                  <input type="number" min={0} max={60} value={form.preListenSeconds}
                    onChange={(e) => setForm((f) => ({ ...f, preListenSeconds: parseInt(e.target.value) || 20 }))}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }} />
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
                {t("passage_field_questions", { n: form.selectedQIds.length })}
              </label>
              <div style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6,
                border: "1px solid #E5E7EB", borderRadius: 8, padding: 8 }}>
                {questions.length === 0 && (
                  <div style={{ color: "#9CA3AF", fontSize: 13, padding: 8 }}>{t("passage_questions_empty")}</div>
                )}
                {questions.map((q) => (
                  <label key={q.questionId} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px",
                    borderRadius: 8, background: form.selectedQIds.includes(q.questionId) ? "#EFF6FF" : "#fff",
                    cursor: "pointer", border: "1px solid transparent",
                    borderColor: form.selectedQIds.includes(q.questionId) ? "#BFDBFE" : "transparent" }}>
                    <input type="checkbox" checked={form.selectedQIds.includes(q.questionId)} onChange={() => toggleQ(q.questionId)}
                      style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, color: "#111827" }}>{q.content.slice(0, 100)}{q.content.length > 100 ? "…" : ""}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{q.type} · {q.skillType}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <button onClick={() => setShowForm(false)}
              style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #D1D5DB", color: "#374151", background: "#fff", cursor: "pointer", fontSize: 13 }}>
              {t("passage_btn_cancel")}
            </button>
            <button onClick={handleCreate}
              style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#1565C0", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              {t("passage_btn_create")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
