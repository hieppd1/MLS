import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ShippingFeeResult {
  success: boolean;
  fee: number;
  serviceName: string | null;
  errorMessage: string | null;
}

export interface CalculateFeeRequest {
  receiverProvinceCode: string;
  receiverDistrictCode: string;
  weight?: number;
}

export interface TrackingEvent {
  status: string;
  description: string | null;
  occurredAt: string | null;
}

export interface ShipmentDetail {
  id: string;
  orderId: string;
  provider: string;
  trackingNumber: string | null;
  status: string;
  shippingFee: number;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  provinceCode: string | null;
  districtCode: string | null;
  wardCode: string | null;
  createdAt: string;
  updatedAt: string | null;
  history: TrackingEvent[];
}

export interface TrackingResult {
  success: boolean;
  status: string;
  events: TrackingEvent[];
  errorMessage: string | null;
}

// Admin types
export interface AdminShipmentRow {
  id: string;
  orderId: string;
  orderCode: string;
  provider: string;
  trackingNumber: string | null;
  status: string;
  shippingFee: number;
  receiverName: string;
  receiverPhone: string;
  createdAt: string;
}

export interface AdminShipmentsResponse {
  items: AdminShipmentRow[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Shipping status display config ────────────────────────────────────────────

export const SHIPPING_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  Pending:   { label: "Chờ lấy hàng",  color: "#92400e", bg: "#fef3c7", icon: "⏳" },
  PickedUp:  { label: "Đã lấy hàng",   color: "#1d4ed8", bg: "#dbeafe", icon: "📦" },
  InTransit: { label: "Đang vận chuyển", color: "#7c3aed", bg: "#ede9fe", icon: "🚚" },
  Delivered: { label: "Đã giao",        color: "#065f46", bg: "#d1fae5", icon: "✅" },
  Failed:    { label: "Giao thất bại",  color: "#991b1b", bg: "#fee2e2", icon: "❌" },
  Returned:  { label: "Đã hoàn trả",   color: "#6b7280", bg: "#f3f4f6", icon: "↩️" },
  Cancelled: { label: "Đã huỷ",        color: "#991b1b", bg: "#fee2e2", icon: "🚫" },
};

// ── RTK Query API ─────────────────────────────────────────────────────────────

export const shippingApi = createApi({
  reducerPath: "shippingApi",
  baseQuery: withReauth(API_BASE),
  tagTypes: ["Shipment", "AdminShipment"],
  endpoints: (builder) => ({

    calculateFee: builder.mutation<ShippingFeeResult, CalculateFeeRequest>({
      query: (body) => ({
        url: "/api/v1/shipping/calculate-fee",
        method: "POST",
        body,
      }),
    }),

    getShipmentByOrderId: builder.query<ShipmentDetail, string>({
      query: (orderId) => `/api/v1/shipping/by-order/${orderId}`,
      providesTags: (_r, _e, orderId) => [{ type: "Shipment", id: orderId }],
    }),

    trackShipment: builder.query<TrackingResult, string>({
      query: (trackingNumber) => `/api/v1/shipping/tracking/${encodeURIComponent(trackingNumber)}`,
    }),

    syncShipment: builder.mutation<ShipmentDetail, string>({
      query: (id) => ({ url: `/api/v1/shipping/${id}/sync`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Shipment", id }],
    }),

    cancelShipment: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/v1/shipping/${id}/cancel`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Shipment", id }],
    }),

    // Admin
    getAdminShipments: builder.query<AdminShipmentsResponse, { page?: number; pageSize?: number; status?: string; search?: string }>({
      query: ({ page = 1, pageSize = 20, status, search } = {}) => {
        const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
        if (status) params.set("status", status);
        if (search) params.set("search", search);
        return `/api/v1/admin/shipments?${params}`;
      },
      providesTags: ["AdminShipment"],
    }),

    adminSyncShipment: builder.mutation<ShipmentDetail, string>({
      query: (id) => ({ url: `/api/v1/admin/shipments/${id}/sync`, method: "POST" }),
      invalidatesTags: ["AdminShipment"],
    }),

    adminCancelShipment: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/v1/admin/shipments/${id}/cancel`, method: "POST" }),
      invalidatesTags: ["AdminShipment"],
    }),
  }),
});

export const {
  useCalculateFeeMutation,
  useGetShipmentByOrderIdQuery,
  useTrackShipmentQuery,
  useSyncShipmentMutation,
  useCancelShipmentMutation,
  useGetAdminShipmentsQuery,
  useAdminSyncShipmentMutation,
  useAdminCancelShipmentMutation,
} = shippingApi;
