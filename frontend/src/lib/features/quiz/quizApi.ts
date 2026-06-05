import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QuizOptionDto {
  id: string;
  content: string;
  isCorrect: boolean;
  displayOrder: number;
  matchKey: string | null;
  matchValue: string | null;
}

export interface QuizQuestionDto {
  linkId: string;
  questionId: string;
  content: string;
  type: string;
  skillType: string;
  difficulty: string;
  displayOrder: number;
  score: number;
  audioUrl: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  options: QuizOptionDto[];
  speakingTimeLimitSec?: number | null;
  referenceText?: string | null;
  examModeTag?: string | null;
}

export interface QuizDetailDto {
  id: string;
  title: string;
  description: string | null;
  quizType: string;
  skillType: string | null;
  status: string;
  examMode: string;
  timeLimitSeconds: number | null;
  passingScore: number;
  shuffleQuestions: boolean;
  showCorrectAnswer: boolean;
  questions: QuizQuestionDto[];
}

// Attempt types

export interface AttemptOptionDto {
  id: string;
  content: string;
  displayOrder: number;
  matchKey?: string | null;
  matchValue?: string | null;
}

export interface AttemptQuestionDto {
  linkId: string;
  questionId: string;
  content: string;
  type: string;
  skillType: string;
  difficulty: string;
  displayOrder: number;
  score: number;
  audioUrl: string | null;
  imageUrl: string | null;
  options: AttemptOptionDto[];
  speakingTimeLimitSec?: number | null;
  referenceText?: string | null;
  examModeTag?: string | null;
}

export interface StartAttemptResult {
  attemptId: string;
  questions: AttemptQuestionDto[];
  isAdaptive?: boolean;
  maxQuestions?: number;
}

export interface SaveAnswerResult {
  success: boolean;
  isCorrect?: boolean | null;
  nextQuestion?: AttemptQuestionDto | null;
  currentDifficulty?: string | null;
  answeredCount?: number;
  isComplete?: boolean;
}

export interface SubmitAttemptResult {
  score: number;
  percentage: number;
  passed: boolean;
  hasManualGrading: boolean;
}

export interface PlacementResultDto {
  id: string;
  level: number;
  skillBreakdown: Record<string, number>;
  recommendedPath: string;
}

export interface MyPlacementResultDto {
  id: string;
  assignedLevel: number;
  testedAt: string;
  skillBreakdown: Record<string, number>;
  recommendedPath: string;
}

export interface TestQuotaDto {
  isLimited: boolean;
  isMonthly: boolean;
  quota: number;
  remaining: number;
}

// ── Quiz management types ─────────────────────────────────────────────────────

export interface QuizListItem {
  id: string;
  title: string;
  description: string | null;
  quizType: string;
  skillType: string | null;
  status: string;
  examMode: string;
  passingScore: number;
  questionCount: number;
  timeLimitSeconds: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuizListResult {
  items: QuizListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateQuizRequest {
  title: string;
  description?: string;
  quizType: string;
  skillType?: string;
  examMode?: string;
  timeLimitSeconds?: number;
  passingScore: number;
  shuffleQuestions?: boolean;
  showCorrectAnswer?: boolean;
}

export interface UpdateQuizRequest {
  title?: string;
  description?: string;
  timeLimitSeconds?: number;
  passingScore?: number;
  shuffleQuestions?: boolean;
  showCorrectAnswer?: boolean;
}

export interface AttemptQuestionReviewDto {
  questionId: string;
  content: string;
  type: string;
  yourAnswer: string | null;
  correctAnswer: string | null;
  isCorrect: boolean;
  score: number;
  earned: number;
  explanation: string | null;
}

export interface AttemptResultDto {
  attemptId: string;
  score: number;
  percentage: number;
  passed: boolean;
  timeTaken: number;
  answeredCount: number;
  correctCount: number;
  hasManualGrading: boolean;
  questions: AttemptQuestionReviewDto[];
}

export interface MyAttemptItem {
  id: string;
  score: number;
  percentage: number;
  passed: boolean;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  timeTaken: number;
}

export interface VideoQuizInfoDto {
  id: string;
  title: string;
  videoTriggerSecond: number;
}

export interface LeaderboardEntryDto {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  done: number;
  total: number;
  pct: number;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const quizApi = createApi({
  reducerPath: "quizApi",
  baseQuery: withReauth(API_BASE),
  tagTypes: ["PlacementResult", "Quiz", "QuizAttempt"],
  endpoints: (builder) => ({
    // Public — no auth needed
    getPlacementQuiz: builder.query<QuizDetailDto, void>({
      query: () => "/api/v1/placement/quiz",
    }),

    getMyPlacementResult: builder.query<MyPlacementResultDto, void>({
      query: () => "/api/v1/placement/my-result",
      providesTags: ["PlacementResult"],
    }),

    // Auth required
    startPlacementAttempt: builder.mutation<StartAttemptResult, { quizId: string }>({
      query: (body) => ({
        url: "/api/v1/placement/start",
        method: "POST",
        body,
      }),
    }),

    saveAnswer: builder.mutation<SaveAnswerResult, {
      attemptId: string;
      questionId: string;
      answerValue?: string;
      audioUrl?: string;
      essayText?: string;
      isSkipped: boolean;
    }>({
      query: ({ attemptId, ...body }) => ({
        url: `/api/v1/attempts/${attemptId}/answer`,
        method: "PUT",
        body,
      }),
    }),

    submitAttempt: builder.mutation<SubmitAttemptResult, { attemptId: string; timeTaken: number }>({
      query: ({ attemptId, timeTaken }) => ({
        url: `/api/v1/attempts/${attemptId}/submit`,
        method: "POST",
        body: { timeTaken },
      }),
    }),

    savePlacementResult: builder.mutation<PlacementResultDto, { attemptId: string }>({
      query: (body) => ({
        url: "/api/v1/placement/result",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PlacementResult"],
    }),

    // ── Quiz management (teacher/admin) ──────────────────────────────────────

    listQuizzes: builder.query<QuizListResult, { page?: number; pageSize?: number; search?: string; status?: string; quizType?: string; examMode?: string }>({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.page) sp.set("page", String(params.page));
        if (params.pageSize) sp.set("pageSize", String(params.pageSize));
        if (params.search) sp.set("search", params.search);
        if (params.status) sp.set("status", params.status);
        if (params.quizType) sp.set("quizType", params.quizType);
        if (params.examMode) sp.set("examMode", params.examMode);
        return `/api/v1/quizzes?${sp.toString()}`;
      },
      providesTags: ["Quiz"],
    }),

    getQuiz: builder.query<QuizDetailDto, string>({
      query: (id) => `/api/v1/quizzes/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Quiz", id }],
    }),

    createQuiz: builder.mutation<QuizDetailDto, CreateQuizRequest>({
      query: (body) => ({ url: "/api/v1/quizzes", method: "POST", body }),
      invalidatesTags: ["Quiz"],
    }),

    updateQuiz: builder.mutation<QuizDetailDto, { id: string } & UpdateQuizRequest>({
      query: ({ id, ...body }) => ({ url: `/api/v1/quizzes/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Quiz", id }, "Quiz"],
    }),

    deleteQuiz: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/v1/quizzes/${id}`, method: "DELETE" }),
      invalidatesTags: ["Quiz"],
    }),

    publishQuiz: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/v1/quizzes/${id}/publish`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Quiz", id }, "Quiz"],
    }),

    archiveQuiz: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/v1/quizzes/${id}/archive`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Quiz", id }, "Quiz"],
    }),

    getQuizPreview: builder.query<QuizDetailDto, string>({
      query: (id) => `/api/v1/quizzes/${id}/preview`,
    }),

    // ── Attempt (generic quiz) ────────────────────────────────────────────────

    startQuizAttempt: builder.mutation<StartAttemptResult, { quizId: string }>({
      query: ({ quizId }) => ({
        url: `/api/v1/quizzes/${quizId}/start`,
        method: "POST",
        body: {},
      }),
      invalidatesTags: ["QuizAttempt"],
    }),

    abandonAttempt: builder.mutation<void, string>({
      query: (attemptId) => ({ url: `/api/v1/attempts/${attemptId}/abandon`, method: "POST" }),
    }),

    getAttemptResult: builder.query<AttemptResultDto, string>({
      query: (attemptId) => `/api/v1/attempts/${attemptId}/result`,
      providesTags: (_r, _e, id) => [{ type: "QuizAttempt", id }],
    }),

    getMyAttempts: builder.query<MyAttemptItem[], string>({
      query: (quizId) => `/api/v1/quizzes/${quizId}/my-attempts`,
      providesTags: (_r, _e, id) => [{ type: "QuizAttempt", id: `quiz-${id}` }],
    }),

    getSessionVideoQuiz: builder.query<VideoQuizInfoDto, string>({
      query: (sessionId) => `/api/v1/sessions/${sessionId}/video-quiz`,
    }),

    getTestQuota: builder.query<TestQuotaDto, string>({
      query: (quizId) => `/api/v1/quizzes/${quizId}/quota`,
    }),

    getQuizLeaderboard: builder.query<LeaderboardEntryDto[], { period: "week" | "month" | "year"; limit?: number }>({
      query: ({ period, limit = 10 }) => `/api/v1/quizzes/leaderboard?period=${period}&limit=${limit}`,
    }),
  }),
});

export const {
  useGetPlacementQuizQuery,
  useGetMyPlacementResultQuery,
  useStartPlacementAttemptMutation,
  useSaveAnswerMutation,
  useSubmitAttemptMutation,
  useSavePlacementResultMutation,
  useListQuizzesQuery,
  useGetQuizQuery,
  useCreateQuizMutation,
  useUpdateQuizMutation,
  useDeleteQuizMutation,
  usePublishQuizMutation,
  useArchiveQuizMutation,
  useGetQuizPreviewQuery,
  useStartQuizAttemptMutation,
  useAbandonAttemptMutation,
  useGetAttemptResultQuery,
  useGetMyAttemptsQuery,
  useGetSessionVideoQuizQuery,
  useGetQuizLeaderboardQuery,
  useGetTestQuotaQuery,
} = quizApi;
