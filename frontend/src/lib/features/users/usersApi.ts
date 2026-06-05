import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  fullName: string;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  currentLevel: string | null;
  role: string;
  createdAt: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  currentLevel?: string | null;
  phone?: string | null;
}

export interface SessionDto {
  id: string;
  deviceId: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrentDevice: boolean;
}

export interface MyTeacherProfileDto {
  userId: string;
  profileId: string | null;
  fullName: string;
  email: string;
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
  isPublic: boolean;
  followerCount: number;
  courseCount: number;
  hasProfile: boolean;
}

export interface UpdateMyTeacherProfileRequest {
  displayName: string;
  slug: string;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  experienceYears?: number;
  specialization?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
  websiteUrl?: string | null;
  isPublic?: boolean;
}

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: withReauth(`${API_BASE}/api/v1/users`),
  tagTypes: ["Profile", "Sessions", "TeacherProfile"],
  endpoints: (builder) => ({
    getMyProfile: builder.query<UserProfile, void>({
      query: () => "/me",
      providesTags: ["Profile"],
    }),
    updateProfile: builder.mutation<UserProfile, UpdateProfileRequest>({
      query: (body) => ({ url: "/me", method: "PUT", body }),
      invalidatesTags: ["Profile"],
    }),
    changePassword: builder.mutation<void, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: "/me/password", method: "PUT", body }),
    }),
    uploadAvatar: builder.mutation<{ avatarUrl: string }, FormData>({
      query: (formData) => ({ url: "/me/avatar", method: "POST", body: formData }),
      invalidatesTags: ["Profile"],
    }),
    getSessions: builder.query<SessionDto[], void>({
      query: () => "/me/sessions",
      providesTags: ["Sessions"],
    }),
    revokeSession: builder.mutation<void, string>({
      query: (sessionId) => ({ url: `/me/sessions/${sessionId}`, method: "DELETE" }),
      invalidatesTags: ["Sessions"],
    }),
    getMyTeacherProfile: builder.query<MyTeacherProfileDto, void>({
      query: () => "/me/teacher-profile",
      providesTags: ["TeacherProfile"],
    }),
    updateMyTeacherProfile: builder.mutation<void, UpdateMyTeacherProfileRequest>({
      query: (body) => ({ url: "/me/teacher-profile", method: "PUT", body }),
      invalidatesTags: ["TeacherProfile"],
    }),
    uploadTeacherProfileImage: builder.mutation<{ url: string }, { type: "avatar" | "cover"; formData: FormData }>({
      query: ({ type, formData }) => ({
        url: `/me/teacher-profile/image?type=${type}`,
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useUploadAvatarMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useGetMyTeacherProfileQuery,
  useUpdateMyTeacherProfileMutation,
  useUploadTeacherProfileImageMutation,
} = usersApi;
