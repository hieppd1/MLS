import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";
import type { ChatMessageType } from "./chatApi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

export type SupportSenderRole = "Student" | "Support";
export type SupportConversationStatus = "Open" | "Closed";

export interface SupportConversation {
  id: string;
  studentId: string;
  supportUserId: string | null;
  status: SupportConversationStatus;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: SupportSenderRole;
  type: ChatMessageType;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
}

export interface SupportInboxItem {
  id: string;
  studentId: string;
  supportUserId: string | null;
  status: SupportConversationStatus;
  lastMessageAt: string | null;
  createdAt: string;
  lastMessagePreview: string | null;
  unreadFromStudent: number;
}

export const supportChatApi = createApi({
  reducerPath: "supportChatApi",
  baseQuery: withReauth(`${API_BASE}/api/v1/support/conversations`),
  tagTypes: ["SupportConv", "SupportMsgs", "SupportInbox"],
  endpoints: (builder) => ({
    openMine: builder.mutation<{ id: string }, void>({
      query: () => ({ url: "/mine/open", method: "POST" }),
    }),
    getConversation: builder.query<SupportConversation, string>({
      query: (id) => `/${id}`,
      providesTags: (_r, _e, id) => [{ type: "SupportConv", id }],
    }),
    listMessages: builder.query<SupportMessage[], { id: string; limit?: number }>({
      query: ({ id, limit = 100 }) => `/${id}/messages?limit=${limit}`,
      providesTags: (_r, _e, { id }) => [{ type: "SupportMsgs", id }],
    }),
    send: builder.mutation<
      { id: string },
      { id: string; type: ChatMessageType; content?: string; fileUrl?: string; fileName?: string; mimeType?: string; sizeBytes?: number }
    >({
      query: ({ id, ...body }) => ({ url: `/${id}/messages`, method: "POST", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "SupportMsgs", id }, "SupportInbox"],
    }),
    close: builder.mutation<void, string>({
      query: (id) => ({ url: `/${id}/close`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "SupportConv", id }, "SupportInbox"],
    }),
    inbox: builder.query<
      SupportInboxItem[],
      { status?: SupportConversationStatus; assignedTo?: string; page?: number; pageSize?: number }
    >({
      query: ({ status, assignedTo, page = 1, pageSize = 20 }) => {
        const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
        if (status) p.set("status", status);
        if (assignedTo) p.set("assignedTo", assignedTo);
        return `/inbox?${p}`;
      },
      providesTags: ["SupportInbox"],
    }),
    assign: builder.mutation<void, string>({
      query: (id) => ({ url: `/${id}/assign`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "SupportConv", id }, "SupportInbox"],
    }),
  }),
});

export const {
  useOpenMineMutation,
  useGetConversationQuery,
  useListMessagesQuery: useListSupportMessagesQuery,
  useSendMutation: useSendSupportMessageMutation,
  useCloseMutation: useCloseSupportConversationMutation,
  useInboxQuery,
  useAssignMutation: useAssignSupportConversationMutation,
} = supportChatApi;
