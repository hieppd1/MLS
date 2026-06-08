"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useGetMyHistoryQuery, OPIC_LEVEL_LABELS, type OPICLevel } from "@/lib/features/quiz/opicApi";
import { formatDate } from "@/lib/i18nFormat";

export default function OPICHistoryPage() {
  const t = useTranslations("opic_player");
  const { data: sessions = [], isLoading } = useGetMyHistoryQuery();

  const stateLabel = (state: string) => {
    switch (state) {
      case "Orientation": return t("state_orientation");
      case "Session1":    return t("state_session1");
      case "MidAdjust":   return t("state_midadjust");
      case "Session2":    return t("state_session2");
      case "Completed":   return t("state_completed");
      default: return state;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t("history_title")}</h1>
          <Link
            href="/opic/survey"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t("history_new")}
          </Link>
        </div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        )}

        {!isLoading && sessions.length === 0 && (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <p className="text-4xl mb-4">🎙️</p>
            <p className="text-gray-600 mb-6">{t("history_empty")}</p>
            <Link
              href="/opic/survey"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              {t("history_start_first")}
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {sessions.map((s) => (
            <div key={s.id} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {s.opicLevelResult && (
                      <span className="rounded-full bg-blue-600 px-3 py-0.5 text-sm font-bold text-white">
                        {s.opicLevelResult}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${s.isCompleted ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {stateLabel(s.sessionState)}
                    </span>
                  </div>
                  {s.opicLevelResult && (
                    <p className="text-xs text-gray-500">
                      {OPIC_LEVEL_LABELS[s.opicLevelResult as OPICLevel]}
                      {s.overallScore != null && t("score_format", { score: s.overallScore.toFixed(1) })}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDate(s.startedAt)}
                    {t("questions_done", { done: s.questionsDone, total: 15 })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {s.isCompleted ? (
                    <Link
                      href={`/opic/${s.id}/result`}
                      className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-200"
                    >
                      {t("view_result")}
                    </Link>
                  ) : (
                    <Link
                      href={`/opic/${s.id}/play`}
                      className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200"
                    >
                      {t("continue_test")}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
