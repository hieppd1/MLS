import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VoucherDto {
  id: string;
  code: string;
  description: string | null;
  type: string;
  value: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usageCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  status: string;
  isPublic: boolean;
  createdAt: string;
}

export interface VoucherListResult {
  items: VoucherDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VoucherUpsertPayload {
  code?: string;
  type: string;
  value: number;
  description?: string | null;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  isPublic?: boolean;
}

export interface ValidateVoucherResult {
  valid: boolean;
  discount: number;
  message: string | null;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const adminVouchersApi = createApi({
  reducerPath: "adminVouchersApi",
  baseQuery: withReauth(`${API_BASE}/api/v1/admin/vouchers`),
  tagTypes: ["AdminVouchers"],
  endpoints: (builder) => ({
    getAdminVouchers: builder.query<VoucherListResult, { page?: number; pageSize?: number; search?: string; status?: string }>({
      query: (params) => ({ url: "", params: { page: 1, pageSize: 20, ...params } }),
      providesTags: ["AdminVouchers"],
    }),
    getAdminVoucherDetail: builder.query<VoucherDto, string>({
      query: (id) => `/${id}`,
      providesTags: (_r, _e, id) => [{ type: "AdminVouchers", id }],
    }),
    createVoucher: builder.mutation<{ id: string }, VoucherUpsertPayload>({
      query: (body) => ({ url: "", method: "POST", body }),
      invalidatesTags: ["AdminVouchers"],
    }),
    updateVoucher: builder.mutation<void, { id: string } & VoucherUpsertPayload>({
      query: ({ id, ...body }) => ({ url: `/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => ["AdminVouchers", { type: "AdminVouchers", id }],
    }),
    deleteVoucher: builder.mutation<void, string>({
      query: (id) => ({ url: `/${id}`, method: "DELETE" }),
      invalidatesTags: ["AdminVouchers"],
    }),
    toggleVoucherStatus: builder.mutation<void, { id: string; activate: boolean }>({
      query: ({ id, activate }) => ({
        url: `/${id}/toggle-status`,
        method: "POST",
        body: { activate },
      }),
      invalidatesTags: (_r, _e, { id }) => ["AdminVouchers", { type: "AdminVouchers", id }],
    }),
    validateVoucher: builder.query<ValidateVoucherResult, { code: string; orderAmount: number }>({
      query: ({ code, orderAmount }) => ({
        url: "/validate",
        params: { code, orderAmount },
      }),
    }),
  }),
});

export const {
  useGetAdminVouchersQuery,
  useGetAdminVoucherDetailQuery,
  useCreateVoucherMutation,
  useUpdateVoucherMutation,
  useDeleteVoucherMutation,
  useToggleVoucherStatusMutation,
  useValidateVoucherQuery,
} = adminVouchersApi;
