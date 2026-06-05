import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BookReviewDto {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string | null;
  content: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface BookReviewSummaryDto {
  averageRating: number;
  totalReviews: number;
  star5: number;
  star4: number;
  star3: number;
  star2: number;
  star1: number;
}

export interface BookReviewsResult {
  summary: BookReviewSummaryDto;
  reviews: BookReviewDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateReviewPayload {
  rating: number;
  content: string;
  title?: string;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const bookReviewsApi = createApi({
  reducerPath: "bookReviewsApi",
  baseQuery: withReauth(`${API_BASE}/api/v1/books`),
  tagTypes: ["BookReviews"],
  endpoints: (builder) => ({
    getBookReviews: builder.query<BookReviewsResult, { bookId: string; page?: number; pageSize?: number }>({
      query: ({ bookId, page = 1, pageSize = 10 }) => ({
        url: `/${bookId}/reviews`,
        params: { page, pageSize },
      }),
      providesTags: (_r, _e, { bookId }) => [{ type: "BookReviews", id: bookId }],
    }),
    getMyBookReview: builder.query<BookReviewDto, string>({
      query: (bookId) => `/${bookId}/reviews/mine`,
      providesTags: (_r, _e, bookId) => [{ type: "BookReviews", id: `mine-${bookId}` }],
    }),
    createBookReview: builder.mutation<BookReviewDto, { bookId: string } & CreateReviewPayload>({
      query: ({ bookId, ...body }) => ({
        url: `/${bookId}/reviews`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { bookId }) => [
        { type: "BookReviews", id: bookId },
        { type: "BookReviews", id: `mine-${bookId}` },
      ],
    }),
    updateBookReview: builder.mutation<void, { bookId: string; reviewId: string } & CreateReviewPayload>({
      query: ({ bookId, reviewId, ...body }) => ({
        url: `/${bookId}/reviews/${reviewId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, { bookId }) => [{ type: "BookReviews", id: bookId }],
    }),
    deleteBookReview: builder.mutation<void, { bookId: string; reviewId: string }>({
      query: ({ bookId, reviewId }) => ({
        url: `/${bookId}/reviews/${reviewId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { bookId }) => [
        { type: "BookReviews", id: bookId },
        { type: "BookReviews", id: `mine-${bookId}` },
      ],
    }),
  }),
});

export const {
  useGetBookReviewsQuery,
  useGetMyBookReviewQuery,
  useCreateBookReviewMutation,
  useUpdateBookReviewMutation,
  useDeleteBookReviewMutation,
} = bookReviewsApi;
