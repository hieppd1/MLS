"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useGetAttemptResultQuery } from "@/lib/features/quiz/quizApi";
import { useAppSelector } from "@/lib/hooks";
import { useTranslations } from "next-intl";

const MLS_NAVY = "#1565C0";
const MLS_RED = "#e5173f";

function fmtTime(seconds: number): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}p ${s}s` : `${s}s`;
}

export default function QuizResultPage() {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();
  const router = useRouter();
  const isHydrated = useAppSelector((s) => s.auth.isHydrated);

  const { data: result, isLoading } = useGetAttemptResultQuery(attemptId, { skip: !attemptId || !isHydrated });
  const t = useTranslations("quiz");

  if (!isHydrated || isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center", color: "#9CA3AF" }}>
          <div style={{ width: 48, height: 48, border: "4px solid #E5E7EB", borderTopColor: MLS_NAVY, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p>{t("loading_result")}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#6B7280", marginBottom: 16 }}>Không tìm thấy kết quả</p>
          <Link href={`/quiz/${id}`} style={{ color: MLS_NAVY, textDecoration: "none" }}>← Quay lại</Link>
        </div>
      </div>
    );
  }

  const scoreColor = result.passed ? "#16A34A" : result.percentage >= 50 ? "#F59E0B" : MLS_RED;
  const scoreBg = result.passed ? "#F0FDF4" : result.percentage >= 50 ? "#FFFBEB" : "#FEF2F2";

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      {/* Header */}
      <div style={{ background: result.passed ? `linear-gradient(135deg, #16A34A, #22C55E)` : `linear-gradient(135deg, ${MLS_NAVY}, #1976D2)`, padding: "36px 24px 56px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <Link href={`/quiz/${id}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.8)", textDecoration: "none", marginBottom: 20, fontSize: 14 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Quay lại
          </Link>
          <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            {result.passed ? t("congrats") : t("result_title")}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 16 }}>
            {result.passed ? t("passed_msg") : t("failed_msg")}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "-32px auto 0", padding: "0 24px 48px" }}>
        {/* Score card */}
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", padding: 28, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{
                width: 100, height: 100, borderRadius: "50%", background: scoreBg,
                border: `4px solid ${scoreColor}`, display: "flex", alignItems: "center",
                justifyContent: "center", flexDirection: "column", margin: "0 auto 12px",
              }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: scoreColor }}>{result.percentage.toFixed(0)}%</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: scoreColor }}>
                {result.passed ? t("passed_badge") : t("failed_badge")}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, flex: 2 }}>
              {[
              { label: t("score_label"), value: result.score.toFixed(1) },
              { label: t("time_spent"), value: fmtTime(result.timeTaken) },
              { label: t("correct_count"), value: `${result.correctCount}/${result.answeredCount}` },
              { label: t("manual_grading"), value: result.hasManualGrading ? t("manual_pending") : t("manual_none") },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: "#F8FAFC", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
          <button
            onClick={() => router.push(`/quiz/${id}/play`)}
            style={{ flex: 1, padding: "14px 0", borderRadius: 10, border: `2px solid ${MLS_NAVY}`, background: "transparent", color: MLS_NAVY, cursor: "pointer", fontWeight: 700, fontSize: 15 }}
          >
            {t("redo")}
          </button>
          <Link href="/my-lesson" style={{
            flex: 1, padding: "14px 0", borderRadius: 10, border: "none",
            background: MLS_NAVY, color: "#fff", textDecoration: "none",
            fontWeight: 700, fontSize: 15, textAlign: "center", display: "block",
          }}>
            {t("back_to_learn")}
          </Link>
        </div>

        {/* Question review */}
        {result.questions && result.questions.length > 0 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 16 }}>{t("question_detail")}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {result.questions.map((q, i) => (
                <div key={q.questionId} style={{
                  background: "#fff", borderRadius: 12, padding: "20px 22px",
                  borderLeft: `4px solid ${q.isCorrect ? "#22C55E" : MLS_RED}`,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: "#9CA3AF" }}>{t("question_n", {n: i + 1})}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: q.isCorrect ? "#16A34A" : MLS_RED }}>
                      {q.isCorrect ? `+${q.earned.toFixed(1)} điểm` : "0 điểm"}
                    </span>
                  </div>
                  <p style={{ fontSize: 15, color: "#111827", marginBottom: 12, lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: q.content }} />
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {q.yourAnswer && (
                      <div style={{ background: q.isCorrect ? "#DCFCE7" : "#FEE2E2", borderRadius: 6, padding: "6px 12px" }}>
                        <span style={{ fontSize: 12, color: "#6B7280" }}>{t("your_answer_label")}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: q.isCorrect ? "#16A34A" : MLS_RED }}>{q.yourAnswer}</span>
                      </div>
                    )}
                    {!q.isCorrect && q.correctAnswer && (
                      <div style={{ background: "#DCFCE7", borderRadius: 6, padding: "6px 12px" }}>
                        <span style={{ fontSize: 12, color: "#6B7280" }}>{t("correct_answer_label")}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#16A34A" }}>{q.correctAnswer}</span>
                      </div>
                    )}
                  </div>
                  {q.explanation && (
                    <div style={{ marginTop: 10, padding: "8px 12px", background: "#EFF6FF", borderRadius: 6, fontSize: 13, color: "#1D4ED8", lineHeight: 1.5 }}>
                      💡 {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
