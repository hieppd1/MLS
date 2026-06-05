import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

export interface VerifyCodeResult {
  valid: boolean;
  bookTitle: string | null;
  bookType: string | null;
  message: string | null;
}

export interface ActivateCodeResult {
  success: boolean;
  bookTitle: string | null;
  bookSlug: string | null;
  bookType: string | null;
  message: string | null;
}

export interface MyActivationCodeDto {
  code: string;
  bookId: string;
  bookTitle: string;
  bookType: string;
  status: string;
  activatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export const activationApi = createApi({
  reducerPath: "activationApi",
  baseQuery: withReauth(API_BASE),
  tagTypes: ["ActivationCodes"],
  endpoints: (builder) => ({
    verifyCode: builder.mutation<VerifyCodeResult, { code: string }>({
      query: (body) => ({
        url: "/api/v1/activation/verify",
        method: "POST",
        body,
        headers: { "X-Tenant-Slug": "demo" },
      }),
    }),
    activateCode: builder.mutation<ActivateCodeResult, { code: string }>({
      query: (body) => ({
        url: "/api/v1/activation/activate",
        method: "POST",
        body,
        headers: { "X-Tenant-Slug": "demo" },
      }),
      invalidatesTags: ["ActivationCodes"],
    }),
    getMyCodes: builder.query<MyActivationCodeDto[], void>({
      query: () => ({
        url: "/api/v1/activation/my-codes",
        headers: { "X-Tenant-Slug": "demo" },
      }),
      providesTags: ["ActivationCodes"],
    }),
  }),
});

export const {
  useVerifyCodeMutation,
  useActivateCodeMutation,
  useGetMyCodesQuery,
} = activationApi;
