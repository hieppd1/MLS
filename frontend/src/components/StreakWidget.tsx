"use client";

import { useTranslations } from "next-intl";
import { useGetLearningStreakQuery } from "@/lib/features/learning/learningApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildCalendar(activitySet: Set<string>, weekCount = 16) {
  // Align to last Sunday
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay(); // 0 = Sun
  const endSunday = new Date(today);
  endSunday.setDate(today.getDate() + (6 - dayOfWeek));

  const startDate = new Date(endSunday);
  startDate.setDate(endSunday.getDate() - weekCount * 7 + 1);

  // Build columns (weeks), each week is 7 days Sun→Sat
  const weeks: { date: Date; dateStr: string; active: boolean; isToday: boolean; isFuture: boolean }[][] = [];
  let current = new Date(startDate);
  while (current <= endSunday) {
    const week: typeof weeks[0] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = toDateStr(current);
      const isToday = dateStr === toDateStr(today);
      const isFuture = current > today;
      week.push({ date: new Date(current), dateStr, active: activitySet.has(dateStr), isToday, isFuture });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }
  return { weeks, startDate };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface StreakWidgetProps {
  compact?: boolean;
}

export default function StreakWidget({ compact = false }: StreakWidgetProps) {
  const t = useTranslations("streak_widget");
  const days = t.raw("days") as string[];
  const months = t.raw("months") as string[];
  const { data, isLoading } = useGetLearningStreakQuery();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
        <div className="mt-3 h-20 animate-pulse rounded-lg bg-gray-100" />
      </div>
    );
  }

  if (!data) return null;

  const activitySet = new Set(data.activityDates ?? []);
  const WEEKS = compact ? 10 : 16;
  const { weeks } = buildCalendar(activitySet, WEEKS);

  // Month labels: find first week of each month transition
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wIdx) => {
    const m = week[0].date.getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ col: wIdx, label: months[m] });
      lastMonth = m;
    }
  });

  const cellSize = compact ? 10 : 12;
  const cellGap = 2;
  const cellTotal = cellSize + cellGap;
  const totalWidth = weeks.length * cellTotal - cellGap;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <span className="font-bold text-gray-900 text-sm">{t("title")}</span>
        </div>
        {data.learnedToday && (
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">
            {t("today_done")}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="flex divide-x divide-gray-100 border-y border-gray-100 mx-0">
        <StatCell label={t("current_streak")} value={data.currentStreak} unit={t("day_unit")} accent="#F97316" />
        <StatCell label={t("longest_streak")} value={data.longestStreak} unit={t("day_unit")} accent="#1565C0" />
        <StatCell label={t("total_learned")} value={data.totalDaysLearned} unit={t("day_unit")} accent="#16A34A" />
      </div>

      {/* Calendar heatmap */}
      <div className="px-4 pb-4 pt-3 overflow-x-auto">
        <div style={{ minWidth: totalWidth, position: "relative" }}>
          {/* Month labels */}
          <div style={{ position: "relative", height: 16, marginBottom: 4 }}>
            {monthLabels.map(({ col, label }) => (
              <span
                key={col}
                style={{
                  position: "absolute",
                  left: col * cellTotal,
                  fontSize: 10,
                  color: "#9CA3AF",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Grid: rows = days of week, cols = weeks */}
          <div style={{ display: "flex", gap: cellGap }}>
            {/* Day-of-week labels */}
            <div style={{ display: "flex", flexDirection: "column", gap: cellGap, marginRight: 2 }}>
              {days.map((d, i) => (
                <div key={i} style={{ height: cellSize, fontSize: 9, color: "#9CA3AF", lineHeight: `${cellSize}px`, width: 14, textAlign: "right" }}>
                  {i % 2 === 1 ? d : ""}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wIdx) => (
              <div key={wIdx} style={{ display: "flex", flexDirection: "column", gap: cellGap }}>
                {week.map((day) => (
                  <div
                    key={day.dateStr}
                    title={day.active ? `✓ ${day.dateStr}` : day.dateStr}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 2,
                      background: day.isFuture
                        ? "transparent"
                        : day.active
                        ? day.isToday
                          ? "#F97316"
                          : "#1565C0"
                        : day.isToday
                        ? "#FED7AA"
                        : "#F3F4F6",
                      border: day.isToday ? `1.5px solid ${day.active ? "#EA580C" : "#FDBA74"}` : "none",
                      cursor: "default",
                      transition: "transform 0.1s",
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 10, color: "#9CA3AF" }}>{t("less")}</span>
            {[0, 1].map((v) => (
              <div key={v} style={{ width: 10, height: 10, borderRadius: 2, background: v === 0 ? "#F3F4F6" : "#1565C0" }} />
            ))}
            <span style={{ fontSize: 10, color: "#9CA3AF" }}>{t("more")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value, unit, accent }: { label: string; value: number; unit: string; accent: string }) {
  return (
    <div className="flex flex-1 flex-col items-center py-3 px-2">
      <span className="text-2xl font-black" style={{ color: accent }}>{value}</span>
      <span className="text-[10px] text-gray-400 leading-tight text-center">{unit}</span>
      <span className="text-[10px] font-medium text-gray-500 leading-tight text-center mt-0.5">{label}</span>
    </div>
  );
}
