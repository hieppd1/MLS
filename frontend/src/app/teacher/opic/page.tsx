"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useGetOPICAnalyticsQuery } from "@/lib/features/teacher/teacherApi";

const MLS_NAVY = "#1565C0";

const LEVELS = ["NH", "IL", "IM1", "IM2", "IM3", "IH", "AL"];
const LEVEL_COLORS: Record<string, string> = {
  NH: "#9CA3AF", IL: "#60A5FA", IM1: "#34D399", IM2: "#FBBF24",
  IM3: "#F97316", IH: "#A855F7", AL: "#EF4444",
};

function ScoreBar({ value, color, max = 10 }: { value: number; color: string; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", minWidth: 32, textAlign: "right" }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

export default function OPICAnalyticsPage() {
  const t = useTranslations("teacher_portal");
  const ta = useTranslations("teacher_opic_analytics");
  const SKILL_KEYS = [
    { key: "avgPronunciation" as const,   label: ta("skill_pronunciation"),   color: "#7C3AED" },
    { key: "avgFluency" as const,         label: ta("skill_fluency"),         color: "#0891B2" },
    { key: "avgCoherence" as const,       label: ta("skill_coherence"),       color: "#059669" },
    { key: "avgVocabulary" as const,      label: ta("skill_vocabulary"),      color: "#D97706" },
    { key: "avgTaskAchievement" as const, label: ta("skill_task_completion"), color: MLS_NAVY },
  ];
  const { data, isLoading, error } = useGetOPICAnalyticsQuery();

  if (isLoading) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#9CA3AF" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 40, height: 40, border: "4px solid #E5E7EB", borderTopColor: MLS_NAVY, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
        Đang tải...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ padding: "20px 24px", borderRadius: 12, background: "#FEF2F2", color: "#DC2626", fontSize: 14 }}>
          {t("opic_error")}
        </div>
      </div>
    );
  }

  const completionRate = data.totalSessions > 0
    ? Math.round((data.completedSessions / data.totalSessions) * 100)
    : 0;

  const maxDistVal = Math.max(...Object.values(data.levelDistribution), 1);

  // Most common level
  const topLevel = Object.entries(data.levelDistribution)
    .sort(([, a], [, b]) => b - a)[0]?.[0] ?? "—";

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>{t("opic_analytics_title")}</h1>
          <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>{t("opic_subtitle")}</p>
        </div>
        <Link href="/teacher/opic/students"
          style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${MLS_NAVY}`, color: MLS_NAVY, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
          {t("opic_view_students")}
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: ta("stat_total_sessions"),  value: data.totalSessions,     color: MLS_NAVY,   icon: "📋" },
          { label: ta("stat_completed"),       value: data.completedSessions,  color: "#059669",  icon: "✅" },
          { label: ta("stat_completion_rate"), value: `${completionRate}%`,    color: "#D97706",  icon: "📊" },
          { label: t("stat_avg_score_opic"),  value: data.avgOverallScore.toFixed(1), color: "#7C3AED", icon: "⭐" },
          { label: ta("stat_common_level"),    value: topLevel,                color: LEVEL_COLORS[topLevel] ?? "#6B7280", icon: "🏆" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        {/* Level distribution */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 18, marginTop: 0 }}>{t("opic_level_dist")}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {LEVELS.map((lvl) => {
              const count = data.levelDistribution[lvl] ?? 0;
              const pct = Math.round((count / maxDistVal) * 100);
              return (
                <div key={lvl} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: LEVEL_COLORS[lvl], width: 36, textAlign: "right" }}>{lvl}</span>
                  <div style={{ flex: 1, height: 22, background: "#F3F4F6", borderRadius: 6, overflow: "hidden", position: "relative" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: LEVEL_COLORS[lvl], borderRadius: 6, transition: "width 0.6s ease" }} />
                    {count > 0 && (
                      <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, fontWeight: 700, color: "#fff" }}>
                        {count}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: "#6B7280", width: 30 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Skill breakdown */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 18, marginTop: 0 }}>{ta("section_skill_avg")}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {SKILL_KEYS.map(({ key, label, color }) => (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
                </div>
                <ScoreBar value={data.skillScores[key]} color={color} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #E5E7EB" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{ta("section_overall_avg")}</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: MLS_NAVY }}>{data.avgOverallScore.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
