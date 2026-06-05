import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TeacherProfileDto {
  id: string;
  displayName: string;
  slug: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  headline: string | null;
  bio: string | null;
  experienceYears: number;
  specialization: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  websiteUrl: string | null;
  isVerified: boolean;
  followerCount: number;
  courseCount: number;
  ratingAverage: number;
  totalViews: number;
  totalStudents: number;
  isFollowing: boolean;
}

export interface TeacherCourseItem {
  id: string;
  title: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  level: number;
  price: number;
  discountPrice: number | null;
  isFree: boolean;
  slug: string | null;
  enrollmentCount: number;
  ratingAverage: number;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const teachersApi = createApi({
  reducerPath: "teachersApi",
  baseQuery: withReauth(`${API_BASE}/api/v1/teachers`),
  tagTypes: ["Teacher"],
  endpoints: (builder) => ({
    getTeacherList: builder.query<TeacherProfileDto[], { page?: number; pageSize?: number }>(
      {
        query: ({ page = 1, pageSize = 20 } = {}) =>
          `?page=${page}&pageSize=${pageSize}`,
        providesTags: [{ type: "Teacher", id: "LIST" }],
      }
    ),
    getTeacherBySlug: builder.query<TeacherProfileDto, string>({
      query: (slug) => `/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: "Teacher", id: slug }],
    }),
    getTeacherCourses: builder.query<TeacherCourseItem[], string>({
      query: (id) => `/${id}/courses`,
      providesTags: (_r, _e, id) => [{ type: "Teacher", id: `${id}-courses` }],
    }),
    followTeacher: builder.mutation<void, string>({
      query: (id) => ({ url: `/${id}/follow`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Teacher", id }],
    }),
    unfollowTeacher: builder.mutation<void, string>({
      query: (id) => ({ url: `/${id}/follow`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Teacher", id }],
    }),
  }),
});

export const {
  useGetTeacherListQuery,
  useGetTeacherBySlugQuery,
  useGetTeacherCoursesQuery,
  useFollowTeacherMutation,
  useUnfollowTeacherMutation,
} = teachersApi;
