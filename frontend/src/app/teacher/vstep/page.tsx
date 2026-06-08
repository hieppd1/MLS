"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useGetPublishedQuizzesQuery } from "@/lib/features/quiz/vstepApi";

const MLS_NAVY = "#1565C0";

export default function TeacherVSTEPPage() {
  const t = useTranslations("teacher_portal");
  const tBand = useTranslations("vstep_band_labels");
  const tCommon = useTranslations("common");
  const { data: publishedQuizzes = [], isLoading } = useGetPublishedQuizzesQuery("VSTEPMockTest");

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>{t("vstep_title")}</h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: "6px 0 0" }}>
          {t("vstep_subtitle")}
        </p>
      </div>

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: t("vstep_published_count"), value: publishedQuizzes.length, color: MLS_NAVY, icon: "📋" },
          { label: t("vstep_scoring"), value: "0–10", color: "#059669", icon: "📊" },
          { label: t("vstep_max_band"), value: "C1", color: "#7C3AED", icon: "🏅" },
          { label: t("vstep_total_time"), value: tBand("duration_minutes", { n: 172 }), color: "#D97706", icon: "⏱" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Band table */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginTop: 0, marginBottom: 16 }}>{t("vstep_band_table")}</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {[t("col_band"), t("col_avg_score"), t("col_min_each_skill"), t("col_description")].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#6B7280", fontWeight: 600, borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { band: "C1", avg: "≥ 8.0", min: "≥ 6.0", desc: tBand("b2_plus"), color: "#7C3AED", bg: "#F5F3FF" },
                { band: "B2", avg: "≥ 6.0", min: "≥ 4.0", desc: tBand("b2"), color: "#1D4ED8", bg: "#EFF6FF" },
                { band: "B1", avg: "≥ 4.0", min: "—",     desc: tBand("b1"),        color: "#059669", bg: "#F0FDF4" },
                { band: "A2", avg: "≥ 2.5", min: "—",     desc: tBand("a2"),           color: "#D97706", bg: "#FFFBEB" },
              ].map(({ band, avg, min, desc, color, bg }) => (
                <tr key={band} style={{ background: bg }}>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #E5E7EB" }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color }}>{band}</span>
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #E5E7EB", fontWeight: 600, color }}>{avg}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #E5E7EB", color: "#374151" }}>{min}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid #E5E7EB", color: "#374151" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Published quizzes */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>{t("vstep_published_tests")}</h2>
          <Link href="/teacher/quizzes/new"
            style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: MLS_NAVY, color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 13 }}>
            {t("vstep_create_test")}
          </Link>
        </div>

        {isLoading && <div style={{ color: "#9CA3AF", padding: "16px 0" }}>{tCommon("loading")}</div>}

        {!isLoading && publishedQuizzes.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
            <div style={{ fontWeight: 600 }}>{t("vstep_no_tests")}</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>{t("vstep_create_first")}</div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {publishedQuizzes.map((q) => (
            <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
              borderRadius: 10, border: "1px solid #E5E7EB", background: "#FAFAFA" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{q.title}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                  {q.quizType} · {q.duration ? tBand("duration_minutes", { n: Math.round(q.duration / 60) }) : t("no_limit")}
                </div>
              </div>
              <Link href={`/teacher/quizzes/${q.id}`}
                style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${MLS_NAVY}`, color: MLS_NAVY,
                  textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
                {t("btn_detail")}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 24 }}>
        {[
          { href: "/teacher/vstep/sessions", label: t("vstep_sessions_link"), desc: t("vstep_sessions_desc"), icon: "📋" },
          { href: "/teacher/quizzes", label: t("vstep_quiz_link"), desc: t("vstep_quiz_desc"), icon: "📝" },
        ].map(({ href, label, desc, icon }) => (
          <Link key={href} href={href} style={{ display: "flex", alignItems: "center", gap: 14,
            padding: "16px 18px", borderRadius: 12, border: "1px solid #E5E7EB", background: "#fff",
            textDecoration: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 26 }}>{icon}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{label}</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
