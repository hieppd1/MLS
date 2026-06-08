"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useGetPublishedQuizzesQuery } from "@/lib/features/quiz/vstepApi";

const MLS_NAVY = "#1565C0";

export default function TeacherVSTEPPassagesPage() {
  const t = useTranslations("teacher_vstep_passages");
  const { data: quizzes = [], isLoading } = useGetPublishedQuizzesQuery("VSTEPMockTest");

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/teacher/vstep" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
          {t("back")}
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>{t("title")}</h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: "4px 0 0" }}>
          {t("subtitle")}
        </p>
      </div>

      {isLoading && <div style={{ color: "#9CA3AF" }}>{t("loading")}</div>}

      {!isLoading && quizzes.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", background: "#F9FAFB", borderRadius: 16, border: "1px dashed #D1D5DB" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>{t("empty")}</div>
          <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4, marginBottom: 16 }}>
            {t("empty_hint")}
          </div>
          <Link href="/teacher/quizzes/new"
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: MLS_NAVY, color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 13 }}>
            {t("btn_create_quiz")}
          </Link>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {quizzes.map((quiz) => (
          <div key={quiz.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB",
            padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{quiz.title}</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                {quiz.quizType} · {quiz.timeLimitSeconds ? t("minutes", { n: Math.round(quiz.timeLimitSeconds / 60) }) : t("unlimited")}
              </div>
            </div>
            <Link href={`/teacher/quizzes/${quiz.id}?tab=passages`}
              style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${MLS_NAVY}`,
                color: MLS_NAVY, textDecoration: "none", fontWeight: 600, fontSize: 13 }}>
              {t("btn_manage")}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
