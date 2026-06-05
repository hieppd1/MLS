"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useGetOPICStudentsQuery,
  type OPICStudentResultItem,
} from "@/lib/features/teacher/teacherApi";

const MLS_NAVY = "#1565C0";

const LEVEL_COLORS: Record<string, string> = {
  NH: "#9CA3AF", IL: "#60A5FA", IM1: "#34D399", IM2: "#FBBF24",
  IM3: "#F97316", IH: "#A855F7", AL: "#EF4444",
};

const LEVELS_FILTER = ["", "NH", "IL", "IM1", "IM2", "IM3", "IH", "AL"];

function MiniBar({ value, color, max = 10 }: { value: number; color: string; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div title={`${value.toFixed(1)}`} style={{ flex: 1, height: 6, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
    </div>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN");
}

export default function OPICStudentsPage() {
  const [page, setPage] = useState(1);
  const [levelFilter, setLevelFilter] = useState("");
  const PAGE_SIZE = 20;

  const { data, isLoading, error } = useGetOPICStudentsQuery({ page, pageSize: PAGE_SIZE });

  const items: OPICStudentResultItem[] = (data?.items ?? []).filter((s) =>
    !levelFilter || s.assignedLevel === levelFilter
  );

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>Kết quả học viên OPIC</h1>
          <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
            {data?.total ?? 0} kết quả tổng cộng
          </p>
        </div>
        <Link href="/teacher/opic"
          style={{ padding: "9px 18px", borderRadius: 10, border: `1px solid ${MLS_NAVY}`, color: MLS_NAVY, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
          ← Analytics
        </Link>
      </div>

      {/* Level filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {LEVELS_FILTER.map((lvl) => (
          <button key={lvl ?? "all"} onClick={() => { setLevelFilter(lvl); setPage(1); }}
            style={{
              padding: "5px 14px", borderRadius: 20, border: "1px solid",
              borderColor: levelFilter === lvl ? (LEVEL_COLORS[lvl] ?? MLS_NAVY) : "#D1D5DB",
              background: levelFilter === lvl ? (LEVEL_COLORS[lvl] ?? MLS_NAVY) + "20" : "#fff",
              color: levelFilter === lvl ? (LEVEL_COLORS[lvl] ?? MLS_NAVY) : "#6B7280",
              cursor: "pointer", fontSize: 12, fontWeight: 600,
            }}>
            {lvl || "Tất cả"}
          </button>
        ))}
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF" }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ width: 36, height: 36, border: "4px solid #E5E7EB", borderTopColor: MLS_NAVY, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
          Đang tải...
        </div>
      )}

      {!isLoading && error && (
        <div style={{ padding: "20px 24px", borderRadius: 12, background: "#FEF2F2", color: "#DC2626", fontSize: 14 }}>
          Không thể tải dữ liệu. Vui lòng thử lại.
        </div>
      )}

      {!isLoading && !error && (
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "2px solid #E5E7EB" }}>
                {["Học viên", "Level", "Tổng điểm", "Kỹ năng (hover = điểm)", "Ngôn ngữ", "Ngày thi"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6B7280", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "32px 16px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
                    Không có dữ liệu
                  </td>
                </tr>
              )}
              {items.map((s, i) => (
                <tr key={s.userId + s.testedAt} style={{ borderBottom: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#111827", fontWeight: 600 }}>
                    {s.userName}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, borderRadius: 6, padding: "3px 10px",
                      background: (LEVEL_COLORS[s.assignedLevel] ?? "#9CA3AF") + "20",
                      color: LEVEL_COLORS[s.assignedLevel] ?? "#9CA3AF",
                    }}>
                      {s.assignedLevel}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: MLS_NAVY }}>
                      {s.overallScore.toFixed(1)}
                    </span>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>/10</span>
                  </td>
                  <td style={{ padding: "12px 16px", minWidth: 160 }}>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <MiniBar value={s.pronunciationScore}  color="#7C3AED" />
                      <MiniBar value={s.fluencyScore}        color="#0891B2" />
                      <MiniBar value={s.coherenceScore}      color="#059669" />
                      <MiniBar value={s.vocabularyScore}     color="#D97706" />
                      <MiniBar value={s.taskAchievementScore} color={MLS_NAVY} />
                    </div>
                    <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                      {[s.pronunciationScore, s.fluencyScore, s.coherenceScore, s.vocabularyScore, s.taskAchievementScore].map((v, idx) => (
                        <span key={idx} style={{ flex: 1, fontSize: 9, textAlign: "center", color: "#9CA3AF" }}>{v.toFixed(0)}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#6B7280" }}>
                    {s.language === "vi" ? "🇻🇳 VI" : s.language === "en" ? "🇺🇸 EN" : s.language === "ko" ? "🇰🇷 KO" : s.language}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>
                    {fmtDate(s.testedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 20 }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", color: "#374151", fontSize: 13, opacity: page === 1 ? 0.5 : 1 }}>
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .map((p, i, arr) => (
              <>
                {i > 0 && arr[i - 1] !== p - 1 && <span key={`dots-${p}`} style={{ padding: "7px 4px", color: "#9CA3AF", fontSize: 13 }}>…</span>}
                <button key={p} onClick={() => setPage(p)}
                  style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid", borderColor: p === page ? MLS_NAVY : "#D1D5DB", background: p === page ? MLS_NAVY : "#fff", color: p === page ? "#fff" : "#374151", cursor: "pointer", fontWeight: p === page ? 700 : 400, fontSize: 13 }}>
                  {p}
                </button>
              </>
            ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", color: "#374151", fontSize: 13, opacity: page === totalPages ? 0.5 : 1 }}>
            →
          </button>
        </div>
      )}
    </div>
  );
}
