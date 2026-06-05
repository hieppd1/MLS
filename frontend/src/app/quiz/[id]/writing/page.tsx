"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/lib/hooks";
import EssayEditor from "@/components/quiz/EssayEditor";
import { useGetQuizPreviewQuery, useStartQuizAttemptMutation } from "@/lib/features/quiz/quizApi";
import { useSubmitWritingMutation } from "@/lib/features/quiz/writingApi";
import { useState, useEffect } from "react";

const MLS_NAVY = "#1565C0";
const MLS_RED  = "#e5173f";

export default function WritingQuizPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const isHydrated = useAppSelector((s) => s.auth.isHydrated);
  const token      = useAppSelector((s) => s.auth.accessToken);

  const [attemptId,  setAttemptId]  = useState<string | null>(null);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [started,    setStarted]    = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  const { data: quiz, isLoading } = useGetQuizPreviewQuery(id, { skip: !id || !isHydrated });
  const [startAttempt] = useStartQuizAttemptMutation();
  const [submitWriting, { isLoading: submitting }] = useSubmitWritingMutation();

  // Auto-start attempt when quiz loads
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

  const handleSubmit = async (essayText: string, wordCount: number) => {
    if (!attemptId || !questionId) return;
    try {
      const firstQ = quiz?.questions?.[0];
      const result = await submitWriting({
        attemptId,
        questionId,
        essayText,
        wordCount,
        taskType:   firstQ?.examModeTag?.startsWith("vstep_t1") ? "letter"
                  : firstQ?.examModeTag?.startsWith("vstep_t2") ? "essay_vstep"
                  : null,
        essayType:  null,
        examModeTag: firstQ?.examModeTag ?? null,
      }).unwrap();
      setSubmitted(true);
      router.push(`/quiz/${id}/ai-result/${result.submissionId}?type=writing`);
    } catch {
      setStartError("Không thể nộp bài. Vui lòng thử lại.");
    }
  };

  if (!isHydrated || isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center", color: "#9CA3AF" }}>
          <div style={{ width: 48, height: 48, border: "4px solid #E5E7EB", borderTopColor: MLS_NAVY, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p>Đang chuẩn bị bài thi...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ color: "#374151", fontSize: 16 }}>Bạn cần đăng nhập để làm bài thi.</p>
        <Link href="/login" style={{ background: MLS_NAVY, color: "#fff", padding: "10px 24px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>Đăng nhập</Link>
      </div>
    );
  }

  if (startError) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{isQuotaError ? "🚫" : "⚠️"}</div>
          <p style={{ color: isQuotaError ? "#DC2626" : MLS_RED, fontSize: 16, marginBottom: 8 }}>{startError}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={`/quiz/${id}`} style={{ color: MLS_NAVY, textDecoration: "underline" }}>← Quay lại</Link>
            {isQuotaError && (
              <Link href="/courses" style={{ background: MLS_NAVY, color: "#fff", padding: "8px 20px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>Mua khoá học</Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const firstQ    = quiz?.questions?.[0];
  const minWords  = (firstQ as any)?.writingMinWords ?? 100;
  const maxWords  = (firstQ as any)?.writingMaxWords ?? undefined;
  const prompt    = firstQ?.content ?? quiz?.title ?? "Viết bài theo chủ đề";
  const taskType  = firstQ?.examModeTag?.startsWith("vstep_t1") ? "letter"
                  : firstQ?.examModeTag?.startsWith("vstep_t2") ? "essay_vstep"
                  : null;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      {/* Header */}
      <div style={{ background: MLS_NAVY, padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href={`/quiz/${id}`} style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 14 }}>← Quay lại</Link>
        <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0, flex: 1, textAlign: "center" }}>
          {quiz?.title ?? "Bài thi Writing"}
        </h1>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
        {!started ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ width: 40, height: 40, border: "3px solid #E5E7EB", borderTopColor: MLS_NAVY, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "#666" }}>Đang khởi động bài thi...</p>
          </div>
        ) : submitted ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <p style={{ fontSize: 18, fontWeight: 600, color: MLS_NAVY }}>Bài viết đã được gửi!</p>
            <p style={{ color: "#666", marginTop: 8 }}>Đang chuyển đến trang kết quả AI...</p>
          </div>
        ) : (
          <EssayEditor
            minWords={minWords}
            maxWords={maxWords}
            taskType={taskType}
            promptText={prompt}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}
