import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

export interface AdminUserListItem {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface SessionSummary {
  id: string;
  deviceId: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface AdminUserDetail extends AdminUserListItem {
  phone: string | null;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  currentLevel: string | null;
  activeSessions: SessionSummary[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminRoleItem {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  userCount: number;
}

export interface GetUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  roleName: string;
}

export interface UpdateUserPayload {
  userId: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  currentLevel?: string | null;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
}

export interface UpdateRolePayload {
  roleId: string;
  name: string;
  description?: string;
}

export interface AdminTeacherDto {
  userId: string;
  profileId: string | null;
  fullName: string;
  avatarUrl: string | null;
  email: string;
  slug: string | null;
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

export interface UpdateTeacherProfilePayload {
  userId: string;
  displayName: string;
  slug: string;
  avatarUrl?: string;
  coverUrl?: string;
  headline?: string;
  bio?: string;
  experienceYears: number;
  specialization?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  websiteUrl?: string;
  isPublic: boolean;
}

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: withReauth(`${API_BASE}/api/v1/admin`),
  tagTypes: ["AdminUsers", "AdminRoles", "AdminTeachers"],
  endpoints: (builder) => ({
    getUsers: builder.query<PagedResult<AdminUserListItem>, GetUsersParams>({
      query: (params) => ({
        url: "/users",
        params: { page: 1, pageSize: 20, ...params },
      }),
      providesTags: ["AdminUsers"],
    }),
    getUserDetail: builder.query<AdminUserDetail, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_res, _err, id) => [{ type: "AdminUsers", id }],
    }),
    updateUserStatus: builder.mutation<void, { userId: string; status: string }>({
      query: ({ userId, status }) => ({
        url: `/users/${userId}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["AdminUsers"],
    }),
    assignRole: builder.mutation<void, { userId: string; roleName: string }>({
      query: ({ userId, roleName }) => ({
        url: `/users/${userId}/role`,
        method: "PUT",
        body: { roleName },
      }),
      invalidatesTags: ["AdminUsers"],
    }),
    inviteUser: builder.mutation<void, { email: string; roleName: string }>({
      query: (body) => ({ url: "/users/invite", method: "POST", body }),
      invalidatesTags: ["AdminUsers"],
    }),
    createUser: builder.mutation<{ id: string }, CreateUserPayload>({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: ["AdminUsers"],
    }),
    updateUser: builder.mutation<void, UpdateUserPayload>({
      query: ({ userId, ...body }) => ({ url: `/users/${userId}`, method: "PUT", body }),
      invalidatesTags: (_res, _err, { userId }) => ["AdminUsers", { type: "AdminUsers", id: userId }],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (userId) => ({ url: `/users/${userId}`, method: "DELETE" }),
      invalidatesTags: ["AdminUsers"],
    }),
    getRoles: builder.query<AdminRoleItem[], void>({
      query: () => "/roles",
      providesTags: ["AdminRoles"],
    }),
    getRoleDetail: builder.query<AdminRoleItem, string>({
      query: (id) => `/roles/${id}`,
      providesTags: (_res, _err, id) => [{ type: "AdminRoles", id }],
    }),
    updateRolePermissions: builder.mutation<void, { roleId: string; permissions: string[] }>({
      query: ({ roleId, permissions }) => ({
        url: `/roles/${roleId}/permissions`,
        method: "PUT",
        body: { permissions },
      }),
      invalidatesTags: ["AdminRoles"],
    }),
    createRole: builder.mutation<{ id: string }, CreateRolePayload>({
      query: (body) => ({ url: "/roles", method: "POST", body }),
      invalidatesTags: ["AdminRoles"],
    }),
    updateRole: builder.mutation<void, UpdateRolePayload>({
      query: ({ roleId, ...body }) => ({ url: `/roles/${roleId}`, method: "PUT", body }),
      invalidatesTags: (_res, _err, { roleId }) => ["AdminRoles", { type: "AdminRoles", id: roleId }],
    }),
    deleteRole: builder.mutation<void, string>({
      query: (roleId) => ({ url: `/roles/${roleId}`, method: "DELETE" }),
      invalidatesTags: ["AdminRoles"],
    }),
    // ── Teacher Profile ───────────────────────────────────────────────────────
    getAdminTeachers: builder.query<AdminTeacherDto[], { page?: number; pageSize?: number }>({
      query: ({ page = 1, pageSize = 50 } = {}) => `/teachers?page=${page}&pageSize=${pageSize}`,
      providesTags: ["AdminTeachers"],
    }),
    getAdminTeacherDetail: builder.query<AdminTeacherDto, string>({
      query: (userId) => `/teachers/${userId}`,
      providesTags: (_r, _e, id) => [{ type: "AdminTeachers", id }],
    }),
    updateTeacherProfile: builder.mutation<void, UpdateTeacherProfilePayload>({
      query: ({ userId, ...body }) => ({ url: `/teachers/${userId}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { userId }) => ["AdminTeachers", { type: "AdminTeachers", id: userId }],
    }),
    setTeacherVerified: builder.mutation<void, { userId: string; isVerified: boolean }>({
      query: ({ userId, isVerified }) => ({
        url: `/teachers/${userId}/verified`,
        method: "PUT",
        body: { isVerified },
      }),
      invalidatesTags: ["AdminTeachers"],
    }),
    // ── User avatar upload (admin) ────────────────────────────────────────────
    uploadUserAvatar: builder.mutation<{ avatarUrl: string }, { userId: string; formData: FormData }>({
      query: ({ userId, formData }) => ({
        url: `/users/${userId}/avatar`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (_r, _e, { userId }) => ["AdminUsers", { type: "AdminUsers", id: userId }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserDetailQuery,
  useUpdateUserStatusMutation,
  useAssignRoleMutation,
  useInviteUserMutation,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetRolesQuery,
  useGetRoleDetailQuery,
  useUpdateRolePermissionsMutation,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetAdminTeachersQuery,
  useGetAdminTeacherDetailQuery,
  useUpdateTeacherProfileMutation,
  useSetTeacherVerifiedMutation,
  useUploadUserAvatarMutation,
} = adminApi;
