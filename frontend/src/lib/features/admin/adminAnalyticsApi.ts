import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DailyRevenueDto {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface TopBookDto {
  id: string;
  title: string;
  coverEmoji: string;
  coverColor: string;
  coverUrl: string | null;
  purchaseCount: number;
  totalRevenue: number;
}

export interface OrderStatsDto {
  totalOrders: number;
  pending: number;
  waitingPayment: number;
  paid: number;
  processing: number;
  completed: number;
  cancelled: number;
  failed: number;
}

export interface AnalyticsSummaryDto {
  totalRevenue: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  totalOrders: number;
  completedOrders: number;
  totalBooks: number;
  totalReviews: number;
}

export interface AdminAnalyticsResult {
  summary: AnalyticsSummaryDto;
  orderStats: OrderStatsDto;
  dailyRevenue: DailyRevenueDto[];
  topBooks: TopBookDto[];
}

// ── Phase 7: User Stats ───────────────────────────────────────────────────────

export interface WeeklyCountDto { weekStart: string; count: number }
export interface TopItemDto     { id: string; label: string; count: number }

export interface UserActivityBucketDto {
  under36h: number;
  from36To72h: number;
  over72h: number;
  neverActive: number;
}
export interface AgeGroupDto       { group: string; count: number }
export interface CountryStatDto    { country: string; count: number }
export interface LanguageStatDto   { language: string; count: number }
export interface WeeklyRegDto      { weekLabel: string; count: number }

export interface UserStatsResult {
  totalUsers: number;
  newThisWeek: number;
  newThisMonth: number;
  activityBuckets: UserActivityBucketDto;
  ageGroups: AgeGroupDto[];
  topCountries: CountryStatDto[];
  topLanguages: LanguageStatDto[];
  weeklyRegistrations: WeeklyRegDto[];
}

// ── Phase 7: Content View Stats ───────────────────────────────────────────────

export interface ContentTypeViewStats {
  totalViews: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
  weeklyViews: WeeklyCountDto[];
  topItems: TopItemDto[];
}

export interface ContentViewStatsResult {
  courses: ContentTypeViewStats;
  teachers: ContentTypeViewStats;
  books: ContentTypeViewStats;
}

// ── Phase 7: Sales Stats ──────────────────────────────────────────────────────

export interface WeeklyRevenueDto { period: string; count: number; revenue: number }
export interface TopSalesItemDto  { id: string; title: string; type: string; soldCount: number; revenue: number }

export interface SalesStatsResult {
  totalOrdersPaid: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  weeklySales: WeeklyRevenueDto[];
  topCourses: TopSalesItemDto[];
  topBooks: TopSalesItemDto[];
}

// ── API ───────────────────────────────────────────────────────────────────────

export const adminAnalyticsApi = createApi({
  reducerPath: "adminAnalyticsApi",
  baseQuery: withReauth(`${API_BASE}/api/v1/admin/analytics`),
  tagTypes: ["Analytics"],
  endpoints: (builder) => ({
    getAdminAnalytics: builder.query<AdminAnalyticsResult, { days?: number } | void>({
      query: (params) => ({
        url: "",
        params: { days: (params as { days?: number })?.days ?? 30 },
      }),
      providesTags: ["Analytics"],
    }),
    getUserStats: builder.query<UserStatsResult, { weeksBack?: number } | void>({
      query: (params) => ({
        url: "users",
        params: { weeksBack: (params as { weeksBack?: number })?.weeksBack ?? 12 },
      }),
      providesTags: ["Analytics"],
    }),
    getContentViewStats: builder.query<ContentViewStatsResult, { weeksBack?: number } | void>({
      query: (params) => ({
        url: "content-views",
        params: { weeksBack: (params as { weeksBack?: number })?.weeksBack ?? 8 },
      }),
      providesTags: ["Analytics"],
    }),
    getSalesStats: builder.query<SalesStatsResult, { weeksBack?: number } | void>({
      query: (params) => ({
        url: "sales",
        params: { weeksBack: (params as { weeksBack?: number })?.weeksBack ?? 8 },
      }),
      providesTags: ["Analytics"],
    }),
  }),
});

export const {
  useGetAdminAnalyticsQuery,
  useGetUserStatsQuery,
  useGetContentViewStatsQuery,
  useGetSalesStatsQuery,
} = adminAnalyticsApi;

