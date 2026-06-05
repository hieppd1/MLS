import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminOrderListItem {
  id: string;
  orderCode: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  voucherCode: string | null;
  paidAt: string | null;
  createdAt: string;
  itemCount: number;
}

export interface AdminOrderItem {
  id: string;
  bookId: string;
  bookTitle: string;
  bookType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface AdminOrderDetail extends AdminOrderListItem {
  paymentNote: string | null;
  items: AdminOrderItem[];
}

export interface AdminOrderListResult {
  items: AdminOrderListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GetAdminOrdersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  paymentMethod?: string;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const adminOrdersApi = createApi({
  reducerPath: "adminOrdersApi",
  baseQuery: withReauth(`${API_BASE}/api/v1/admin/orders`),
  tagTypes: ["AdminOrders"],
  endpoints: (builder) => ({
    getAdminOrders: builder.query<AdminOrderListResult, GetAdminOrdersParams>({
      query: (params) => ({
        url: "",
        params: { page: 1, pageSize: 20, ...params },
      }),
      providesTags: ["AdminOrders"],
    }),
    getAdminOrderDetail: builder.query<AdminOrderDetail, string>({
      query: (id) => `/${id}`,
      providesTags: (_res, _err, id) => [{ type: "AdminOrders", id }],
    }),
    adminConfirmPayment: builder.mutation<void, { id: string; note?: string }>({
      query: ({ id, note }) => ({
        url: `/${id}/confirm-payment`,
        method: "POST",
        body: { note: note ?? null },
      }),
      invalidatesTags: (_res, _err, { id }) => ["AdminOrders", { type: "AdminOrders", id }],
    }),
    adminCancelOrder: builder.mutation<void, string>({
      query: (id) => ({ url: `/${id}/cancel`, method: "POST" }),
      invalidatesTags: (_res, _err, id) => ["AdminOrders", { type: "AdminOrders", id }],
    }),
    adminUpdateOrderStatus: builder.mutation<void, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: (_res, _err, { id }) => ["AdminOrders", { type: "AdminOrders", id }],
    }),
  }),
});

export const {
  useGetAdminOrdersQuery,
  useGetAdminOrderDetailQuery,
  useAdminConfirmPaymentMutation,
  useAdminCancelOrderMutation,
  useAdminUpdateOrderStatusMutation,
} = adminOrdersApi;
