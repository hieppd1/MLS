"use client";

import { useParams, useRouter } from "next/navigation";
import {
  useGetSessionResultQuery,
  OPIC_LEVEL_LABELS,
  OPIC_LEVEL_ORDER,
  OPIC_SKILL_LABELS,
  type OPICLevel,
} from "@/lib/features/quiz/opicApi";

const SKILL_KEYS = ["pronunciation", "fluency", "coherence", "vocabulary", "taskAchievement"] as const;

const SCORE_FIELDS: Record<string, keyof ReturnType<typeof useGetSessionResultQuery>["data" & object]> = {};

// Map skill → result field
const SKILL_TO_FIELD = {
  pronunciation:   "pronunciationScore",
  fluency:         "fluencyScore",
  coherence:       "coherenceScore",
  vocabulary:      "vocabularyScore",
  taskAchievement: "taskAchievementScore",
} as const;

function LevelBadge({ level }: { level: OPICLevel }) {
  const colors: Record<OPICLevel, string> = {
    NH:  "bg-gray-200 text-gray-700",
    IL:  "bg-blue-100 text-blue-700",
    IM1: "bg-blue-200 text-blue-800",
    IM2: "bg-indigo-200 text-indigo-800",
    IM3: "bg-violet-200 text-violet-800",
    IH:  "bg-purple-200 text-purple-800",
    AL:  "bg-green-200 text-green-800",
  };
  return (
    <span className={`rounded-full px-4 py-1 text-sm font-bold ${colors[level]}`}>
      {level}
    </span>
  );
}

function ScoreBar({ label, score, isStrongest, isWeakest }: {
  label: string;
  score: number;
  isStrongest: boolean;
  isWeakest: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className={`font-medium ${isStrongest ? "text-green-700" : isWeakest ? "text-red-600" : "text-gray-700"}`}>
          {label}
          {isStrongest && <span className="ml-1 text-xs text-green-600">(Mạnh nhất)</span>}
          {isWeakest && <span className="ml-1 text-xs text-red-500">(Cần cải thiện)</span>}
        </span>
        <span className="font-semibold text-gray-800">{score.toFixed(1)}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isStrongest ? "bg-green-500" : isWeakest ? "bg-red-400" : "bg-blue-500"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function OPICResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { data: result, isLoading } = useGetSessionResultQuery(sessionId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-gray-600">Đang tính toán kết quả...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-gray-600">
          Kết quả chưa có — bài thi đang được AI chấm điểm. Vui lòng quay lại sau.
        </p>
        <button
          onClick={() => router.push("/opic/history")}
          className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
        >
          Xem lịch sử
        </button>
      </div>
    );
  }

  const level = result.assignedLevel as OPICLevel;
  const levelIndex = OPIC_LEVEL_ORDER.indexOf(level);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="mx-auto max-w-xl px-4 py-10">
        {/* Hero */}
        <div className="mb-8 rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="mb-2 text-sm text-gray-500 uppercase tracking-wide">Kết quả OPIC của bạn</p>
          <div className="mb-4 text-7xl font-black text-blue-600">{level}</div>
          <LevelBadge level={level} />
          <p className="mt-3 text-lg font-semibold text-gray-800">{OPIC_LEVEL_LABELS[level]}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {result.overallScore.toFixed(1)}<span className="text-base text-gray-400">/100</span>
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Kiểm tra lúc {new Date(result.testedAt).toLocaleString("vi-VN")}
          </p>
        </div>

        {/* Level scale */}
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Thang đo OPIC
          </h3>
          <div className="flex gap-1">
            {OPIC_LEVEL_ORDER.map((l, i) => (
              <div
                key={l}
                className={`flex-1 rounded-md py-2 text-center text-xs font-bold transition
                  ${l === level
                    ? "bg-blue-600 text-white scale-105 shadow"
                    : i < levelIndex
                      ? "bg-gray-200 text-gray-500"
                      : "bg-gray-100 text-gray-400"
                  }`}
              >
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* Skill breakdown */}
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Điểm kỹ năng
          </h3>
          <div className="flex flex-col gap-4">
            {SKILL_KEYS.map((sk) => {
              const field = SKILL_TO_FIELD[sk] as keyof typeof result;
              const score = result[field] as number;
              return (
                <ScoreBar
                  key={sk}
                  label={OPIC_SKILL_LABELS[sk]}
                  score={score}
                  isStrongest={result.strongestSkill === sk}
                  isWeakest={result.weakestSkill === sk}
                />
              );
            })}
          </div>
        </div>

        {/* Improvement advice */}
        {result.improvementAdvice && (
          <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-5">
            <h3 className="mb-2 text-sm font-semibold text-amber-800">💡 Lời khuyên cải thiện</h3>
            <p className="text-sm text-amber-700 leading-relaxed">{result.improvementAdvice}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/opic/survey")}
            className="rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Thi lại
          </button>
          <button
            onClick={() => router.push("/opic/history")}
            className="rounded-xl border border-gray-300 py-3 font-medium text-gray-700 hover:bg-gray-50"
          >
            Xem lịch sử thi
          </button>
          <button
            onClick={() => router.push("/")}
            className="text-center text-sm text-gray-400 hover:text-gray-600"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
