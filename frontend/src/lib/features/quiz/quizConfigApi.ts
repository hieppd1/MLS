import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QuizTypeConfigDto {
  id: string;
  examMode: string;
  value: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateQuizTypeConfigRequest {
  examMode: string;
  value: string;
  label: string;
  sortOrder?: number;
}

export interface UpdateQuizTypeConfigRequest {
  label: string;
  sortOrder: number;
  isActive: boolean;
}

// ── API Slice ─────────────────────────────────────────────────────────────────

export const quizConfigApi = createApi({
  reducerPath: "quizConfigApi",
  baseQuery: withReauth(`${API_BASE}/api/v1/portal/config`),
  tagTypes: ["QuizTypeConfig"],
  endpoints: (builder) => ({
    // GET /quiz-types?examMode=Standard&activeOnly=true
    listQuizTypes: builder.query<
      QuizTypeConfigDto[],
      { examMode?: string; activeOnly?: boolean }
    >({
      query: ({ examMode, activeOnly = true } = {}) => {
        const params = new URLSearchParams();
        if (examMode) params.set("examMode", examMode);
        params.set("activeOnly", String(activeOnly));
        return `/quiz-types?${params}`;
      },
      providesTags: ["QuizTypeConfig"],
    }),

    // POST /quiz-types
    createQuizType: builder.mutation<{ id: string }, CreateQuizTypeConfigRequest>({
      query: (body) => ({ url: "/quiz-types", method: "POST", body }),
      invalidatesTags: ["QuizTypeConfig"],
    }),

    // PUT /quiz-types/{id}
    updateQuizType: builder.mutation<
      void,
      { id: string } & UpdateQuizTypeConfigRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/quiz-types/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["QuizTypeConfig"],
    }),

    // DELETE /quiz-types/{id}
    deleteQuizType: builder.mutation<void, string>({
      query: (id) => ({ url: `/quiz-types/${id}`, method: "DELETE" }),
      invalidatesTags: ["QuizTypeConfig"],
    }),
  }),
});

export const {
  useListQuizTypesQuery,
  useCreateQuizTypeMutation,
  useUpdateQuizTypeMutation,
  useDeleteQuizTypeMutation,
} = quizConfigApi;
