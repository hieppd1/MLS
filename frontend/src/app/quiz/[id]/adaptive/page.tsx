"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import {
  useStartQuizAttemptMutation,
  useSaveAnswerMutation,
  useSubmitAttemptMutation,
  useAbandonAttemptMutation,
  type AttemptQuestionDto,
  type AttemptOptionDto,
} from "@/lib/features/quiz/quizApi";

const MLS_NAVY  = "#1565C0";
const MLS_RED   = "#e5173f";
const MLS_GREEN = "#16A34A";

type Difficulty = "Easy" | "Medium" | "Hard";
type Stage = "loading" | "quiz" | "feedback" | "submitting" | "done";

// ── Difficulty indicator ───────────────────────────────────────────────────

const DIFF_CONFIG: Record<Difficulty, { label: string; color: string; dots: number }> = {
  Easy:   { label: "Dễ",        color: MLS_GREEN, dots: 1 },
  Medium: { label: "Trung bình", color: "#F59E0B", dots: 2 },
  Hard:   { label: "Khó",       color: MLS_RED,   dots: 3 },
};

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const cfg = DIFF_CONFIG[difficulty] ?? DIFF_CONFIG.Medium;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: `${cfg.color}18`, border: `1.5px solid ${cfg.color}44`,
      borderRadius: 20, padding: "4px 12px",
    }}>
      <span style={{ display: "flex", gap: 3 }}>
        {[1, 2, 3].map((i) => (
          <span key={i} style={{
            width: 8, height: 8, borderRadius: "50%",
            background: i <= cfg.dots ? cfg.color : "#E5E7EB",
          }} />
        ))}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
    </div>
  );
}

// ── Single/TrueFalse question card ─────────────────────────────────────────

function QuestionCard({
  question, answer, onChange, locked,
}: {
  question: AttemptQuestionDto;
  answer: string;
  onChange: (val: string) => void;
  locked: boolean;
}) {
  const opts: AttemptOptionDto[] = question.options ?? [];

  if (question.type === "FillBlank") {
    return (
      <div>
        <div
          style={{ fontSize: 18, fontWeight: 600, color: "#111827", lineHeight: 1.6, marginBottom: 20 }}
          dangerouslySetInnerHTML={{ __html: question.content }}
        />
        <input
          value={answer}
          onChange={(e) => !locked && onChange(e.target.value)}
          disabled={locked}
          placeholder="Nhập câu trả lời..."
          style={{
            width: "100%", padding: "14px 16px", fontSize: 16, borderRadius: 10,
            border: `2px solid ${answer ? MLS_NAVY : "#E5E7EB"}`,
            outline: "none", boxSizing: "border-box", background: locked ? "#F3F4F6" : "#F9FAFB",
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div
        style={{ fontSize: 18, fontWeight: 600, color: "#111827", lineHeight: 1.6, marginBottom: 20 }}
        dangerouslySetInnerHTML={{ __html: question.content }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {opts.map((opt) => {
          const chosen = answer === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => !locked && onChange(chosen ? "" : opt.id)}
              disabled={locked}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 16px", borderRadius: 10, cursor: locked ? "default" : "pointer",
                border: `2px solid ${chosen ? MLS_NAVY : "#E5E7EB"}`,
                background: chosen ? "#EFF6FF" : "#FAFAFA", textAlign: "left",
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                border: `2px solid ${chosen ? MLS_NAVY : "#D1D5DB"}`,
                background: chosen ? MLS_NAVY : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {chosen && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
              </div>
              <span style={{ fontSize: 15, color: "#111827" }}>{opt.content}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Feedback flash overlay ─────────────────────────────────────────────────

function FeedbackOverlay({
  isCorrect, difficulty, onNext,
}: {
  isCorrect: boolean;
  difficulty: Difficulty;
  onNext: () => void;
}) {
  const cfg = DIFF_CONFIG[difficulty] ?? DIFF_CONFIG.Medium;
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 50,
      background: isCorrect ? "#F0FDF4" : "#FFF1F2",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      borderRadius: 16, gap: 12,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: isCorrect ? MLS_GREEN : MLS_RED,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 36,
      }}>
        {isCorrect ? "✓" : "✗"}
      </div>
      <p style={{ fontWeight: 700, fontSize: 20, color: isCorrect ? MLS_GREEN : MLS_RED, margin: 0 }}>
        {isCorrect ? "Chính xác!" : "Sai rồi!"}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, color: "#6B7280" }}>Độ khó tiếp theo:</span>
        <DifficultyBadge difficulty={difficulty} />
      </div>
      <button
        onClick={onNext}
        style={{
          marginTop: 8, padding: "12px 32px", borderRadius: 10,
          border: "none", background: MLS_NAVY, color: "#fff",
          fontSize: 15, fontWeight: 600, cursor: "pointer",
        }}
      >
        Câu tiếp theo →
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function AdaptiveQuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isHydrated = useAppSelector((s) => s.auth.isHydrated);
  const user      = useAppSelector((s) => s.auth.user);

  const [stage, setStage]               = useState<Stage>("loading");
  const [attemptId, setAttemptId]       = useState<string | null>(null);
  const [maxQuestions, setMaxQuestions] = useState(20);
  const [question, setQuestion]         = useState<AttemptQuestionDto | null>(null);
  const [pendingNext, setPendingNext]   = useState<AttemptQuestionDto | null>(null);
  const [answer, setAnswer]             = useState("");
  const [answeredCount, setAnsweredCount] = useState(0);
  const [difficulty, setDifficulty]     = useState<Difficulty>("Medium");
  const [lastCorrect, setLastCorrect]   = useState<boolean | null>(null);
  const [masteryBanner, setMasteryBanner] = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const [startAttempt]  = useStartQuizAttemptMutation();
  const [saveAnswer]    = useSaveAnswerMutation();
  const [submitAttempt] = useSubmitAttemptMutation();
  const [abandonAttempt]= useAbandonAttemptMutation();

  const elapsed = useRef(0);
  useEffect(() => {
    const t = setInterval(() => { elapsed.current += 1; }, 1000);
    return () => clearInterval(t);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (isHydrated && !user) router.replace(`/login?next=/quiz/${id}/adaptive`);
  }, [isHydrated, user, id, router]);

  // Start attempt
  useEffect(() => {
    if (!isHydrated || !user || !id) return;
    (async () => {
      try {
        const res = await startAttempt({ quizId: id }).unwrap();
        setAttemptId(res.attemptId);
        setMaxQuestions(res.maxQuestions ?? 20);
        setQuestion(res.questions[0] ?? null);
        setStage(res.questions.length > 0 ? "quiz" : "done");
      } catch {
        setError("Không thể bắt đầu bài kiểm tra. Vui lòng thử lại.");
      }
    })();
  }, [isHydrated, user, id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Submit the attempt (auto or manual)
  const doSubmit = useCallback(async () => {
    if (!attemptId) return;
    setStage("submitting");
    try {
      await submitAttempt({ attemptId, timeTaken: elapsed.current }).unwrap();
      router.replace(`/quiz/${id}/result/${attemptId}`);
    } catch {
      setError("Lỗi khi nộp bài. Vui lòng thử lại.");
      setStage("quiz");
    }
  }, [attemptId, id, router, submitAttempt]);

  async function handleConfirm() {
    if (!attemptId || !question || !answer) return;
    setStage("feedback");

    const res = await saveAnswer({
      attemptId,
      questionId: question.questionId,
      answerValue: answer,
      isSkipped: false,
    }).unwrap().catch(() => null);

    if (!res?.success) {
      setError("Lỗi lưu câu trả lời.");
      setStage("quiz");
      return;
    }

    setLastCorrect(res.isCorrect ?? false);
    setAnsweredCount(res.answeredCount ?? answeredCount + 1);
    if (res.currentDifficulty) setDifficulty(res.currentDifficulty as Difficulty);

    if (res.isComplete || !res.nextQuestion) {
      setMasteryBanner(true);
      setTimeout(doSubmit, 2000);
      return;
    }

    // Store next question; FeedbackOverlay "Câu tiếp theo" will reveal it
    setPendingNext(res.nextQuestion);
  }

  function handleNextQuestion() {
    if (pendingNext) {
      setQuestion(pendingNext);
      setPendingNext(null);
    }
    setAnswer("");
    setLastCorrect(null);
    setStage("quiz");
  }

  async function handleAbandon() {
    if (!attemptId) { router.replace(`/quiz/${id}`); return; }
    await abandonAttempt(attemptId).catch(() => {});
    router.replace(`/quiz/${id}`);
  }

  // Spinner states
  if (!isHydrated || stage === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        {error ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: MLS_RED, marginBottom: 16 }}>{error}</p>
            <button onClick={() => router.replace(`/quiz/${id}`)} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: MLS_NAVY, color: "#fff", cursor: "pointer" }}>Quay lại</button>
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "#9CA3AF" }}>
            <div style={{ width: 48, height: 48, border: "4px solid #E5E7EB", borderTopColor: MLS_NAVY, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p>Đang khởi tạo bài kiểm tra thích ứng...</p>
          </div>
        )}
      </div>
    );
  }

  if (stage === "submitting") {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center", color: "#9CA3AF" }}>
          <div style={{ width: 48, height: 48, border: "4px solid #E5E7EB", borderTopColor: MLS_NAVY, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p>Đang tính điểm thích ứng...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", flexDirection: "column" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Top bar */}
      <div style={{
        background: MLS_NAVY, padding: "0 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 52, flexShrink: 0, position: "relative", zIndex: 10,
      }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
          Bài kiểm tra thích ứng
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
            Câu {answeredCount + 1} / tối đa {maxQuestions}
          </span>
          <button onClick={handleAbandon} style={{
            padding: "6px 16px", borderRadius: 8, fontSize: 13,
            border: "1.5px solid rgba(255,255,255,0.35)", background: "transparent",
            color: "rgba(255,255,255,0.85)", cursor: "pointer",
          }}>
            Thoát
          </button>
        </div>
      </div>

      {/* Difficulty + progress */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #E5E7EB",
        padding: "10px 24px", display: "flex", alignItems: "center", gap: 16,
      }}>
        <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>Độ khó hiện tại:</span>
        <DifficultyBadge difficulty={difficulty} />
        <div style={{ flex: 1, height: 4, background: "#E5E7EB", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 2, background: MLS_NAVY,
            width: `${Math.min(100, (answeredCount / maxQuestions) * 100)}%`,
            transition: "width 0.4s ease",
          }} />
        </div>
        <span style={{ fontSize: 12, color: "#9CA3AF", minWidth: 40, textAlign: "right" }}>
          {answeredCount}/{maxQuestions}
        </span>
      </div>

      {/* Mastery banner */}
      {masteryBanner && (
        <div style={{
          background: "#FEF3C7", borderBottom: "1px solid #FCD34D",
          padding: "10px 24px", textAlign: "center",
          fontSize: 14, fontWeight: 600, color: "#92400E",
        }}>
          🏆 {answeredCount >= maxQuestions
            ? "Đã hoàn thành tối đa câu hỏi!"
            : "Xuất sắc! Bạn đã trả lời đúng 5 câu khó liên tiếp!"}
          &nbsp;Đang tính điểm...
        </div>
      )}

      {/* Question area */}
      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 24px" }}>
        <div style={{ width: "100%", maxWidth: 680 }}>
          {question ? (
            <div style={{
              background: "#fff", borderRadius: 16,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              padding: 32, position: "relative",
            }}>
              {/* Feedback overlay */}
              {stage === "feedback" && lastCorrect !== null && (
                <FeedbackOverlay
                  isCorrect={lastCorrect}
                  difficulty={difficulty}
                  onNext={handleNextQuestion}
                />
              )}

              <QuestionCard
                question={question}
                answer={answer}
                onChange={setAnswer}
                locked={stage === "feedback"}
              />

              {stage === "quiz" && (
                <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={handleConfirm}
                    disabled={!answer}
                    style={{
                      padding: "12px 28px", borderRadius: 10, fontSize: 15, fontWeight: 600,
                      border: "none", cursor: answer ? "pointer" : "not-allowed",
                      background: answer ? MLS_NAVY : "#D1D5DB", color: "#fff",
                      transition: "background 0.2s",
                    }}
                  >
                    Xác nhận
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "#9CA3AF", padding: 40 }}>
              <p>Không còn câu hỏi phù hợp. Đang nộp bài...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
