"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useGetPlacementOverviewQuery } from "@/lib/features/quiz/analyticsApi";
import { useGetMyPlacementResultQuery } from "@/lib/features/quiz/quizApi";
import { formatDate } from "@/lib/i18nFormat";

const MLS_NAVY = "#1565C0";

const SKILL_KEY_MAP: Record<string, string> = {
  Reading: "reading", Listening: "listening", Speaking: "speaking",
  Writing: "writing", Grammar: "grammar", Vocabulary: "vocabulary",
};

function fmtDate(iso: string) {
  return formatDate(iso);
}

export default function TeacherPlacementPage() {
  const t = useTranslations("teacher_portal");
  const tCommon = useTranslations("common");
  const tLevels = useTranslations("level_labels");
  const tSkill = useTranslations("skill_labels");
  const { data: overview, isLoading } = useGetPlacementOverviewQuery();

  const maxLevel = overview
    ? Math.max(...Object.values(overview.levelDistribution).map(Number), 1)
    : 1;

  if (isLoading) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#9CA3AF" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 40, height: 40, border: "4px solid #E5E7EB", borderTopColor: MLS_NAVY, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
        {tCommon("loading")}
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>{t("placement_title")}</h1>
        <p style={{ fontSize: 14, color: "#6B7280" }}>{t("placement_subtitle")}</p>
      </div>

      {!overview || overview.totalTested === 0 ? (
        <div style={{ background: "#fff", borderRadius: 16, padding: "60px 24px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 8 }}>{t("placement_empty")}</h3>
          <p style={{ color: "#9CA3AF", fontSize: 14 }}>{t("placement_empty_desc")}</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 28 }}>👥</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#111827", marginTop: 8 }}>{overview.totalTested}</div>
              <div style={{ fontSize: 13, color: "#9CA3AF" }}>{t("stat_placed_students")}</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 28 }}>📊</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#111827", marginTop: 8 }}>
                {Object.entries(overview.levelDistribution).sort(([a], [b]) => Number(b) - Number(a))[0]?.[0] ?? "—"}
              </div>
              <div style={{ fontSize: 13, color: "#9CA3AF" }}>{t("stat_popular_level")}</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 28 }}>🌟</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#111827", marginTop: 8 }}>
                {overview.skillAverages
                  ? `${(Object.values(overview.skillAverages).reduce((a, b) => a + b, 0) / (Object.keys(overview.skillAverages).length || 1)).toFixed(0)}%`
                  : "—"}
              </div>
              <div style={{ fontSize: 13, color: "#9CA3AF" }}>Điểm TB tất cả kỹ năng</div>
            </div>
          </div>

          {/* Level distribution */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 20 }}>{t("level_distribution")}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {Object.entries(overview.levelDistribution)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([level, count]) => {
                  const pct = maxLevel > 0 ? ((count as number) / overview.totalTested) * 100 : 0;
                  return (
                    <div key={level} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 90, fontSize: 13, color: "#374151", fontWeight: 600, flexShrink: 0 }}>
                        {tLevels("fallback", { n: Number(level) })} — {tLevels(String(level))}
                      </div>
                      <div style={{ flex: 1, background: "#F3F4F6", borderRadius: 6, height: 12, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: MLS_NAVY, borderRadius: 6, transition: "width 0.5s" }} />
                      </div>
                      <div style={{ width: 60, textAlign: "right", fontSize: 13, color: "#374151", fontWeight: 600, flexShrink: 0 }}>
                        {count as number} ({pct.toFixed(0)}%)
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Skill averages */}
          {overview.skillAverages && Object.keys(overview.skillAverages).length > 0 && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", marginBottom: 24 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 20 }}>Điểm trung bình theo kỹ năng</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {Object.entries(overview.skillAverages).map(([skill, avg]) => {
                  const pct = avg as number;
                  const color = pct >= 60 ? "#16A34A" : pct >= 40 ? "#F59E0B" : "#DC2626";
                  return (
                    <div key={skill} style={{ background: "#F8FAFC", borderRadius: 10, padding: 16 }}>
                      <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>{tSkill(SKILL_KEY_MAP[skill] ?? "comprehensive")}</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color, marginBottom: 6 }}>{pct.toFixed(0)}%</div>
                      <div style={{ background: "#E5E7EB", borderRadius: 4, height: 6, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent results */}
          {overview.recentResults && overview.recentResults.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 16 }}>{t("recent_results")}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {overview.recentResults.slice(0, 10).map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#F9FAFB", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: MLS_NAVY }}>
                        {r.level}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{tLevels("fallback", { n: r.level })} — {tLevels(String(r.level))}</div>
                        <div style={{ fontSize: 11, color: "#9CA3AF" }}>User ID: {r.userId.slice(0, 8)}...</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>{fmtDate(r.testedAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
