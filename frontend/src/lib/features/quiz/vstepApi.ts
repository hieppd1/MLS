import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── DTOs ──────────────────────────────────────────────────────────────────────

export type VSTEPPart = "Listening" | "Reading" | "Writing" | "Speaking";
export type VSTEPBand = "BelowA2" | "A2" | "B1" | "B2" | "C1";

export interface VSTEPSessionDto {
  id: string;
  userId: string;
  targetBand: string | null;
  currentPart: VSTEPPart;
  partState: Record<string, string>;
  listeningScore: number | null;
  readingScore: number | null;
  writingScore: number | null;
  speakingScore: number | null;
  overallScore: number | null;
  assignedBand: VSTEPBand | null;
  assignedLevel: number | null;
  listeningAttemptId: string | null;
  readingAttemptId: string | null;
  writingAttemptId: string | null;
  speakingAttemptId: string | null;
  isCompleted: boolean;
  startedAt: string;
  completedAt: string | null;
}

export interface VSTEPBandResultDto {
  id: string;
  assignedBand: VSTEPBand;
  assignedLevel: number;
  listeningScore: number;
  readingScore: number;
  writingScore: number;
  speakingScore: number;
  overallScore: number;
  testedAt: string;
}

export interface PassageGroupDto {
  id: string;
  quizId: string;
  groupIndex: number;
  passageType: "reading" | "listening";
  passageText: string | null;
  audioUrl: string | null;
  audioPlayLimit: number;
  preListenSeconds: number;
  questionIds: string[];
  displayOrder: number;
}

export interface VSTEPQuizSummaryDto {
  id: string;
  title: string;
  description: string | null;
  quizType: string;
  duration: number | null;
}

export interface StartVSTEPPartResult {
  attemptId: string;
  session: VSTEPSessionDto;
}

// ── Band labels ───────────────────────────────────────────────────────────────

export const VSTEP_BAND_LABELS: Record<VSTEPBand, string> = {
  BelowA2: "Dưới A2",
  A2:      "A2",
  B1:      "B1",
  B2:      "B2",
  C1:      "C1",
};

export const VSTEP_PART_LABELS: Record<VSTEPPart, string> = {
  Listening: "Nghe",
  Reading:   "Đọc",
  Writing:   "Viết",
  Speaking:  "Nói",
};

export const VSTEP_PARTS: VSTEPPart[] = ["Listening", "Reading", "Writing", "Speaking"];

// ── Request types ─────────────────────────────────────────────────────────────

export interface CreateVSTEPSessionRequest {
  targetBand?: string;
}

export interface StartVSTEPPartRequest {
  part: VSTEPPart;
  quizId: string;
}

export interface SubmitVSTEPPartRequest {
  part: VSTEPPart;
  score: number;
}

export interface UpsertPassageGroupRequest {
  groupIndex: number;
  passageType: "reading" | "listening";
  passageText?: string;
  audioUrl?: string;
  audioPlayLimit?: number;
  preListenSeconds?: number;
  questionIds?: string[];
  displayOrder?: number;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const vstepApi = createApi({
  reducerPath: "vstepApi",
  baseQuery: withReauth(`${API_BASE}/api/v1/vstep`),
  tagTypes: ["Session", "Result", "Passages"],
  endpoints: (builder) => ({
    // Sessions
    createSession: builder.mutation<VSTEPSessionDto, CreateVSTEPSessionRequest>({
      query: (body) => ({ url: "/sessions", method: "POST", body }),
      invalidatesTags: ["Session"],
    }),
    getSession: builder.query<VSTEPSessionDto, string>({
      query: (id) => `/sessions/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Session", id }],
    }),
    getMyHistory: builder.query<VSTEPSessionDto[], { page?: number; pageSize?: number } | void>({
      query: (p) => `/sessions/my-history?page=${p?.page ?? 1}&pageSize=${p?.pageSize ?? 10}`,
      providesTags: ["Session"],
    }),
    startPart: builder.mutation<StartVSTEPPartResult, { sessionId: string } & StartVSTEPPartRequest>({
      query: ({ sessionId, ...body }) => ({
        url: `/sessions/${sessionId}/start-part`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { sessionId }) => [{ type: "Session", id: sessionId }],
    }),
    submitPart: builder.mutation<VSTEPSessionDto, { sessionId: string } & SubmitVSTEPPartRequest>({
      query: ({ sessionId, ...body }) => ({
        url: `/sessions/${sessionId}/submit-part`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { sessionId }) => [
        { type: "Session", id: sessionId },
        "Result",
      ],
    }),

    // Quizzes
    getPublishedQuizzes: builder.query<VSTEPQuizSummaryDto[], string | void>({
      query: (quizType = "VSTEPMockTest") =>
        `/quizzes/published?quizType=${quizType}`,
    }),
    getPassages: builder.query<PassageGroupDto[], string>({
      query: (quizId) => `/quizzes/${quizId}/passages`,
      providesTags: (_r, _e, quizId) => [{ type: "Passages", id: quizId }],
    }),

    // Passage CRUD (teacher)
    createPassage: builder.mutation<PassageGroupDto, { quizId: string } & UpsertPassageGroupRequest>({
      query: ({ quizId, ...body }) => ({ url: `/quizzes/${quizId}/passages`, method: "POST", body }),
      invalidatesTags: (_r, _e, { quizId }) => [{ type: "Passages", id: quizId }],
    }),
    updatePassage: builder.mutation<PassageGroupDto, { id: string; quizId: string } & UpsertPassageGroupRequest>({
      query: ({ id, ...body }) => ({ url: `/passages/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { quizId }) => [{ type: "Passages", id: quizId }],
    }),
    deletePassage: builder.mutation<void, { id: string; quizId: string }>({
      query: ({ id }) => ({ url: `/passages/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { quizId }) => [{ type: "Passages", id: quizId }],
    }),

    // Results
    getResult: builder.query<VSTEPBandResultDto, string>({
      query: (sessionId) => `/results/${sessionId}`,
      providesTags: (_r, _e, id) => [{ type: "Result", id }],
    }),
    getMyLatestResult: builder.query<VSTEPBandResultDto | null, void>({
      query: () => "/results/my-latest",
      providesTags: ["Result"],
    }),
  }),
});

export const {
  useCreateSessionMutation,
  useGetSessionQuery,
  useGetMyHistoryQuery,
  useStartPartMutation,
  useSubmitPartMutation,
  useGetPublishedQuizzesQuery,
  useGetPassagesQuery,
  useCreatePassageMutation,
  useUpdatePassageMutation,
  useDeletePassageMutation,
  useGetResultQuery,
  useGetMyLatestResultQuery,
} = vstepApi;
