import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

export interface LessonCommentDto {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  parentId: string | null;
  content: string;
  upvoteCount: number;
  isUpvotedByMe: boolean;
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: string;
  replies: LessonCommentDto[];
}

export interface LessonCommentsPageDto {
  items: LessonCommentDto[];
  nextCursor: string | null;
}

export interface CreateCommentRequest {
  lessonId?: string;
  sessionId?: string;
  parentId?: string;
  content: string;
}

export const lessonCommentsApi = createApi({
  reducerPath: "lessonCommentsApi",
  baseQuery: withReauth(`${API_BASE}/api/v1`),
  tagTypes: ["LessonComment"],
  endpoints: (builder) => ({
    getComments: builder.query<
      LessonCommentsPageDto,
      { lessonId?: string; sessionId?: string; cursor?: string; limit?: number }
    >({
      query: ({
        lessonId,
        sessionId,
        cursor,
        limit = 20,
      }: {
        lessonId?: string;
        sessionId?: string;
        cursor?: string;
        limit?: number;
      }) => {
        const params = new URLSearchParams();
        if (lessonId) params.set("lessonId", lessonId);
        if (sessionId) params.set("sessionId", sessionId);
        if (cursor) params.set("cursor", cursor);
        params.set("limit", String(limit));
        return `/lesson-comments?${params}`;
      },
      providesTags: (result: LessonCommentsPageDto | undefined) =>
        result
          ? [
              ...result.items.map(({ id }: { id: string }) => ({
                type: "LessonComment" as const,
                id,
              })),
              { type: "LessonComment", id: "LIST" },
            ]
          : [{ type: "LessonComment", id: "LIST" }],
    }),
    createComment: builder.mutation<LessonCommentDto, CreateCommentRequest>({
      query: (body) => ({ url: "/lesson-comments", method: "POST", body }),
      invalidatesTags: [{ type: "LessonComment", id: "LIST" }],
    }),
    deleteComment: builder.mutation<void, string>({
      query: (id) => ({ url: `/lesson-comments/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "LessonComment", id: "LIST" }],
    }),
    toggleUpvote: builder.mutation<void, string>({
      query: (id) => ({
        url: `/lesson-comments/${id}/upvote`,
        method: "POST",
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: "LessonComment", id },
        { type: "LessonComment", id: "LIST" },
      ],
    }),
    togglePin: builder.mutation<void, string>({
      query: (id) => ({
        url: `/lesson-comments/${id}/pin`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "LessonComment", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useToggleUpvoteMutation,
  useTogglePinMutation,
} = lessonCommentsApi;
