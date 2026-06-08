"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  useGetSessionQuery,
  useGetDemoQuestionsQuery,
  useMidAdjustMutation,
  useSimulateCompleteMutation,
} from "@/lib/features/quiz/opicApi";
import MidAdjustScreen from "@/components/opic/MidAdjustScreen";

const MAX_RECORD_SEC = 150;

const TOPIC_COLORS: Record<string, string> = {
  "Tự giới thiệu":        "bg-sky-100 text-sky-700",
  "Sở thích & Hoạt động": "bg-violet-100 text-violet-700",
  "Du lịch & Kỳ nghỉ":    "bg-emerald-100 text-emerald-700",
  "Công việc & Học tập":   "bg-amber-100 text-amber-700",
  "Đóng vai":              "bg-rose-100 text-rose-700",
};

export default function OPICPlayPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const t = useTranslations("opic_player");

  const { data: session, isLoading: sessionLoading, refetch } = useGetSessionQuery(sessionId);
  const { data: questions = [], isLoading: questionsLoading } = useGetDemoQuestionsQuery(
    session ? { language: session.language ?? "vi", quizId: session.quizId ?? undefined } : undefined,
    { skip: !session }
  );
  const [midAdjust, { isLoading: adjusting }] = useMidAdjustMutation();
  const [simulateComplete, { isLoading: submitting }] = useSimulateCompleteMutation();

  const [currentIndex, setCurrentIndex] = useState(1); // 1-based
  const [recordings, setRecordings] = useState<Map<number, string>>(new Map());
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showMidAdjust, setShowMidAdjust] = useState(false);
  const [error, setError] = useState("");

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalQuestions = questions.length || 15;
  const currentQuestion = questions[currentIndex - 1];
  const blobUrl = recordings.get(currentIndex) ?? null;
  const isLastQuestion = currentIndex === totalQuestions;

  // ── Recording ──────────────────────────────────────────────────────────────

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordings((prev) => new Map(prev).set(currentIndex, url));
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((e) => {
          if (e + 1 >= MAX_RECORD_SEC) stopRecording();
          return e + 1;
        });
      }, 1000);
    } catch {
      setError(t("mic_error"));
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRef.current?.stop();
    setIsRecording(false);
  };

  const retakeRecording = () =>
    setRecordings((m) => { const n = new Map(m); n.delete(currentIndex); return n; });

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handleNext = async () => {
    if (!recordings.has(currentIndex)) {
      setError(t("must_record_error"));
      return;
    }
    setError("");

    if (currentIndex === 7 && !session?.midAdjustChoice) {
      setShowMidAdjust(true);
      return;
    }

    if (isLastQuestion) {
      try {
        await simulateComplete(sessionId).unwrap();
        router.push(`/opic/${sessionId}/result`);
      } catch {
        setError(t("finish_error"));
      }
      return;
    }

    setCurrentIndex((i) => i + 1);
  };

  const handleMidAdjust = async (choice: "easier" | "same" | "harder") => {
    try {
      await midAdjust({ sessionId, choice }).unwrap();
    } finally {
      setShowMidAdjust(false);
      setCurrentIndex(8);
      refetch();
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (sessionLoading || questionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) return <div className="p-8 text-center text-red-500">{t("session_not_found")}</div>;

  useEffect(() => {
    if (session?.isCompleted) {
      router.replace(`/opic/${sessionId}/result`);
    }
  }, [session?.isCompleted, sessionId, router]);

  if (session.isCompleted) return null;

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-lg text-gray-600">{t("no_questions")}</p>
        <p className="text-sm text-gray-400">
          {t("no_questions_hint")}
        </p>
      </div>
    );
  }

  if (showMidAdjust) {
    return (
      <MidAdjustScreen
        currentDifficulty={session.chosenDifficulty}
        onSelect={handleMidAdjust}
        loading={adjusting}
      />
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const topicHint = currentQuestion?.topicHint ?? "";
  const topicColorClass = TOPIC_COLORS[topicHint] ?? "bg-gray-100 text-gray-600";
  const isRolePlay = currentQuestion?.type === "OPICRolePlay";
  const timeLimitSec = currentQuestion?.timeLimitSec ?? 120;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-xl px-4 py-8">

        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">{t("opic_mock_test")}</h1>
          <span className="text-sm text-gray-500">
            {t("difficulty_label")}<strong>{session.chosenDifficulty}</strong>
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="mb-1 flex items-center justify-between text-sm text-gray-500">
            <span>{t("question_progress", { current: currentIndex, total: totalQuestions })}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${topicColorClass}`}>
              {topicHint}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${((currentIndex - 1) / totalQuestions) * 100}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between">
            {[t("topic_short_intro"), t("topic_short_hobby"), t("topic_short_travel"), t("topic_short_work"), t("topic_short_roleplay")].map((label, ci) => (
              <span
                key={ci}
                className={`text-[10px] ${
                  Math.ceil(currentIndex / 3) === ci + 1
                    ? "font-bold text-blue-600"
                    : "text-gray-300"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Question card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">

          <div className="mb-4 flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100">
              {t("question_n", { n: currentIndex })}
            </span>
            {isRolePlay && (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-600 border border-rose-100">
                {t("role_play_badge")}
              </span>
            )}
            <span className="ml-auto text-xs text-gray-400">{t("time_sec", { sec: timeLimitSec })}</span>
          </div>

          {/* Question text */}
          <p className="mb-6 text-base leading-relaxed text-gray-800">
            {currentQuestion?.content}
          </p>

          {/* Audio player (if question has audio) */}
          {currentQuestion?.audioUrl && (
            <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
              <audio src={currentQuestion.audioUrl} controls className="h-8 w-full" />
              <p className="mt-1 text-xs text-blue-400">
                {t("audio_play_limit", { limit: currentQuestion.playLimit })}
              </p>
            </div>
          )}

          {/* Recording area */}
          {blobUrl ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="mb-2 text-sm font-medium text-green-700">{t("recorded_ok")}</p>
              {blobUrl !== "demo://skip" && (
                <audio src={blobUrl} controls className="h-8 w-full" />
              )}
              <button onClick={retakeRecording} className="mt-2 text-xs text-red-500 hover:underline">
                {t("retake")}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5">
              {isRecording ? (
                <>
                  <div className="flex items-center gap-2 text-red-500">
                    <span className="h-3 w-3 animate-ping rounded-full bg-red-400" />
                    <span className="text-sm font-medium">{t("recording_status", { elapsed, total: timeLimitSec })}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-red-400 transition-all"
                      style={{ width: `${(elapsed / timeLimitSec) * 100}%` }}
                    />
                  </div>
                  <button
                    onClick={stopRecording}
                    className="rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600"
                  >
                    {t("stop_recording")}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-center text-sm text-gray-500">
                    {t("recording_prompt")}
                  </p>
                  <button
                    onClick={startRecording}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <span className="h-2 w-2 rounded-full bg-red-300" />
                    {t("start_recording")}
                  </button>
                </>
              )}
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex gap-3">
          {currentIndex > 1 && (
            <button
              onClick={() => setCurrentIndex((i) => i - 1)}
              disabled={isRecording}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              {t("prev_question")}
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={isRecording || submitting || !recordings.has(currentIndex)}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {submitting
              ? t("processing")
              : isLastQuestion
              ? t("submit_and_view")
              : t("next_question")}
          </button>
        </div>

        {/* Dev shortcut: skip recording */}
        {!recordings.has(currentIndex) && !isRecording && (
          <div className="mt-3 text-center">
            <button
              onClick={() => setRecordings((m) => new Map(m).set(currentIndex, "demo://skip"))}
              className="text-xs text-gray-400 underline hover:text-gray-600"
            >
              {t("skip_recording_demo")}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
