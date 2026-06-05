import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CommentDto {
  id: string;
  sessionId: string;
  segmentId: string | null;
  userId: string;
  userName: string;
  userAvatar: string | null;
  parentCommentId: string | null;
  content: string;
  timestampSecond: number;
  likeCount: number;
  isPinned: boolean;
  status: string;
  createdAt: string;
  replies: CommentDto[];
  userHasLiked: boolean;
}

export interface CommentPageDto {
  items: CommentDto[];
  nextCursor: string | null;
  total: number;
}

// ── API Slice ─────────────────────────────────────────────────────────────────

export const commentsApi = createApi({
  reducerPath: "commentsApi",
  baseQuery: withReauth(`${API_BASE}/api/v1`),
  tagTypes: ["Comment"],
  endpoints: (builder) => ({
    getSessionComments: builder.query<
      CommentPageDto,
      { sessionId: string; cursor?: string; pageSize?: number }
    >({
      query: ({ sessionId, cursor, pageSize = 20 }) => {
        const params = new URLSearchParams({ pageSize: String(pageSize) });
        if (cursor) params.set("cursor", cursor);
        return `/sessions/${sessionId}/comments?${params}`;
      },
      providesTags: (_r, _e, { sessionId }) => [{ type: "Comment", id: sessionId }],
    }),

    createComment: builder.mutation<
      CommentDto,
      {
        sessionId: string;
        content: string;
        timestampSecond?: number;
        segmentId?: string | null;
        parentCommentId?: string | null;
      }
    >({
      query: ({ sessionId, ...body }) => ({
        url: `/sessions/${sessionId}/comments`,
        method: "POST",
        body: {
          content: body.content,
          timestampSecond: body.timestampSecond ?? 0,
          segmentId: body.segmentId ?? null,
          parentCommentId: body.parentCommentId ?? null,
        },
      }),
      invalidatesTags: (_r, _e, { sessionId }) => [{ type: "Comment", id: sessionId }],
    }),

    updateComment: builder.mutation<
      CommentDto,
      { sessionId: string; commentId: string; content: string }
    >({
      query: ({ sessionId, commentId, content }) => ({
        url: `/sessions/${sessionId}/comments/${commentId}`,
        method: "PUT",
        body: { content },
      }),
      invalidatesTags: (_r, _e, { sessionId }) => [{ type: "Comment", id: sessionId }],
    }),

    deleteComment: builder.mutation<void, { sessionId: string; commentId: string }>({
      query: ({ sessionId, commentId }) => ({
        url: `/sessions/${sessionId}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { sessionId }) => [{ type: "Comment", id: sessionId }],
    }),

    toggleLike: builder.mutation<{ likeCount: number }, { sessionId: string; commentId: string }>({
      query: ({ sessionId, commentId }) => ({
        url: `/sessions/${sessionId}/comments/${commentId}/like`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { sessionId }) => [{ type: "Comment", id: sessionId }],
    }),

    reportComment: builder.mutation<void, { sessionId: string; commentId: string }>({
      query: ({ sessionId, commentId }) => ({
        url: `/sessions/${sessionId}/comments/${commentId}/report`,
        method: "POST",
      }),
    }),
  }),
});

export const {
  useGetSessionCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useToggleLikeMutation,
  useReportCommentMutation,
} = commentsApi;
