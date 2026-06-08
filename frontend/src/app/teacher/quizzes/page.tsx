"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/i18nFormat";
import {
  useListQuizzesQuery,
  useDeleteQuizMutation,
  usePublishQuizMutation,
  useArchiveQuizMutation,
} from "@/lib/features/quiz/quizApi";
import { QUIZ_TYPE_LABEL, EXAM_MODE_LABEL, EXAM_MODE_COLOR } from "@/lib/config/portalConfig";
import { useTranslations } from "next-intl";

const MLS_NAVY = "#1565C0";
const MLS_RED = "#e5173f";

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  Draft:     { bg: "#F3F4F6", text: "#6B7280" },
  Published: { bg: "#DCFCE7", text: "#16A34A" },
  Archived:  { bg: "#FEF3C7", text: "#D97706" },
};

const STATUS_KEY_MAP: Record<string, string> = {
  Draft: "draft", Published: "published_short", Archived: "archived",
};

function fmtDate(iso: string): string {
  return formatDate(iso);
}

export default function TeacherQuizzesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [examModeFilter, setExamModeFilter] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const t = useTranslations("teacher_portal");
  const tStatus = useTranslations("quiz_status_labels");
  const tQType = useTranslations("quiz_type_labels");
  const tCommon = useTranslations("common");

  const { data, isFetching, refetch } = useListQuizzesQuery({ page, pageSize: 20, search: search || undefined, status: statusFilter || undefined, examMode: examModeFilter || undefined });
  const [deleteQuiz, { isLoading: deleting }] = useDeleteQuizMutation();
  const [publishQuiz] = usePublishQuizMutation();
  const [archiveQuiz] = useArchiveQuizMutation();

  const quizzes = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  function showMsg(type: "success" | "error", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  }

  async function handleDelete(id: string) {
    try {
      await deleteQuiz(id).unwrap();
      setConfirmDelete(null);
      showMsg("success", t("toast_delete_quiz_ok"));
    } catch {
      showMsg("error", t("toast_delete_quiz_fail"));
    }
  }

  async function handlePublish(id: string) {
    try {
      await publishQuiz(id).unwrap();
      showMsg("success", t("toast_publish_quiz_ok"));
    } catch {
      showMsg("error", t("toast_publish_quiz_fail"));
    }
  }

  async function handleArchive(id: string) {
    try {
      await archiveQuiz(id).unwrap();
      showMsg("success", t("toast_archive_ok"));
    } catch {
      showMsg("error", t("toast_action_fail"));
    }
  }

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>{t("quiz_title")}</h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>{t("quiz_count", { total })}</p>
        </div>
        <Link href="/teacher/quizzes/new" style={{
          padding: "10px 20px", borderRadius: 10, background: MLS_NAVY, color: "#fff",
          textDecoration: "none", fontWeight: 700, fontSize: 14,
        }}>
          {t("create_quiz")}
        </Link>
      </div>

      {msg && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 10, background: msg.type === "success" ? "#F0FDF4" : "#FEF2F2", color: msg.type === "success" ? "#16A34A" : MLS_RED, fontSize: 14 }}>
          {msg.text}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} style={{ display: "flex", gap: 8 }}>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("search_quiz")}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, outline: "none", width: 220 }}
          />
          <button type="submit" style={{ padding: "8px 16px", borderRadius: 8, background: "#F3F4F6", border: "none", cursor: "pointer", fontSize: 14 }}>{tCommon("search")}</button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, background: "#fff" }}
        >
          <option value="">{tStatus("all")}</option>
          <option value="Draft">{tStatus("draft")}</option>
          <option value="Published">{tStatus("published")}</option>
          <option value="Archived">{tStatus("archived")}</option>
        </select>
        <select
          value={examModeFilter}
          onChange={(e) => { setExamModeFilter(e.target.value); setPage(1); }}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, background: "#fff" }}
        >
          <option value="">{t("all_platforms")}</option>
          <option value="Standard">{tQType("standard")}</option>
          <option value="OPIC">OPIC</option>
          <option value="VSTEP">VSTEP</option>
        </select>
        {(search || statusFilter || examModeFilter) && (
          <button onClick={() => { setSearch(""); setSearchInput(""); setStatusFilter(""); setExamModeFilter(""); setPage(1); }}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer", fontSize: 14, color: "#6B7280" }}>
            {tCommon("clear_filter")}
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E5E7EB" }}>
              {[t("col_quiz_name"), t("col_platform"), t("col_type"), t("col_questions"), t("col_pass_score"), t("col_status"), t("col_created"), t("col_actions")].map((h, i) => (
                <th key={i} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isFetching && quizzes.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>Đang tải...</td></tr>
            ) : quizzes.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>{t("no_quizzes")}</td></tr>
            ) : (
              quizzes.map((q) => {
                const sc = STATUS_COLOR[q.status] ?? STATUS_COLOR.Draft;
                const mc = EXAM_MODE_COLOR[q.examMode ?? "Standard"] ?? EXAM_MODE_COLOR["Standard"];
                return (
                  <tr key={q.id} style={{ borderBottom: "1px solid #F3F4F6" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>{q.title}</div>
                      {q.description && <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2, maxWidth: 280, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{q.description}</div>}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, background: mc.bg, color: mc.color, fontSize: 12, fontWeight: 600 }}>
                        {EXAM_MODE_LABEL[q.examMode ?? "Standard"] ?? (q.examMode || tQType("standard"))}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: 13, color: "#374151" }}>{QUIZ_TYPE_LABEL[q.quizType] ?? q.quizType}</span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 14, color: "#374151" }}>{q.questionCount}</td>
                    <td style={{ padding: "14px 16px", fontSize: 14, color: "#374151" }}>{q.passingScore}%</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, background: sc.bg, color: sc.text, fontSize: 12, fontWeight: 600 }}>
                        {tStatus(STATUS_KEY_MAP[q.status] ?? "draft")}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#6B7280" }}>{fmtDate(q.createdAt)}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                        <Link href={`/teacher/quizzes/${q.id}`} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${MLS_NAVY}`, color: MLS_NAVY, textDecoration: "none", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>Sửa</Link>
                        {q.status === "Draft" && (
                          <button onClick={() => handlePublish(q.id)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #16A34A", color: "#16A34A", background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{tStatus("published_short")}</button>
                        )}
                        {q.status === "Published" && (
                          <button onClick={() => handleArchive(q.id)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #D97706", color: "#D97706", background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{t("btn_archive")}</button>
                        )}
                        <Link href={`/teacher/quizzes/${q.id}/analytics`} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #7C3AED", color: "#7C3AED", textDecoration: "none", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{t("btn_stats")}</Link>
                        <button onClick={() => setConfirmDelete(q.id)} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${MLS_RED}`, color: MLS_RED, background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{t("btn_delete")}</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #E5E7EB" }}>
            <span style={{ fontSize: 13, color: "#6B7280" }}>{t("page_of", { page, totalPages })}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #D1D5DB", background: page === 1 ? "#F9FAFB" : "#fff", cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 13 }}>
                ←
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #D1D5DB", background: page === totalPages ? "#F9FAFB" : "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: 13 }}>
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 380, width: "90%" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 8 }}>{t("modal_delete_quiz_title")}</h3>
            <p style={{ color: "#6B7280", marginBottom: 20, fontSize: 14 }}>{t("modal_delete_quiz_confirm")}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer", fontWeight: 600 }}>
                {tCommon("cancel")}
              </button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={deleting}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: MLS_RED, color: "#fff", cursor: "pointer", fontWeight: 700 }}>
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
