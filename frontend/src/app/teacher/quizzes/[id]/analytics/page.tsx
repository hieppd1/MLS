"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useGetQuizAnalyticsQuery } from "@/lib/features/quiz/analyticsApi";

const MLS_NAVY = "#1565C0";
const MLS_RED = "#e5173f";

function BarChart({ value, max, color = MLS_NAVY }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ background: "#F3F4F6", borderRadius: 4, height: 10, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.5s" }} />
    </div>
  );
}

export default function QuizAnalyticsPage() {
  const t = useTranslations("teacher_quiz_analytics");
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useGetQuizAnalyticsQuery(id, { skip: !id });

  if (isLoading) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#9CA3AF" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 40, height: 40, border: "4px solid #E5E7EB", borderTopColor: MLS_NAVY, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
        {t("loading")}
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 32 }}>
        <Link href={`/teacher/quizzes/${id}`} style={{ color: "#6B7280", textDecoration: "none", fontSize: 14 }}>{t("back")}</Link>
        <p style={{ marginTop: 20, color: "#9CA3AF" }}>{t("empty")}</p>
      </div>
    );
  }

  const maxAnswers = Math.max(...(data.questionStats?.map((q) => q.totalAnswers) ?? [1]), 1);

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Link href={`/teacher/quizzes/${id}`} style={{ fontSize: 13, color: "#6B7280", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>{t("back_edit")}</Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>{t("title", { title: data.title })}</h1>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: t("stat_attempts"), value: data.totalAttempts, icon: "📝" },
          { label: t("stat_completed"), value: data.completedAttempts, icon: "✅" },
          { label: t("stat_avg"), value: `${data.averagePercentage?.toFixed(1) ?? 0}%`, icon: "📊" },
          { label: t("stat_pass_rate"), value: `${((data.passRate ?? 0) * 100).toFixed(0)}%`, icon: "🏆" },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 14, padding: "20px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#111827", marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 13, color: "#9CA3AF" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Question stats */}
      {data.questionStats && data.questionStats.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 20 }}>{t("questions_heading")}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {data.questionStats.map((q, i) => {
              const pct = (q.correctRate * 100).toFixed(0);
              const color = q.correctRate >= 0.6 ? "#16A34A" : q.correctRate >= 0.4 ? "#F59E0B" : MLS_RED;
              return (
                <div key={q.questionId} style={{ borderBottom: i < data.questionStats.length - 1 ? "1px solid #F3F4F6" : "none", paddingBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "flex-start", gap: 8 }}>
                    <span style={{ fontSize: 14, color: "#111827", flex: 1 }}>
                      <strong style={{ color: "#6B7280" }}>{t("q_label", { n: i + 1 })}</strong> {q.content.slice(0, 120)}{q.content.length > 120 ? "..." : ""}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 800, color, flexShrink: 0 }}>{pct}%</span>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <BarChart value={q.correctRate * 100} max={100} color={color} />
                    </div>
                    <span style={{ fontSize: 12, color: "#9CA3AF", flexShrink: 0 }}>{t("q_answers", { n: q.totalAnswers })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(!data.questionStats || data.questionStats.length === 0) && data.totalAttempts === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <p>{t("no_data")}</p>
        </div>
      )}
    </div>
  );
}
