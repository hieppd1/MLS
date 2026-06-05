import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

export interface ReviewUserDto {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface ReviewDto {
  id: string;
  courseId: string;
  user: ReviewUserDto;
  rating: number;
  title: string | null;
  content: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface ReviewStatsDto {
  averageRating: number;
  totalReviews: number;
  distribution: Record<string, number>; // "1"–"5" → count
}

export interface ReviewsPageDto {
  items: ReviewDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateReviewInput {
  rating: number;
  title?: string;
  content: string;
}

export const reviewsApi = createApi({
  reducerPath: "reviewsApi",
  baseQuery: withReauth(`${API_BASE}/api/v1`),
  tagTypes: ["Review"],
  endpoints: (builder) => ({
    getCourseReviews: builder.query<ReviewsPageDto, { courseId: string; page?: number; pageSize?: number }>({
      query: ({ courseId, page = 1, pageSize = 10 }) =>
        `/courses/${courseId}/reviews?page=${page}&pageSize=${pageSize}`,
      providesTags: (_r, _e, { courseId }) => [{ type: "Review", id: courseId }],
    }),

    getReviewStats: builder.query<ReviewStatsDto, string>({
      query: (courseId) => `/courses/${courseId}/reviews/stats`,
      providesTags: (_r, _e, courseId) => [{ type: "Review", id: `stats-${courseId}` }],
    }),

    getMyReview: builder.query<ReviewDto | null, string>({
      query: (courseId) => `/courses/${courseId}/reviews/mine`,
      providesTags: (_r, _e, courseId) => [{ type: "Review", id: `mine-${courseId}` }],
    }),

    createReview: builder.mutation<ReviewDto, { courseId: string } & CreateReviewInput>({
      query: ({ courseId, ...body }) => ({
        url: `/courses/${courseId}/reviews`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { courseId }) => [
        { type: "Review", id: courseId },
        { type: "Review", id: `stats-${courseId}` },
        { type: "Review", id: `mine-${courseId}` },
      ],
    }),

    updateReview: builder.mutation<ReviewDto, { courseId: string; reviewId: string } & CreateReviewInput>({
      query: ({ courseId, reviewId, ...body }) => ({
        url: `/courses/${courseId}/reviews/${reviewId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, { courseId }) => [
        { type: "Review", id: courseId },
        { type: "Review", id: `stats-${courseId}` },
        { type: "Review", id: `mine-${courseId}` },
      ],
    }),

    deleteReview: builder.mutation<void, { courseId: string; reviewId: string }>({
      query: ({ courseId, reviewId }) => ({
        url: `/courses/${courseId}/reviews/${reviewId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { courseId }) => [
        { type: "Review", id: courseId },
        { type: "Review", id: `stats-${courseId}` },
        { type: "Review", id: `mine-${courseId}` },
      ],
    }),
  }),
});

export const {
  useGetCourseReviewsQuery,
  useGetReviewStatsQuery,
  useGetMyReviewQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} = reviewsApi;
