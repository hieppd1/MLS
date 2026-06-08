"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import AppShell from "../../../_components/AppShell";
import {
  useGetSessionQuery,
  useStartPartMutation,
  useSubmitPartMutation,
} from "@/lib/features/quiz/vstepApi";

const MIN_WORDS_TASK1 = 120;
const MIN_WORDS_TASK2 = 250;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function VSTEPWritingPage() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const t = useTranslations("vstep_player");

  const { data: session } = useGetSessionQuery(sessionId);
  const [startPart, { isLoading: starting }] = useStartPartMutation();
  const [submitPart, { isLoading: submitting }] = useSubmitPartMutation();

  const [quizId, setQuizId] = useState<string | null>(null);
  const [attemptStarted, setAttemptStarted] = useState(false);
  const autoStarted = useRef(false);
  const urlQuizId = useSearchParams().get("quizId") ?? "";
  const [task1, setTask1] = useState("");
  const [task2, setTask2] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Auto-start from URL quizId param
  useEffect(() => {
    if (urlQuizId && session && !session.writingAttemptId && !quizId && !autoStarted.current) {
      autoStarted.current = true;
      handleStart(urlQuizId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuizId, session, quizId]);

  if (!session) return <AppShell><div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>{t("loading")}</div></AppShell>;

  if (session.writingScore !== null) {
    return (
      <AppShell>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#111827" }}>{t("writing_completed")}</h2>
          <p style={{ color: "#6B7280", marginTop: 8 }}>{t("score_label")}<strong>{session.writingScore?.toFixed(1)}</strong>{t("score_suffix")}</p>
          <p style={{ color: "#F59E0B", fontSize: 13, marginTop: 8 }}>{t("writing_graded_note")}</p>
          <button onClick={() => router.push(`/vstep/${sessionId}`)}
            style={{ marginTop: 20, padding: "10px 28px", borderRadius: 99, background: "#F59E0B", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}>
            {t("continue_speaking")}
          </button>
        </div>
      </AppShell>
    );
  }

  const handleStart = async (selectedQuizId: string) => {
    try {
      await startPart({ sessionId, part: "Writing", quizId: selectedQuizId }).unwrap();
      setQuizId(selectedQuizId);
      setAttemptStarted(true);
    } catch {
      setError(t("submit_error"));
    }
  };

  const handleSubmit = async () => {
    const w1 = countWords(task1);
    const w2 = countWords(task2);
    if (w1 < MIN_WORDS_TASK1) {
      setError(t("task1_min_error", { min: MIN_WORDS_TASK1, count: w1 }));
      return;
    }
    if (w2 < MIN_WORDS_TASK2) {
      setError(t("task2_min_error", { min: MIN_WORDS_TASK2, count: w2 }));
      return;
    }
    setError("");
    // Writing is graded by teacher/AI; submit placeholder score 0 (will be updated later)
    try {
      await submitPart({ sessionId, part: "Writing", score: 0 }).unwrap();
      setSubmitted(true);
    } catch {
      setError(t("submit_error"));
    }
  };

  if (!attemptStarted && !session.writingAttemptId) {
    return (
      <AppShell>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px" }}>
          <button onClick={() => router.push(`/vstep/${sessionId}`)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", fontSize: 14, marginBottom: 16 }}>{t("back")}</button>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#111827" }}>{t("writing_h2")}</h2>
          <p style={{ color: "#6B7280", marginTop: 6, marginBottom: 8 }}>{t("writing_info")}</p>
          <div style={{ background: "#FFFBEB", borderRadius: 10, padding: 14, marginBottom: 24, fontSize: 13, color: "#92400E", lineHeight: 1.6 }}>
            {t("writing_instructions", { min1: MIN_WORDS_TASK1, min2: MIN_WORDS_TASK2 })}
            <br />{t("writing_grading_note")}
          </div>
          <QuizIdInput onConfirm={handleStart} loading={starting} label={t("quiz_id_writing_ph")} loadingLabel={t("quiz_id_loading")} startLabel={t("quiz_id_start")} />
          {error && <p style={{ color: "#EF4444", marginTop: 12, fontSize: 13 }}>{error}</p>}
        </div>
      </AppShell>
    );
  }

  if (submitted) {
    return (
      <AppShell>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>📬</div>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#111827" }}>{t("writing_submitted")}</h2>
          <p style={{ color: "#6B7280", marginTop: 8 }}>{t("writing_pending")}</p>
          <button onClick={() => router.push(`/vstep/${sessionId}`)}
            style={{ marginTop: 24, padding: "10px 28px", borderRadius: 99, background: "#F59E0B", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}>
            {t("continue_speaking")}
          </button>
        </div>
      </AppShell>
    );
  }

  const w1 = countWords(task1);
  const w2 = countWords(task2);

  return (
    <AppShell>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 18, color: "#111827", margin: 0 }}>{t("writing_header")}</h2>
            <p style={{ color: "#6B7280", fontSize: 12, margin: "4px 0 0" }}>{t("writing_instruction")}</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ padding: "9px 24px", borderRadius: 99, border: "none", background: submitting ? "#D1D5DB" : "#F59E0B", color: "white", fontWeight: 600, fontSize: 14, cursor: submitting ? "not-allowed" : "pointer" }}
          >
            {submitting ? t("submitting") : t("submit")}
          </button>
        </div>

        {/* Task 1 */}
        <div style={{ background: "white", borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontWeight: 600, fontSize: 15, color: "#111827", margin: 0 }}>{t("task1_title")}</h3>
            <span style={{ fontSize: 12, color: w1 >= MIN_WORDS_TASK1 ? "#10B981" : "#F59E0B", fontWeight: 600 }}>
              {t("word_count", { count: w1, required: MIN_WORDS_TASK1 })}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>
            {t("task1_desc")}
          </p>
          <textarea
            value={task1}
            onChange={e => setTask1(e.target.value)}
            placeholder={t("task1_ph")}
            style={{
              width: "100%", minHeight: 200, padding: 14, borderRadius: 8,
              border: "2px solid #E5E7EB", fontSize: 14, lineHeight: 1.7,
              resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Task 2 */}
        <div style={{ background: "white", borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontWeight: 600, fontSize: 15, color: "#111827", margin: 0 }}>{t("task2_title")}</h3>
            <span style={{ fontSize: 12, color: w2 >= MIN_WORDS_TASK2 ? "#10B981" : "#F59E0B", fontWeight: 600 }}>
              {t("word_count", { count: w2, required: MIN_WORDS_TASK2 })}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>
            {t("task2_desc")}
          </p>
          <textarea
            value={task2}
            onChange={e => setTask2(e.target.value)}
            placeholder={t("task2_ph")}
            style={{
              width: "100%", minHeight: 280, padding: 14, borderRadius: 8,
              border: "2px solid #E5E7EB", fontSize: 14, lineHeight: 1.7,
              resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
        </div>

        {error && <p style={{ color: "#EF4444", fontSize: 13 }}>{error}</p>}
      </div>
    </AppShell>
  );
}

function QuizIdInput({ onConfirm, loading, label, loadingLabel, startLabel }: { onConfirm: (id: string) => void; loading: boolean; label: string; loadingLabel: string; startLabel: string }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <input value={val} onChange={e => setVal(e.target.value)} placeholder={label}
        style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "2px solid #E5E7EB", fontSize: 14 }} />
      <button onClick={() => onConfirm(val.trim())} disabled={loading || !val.trim()}
        style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: loading || !val.trim() ? "#D1D5DB" : "#F59E0B", color: "white", fontWeight: 600, cursor: loading || !val.trim() ? "not-allowed" : "pointer" }}>
        {loading ? loadingLabel : startLabel}
      </button>
    </div>
  );
}
