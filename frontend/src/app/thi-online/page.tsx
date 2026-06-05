"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "../_components/AppShell";
import { useListQuizzesQuery, useGetQuizLeaderboardQuery } from "@/lib/features/quiz/quizApi";
import { useAppSelector } from "@/lib/hooks";
import type { RootState } from "@/lib/store";

/* ── Constants ──────────────────────────────────────────────────────────────── */

const EXAM_MODE_TABS = [
  { key: "all",      label: "Tất cả",   color: "#1565C0" },
  { key: "Standard", label: "Standard", color: "#6366F1" },
  { key: "OPIC",     label: "OPIC",     color: "#16A34A" },
  { key: "VSTEP",    label: "VSTEP",    color: "#EA580C" },
  { key: "Live",     label: "Thi Live", color: "#DC2626" },
];

const EXAM_MODE_COLORS: Record<string, { bg: string; text: string }> = {
  Standard: { bg: "#EFF6FF", text: "#1D4ED8" },
  OPIC:     { bg: "#F0FDF4", text: "#15803D" },
  VSTEP:    { bg: "#FFF7ED", text: "#C2410C" },
  Live:     { bg: "#FFF1F2", text: "#BE123C" },
};

const QUIZ_TYPE_LABELS: Record<string, string> = {
  PlacementTest:   "Xếp lớp",
  PracticeQuiz:    "Luyện tập",
  SegmentQuiz:     "Theo bài học",
  AdaptiveQuiz:    "Thích nghi",
  MockTest:        "Thi thử",
  OPICMockTest:    "OPIC Mock Test",
  RealtimeQuiz:    "Thi Live",
  SpeakingTest:    "Kiểm tra nói",
  WritingTest:     "Kiểm tra viết",
  VSTEPMockTest:   "VSTEP Mock",
  VSTEPListening:  "VSTEP Nghe",
  VSTEPReading:    "VSTEP Đọc",
  VSTEPWriting:    "VSTEP Viết",
  VSTEPSpeaking:   "VSTEP Nói",
};

const AVATAR_COLORS = ["#1565C0", "#7B1FA2", "#2E7D32", "#C62828", "#E65100", "#00695C", "#5D4037", "#283593", "#AD1457", "#00838F"];

function colorForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

/* ── Routing helper ─────────────────────────────────────────────────────────── */
function quizRoute(quiz: { id: string; quizType: string; examMode: string }): string {
  if (quiz.examMode === "OPIC") return `/opic/survey?quizId=${quiz.id}`;
  if (quiz.examMode === "VSTEP") return `/vstep?quizId=${quiz.id}`;
  if (quiz.quizType === "PlacementTest") return "/placement-test";
  if (quiz.quizType === "RealtimeQuiz") return "/realtime/join";
  return `/quiz/${quiz.id}`;
}

/* ── Quiz Card ──────────────────────────────────────────────────────────────── */
function QuizCard({ quiz, onClick }: {
  quiz: { id: string; title: string; description: string | null; quizType: string; examMode: string; questionCount: number; passingScore: number; timeLimitSeconds: number | null; };
  onClick: () => void;
}) {
  const modeColor = EXAM_MODE_COLORS[quiz.examMode] ?? { bg: "#F3F4F6", text: "#374151" };
  const typeLabel = QUIZ_TYPE_LABELS[quiz.quizType] ?? quiz.quizType;
  const mins = quiz.timeLimitSeconds ? Math.ceil(quiz.timeLimitSeconds / 60) : null;

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px", background: "white",
        borderBottom: "1px solid #f3f4f6", cursor: "pointer",
        transition: "background 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "#f8faff")}
      onMouseLeave={e => (e.currentTarget.style.background = "white")}
    >
      {/* Avatar placeholder */}
      <div style={{
        width: 48, height: 48, borderRadius: 10, flexShrink: 0,
        background: modeColor.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18,
      }}>
        {quiz.examMode === "OPIC" ? "🎙" : quiz.examMode === "VSTEP" ? "🏅" : quiz.quizType === "RealtimeQuiz" ? "⚡" : quiz.quizType === "PlacementTest" ? "📊" : "📝"}
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: 0, lineHeight: 1.3 }}>{quiz.title}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
            background: modeColor.bg, color: modeColor.text,
          }}>{typeLabel}</span>
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>{quiz.questionCount} câu</span>
          {mins && <span style={{ fontSize: 12, color: "#9CA3AF" }}>· {mins} phút</span>}
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>· Đạt {quiz.passingScore}%</span>
        </div>
        {quiz.description && (
          <p style={{ fontSize: 12, color: "#6B7280", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {quiz.description}
          </p>
        )}
      </div>

      {/* Start button */}
      <button
        onClick={e => { e.stopPropagation(); onClick(); }}
        style={{
          flexShrink: 0, padding: "6px 16px",
          borderRadius: 8, border: "none", cursor: "pointer",
          background: quiz.examMode === "OPIC" ? "#16A34A" : quiz.quizType === "RealtimeQuiz" ? "#DC2626" : "#1565C0",
          color: "white", fontSize: 12, fontWeight: 600,
        }}
      >
        {quiz.quizType === "RealtimeQuiz" ? "Tham gia" : "Làm bài"}
      </button>
    </div>
  );
}

/* ── Leaderboard ────────────────────────────────────────────────────────────── */
function Leaderboard() {
  const [bxhTab, setBxhTab] = useState<"week" | "month" | "year">("week");
  const { data: entries, isLoading, isFetching } = useGetQuizLeaderboardQuery({ period: bxhTab, limit: 10 });

  return (
    <aside className="thi-online-scroll" style={{
      width: 260, flexShrink: 0,
      background: "white", borderLeft: "1px solid #e5e7eb",
      display: "flex", flexDirection: "column",
      overflowY: "auto", zIndex: 10,
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 0", borderBottom: "1px solid #f3f4f6" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 10px" }}>🏆 Bảng xếp hạng</h3>
        <div style={{ display: "flex", gap: 0, marginBottom: 0 }}>
          {(["week", "month", "year"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setBxhTab(t)}
              style={{
                flex: 1, padding: "6px 4px", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
                background: "transparent",
                color: bxhTab === t ? "#1565C0" : "#9CA3AF",
                borderBottom: bxhTab === t ? "2px solid #1565C0" : "2px solid transparent",
              }}
            >
              {t === "week" ? "BXH Tuần" : t === "month" ? "BXH Tháng" : "BXH Năm"}
            </button>
          ))}
        </div>
      </div>

      {/* Entries */}
      <div style={{ padding: "8px 0", flex: 1 }}>
        {/* Column header */}
        <div style={{
          display: "grid", gridTemplateColumns: "28px 1fr 52px 36px",
          padding: "4px 12px", gap: 6,
        }}>
          <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>XH</span>
          <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>Học viên</span>
          <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textAlign: "right" }}>Đạt</span>
          <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textAlign: "right" }}>%</span>
        </div>

        {(isLoading || isFetching) && !entries ? (
          <div style={{ padding: "24px 12px", textAlign: "center", color: "#9CA3AF", fontSize: 12 }}>
            Đang tải...
          </div>
        ) : !entries || entries.length === 0 ? (
          <div style={{ padding: "24px 12px", textAlign: "center", color: "#9CA3AF", fontSize: 12 }}>
            Chưa có dữ liệu xếp hạng
          </div>
        ) : (
          entries.map((entry) => {
            const color = colorForName(entry.name);
            const initial = (entry.name.trim().split(/\s+/).slice(-1)[0] || "?")[0]?.toUpperCase() ?? "?";
            return (
              <div
                key={entry.userId}
                style={{
                  display: "grid", gridTemplateColumns: "28px 1fr 52px 36px",
                  padding: "7px 12px", gap: 6, alignItems: "center",
                  background: entry.rank <= 3 ? (entry.rank === 1 ? "#FFFBEB" : entry.rank === 2 ? "#F8FAFF" : "#F0FDF4") : "transparent",
                }}
              >
                {/* Rank */}
                <span style={{
                  fontSize: entry.rank <= 3 ? 14 : 12,
                  fontWeight: 700,
                  color: entry.rank === 1 ? "#F59E0B" : entry.rank === 2 ? "#9CA3AF" : entry.rank === 3 ? "#CD7F32" : "#6B7280",
                }}>
                  {entry.rank <= 3 ? (entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉") : entry.rank}
                </span>
                {/* Name + avatar */}
                <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                  {entry.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.avatarUrl} alt={entry.name} style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background: color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white", fontSize: 10, fontWeight: 700,
                    }}>
                      {initial}
                    </div>
                  )}
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {entry.name}
                  </span>
                </div>
                {/* Done/Total */}
                <span style={{ fontSize: 11, color: "#6B7280", textAlign: "right" }}>
                  {entry.done}/{entry.total}
                </span>
                {/* Pct */}
                <span style={{
                  fontSize: 11, fontWeight: 700, textAlign: "right",
                  color: entry.pct >= 90 ? "#16A34A" : entry.pct >= 70 ? "#1565C0" : "#EA580C",
                }}>
                  {entry.pct}%
                </span>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */
export default function ThiOnlinePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  // Map our UI tabs to examMode filter
  const examModeFilter = activeTab === "all" ? undefined
    : activeTab === "Live" ? "Standard"  // RealtimeQuiz has examMode=Standard
    : activeTab;

  const quizTypeFilter = activeTab === "Live" ? "RealtimeQuiz" : undefined;

  const { data: quizData, isLoading } = useListQuizzesQuery({
    status: "Published",
    pageSize: 100,
    examMode: examModeFilter,
    quizType: quizTypeFilter,
    search: search || undefined,
  });

  const quizzes = useMemo(() => {
    let items = quizData?.items ?? [];
    // Extra filter for Live tab (RealtimeQuiz is examMode=Standard, so filter by type)
    if (activeTab === "Live") {
      items = items.filter(q => q.quizType === "RealtimeQuiz");
    }
    return items;
  }, [quizData, activeTab]);

  return (
    <>
      <style>{`
        .thi-online-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; transition: scrollbar-color 0.25s ease; }
        .thi-online-scroll:hover { scrollbar-color: rgba(0,0,0,0.25) transparent; }
        .thi-online-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .thi-online-scroll::-webkit-scrollbar-track { background: transparent; }
        .thi-online-scroll::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 99px;
          border: 2px solid transparent;
          background-clip: content-box;
          transition: background 0.25s ease;
        }
        .thi-online-scroll:hover::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.25); background-clip: content-box; }
        .thi-online-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.4); background-clip: content-box; }
        @media (max-width: 1024px) { .thi-online-bxh { display: none !important; } }
      `}</style>

      <AppShell activeNavId="thi-online">
        {/* ═══ COL 3: Quiz List ══════════════════════════════════════════════ */}
        <main className="thi-online-scroll" style={{
          flex: 1, minWidth: 0, overflowY: "auto",
          background: "#f9fafb",
        }}>
          {/* Page header */}
          <div style={{
            padding: "16px 20px 0", background: "white",
            borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Thi Online</h1>
              <div style={{ flex: 1 }} />
              {/* Search */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F3F4F6", borderRadius: 8, padding: "6px 12px" }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm bài thi..."
                  style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#111827", width: 160 }}
                />
              </div>
            </div>

            {/* Mode filter tabs */}
            <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
              {EXAM_MODE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: "8px 18px", border: "none", background: "transparent",
                    cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
                    color: activeTab === tab.key ? tab.color : "#6B7280",
                    borderBottom: activeTab === tab.key ? `2px solid ${tab.color}` : "2px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quiz list */}
          <div style={{ background: "white", margin: "12px 16px", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            {isLoading ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "#9CA3AF" }}>
                <div style={{ display: "inline-block", width: 32, height: 32, border: "3px solid #E5E7EB", borderTop: "3px solid #1565C0", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <p style={{ marginTop: 8, fontSize: 13 }}>Đang tải...</p>
              </div>
            ) : quizzes.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#9CA3AF" }}>
                <p style={{ fontSize: 32, margin: "0 0 8px" }}>📋</p>
                <p style={{ fontSize: 14, fontWeight: 500 }}>Chưa có bài thi nào</p>
                <p style={{ fontSize: 12 }}>Thử chọn danh mục khác hoặc tìm kiếm</p>
              </div>
            ) : (
              quizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onClick={() => router.push(quizRoute(quiz))}
                />
              ))
            )}
          </div>

          {/* Count */}
          {!isLoading && quizzes.length > 0 && (
            <p style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", padding: "8px 0 16px" }}>
              {quizzes.length} bài thi
            </p>
          )}
        </main>

        {/* ═══ COL 4: Leaderboard ════════════════════════════════════════════ */}
        <div className="thi-online-bxh" style={{ display: "flex", alignSelf: "stretch" }}>
          <Leaderboard />
        </div>
      </AppShell>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
