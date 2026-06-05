"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import AppShell from "../../../_components/AppShell";
import {
  useGetSessionQuery,
  useStartPartMutation,
  useSubmitPartMutation,
} from "@/lib/features/quiz/vstepApi";

const PARTS = [
  { id: "P1", label: "Phần 1: Tự giới thiệu", duration: 120, icon: "👋", hint: "Giới thiệu bản thân (tên, quê quán, nghề nghiệp, sở thích)." },
  { id: "P2", label: "Phần 2: Mô tả ảnh", duration: 180, icon: "🖼", hint: "Mô tả hình ảnh được cung cấp trong tài liệu thi." },
  { id: "P3", label: "Phần 3: Thảo luận", duration: 300, icon: "💬", hint: "Thảo luận về chủ đề theo hướng dẫn trong tài liệu thi." },
];

type RecordingState = "idle" | "recording" | "done";

export default function VSTEPSpeakingPage() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();

  const { data: session } = useGetSessionQuery(sessionId);
  const [startPart, { isLoading: starting }] = useStartPartMutation();
  const [submitPart, { isLoading: submitting }] = useSubmitPartMutation();

  const [quizId, setQuizId] = useState<string | null>(null);
  const [attemptStarted, setAttemptStarted] = useState(false);
  const autoStarted = useRef(false);
  const urlQuizId = useSearchParams().get("quizId") ?? "";
  const [recordings, setRecordings] = useState<Record<string, Blob | null>>({});
  const [recordingState, setRecordingState] = useState<Record<string, RecordingState>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // Auto-start from URL quizId param
  useEffect(() => {
    if (urlQuizId && session && !session.speakingAttemptId && !quizId && !autoStarted.current) {
      autoStarted.current = true;
      handleStart(urlQuizId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuizId, session, quizId]);

  if (!session) return <AppShell><div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Đang tải...</div></AppShell>;

  if (session.speakingScore !== null) {
    return (
      <AppShell>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#111827" }}>Phần Nói đã hoàn thành</h2>
          <p style={{ color: "#6B7280", marginTop: 8 }}>Điểm: <strong>{session.speakingScore?.toFixed(1)}</strong> / 10</p>
          <p style={{ color: "#EF4444", fontSize: 13, marginTop: 8 }}>Bài nói sẽ được chấm bởi giáo viên / AI.</p>
          <button onClick={() => router.push(`/vstep/${sessionId}`)}
            style={{ marginTop: 20, padding: "10px 28px", borderRadius: 99, background: "#EF4444", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}>
            Xem tổng kết →
          </button>
        </div>
      </AppShell>
    );
  }

  const handleStart = async (selectedQuizId: string) => {
    try {
      await startPart({ sessionId, part: "Speaking", quizId: selectedQuizId }).unwrap();
      setQuizId(selectedQuizId);
      setAttemptStarted(true);
    } catch {
      setError("Không thể bắt đầu phần Nói. Vui lòng thử lại.");
    }
  };

  const startRecording = async (partId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordings(r => ({ ...r, [partId]: blob }));
        setRecordingState(s => ({ ...s, [partId]: "done" }));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecordingState(s => ({ ...s, [partId]: "recording" }));
    } catch {
      setError("Không thể truy cập micro. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const handleSubmit = async () => {
    // Speaking is scored by teacher/AI; submit placeholder score 0
    try {
      await submitPart({ sessionId, part: "Speaking", score: 0 }).unwrap();
      setSubmitted(true);
    } catch {
      setError("Không thể nộp bài. Vui lòng thử lại.");
    }
  };

  if (!attemptStarted && !session.speakingAttemptId) {
    return (
      <AppShell>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px" }}>
          <button onClick={() => router.push(`/vstep/${sessionId}`)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", fontSize: 14, marginBottom: 16 }}>← Quay lại</button>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#111827" }}>🎙 Phần 4: Nói</h2>
          <p style={{ color: "#6B7280", marginTop: 6, marginBottom: 8 }}>3 phần nói · 12 phút tổng cộng</p>
          <div style={{ background: "#FEF2F2", borderRadius: 10, padding: 14, marginBottom: 24, fontSize: 13, color: "#991B1B", lineHeight: 1.6 }}>
            Đảm bảo micro đang hoạt động trước khi bắt đầu. Bài nói sẽ được chấm sau khi nộp.
          </div>
          <QuizIdInput onConfirm={handleStart} loading={starting} label="Quiz ID cho phần Nói..." />
          {error && <p style={{ color: "#EF4444", marginTop: 12, fontSize: 13 }}>{error}</p>}
        </div>
      </AppShell>
    );
  }

  if (submitted) {
    return (
      <AppShell>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>🎤</div>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#111827" }}>Đã nộp bài nói!</h2>
          <p style={{ color: "#6B7280", marginTop: 8 }}>Bài của bạn đang chờ chấm điểm.</p>
          <button onClick={() => router.push(`/vstep/${sessionId}`)}
            style={{ marginTop: 24, padding: "10px 28px", borderRadius: 99, background: "#EF4444", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}>
            Xem tổng kết →
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 18, color: "#111827", margin: 0 }}>🎙 Phần Nói</h2>
            <p style={{ color: "#6B7280", fontSize: 12, margin: "4px 0 0" }}>
              Ghi âm lần lượt từng phần. Bấm nộp khi hoàn thành tất cả.
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ padding: "9px 24px", borderRadius: 99, border: "none", background: submitting ? "#D1D5DB" : "#EF4444", color: "white", fontWeight: 600, fontSize: 14, cursor: submitting ? "not-allowed" : "pointer" }}
          >
            {submitting ? "Đang nộp..." : "Nộp bài"}
          </button>
        </div>

        {PARTS.map(p => {
          const state = recordingState[p.id] ?? "idle";
          const blob = recordings[p.id];
          const url = blob ? URL.createObjectURL(blob) : null;

          return (
            <div key={p.id} style={{
              background: "white", borderRadius: 14, padding: 20, marginBottom: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,.06)",
              border: state === "recording" ? "2px solid #EF4444" : "2px solid #E5E7EB",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: "#FEF2F2",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>
                  {p.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{p.label}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>Thời gian đề xuất: {p.duration / 60} phút</div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  {state === "done" && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#10B981", background: "#D1FAE5", padding: "3px 10px", borderRadius: 99 }}>✓ Đã ghi</span>
                  )}
                  {state === "recording" && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#EF4444", background: "#FEE2E2", padding: "3px 10px", borderRadius: 99 }}>● Đang ghi</span>
                  )}
                </div>
              </div>

              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>{p.hint}</p>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {state === "idle" && (
                  <button onClick={() => startRecording(p.id)}
                    style={{ padding: "8px 20px", borderRadius: 99, border: "none", background: "#EF4444", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    ● Bắt đầu ghi âm
                  </button>
                )}
                {state === "recording" && (
                  <button onClick={stopRecording}
                    style={{ padding: "8px 20px", borderRadius: 99, border: "none", background: "#374151", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    ■ Dừng ghi âm
                  </button>
                )}
                {state === "done" && (
                  <>
                    {url && <audio src={url} controls style={{ flex: 1, height: 36 }} />}
                    <button onClick={() => { setRecordingState(s => ({ ...s, [p.id]: "idle" })); setRecordings(r => ({ ...r, [p.id]: null })); }}
                      style={{ padding: "8px 16px", borderRadius: 99, border: "2px solid #E5E7EB", background: "white", color: "#374151", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                      Ghi lại
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {error && <p style={{ color: "#EF4444", fontSize: 13, marginTop: 8 }}>{error}</p>}
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
        style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: loading || !val.trim() ? "#D1D5DB" : "#EF4444", color: "white", fontWeight: 600, cursor: loading || !val.trim() ? "not-allowed" : "pointer" }}>
        {loading ? "..." : "Bắt đầu"}
      </button>
    </div>
  );
}
