"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import * as signalR from "@microsoft/signalr";
import {
  useStartRoomMutation,
  useNextQuestionMutation,
  type QuestionPayload,
} from "@/lib/features/quiz/realtimeApi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

interface Participant {
  userId: string;
  isConnected: boolean;
}

interface LeaderboardEntry {
  userId: string;
  score: number;
  rank: number;
}

function getRoomCode() {
  try {
    return sessionStorage.getItem("currentRoomCode") ?? "";
  } catch {
    return "";
  }
}

function getToken(): string | null {
  try {
    return localStorage.getItem("accessToken");
  } catch {
    return null;
  }
}

export default function TeacherHostPage() {
  const t = useTranslations("teacher_realtime");
  const { id } = useParams<{ id: string }>();
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const [roomCode, setRoomCode] = useState("");
  const [roomState, setRoomState] = useState<"Waiting" | "Active" | "Ended">("Waiting");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionPayload | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [startRoom, { isLoading: isStarting }] = useStartRoomMutation();
  const [nextQuestion, { isLoading: isAdvancing }] = useNextQuestionMutation();

  // SignalR: connect for real-time leaderboard / participant updates
  useEffect(() => {
    const code = getRoomCode();
    setRoomCode(code);
    if (!code) return;

    let active = true;

    const token = getToken();
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/quiz`, token ? { accessTokenFactory: () => token } : {})
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Error)
      .build();

    connection.on("ParticipantJoined", (data: { userId: string }) => {
      if (!active) return;
      setParticipants((prev) => {
        if (prev.some((p) => p.userId === data.userId)) return prev;
        return [...prev, { userId: data.userId, isConnected: true }];
      });
    });

    connection.on("RoomStateChanged", (data: { state: string }) => {
      if (!active) return;
      setRoomState(data.state as "Waiting" | "Active" | "Ended");
    });

    connection.on("LeaderboardUpdate", (data: { entries: LeaderboardEntry[] }) => {
      if (!active) return;
      setLeaderboard(data.entries);
    });

    connection.on("QuizEnded", () => {
      if (!active) return;
      setRoomState("Ended");
      clearTimer();
    });

    connection.start()
      .then(() => {
        if (!active) { connection.stop(); return; }
        connectionRef.current = connection;
        connection.invoke("JoinRoom", code);
      })
      .catch(() => { /* silent - teacher can still control quiz via REST */ });

    return () => {
      active = false;
      connectionRef.current?.stop();
      connectionRef.current = null;
      clearTimer();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleStart = async () => {
    const result = await startRoom(id).unwrap();
    setRoomState("Active");
    if (result.question) {
      setCurrentQuestion(result.question);
      setTimeLeft(result.question.timeLimitSec);
    }
  };

  const handleNext = async () => {
    const result = await nextQuestion(id).unwrap();
    if (result.isEnded) {
      setRoomState("Ended");
      setCurrentQuestion(null);
      clearTimer();
    } else if (result.question) {
      setCurrentQuestion(result.question);
      setTimeLeft(result.question.timeLimitSec);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t("host_title")}</h1>
          <p className="text-gray-400 text-sm">{t("host_room")} <span className="text-indigo-400 font-mono font-bold text-lg">{roomCode}</span></p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
          roomState === "Waiting" ? "bg-yellow-900/50 text-yellow-300" :
          roomState === "Active"  ? "bg-green-900/50 text-green-300" :
                                    "bg-gray-700 text-gray-400"
        }`}>
          {roomState === "Waiting" ? t("host_status_waiting") :
           roomState === "Active"  ? t("host_status_active") : t("host_status_ended")}
        </div>
      </div>

      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Left: Participants */}
        <div className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-700">
            <h2 className="font-semibold text-gray-300">
              {t("host_students", { n: participants.length })}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {participants.length === 0 ? (
              <p className="text-gray-500 text-sm text-center mt-8">{t("host_waiting_students")}</p>
            ) : (
              participants.map((p) => (
                <div key={p.userId} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800">
                  <div className={`w-2 h-2 rounded-full ${p.isConnected ? "bg-green-500" : "bg-gray-500"}`} />
                  <span className="text-sm font-mono truncate">{p.userId.slice(0, 12)}...</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center: Question */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {roomState === "Waiting" && (
            <div className="text-center">
              <div className="text-7xl mb-6">🎮</div>
              <h2 className="text-3xl font-bold mb-2">{t("host_ready_heading")}</h2>
              <p className="text-gray-400 mb-8">
                {participants.length > 0
                  ? t("host_ready_subtitle", { n: participants.length })
                  : t("host_share_hint")}
              </p>
              <div className="bg-indigo-900/50 border-2 border-indigo-500 rounded-2xl px-12 py-6 mb-8 inline-block">
                <p className="text-indigo-300 text-sm mb-1">{t("host_room_code")}</p>
                <p className="text-5xl font-mono font-bold tracking-widest text-white">{roomCode}</p>
              </div>
              <br />
              <button
                onClick={handleStart}
                disabled={isStarting}
                className="bg-green-600 hover:bg-green-500 text-white font-bold text-xl px-10 py-4 rounded-xl transition disabled:opacity-50"
              >
                {isStarting ? t("host_starting") : t("host_start")}
              </button>
            </div>
          )}

          {roomState === "Active" && currentQuestion && (
            <div className="w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <span className="text-indigo-300 font-bold">{t("host_question", { n: currentQuestion.questionIndex + 1 })}</span>
                <span className={`text-3xl font-bold ${timeLeft <= 5 ? "text-red-400" : "text-green-400"}`}>
                  {timeLeft}s
                </span>
              </div>
              <div className="bg-gray-800 rounded-2xl p-8 text-center mb-6">
                <p className="text-white text-2xl font-semibold">{currentQuestion.content}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {currentQuestion.options.map((opt, i) => {
                  const colors = ["bg-red-800","bg-blue-800","bg-yellow-800","bg-green-800"];
                  return (
                    <div key={opt.id} className={`${colors[i]} rounded-xl p-4 text-white font-semibold text-center`}>
                      {opt.content}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center">
                <button
                  onClick={handleNext}
                  disabled={isAdvancing}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg px-8 py-3 rounded-xl transition"
                >
                  {isAdvancing ? "..." : t("host_next")}
                </button>
              </div>
            </div>
          )}

          {roomState === "Active" && !currentQuestion && (
            <div className="text-center">
              <p className="text-gray-400 text-xl">{t("host_waiting_answers")}</p>
            </div>
          )}

          {roomState === "Ended" && (
            <div className="text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-bold">{t("host_ended")}</h2>
            </div>
          )}
        </div>

        {/* Right: Leaderboard */}
        <div className="w-72 bg-gray-900 border-l border-gray-700 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-700">
            <h2 className="font-semibold text-gray-300">{t("host_leaderboard")}</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {leaderboard.length === 0 ? (
              <p className="text-gray-500 text-sm text-center mt-8">{t("host_no_scores")}</p>
            ) : (
              leaderboard.map((e, i) => (
                <div key={e.userId} className="flex items-center gap-3 mb-3">
                  <span className="text-xl w-8 text-center">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <span className="flex-1 text-sm font-mono truncate text-gray-300">
                    {e.userId.slice(0, 10)}...
                  </span>
                  <span className="font-bold text-yellow-300">{e.score}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
