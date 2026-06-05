"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatCurrency, formatDate } from "@/lib/i18nFormat";
import {
  useGetAdminAnalyticsQuery,
  useGetUserStatsQuery,
  useGetContentViewStatsQuery,
  useGetSalesStatsQuery,
  type DailyRevenueDto,
  type WeeklyCountDto,
  type WeeklyRevenueDto,
} from "@/lib/features/admin/adminAnalyticsApi";

function fmt(v: number) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M₫";
  if (v >= 1_000)     return (v / 1_000).toFixed(0) + "K₫";
  return formatCurrency(v);
}
function fmtFull(v: number) { return formatCurrency(v); }
function pct(current: number, prev: number) {
  if (!prev) return null;
  const d = ((current - prev) / prev) * 100;
  return { val: Math.abs(d).toFixed(0), up: d >= 0 };
}

// ── Gradient Stat Card ────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon, gradient, change,
}: {
  label: string; value: string; sub?: string;
  icon: string; gradient: string; change?: { val: string; up: boolean } | null;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${gradient}`}>
      <div className="absolute -right-3 -top-3 text-white/15 text-8xl select-none leading-none">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">{label}</p>
      <p className="text-3xl font-extrabold leading-none mb-2">{value}</p>
      <div className="flex items-center gap-2">
        {sub && <p className="text-xs text-white/60 truncate">{sub}</p>}
        {change && (
          <span className={`ml-auto flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${change.up ? "bg-white/25 text-white" : "bg-black/20 text-white/80"}`}>
            {change.up ? "▲" : "▼"} {change.val}%
          </span>
        )}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl ${className}`} />;
}

// ── Section title ─────────────────────────────────────────────────────────────
function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Revenue bar chart ─────────────────────────────────────────────────────────
function MiniBarChart({ data }: { data: DailyRevenueDto[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const w = 600, h = 120, barW = w / data.length - 1.5;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 120 }}>
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const barH = Math.max((d.revenue / max) * (h - 12), d.revenue > 0 ? 4 : 0);
        return (
          <g key={i}>
            <rect x={i * (w / data.length) + 0.5} y={h - barH} width={barW} height={barH}
              fill={d.revenue > 0 ? "url(#revGrad)" : "#f3f4f6"} rx={3} />
            <title>{formatDate(d.date)}: {fmtFull(d.revenue)}</title>
          </g>
        );
      })}
    </svg>
  );
}

// ── Weekly bar chart ──────────────────────────────────────────────────────────
function WeeklyBarChart({ data, fill, gradId }: { data: WeeklyCountDto[]; fill: string; gradId: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const w = 400, h = 90, barW = w / Math.max(data.length, 1) - 2;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 90 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} />
          <stop offset="100%" stopColor={fill} stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const barH = Math.max((d.count / max) * (h - 8), d.count > 0 ? 3 : 0);
        return (
          <g key={i}>
            <rect x={i * (w / data.length) + 1} y={h - barH} width={barW} height={barH}
              fill={d.count > 0 ? `url(#${gradId})` : "#f3f4f6"} rx={3} />
            <title>{d.weekStart}: {d.count}</title>
          </g>
        );
      })}
    </svg>
  );
}

// ── Weekly revenue chart ──────────────────────────────────────────────────────
function WeeklyRevenueChart({ data }: { data: WeeklyRevenueDto[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const w = 600, h = 110, barW = w / Math.max(data.length, 1) - 2;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 110 }}>
      <defs>
        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const barH = Math.max((d.revenue / max) * (h - 8), d.revenue > 0 ? 3 : 0);
        return (
          <g key={i}>
            <rect x={i * (w / data.length) + 1} y={h - barH} width={barW} height={barH}
              fill={d.revenue > 0 ? "url(#salesGrad)" : "#f3f4f6"} rx={3} />
            <title>{d.weekStart}: {fmtFull(d.revenue)} ({d.orders} đơn)</title>
          </g>
        );
      })}
    </svg>
  );
}

// ── Order status bar ──────────────────────────────────────────────────────────
type OrderStats = NonNullable<ReturnType<typeof useGetAdminAnalyticsQuery>["data"]>["orderStats"];
function OrderStatusBar({ stats }: { stats: OrderStats }) {
  const items = [
    { label: "Hoàn thành", value: stats.completed,                      color: "#10b981" },
    { label: "Đã TT",      value: stats.paid,                           color: "#3b82f6" },
    { label: "Chờ",        value: stats.pending + stats.waitingPayment, color: "#f59e0b" },
    { label: "Đang xử lý", value: stats.processing,                     color: "#6366f1" },
    { label: "Huỷ/Lỗi",   value: stats.cancelled + stats.failed,       color: "#ef4444" },
  ].filter((x) => x.value > 0);
  const total = items.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden gap-px mb-3">
        {items.map((item) => (
          <div key={item.label} style={{ width: `${(item.value / total) * 100}%`, background: item.color }}
            title={`${item.label}: ${item.value}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
            <span className="text-gray-500 truncate">{item.label}</span>
            <span className="font-bold text-gray-900 ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
type Tab = "overview" | "users" | "views" | "sales";

// ── Page ──────────────────────────────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const t = useTranslations("admin_analytics");
  const TABS: { key: Tab; icon: string; label: string }[] = [
    { key: "overview", icon: "📊", label: t("tab_overview") },
    { key: "users",    icon: "👥", label: t("tab_users")    },
    { key: "views",    icon: "👁️", label: t("tab_views")    },
    { key: "sales",    icon: "💰", label: t("tab_sales")    },
  ];
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<Tab>("overview");

  const { data, isLoading } = useGetAdminAnalyticsQuery({ days });
  const { data: userStats }  = useGetUserStatsQuery({ weeksBack: 12 });
  const { data: viewStats }  = useGetContentViewStatsQuery({ weeksBack: 8 });
  const { data: salesStats } = useGetSalesStatsQuery({ weeksBack: 8 });

  const { summary, orderStats, dailyRevenue, topBooks } = data ?? {
    summary: null, orderStats: null, dailyRevenue: [], topBooks: [],
  };
  const change = summary ? pct(summary.revenueThisMonth, summary.revenueLastMonth) : null;

  return (
    <div className="p-6 max-w-7xl space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t("subtitle")}</p>
        </div>
        {tab === "overview" && (
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value={7}>{t("period_7d")}</option>
            <option value={30}>{t("period_30d")}</option>
            <option value={90}>{t("period_90d")}</option>
          </select>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((tabItem) => (
          <button key={tabItem.key} onClick={() => setTab(tabItem.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
              tab === tabItem.key
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-[1.02]"
                : "bg-white text-gray-500 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
            }`}>
            <span>{tabItem.icon}</span> {tabItem.label}
          </button>
        ))}
      </div>

      {/* ─────────── TỔNG QUAN ─────────── */}
      {tab === "overview" && (
        <>
          {isLoading || !summary ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label={t("stat_revenue")} value={fmt(summary.totalRevenue)} icon="💎"
                gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
                sub={t("prev_month", { n: fmt(summary.revenueLastMonth) })} change={change} />
              <StatCard label={t("stat_month")} value={fmt(summary.revenueThisMonth)} icon="📈"
                gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                sub={t("prev_month", { n: fmt(summary.revenueLastMonth) })} />
              <StatCard label={t("stat_orders")} value={summary.totalOrders.toString()} icon="🛒"
                gradient="bg-gradient-to-br from-orange-400 to-pink-500"
                sub={t("completed_orders", { n: orderStats?.completed ?? 0 })} />
              <StatCard label={t("stat_books_reviews")} value={`${summary.totalBooks} / ${summary.totalReviews}`} icon="📚"
                gradient="bg-gradient-to-br from-sky-500 to-blue-600"
                sub={t("total_categories")} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <SectionTitle title={`📉 Doanh thu ${days} ngày gần nhất`} sub="Biểu đồ theo ngày" />
                {dailyRevenue.length > 0 && (
                  <span className="text-xs text-gray-400">
                    {formatDate(dailyRevenue[0].date)} – {formatDate(dailyRevenue[dailyRevenue.length - 1].date)}
                  </span>
                )}
              </div>
              {isLoading ? <Skeleton className="h-32" /> :
                dailyRevenue.length > 0 ? <MiniBarChart data={dailyRevenue} />
                  : <div className="flex items-center justify-center h-28 text-gray-300 text-sm">{t("no_data")}</div>
              }
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionTitle title={"\ud83d\udd35 " + t("order_status_title")} />
              {isLoading || !orderStats ? <Skeleton className="h-32" /> : (
                <>
                  <OrderStatusBar stats={orderStats} />
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
                    {[
                      { label: t("orders_total"),    value: orderStats.totalOrders, bold: true },
                      { label: "Hoàn thành",         value: orderStats.completed },
                      { label: t("orders_paid"),     value: orderStats.paid },
                      { label: "Đang xử lý",         value: orderStats.processing },
                      { label: t("orders_pending"),  value: orderStats.pending + orderStats.waitingPayment },
                      { label: t("orders_cancelled"),value: orderStats.cancelled + orderStats.failed },
                    ].map((r) => (
                      <div key={r.label} className="flex justify-between text-xs">
                        <span className={r.bold ? "font-bold text-gray-800" : "text-gray-500"}>{r.label}</span>
                        <span className={`font-bold ${r.bold ? "text-indigo-600 text-sm" : "text-gray-900"}`}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
            <SectionTitle title={"\ud83c\udfc6 " + t("top_books")} />
              <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2.5 py-1 rounded-full">{days} ngày</span>
            </div>
            {isLoading ? (
              <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : topBooks.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-300 text-sm">{t("no_book_data")}</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <th className="px-5 py-3 text-left w-12">#</th>
                    <th className="px-4 py-3 text-left">{t("col_book")}</th>
                    <th className="px-4 py-3 text-right">{t("col_sold")}</th>
                    <th className="px-4 py-3 text-right">{t("col_revenue")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topBooks.map((b, i) => (
                    <tr key={b.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-5 py-3">
                        <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-extrabold ${
                          i === 0 ? "bg-yellow-100 text-yellow-600" :
                          i === 1 ? "bg-gray-100 text-gray-500" :
                          i === 2 ? "bg-orange-100 text-orange-500" : "text-gray-300 font-bold"
                        }`}>{i + 1}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-11 rounded-lg flex items-center justify-center text-lg shrink-0 shadow-sm border border-gray-100"
                            style={{ background: b.coverColor }}>
                            {b.coverUrl ? <img src={b.coverUrl} alt="" className="w-full h-full object-cover rounded-lg" /> : <span>{b.coverEmoji}</span>}
                          </div>
                          <span className="font-semibold text-gray-900 line-clamp-1">{b.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="bg-indigo-50 text-indigo-700 font-bold text-xs px-2 py-0.5 rounded-full">{b.purchaseCount}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{fmt(b.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ─────────── NGƯỜI DÙNG ─────────── */}
      {tab === "users" && (
        !userStats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label={t("user_total")} value={userStats.totalUsers.toString()} icon="👥"
                gradient="bg-gradient-to-br from-indigo-500 to-violet-600" />
              <StatCard label={t("user_new_week")} value={userStats.newThisWeek.toString()} icon="✨"
                gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
              <StatCard label={t("user_new_month")} value={userStats.newThisMonth.toString()} icon="📅"
                gradient="bg-gradient-to-br from-sky-500 to-blue-600" />
              <StatCard label={t("user_active_36h")} value={(userStats.activityBuckets?.under36h ?? 0).toString()} icon="⚡"
                gradient="bg-gradient-to-br from-orange-400 to-pink-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <SectionTitle title={"\u26a1 " + t("activity_title")} sub={t("activity_subtitle")} />
                <div className="space-y-3">
                  {[
                    { label: t("user_active_36h"),  value: userStats.activityBuckets?.under36h    ?? 0, color: "#10b981", bg: "bg-emerald-50" },
                    { label: "Hoạt động 36–72h", value: userStats.activityBuckets?.from36To72h ?? 0, color: "#f59e0b", bg: "bg-amber-50"   },
                    { label: "Không hoạt động",  value: userStats.activityBuckets?.over72h     ?? 0, color: "#ef4444", bg: "bg-red-50"     },
                    { label: "Chưa đăng nhập",   value: userStats.activityBuckets?.neverActive ?? 0, color: "#9ca3af", bg: "bg-gray-50"   },
                  ].map((r) => {
                    const p = userStats.totalUsers ? Math.round((r.value / userStats.totalUsers) * 100) : 0;
                    return (
                      <div key={r.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 font-medium">{r.label}</span>
                          <span className="font-bold text-gray-900">{r.value} <span className="text-gray-400 font-normal">({p}%)</span></span>
                        </div>
                        <div className={`h-2 rounded-full ${r.bg} overflow-hidden`}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p}%`, background: r.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <SectionTitle title={"\ud83c\udf82 " + t("age_title")} sub={t("age_subtitle")} />
                <div className="space-y-2.5 mt-1">
                  {[
                    { label: "Dưới 18", value: userStats.ageGroups?.find(g => g.group === "< 18")?.count ?? 0 },
                    { label: "18–24",   value: userStats.ageGroups?.find(g => g.group === "18-24")?.count ?? 0 },
                    { label: "25–34",   value: userStats.ageGroups?.find(g => g.group === "25-34")?.count ?? 0 },
                    { label: "35–44",   value: userStats.ageGroups?.find(g => g.group === "35-44")?.count ?? 0 },
                    { label: "45+",     value: (userStats.ageGroups?.find(g => g.group === "45-54")?.count ?? 0) + (userStats.ageGroups?.find(g => g.group === "55+")?.count ?? 0) },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{r.label}</span>
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full text-xs">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <SectionTitle title={"\ud83c\udf0d " + t("country_title")} sub={t("country_subtitle")} />
                <div className="space-y-2.5 mt-1">
                  {userStats.topCountries.length === 0 ? (
                    <p className="text-gray-300 text-sm text-center py-4">{t("no_data")}</p>
                  ) : userStats.topCountries.slice(0, 6).map((c, i) => (
                    <div key={c.country} className="flex items-center gap-2 text-sm">
                      <span className="w-5 text-xs text-gray-400 font-bold">{i + 1}</span>
                      <span className="flex-1 text-gray-600">{c.country || "Khác"}</span>
                      <span className="font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded-lg text-xs">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionTitle title={"\ud83d\udcc5 " + t("reg_title")} sub={t("reg_subtitle")} />
              <WeeklyBarChart
                data={userStats.weeklyRegistrations.map(w => ({ weekStart: w.weekLabel, count: w.count }))}
                fill="#6366f1" gradId="userGrad" />
            </div>
          </>
        )
      )}

      {/* ─────────── LƯỢT XEM ─────────── */}
      {tab === "views" && (
        !viewStats ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
        ) : (
          <div className="space-y-4">
            {(["courses", "teachers", "books"] as const).map((key) => {
              const s = viewStats[key];
              const cfg = {
                courses:  { title: "📖 Khoá học",  fill: "#6366f1", grad: "vCourseGrad" },
                teachers: { title: "👨‍🏫 Giáo viên", fill: "#0ea5e9", grad: "vTeacherGrad" },
                books:    { title: "📚 Sách",       fill: "#f59e0b", grad: "vBookGrad"   },
              }[key];
              return (
                <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">{cfg.title}</h3>
                    <div className="flex gap-2">
                      {[
                        { l: "Tổng",  v: s.totalViews,     c: "bg-indigo-50 text-indigo-700" },
                        { l: "Tuần",  v: s.viewsThisWeek,  c: "bg-emerald-50 text-emerald-700" },
                        { l: "Tháng", v: s.viewsThisMonth, c: "bg-sky-50 text-sky-700" },
                      ].map(({ l, v, c }) => (
                        <span key={l} className={`px-2.5 py-1 rounded-xl text-xs font-bold ${c}`}>{l}: {v}</span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Theo tuần (8 tuần)</p>
                      <WeeklyBarChart data={s.weeklyViews.map(w => ({ weekStart: w.period, count: w.views }))} fill={cfg.fill} gradId={cfg.grad} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Top nội dung</p>
                      {s.topItems.length === 0 ? (
                        <p className="text-gray-300 text-sm py-4 text-center">{t("no_data")}</p>
                      ) : (
                        <div className="space-y-2">
                          {s.topItems.slice(0, 8).map((item, i) => (
                            <div key={item.id} className="flex items-center gap-2 text-sm">
                              <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">{i + 1}</span>
                              <span className="flex-1 text-gray-700 truncate">{item.title}</span>
                              <span className="font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded-lg text-xs">{item.viewCount}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ─────────── DOANH SỐ ─────────── */}
      {tab === "sales" && (
        !salesStats ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label={t("sales_total_paid")} value={salesStats.totalOrdersPaid.toString()} icon="✅"
                gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
              <StatCard label={t("sales_week_orders")} value={salesStats.ordersThisWeek.toString()} icon="📦"
                gradient="bg-gradient-to-br from-indigo-500 to-violet-600" />
              <StatCard label={t("sales_week_revenue")} value={fmt(salesStats.revenueThisWeek)} icon="💵"
                gradient="bg-gradient-to-br from-sky-500 to-blue-600" />
              <StatCard label={t("sales_month_revenue")} value={fmt(salesStats.revenueThisMonth)} icon="💰"
                gradient="bg-gradient-to-br from-orange-400 to-pink-500" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionTitle title={"\ud83d\udcc9 " + t("revenue_by_week")} sub={t("revenue_subtitle")} />
              <WeeklyRevenueChart data={salesStats.weeklySales.map(w => ({ weekStart: w.period, orders: w.count, revenue: w.revenue }))} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <SectionTitle title={"\ud83c\udfc6 " + t("top_courses")} sub={t("by_purchases")} />
                <div className="space-y-2.5 mt-1">
                  {salesStats.topCourses.length === 0 ? (
                    <p className="text-gray-300 text-sm text-center py-4">{t("no_data")}</p>
                  ) : salesStats.topCourses.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3 text-sm">
                      <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-extrabold shrink-0 ${
                        i === 0 ? "bg-yellow-100 text-yellow-600" : i === 1 ? "bg-gray-100 text-gray-500" : i === 2 ? "bg-orange-100 text-orange-500" : "bg-gray-50 text-gray-400"
                      }`}>{i + 1}</span>
                      <span className="flex-1 text-gray-700 truncate">{c.title}</span>
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg text-xs">{t("sold_count", { n: c.soldCount })}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <SectionTitle title={"📚 " + t("top_books_sales")} sub={t("by_purchases")} />
                <div className="space-y-2.5 mt-1">
                  {salesStats.topBooks.length === 0 ? (
                    <p className="text-gray-300 text-sm text-center py-4">{t("no_data")}</p>
                  ) : salesStats.topBooks.map((b, i) => (
                    <div key={b.id} className="flex items-center gap-3 text-sm">
                      <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-extrabold shrink-0 ${
                        i === 0 ? "bg-yellow-100 text-yellow-600" : i === 1 ? "bg-gray-100 text-gray-500" : i === 2 ? "bg-orange-100 text-orange-500" : "bg-gray-50 text-gray-400"
                      }`}>{i + 1}</span>
                      <span className="flex-1 text-gray-700 truncate">{b.title}</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg text-xs">{t("sold_count", { n: b.soldCount })}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}