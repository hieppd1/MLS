import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CheckoutItem {
  bookId?: string | null;
  title: string;
  type: string;
  unitPrice: number;
  quantity: number;
  slug?: string | null;
  coverColor?: string | null;
  coverEmoji?: string | null;
  coverUrl?: string | null;
  // Phase 5: course items
  itemType?: "Book" | "Course";
  courseId?: string | null;
}

export interface CheckoutRequest {
  items: CheckoutItem[];
  paymentMethod?: string;
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  shippingProvince?: string;
  shippingDistrict?: string;
  shippingWard?: string;
  notes?: string;
  voucherCode?: string;
}

export interface CheckoutResult {
  orderId: string;
  orderCode: string;
  totalAmount: number;
  finalAmount: number;
  paymentMethod: string;
  paymentUrl: string | null;
}

export interface OrderSummary {
  id: string;
  orderCode: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  finalAmount: number;
  itemCount: number;
  createdAt: string;
  paidAt: string | null;
}

export interface OrderItem {
  bookId: string | null;
  bookTitle: string;
  bookType: string;
  bookSlug: string | null;
  coverColor: string | null;
  coverEmoji: string | null;
  coverUrl: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  // Phase 5
  itemType?: "Book" | "Course";
  courseId?: string | null;
  courseSlug?: string | null;
}

export interface Shipping {
  name: string;
  phone: string;
  address: string;
  province: string | null;
  district: string | null;
  ward: string | null;
  notes: string | null;
}

export interface ActivationCode {
  id: string;
  code: string;
  bookId: string;
  status: string;
  expiresAt: string | null;
}

export interface OrderDetail {
  id: string;
  orderCode: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentNote: string | null;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  voucherCode: string | null;
  createdAt: string;
  paidAt: string | null;
  shipping: Shipping | null;
  items: OrderItem[];
  activationCodes?: ActivationCode[] | null;
}

export interface PagedOrdersResult {
  items: OrderSummary[];
  total: number;
  page: number;
  pageSize: number;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const ordersApi = createApi({
  reducerPath: "ordersApi",
  baseQuery: withReauth(API_BASE),
  tagTypes: ["Order"],
  endpoints: (builder) => ({
    createCheckout: builder.mutation<CheckoutResult, CheckoutRequest>({
      query: (body) => ({ url: "/api/v1/checkout", method: "POST", body }),
      invalidatesTags: ["Order"],
    }),

    getMyOrders: builder.query<PagedOrdersResult, { page?: number; pageSize?: number }>({
      query: ({ page = 1, pageSize = 10 } = {}) =>
        `/api/v1/orders?page=${page}&pageSize=${pageSize}`,
      providesTags: ["Order"],
    }),

    getOrderById: builder.query<OrderDetail, string>({
      query: (id) => `/api/v1/orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Order", id }],
    }),

    getOrderByCode: builder.query<OrderDetail, string>({
      query: (code) => `/api/v1/orders/code/${code}`,
      providesTags: (_r, _e, code) => [{ type: "Order", id: `code-${code}` }],
    }),

    cancelOrder: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/v1/orders/${id}/cancel`, method: "DELETE" }),
      invalidatesTags: ["Order"],
    }),
  }),
});

export const {
  useCreateCheckoutMutation,
  useGetMyOrdersQuery,
  useGetOrderByIdQuery,
  useGetOrderByCodeQuery,
  useLazyGetOrderByCodeQuery,
  useCancelOrderMutation,
} = ordersApi;
