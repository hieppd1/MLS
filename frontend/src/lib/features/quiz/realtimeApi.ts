import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RoomInfoDto {
  roomId: string;
  roomCode: string;
  state: "Waiting" | "Active" | "Paused" | "Ended";
  participantCount: number;
  currentQuestionIndex: number;
  quizId?: string;
  quizTitle?: string;
}

export interface QuestionOptionPayload {
  id: string;
  content: string;
  displayOrder: number;
}

export interface QuestionPayload {
  questionIndex: number;
  questionId: string;
  content: string;
  type: string;
  audioUrl: string | null;
  imageUrl: string | null;
  options: QuestionOptionPayload[];
  timeLimitSec: number;
  score: number;
}

export interface StartRoomResult {
  question: QuestionPayload | null;
}

export interface NextRoomResult {
  isEnded: boolean;
  question: QuestionPayload | null;
}

export interface RealtimeAnswerResult {
  isCorrect: boolean;
  pointsEarned: number;
  totalScore: number;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string | null;
  score: number;
  rank: number;
}

// ── API slice ─────────────────────────────────────────────────────────────────

export const realtimeApi = createApi({
  reducerPath: "realtimeApi",
  baseQuery: withReauth(`${API_BASE}/api/v1`),
  endpoints: (builder) => ({
    // Teacher creates a room
    createRoom: builder.mutation<RoomInfoDto, { quizId: string }>({
      query: (body) => ({
        url: "realtime/rooms",
        method: "POST",
        body,
      }),
    }),

    // Get room info by code (anonymous)
    getRoomByCode: builder.query<RoomInfoDto, string>({
      query: (code) => `realtime/rooms/${code}`,
    }),

    // Student joins room
    joinRoom: builder.mutation<RoomInfoDto, string>({
      query: (code) => ({
        url: `realtime/rooms/${code}/join`,
        method: "POST",
      }),
    }),

    // Host starts room
    startRoom: builder.mutation<StartRoomResult, string>({
      query: (roomId) => ({
        url: `realtime/rooms/${roomId}/start`,
        method: "POST",
      }),
    }),

    // Host advances to next question
    nextQuestion: builder.mutation<NextRoomResult, string>({
      query: (roomId) => ({
        url: `realtime/rooms/${roomId}/next`,
        method: "POST",
      }),
    }),

    // Student submits answer
    submitRealtimeAnswer: builder.mutation<
      RealtimeAnswerResult,
      { roomId: string; questionId: string; selectedOptionId?: string | null; timeTakenMs: number }
    >({
      query: ({ roomId, ...body }) => ({
        url: `realtime/rooms/${roomId}/answer`,
        method: "POST",
        body,
      }),
    }),

    // REST leaderboard fallback
    getLeaderboard: builder.query<LeaderboardEntry[], string>({
      query: (roomId) => `realtime/rooms/${roomId}/leaderboard`,
    }),
  }),
});

export const {
  useCreateRoomMutation,
  useGetRoomByCodeQuery,
  useJoinRoomMutation,
  useStartRoomMutation,
  useNextQuestionMutation,
  useSubmitRealtimeAnswerMutation,
  useGetLeaderboardQuery,
} = realtimeApi;
