import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

export interface SubmitWritingRequest {
  attemptId: string;
  questionId: string;
  essayText: string;
  wordCount: number;
  taskType?: string | null;
  essayType?: string | null;
  examModeTag?: string | null;
}

export interface SubmitWritingResult {
  submissionId: string;
  status: string;
}

export interface WritingStatusDto {
  submissionId: string;
  status: string;
  wordCount: number;
  finalScore: number | null;
}

export interface WritingResultDto {
  submissionId: string;
  status: string;
  wordCount: number;
  taskType: string | null;
  essayType: string | null;
  grammarScore: number | null;
  vocabularyScore: number | null;
  coherenceScore: number | null;
  taskAchievementScore: number | null;
  finalScore: number | null;
  llmFeedback: string | null;
  grammarErrors: string | null;    // JSON string
  vocabularyAnalysis: string | null; // JSON string
  processedAt: string | null;
}

export const writingApi = createApi({
  reducerPath: "writingApi",
  baseQuery: withReauth(`${API_BASE}/api/v1/writing`),
  endpoints: (builder) => ({
    submitWriting: builder.mutation<SubmitWritingResult, SubmitWritingRequest>({
      query: (body) => ({
        url: "/submit",
        method: "POST",
        body,
      }),
    }),
    getWritingStatus: builder.query<WritingStatusDto, string>({
      query: (id) => `/${id}/status`,
    }),
    getWritingResult: builder.query<WritingResultDto, string>({
      query: (id) => `/${id}/result`,
    }),
  }),
});

export const {
  useSubmitWritingMutation,
  useGetWritingStatusQuery,
  useGetWritingResultQuery,
} = writingApi;
