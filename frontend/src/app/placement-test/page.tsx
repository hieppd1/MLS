"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/app/_components/AppShell";
import { useAppSelector } from "@/lib/hooks";
import { formatDate } from "@/lib/i18nFormat";
import {
  useGetPlacementQuizQuery,
  useStartPlacementAttemptMutation,
  useSaveAnswerMutation,
  useSubmitAttemptMutation,
  useSavePlacementResultMutation,
  useGetMyPlacementResultQuery,
  useGetTestQuotaQuery,
  type AttemptQuestionDto,
  type SubmitAttemptResult,
  type PlacementResultDto,
} from "@/lib/features/quiz/quizApi";

const MLS_NAVY = "#1565C0";
const MLS_RED = "#e5173f";

const LEVEL_LABELS: Record<number, string> = {
  1: "Sơ cấp 1 (Beginner)",
  2: "Sơ cấp 2 (Elementary)",
  3: "Trung cấp 1 (Pre-Intermediate)",
  4: "Trung cấp 2 (Intermediate)",
  5: "Nâng cao 1 (Upper-Intermediate)",
  6: "Nâng cao 2 (Advanced)",
};

const SKILL_LABELS: Record<string, string> = {
  Grammar: "Ngữ pháp",
  Vocabulary: "Từ vựng",
  Reading: "Đọc hiểu",
  Listening: "Nghe hiểu",
  Speaking: "Giao tiếp",
  Writing: "Viết",
};

type Stage = "intro" | "loading" | "quiz" | "submitting" | "result";
type AnswerMap = Record<string, string>;

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div style={{ width: "100%", background: "#E5E7EB", borderRadius: 99, height: 6, overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: 99,
        background: `linear-gradient(90deg, ${MLS_NAVY} 0%, #42A5F5 100%)`,
        width: `${pct}%`, transition: "width 0.3s ease",
      }} />
    </div>
  );
}

function TimerDisplay({ startTime, limitSecs }: { startTime: number; limitSecs: number | null }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime]);
  if (!limitSecs) {
    const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
    const s = (elapsed % 60).toString().padStart(2, "0");
    return <span style={{ fontVariantNumeric: "tabular-nums" }}>{m}:{s}</span>;
  }
  const remaining = Math.max(0, limitSecs - elapsed);
  const m = Math.floor(remaining / 60).toString().padStart(2, "0");
  const s = (remaining % 60).toString().padStart(2, "0");
  const isWarning = remaining < 120;
  return (
    <span style={{ color: isWarning ? MLS_RED : "#374151", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
      {m}:{s}
    </span>
  );
}

function QuestionCard({
  question,
  answer,
  onSelectOption,
  onFillBlank,
  onMultiSelect,
}: {
  question: AttemptQuestionDto;
  answer: string | undefined;
  onSelectOption: (qId: string, optId: string) => void;
  onFillBlank: (qId: string, val: string) => void;
  onMultiSelect: (qId: string, optId: string) => void;
}) {
  const selectedMulti = answer ? answer.split(",") : [];

  if (question.type === "FillBlank") {
    return (
      <div>
        <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 16, color: "#1f2937" }}>
          {question.content}
        </p>
        <input
          type="text"
          value={answer ?? ""}
          onChange={(e) => onFillBlank(question.questionId, e.target.value)}
          placeholder="Nhập câu trả lời..."
          style={{
            width: "100%", padding: "12px 16px", border: "2px solid #d1d5db",
            borderRadius: 10, fontSize: 15, outline: "none",
            boxSizing: "border-box" as const,
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = MLS_NAVY; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#d1d5db"; }}
        />
      </div>
    );
  }

  const isMulti = question.type === "MultipleChoice";

  if (question.type === "Matching") {
    let pairs: { key: string; value: string }[] = [];
    try { pairs = answer ? JSON.parse(answer) : []; } catch { pairs = []; }
    const opts = question.options ?? [];
    const allValues = opts.map((o) => o.matchValue ?? "").filter(Boolean);
    const setMatch = (key: string, value: string) => {
      const next = opts.map((o) => {
        const k = o.matchKey ?? o.id;
        return { key: k, value: k === key ? value : (pairs.find((p) => p.key === k)?.value ?? "") };
      });
      onFillBlank(question.questionId, JSON.stringify(next));
    };
    return (
      <div>
        <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 16, color: "#1f2937" }}>{question.content}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {opts.map((opt) => {
            const key = opt.matchKey ?? opt.id;
            const selected = pairs.find((p) => p.key === key)?.value ?? "";
            return (
              <div key={opt.id} style={{
                display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: 10,
                border: `2px solid ${selected ? MLS_NAVY : "#e5e7eb"}`,
                background: selected ? `${MLS_NAVY}0f` : "#fafafa",
              }}>
                <span style={{ fontSize: 15, color: "#111827", fontWeight: 500 }}>{opt.content}</span>
                <span style={{ color: "#9ca3af", fontSize: 20, userSelect: "none" as const }}>↔</span>
                <select value={selected} onChange={(e) => setMatch(key, e.target.value)} style={{
                  padding: "8px 12px", borderRadius: 8, fontSize: 14,
                  border: `1px solid ${selected ? MLS_NAVY : "#d1d5db"}`,
                  background: "#fff", color: "#111827", cursor: "pointer", outline: "none",
                }}>
                  <option value="">-- Chọn --</option>
                  {allValues.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.type === "Ordering") {
    let order: string[] = [];
    try { order = answer ? JSON.parse(answer) : []; } catch { order = []; }
    const opts = question.options ?? [];
    const orderedOpts = order.length === opts.length
      ? order.map((id) => opts.find((o) => o.id === id)).filter((o): o is NonNullable<typeof o> => o != null)
      : [...opts].sort((a, b) => a.displayOrder - b.displayOrder);
    const move = (fromIdx: number, direction: -1 | 1) => {
      const toIdx = fromIdx + direction;
      if (toIdx < 0 || toIdx >= orderedOpts.length) return;
      const next = [...orderedOpts];
      [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
      onFillBlank(question.questionId, JSON.stringify(next.map((o) => o.id)));
    };
    return (
      <div>
        <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 16, color: "#1f2937" }}>{question.content}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {orderedOpts.map((opt, i) => (
            <div key={opt.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10,
              border: `2px solid ${MLS_NAVY}22`, background: "#F8FAFF",
            }}>
              <span style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                background: MLS_NAVY, color: "#fff", fontSize: 12, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{i + 1}</span>
              <span style={{ flex: 1, fontSize: 15, color: "#111827" }}>{opt.content}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <button onClick={() => move(i, -1)} disabled={i === 0} style={{
                  padding: "3px 8px", borderRadius: 5, border: "1px solid #d1d5db",
                  background: i === 0 ? "#f3f4f6" : "#fff", cursor: i === 0 ? "default" : "pointer",
                  fontSize: 11, color: i === 0 ? "#9ca3af" : "#374151", lineHeight: 1,
                }}>▲</button>
                <button onClick={() => move(i, 1)} disabled={i === orderedOpts.length - 1} style={{
                  padding: "3px 8px", borderRadius: 5, border: "1px solid #d1d5db",
                  background: i === orderedOpts.length - 1 ? "#f3f4f6" : "#fff",
                  cursor: i === orderedOpts.length - 1 ? "default" : "pointer",
                  fontSize: 11, color: i === orderedOpts.length - 1 ? "#9ca3af" : "#374151", lineHeight: 1,
                }}>▼</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isMultiInner = isMulti;

  return (
    <div>
      <p style={{ marginBottom: 20, lineHeight: 1.7, fontSize: 16, color: "#1f2937" }}>
        {question.content}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {question.options.map((opt) => {
          const isSelected = isMultiInner
            ? selectedMulti.includes(opt.id)
            : answer === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => isMultiInner ? onMultiSelect(question.questionId, opt.id) : onSelectOption(question.questionId, opt.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: 10, cursor: "pointer",
                border: isSelected ? `2px solid ${MLS_NAVY}` : "2px solid #e5e7eb",
                background: isSelected ? `${MLS_NAVY}0f` : "#fafafa",
                textAlign: "left", transition: "all 0.15s", fontSize: 14,
                color: "#374151",
              }}
            >
              <span style={{
                width: 20, height: 20, borderRadius: isMultiInner ? 4 : "50%",
                border: isSelected ? `2px solid ${MLS_NAVY}` : "2px solid #9ca3af",
                background: isSelected ? MLS_NAVY : "transparent",
                flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {isSelected && (
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                    <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span>{opt.content}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PlacementTestPage() {
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const isHydrated = useAppSelector((s) => s.auth.isHydrated);
  const isAuth = isHydrated && !!user;

  const [stage, setStage] = useState<Stage>("intro");
  const [questions, setQuestions] = useState<AttemptQuestionDto[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [startTime, setStartTime] = useState<number>(0);
  const [submitResult, setSubmitResult] = useState<SubmitAttemptResult | null>(null);
  const [placementResult, setPlacementResult] = useState<PlacementResultDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: quiz, isLoading: quizLoading } = useGetPlacementQuizQuery();
  const { data: myResult } = useGetMyPlacementResultQuery(undefined, { skip: !isAuth });
  const { data: quota } = useGetTestQuotaQuery(quiz?.id ?? "", { skip: !quiz?.id || !isAuth });
  const [startAttempt] = useStartPlacementAttemptMutation();
  const [saveAnswer] = useSaveAnswerMutation();
  const [submitAttempt] = useSubmitAttemptMutation();
  const [savePlacement] = useSavePlacementResultMutation();

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveAnswerToBackend = useCallback(
    (questionId: string, answerValue: string) => {
      if (!attemptId) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveAnswer({ attemptId, questionId, answerValue, isSkipped: false }).catch(() => null);
      }, 400);
    },
    [attemptId, saveAnswer]
  );

  function handleStart() {
    if (!isAuth) { router.push("/login?redirect=/placement-test"); return; }
    if (!quiz) return;
    setStage("loading");
    setError(null);
    startAttempt({ quizId: quiz.id })
      .unwrap()
      .then((result) => {
        setQuestions(result.questions);
        setAttemptId(result.attemptId);
        setAnswers({});
        setCurrentIdx(0);
        setStartTime(Date.now());
        setStage("quiz");
      })
      .catch((err: any) => {
        if (err?.status === 429 || err?.data?.code === "TEST_QUOTA_EXCEEDED") {
          const msg = err?.data?.message ?? "Bạn đã hết lượt thi miễn phí. Mua khoá học để có thêm lượt thi.";
          setError(msg);
        } else {
          const msg = err?.data?.message ?? err?.data?.error ?? "Không thể bắt đầu bài kiểm tra.";
          setError(msg);
        }
        setStage("intro");
      });
  }

  async function handleSubmit() {
    if (!attemptId) return;
    setStage("submitting");
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    const currentQ = questions[currentIdx];
    if (currentQ && answers[currentQ.questionId]) {
      await saveAnswer({
        attemptId, questionId: currentQ.questionId,
        answerValue: answers[currentQ.questionId], isSkipped: false,
      }).catch(() => null);
    }
    try {
      const result = await submitAttempt({ attemptId, timeTaken }).unwrap();
      setSubmitResult(result);
      const placement = await savePlacement({ attemptId }).unwrap();
      setPlacementResult(placement);
      setStage("result");
    } catch {
      setError("Đã có lỗi khi nộp bài. Vui lòng thử lại.");
      setStage("quiz");
    }
  }

  function handleSelectOption(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    saveAnswerToBackend(questionId, optionId);
  }

  function handleFillBlank(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    saveAnswerToBackend(questionId, value);
  }

  function handleMultiSelect(questionId: string, optionId: string) {
    setAnswers((prev) => {
      const current = prev[questionId] ?? "";
      const selected = current ? current.split(",") : [];
      const idx = selected.indexOf(optionId);
      if (idx >= 0) selected.splice(idx, 1);
      else selected.push(optionId);
      const newVal = selected.join(",");
      saveAnswerToBackend(questionId, newVal);
      return { ...prev, [questionId]: newVal };
    });
  }

  const currentQ = questions[currentIdx];
  const answeredCount = questions.filter((q) => answers[q.questionId]).length;

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (stage === "intro") {
    return (
      <AppShell>
        <main style={{
          flex: 1, minWidth: 0, overflowY: "auto", background: "#F8FAFC",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "40px 20px",
        }}>
          <div style={{
            maxWidth: 560, width: "100%", background: "#fff", borderRadius: 20,
            padding: "48px 40px", boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
            border: "1px solid #e5e7eb",
          }}>
            {/* Icon */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%", margin: "0 auto 16px",
                background: `linear-gradient(135deg, ${MLS_NAVY} 0%, #42A5F5 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", margin: 0 }}>
                Bài Kiểm Tra Đầu Vào
              </h1>
              <p style={{ color: "#6b7280", marginTop: 8, fontSize: 15, lineHeight: 1.6 }}>
                Xác định trình độ tiếng Anh của bạn để chúng tôi gợi ý lộ trình học phù hợp nhất.
              </p>
            </div>

            {/* Quiz info */}
            {quizLoading ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#6b7280" }}>Đang tải...</div>
            ) : quiz ? (
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12,
                marginBottom: 24, padding: "16px 0",
              }}>
                {[
                  { label: "Câu hỏi", value: quiz.questions.length.toString() },
                  { label: "Thời gian", value: quiz.timeLimitSeconds ? `${Math.round(quiz.timeLimitSeconds / 60)} phút` : "Không giới hạn" },
                  { label: "Mức độ", value: "Đa cấp" },
                ].map((item) => (
                  <div key={item.label} style={{
                    background: "#F8FAFC", borderRadius: 12, padding: "12px 8px",
                    textAlign: "center", border: "1px solid #e5e7eb",
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: MLS_NAVY }}>{item.value}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Previous result */}
            {myResult && (
              <div style={{
                background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 12,
                padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>
                    Kết quả trước: {LEVEL_LABELS[myResult.assignedLevel] ?? `Level ${myResult.assignedLevel}`}
                  </div>
                  <div style={{ fontSize: 12, color: "#16a34a" }}>
                    Làm lại để cập nhật trình độ của bạn
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10,
                padding: "12px 16px", marginBottom: 16, color: MLS_RED, fontSize: 14,
              }}>
                {error}
              </div>
            )}

            {/* Action */}
            {!isHydrated ? (
              <div style={{ height: 48, background: "#f3f4f6", borderRadius: 12, animation: "pulse 1.5s ease-in-out infinite" }}>
                <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
              </div>
            ) : isAuth ? (
              <div>
                {/* Quota badge */}
                {quota?.isLimited && (
                  <div style={{
                    marginBottom: 16, padding: "12px 16px", borderRadius: 12,
                    background: quota.remaining === 0 ? "#FEF2F2" : quota.remaining <= 1 ? "#FFFBEB" : "#F0F9FF",
                    border: `1px solid ${quota.remaining === 0 ? "#FECACA" : quota.remaining <= 1 ? "#FDE68A" : "#BAE6FD"}`,
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ fontSize: 18 }}>
                      {quota.remaining === 0 ? "🚫" : quota.remaining <= 1 ? "⚠️" : "🎯"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: quota.remaining === 0 ? "#DC2626" : quota.remaining <= 1 ? "#D97706" : "#0369A1" }}>
                        {quota.isMonthly
                          ? `Còn ${quota.remaining === -1 ? "∞" : quota.remaining} / ${quota.quota} lần thi tháng này`
                          : `Còn ${quota.remaining} / ${quota.quota} lần thi miễn phí`}
                      </div>
                      {quota.remaining === 0 && !quota.isMonthly && (
                        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>Mua khoá học để có thêm lượt thi hàng tháng</div>
                      )}
                      {quota.remaining === 0 && quota.isMonthly && quota.resetDate && (
                        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>Reset vào {formatDate(quota.resetDate)}</div>
                      )}
                    </div>
                  </div>
                )}
                <button
                  onClick={handleStart}
                  disabled={!quiz || quizLoading || (quota?.isLimited && quota.remaining === 0)}
                  style={{
                    width: "100%", padding: "14px 24px", borderRadius: 12, cursor: (!quiz || quizLoading || (quota?.isLimited && quota.remaining === 0)) ? "not-allowed" : "pointer",
                    background: (!quiz || quizLoading || (quota?.isLimited && quota.remaining === 0)) ? "#9ca3af" : `linear-gradient(135deg, ${MLS_NAVY} 0%, #1976D2 100%)`,
                    color: "white", fontSize: 16, fontWeight: 700, border: "none",
                    boxShadow: (!quiz || quizLoading || (quota?.isLimited && quota.remaining === 0)) ? "none" : `0 4px 16px ${MLS_NAVY}40`,
                    transition: "all 0.2s",
                  }}
                >
                  {quota?.isLimited && quota.remaining === 0 ? "Hết lượt thi" : myResult ? "Làm Lại Bài Kiểm Tra" : "Bắt Đầu Kiểm Tra"}
                </button>
                {quota?.isLimited && quota.remaining === 0 && !quota.isMonthly && (
                  <Link href="/courses" style={{
                    display: "block", marginTop: 10, padding: "12px 24px", borderRadius: 12, textAlign: "center",
                    background: `linear-gradient(135deg, ${MLS_NAVY} 0%, #1976D2 100%)`,
                    color: "white", fontSize: 15, fontWeight: 700, textDecoration: "none",
                  }}>Mua khoá học →</Link>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 12 }}>
                  Bạn cần đăng nhập để làm bài kiểm tra
                </p>
                <Link href="/login?redirect=/placement-test" style={{
                  display: "inline-block", padding: "12px 32px", borderRadius: 12,
                  background: MLS_NAVY, color: "white", fontSize: 15, fontWeight: 700,
                  textDecoration: "none",
                }}>
                  Đăng Nhập
                </Link>
              </div>
            )}

            <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#9ca3af" }}>
              Bài kiểm tra gồm nhiều kỹ năng: ngữ pháp, từ vựng, đọc hiểu
            </p>
          </div>
        </main>
      </AppShell>
    );
  }

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (stage === "loading") {
    return (
      <AppShell>
        <main style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          background: "#F8FAFC",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, border: `4px solid ${MLS_NAVY}30`,
              borderTopColor: MLS_NAVY, borderRadius: "50%", margin: "0 auto 16px",
              animation: "spin 1s linear infinite",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: "#6b7280", fontSize: 15 }}>Đang chuẩn bị bài kiểm tra...</p>
          </div>
        </main>
      </AppShell>
    );
  }

  // ── QUIZ ──────────────────────────────────────────────────────────────────
  if (stage === "quiz" && currentQ) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#F8FAFC" }}>
        {/* Header */}
        <div style={{
          background: "white", borderBottom: "1px solid #e5e7eb",
          padding: "12px 24px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${MLS_NAVY} 0%, #1976D2 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                Câu {currentIdx + 1} / {questions.length}
              </span>
              <span style={{ fontSize: 13, color: "#6b7280" }}>
                ⏱ <TimerDisplay startTime={startTime} limitSecs={quiz?.timeLimitSeconds ?? null} />
              </span>
            </div>
            <ProgressBar current={answeredCount} total={questions.length} />
          </div>
        </div>

        {/* Body: sidebar + content */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* ─────────── LEFT SIDEBAR ─────────── */}
          <aside style={{
            width: 256, flexShrink: 0,
            background: "#fff", borderRight: "1px solid #E5E7EB",
            display: "flex", flexDirection: "column",
            padding: "18px 14px",
            overflowY: "auto",
          }}>
            {/* Progress counter */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Tiến độ</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: MLS_NAVY }}>
                  {answeredCount}
                  <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>/{questions.length}</span>
                </span>
              </div>
              <div style={{ background: "#E5E7EB", borderRadius: 99, height: 5, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  background: answeredCount === questions.length ? "#16A34A" : MLS_NAVY,
                  width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%`,
                  transition: "width 0.3s",
                }} />
              </div>
            </div>

            {/* Question number grid — 5 per row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5 }}>
              {questions.map((q, i) => {
                const answered = !!answers[q.questionId];
                const active = i === currentIdx;
                return (
                  <button
                    key={q.questionId}
                    onClick={() => setCurrentIdx(i)}
                    title={`Câu ${i + 1}`}
                    style={{
                      aspectRatio: "1", borderRadius: 6, border: "none", cursor: "pointer",
                      outline: active ? `2px solid ${MLS_NAVY}` : "none",
                      outlineOffset: "1px",
                      background: active ? MLS_NAVY : answered ? "#DCFCE7" : "#F3F4F6",
                      color: active ? "#fff" : answered ? "#16A34A" : "#6B7280",
                      fontSize: 11, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: 0, lineHeight: 1,
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 10px", marginTop: 12 }}>
              {[
                { bg: MLS_NAVY, label: "Đang làm" },
                { bg: "#DCFCE7", label: "Đã trả lời" },
                { bg: "#F3F4F6", label: "Chưa làm" },
              ].map((l) => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 11, height: 11, borderRadius: 3, background: l.bg, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "#6B7280" }}>{l.label}</span>
                </div>
              ))}
            </div>

            {/* Spacer */}
            <div style={{ flex: 1, minHeight: 20 }} />

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={answeredCount === 0}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
                background: answeredCount > 0
                  ? `linear-gradient(135deg, ${MLS_RED} 0%, #f44336 100%)`
                  : "#E5E7EB",
                color: answeredCount > 0 ? "#fff" : "#9CA3AF",
                cursor: answeredCount > 0 ? "pointer" : "not-allowed",
                fontWeight: 700, fontSize: 14,
                boxShadow: answeredCount > 0 ? `0 4px 14px rgba(229,23,63,0.3)` : "none",
                transition: "all 0.2s",
              }}
            >
              Nộp bài ({answeredCount}/{questions.length})
            </button>
          </aside>

          {/* ─────────── MAIN CONTENT ─────────── */}
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              {/* Skill badge */}
              <div style={{ marginBottom: 12 }}>
                <span style={{
                  display: "inline-block", padding: "3px 12px", borderRadius: 99,
                  background: `${MLS_NAVY}15`, color: MLS_NAVY, fontSize: 12, fontWeight: 600,
                }}>
                  {SKILL_LABELS[currentQ.skillType ?? ""] ?? currentQ.skillType ?? "General"}
                </span>
              </div>

              <div style={{
                background: "white", borderRadius: 16, padding: "28px 28px",
                boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb",
              }}>
                <QuestionCard
                  question={currentQ}
                  answer={answers[currentQ.questionId]}
                  onSelectOption={handleSelectOption}
                  onFillBlank={handleFillBlank}
                  onMultiSelect={handleMultiSelect}
                />
              </div>

              {/* Navigation */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
                <button
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                  style={{
                    padding: "10px 20px", borderRadius: 10, border: "2px solid #e5e7eb",
                    background: "white", cursor: currentIdx === 0 ? "not-allowed" : "pointer",
                    color: currentIdx === 0 ? "#9ca3af" : "#374151", fontWeight: 600, fontSize: 14,
                  }}
                >
                  ← Trước
                </button>

                <span style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 500 }}>
                  {currentIdx + 1} / {questions.length}
                </span>

                <button
                  onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                  disabled={currentIdx === questions.length - 1}
                  style={{
                    padding: "10px 20px", borderRadius: 10, border: "none",
                    background: currentIdx < questions.length - 1 ? MLS_NAVY : "#E5E7EB",
                    color: currentIdx < questions.length - 1 ? "white" : "#9CA3AF",
                    cursor: currentIdx < questions.length - 1 ? "pointer" : "not-allowed",
                    fontWeight: 600, fontSize: 14,
                  }}
                >
                  Tiếp →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── SUBMITTING ────────────────────────────────────────────────────────────
  if (stage === "submitting") {
    return (
      <AppShell>
        <main style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          background: "#F8FAFC",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, border: `4px solid ${MLS_RED}30`,
              borderTopColor: MLS_RED, borderRadius: "50%", margin: "0 auto 16px",
              animation: "spin 1s linear infinite",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: "#6b7280", fontSize: 15 }}>Đang chấm bài và phân tích kết quả...</p>
          </div>
        </main>
      </AppShell>
    );
  }

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (stage === "result" && submitResult && placementResult) {
    const skillKeys = Object.keys(placementResult.skillBreakdown ?? {});

    return (
      <AppShell>
        <main style={{
          flex: 1, minWidth: 0, overflowY: "auto", background: "#F8FAFC",
          display: "flex", justifyContent: "center", padding: "40px 20px",
        }}>
          <div style={{ maxWidth: 600, width: "100%" }}>
            {/* Score card */}
            <div style={{
              background: `linear-gradient(135deg, ${MLS_NAVY} 0%, #1976D2 100%)`,
              borderRadius: 20, padding: "36px 32px", marginBottom: 20, textAlign: "center",
              color: "white", boxShadow: `0 8px 32px ${MLS_NAVY}40`,
            }}>
              <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 8 }}>Điểm số của bạn</div>
              <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1 }}>
                {Math.round(submitResult.percentage)}
                <span style={{ fontSize: 28, fontWeight: 700 }}>%</span>
              </div>
              <div style={{ fontSize: 15, opacity: 0.9, marginTop: 8 }}>
                {submitResult.score} / {questions.length} câu đúng
              </div>
              <div style={{
                display: "inline-block", marginTop: 16, padding: "6px 20px",
                background: "rgba(255,255,255,0.2)", borderRadius: 99, fontSize: 14, fontWeight: 700,
              }}>
                {LEVEL_LABELS[placementResult.level] ?? `Level ${placementResult.level}`}
              </div>
            </div>

            {/* Skill breakdown */}
            {skillKeys.length > 0 && (
              <div style={{
                background: "white", borderRadius: 16, padding: "24px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb",
                marginBottom: 20,
              }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#111827" }}>
                  Phân tích kỹ năng
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {skillKeys.map((skill) => {
                    const pct = placementResult.skillBreakdown[skill] ?? 0;
                    const barColor = pct >= 60 ? "#16a34a" : pct >= 40 ? "#d97706" : MLS_RED;
                    return (
                      <div key={skill}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                            {SKILL_LABELS[skill] ?? skill}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>
                            {Math.round(pct)}%
                          </span>
                        </div>
                        <div style={{ height: 8, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: 99, background: barColor,
                            width: `${pct}%`, transition: "width 0.5s ease",
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommended path */}
            {placementResult.recommendedPath && (
              <div style={{
                background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 16,
                padding: "20px 24px", marginBottom: 20,
              }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: MLS_NAVY }}>
                  Lộ trình được đề xuất
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: "#1e40af", lineHeight: 1.6 }}>
                  {placementResult.recommendedPath}
                </p>
              </div>
            )}

            {/* CTA */}
            <div style={{ display: "flex", gap: 12 }}>
              <Link href="/courses" style={{
                flex: 1, display: "block", padding: "14px 20px", borderRadius: 12,
                background: `linear-gradient(135deg, ${MLS_NAVY} 0%, #1976D2 100%)`,
                color: "white", fontWeight: 700, fontSize: 15, textAlign: "center",
                textDecoration: "none", boxShadow: `0 4px 16px ${MLS_NAVY}40`,
              }}>
                Xem Khoá Học Phù Hợp
              </Link>
              <button
                onClick={() => {
                  setStage("intro");
                  setSubmitResult(null);
                  setPlacementResult(null);
                  setAnswers({});
                  setAttemptId(null);
                  setCurrentIdx(0);
                }}
                style={{
                  padding: "14px 20px", borderRadius: 12, border: "2px solid #e5e7eb",
                  background: "white", color: "#374151", fontWeight: 600, fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Làm Lại
              </button>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  return null;
}
