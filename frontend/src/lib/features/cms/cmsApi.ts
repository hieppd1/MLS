import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CourseListItem {
  id: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  level: number;
  thumbnailUrl: string | null;
  slug: string | null;
  status: "Draft" | "PendingReview" | "Published" | "Hidden" | "Archived";
  visibility: string;
  isFree: boolean;
  certificateEnabled: boolean;
  moduleCount: number;
  enrollmentCount: number;
  createdAt: string;
  price: number;
  discountPrice: number | null;
}

export interface CourseDetail {
  id: string;
  title: string;
  code: string | null;
  slug: string | null;
  description: string | null;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  bannerUrl: string | null;
  level: number;
  language: string | null;
  tags: string | null;
  duration: number | null;
  outcomes: string | null;
  requirements: string | null;
  targetAudience: string | null;
  status: string;
  visibility: string;
  isFree: boolean;
  certificateEnabled: boolean;
  completionRequired: boolean;
  startDate: string | null;
  endDate: string | null;
  teacherId: string | null;
  createdBy: string;
  publishedAt: string | null;
  createdAt: string;
  levels: CourseLevel[];
  modules: ModuleSummary[];
  price: number;
  discountPrice: number | null;
  discountEndsAt: string | null;
}

export interface ModuleSummary {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  sessionCount: number;
  levelId: string | null;
}

export interface CourseLevel {
  id: string;
  courseId: string;
  name: string;
  description: string | null;
  orderIndex: number;
  isPublished: boolean;
  moduleCount: number;
  createdAt: string;
}

export interface LearningLevel {
  id: string;
  name: string;
  description: string | null;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
}

export interface LevelDetail {
  id: string;
  courseId: string;
  name: string;
  description: string | null;
  orderIndex: number;
  isPublished: boolean;
  createdAt: string;
  modules: ModuleSummary[];
}

export interface ModuleDetail {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  estimatedDuration: number;
  orderIndex: number;
  isLocked: boolean;
  createdAt: string;
  sessions: SessionSummaryInModule[];
}

export interface SessionSummaryInModule {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  isFreeTrial: boolean;
  sessionType: string;
  publishStatus: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  durationMinutes: number;
  videoStatus: string | null;
}

export interface PagedCoursesResult {
  items: CourseListItem[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Session / Segment / LearningAsset types ──────────────────────────────────

export interface SessionListItem {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  isFreeTrial: boolean;
  publishStatus: string;
  sessionType: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  segmentCount: number;
  videoStatus: string | null;
}

export interface SegmentAsset {
  id: string;
  type: string;
  title: string;
  description: string | null;
  startTime: number;
  endTime: number | null;
  orderIndex: number;
  metadata: string;
  isPublic: boolean;
}

export interface SegmentDetail {
  id: string;
  title: string;
  description: string | null;
  startTime: number;
  endTime: number;
  duration: number;
  orderIndex: number;
  assets: SegmentAsset[];
}

export interface SessionVideoAsset {
  id: string;
  status: string;
  hlsPath: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number;
}

export interface SessionDetail {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  orderIndex: number;
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
  videoAsset: SessionVideoAsset | null;
  segments: SegmentDetail[];
}

// ── API Slice ─────────────────────────────────────────────────────────────────

export const cmsApi = createApi({
  reducerPath: "cmsApi",
  baseQuery: withReauth(`${API_BASE}/api/v1/admin/cms`),
  tagTypes: ["Course", "Level", "LearningLevel", "Module", "BannerSlide", "Session", "Segment"],
  endpoints: (builder) => ({
    // Courses
    getCourses: builder.query<
      PagedCoursesResult,
      { page?: number; pageSize?: number; search?: string; level?: number; status?: string }
    >({
      query: ({ page = 1, pageSize = 20, search, level, status } = {}) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));
        if (search) params.set("search", search);
        if (level) params.set("level", String(level));
        if (status) params.set("status", status);
        return `courses?${params}`;
      },
      providesTags: ["Course"],
    }),
    getCourse: builder.query<CourseDetail, string>({
      query: (id) => `courses/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Course", id }],
    }),
    createCourse: builder.mutation<
      { id: string },
      { title: string; description?: string; shortDescription?: string; level: number; teacherId?: string;
        price?: number; discountPrice?: number; discountEndsAt?: string;
        isFree?: boolean; certificateEnabled?: boolean; visibility?: string;
        code?: string; language?: string; thumbnailUrl?: string; bannerUrl?: string;
        tags?: string; duration?: number; startDate?: string; endDate?: string; completionRequired?: boolean;
        outcomes?: string; requirements?: string; targetAudience?: string }>
    ({
      query: (body) => ({ url: "courses", method: "POST", body }),
      invalidatesTags: ["Course"],
    }),
    updateCourse: builder.mutation<
      void,
      { id: string; title: string; description?: string; shortDescription?: string; level: number; teacherId?: string;
        price?: number; discountPrice?: number; discountEndsAt?: string;
        isFree?: boolean; certificateEnabled?: boolean; visibility?: string;
        code?: string; language?: string; thumbnailUrl?: string; bannerUrl?: string;
        tags?: string; duration?: number; startDate?: string; endDate?: string; completionRequired?: boolean;
        outcomes?: string; requirements?: string; targetAudience?: string }>
    ({
      query: ({ id, ...body }) => ({ url: `courses/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Course", id }, "Course"],
    }),
    deleteCourse: builder.mutation<void, string>({
      query: (id) => ({ url: `courses/${id}`, method: "DELETE" }),
      invalidatesTags: ["Course"],
    }),

    // III-5: Course translation upsert
    upsertCourseTranslation: builder.mutation<void, {
      id: string; locale: string;
      title?: string; shortDescription?: string; description?: string;
      outcomes?: string; requirements?: string; targetAudience?: string;
    }>({
      query: ({ id, locale, ...body }) => ({
        url: `courses/${id}/translations/${locale}`, method: "PUT", body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Course", id }],
    }),

    publishCourse: builder.mutation<void, { id: string; approve: boolean }>({
      query: ({ id, approve }) => ({ url: `courses/${id}/publish?approve=${approve}`, method: "PUT" }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Course", id }, "Course"],
    }),

    // Modules
    getModule: builder.query<ModuleDetail, string>({
      query: (id) => `modules/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Module", id }],
    }),
    createModule: builder.mutation<{ id: string }, { courseId: string; title: string; description?: string; levelId?: string; thumbnailUrl?: string; estimatedDuration?: number }>({
      query: ({ courseId, ...body }) => ({ url: `courses/${courseId}/modules`, method: "POST", body }),
      invalidatesTags: (_r, _e, { courseId }) => [{ type: "Course", id: courseId }],
    }),
    updateModule: builder.mutation<void, { id: string; title: string; description?: string; orderIndex: number; isLocked?: boolean; levelId?: string; thumbnailUrl?: string; estimatedDuration?: number }>({
      query: ({ id, ...body }) => ({ url: `modules/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Module", id }],
    }),
    deleteModule: builder.mutation<void, { id: string; courseId: string }>({
      query: ({ id }) => ({ url: `modules/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { courseId }) => [{ type: "Course", id: courseId }],
    }),

    // Levels
    getCourseLevels: builder.query<CourseLevel[], string>({
      query: (courseId) => `courses/${courseId}/levels`,
      providesTags: (_r, _e, courseId) => [{ type: "Level", id: courseId }],
    }),
    getLevel: builder.query<LevelDetail, string>({
      query: (id) => `levels/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Level", id }],
    }),
    createLevel: builder.mutation<{ id: string }, { courseId: string; name: string; description?: string }>({
      query: ({ courseId, ...body }) => ({ url: `courses/${courseId}/levels`, method: "POST", body }),
      invalidatesTags: (_r, _e, { courseId }) => [{ type: "Course", id: courseId }, { type: "Level", id: courseId }],
    }),
    updateLevel: builder.mutation<void, { id: string; courseId: string; name: string; description?: string; orderIndex: number }>({
      query: ({ id, courseId: _courseId, ...body }) => ({ url: `levels/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id, courseId }) => [{ type: "Level", id }, { type: "Level", id: courseId }, { type: "Course", id: courseId }],
    }),
    publishLevel: builder.mutation<void, { id: string; courseId: string; publish: boolean }>({
      query: ({ id, publish }) => ({ url: `levels/${id}/publish?publish=${publish}`, method: "PUT" }),
      invalidatesTags: (_r, _e, { id, courseId }) => [{ type: "Level", id }, { type: "Course", id: courseId }],
    }),
    deleteLevel: builder.mutation<void, { id: string; courseId: string }>({
      query: ({ id }) => ({ url: `levels/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { courseId }) => [{ type: "Course", id: courseId }, { type: "Level", id: courseId }],
    }),

    // Learning Levels (global config)
    getLearningLevels: builder.query<LearningLevel[], { includeInactive?: boolean } | void>({
      query: (params) => `learning-levels${params?.includeInactive ? "?includeInactive=true" : ""}`,
      providesTags: ["LearningLevel"],
    }),
    createLearningLevel: builder.mutation<{ id: string }, { name: string; description?: string; orderIndex?: number }>({
      query: (body) => ({ url: "learning-levels", method: "POST", body }),
      invalidatesTags: ["LearningLevel"],
    }),
    updateLearningLevel: builder.mutation<void, { id: string; name: string; description?: string; orderIndex: number }>({
      query: ({ id, ...body }) => ({ url: `learning-levels/${id}`, method: "PUT", body }),
      invalidatesTags: ["LearningLevel"],
    }),
    setLearningLevelActive: builder.mutation<void, { id: string; active: boolean }>({
      query: ({ id, active }) => ({ url: `learning-levels/${id}/active?active=${active}`, method: "PUT" }),
      invalidatesTags: ["LearningLevel"],
    }),
    deleteLearningLevel: builder.mutation<void, string>({
      query: (id) => ({ url: `learning-levels/${id}`, method: "DELETE" }),
      invalidatesTags: ["LearningLevel"],
    }),

    // Content approval workflow
    submitForReview: builder.mutation<void, string>({
      query: (id) => ({ url: `courses/${id}/submit`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Course", id }, "Course"],
    }),
    getApprovals: builder.query<ApprovalQueueItem[], void>({
      query: () => "content/approvals",
      providesTags: ["Course"],
    }),
    cloneCourse: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `courses/${id}/clone`, method: "POST" }),
      invalidatesTags: ["Course"],
    }),
    hideCourse: builder.mutation<void, string>({
      query: (id) => ({ url: `courses/${id}/hide`, method: "PUT" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Course", id }, "Course"],
    }),
    archiveCourse: builder.mutation<void, string>({
      query: (id) => ({ url: `courses/${id}/archive`, method: "PUT" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Course", id }, "Course"],
    }),

    // ── Banner Slides ──────────────────────────────────────────────────────
    getBannerSlides: builder.query<BannerSlideDto[], void>({
      query: () => `${API_BASE}/api/v1/admin/system/banners`,
      providesTags: ["BannerSlide"],
    }),
    createBannerSlide: builder.mutation<{ id: string }, BannerSlideRequest>({
      query: (body) => ({ url: `${API_BASE}/api/v1/admin/system/banners`, method: "POST", body }),
      invalidatesTags: ["BannerSlide"],
    }),
    updateBannerSlide: builder.mutation<void, { id: string } & BannerSlideRequest>({
      query: ({ id, ...body }) => ({ url: `${API_BASE}/api/v1/admin/system/banners/${id}`, method: "PUT", body }),
      invalidatesTags: ["BannerSlide"],
    }),
    deleteBannerSlide: builder.mutation<void, string>({
      query: (id) => ({ url: `${API_BASE}/api/v1/admin/system/banners/${id}`, method: "DELETE" }),
      invalidatesTags: ["BannerSlide"],
    }),

    // ── Sessions ───────────────────────────────────────────────────────────
    getSessionsByModule: builder.query<SessionListItem[], string>({
      query: (moduleId) => `modules/${moduleId}/sessions`,
      providesTags: (_r, _e, moduleId) => [{ type: "Session", id: moduleId }],
    }),
    getSession: builder.query<SessionDetail, string>({
      query: (id) => `sessions/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Session", id }],
    }),
    createSession: builder.mutation<{ id: string }, { moduleId: string; title: string; description?: string; isFreeTrial?: boolean; thumbnailUrl?: string; sessionType?: string; content?: string; audioUrl?: string; documentUrl?: string; transcript?: string; passScore?: number; durationMinutes?: number }>({
      query: ({ moduleId, ...body }) => ({ url: `modules/${moduleId}/sessions`, method: "POST", body }),
      invalidatesTags: (_r, _e, { moduleId }) => [{ type: "Session", id: moduleId }, { type: "Module", id: moduleId }],
    }),
    updateSession: builder.mutation<void, { id: string; title: string; description?: string; isFreeTrial: boolean; thumbnailUrl?: string; sessionType?: string; content?: string; audioUrl?: string; documentUrl?: string; transcript?: string; passScore?: number; durationMinutes?: number }>({
      query: ({ id, ...body }) => ({ url: `sessions/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Session", id }],
    }),
    deleteSession: builder.mutation<void, { id: string; moduleId: string }>({
      query: ({ id }) => ({ url: `sessions/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { moduleId }) => [{ type: "Session", id: moduleId }, { type: "Module", id: moduleId }],
    }),
    publishSession: builder.mutation<void, { id: string; publish: boolean }>({
      query: ({ id, publish }) => ({ url: `sessions/${id}/${publish ? "publish" : "unpublish"}`, method: "POST" }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Session", id }],
    }),
    reorderSessions: builder.mutation<void, { moduleId: string; orderedIds: string[] }>({
      query: ({ moduleId, orderedIds }) => ({ url: `modules/${moduleId}/sessions/reorder`, method: "PUT", body: { orderedIds } }),
      invalidatesTags: (_r, _e, { moduleId }) => [{ type: "Session", id: moduleId }],
    }),

    // ── Segments ───────────────────────────────────────────────────────────
    createSegment: builder.mutation<{ id: string }, { sessionId: string; title: string; description?: string; startTime: number; endTime: number }>({
      query: ({ sessionId, ...body }) => ({ url: `sessions/${sessionId}/segments`, method: "POST", body }),
      invalidatesTags: (_r, _e, { sessionId }) => [{ type: "Session", id: sessionId }],
    }),
    updateSegment: builder.mutation<void, { id: string; sessionId: string; title: string; description?: string; startTime: number; endTime: number }>({
      query: ({ id, sessionId: _sid, ...body }) => ({ url: `segments/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { sessionId }) => [{ type: "Session", id: sessionId }],
    }),
    deleteSegment: builder.mutation<void, { id: string; sessionId: string }>({
      query: ({ id }) => ({ url: `segments/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { sessionId }) => [{ type: "Session", id: sessionId }],
    }),
    reorderSegments: builder.mutation<void, { sessionId: string; orderedIds: string[] }>({
      query: ({ sessionId, orderedIds }) => ({ url: `sessions/${sessionId}/segments/reorder`, method: "PUT", body: { orderedIds } }),
      invalidatesTags: (_r, _e, { sessionId }) => [{ type: "Session", id: sessionId }],
    }),

    // ── LearningAssets ─────────────────────────────────────────────────────
    createAsset: builder.mutation<{ id: string }, { segmentId: string; sessionId: string; type: string; title: string; description?: string; startTime: number; endTime?: number; metadata?: string; isPublic?: boolean }>({
      query: ({ segmentId, sessionId: _sid, ...body }) => ({ url: `segments/${segmentId}/assets`, method: "POST", body }),
      invalidatesTags: (_r, _e, { sessionId }) => [{ type: "Session", id: sessionId }],
    }),
    updateAsset: builder.mutation<void, { id: string; sessionId: string; title: string; description?: string; startTime: number; endTime?: number | null; metadata: string; isPublic: boolean }>({
      query: ({ id, sessionId: _sid, ...body }) => ({ url: `assets/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { sessionId }) => [{ type: "Session", id: sessionId }],
    }),
    deleteAsset: builder.mutation<void, { id: string; sessionId: string }>({
      query: ({ id }) => ({ url: `assets/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { sessionId }) => [{ type: "Session", id: sessionId }],
    }),
    reorderAssets: builder.mutation<void, { segmentId: string; sessionId: string; orderedIds: string[] }>({
      query: ({ segmentId, orderedIds }) => ({ url: `segments/${segmentId}/assets/reorder`, method: "PUT", body: { orderedIds } }),
      invalidatesTags: (_r, _e, { sessionId }) => [{ type: "Session", id: sessionId }],
    }),
  }),
});

export interface ApprovalQueueItem {
  courseId: string;
  title: string;
  level: number;
  thumbnailUrl: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface BannerSlideDto {
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

export interface BannerSlideRequest {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  badgeText?: string | null;
  ctaText?: string | null;
  bgColor?: string | null;
  textColor?: string | null;
  orderIndex?: number;
  isActive?: boolean;
}

export const {
  useGetCoursesQuery,
  useGetCourseQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useUpsertCourseTranslationMutation,
  usePublishCourseMutation,
  useSubmitForReviewMutation,
  useGetApprovalsQuery,
  useCloneCourseMutation,
  useHideCourseMutation,
  useArchiveCourseMutation,
  useGetCourseLevelsQuery,
  useGetLevelQuery,
  useCreateLevelMutation,
  useUpdateLevelMutation,
  usePublishLevelMutation,
  useDeleteLevelMutation,
  useGetLearningLevelsQuery,
  useCreateLearningLevelMutation,
  useUpdateLearningLevelMutation,
  useSetLearningLevelActiveMutation,
  useDeleteLearningLevelMutation,
  useGetModuleQuery,
  useCreateModuleMutation,
  useUpdateModuleMutation,
  useDeleteModuleMutation,
  useGetBannerSlidesQuery,
  useCreateBannerSlideMutation,
  useUpdateBannerSlideMutation,
  useDeleteBannerSlideMutation,
  // Sessions
  useGetSessionsByModuleQuery,
  useGetSessionQuery,
  useCreateSessionMutation,
  useUpdateSessionMutation,
  useDeleteSessionMutation,
  usePublishSessionMutation,
  useReorderSessionsMutation,
  // Segments
  useCreateSegmentMutation,
  useUpdateSegmentMutation,
  useDeleteSegmentMutation,
  useReorderSegmentsMutation,
  // Assets
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
  useReorderAssetsMutation,
} = cmsApi;
