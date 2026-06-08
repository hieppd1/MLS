"use client";

import { useState } from "react";
import { formatDate } from "@/lib/i18nFormat";
import {
  useListQuestionsQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  type QuestionForm,
  type QuestionListItem,
  type QuestionDetail,
  type QuestionOptionForm,
} from "@/lib/features/quiz/questionApi";
import { useTranslations } from "next-intl";

const MLS_NAVY = "#1565C0";
const MLS_RED = "#e5173f";

const Q_TYPES = ["SingleChoice", "MultipleChoice", "TrueFalse", "FillBlank", "Matching", "Ordering"];
const SKILL_TYPES = ["Reading", "Listening", "Speaking", "Writing", "Grammar", "Vocabulary", "Mixed"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const SKILL_KEY_MAP: Record<string, string> = {
  Reading: "reading", Listening: "listening", Speaking: "speaking",
  Writing: "writing", Grammar: "grammar", Vocabulary: "vocabulary", Mixed: "comprehensive",
};
const DIFF_COLOR: Record<string, string> = { Easy: "#16A34A", Medium: "#D97706", Hard: "#DC2626" };
const DIFF_BG: Record<string, string> = { Easy: "#DCFCE7", Medium: "#FEF3C7", Hard: "#FEE2E2" };

function emptyForm(): QuestionForm {
  return {
    content: "", type: "SingleChoice", skillType: "Grammar", difficulty: "Easy",
    score: 1, explanation: "", tags: "",
    options: [
      { content: "", isCorrect: false, displayOrder: 1 },
      { content: "", isCorrect: false, displayOrder: 2 },
      { content: "", isCorrect: true, displayOrder: 3 },
      { content: "", isCorrect: false, displayOrder: 4 },
    ],
  };
}

function QuestionFormModal({
  initial, onSave, onClose, saving,
}: {
  initial: QuestionForm;
  onSave: (f: QuestionForm) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<QuestionForm>(initial);
  const t = useTranslations("teacher_portal");
  const tSkill = useTranslations("skill_labels");
  const tCommon = useTranslations("common");
  const TYPE_LABELS: Record<string, string> = {
    SingleChoice: t("qtype_single"), MultipleChoice: t("qtype_multi"), TrueFalse: t("qtype_truefalse"),
    FillBlank: t("qtype_fill"), Matching: t("qtype_matching"), Ordering: t("qtype_ordering"),
  };
  const DIFF_LABELS: Record<string, string> = { Easy: t("difficulty_easy"), Medium: t("difficulty_medium"), Hard: t("difficulty_hard") };

  function setF<K extends keyof QuestionForm>(k: K, v: QuestionForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function setOption(i: number, key: keyof QuestionOptionForm, val: unknown) {
    const opts = form.options.map((o, idx) => idx === i ? { ...o, [key]: val } : o);
    setF("options", opts);
  }

  function addOption() {
    setF("options", [...form.options, { content: "", isCorrect: false, displayOrder: form.options.length + 1 }]);
  }

  function removeOption(i: number) {
    setF("options", form.options.filter((_, idx) => idx !== i).map((o, idx) => ({ ...o, displayOrder: idx + 1 })));
  }

  function markCorrect(i: number) {
    const isMC = form.type === "MultipleChoice";
    const opts = form.options.map((o, idx) => ({
      ...o,
      isCorrect: isMC ? (idx === i ? !o.isCorrect : o.isCorrect) : idx === i,
    }));
    setF("options", opts);
  }

  const showOptions = !["FillBlank"].includes(form.type);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "20px 16px" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 680, margin: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
            {initial.content ? t("modal_question_edit") : t("modal_question_create")}
          </h3>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: "#9CA3AF" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{t("field_question_content")}</label>
            <textarea value={form.content} onChange={(e) => setF("content", e.target.value)}
              rows={3} placeholder={t("field_question_ph")}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{t("field_question_type")}</label>
              <select value={form.type} onChange={(e) => setF("type", e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, background: "#fff" }}>
                {Q_TYPES.map((qt) => <option key={qt} value={qt}>{TYPE_LABELS[qt]}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{t("field_skill")}</label>
              <select value={form.skillType} onChange={(e) => setF("skillType", e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, background: "#fff" }}>
                {SKILL_TYPES.map((st) => <option key={st} value={st}>{tSkill(SKILL_KEY_MAP[st] ?? "comprehensive")}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{t("field_difficulty_label")}</label>
              <select value={form.difficulty} onChange={(e) => setF("difficulty", e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, background: "#fff" }}>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{DIFF_LABELS[d] ?? d}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{t("field_points")}</label>
              <input type="number" min="0.1" step="0.1" value={form.score}
                onChange={(e) => setF("score", parseFloat(e.target.value) || 1)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Tags</label>
              <input value={form.tags ?? ""} onChange={(e) => setF("tags", e.target.value)}
                placeholder="grammar,unit5,present-simple"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }} />
            </div>
          </div>

          {showOptions && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{t("answers_label")}</label>
                <button onClick={addOption} style={{ fontSize: 12, color: MLS_NAVY, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>{t("add_answer")}</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {form.options.map((opt, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => markCorrect(i)} style={{
                      width: 24, height: 24, borderRadius: form.type === "MultipleChoice" ? 4 : "50%", flexShrink: 0,
                      border: `2px solid ${opt.isCorrect ? "#16A34A" : "#D1D5DB"}`,
                      background: opt.isCorrect ? "#16A34A" : "transparent", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {opt.isCorrect && <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#fff"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </button>
                    <input value={opt.content} onChange={(e) => setOption(i, "content", e.target.value)}
                      placeholder={t("answer_ph", { n: i + 1 })}
                      style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${opt.isCorrect ? "#16A34A" : "#D1D5DB"}`, fontSize: 13 }} />
                    {form.options.length > 2 && (
                      <button onClick={() => removeOption(i)} style={{ border: "none", background: "none", cursor: "pointer", color: "#DC2626", fontSize: 16, flexShrink: 0 }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{t("field_explanation")}</label>
            <textarea value={form.explanation ?? ""} onChange={(e) => setF("explanation", e.target.value)}
              rows={2} placeholder={t("explanation_ph")}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>{tCommon("cancel")}</button>
          <button onClick={() => onSave(form)} disabled={saving}
            style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: MLS_NAVY, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14, opacity: saving ? 0.7 : 1 }}>
            {saving ? t("btn_saving") : t("btn_save_question")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeacherQuestionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [diffFilter, setDiffFilter] = useState("");
  const [modal, setModal] = useState<"none" | "create" | "edit">("none");
  const [editTarget, setEditTarget] = useState<QuestionListItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const t = useTranslations("teacher_portal");
  const tCommonPage = useTranslations("common");
  const TYPE_LABELS: Record<string, string> = {
    SingleChoice: t("qtype_single"), MultipleChoice: t("qtype_multi"), TrueFalse: t("qtype_truefalse"),
    FillBlank: t("qtype_fill"), Matching: t("qtype_matching"), Ordering: t("qtype_ordering"),
  };
  const DIFF_LABELS: Record<string, string> = { Easy: t("difficulty_easy"), Medium: t("difficulty_medium"), Hard: t("difficulty_hard") };

  const { data, isFetching } = useListQuestionsQuery({
    page, pageSize: 25,
    search: search || undefined,
    type: typeFilter || undefined,
    difficulty: diffFilter || undefined,
  });

  const [createQuestion, { isLoading: creating }] = useCreateQuestionMutation();
  const [updateQuestion, { isLoading: updatingQ }] = useUpdateQuestionMutation();
  const [deleteQuestion, { isLoading: deleting }] = useDeleteQuestionMutation();

  const questions = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);

  function showMsg(type: "success" | "error", text: string) {
    setMsg({ type, text }); setTimeout(() => setMsg(null), 3500);
  }

  async function handleSave(form: QuestionForm) {
    try {
      if (modal === "create") {
        await createQuestion(form).unwrap();
        showMsg("success", t("toast_create_question_ok"));
      } else if (editTarget) {
        await updateQuestion({ id: editTarget.id, ...form }).unwrap();
        showMsg("success", t("toast_update_question_ok"));
      }
      setModal("none");
      setEditTarget(null);
    } catch {
      showMsg("error", modal === "create" ? t("toast_create_question_fail") : t("toast_update_question_fail"));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteQuestion(id).unwrap();
      setConfirmDelete(null);
      showMsg("success", t("toast_delete_question_ok"));
    } catch {
      showMsg("error", t("toast_delete_question_fail"));
    }
  }

  const initialForm: QuestionForm = emptyForm();

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>{t("questions_title")}</h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>{t("questions_count", { total })}</p>
        </div>
        <button onClick={() => setModal("create")}
          style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: MLS_NAVY, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
          {t("create_question")}
        </button>
      </div>

      {msg && (
        <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 8, background: msg.type === "success" ? "#F0FDF4" : "#FEF2F2", color: msg.type === "success" ? "#16A34A" : MLS_RED, fontSize: 13 }}>
          {msg.text}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} style={{ display: "flex", gap: 8 }}>
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("search_question")}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, width: 220 }} />
          <button type="submit" style={{ padding: "8px 14px", borderRadius: 8, background: "#F3F4F6", border: "none", cursor: "pointer", fontSize: 14 }}>Tìm</button>
        </form>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, background: "#fff" }}>
          <option value="">{t("all_types")}</option>
          {Q_TYPES.map((qt) => <option key={qt} value={qt}>{TYPE_LABELS[qt]}</option>)}
        </select>
        <select value={diffFilter} onChange={(e) => { setDiffFilter(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, background: "#fff" }}>
          <option value="">{t("all_difficulties")}</option>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{DIFF_LABELS[d] ?? d}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E5E7EB" }}>
              {[t("col_question"), "Loại", t("col_skill"), t("col_difficulty"), t("col_points"), "Ngày tạo", "Thao tác"].map((h, i) => (
                <th key={i} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isFetching && questions.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>Đang tải...</td></tr>
            ) : questions.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>{t("no_questions")}</td></tr>
            ) : (
              questions.map((q) => (
                <tr key={q.id} style={{ borderBottom: "1px solid #F3F4F6" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "13px 14px", maxWidth: 320 }}>
                    <div style={{ fontSize: 14, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                      dangerouslySetInnerHTML={{ __html: q.content.slice(0, 100) }} />
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <span style={{ fontSize: 12, background: "#EFF6FF", color: MLS_NAVY, borderRadius: 4, padding: "2px 8px", fontWeight: 600 }}>{TYPE_LABELS[q.type] ?? q.type}</span>
                  </td>
                  <td style={{ padding: "13px 14px", fontSize: 13, color: "#374151" }}>{q.skillType}</td>
                  <td style={{ padding: "13px 14px" }}>
                    <span style={{ fontSize: 12, background: DIFF_BG[q.difficulty], color: DIFF_COLOR[q.difficulty], borderRadius: 4, padding: "2px 8px", fontWeight: 600 }}>{DIFF_LABELS[q.difficulty] ?? q.difficulty}</span>
                  </td>
                  <td style={{ padding: "13px 14px", fontSize: 13, color: "#374151" }}>{q.score}</td>
                  <td style={{ padding: "13px 14px", fontSize: 12, color: "#9CA3AF" }}>{formatDate(q.createdAt)}</td>
                  <td style={{ padding: "13px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { setEditTarget(q); setModal("edit"); }}
                        style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${MLS_NAVY}`, color: MLS_NAVY, background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Sửa</button>
                      <button onClick={() => setConfirmDelete(q.id)}
                        style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${MLS_RED}`, color: MLS_RED, background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", borderTop: "1px solid #E5E7EB" }}>
            <span style={{ fontSize: 13, color: "#6B7280" }}>{t("page_of", { page, totalPages })}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #D1D5DB", background: page === 1 ? "#F9FAFB" : "#fff", cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 13 }}>←</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #D1D5DB", background: page === totalPages ? "#F9FAFB" : "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: 13 }}>→</button>
            </div>
          </div>
        )}
      </div>

      {/* Question form modal */}
      {(modal === "create" || modal === "edit") && (
        <QuestionFormModal
          initial={modal === "create" ? initialForm : (editTarget ? { ...initialForm, content: editTarget.content, type: editTarget.type, skillType: editTarget.skillType, difficulty: editTarget.difficulty, score: editTarget.score } : initialForm)}
          onSave={handleSave}
          onClose={() => { setModal("none"); setEditTarget(null); }}
          saving={creating || updatingQ}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 24, maxWidth: 360, width: "90%" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{t("modal_delete_question_title")}</h3>
            <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 20 }}>{t("modal_delete_question_confirm")}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer", fontWeight: 600 }}>{tCommonPage("cancel")}</button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={deleting}
                style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: MLS_RED, color: "#fff", cursor: "pointer", fontWeight: 700 }}>
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
