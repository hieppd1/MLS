import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SessionVideoDto {
  id: string;
  status: string;
  hlsPath: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number;
}

export interface SegmentProgressDto {
  isViewed: boolean;
  isCompleted: boolean;
}

export interface SegmentAssetDto {
  id: string;
  type: string;
  title: string;
  description: string | null;
  startTime: number;
  endTime: number | null;
  orderIndex: number;
  metadata: string; // JSON string from backend
  isPublic: boolean;
}

export interface SegmentLearningDto {
  id: string;
  title: string;
  description: string | null;
  startTime: number;
  endTime: number;
  duration: number;
  orderIndex: number;
  progress: SegmentProgressDto | null;
  assets: SegmentAssetDto[];
}

export interface SessionProgressSummaryDto {
  status: string;
  lastPositionSeconds: number;
  watchPercentage: number;
}

export interface SessionLearningDto {
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
  videoAsset: SessionVideoDto | null;
  segments: SegmentLearningDto[];
  progress: SessionProgressSummaryDto | null;
}

export interface LearningStreakDto {
  currentStreak: number;
  longestStreak: number;
  totalDaysLearned: number;
  lastLearningDate: string | null;
  learnedToday: boolean;
  activityDates: string[]; // ISO yyyy-MM-dd strings, last 16 weeks
}

export interface QuizAnswerFeedback {
  questionIndex: number;
  correct: boolean;
  correctAnswer: number;
  explanation: string | null;
}

export interface QuizSubmitResult {
  passed: boolean;
  score: number;
  passScore: number;
  feedback: QuizAnswerFeedback[];
}

// ── API Slice ─────────────────────────────────────────────────────────────────

export const learningApi = createApi({
  reducerPath: "learningApi",
  baseQuery: withReauth(`${API_BASE}/api/v1`),
  tagTypes: ["Session", "SessionProgress"],
  endpoints: (builder) => ({
    // ── Session ──────────────────────────────────────────────────────────────
    getSession: builder.query<SessionLearningDto, string>({
      query: (id) => `/sessions/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Session", id }],
    }),

    startSession: builder.mutation<void, string>({
      query: (id) => ({ url: `/sessions/${id}/start`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Session", id }],
    }),

    saveSessionVideoPosition: builder.mutation<
      void,
      { id: string; lastPositionSeconds: number; watchedSeconds: number; watchPercentage: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/sessions/${id}/video-position`,
        method: "POST",
        body,
      }),
    }),

    completeSession: builder.mutation<void, string>({
      query: (id) => ({ url: `/sessions/${id}/complete`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Session", id }],
    }),

    // ── Segments ─────────────────────────────────────────────────────────────
    markSegmentViewed: builder.mutation<void, string>({
      query: (id) => ({ url: `/segments/${id}/view`, method: "POST" }),
    }),

    completeSegment: builder.mutation<void, string>({
      query: (id) => ({ url: `/segments/${id}/complete`, method: "POST" }),
    }),

    // ── Assets ───────────────────────────────────────────────────────────────
    recordAssetInteraction: builder.mutation<
      void,
      { id: string; interactionType: string; score?: number }
    >({
      query: ({ id, interactionType, score }) => ({
        url: `/assets/${id}/interact`,
        method: "POST",
        body: { interactionType, score: score ?? null },
      }),
    }),

    submitQuiz: builder.mutation<
      QuizSubmitResult,
      { id: string; answers: number[] }
    >({
      query: ({ id, answers }) => ({
        url: `/assets/${id}/quiz/submit`,
        method: "POST",
        body: { answers },
      }),
    }),
    // ── Streak ───────────────────────────────────────────────────────────────
    getLearningStreak: builder.query<LearningStreakDto, void>({
      query: () => `/users/streak`,
      providesTags: ["SessionProgress"],
    }),
  }),
});

export const {
  useGetSessionQuery,
  useStartSessionMutation,
  useSaveSessionVideoPositionMutation,
  useCompleteSessionMutation,
  useMarkSegmentViewedMutation,
  useCompleteSegmentMutation,
  useRecordAssetInteractionMutation,
  useSubmitQuizMutation,
  useGetLearningStreakQuery,
} = learningApi;
