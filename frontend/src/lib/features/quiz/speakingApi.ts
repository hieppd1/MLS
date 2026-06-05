import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

export interface UploadSpeakingResult {
  submissionId: string;
  status: string;
}

export interface SpeakingStatusDto {
  submissionId: string;
  status: "Pending" | "Processing" | "Done" | "Failed";
  finalScore: number | null;
}

export interface SpeakingResultDto {
  submissionId: string;
  status: string;
  transcriptText: string | null;
  pronunciationScore: number | null;
  fluencyScore: number | null;
  accuracyScore: number | null;
  coherenceScore: number | null;
  vocabularyScore: number | null;
  taskAchievementScore: number | null;
  finalScore: number | null;
  llmFeedback: string | null;
  phonemeAnalysis: string | null;
  audioUrl: string | null;
  processedAt: string | null;
}

export const speakingApi = createApi({
  reducerPath: "speakingApi",
  baseQuery: withReauth(`${API_BASE}/api/v1/speaking`),
  tagTypes: ["SpeakingStatus", "SpeakingResult"],
  endpoints: (builder) => ({
    getSpeakingStatus: builder.query<SpeakingStatusDto, string>({
      query: (id) => `/${id}/status`,
      providesTags: (_r, _e, id) => [{ type: "SpeakingStatus", id }],
    }),
    getSpeakingResult: builder.query<SpeakingResultDto, string>({
      query: (id) => `/${id}/result`,
      providesTags: (_r, _e, id) => [{ type: "SpeakingResult", id }],
    }),
  }),
});

export const {
  useGetSpeakingStatusQuery,
  useGetSpeakingResultQuery,
} = speakingApi;

// Manual upload function (not RTK Query — needs FormData + multipart)
export async function uploadSpeakingAudio(
  audioBlob: Blob,
  fileName: string,
  attemptId: string,
  questionId: string,
  token: string,
  examModeTag?: string
): Promise<UploadSpeakingResult> {
  const form = new FormData();
  form.append("file", audioBlob, fileName);
  form.append("attemptId", attemptId);
  form.append("questionId", questionId);
  if (examModeTag) form.append("examModeTag", examModeTag);

  const res = await fetch(`${API_BASE}/api/v1/speaking/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Tenant-Slug": "demo",
    },
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(err.message ?? "Upload failed");
  }
  return res.json();
}
