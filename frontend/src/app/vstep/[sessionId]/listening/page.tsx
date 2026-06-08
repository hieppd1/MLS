"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import AppShell from "../../../_components/AppShell";
import {
  useGetSessionQuery,
  useGetPassagesQuery,
  useStartPartMutation,
  useSubmitPartMutation,
} from "@/lib/features/quiz/vstepApi";
import { useGetQuizQuery, type QuizQuestionDto, type QuizOptionDto } from "@/lib/features/quiz/quizApi";

export default function VSTEPListeningPage() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const t = useTranslations("vstep_player");

  const { data: session } = useGetSessionQuery(sessionId);
  const [startPart, { isLoading: starting }] = useStartPartMutation();
  const [submitPart, { isLoading: submitting }] = useSubmitPartMutation();

  const [attemptId, setAttemptId] = useState<string | null>(
    session?.listeningAttemptId ?? null
  );
  const urlQuizId = useSearchParams().get("quizId") ?? "";
  const [quizId, setQuizId] = useState<string | null>(null);
  const autoStarted = useRef(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [playCount, setPlayCount] = useState<Record<string, number>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const { data: passages } = useGetPassagesQuery(quizId ?? "", { skip: !quizId });
  const { data: quizDetail } = useGetQuizQuery(quizId ?? "", { skip: !quizId });

  // If part already started, restore quizId from session
  useEffect(() => {
    if (session?.listeningAttemptId) {
      setAttemptId(session.listeningAttemptId);
    }
  }, [session]);

  // Auto-start from URL quizId param
  useEffect(() => {
    if (urlQuizId && session && !session.listeningAttemptId && !quizId && !autoStarted.current) {
      autoStarted.current = true;
      handleStart(urlQuizId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuizId, session, quizId]);

  const handleStart = async (selectedQuizId: string) => {
    try {
      const result = await startPart({ sessionId, part: "Listening", quizId: selectedQuizId }).unwrap();
      setAttemptId(result.attemptId);
      setQuizId(selectedQuizId);
    } catch {
      setError(t("listening_start_error"));
    }
  };

  const handleSubmit = async () => {
    if (!quizDetail) return;
    const questions: QuizQuestionDto[] = quizDetail?.questions ?? [];
    const totalQ = questions.length;
    const correct = questions.filter(q => {
      const correctOpt = q.options.find(o => o.isCorrect);
      return correctOpt && answers[q.questionId] === correctOpt.id;
    }).length;
    const computed = totalQ > 0 ? (correct / totalQ) * 10 : 0;

    try {
      await submitPart({ sessionId, part: "Listening", score: parseFloat(computed.toFixed(2)) }).unwrap();
      setScore(computed);
      setSubmitted(true);
    } catch {
      setError(t("submit_error"));
    }
  };

  if (!session) {
    return <AppShell><div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>{t("loading")}</div></AppShell>;
  }

  // Part already completed
  if (session.listeningScore !== null) {
    return (
      <AppShell>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#111827", marginTop: 12 }}>{t("listening_completed")}</h2>
          <p style={{ color: "#6B7280", marginTop: 8 }}>{t("score_label")}<strong>{session.listeningScore?.toFixed(1)}</strong>{t("score_suffix")}</p>
          <button
            onClick={() => router.push(`/vstep/${sessionId}`)}
            style={{ marginTop: 20, padding: "10px 28px", borderRadius: 99, background: "#3B82F6", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}
          >
            {t("continue_reading")}
          </button>
        </div>
      </AppShell>
    );
  }

  // If no quiz selected yet (quizId not set and no passages)
  if (!quizId && !session.listeningAttemptId) {
    return (
      <AppShell>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px" }}>
          <button onClick={() => router.push(`/vstep/${sessionId}`)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", fontSize: 14, marginBottom: 16 }}>{t("back")}</button>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#111827" }}>{t("listening_h2")}</h2>
          <p style={{ color: "#6B7280", marginTop: 6, marginBottom: 24 }}>{t("listening_info")}</p>
          <p style={{ color: "#374151", marginBottom: 16 }}>{t("quiz_id_prompt")}</p>
          <QuizIdInput onConfirm={handleStart} loading={starting} placeholder={t("quiz_id_uuid_ph")} loadingLabel={t("quiz_id_loading")} startLabel={t("quiz_id_start")} />
          {error && <p style={{ color: "#EF4444", marginTop: 12, fontSize: 13 }}>{error}</p>}
        </div>
      </AppShell>
    );
  }

  // Submitted → show score
  if (submitted && score !== null) {
    return (
      <AppShell>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>🎉</div>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#111827" }}>{t("submit_success")}</h2>
          <p style={{ color: "#3B82F6", fontSize: 28, fontWeight: 700, marginTop: 8 }}>{score.toFixed(1)}{t("score_suffix")}</p>
          <button
            onClick={() => router.push(`/vstep/${sessionId}`)}
            style={{ marginTop: 24, padding: "10px 28px", borderRadius: 99, background: "#3B82F6", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}
          >
            {t("continue_reading")}
          </button>
        </div>
      </AppShell>
    );
  }

  // Main exam UI
  const questions = quizDetail?.questions ?? [];
  const totalAnswered = Object.keys(answers).length;
  const typedQuestions: QuizQuestionDto[] = questions;

  return (
    <AppShell>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 18, color: "#111827", margin: 0 }}>{t("listening_header")}</h2>
            <p style={{ color: "#6B7280", fontSize: 12, margin: "4px 0 0" }}>
              {t("answered_count", { answered: totalAnswered, total: questions.length })}
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: "9px 24px", borderRadius: 99, border: "none",
              background: submitting ? "#D1D5DB" : "#3B82F6",
              color: "white", fontWeight: 600, fontSize: 14, cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? t("submitting") : t("submit")}
          </button>
        </div>

        {/* Passages with audio + questions */}
        {passages?.map(pg => (
          <div key={pg.id} style={{ background: "white", borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
            {pg.audioUrl && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>
                  {t("passage_audio", { n: pg.groupIndex + 1, limit: pg.audioPlayLimit })}
                  {playCount[pg.id] != null && <span>{t("played_count", { count: playCount[pg.id] ?? 0 })}</span>}
                </div>
                <audio
                  ref={el => { audioRefs.current[pg.id] = el; }}
                  src={pg.audioUrl}
                  controls
                  onPlay={() => setPlayCount(p => ({
                    ...p, [pg.id]: (p[pg.id] ?? 0) + 1,
                  }))}
                  style={{ width: "100%" }}
                />
              </div>
            )}

            {/* Questions for this passage */}
            {typedQuestions
              .filter(q => pg.questionIds.includes(q.questionId))
              .map((q, qIdx) => (
                <div key={q.questionId} style={{ marginBottom: 16 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", marginBottom: 8 }}>
                    {qIdx + 1}. {q.content}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {q.options.map((opt: QuizOptionDto, i: number) => {
                      const letter = String.fromCharCode(65 + i);
                      const chosen = answers[q.questionId] === opt.id;
                      return (
                        <label key={opt.id} style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                          border: `2px solid ${chosen ? "#3B82F6" : "#E5E7EB"}`,
                          background: chosen ? "#EFF6FF" : "white",
                        }}>
                          <input
                            type="radio"
                            name={q.questionId}
                            checked={chosen}
                            onChange={() => setAnswers(a => ({ ...a, [q.questionId]: opt.id }))}
                            style={{ accentColor: "#3B82F6" }}
                          />
                          <span style={{ fontSize: 14, color: "#374151" }}>{letter}. {opt.content}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        ))}

        {error && <p style={{ color: "#EF4444", fontSize: 13, marginTop: 8 }}>{error}</p>}
      </div>
    </AppShell>
  );
}

// Inline component for quiz ID input
function QuizIdInput({ onConfirm, loading, placeholder, loadingLabel, startLabel }: { onConfirm: (id: string) => void; loading: boolean; placeholder: string; loadingLabel: string; startLabel: string }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder={placeholder}
        style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "2px solid #E5E7EB", fontSize: 14 }}
      />
      <button
        onClick={() => onConfirm(val.trim())}
        disabled={loading || !val.trim()}
        style={{
          padding: "10px 20px", borderRadius: 8, border: "none",
          background: loading || !val.trim() ? "#D1D5DB" : "#3B82F6",
          color: "white", fontWeight: 600, cursor: loading || !val.trim() ? "not-allowed" : "pointer",
        }}
      >
        {loading ? loadingLabel : startLabel}
      </button>
    </div>
  );
}
