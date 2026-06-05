"use client";

import { useRouter, useParams } from "next/navigation";
import AppShell from "../../../_components/AppShell";
import {
  useGetSessionQuery,
  useGetResultQuery,
  VSTEP_BAND_LABELS,
  VSTEP_PART_LABELS,
  VSTEP_PARTS,
  type VSTEPPart,
} from "@/lib/features/quiz/vstepApi";

const PART_COLORS: Record<VSTEPPart, string> = {
  Listening: "#3B82F6",
  Reading:   "#10B981",
  Writing:   "#F59E0B",
  Speaking:  "#EF4444",
};

const SCORE_KEYS: Record<VSTEPPart, "listeningScore" | "readingScore" | "writingScore" | "speakingScore"> = {
  Listening: "listeningScore",
  Reading:   "readingScore",
  Writing:   "writingScore",
  Speaking:  "speakingScore",
};

export default function VSTEPResultPage() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();

  const { data: session, isLoading: sessionLoading } = useGetSessionQuery(sessionId);
  const { data: result, isLoading: resultLoading } = useGetResultQuery(sessionId, {
    skip: !session?.isCompleted,
  });

  if (sessionLoading || resultLoading) {
    return (
      <AppShell>
        <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Đang tải kết quả...</div>
      </AppShell>
    );
  }

  if (!session?.isCompleted || !result) {
    return (
      <AppShell>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>⏳</div>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#111827", marginTop: 12 }}>Chưa có kết quả</h2>
          <p style={{ color: "#6B7280", marginTop: 8 }}>
            Hãy hoàn thành tất cả 4 phần thi để nhận kết quả band VSTEP.
          </p>
          <button
            onClick={() => router.push(`/vstep/${sessionId}`)}
            style={{ marginTop: 20, padding: "10px 28px", borderRadius: 99, background: "#EA580C", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}
          >
            Về trang phiên thi
          </button>
        </div>
      </AppShell>
    );
  }

  const bandLabel = VSTEP_BAND_LABELS[result.assignedBand] ?? result.assignedBand;
  const bandColor = result.assignedBand === "C1" ? "#7C3AED"
    : result.assignedBand === "B2" ? "#1D4ED8"
    : result.assignedBand === "B1" ? "#059669"
    : result.assignedBand === "A2" ? "#D97706"
    : "#6B7280";

  return (
    <AppShell>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 16px" }}>
        <button
          onClick={() => router.push("/vstep")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", fontSize: 14, marginBottom: 20 }}
        >
          ← Thi lại
        </button>

        {/* Band hero */}
        <div style={{
          background: `linear-gradient(135deg, ${bandColor}15, ${bandColor}08)`,
          border: `2px solid ${bandColor}30`,
          borderRadius: 20, padding: "32px 24px", textAlign: "center", marginBottom: 24,
        }}>
          <div style={{ fontSize: 56 }}>🏅</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: bandColor, margin: "12px 0 4px" }}>
            Band {result.assignedBand}
          </h1>
          <p style={{ fontSize: 18, color: "#374151", margin: 0 }}>{bandLabel}</p>
          <div style={{ marginTop: 16, fontSize: 32, fontWeight: 700, color: "#111827" }}>
            {result.overallScore.toFixed(1)}
            <span style={{ fontSize: 16, color: "#6B7280", fontWeight: 400 }}> / 10 điểm trung bình</span>
          </div>
          <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 8 }}>
            Ngày thi: {new Date(result.testedAt).toLocaleDateString("vi-VN")}
          </p>
        </div>

        {/* Per-skill scores */}
        <div style={{
          background: "white", borderRadius: 16, padding: 24,
          boxShadow: "0 2px 12px rgba(0,0,0,.08)", marginBottom: 20,
        }}>
          <h3 style={{ fontWeight: 600, fontSize: 15, color: "#111827", marginBottom: 16 }}>Điểm theo kỹ năng</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {VSTEP_PARTS.map(part => {
              const s = result[SCORE_KEYS[part]];
              const pct = (s / 10) * 100;
              const color = PART_COLORS[part];
              return (
                <div key={part} style={{
                  padding: 16, borderRadius: 12,
                  border: `2px solid ${color}20`, background: `${color}08`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: "#374151" }}>
                      {VSTEP_PART_LABELS[part]}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 18, color }}>{s.toFixed(1)}</span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 6, borderRadius: 99, background: "#E5E7EB" }}>
                    <div style={{
                      height: "100%", borderRadius: 99, background: color,
                      width: `${pct}%`, transition: "width 0.5s",
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                    {pct.toFixed(0)}% (tối đa 10 điểm)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Band table */}
        <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,.08)", marginBottom: 24 }}>
          <h3 style={{ fontWeight: 600, fontSize: 15, color: "#111827", marginBottom: 14 }}>Thang band VSTEP</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #F3F4F6" }}>
                <th style={{ textAlign: "left", padding: "6px 10px", color: "#6B7280", fontWeight: 600 }}>Band</th>
                <th style={{ textAlign: "left", padding: "6px 10px", color: "#6B7280", fontWeight: 600 }}>Điều kiện</th>
              </tr>
            </thead>
            <tbody>
              {[
                { band: "C1", cond: "TB ≥ 8.0 VÀ thấp nhất ≥ 6.0" },
                { band: "B2", cond: "TB ≥ 6.0 VÀ thấp nhất ≥ 4.0" },
                { band: "B1", cond: "TB ≥ 4.0" },
                { band: "A2", cond: "TB ≥ 2.5" },
              ].map(r => (
                <tr key={r.band} style={{
                  background: result.assignedBand === r.band ? `${bandColor}12` : "white",
                  borderBottom: "1px solid #F3F4F6",
                }}>
                  <td style={{ padding: "8px 10px", fontWeight: result.assignedBand === r.band ? 700 : 400, color: result.assignedBand === r.band ? bandColor : "#374151" }}>
                    {result.assignedBand === r.band ? "▶ " : ""}{r.band}
                  </td>
                  <td style={{ padding: "8px 10px", color: "#6B7280" }}>{r.cond}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => router.push("/vstep")}
            style={{ flex: 1, padding: "12px", borderRadius: 12, border: "2px solid #EA580C", background: "white", color: "#EA580C", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            Thi lại
          </button>
          <button
            onClick={() => router.push("/courses")}
            style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#EA580C", color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            Khám phá khóa học →
          </button>
        </div>
      </div>
    </AppShell>
  );
}
