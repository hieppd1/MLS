import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface MyTeacherCourseItem {
  id: string;
  title: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  level: number;
  status: string;
  price: number;
  discountPrice: number | null;
  isFree: boolean;
  slug: string | null;
  moduleCount: number;
  enrollmentCount: number;
  createdAt: string;
}

export interface OPICAnalyticsSkillScores {
  avgPronunciation: number;
  avgFluency: number;
  avgCoherence: number;
  avgVocabulary: number;
  avgTaskAchievement: number;
}

export interface OPICTeacherAnalyticsDto {
  totalSessions: number;
  completedSessions: number;
  levelDistribution: Record<string, number>;
  avgOverallScore: number;
  skillScores: OPICAnalyticsSkillScores;
}

export interface OPICStudentResultItem {
  userId: string;
  userName: string;
  assignedLevel: string;
  overallScore: number;
  pronunciationScore: number;
  fluencyScore: number;
  coherenceScore: number;
  vocabularyScore: number;
  taskAchievementScore: number;
  language: string;
  testedAt: string;
}

export interface PagedOPICStudentResults {
  items: OPICStudentResultItem[];
  total: number;
  page: number;
  pageSize: number;
}

// ── API slice ──────────────────────────────────────────────────────────────────

export const teacherApi = createApi({
  reducerPath: "teacherApi",
  baseQuery: withReauth(`${API_BASE}/api/v1`),
  tagTypes: ["MyCourses", "OPICAnalytics", "OPICStudents"],
  endpoints: (builder) => ({
    getMyCourses: builder.query<MyTeacherCourseItem[], void>({
      query: () => "/teacher/portal/courses",
      providesTags: ["MyCourses"],
    }),

    createTeacherCourse: builder.mutation<{ id: string }, {
      title: string; description?: string; level: number;
      price?: number; discountPrice?: number;
      shortDescription?: string; isFree?: boolean; certificateEnabled?: boolean;
      visibility?: string; code?: string; language?: string; thumbnailUrl?: string;
      tags?: string; completionRequired?: boolean;
    }>({
      query: (body) => ({ url: "/teacher/portal/courses", method: "POST", body }),
      invalidatesTags: ["MyCourses"],
    }),

    getOPICAnalytics: builder.query<OPICTeacherAnalyticsDto, void>({
      query: () => "/teacher/opic/analytics",
      providesTags: ["OPICAnalytics"],
    }),

    getOPICStudents: builder.query<PagedOPICStudentResults, { page?: number; pageSize?: number } | void>({
      query: (p) => {
        const page     = (p as { page?: number } | undefined)?.page     ?? 1;
        const pageSize = (p as { pageSize?: number } | undefined)?.pageSize ?? 20;
        return `/teacher/opic/students?page=${page}&pageSize=${pageSize}`;
      },
      providesTags: ["OPICStudents"],
    }),
  }),
});

export const {
  useGetMyCoursesQuery,
  useCreateTeacherCourseMutation,
  useGetOPICAnalyticsQuery,
  useGetOPICStudentsQuery,
} = teacherApi;
