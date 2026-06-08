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

const PART_META = [
  { id: "P1", duration: 120, icon: "👋", labelKey: "sp_p1_label", hintKey: "sp_p1_hint" },
  { id: "P2", duration: 180, icon: "🖼", labelKey: "sp_p2_label", hintKey: "sp_p2_hint" },
  { id: "P3", duration: 300, icon: "💬", labelKey: "sp_p3_label", hintKey: "sp_p3_hint" },
] as const;

type RecordingState = "idle" | "recording" | "done";

export default function VSTEPSpeakingPage() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const t = useTranslations("vstep_player");
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

  if (!session) return <AppShell><div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>{t("loading")}</div></AppShell>;

  if (session.speakingScore !== null) {
    return (
      <AppShell>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#111827" }}>{t("speaking_completed")}</h2>
          <p style={{ color: "#6B7280", marginTop: 8 }}>{t("score_label")}<strong>{session.speakingScore?.toFixed(1)}</strong>{t("score_suffix")}</p>
          <p style={{ color: "#EF4444", fontSize: 13, marginTop: 8 }}>{t("speaking_graded_note")}</p>
          <button onClick={() => router.push(`/vstep/${sessionId}`)}
            style={{ marginTop: 20, padding: "10px 28px", borderRadius: 99, background: "#EF4444", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}>
            {t("view_summary")}
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
      setError(t("speaking_start_error"));
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
      setError(t("mic_access_error"));
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
      setError(t("submit_error"));
    }
  };

  if (!attemptStarted && !session.speakingAttemptId) {
    return (
      <AppShell>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px" }}>
          <button onClick={() => router.push(`/vstep/${sessionId}`)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", fontSize: 14, marginBottom: 16 }}>{t("back")}</button>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#111827" }}>{t("speaking_h2")}</h2>
          <p style={{ color: "#6B7280", marginTop: 6, marginBottom: 8 }}>{t("speaking_info")}</p>
          <div style={{ background: "#FEF2F2", borderRadius: 10, padding: 14, marginBottom: 24, fontSize: 13, color: "#991B1B", lineHeight: 1.6 }}>
            {t("speaking_warning")}
          </div>
          <QuizIdInput onConfirm={handleStart} loading={starting} label={t("quiz_id_speaking_ph")} loadingLabel={t("quiz_id_loading")} startLabel={t("quiz_id_start")} />
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
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#111827" }}>{t("speaking_submitted")}</h2>
          <p style={{ color: "#6B7280", marginTop: 8 }}>{t("speaking_pending")}</p>
          <button onClick={() => router.push(`/vstep/${sessionId}`)}
            style={{ marginTop: 24, padding: "10px 28px", borderRadius: 99, background: "#EF4444", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}>
            {t("view_summary")}
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
            <h2 style={{ fontWeight: 700, fontSize: 18, color: "#111827", margin: 0 }}>{t("speaking_header")}</h2>
            <p style={{ color: "#6B7280", fontSize: 12, margin: "4px 0 0" }}>
              {t("speaking_instruction")}
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ padding: "9px 24px", borderRadius: 99, border: "none", background: submitting ? "#D1D5DB" : "#EF4444", color: "white", fontWeight: 600, fontSize: 14, cursor: submitting ? "not-allowed" : "pointer" }}
          >
            {submitting ? t("submitting") : t("submit")}
          </button>
        </div>

        {PART_META.map(p => {
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
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{t(p.labelKey)}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>{p.duration / 60} min</div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  {state === "done" && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#10B981", background: "#D1FAE5", padding: "3px 10px", borderRadius: 99 }}>{t("recorded_badge")}</span>
                  )}
                  {state === "recording" && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#EF4444", background: "#FEE2E2", padding: "3px 10px", borderRadius: 99 }}>{t("recording_badge")}</span>
                  )}
                </div>
              </div>

              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>{t(p.hintKey)}</p>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {state === "idle" && (
                  <button onClick={() => startRecording(p.id)}
                    style={{ padding: "8px 20px", borderRadius: 99, border: "none", background: "#EF4444", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    {t("start_recording")}
                  </button>
                )}
                {state === "recording" && (
                  <button onClick={stopRecording}
                    style={{ padding: "8px 20px", borderRadius: 99, border: "none", background: "#374151", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    {t("stop_recording")}
                  </button>
                )}
                {state === "done" && (
                  <>
                    {url && <audio src={url} controls style={{ flex: 1, height: 36 }} />}
                    <button onClick={() => { setRecordingState(s => ({ ...s, [p.id]: "idle" })); setRecordings(r => ({ ...r, [p.id]: null })); }}
                      style={{ padding: "8px 16px", borderRadius: 99, border: "2px solid #E5E7EB", background: "white", color: "#374151", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                      {t("re_record")}
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

function QuizIdInput({ onConfirm, loading, label, loadingLabel, startLabel }: { onConfirm: (id: string) => void; loading: boolean; label: string; loadingLabel: string; startLabel: string }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <input value={val} onChange={e => setVal(e.target.value)} placeholder={label}
        style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "2px solid #E5E7EB", fontSize: 14 }} />
      <button onClick={() => onConfirm(val.trim())} disabled={loading || !val.trim()}
        style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: loading || !val.trim() ? "#D1D5DB" : "#EF4444", color: "white", fontWeight: 600, cursor: loading || !val.trim() ? "not-allowed" : "pointer" }}>
        {loading ? loadingLabel : startLabel}
      </button>
    </div>
  );
}
