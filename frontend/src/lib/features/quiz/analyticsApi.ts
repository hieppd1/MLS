import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QuizQuestionStat {
  questionId: string;
  content: string;
  correctRate: number;
  avgScore: number;
  totalAnswers: number;
}

export interface QuizAnalytics {
  quizId: string;
  title: string;
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  averagePercentage: number;
  passRate: number;
  averageTimeTaken: number;
  questionStats: QuizQuestionStat[];
}

export interface QuizHistoryItem {
  quizId: string;
  title: string;
  score: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
}

export interface StudentAnalytics {
  userId: string;
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  passRate: number;
  quizHistory: QuizHistoryItem[];
}

export interface CourseQuizItem {
  id: string;
  title: string;
  attempts: number;
  passRate: number;
  avgScore: number;
}

export interface CourseQuizSummary {
  courseId: string;
  totalQuizzes: number;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  quizzes: CourseQuizItem[];
}

export interface PlacementLevelItem {
  userId: string;
  level: number;
  testedAt: string;
}

export interface PlacementOverview {
  totalTested: number;
  levelDistribution: Record<number, number>;
  skillAverages: Record<string, number>;
  recentResults: PlacementLevelItem[];
}

// ── API ───────────────────────────────────────────────────────────────────────

export const analyticsApi = createApi({
  reducerPath: "analyticsApi",
  baseQuery: withReauth(API_BASE),
  tagTypes: ["Analytics"],
  endpoints: (builder) => ({
    getQuizAnalytics: builder.query<QuizAnalytics, string>({
      query: (id) => `/api/v1/analytics/quizzes/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Analytics", id: `quiz-${id}` }],
    }),

    getStudentAnalytics: builder.query<StudentAnalytics, string>({
      query: (userId) => `/api/v1/analytics/students/${userId}`,
      providesTags: (_r, _e, id) => [{ type: "Analytics", id: `student-${id}` }],
    }),

    getCourseQuizSummary: builder.query<CourseQuizSummary, string>({
      query: (courseId) => `/api/v1/analytics/courses/${courseId}/quiz-summary`,
      providesTags: (_r, _e, id) => [{ type: "Analytics", id: `course-${id}` }],
    }),

    getPlacementOverview: builder.query<PlacementOverview, void>({
      query: () => "/api/v1/analytics/placement/overview",
      providesTags: [{ type: "Analytics", id: "placement" }],
    }),
  }),
});

export const {
  useGetQuizAnalyticsQuery,
  useGetStudentAnalyticsQuery,
  useGetCourseQuizSummaryQuery,
  useGetPlacementOverviewQuery,
} = analyticsApi;
