import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsPageDto {
  items: NotificationDto[];
  nextCursor: string | null;
  unreadCount: number;
}

export interface MarkReadRequest {
  ids?: string[];
  all?: boolean;
}

export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery: withReauth(`${API_BASE}/api/v1`),
  tagTypes: ["Notification"],
  endpoints: (builder) => ({
    getNotifications: builder.query<
      NotificationsPageDto,
      { cursor?: string; limit?: number } | void
    >({
      query: (params) => {
        const { cursor, limit = 20 } = (params ?? {}) as { cursor?: string; limit?: number };
        const p = new URLSearchParams();
        if (cursor) p.set("cursor", cursor);
        p.set("limit", String(limit));
        return `/notifications?${p}`;
      },
      providesTags: ["Notification"],
    }),
    getUnreadCount: builder.query<{ count: number }, void>({
      query: () => "/notifications/unread-count",
      providesTags: ["Notification"],
    }),
    markRead: builder.mutation<void, MarkReadRequest>({
      query: (body: MarkReadRequest) => ({
        url: "/notifications/mark-read",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Notification"],
    }),
    registerDeviceToken: builder.mutation<
      void,
      { token: string; platform: "Web" | "Android" | "iOS" }
    >({
      query: (body: { token: string; platform: string }) => ({
        url: "/user-device-tokens",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkReadMutation,
  useRegisterDeviceTokenMutation,
} = notificationsApi;
