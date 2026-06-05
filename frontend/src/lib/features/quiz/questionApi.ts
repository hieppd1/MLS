import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QuestionOptionForm {
  content: string;
  isCorrect: boolean;
  displayOrder: number;
  matchKey?: string;
  matchValue?: string;
}

export interface QuestionForm {
  content: string;
  type: string;        // SingleChoice | MultipleChoice | TrueFalse | FillBlank | Matching | Ordering
  skillType: string;   // Reading | Listening | Speaking | Writing | Grammar | Vocabulary
  difficulty: string;  // Easy | Medium | Hard
  score: number;
  audioUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  explanation?: string;
  tags?: string;
  options: QuestionOptionForm[];
  audioPlayLimit?: number;
  speakingTimeLimitSec?: number;
  examModeTag?: string;
}

export interface QuestionListItem {
  id: string;
  content: string;
  type: string;
  skillType: string;
  difficulty: string;
  score: number;
  tags: string | null;
  createdAt: string;
}

export interface QuestionListResult {
  items: QuestionListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface QuestionOptionDetail {
  id: string;
  content: string;
  isCorrect: boolean;
  displayOrder: number;
  matchKey: string | null;
  matchValue: string | null;
}

export interface QuestionDetail {
  id: string;
  content: string;
  type: string;
  skillType: string;
  difficulty: string;
  score: number;
  audioUrl: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  explanation: string | null;
  tags: string | null;
  options: QuestionOptionDetail[];
}

export interface AddQuestionToQuizRequest {
  questionId: string;
  displayOrder?: number;
  scoreOverride?: number;
}

export interface ReorderQuestionsRequest {
  items: { linkId: string; displayOrder: number }[];
}

// ── API ───────────────────────────────────────────────────────────────────────

export const questionApi = createApi({
  reducerPath: "questionApi",
  baseQuery: withReauth(API_BASE),
  tagTypes: ["Question", "QuizQuestion"],
  endpoints: (builder) => ({
    listQuestions: builder.query<QuestionListResult, {
      page?: number; pageSize?: number; search?: string;
      type?: string; skillType?: string; difficulty?: string;
    }>({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.page) sp.set("page", String(params.page));
        if (params.pageSize) sp.set("pageSize", String(params.pageSize));
        if (params.search) sp.set("search", params.search);
        if (params.type) sp.set("type", params.type);
        if (params.skillType) sp.set("skillType", params.skillType);
        if (params.difficulty) sp.set("difficulty", params.difficulty);
        return `/api/v1/questions?${sp.toString()}`;
      },
      providesTags: ["Question"],
    }),

    getQuestion: builder.query<QuestionDetail, string>({
      query: (id) => `/api/v1/questions/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Question", id }],
    }),

    createQuestion: builder.mutation<QuestionDetail, QuestionForm>({
      query: (body) => ({ url: "/api/v1/questions", method: "POST", body }),
      invalidatesTags: ["Question"],
    }),

    updateQuestion: builder.mutation<QuestionDetail, { id: string } & Partial<QuestionForm>>({
      query: ({ id, ...body }) => ({ url: `/api/v1/questions/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Question", id }, "Question"],
    }),

    deleteQuestion: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/v1/questions/${id}`, method: "DELETE" }),
      invalidatesTags: ["Question"],
    }),

    addQuestionToQuiz: builder.mutation<void, { quizId: string } & AddQuestionToQuizRequest>({
      query: ({ quizId, ...body }) => ({
        url: `/api/v1/quizzes/${quizId}/questions`, method: "POST", body,
      }),
      invalidatesTags: ["QuizQuestion"],
    }),

    removeQuestionFromQuiz: builder.mutation<void, { quizId: string; questionId: string }>({
      query: ({ quizId, questionId }) => ({
        url: `/api/v1/quizzes/${quizId}/questions/${questionId}`, method: "DELETE",
      }),
      invalidatesTags: ["QuizQuestion"],
    }),

    reorderQuizQuestions: builder.mutation<void, { quizId: string } & ReorderQuestionsRequest>({
      query: ({ quizId, ...body }) => ({
        url: `/api/v1/quizzes/${quizId}/questions/reorder`, method: "PUT", body,
      }),
      invalidatesTags: ["QuizQuestion"],
    }),

    overrideQuestionScore: builder.mutation<void, { quizId: string; questionId: string; score: number }>({
      query: ({ quizId, questionId, score }) => ({
        url: `/api/v1/quizzes/${quizId}/questions/${questionId}/score`, method: "PUT", body: { score },
      }),
      invalidatesTags: ["QuizQuestion"],
    }),
  }),
});

export const {
  useListQuestionsQuery,
  useGetQuestionQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useAddQuestionToQuizMutation,
  useRemoveQuestionFromQuizMutation,
  useReorderQuizQuestionsMutation,
  useOverrideQuestionScoreMutation,
} = questionApi;
