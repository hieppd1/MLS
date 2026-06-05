"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/lib/hooks";
import {
  useGetQuizQuery,
  useGetMyAttemptsQuery,
} from "@/lib/features/quiz/quizApi";

const MLS_NAVY = "#1565C0";
const MLS_RED = "#e5173f";

const QUIZ_TYPE_LABEL: Record<string, string> = {
  Placement: "Kiểm tra xếp lớp",
  Chapter: "Kiểm tra chương",
  Midterm: "Kiểm tra giữa kỳ",
  Final: "Kiểm tra cuối kỳ",
  Practice: "Luyện tập",
  Mini: "Bài tập nhỏ",
};

const SKILL_LABEL: Record<string, string> = {
  Reading: "Đọc",
  Listening: "Nghe",
  Speaking: "Nói",
  Writing: "Viết",
  Grammar: "Ngữ pháp",
  Vocabulary: "Từ vựng",
  Mixed: "Tổng hợp",
};

function fmtTime(seconds: number): string {
  if (seconds < 60) return `${seconds} giây`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m} phút ${s} giây` : `${m} phút`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function QuizIntroPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isHydrated = useAppSelector((s) => s.auth.isHydrated);
  const user = useAppSelector((s) => s.auth.user);
  const isAuth = isHydrated && !!user;

  const { data: quiz, isLoading: quizLoading } = useGetQuizQuery(id, { skip: !id });
  const { data: attempts, isLoading: attemptsLoading } = useGetMyAttemptsQuery(id, { skip: !id || !isAuth });

  const bestAttempt = attempts?.reduce(
    (best, a) => (a.percentage > (best?.percentage ?? -1) ? a : best),
    null as (typeof attempts)[0] | null
  );

  function handleStart() {
    if (quiz?.quizType === "AdaptiveQuiz") {
      router.push(`/quiz/${id}/adaptive`);
    } else if (quiz?.skillType === "Speaking") {
      router.push(`/quiz/${id}/speaking`);
    } else if (quiz?.skillType === "Writing") {
      router.push(`/quiz/${id}/writing`);
    } else {
      router.push(`/quiz/${id}/play`);
    }
  }

  if (!isHydrated || quizLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#9CA3AF" }}>
          <div style={{ width: 48, height: 48, border: `4px solid #E5E7EB`, borderTopColor: MLS_NAVY, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#6B7280", marginBottom: 16 }}>Không tìm thấy bài kiểm tra</p>
          <Link href="/my-lesson" style={{ color: MLS_NAVY, textDecoration: "none" }}>← Quay lại</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${MLS_NAVY} 0%, #1976D2 100%)`, padding: "40px 24px 60px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Link href="/my-lesson" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.8)", textDecoration: "none", marginBottom: 24, fontSize: 14 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Quay lại
          </Link>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "4px 14px", marginBottom: 16 }}>
            <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 13 }}>
              {QUIZ_TYPE_LABEL[quiz.quizType] ?? quiz.quizType}
            </span>
            {quiz.skillType && (
              <>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
                <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 13 }}>{SKILL_LABEL[quiz.skillType] ?? quiz.skillType}</span>
              </>
            )}
          </div>
          <h1 style={{ color: "#fff", fontSize: 32, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>{quiz.title}</h1>
          {quiz.description && (
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, lineHeight: 1.6, maxWidth: 600 }}>{quiz.description}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "-32px auto 0", padding: "0 24px 48px" }}>
        {/* Info card */}
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", padding: 28, marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 20 }}>Thông tin bài kiểm tra</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {[
              { label: "Số câu hỏi", value: `${quiz.questions.length} câu` },
              { label: "Thời gian", value: quiz.timeLimitSeconds ? fmtTime(quiz.timeLimitSeconds) : "Không giới hạn" },
              { label: "Điểm đậu", value: `${quiz.passingScore}%` },
              { label: "Câu hỏi ngẫu nhiên", value: quiz.shuffleQuestions ? "Có" : "Không" },
              { label: "Hiển thị đáp án", value: quiz.showCorrectAnswer ? "Sau khi nộp" : "Không" },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Best result */}
        {bestAttempt && (
          <div style={{
            background: bestAttempt.passed ? "#F0FDF4" : "#FFF7ED",
            border: `1px solid ${bestAttempt.passed ? "#BBF7D0" : "#FED7AA"}`,
            borderRadius: 12, padding: "16px 20px", marginBottom: 20,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Kết quả tốt nhất của bạn</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: bestAttempt.passed ? "#16A34A" : "#EA580C" }}>
                {bestAttempt.percentage.toFixed(0)}%
                <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 8 }}>{bestAttempt.passed ? "✓ Đậu" : "✗ Chưa đậu"}</span>
              </div>
            </div>
            <Link href={`/quiz/${id}/result/${bestAttempt.id}`} style={{ color: MLS_NAVY, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
              Xem chi tiết →
            </Link>
          </div>
        )}

        {/* Attempt history */}
        {attempts && attempts.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Lịch sử làm bài ({attempts.length})</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {attempts.slice(0, 5).map((a, i) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#F9FAFB", borderRadius: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: a.passed ? "#DCFCE7" : "#FEE2E2",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 700,
                      color: a.passed ? "#16A34A" : MLS_RED,
                    }}>
                      {attempts.length - i}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{a.percentage.toFixed(0)}% — {a.passed ? "Đậu" : "Chưa đậu"}</div>
                      <div style={{ fontSize: 12, color: "#9CA3AF" }}>{a.submittedAt ? fmtDate(a.submittedAt) : "Chưa nộp"}</div>
                    </div>
                  </div>
                  {a.status === "Completed" && (
                    <Link href={`/quiz/${id}/result/${a.id}`} style={{ fontSize: 13, color: MLS_NAVY, textDecoration: "none", fontWeight: 600 }}>
                      Xem
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Start / Auth block */}
        {isAuth ? (
          <button
            onClick={handleStart}
            style={{
              width: "100%", padding: "18px 0", borderRadius: 12, border: "none", cursor: "pointer",
              background: MLS_NAVY, color: "#fff", fontSize: 18, fontWeight: 700,
              boxShadow: `0 4px 16px rgba(21,101,192,0.4)`,
            }}
          >
            {attempts && attempts.length > 0 ? "Làm lại bài kiểm tra" : "Bắt đầu làm bài"}
          </button>
        ) : (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <p style={{ color: "#6B7280", marginBottom: 16 }}>Bạn cần đăng nhập để làm bài kiểm tra</p>
            <Link href="/login" style={{
              display: "inline-block", padding: "14px 40px", borderRadius: 10,
              background: MLS_NAVY, color: "#fff", textDecoration: "none",
              fontSize: 16, fontWeight: 600,
            }}>
              Đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
