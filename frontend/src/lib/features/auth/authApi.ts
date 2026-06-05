import { createApi } from "@reduxjs/toolkit/query/react";
import type { UserInfo } from "./authSlice";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserInfo;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: withReauth(`${API_BASE}/api/v1/auth`),
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({ url: "/register", method: "POST", body }),
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: "/login", method: "POST", body }),
    }),
    refresh: builder.mutation<AuthResponse, { refreshToken: string }>({
      query: (body) => ({ url: "/refresh", method: "POST", body }),
    }),
    logout: builder.mutation<void, { refreshToken: string }>({
      query: (body) => ({ url: "/logout", method: "POST", body }),
    }),
    logoutAll: builder.mutation<void, void>({
      query: () => ({ url: "/logout-all", method: "POST" }),
    }),
    googleAuth: builder.mutation<AuthResponse, { idToken: string }>({
      query: (body) => ({ url: "/google", method: "POST", body }),
    }),
    forgotPassword: builder.mutation<void, { email: string }>({
      query: (body) => ({ url: "/forgot-password", method: "POST", body }),
    }),
    resetPassword: builder.mutation<void, { token: string; newPassword: string }>({
      query: (body) => ({ url: "/reset-password", method: "POST", body }),
    }),
    verifyEmail: builder.mutation<void, { code: string }>({
      query: (body) => ({ url: "/verify-email", method: "POST", body }),
    }),
    resendVerification: builder.mutation<void, void>({
      query: () => ({ url: "/resend-verification", method: "POST" }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useLogoutAllMutation,
  useGoogleAuthMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
} = authApi;
