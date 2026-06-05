"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import AppShell from "../../../_components/AppShell";
import {
  useGetSessionQuery,
  useGetPassagesQuery,
  useStartPartMutation,
  useSubmitPartMutation,
} from "@/lib/features/quiz/vstepApi";
import { useGetQuizQuery, type QuizQuestionDto, type QuizOptionDto } from "@/lib/features/quiz/quizApi";

export default function VSTEPReadingPage() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();

  const { data: session } = useGetSessionQuery(sessionId);
  const [startPart, { isLoading: starting }] = useStartPartMutation();
  const [submitPart, { isLoading: submitting }] = useSubmitPartMutation();

  const [quizId, setQuizId] = useState<string | null>(null);
  const autoStarted = useRef(false);
  const urlQuizId = useSearchParams().get("quizId") ?? "";
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [activePassage, setActivePassage] = useState(0);
  const [error, setError] = useState("");

  const { data: passages } = useGetPassagesQuery(quizId ?? "", { skip: !quizId });
  const { data: quizDetail } = useGetQuizQuery(quizId ?? "", { skip: !quizId });

  // Auto-start from URL quizId param
  useEffect(() => {
    if (urlQuizId && session && !session.readingAttemptId && !quizId && !autoStarted.current) {
      autoStarted.current = true;
      handleStart(urlQuizId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuizId, session, quizId]);

  if (!session) return <AppShell><div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Đang tải...</div></AppShell>;

  // Already completed
  if (session.readingScore !== null) {
    return (
      <AppShell>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#111827" }}>Phần Đọc đã hoàn thành</h2>
          <p style={{ color: "#6B7280", marginTop: 8 }}>Điểm: <strong>{session.readingScore?.toFixed(1)}</strong> / 10</p>
          <button onClick={() => router.push(`/vstep/${sessionId}`)}
            style={{ marginTop: 20, padding: "10px 28px", borderRadius: 99, background: "#10B981", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}>
            Tiếp tục phần Viết →
          </button>
        </div>
      </AppShell>
    );
  }

  const handleStart = async (selectedQuizId: string) => {
    try {
      await startPart({ sessionId, part: "Reading", quizId: selectedQuizId }).unwrap();
      setQuizId(selectedQuizId);
    } catch {
      setError("Không thể bắt đầu phần Đọc. Vui lòng thử lại.");
    }
  };

  const handleSubmit = async () => {
    const questions: QuizQuestionDto[] = quizDetail?.questions ?? [];
    const correct = questions.filter(q => {
      const correctOpt = q.options.find(o => o.isCorrect);
      return correctOpt && answers[q.questionId] === correctOpt.id;
    }).length;
    const computed = questions.length > 0 ? (correct / questions.length) * 10 : 0;
    try {
      await submitPart({ sessionId, part: "Reading", score: parseFloat(computed.toFixed(2)) }).unwrap();
      setScore(computed);
      setSubmitted(true);
    } catch {
      setError("Không thể nộp bài. Vui lòng thử lại.");
    }
  };

  if (!quizId && !session.readingAttemptId) {
    return (
      <AppShell>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px" }}>
          <button onClick={() => router.push(`/vstep/${sessionId}`)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", fontSize: 14, marginBottom: 16 }}>← Quay lại</button>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#111827" }}>📖 Phần 2: Đọc hiểu</h2>
          <p style={{ color: "#6B7280", marginTop: 6, marginBottom: 24 }}>40 câu MCQ · 60 phút · Đọc bài và trả lời câu hỏi</p>
          <QuizIdInput onConfirm={handleStart} loading={starting} label="Quiz ID cho phần Đọc..." />
          {error && <p style={{ color: "#EF4444", marginTop: 12, fontSize: 13 }}>{error}</p>}
        </div>
      </AppShell>
    );
  }

  if (submitted && score !== null) {
    return (
      <AppShell>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>🎉</div>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#111827" }}>Nộp bài thành công!</h2>
          <p style={{ color: "#10B981", fontSize: 28, fontWeight: 700, marginTop: 8 }}>{score.toFixed(1)} / 10</p>
          <button onClick={() => router.push(`/vstep/${sessionId}`)}
            style={{ marginTop: 24, padding: "10px 28px", borderRadius: 99, background: "#10B981", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}>
            Tiếp tục phần Viết →
          </button>
        </div>
      </AppShell>
    );
  }

  const questions: QuizQuestionDto[] = quizDetail?.questions ?? [];
  const currentPassage = passages?.[activePassage];
  const passageQuestions = currentPassage
    ? questions.filter(q => currentPassage.questionIds.includes(q.questionId))
    : [];
  const totalAnswered = Object.keys(answers).length;

  return (
    <AppShell>
      <div style={{ height: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 20px", background: "white", borderBottom: "1px solid #E5E7EB",
          flexShrink: 0,
        }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>📖 Phần Đọc</span>
            <span style={{ color: "#6B7280", fontSize: 13, marginLeft: 10 }}>{totalAnswered}/{questions.length} câu</span>
          </div>
          {/* Passage tabs */}
          <div style={{ display: "flex", gap: 6 }}>
            {passages?.map((pg, i) => (
              <button
                key={pg.id}
                onClick={() => setActivePassage(i)}
                style={{
                  padding: "5px 14px", borderRadius: 99, border: "none",
                  background: activePassage === i ? "#10B981" : "#F3F4F6",
                  color: activePassage === i ? "white" : "#374151",
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                }}
              >
                Bài {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: "8px 22px", borderRadius: 99, border: "none",
              background: submitting ? "#D1D5DB" : "#10B981",
              color: "white", fontWeight: 600, fontSize: 13, cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Đang nộp..." : "Nộp bài"}
          </button>
        </div>

        {/* Split view */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left: passage */}
          <div style={{
            flex: 1, padding: 24, overflowY: "auto",
            borderRight: "1px solid #E5E7EB", background: "#FAFAFA",
          }}>
            {currentPassage?.passageText ? (
              <div style={{ lineHeight: 1.7, fontSize: 15, color: "#374151", whiteSpace: "pre-wrap" }}>
                {currentPassage.passageText}
              </div>
            ) : (
              <p style={{ color: "#9CA3AF" }}>Không có bài đọc cho đoạn này.</p>
            )}
          </div>

          {/* Right: questions */}
          <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
            {passageQuestions.map((q, idx) => (
              <div key={q.questionId} style={{ marginBottom: 20 }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", marginBottom: 8 }}>
                  {idx + 1}. {q.content}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {q.options.map((opt: QuizOptionDto, i: number) => {
                    const letter = String.fromCharCode(65 + i);
                    const chosen = answers[q.questionId] === opt.id;
                    return (
                      <label key={opt.id} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 12px", borderRadius: 8, cursor: "pointer",
                        border: `2px solid ${chosen ? "#10B981" : "#E5E7EB"}`,
                        background: chosen ? "#F0FDF4" : "white",
                      }}>
                        <input
                          type="radio" name={q.questionId} checked={chosen}
                          onChange={() => setAnswers(a => ({ ...a, [q.questionId]: opt.id }))}
                          style={{ accentColor: "#10B981" }}
                        />
                        <span style={{ fontSize: 14, color: "#374151" }}>{letter}. {opt.content}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <p style={{ color: "#EF4444", fontSize: 13, padding: "0 20px 12px" }}>{error}</p>}
      </div>
    </AppShell>
  );
}

function QuizIdInput({ onConfirm, loading, label }: { onConfirm: (id: string) => void; loading: boolean; label: string }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <input value={val} onChange={e => setVal(e.target.value)} placeholder={label}
        style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "2px solid #E5E7EB", fontSize: 14 }} />
      <button onClick={() => onConfirm(val.trim())} disabled={loading || !val.trim()}
        style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: loading || !val.trim() ? "#D1D5DB" : "#10B981", color: "white", fontWeight: 600, cursor: loading || !val.trim() ? "not-allowed" : "pointer" }}>
        {loading ? "..." : "Bắt đầu"}
      </button>
    </div>
  );
}
