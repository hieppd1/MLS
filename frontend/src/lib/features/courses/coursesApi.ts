import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PublicCourseListItem {
  id: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  level: number;
  thumbnailUrl: string | null;
  slug: string | null;
  moduleCount: number;
  sessionCount: number;
  isEnrolled: boolean;
  isFree: boolean;
  price: number;
  discountPrice: number | null;
}

export interface PublicCoursesResult {
  items: PublicCourseListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PublicLessonItem {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  isFreeTrial: boolean;
  isLocked: boolean;
  videoStatus: string | null;
  durationSeconds: number;
  isCompleted: boolean;
}

export interface PublicSessionItem {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  isFreeTrial: boolean;
  isLocked: boolean;
  durationSeconds: number;
  segmentCount: number;
}

export interface PublicModuleItem {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  sessions: PublicSessionItem[];
}

export interface PublicCourseDetail {
  id: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  level: number;
  thumbnailUrl: string | null;
  bannerUrl: string | null;
  slug: string | null;
  teacherName: string | null;
  publishedAt: string | null;
  isEnrolled: boolean;
  isFree: boolean;
  certificateEnabled: boolean;
  modules: PublicModuleItem[];
  price: number;
  discountPrice: number | null;
  discountEndsAt: string | null;
  language?: string | null;
  tags?: string | null;
  outcomes?: string | null;
  requirements?: string | null;
  targetAudience?: string | null;
  enrollmentCount?: number;
  paidEnrollmentCount?: number;
  teacherDisplayName?: string | null;
  teacherAvatarUrl?: string | null;
  teacherSlug?: string | null;
}

export interface LessonDocumentPublic {
  id: string;
  title: string;
  type: string;
  sizeBytes: number;
}

export interface SessionProgressSummary {
  status: string;
  lastPositionSeconds: number;
  watchPercentage: number;
}

export interface SessionLearningView {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  isFreeTrial: boolean;
  publishStatus: string;
  sessionType: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  durationMinutes: number;
  passScore: number;
  content: string | null;
  audioUrl: string | null;
  documentUrl: string | null;
  transcript: string | null;
  videoAsset: {
    id: string;
    status: string;
    hlsPath: string | null;
    thumbnailUrl: string | null;
    durationSeconds: number;
  } | null;
  segments: {
    id: string;
    title: string;
    description: string | null;
    startTime: number;
    endTime: number;
    duration: number;
    orderIndex: number;
    progress: { isViewed: boolean; isCompleted: boolean } | null;
    assets: LessonDocumentPublic[];
  }[];
  progress: SessionProgressSummary | null;
}

// ── API Slice ─────────────────────────────────────────────────────────────────

export interface PublicBannerSlide {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  badgeText: string | null;
  ctaText: string | null;
  bgColor: string | null;
  textColor: string | null;
  orderIndex: number;
  isActive: boolean;
}

export interface PublicLearningLevel {
  id: string;
  name: string;
  description: string | null;
  orderIndex: number;
  isActive: boolean;
}

export const coursesApi = createApi({
  reducerPath: "coursesApi",
  baseQuery: withReauth(`${API_BASE}/api/v1/courses`),
  tagTypes: ["Course", "Session", "Progress"],
  endpoints: (builder) => ({
    getPublicCourses: builder.query<
      PublicCoursesResult,
      { page?: number; pageSize?: number; level?: number; search?: string }
    >({
      query: ({ page = 1, pageSize = 12, level, search } = {}) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));
        if (level) params.set("level", String(level));
        if (search) params.set("search", search);
        return `?${params}`;
      },
      providesTags: ["Course"],
    }),

    getPublicCourse: builder.query<PublicCourseDetail, string>({
      query: (id) => `/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Course", id }],
    }),

    enrollCourse: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/${id}/enroll`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Course", id }, "Course"],
    }),

    getSession: builder.query<SessionLearningView, string>({
      query: (id) => `/sessions/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Session", id }],
    }),

    startSession: builder.mutation<void, string>({
      query: (id) => ({ url: `/sessions/${id}/start`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Session", id }],
    }),

    completeSession: builder.mutation<void, { id: string }>({  
      query: ({ id }) => ({
        url: `/sessions/${id}/complete`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Session", id }, "Progress"],
    }),

    getActiveBanners: builder.query<PublicBannerSlide[], void>({
      query: () => `${API_BASE}/api/v1/admin/system/banners/public`,
    }),

    getPublicLearningLevels: builder.query<PublicLearningLevel[], void>({
      query: () => `${API_BASE}/api/v1/courses/learning-levels`,
    }),
  }),
});

export const {
  useGetPublicCoursesQuery,
  useGetPublicCourseQuery,
  useEnrollCourseMutation,
  useGetSessionQuery,
  useStartSessionMutation,
  useCompleteSessionMutation,
  useGetActiveBannersQuery,
  useGetPublicLearningLevelsQuery,
} = coursesApi;
