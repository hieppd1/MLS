"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { uploadSpeakingAudio } from "@/lib/features/quiz/speakingApi";

const MLS_NAVY = "#1565C0";
const MLS_RED = "#e5173f";

type RecorderState = "idle" | "recording" | "stopped" | "uploading" | "pending" | "done" | "error";

interface SpeakingRecorderProps {
  attemptId: string;
  questionId: string;
  token: string;
  timeLimitSec?: number;
  examModeTag?: string;
  onDone: (submissionId: string) => void;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function SpeakingRecorder({
  attemptId,
  questionId,
  token,
  timeLimitSec,
  examModeTag,
  onDone,
}: SpeakingRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up timer
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Stop recording and collect blob
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    clearTimer();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  }, [clearTimer]);

  // Auto-stop when time limit reached
  useEffect(() => {
    if (state === "recording" && timeLimitSec && elapsed >= timeLimitSec) {
      stopRecording();
    }
  }, [elapsed, state, timeLimitSec, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [clearTimer]);

  const startRecording = async () => {
    setError(null);
    setElapsed(0);
    chunksRef.current = [];
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Prefer webm/opus, fallback to any
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

      const mr = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState("stopped");
        // Store blob for upload
        (mr as MediaRecorder & { _blob?: Blob })._blob = blob;
      };

      mr.start(250); // collect every 250ms
      setState("recording");

      timerRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
    } catch {
      setError("Không thể truy cập micro. Vui lòng kiểm tra quyền truy cập.");
      setState("error");
    }
  };

  const handleUpload = async () => {
    const mr = mediaRecorderRef.current as (MediaRecorder & { _blob?: Blob }) | null;
    const blob = mr?._blob;
    if (!blob) {
      setError("Không có dữ liệu âm thanh.");
      return;
    }

    setState("uploading");
    setError(null);

    try {
      const ext = blob.type.includes("webm") ? "webm" : blob.type.includes("mp4") ? "mp4" : "wav";
      const fileName = `speaking_${Date.now()}.${ext}`;
      const result = await uploadSpeakingAudio(blob, fileName, attemptId, questionId, token, examModeTag);
      setState("pending");
      // Poll status until done (SignalR can be added later)
      pollStatus(result.submissionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload thất bại.");
      setState("error");
    }
  };

  const pollStatus = async (submissionId: string) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";
    let attempts = 0;
    const maxAttempts = 60; // 60 × 3s = 3 minutes

    const poll = async () => {
      if (attempts++ >= maxAttempts) {
        setError("Chấm điểm mất quá nhiều thời gian. Thử lại sau.");
        setState("error");
        return;
      }
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/speaking/${submissionId}/status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Tenant-Slug": "demo",
            },
          }
        );
        if (!res.ok) throw new Error("Status check failed");
        const data = await res.json();
        if (data.status === "Done" || data.status === "Failed") {
          setState("done");
          onDone(submissionId);
          return;
        }
        setTimeout(poll, 3000);
      } catch {
        setTimeout(poll, 5000);
      }
    };
    poll();
  };

  const remaining = timeLimitSec ? Math.max(0, timeLimitSec - elapsed) : null;
  const timeColor =
    remaining !== null
      ? remaining < 10
        ? MLS_RED
        : remaining < 30
        ? "#F59E0B"
        : "#16A34A"
      : "#374151";

  return (
    <div
      style={{
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
        borderRadius: 16,
        padding: 28,
        textAlign: "center",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      {/* Timer */}
      {state === "recording" && (
        <div style={{ marginBottom: 16 }}>
          <span
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: timeColor,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {remaining !== null ? formatTime(remaining) : formatTime(elapsed)}
          </span>
          <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
            {remaining !== null ? "Thời gian còn lại" : "Đang ghi âm"}
          </div>
        </div>
      )}

      {/* Waveform indicator */}
      {state === "recording" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            marginBottom: 20,
            height: 40,
          }}
        >
          {[8, 16, 24, 16, 8, 20, 12, 28, 12, 20].map((h, i) => (
            <div
              key={i}
              style={{
                width: 4,
                height: h,
                background: MLS_RED,
                borderRadius: 2,
                animation: `pulse ${0.5 + i * 0.07}s ease-in-out infinite alternate`,
              }}
            />
          ))}
        </div>
      )}

      {/* Playback */}
      {(state === "stopped" || state === "uploading") && audioUrl && (
        <div style={{ marginBottom: 20 }}>
          <audio
            controls
            src={audioUrl}
            style={{ width: "100%", borderRadius: 8 }}
          />
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 6 }}>
            Đã ghi: {formatTime(elapsed)}
          </div>
        </div>
      )}

      {/* Status messages */}
      {state === "pending" && (
        <div style={{ marginBottom: 20, color: "#F59E0B", fontWeight: 600 }}>
          Đang chấm điểm... Vui lòng chờ
        </div>
      )}
      {state === "done" && (
        <div style={{ marginBottom: 20, color: "#16A34A", fontWeight: 600 }}>
          Chấm điểm xong! Đang chuyển trang...
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#FEE2E2",
            color: MLS_RED,
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        {(state === "idle" || state === "error") && (
          <button
            onClick={startRecording}
            style={{
              background: MLS_RED,
              color: "#fff",
              border: "none",
              borderRadius: 24,
              padding: "12px 28px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>●</span> Bắt đầu ghi âm
          </button>
        )}

        {state === "recording" && (
          <button
            onClick={stopRecording}
            style={{
              background: "#374151",
              color: "#fff",
              border: "none",
              borderRadius: 24,
              padding: "12px 28px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ■ Dừng ghi âm
          </button>
        )}

        {state === "stopped" && (
          <>
            <button
              onClick={startRecording}
              style={{
                background: "#E5E7EB",
                color: "#374151",
                border: "none",
                borderRadius: 24,
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Ghi lại
            </button>
            <button
              onClick={handleUpload}
              style={{
                background: MLS_NAVY,
                color: "#fff",
                border: "none",
                borderRadius: 24,
                padding: "12px 28px",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Nộp bài
            </button>
          </>
        )}

        {state === "uploading" && (
          <button
            disabled
            style={{
              background: "#93C5FD",
              color: "#fff",
              border: "none",
              borderRadius: 24,
              padding: "12px 28px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "not-allowed",
            }}
          >
            Đang tải lên...
          </button>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          from { transform: scaleY(0.6); opacity: 0.7; }
          to   { transform: scaleY(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
