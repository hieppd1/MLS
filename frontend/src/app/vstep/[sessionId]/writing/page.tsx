"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import AppShell from "../../../_components/AppShell";
import {
  useGetSessionQuery,
  useStartPartMutation,
  useSubmitPartMutation,
} from "@/lib/features/quiz/vstepApi";

const TASK1_PROMPT = "Task 1 — Viết thư (Letter Writing)";
const TASK2_PROMPT = "Task 2 — Viết luận (Essay Writing)";

const MIN_WORDS_TASK1 = 120;
const MIN_WORDS_TASK2 = 250;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function VSTEPWritingPage() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();

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

  if (!session) return <AppShell><div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Đang tải...</div></AppShell>;

  if (session.writingScore !== null) {
    return (
      <AppShell>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#111827" }}>Phần Viết đã hoàn thành</h2>
          <p style={{ color: "#6B7280", marginTop: 8 }}>Điểm: <strong>{session.writingScore?.toFixed(1)}</strong> / 10</p>
          <p style={{ color: "#F59E0B", fontSize: 13, marginTop: 8 }}>Bài viết sẽ được chấm bởi giáo viên / AI.</p>
          <button onClick={() => router.push(`/vstep/${sessionId}`)}
            style={{ marginTop: 20, padding: "10px 28px", borderRadius: 99, background: "#F59E0B", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}>
            Tiếp tục phần Nói →
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
      setError("Không thể bắt đầu phần Viết. Vui lòng thử lại.");
    }
  };

  const handleSubmit = async () => {
    const w1 = countWords(task1);
    const w2 = countWords(task2);
    if (w1 < MIN_WORDS_TASK1) {
      setError(`Task 1 cần ít nhất ${MIN_WORDS_TASK1} từ (hiện tại: ${w1} từ).`);
      return;
    }
    if (w2 < MIN_WORDS_TASK2) {
      setError(`Task 2 cần ít nhất ${MIN_WORDS_TASK2} từ (hiện tại: ${w2} từ).`);
      return;
    }
    setError("");
    // Writing is graded by teacher/AI; submit placeholder score 0 (will be updated later)
    try {
      await submitPart({ sessionId, part: "Writing", score: 0 }).unwrap();
      setSubmitted(true);
    } catch {
      setError("Không thể nộp bài. Vui lòng thử lại.");
    }
  };

  if (!attemptStarted && !session.writingAttemptId) {
    return (
      <AppShell>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px" }}>
          <button onClick={() => router.push(`/vstep/${sessionId}`)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", fontSize: 14, marginBottom: 16 }}>← Quay lại</button>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#111827" }}>✍️ Phần 3: Viết</h2>
          <p style={{ color: "#6B7280", marginTop: 6, marginBottom: 8 }}>2 tasks · 60 phút</p>
          <div style={{ background: "#FFFBEB", borderRadius: 10, padding: 14, marginBottom: 24, fontSize: 13, color: "#92400E", lineHeight: 1.6 }}>
            <strong>Task 1:</strong> Viết thư (≥ {MIN_WORDS_TASK1} từ) &nbsp;|&nbsp;
            <strong>Task 2:</strong> Viết luận (≥ {MIN_WORDS_TASK2} từ)
            <br />Bài viết sẽ được chấm bởi giáo viên hoặc AI sau khi nộp.
          </div>
          <QuizIdInput onConfirm={handleStart} loading={starting} label="Quiz ID cho phần Viết..." />
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
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#111827" }}>Đã nộp bài viết!</h2>
          <p style={{ color: "#6B7280", marginTop: 8 }}>Bài viết của bạn đang chờ chấm điểm.</p>
          <button onClick={() => router.push(`/vstep/${sessionId}`)}
            style={{ marginTop: 24, padding: "10px 28px", borderRadius: 99, background: "#F59E0B", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}>
            Tiếp tục phần Nói →
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
            <h2 style={{ fontWeight: 700, fontSize: 18, color: "#111827", margin: 0 }}>✍️ Phần Viết</h2>
            <p style={{ color: "#6B7280", fontSize: 12, margin: "4px 0 0" }}>Hoàn thành cả 2 tasks trước khi nộp bài.</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ padding: "9px 24px", borderRadius: 99, border: "none", background: submitting ? "#D1D5DB" : "#F59E0B", color: "white", fontWeight: 600, fontSize: 14, cursor: submitting ? "not-allowed" : "pointer" }}
          >
            {submitting ? "Đang nộp..." : "Nộp bài"}
          </button>
        </div>

        {/* Task 1 */}
        <div style={{ background: "white", borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontWeight: 600, fontSize: 15, color: "#111827", margin: 0 }}>{TASK1_PROMPT}</h3>
            <span style={{ fontSize: 12, color: w1 >= MIN_WORDS_TASK1 ? "#10B981" : "#F59E0B", fontWeight: 600 }}>
              {w1} / {MIN_WORDS_TASK1} từ
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>
            Viết một bức thư (chính thức hoặc thông thường) theo đề bài được cung cấp trong tài liệu thi.
          </p>
          <textarea
            value={task1}
            onChange={e => setTask1(e.target.value)}
            placeholder="Viết bài Task 1 tại đây..."
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
            <h3 style={{ fontWeight: 600, fontSize: 15, color: "#111827", margin: 0 }}>{TASK2_PROMPT}</h3>
            <span style={{ fontSize: 12, color: w2 >= MIN_WORDS_TASK2 ? "#10B981" : "#F59E0B", fontWeight: 600 }}>
              {w2} / {MIN_WORDS_TASK2} từ
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>
            Viết một bài luận về chủ đề được nêu trong tài liệu thi.
          </p>
          <textarea
            value={task2}
            onChange={e => setTask2(e.target.value)}
            placeholder="Viết bài Task 2 tại đây..."
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

function QuizIdInput({ onConfirm, loading, label }: { onConfirm: (id: string) => void; loading: boolean; label: string }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <input value={val} onChange={e => setVal(e.target.value)} placeholder={label}
        style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "2px solid #E5E7EB", fontSize: 14 }} />
      <button onClick={() => onConfirm(val.trim())} disabled={loading || !val.trim()}
        style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: loading || !val.trim() ? "#D1D5DB" : "#F59E0B", color: "white", fontWeight: 600, cursor: loading || !val.trim() ? "not-allowed" : "pointer" }}>
        {loading ? "..." : "Bắt đầu"}
      </button>
    </div>
  );
}
