import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface OPICTopicSurveyDto {
  id: string;
  language: string;
  selectedTopics: string[];
  targetLevel: string | null;
  chosenDifficulty: number;
  createdAt: string;
}

export interface OPICSessionDto {
  id: string;
  language: string;
  sessionState: "Orientation" | "Session1" | "MidAdjust" | "Session2" | "Completed";
  chosenDifficulty: number;
  midAdjustChoice: string | null;
  finalDifficulty: number | null;
  opicLevelResult: string | null;
  overallScore: number | null;
  isCompleted: boolean;
  startedAt: string;
  questionsDone: number;
  quizId: string | null;
}

export interface OPICComboGroupDto {
  id: string;
  comboIndex: number;
  topicCategory: string;
  topicType: string;
  questionIds: string[];
}

export interface OPICAttemptRefDto {
  attemptId: string;
  questionIndex: number;
}

export interface OPICSessionDetailDto extends OPICSessionDto {
  completedAt: string | null;
  combos: OPICComboGroupDto[];
  attemptRefs: OPICAttemptRefDto[];
  quizId: string | null;
}

export interface OPICLevelResultDto {
  id: string;
  assignedLevel: OPICLevel;
  overallScore: number;
  pronunciationScore: number;
  fluencyScore: number;
  coherenceScore: number;
  vocabularyScore: number;
  taskAchievementScore: number;
  strongestSkill: string | null;
  weakestSkill: string | null;
  improvementAdvice: string | null;
  testedAt: string;
}

export interface OPICScriptTemplateDto {
  id: string;
  topicCategory: string;
  comboType: string;
  targetLevel: string | null;
  language: string;
  openingTemplate: string;
  bodyTemplate: string;
  closingTemplate: string;
  isPublished: boolean;
}

export interface CreateScriptRequest {
  topicCategory: string;
  comboType: string;
  targetLevel?: string;
  language: string;
  openingTemplate: string;
  bodyTemplate: string;
  closingTemplate: string;
  vocabList?: string;
  usefulPhrases?: string;
}

export interface OPICTopicsDto {
  surveyTopics: string[];
  commonTopics: string[];
}

export interface OPICDemoQuestionDto {
  questionId: string;
  questionIndex: number;  // 1–15
  comboIndex: number;     // 1–5
  topicHint: string;      // e.g. "Tự giới thiệu"
  content: string;
  type: string;           // "SpeakingRecording" | "OPICRolePlay" | ...
  audioUrl: string | null;
  timeLimitSec: number;
  playLimit: number;
}

export interface OPICQuizSummaryDto {
  id: string;
  title: string;
  language: string;
  questionCount: number;
  difficultyLevel: number | null;
}

// ── Level type ─────────────────────────────────────────────────────────────────

export type OPICLevel = "NH" | "IL" | "IM1" | "IM2" | "IM3" | "IH" | "AL";

export const OPIC_LEVEL_LABELS: Record<OPICLevel, string> = {
  NH:  "Novice High",
  IL:  "Intermediate Low",
  IM1: "Intermediate Mid 1",
  IM2: "Intermediate Mid 2",
  IM3: "Intermediate Mid 3",
  IH:  "Intermediate High",
  AL:  "Advanced Low",
};

export const OPIC_LEVEL_ORDER: OPICLevel[] = ["NH", "IL", "IM1", "IM2", "IM3", "IH", "AL"];

export const OPIC_SKILL_LABELS: Record<string, string> = {
  pronunciation:   "Phát âm",
  fluency:         "Lưu loát",
  coherence:       "Mạch lạc",
  vocabulary:      "Từ vựng",
  taskAchievement: "Hoàn thành nhiệm vụ",
};

// ── Request types ──────────────────────────────────────────────────────────────

export interface SaveSurveyRequest {
  selectedTopics: string[];
  targetLevel?: string;
  chosenDifficulty: number;
  language?: string;
}

export interface CreateSessionRequest {
  surveyId?: string;
  chosenDifficulty: number;
  language?: string;
  quizId?: string;
}

export interface MidAdjustRequest {
  choice: "easier" | "same" | "harder";
}

export interface RecordAttemptRefRequest {
  attemptId: string;
  questionIndex: number;
}

// ── API ────────────────────────────────────────────────────────────────────────

export const opicApi = createApi({
  reducerPath: "opicApi",
  baseQuery: withReauth(`${API_BASE}/api/v1/opic`),
  tagTypes: ["Survey", "Session", "Result", "Scripts"],
  endpoints: (builder) => ({
    // Survey
    saveSurvey: builder.mutation<OPICTopicSurveyDto, SaveSurveyRequest>({
      query: (body) => ({ url: "/survey", method: "POST", body }),
      invalidatesTags: ["Survey"],
    }),
    getMySurvey: builder.query<OPICTopicSurveyDto | null, string | void>({
      query: (language = "vi") => `/survey/my?language=${language}`,
      providesTags: ["Survey"],
    }),
    getTopics: builder.query<OPICTopicsDto, void>({
      query: () => "/topics",
    }),

    // Session
    createSession: builder.mutation<OPICSessionDto, CreateSessionRequest>({
      query: (body) => ({ url: "/sessions", method: "POST", body }),
      invalidatesTags: ["Session"],
    }),
    getSession: builder.query<OPICSessionDetailDto, string>({
      query: (id) => `/sessions/${id}`,
      providesTags: (_result, _err, id) => [{ type: "Session", id }],
    }),
    getMyHistory: builder.query<OPICSessionDto[], { page?: number; pageSize?: number } | void>({
      query: (params) => `/sessions/my-history?page=${params?.page ?? 1}&pageSize=${params?.pageSize ?? 10}`,
      providesTags: ["Session"],
    }),
    midAdjust: builder.mutation<OPICSessionDto, { sessionId: string } & MidAdjustRequest>({
      query: ({ sessionId, ...body }) => ({
        url: `/sessions/${sessionId}/mid-adjust`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { sessionId }) => [{ type: "Session", id: sessionId }],
    }),
    recordAttemptRef: builder.mutation<void, { sessionId: string } & RecordAttemptRefRequest>({
      query: ({ sessionId, ...body }) => ({
        url: `/sessions/${sessionId}/attempt-ref`,
        method: "POST",
        body,
      }),
    }),
    finalizeSession: builder.mutation<OPICLevelResultDto, string>({
      query: (sessionId) => ({
        url: `/sessions/${sessionId}/finalize`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, sessionId) => [
        { type: "Session", id: sessionId },
        "Result",
      ],
    }),

    // Results
    getMyLatestResult: builder.query<OPICLevelResultDto | null, string | void>({
      query: (language = "vi") => `/results/my-latest?language=${language}`,
      providesTags: ["Result"],
    }),
    getSessionResult: builder.query<OPICLevelResultDto | null, string>({
      query: (sessionId) => `/results/${sessionId}`,
      providesTags: (_r, _e, id) => [{ type: "Result", id }],
    }),

    // Scripts
    getScripts: builder.query<OPICScriptTemplateDto[], { topic?: string; language?: string } | void>({
      query: (params) => {
        const q = new URLSearchParams();
        if (params?.topic) q.set("topic", params.topic);
        if (params?.language) q.set("language", params.language);
        return `/scripts?${q}`;
      },
      providesTags: ["Scripts"],
    }),

    // Teacher scripts
    getTeacherScripts: builder.query<OPICScriptTemplateDto[], { topic?: string; language?: string } | void>({
      query: (params) => {
        const q = new URLSearchParams();
        if (params?.topic) q.set("topic", params.topic);
        if (params?.language) q.set("language", params.language);
        return `/teacher/scripts?${q}`;
      },
      providesTags: ["Scripts"],
    }),
    createScript: builder.mutation<OPICScriptTemplateDto, CreateScriptRequest>({
      query: (body) => ({ url: "/teacher/scripts", method: "POST", body }),
      invalidatesTags: ["Scripts"],
    }),

    // Demo / Simulation
    getDemoQuestions: builder.query<OPICDemoQuestionDto[], { language?: string; quizId?: string } | void>({
      query: (params) => {
        const q = new URLSearchParams();
        q.set("language", params?.language ?? "vi");
        if (params?.quizId) q.set("quizId", params.quizId);
        return `/demo-questions?${q}`;
      },
    }),
    getPublishedOPICQuizzes: builder.query<OPICQuizSummaryDto[], string | void>({
      query: (language = "vi") => `/quizzes/published?language=${language}`,
    }),
    simulateComplete: builder.mutation<OPICLevelResultDto, string>({
      query: (sessionId) => ({
        url: `/sessions/${sessionId}/simulate-complete`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, sessionId) => [
        { type: "Session", id: sessionId },
        "Result",
      ],
    }),
  }),
});

export const {
  useSaveSurveyMutation,
  useGetMySurveyQuery,
  useGetTopicsQuery,
  useCreateSessionMutation,
  useGetSessionQuery,
  useGetMyHistoryQuery,
  useMidAdjustMutation,
  useRecordAttemptRefMutation,
  useFinalizeSessionMutation,
  useGetMyLatestResultQuery,
  useGetSessionResultQuery,
  useGetScriptsQuery,
  useGetTeacherScriptsQuery,
  useCreateScriptMutation,
  useGetDemoQuestionsQuery,
  useGetPublishedOPICQuizzesQuery,
  useSimulateCompleteMutation,
} = opicApi;
