"use client";

import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import AppShell from "../../../_components/AppShell";
import {
  useGetSessionQuery,
  useGetResultQuery,
  VSTEP_BAND_LABELS,
  VSTEP_PARTS,
  type VSTEPPart,
} from "@/lib/features/quiz/vstepApi";
import { formatDate } from "@/lib/i18nFormat";

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
  const t = useTranslations("vstep_player");

  const { data: session, isLoading: sessionLoading } = useGetSessionQuery(sessionId);
  const { data: result, isLoading: resultLoading } = useGetResultQuery(sessionId, {
    skip: !session?.isCompleted,
  });

  const partLabel = (part: VSTEPPart) => t(`skill_${part.toLowerCase()}`);

  if (sessionLoading || resultLoading) {
    return (
      <AppShell>
        <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>{t("result_loading")}</div>
      </AppShell>
    );
  }

  if (!session?.isCompleted || !result) {
    return (
      <AppShell>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>⏳</div>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#111827", marginTop: 12 }}>{t("no_result_h2")}</h2>
          <p style={{ color: "#6B7280", marginTop: 8 }}>
            {t("no_result_msg")}
          </p>
          <button
            onClick={() => router.push(`/vstep/${sessionId}`)}
            style={{ marginTop: 20, padding: "10px 28px", borderRadius: 99, background: "#EA580C", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}
          >
            {t("back_to_session")}
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
          {t("retry_test_back")}
        </button>

        {/* Band hero */}
        <div style={{
          background: `linear-gradient(135deg, ${bandColor}15, ${bandColor}08)`,
          border: `2px solid ${bandColor}30`,
          borderRadius: 20, padding: "32px 24px", textAlign: "center", marginBottom: 24,
        }}>
          <div style={{ fontSize: 56 }}>🏅</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: bandColor, margin: "12px 0 4px" }}>
            {t("band_label", { band: result.assignedBand })}
          </h1>
          <p style={{ fontSize: 18, color: "#374151", margin: 0 }}>{bandLabel}</p>
          <div style={{ marginTop: 16, fontSize: 32, fontWeight: 700, color: "#111827" }}>
            {result.overallScore.toFixed(1)}
            <span style={{ fontSize: 16, color: "#6B7280", fontWeight: 400 }}>{t("avg_score_suffix")}</span>
          </div>
          <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 8 }}>
            {t("tested_at", { date: formatDate(result.testedAt) })}
          </p>
        </div>

        {/* Per-skill scores */}
        <div style={{
          background: "white", borderRadius: 16, padding: 24,
          boxShadow: "0 2px 12px rgba(0,0,0,.08)", marginBottom: 20,
        }}>
          <h3 style={{ fontWeight: 600, fontSize: 15, color: "#111827", marginBottom: 16 }}>{t("skill_scores")}</h3>
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
                      {partLabel(part)}
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
                    {pct.toFixed(0)}{t("percent_max")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Band table */}
        <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,.08)", marginBottom: 24 }}>
          <h3 style={{ fontWeight: 600, fontSize: 15, color: "#111827", marginBottom: 14 }}>{t("band_scale")}</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #F3F4F6" }}>
                <th style={{ textAlign: "left", padding: "6px 10px", color: "#6B7280", fontWeight: 600 }}>{t("band_col")}</th>
                <th style={{ textAlign: "left", padding: "6px 10px", color: "#6B7280", fontWeight: 600 }}>{t("condition_col")}</th>
              </tr>
            </thead>
            <tbody>
              {[
                { band: "C1", cond: t("band_c1_cond") },
                { band: "B2", cond: t("band_b2_cond") },
                { band: "B1", cond: t("band_b1_cond") },
                { band: "A2", cond: t("band_a2_cond") },
              ].map(r => (
                <tr key={r.band} style={{
                  background: result.assignedBand === r.band ? `${bandColor}12` : "white",
                  borderBottom: "1px solid #F3F4F6",
                }}>
                  <td style={{ padding: "8px 10px", fontWeight: result.assignedBand === r.band ? 700 : 400, color: result.assignedBand === r.band ? bandColor : "#374151" }}>
                    {result.assignedBand === r.band ? t("band_arrow_prefix") : ""}{r.band}
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
            {t("retry_test")}
          </button>
          <button
            onClick={() => router.push("/courses")}
            style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#EA580C", color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            {t("explore_courses")}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
