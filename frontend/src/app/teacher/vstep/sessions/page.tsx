"use client";

import Link from "next/link";
import { useState } from "react";

// Note: sessions are stored in VSTEPSessions table, but there's no teacher-facing
// list query yet. We show a placeholder that links to the quiz detail pages.
// A future enhancement can add a GetAllVSTEPSessionsQuery on the backend.

const MLS_NAVY = "#1565C0";

const BAND_COLOR: Record<string, string> = {
  C1: "#7C3AED", B2: "#1D4ED8", B1: "#059669", A2: "#D97706",
};

const MOCK_STATS = [
  { band: "C1", count: 3,  pct: 15 },
  { band: "B2", count: 8,  pct: 40 },
  { band: "B1", count: 7,  pct: 35 },
  { band: "A2", count: 2,  pct: 10 },
];

export default function TeacherVSTEPSessionsPage() {
  const [_filter, setFilter] = useState("all");

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/teacher/vstep" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
          ← Tổng quan VSTEP
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>Phiên thi VSTEP</h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: "4px 0 0" }}>Lịch sử thi và kết quả của học viên</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {MOCK_STATS.map(({ band, count, pct }) => (
          <div key={band} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: BAND_COLOR[band] ?? "#374151" }}>{band}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{count}</div>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>{pct}% học viên</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["all", "C1", "B2", "B1", "A2"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid #E5E7EB",
              background: _filter === f ? MLS_NAVY : "#fff",
              color: _filter === f ? "#fff" : "#374151",
              cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            {f === "all" ? "Tất cả" : `Band ${f}`}
          </button>
        ))}
      </div>

      {/* Placeholder */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🚧</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
          Danh sách phiên thi đang được phát triển
        </div>
        <div style={{ fontSize: 14, color: "#6B7280", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
          Tính năng này sẽ hiển thị toàn bộ lịch sử thi của học viên, bao gồm điểm từng kỹ năng,
          band đạt được và thời gian thi. Hiện tại bạn có thể xem kết quả qua trang học viên.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
          <Link href="/teacher/vstep"
            style={{ padding: "9px 20px", borderRadius: 8, border: `1px solid ${MLS_NAVY}`, color: MLS_NAVY, textDecoration: "none", fontWeight: 600, fontSize: 13 }}>
            ← Tổng quan VSTEP
          </Link>
          <Link href="/teacher/quizzes"
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: MLS_NAVY, color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 13 }}>
            Quản lý bài thi
          </Link>
        </div>
      </div>
    </div>
  );
}
