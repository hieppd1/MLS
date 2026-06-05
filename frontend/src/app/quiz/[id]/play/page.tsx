"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import { useTranslations } from "next-intl";
import {
  useGetQuizPreviewQuery,
  useStartQuizAttemptMutation,
  useSaveAnswerMutation,
  useSubmitAttemptMutation,
  useAbandonAttemptMutation,
  type AttemptQuestionDto,
} from "@/lib/features/quiz/quizApi";

const MLS_NAVY = "#1565C0";
const MLS_RED = "#e5173f";

type Stage = "loading" | "quiz" | "submitting" | "done";

// ── Timer ──────────────────────────────────────────────────────────────────

function TimerDisplay({ elapsed, limit }: { elapsed: number; limit: number | null }) {
  if (limit) {
    const remaining = Math.max(0, limit - elapsed);
    const m = Math.floor(remaining / 60).toString().padStart(2, "0");
    const s = (remaining % 60).toString().padStart(2, "0");
    const pct = remaining / limit;
    const color = pct < 0.2 ? MLS_RED : pct < 0.4 ? "#F59E0B" : "#16A34A";
    return (
      <span style={{ fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>
        {m}:{s}
      </span>
    );
  }
  const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const s = (elapsed % 60).toString().padStart(2, "0");
  return <span style={{ fontWeight: 700, color: "#374151", fontVariantNumeric: "tabular-nums" }}>{m}:{s}</span>;
}

// ── QuestionCard ───────────────────────────────────────────────────────────

function QuestionCard({
  question, index, total, answer, onChange,
}: {
  question: AttemptQuestionDto;
  index: number;
  total: number;
  answer: string;
  onChange: (val: string) => void;
}) {
  const opts = question.options ?? [];
  const t = useTranslations("quiz");

  if (question.type === "FillBlank") {
    return (
      <div>
        <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 8 }}>Câu {index + 1}/{total}</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#111827", lineHeight: 1.6, marginBottom: 20 }}
          dangerouslySetInnerHTML={{ __html: question.content }} />
        <input
          value={answer}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("fill_placeholder")}
          style={{
            width: "100%", padding: "14px 16px", fontSize: 16, borderRadius: 10,
            border: `2px solid ${answer ? MLS_NAVY : "#E5E7EB"}`,
            outline: "none", boxSizing: "border-box", background: "#F9FAFB",
          }}
        />
      </div>
    );
  }

  if (question.type === "MultipleChoice") {
    const selected = answer ? answer.split(",").filter(Boolean) : [];
    const toggle = (id: string) => {
      const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
      onChange(next.join(","));
    };
    return (
      <div>
        <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 8 }}>Câu {index + 1}/{total} · {t("multi_select_hint")}</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#111827", lineHeight: 1.6, marginBottom: 20 }}
          dangerouslySetInnerHTML={{ __html: question.content }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {opts.map((opt) => {
            const checked = selected.includes(opt.id);
            return (
              <button key={opt.id} onClick={() => toggle(opt.id)} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 10,
                border: `2px solid ${checked ? MLS_NAVY : "#E5E7EB"}`,
                background: checked ? "#EFF6FF" : "#FAFAFA", cursor: "pointer", textAlign: "left",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${checked ? MLS_NAVY : "#D1D5DB"}`,
                  background: checked ? MLS_NAVY : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {checked && <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#fff"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span style={{ fontSize: 15, color: "#111827" }}>{opt.content}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.type === "Matching") {
    let pairs: { key: string; value: string }[] = [];
    try { pairs = answer ? JSON.parse(answer) : []; } catch { pairs = []; }
    const allValues = opts.map((o) => o.matchValue ?? "").filter(Boolean);
    const setMatch = (key: string, value: string) => {
      const next = opts.map((o) => {
        const k = o.matchKey ?? o.id;
        return { key: k, value: k === key ? value : (pairs.find((p) => p.key === k)?.value ?? "") };
      });
      onChange(JSON.stringify(next));
    };
    return (
      <div>
        <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 8 }}>Câu {index + 1}/{total} · {t("matching_hint")}</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#111827", lineHeight: 1.6, marginBottom: 20 }}
          dangerouslySetInnerHTML={{ __html: question.content }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {opts.map((opt) => {
            const key = opt.matchKey ?? opt.id;
            const selected = pairs.find((p) => p.key === key)?.value ?? "";
            return (
              <div key={opt.id} style={{
                display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: 10,
                border: `2px solid ${selected ? MLS_NAVY : "#E5E7EB"}`,
                background: selected ? "#EFF6FF" : "#FAFAFA",
              }}>
                <span style={{ fontSize: 15, color: "#111827", fontWeight: 500 }}>{opt.content}</span>
                <span style={{ color: "#9CA3AF", fontSize: 20, userSelect: "none" }}>↔</span>
                <select value={selected} onChange={(e) => setMatch(key, e.target.value)} style={{
                  padding: "8px 12px", borderRadius: 8, fontSize: 14,
                  border: `1px solid ${selected ? MLS_NAVY : "#D1D5DB"}`,
                  background: "#fff", color: "#111827", cursor: "pointer", outline: "none",
                }}>
                  <option value="">{t("select_placeholder")}</option>
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
    const orderedOpts = order.length === opts.length
      ? order.map((id) => opts.find((o) => o.id === id)).filter((o): o is NonNullable<typeof o> => o != null)
      : [...opts].sort((a, b) => a.displayOrder - b.displayOrder);
    const move = (fromIdx: number, direction: -1 | 1) => {
      const toIdx = fromIdx + direction;
      if (toIdx < 0 || toIdx >= orderedOpts.length) return;
      const next = [...orderedOpts];
      [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
      onChange(JSON.stringify(next.map((o) => o.id)));
    };
    return (
      <div>
        <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 8 }}>Câu {index + 1}/{total} · {t("ordering_hint")}</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#111827", lineHeight: 1.6, marginBottom: 20 }}
          dangerouslySetInnerHTML={{ __html: question.content }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {orderedOpts.map((opt, i) => (
            <div key={opt.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10,
              border: `2px solid ${MLS_NAVY}22`, background: "#F8FAFF",
            }}>
              <span style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: MLS_NAVY, color: "#fff", fontSize: 13, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{i + 1}</span>
              <span style={{ flex: 1, fontSize: 15, color: "#111827" }}>{opt.content}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <button onClick={() => move(i, -1)} disabled={i === 0} style={{
                  padding: "3px 8px", borderRadius: 5, border: "1px solid #D1D5DB",
                  background: i === 0 ? "#F3F4F6" : "#fff", cursor: i === 0 ? "default" : "pointer",
                  fontSize: 11, color: i === 0 ? "#9CA3AF" : "#374151", lineHeight: 1,
                }}>▲</button>
                <button onClick={() => move(i, 1)} disabled={i === orderedOpts.length - 1} style={{
                  padding: "3px 8px", borderRadius: 5, border: "1px solid #D1D5DB",
                  background: i === orderedOpts.length - 1 ? "#F3F4F6" : "#fff",
                  cursor: i === orderedOpts.length - 1 ? "default" : "pointer",
                  fontSize: 11, color: i === orderedOpts.length - 1 ? "#9CA3AF" : "#374151", lineHeight: 1,
                }}>▼</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // SingleChoice / TrueFalse
  return (
    <div>
      <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 8 }}>Câu {index + 1}/{total}</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: "#111827", lineHeight: 1.6, marginBottom: 20 }}
        dangerouslySetInnerHTML={{ __html: question.content }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {opts.map((opt) => {
          const chosen = answer === opt.id;
          return (
            <button key={opt.id} onClick={() => onChange(chosen ? "" : opt.id)} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 10,
              border: `2px solid ${chosen ? MLS_NAVY : "#E5E7EB"}`,
              background: chosen ? "#EFF6FF" : "#FAFAFA", cursor: "pointer", textAlign: "left",
            }}>
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

// ── Main page ──────────────────────────────────────────────────────────────

export default function QuizPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isHydrated = useAppSelector((s) => s.auth.isHydrated);
  const user = useAppSelector((s) => s.auth.user);
  const t = useTranslations("quiz");

  const [stage, setStage] = useState<Stage>("loading");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<AttemptQuestionDto[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<{ message: string; isMonthly: boolean; resetDate: string | null } | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<{ questionId: string; value: string } | null>(null);

  const { data: quiz } = useGetQuizPreviewQuery(id, { skip: !id });
  const [startAttempt] = useStartQuizAttemptMutation();
  const [saveAnswer] = useSaveAnswerMutation();
  const [submitAttempt] = useSubmitAttemptMutation();
  const [abandonAttempt] = useAbandonAttemptMutation();

  // Redirect if not authenticated
  useEffect(() => {
    if (isHydrated && !user) {
      router.replace(`/login?next=/quiz/${id}/play`);
    }
  }, [isHydrated, user, id, router]);

  // Auto-start attempt
  useEffect(() => {
    if (!isHydrated || !user || !id) return;
    (async () => {
      try {
        const res = await startAttempt({ quizId: id }).unwrap();
        setAttemptId(res.attemptId);
        setQuestions(res.questions);
        setStage("quiz");
      } catch (err: any) {
        if (err?.status === 429 || err?.data?.code === "TEST_QUOTA_EXCEEDED") {
          setQuotaError({
            message: err?.data?.message ?? "Bạn đã hết lượt thi.",
            isMonthly: err?.data?.isMonthly ?? false,
            resetDate: err?.data?.resetDate ?? null,
          });
        } else {
          setError(t("init_error"));
        }
      }
    })();
  }, [isHydrated, user, id]);

  // Timer
  useEffect(() => {
    if (stage !== "quiz") return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [stage]);

  // Time limit auto-submit
  useEffect(() => {
    if (stage !== "quiz" || !quiz?.timeLimitSeconds) return;
    if (elapsed >= quiz.timeLimitSeconds) handleSubmit();
  }, [elapsed, stage, quiz]);

  // Anti-cheat: warn on tab switch
  useEffect(() => {
    if (stage !== "quiz") return;
    const handler = () => {
      if (document.hidden) {
        console.warn("[AntiCheat] Tab switched");
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [stage]);

  // Y11: Save-on-navigate — flush pending answer when leaving a question
  const flushSave = useCallback(async () => {
    if (!attemptId || !pendingSave.current) return;
    const { questionId, value } = pendingSave.current;
    pendingSave.current = null;
    await saveAnswer({
      attemptId,
      questionId,
      answerValue: value || undefined,
      isSkipped: !value,
    }).catch(() => null);
  }, [attemptId, saveAnswer]);

  function handleAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // Track pending answer for save-on-navigate (no immediate network call)
    pendingSave.current = { questionId, value };
  }

  async function navigateTo(newIdx: number) {
    await flushSave();
    setCurrentIdx(newIdx);
  }

  async function handleSubmit() {
    if (!attemptId) return;
    setStage("submitting");
    await flushSave();  // Y11: save current answer before submitting
    try {
      await submitAttempt({ attemptId, timeTaken: elapsed }).unwrap();
      setStage("done");
      router.replace(`/quiz/${id}/result/${attemptId}`);
    } catch {
      setError(t("submit_error"));
      setStage("quiz");
    }
  }

  async function handleAbandon() {
    if (!attemptId) { router.replace(`/quiz/${id}`); return; }
    await abandonAttempt(attemptId).catch(() => {});
    router.replace(`/quiz/${id}`);
  }

  const q = questions[currentIdx];
  const answeredCount = Object.values(answers).filter(Boolean).length;

  if (!isHydrated || stage === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        {quotaError ? (
          <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Hết lượt thi</h2>
            <p style={{ color: "#6B7280", marginBottom: 8, lineHeight: 1.6 }}>{quotaError.message}</p>
            {quotaError.isMonthly && quotaError.resetDate && (
              <p style={{ color: "#9CA3AF", fontSize: 13, marginBottom: 20 }}>
                Reset vào {new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(quotaError.resetDate))}
              </p>
            )}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => router.replace(`/quiz/${id}`)} style={{ padding: "10px 24px", borderRadius: 8, border: `1px solid ${MLS_NAVY}`, background: "transparent", color: MLS_NAVY, cursor: "pointer", fontWeight: 600 }}>Quay lại</button>
              {!quotaError.isMonthly && (
                <button onClick={() => router.replace("/courses")} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: MLS_NAVY, color: "#fff", cursor: "pointer", fontWeight: 600 }}>Mua khoá học</button>
              )}
            </div>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: MLS_RED, marginBottom: 16 }}>{error}</p>
            <button onClick={() => router.replace(`/quiz/${id}`)} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: MLS_NAVY, color: "#fff", cursor: "pointer" }}>Quay lại</button>
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "#9CA3AF" }}>
            <div style={{ width: 48, height: 48, border: "4px solid #E5E7EB", borderTopColor: MLS_NAVY, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p>{t("loading_quiz")}</p>
          </div>
        )}
      </div>
    );
  }

  if (stage === "submitting" || stage === "done") {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center", color: "#9CA3AF" }}>
          <div style={{ width: 48, height: 48, border: "4px solid #E5E7EB", borderTopColor: MLS_NAVY, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p>{t("submitting")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", background: "#F8FAFC", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Top bar ── */}
      <div style={{
        background: MLS_NAVY, padding: "0 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 52, flexShrink: 0,
        position: "relative", zIndex: 10,
      }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 420 }}>
          {quiz?.title ?? "Bài kiểm tra"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "5px 14px", color: "#fff", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13 }}>⏱</span>
            <TimerDisplay elapsed={elapsed} limit={quiz?.timeLimitSeconds ?? null} />
          </div>
          <button onClick={handleAbandon} style={{
            padding: "5px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.35)",
            background: "transparent", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 13,
          }}>
            {t("exit")}
          </button>
        </div>
      </div>

      {/* Thin progress stripe */}
      <div style={{ background: "#D1D5DB", height: 3, flexShrink: 0 }}>
        <div style={{
          height: "100%",
          background: answeredCount === questions.length
            ? `linear-gradient(90deg, #16A34A, #22C55E)`
            : `linear-gradient(90deg, ${MLS_NAVY}, #42A5F5)`,
          width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%`,
          transition: "width 0.4s ease",
        }} />
      </div>

      {/* ── Body: sidebar + content ── */}
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
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("progress")}</span>
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
            {questions.map((qs, i) => {
              const answered = !!answers[qs.questionId];
              const active = i === currentIdx;
              return (
                <button
                  key={qs.questionId}
                  onClick={() => navigateTo(i)}
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
            {t("submit")} ({answeredCount}/{questions.length})
          </button>
        </aside>

        {/* ─────────── MAIN CONTENT ─────────── */}
        <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          {q && (
            <div style={{ maxWidth: 720, margin: "0 auto" }}>

              {/* Question card */}
              <div style={{
                background: "#fff", borderRadius: 16,
                boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
                padding: "32px 28px", marginBottom: 20,
              }}>
                <QuestionCard
                  question={q}
                  index={currentIdx}
                  total={questions.length}
                  answer={answers[q.questionId] ?? ""}
                  onChange={(val) => handleAnswer(q.questionId, val)}
                />
              </div>

              {/* Prev / counter / Next */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  onClick={() => navigateTo(Math.max(0, currentIdx - 1))}
                  disabled={currentIdx === 0}
                  style={{
                    padding: "11px 24px", borderRadius: 10,
                    border: "2px solid #E5E7EB", background: "transparent",
                    color: currentIdx === 0 ? "#D1D5DB" : "#374151",
                    cursor: currentIdx === 0 ? "not-allowed" : "pointer",
                    fontWeight: 600, fontSize: 15,
                  }}
                >
                  ← Trước
                </button>

                <span style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 500 }}>
                  {currentIdx + 1} / {questions.length}
                </span>

                <button
                  onClick={() => navigateTo(Math.min(questions.length - 1, currentIdx + 1))}
                  disabled={currentIdx === questions.length - 1}
                  style={{
                    padding: "11px 24px", borderRadius: 10, border: "none",
                    background: currentIdx < questions.length - 1 ? MLS_NAVY : "#E5E7EB",
                    color: currentIdx < questions.length - 1 ? "#fff" : "#9CA3AF",
                    cursor: currentIdx < questions.length - 1 ? "pointer" : "not-allowed",
                    fontWeight: 600, fontSize: 15,
                  }}
                >
                  {t("next_question")}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {error && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: MLS_RED, color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 14, zIndex: 100 }}>
          {error}
        </div>
      )}
    </div>
  );
}
