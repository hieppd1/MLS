"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/lib/hooks";
import SpeakingRecorder from "@/components/quiz/SpeakingRecorder";
import { useGetQuizPreviewQuery, useStartQuizAttemptMutation } from "@/lib/features/quiz/quizApi";
import { useState, useEffect } from "react";

const MLS_NAVY = "#1565C0";
const MLS_RED = "#e5173f";

export default function SpeakingQuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isHydrated = useAppSelector((s) => s.auth.isHydrated);
  const token = useAppSelector((s) => s.auth.accessToken);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);

  const { data: quiz, isLoading } = useGetQuizPreviewQuery(id, { skip: !id || !isHydrated });
  const [startAttempt] = useStartQuizAttemptMutation();

  // Auto-start attempt when page loads (speaking quiz = single question)
  useEffect(() => {
    if (!started && quiz && token && isHydrated) {
      handleStart();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, token, isHydrated]);

  const handleStart = async () => {
    if (!token || !quiz) return;
    try {
      const result = await startAttempt({ quizId: id }).unwrap();
      setAttemptId(result.attemptId);
      // Store the first question's ID for upload
      if (result.questions?.[0]) {
        setQuestionId(result.questions[0].questionId);
      }
      setStarted(true);
    } catch (err: any) {
      if (err?.status === 429 || err?.data?.code === "TEST_QUOTA_EXCEEDED") {
        setStartError(err?.data?.message ?? "Bạn đã hết lượt thi. Vui lòng mua khoá học.");
        setIsQuotaError(true);
      } else {
        setStartError(err instanceof Error ? err.message : "Không thể bắt đầu bài thi.");
      }
    }
  };

  const handleRecordingDone = (submissionId: string) => {
    router.push(`/quiz/${id}/ai-result/${submissionId}`);
  };

  if (!isHydrated || isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center", color: "#9CA3AF" }}>
          <div style={{ width: 48, height: 48, border: "4px solid #E5E7EB", borderTopColor: MLS_NAVY, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p>Đang chuẩn bị...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#6B7280", marginBottom: 16 }}>Vui lòng đăng nhập để làm bài</p>
          <Link href="/login" style={{ color: MLS_NAVY, textDecoration: "none", fontWeight: 600 }}>Đăng nhập</Link>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#6B7280", marginBottom: 16 }}>Không tìm thấy quiz</p>
          <Link href="/quizzes" style={{ color: MLS_NAVY, textDecoration: "none" }}>← Quay lại</Link>
        </div>
      </div>
    );
  }

  const question = quiz.questions?.[0];

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${MLS_NAVY}, #1976D2)`,
          padding: "28px 24px 40px",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <Link
            href={`/quiz/${id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "rgba(255,255,255,0.8)",
              textDecoration: "none",
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </Link>
          <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: 0 }}>
            🎤 {quiz.title}
          </h1>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, marginTop: 6 }}>
            Bài luyện Speaking — AI chấm điểm tự động
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "-20px auto 0", padding: "0 24px 48px" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            padding: 32,
          }}
        >
          {/* Reference text / prompt */}
          {question && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                Đề bài
              </div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: "#111827",
                  lineHeight: 1.7,
                  marginBottom: 16,
                }}
                dangerouslySetInnerHTML={{ __html: question.content }}
              />
              {question.referenceText && (
                <div
                  style={{
                    background: "#EFF6FF",
                    borderLeft: `4px solid ${MLS_NAVY}`,
                    borderRadius: "0 8px 8px 0",
                    padding: "14px 18px",
                    color: "#1E40AF",
                    fontSize: 15,
                    lineHeight: 1.6,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, opacity: 0.7 }}>VĂN BẢN THAM KHẢO</div>
                  {question.referenceText}
                </div>
              )}
            </div>
          )}

          {/* Tips */}
          <div
            style={{
              background: "#FFFBEB",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 24,
              fontSize: 13,
              color: "#92400E",
            }}
          >
            <strong>💡 Hướng dẫn:</strong> Nhấn <strong>Bắt đầu ghi âm</strong>, đọc văn bản to và rõ ràng, sau đó nhấn <strong>Nộp bài</strong>. AI sẽ chấm điểm phát âm, ngữ điệu và độ chính xác.
          </div>

          {/* Error */}
          {startError && (
            <div
              style={{
                background: "#FEE2E2",
                color: MLS_RED,
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 20,
                fontSize: 14,
              }}
            >
              <div>{isQuotaError ? "🚫 " : "⚠️ "}{startError}</div>
              {isQuotaError && (
                <a href="/courses" style={{ display: "inline-block", marginTop: 8, color: "#fff", background: MLS_NAVY, padding: "6px 14px", borderRadius: 6, textDecoration: "none", fontWeight: 600, fontSize: 13 }}>
                  Mua khoá học →
                </a>
              )}
            </div>
          )}

          {/* Recorder */}
          {started && attemptId && questionId ? (
            <SpeakingRecorder
              attemptId={attemptId}
              questionId={questionId}
              token={token}
              timeLimitSec={question?.speakingTimeLimitSec ?? undefined}
              examModeTag={question?.examModeTag ?? undefined}
              onDone={handleRecordingDone}
            />
          ) : (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF" }}>
              <div style={{ width: 40, height: 40, border: "4px solid #E5E7EB", borderTopColor: MLS_NAVY, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
              Đang chuẩn bị...
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
