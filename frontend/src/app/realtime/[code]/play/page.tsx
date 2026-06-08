"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as signalR from "@microsoft/signalr";
import {
  useJoinRoomMutation,
  useSubmitRealtimeAnswerMutation,
} from "@/lib/features/quiz/realtimeApi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

interface QuizOption {
  id: string;
  content: string;
  displayOrder: number;
}

interface QuizQuestion {
  questionIndex: number;
  questionId: string;
  content: string;
  type: string;
  audioUrl: string | null;
  imageUrl: string | null;
  options: QuizOption[];
  timeLimitSec: number;
  score: number;
}

interface LeaderboardEntry {
  userId: string;
  score: number;
  rank: number;
}

type Stage = "joining" | "waiting" | "playing" | "answered" | "ended";

function getToken(): string | null {
  try {
    return localStorage.getItem("accessToken");
  } catch {
    return null;
  }
}

export default function RealtimePlayPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const t = useTranslations("realtime_player");
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const [stage, setStage] = useState<Stage>("joining");
  const [roomId, setRoomId] = useState<string>("");
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [answerStartMs, setAnswerStartMs] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [joinRoom] = useJoinRoomMutation();
  const [submitAnswer] = useSubmitRealtimeAnswerMutation();

  // Step 1: Join via REST to get roomId, then connect SignalR
  // Join room via REST + connect SignalR in one effect to avoid strict-mode double connection
  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        const room = await joinRoom(code).unwrap();
        if (!active) return;
        setRoomId(room.roomId);
        setStage("waiting");

        const token = getToken();
        const connection = new signalR.HubConnectionBuilder()
          .withUrl(`${API_BASE}/hubs/quiz`, token ? { accessTokenFactory: () => token } : {})
          .withAutomaticReconnect()
          .configureLogging(signalR.LogLevel.Error)
          .build();

        connection.on("QuestionStarted", (q: QuizQuestion) => {
          if (!active) return;
          setQuestion(q);
          setSelectedOption(null);
          setIsCorrect(null);
          setPointsEarned(0);
          setTimeLeft(q.timeLimitSec ?? 20);
          setAnswerStartMs(Date.now());
          setStage("playing");
        });

        connection.on("LeaderboardUpdate", (data: { entries: LeaderboardEntry[] }) => {
          if (!active) return;
          setLeaderboard(data.entries);
        });

        connection.on("QuizEnded", () => {
          if (!active) return;
          setStage("ended");
        });

        await connection.start();
        if (!active) { connection.stop(); return; }
        connectionRef.current = connection;
        await connection.invoke("JoinRoom", code);
      } catch {
        if (!active) return;
        setStage("waiting");
      }
    };

    init();

    return () => {
      active = false;
      connectionRef.current?.stop();
      connectionRef.current = null;
      clearTimer();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    if (stage !== "playing") return;
    clearTimer();
    const timeLimitSec = question?.timeLimitSec ?? 20;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, question]);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleAutoSubmit = async () => {
    if (!question || !roomId) return;
    await doSubmit(null);
  };

  const handleSelectOption = async (optionId: string) => {
    if (stage !== "playing" || selectedOption || !roomId) return;
    setSelectedOption(optionId);
    clearTimer();
    await doSubmit(optionId);
  };

  const doSubmit = async (optionId: string | null) => {
    if (!question || !roomId) return;
    const timeTakenMs = Date.now() - answerStartMs;
    setStage("answered");
    try {
      const result = await submitAnswer({
        roomId,
        questionId: question.questionId,
        selectedOptionId: optionId,
        timeTakenMs,
      }).unwrap();
      setIsCorrect(result.isCorrect);
      setPointsEarned(result.pointsEarned);
      setTotalScore(result.totalScore);
    } catch {
      setIsCorrect(false);
    }
  };

  if (stage === "joining") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg">{t("joining_room", { code })}</p>
        </div>
      </div>
    );
  }

  if (stage === "waiting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex flex-col items-center justify-center text-white">
        <div className="text-6xl mb-6 animate-pulse">⏳</div>
        <h1 className="text-3xl font-bold mb-4">{t("room_label", { code })}</h1>
        <p className="text-indigo-200 text-lg">{t("waiting_teacher")}</p>
        <div className="mt-8 flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-indigo-300 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (stage === "ended") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex flex-col items-center justify-center text-white">
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="text-3xl font-bold mb-2">{t("quiz_ended")}</h1>
        <p className="text-indigo-200 mb-8">
          {t("your_score")} <span className="font-bold text-yellow-300 text-2xl">{totalScore}</span>
        </p>
        <div className="bg-white/10 rounded-2xl p-6 w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4 text-center">{t("leaderboard")}</h2>
          {leaderboard.slice(0, 5).map((e, i) => (
            <div key={e.userId} className="flex justify-between items-center py-2 border-b border-white/20 last:border-0">
              <span className="font-bold">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
              <span className="flex-1 mx-3 truncate font-mono text-sm">{e.userId.slice(0, 10)}...</span>
              <span className="font-bold text-yellow-300">{e.score}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push("/")}
          className="mt-8 bg-white text-indigo-700 font-bold px-8 py-3 rounded-xl hover:bg-indigo-50 transition"
        >
          {t("back_home")}
        </button>
      </div>
    );
  }

  // Playing / answered
  const colors = [
    "bg-red-500 hover:bg-red-400",
    "bg-blue-500 hover:bg-blue-400",
    "bg-yellow-500 hover:bg-yellow-400",
    "bg-green-500 hover:bg-green-400",
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Timer bar */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="text-white font-bold text-lg">{code}</span>
        <div className="flex items-center gap-3">
          <div
            className="text-3xl font-bold"
            style={{ color: timeLeft <= 5 ? "#EF4444" : "#10B981" }}
          >
            {timeLeft}
          </div>
          <div className="w-32 h-3 bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(timeLeft / (question?.timeLimitSec ?? 20)) * 100}%`,
                background: timeLeft <= 5 ? "#EF4444" : "#10B981",
              }}
            />
          </div>
        </div>
        <span className="text-yellow-300 font-bold text-lg">{totalScore} {t("points_suffix")}</span>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-2xl text-center mb-8">
          {question?.imageUrl && (
            <img src={question.imageUrl} alt="" className="max-h-48 mx-auto mb-4 rounded-xl" />
          )}
          <p className="text-white text-2xl font-semibold leading-relaxed">
            {question?.content ?? ""}
          </p>
        </div>

        {/* Answer feedback or options */}
        {stage === "answered" && isCorrect !== null ? (
          <div className={`rounded-2xl p-8 w-full max-w-2xl text-center ${isCorrect ? "bg-green-600" : "bg-red-600"}`}>
            <div className="text-5xl mb-3">{isCorrect ? "✅" : "❌"}</div>
            <p className="text-white text-2xl font-bold">
              {isCorrect ? t("points_earned", { points: pointsEarned }) : t("incorrect")}
            </p>
            <p className="text-white/80 mt-2">{t("wait_next")}</p>
          </div>
        ) : stage === "answered" ? (
          <div className="rounded-2xl p-8 w-full max-w-2xl text-center bg-gray-700">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white">{t("scoring")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
            {question?.options.map((opt, i) => (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt.id)}
                disabled={!!selectedOption}
                className={`${colors[i % 4]} text-white font-bold text-lg rounded-2xl p-6 transition disabled:opacity-60 text-left`}
              >
                {opt.content}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mini leaderboard */}
      {leaderboard.length > 0 && (
        <div className="bg-gray-800 px-6 py-3 flex justify-center gap-6 overflow-x-auto">
          {leaderboard.slice(0, 5).map((e, i) => (
            <div key={e.userId} className="flex flex-col items-center text-white text-sm min-w-[60px]">
              <span className="text-yellow-300 font-bold">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
              </span>
              <span className="font-bold">{e.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
