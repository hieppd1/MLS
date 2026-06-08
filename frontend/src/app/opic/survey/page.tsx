"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  useGetTopicsQuery,
  useGetMySurveyQuery,
  useSaveSurveyMutation,
  useCreateSessionMutation,
  useGetPublishedOPICQuizzesQuery,
} from "@/lib/features/quiz/opicApi";

const DIFFICULTIES = [
  { value: 1, label: "Cơ bản 1", desc: "Hoàn toàn mới bắt đầu" },
  { value: 2, label: "Cơ bản 2", desc: "Biết chút ít" },
  { value: 3, label: "Trung cấp 1", desc: "Có thể giao tiếp đơn giản" },
  { value: 4, label: "Trung cấp 2", desc: "Giao tiếp tự tin" },
  { value: 5, label: "Nâng cao 1", desc: "Thành thạo khá" },
  { value: 6, label: "Nâng cao 2", desc: "Gần như bản ngữ" },
];

const LEVELS = ["IL", "IM1", "IM2", "IM3", "IH", "AL"];

const TOPIC_LABELS: Record<string, string> = {
  music: "Âm nhạc", movies: "Phim ảnh", sports: "Thể thao",
  reading: "Đọc sách", cooking: "Nấu ăn", travel: "Du lịch",
  technology: "Công nghệ", shopping: "Mua sắm", health: "Sức khỏe",
  education: "Giáo dục", pets: "Thú cưng", hobbies: "Sở thích",
  fashion: "Thời trang", environment: "Môi trường", family: "Gia đình",
  volunteering: "Tình nguyện",
};

export default function OPICSurveyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">...</p></div>}>
      <OPICSurveyContent />
    </Suspense>
  );
}

function OPICSurveyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetQuizId = searchParams.get("quizId") ?? "";
  const t = useTranslations("opic");
  const tos = useTranslations("opic_survey");
  const ttp = useTranslations("opic_topics");

  const { data: topics } = useGetTopicsQuery();
  const { data: existingSurvey } = useGetMySurveyQuery();
  const [saveSurvey, { isLoading: saving }] = useSaveSurveyMutation();
  const [createSession, { isLoading: creating }] = useCreateSessionMutation();

  const [selected, setSelected] = useState<Set<string>>(
    new Set(existingSurvey?.selectedTopics ?? [])
  );
  const [difficulty, setDifficulty] = useState(existingSurvey?.chosenDifficulty ?? 3);
  const [targetLevel, setTargetLevel] = useState<string>(existingSurvey?.targetLevel ?? "");
  const [selectedQuizId, setSelectedQuizId] = useState<string>(presetQuizId);
  const [error, setError] = useState("");

  const { data: publishedQuizzes = [], isLoading: quizzesLoading } = useGetPublishedOPICQuizzesQuery("vi");

  // Auto-select when quizzes are loaded and a presetQuizId is in the URL
  useEffect(() => {
    if (presetQuizId && publishedQuizzes.length > 0) {
      setSelectedQuizId(presetQuizId);
    }
  }, [presetQuizId, publishedQuizzes]);

  const toggle = (topic: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(topic) ? next.delete(topic) : next.add(topic);
      return next;
    });

  const handleStart = async () => {
    if (selected.size < 3) {
      setError(tos("error_min_topics"));
      return;
    }
    if (!selectedQuizId) {
      setError(tos("error_choose_quiz"));
      return;
    }
    setError("");
    try {
      const survey = await saveSurvey({
        selectedTopics: Array.from(selected),
        targetLevel: targetLevel || undefined,
        chosenDifficulty: difficulty,
        language: "vi",
      }).unwrap();

      const session = await createSession({
        surveyId: survey.id,
        chosenDifficulty: difficulty,
        language: "vi",
        quizId: selectedQuizId,
      }).unwrap();

      router.push(`/opic/${session.id}/play`);
    } catch {
      setError(tos("error_create"));
    }
  };

  const allTopics = topics?.surveyTopics ?? [];
  const loading = saving || creating;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">{tos("page_title")}</h1>
          <p className="mt-2 text-gray-500">
            {tos("subtitle")}
          </p>
        </div>

        {/* Topics */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-gray-800">
            {tos("topics_header")} <span className="text-red-500">*</span>
          </h2>
          <p className="mb-4 text-sm text-gray-500">{tos("topics_hint")}</p>
          <div className="flex flex-wrap gap-2">
            {allTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => toggle(topic)}
                disabled={!selected.has(topic) && selected.size >= 8}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition
                  ${selected.has(topic)
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 disabled:opacity-40"
                  }`}
              >
                {ttp.has(topic) ? ttp(topic) : (TOPIC_LABELS[topic] ?? topic)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">{tos("topics_selected", { selected: selected.size, max: 8 })}</p>
        </div>

        {/* Quiz Selector */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-gray-800">
            {tos("quiz_header")} <span className="text-red-500">*</span>
          </h2>
          <p className="mb-4 text-sm text-gray-500">{tos("quiz_hint")}</p>
          {quizzesLoading ? (
            <p className="text-sm text-gray-400">{tos("quizzes_loading")}</p>
          ) : publishedQuizzes.length === 0 ? (
            <p className="text-sm text-amber-600">{tos("quizzes_empty")}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {publishedQuizzes.map((quiz) => (
                <button
                  key={quiz.id}
                  onClick={() => setSelectedQuizId(quiz.id)}
                  className={`rounded-lg border-2 p-3 text-left transition
                    ${selectedQuizId === quiz.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                    }`}
                >
                  <p className="font-semibold text-gray-800">{quiz.title}</p>
                  <p className="text-xs text-gray-500">{tos("questions_count", { count: quiz.questionCount })}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">{t("current_level")}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className={`rounded-lg border-2 p-3 text-left transition
                  ${difficulty === d.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                  }`}
              >
                <p className="font-semibold text-gray-800">{tos(`diff_${d.value}_label`)}</p>
                <p className="text-xs text-gray-500">{tos(`diff_${d.value}_desc`)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Target level (optional) */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-gray-800">
            {t("target_level")} <span className="text-gray-400 font-normal text-sm">{t("target_level_optional")}</span>
          </h2>
          <p className="mb-3 text-sm text-gray-500">{tos("target_question")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTargetLevel("")}
              className={`rounded-full border px-3 py-1.5 text-sm transition
                ${!targetLevel ? "border-gray-500 bg-gray-700 text-white" : "border-gray-200 text-gray-600"}`}
            >
              {t("auto_evaluate")}
            </button>
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setTargetLevel(l)}
                className={`rounded-full border px-3 py-1.5 text-sm transition
                  ${targetLevel === l
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-gray-200 text-gray-600 hover:border-blue-300"
                  }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
        )}

        {/* Notice */}
        <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">{tos("notice_title")}</p>
          <ul className="list-disc list-inside space-y-1 text-amber-700">
            <li>{tos("notice_1")}</li>
            <li>{tos("notice_2")}</li>
            <li>{tos("notice_3")}</li>
            <li>{tos("notice_4")}</li>
          </ul>
        </div>

        <button
          onClick={handleStart}
          disabled={loading || selected.size < 3}
          className="w-full rounded-xl bg-blue-600 py-3.5 text-base font-semibold text-white
            transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t("initializing") : t("start_test")}
        </button>
      </div>
    </div>
  );
}
