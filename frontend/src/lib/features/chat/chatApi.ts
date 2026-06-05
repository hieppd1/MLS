import { createApi } from "@reduxjs/toolkit/query/react";
import { withReauth } from "../../baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

// ── Types ────────────────────────────────────────────────────────────────────
export type ChatGroupType = "Public" | "Private";
export type ChatMessageType = "Text" | "Image" | "File" | "System";
export type ChatGroupMemberRole = "Owner" | "Moderator" | "Member";
export type ChatGroupMemberStatus = "Pending" | "Approved" | "Rejected";

export interface ChatGroupSummary {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  type: ChatGroupType;
  maxMembers: number;
  currentMembers: number;
  tags: string | null;
  myRole: ChatGroupMemberRole;
  myStatus: ChatGroupMemberStatus;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface ChatGroupDiscovery {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  type: ChatGroupType;
  maxMembers: number;
  currentMembers: number;
  tags: string | null;
  myStatus: ChatGroupMemberStatus | null;
}

export interface ChatGroupMember {
  userId: string;
  role: ChatGroupMemberRole;
  status: ChatGroupMemberStatus;
  joinedAt: string | null;
}

export interface ChatGroupDetail {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  type: ChatGroupType;
  maxMembers: number;
  currentMembers: number;
  tags: string | null;
  createdBy: string;
  members: ChatGroupMember[];
  myRole: ChatGroupMemberRole | null;
  myStatus: ChatGroupMemberStatus | null;
}

export interface ChatAttachment {
  id: string;
  fileUrl: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number;
  width: number | null;
  height: number | null;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  type: ChatMessageType;
  content: string | null;
  replyToId: string | null;
  isDeleted: boolean;
  createdAt: string;
  attachments: ChatAttachment[];
}

export interface ChatMessagePage {
  items: ChatMessage[];
  nextCursor: string | null;
}

export interface ChatUploadResult {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

// ── API Slice ────────────────────────────────────────────────────────────────
export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: withReauth(`${API_BASE}/api/v1`),
  tagTypes: ["ChatGroups", "ChatGroupDetail", "ChatMessages"],
  endpoints: (builder) => ({
    listMyGroups: builder.query<ChatGroupSummary[], void>({
      query: () => "/chat-groups/mine",
      providesTags: ["ChatGroups"],
    }),
    discoverGroups: builder.query<
      ChatGroupDiscovery[],
      { search?: string; type?: ChatGroupType; page?: number; pageSize?: number }
    >({
      query: ({ search, type, page = 1, pageSize = 20 }) => {
        const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
        if (search) p.set("search", search);
        if (type) p.set("type", type);
        return `/chat-groups/discover?${p}`;
      },
    }),
    getGroupDetail: builder.query<ChatGroupDetail, string>({
      query: (id) => `/chat-groups/${id}`,
      providesTags: (_r, _e, id) => [{ type: "ChatGroupDetail", id }],
    }),
    createGroup: builder.mutation<
      { id: string },
      { name: string; type: ChatGroupType; description?: string; avatarUrl?: string; maxMembers?: number; tags?: string }
    >({
      query: (body) => ({ url: "/chat-groups", method: "POST", body }),
      invalidatesTags: ["ChatGroups"],
    }),
    updateGroup: builder.mutation<
      void,
      { id: string; name?: string; description?: string; avatarUrl?: string; maxMembers?: number; tags?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/chat-groups/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => ["ChatGroups", { type: "ChatGroupDetail", id }],
    }),
    deleteGroup: builder.mutation<void, string>({
      query: (id) => ({ url: `/chat-groups/${id}`, method: "DELETE" }),
      invalidatesTags: ["ChatGroups"],
    }),
    joinGroup: builder.mutation<{ status: ChatGroupMemberStatus }, string>({
      query: (id) => ({ url: `/chat-groups/${id}/join`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => ["ChatGroups", { type: "ChatGroupDetail", id }],
    }),
    leaveGroup: builder.mutation<void, string>({
      query: (id) => ({ url: `/chat-groups/${id}/leave`, method: "POST" }),
      invalidatesTags: ["ChatGroups"],
    }),
    approveMember: builder.mutation<void, { groupId: string; memberId: string }>({
      query: ({ groupId, memberId }) => ({
        url: `/chat-groups/${groupId}/members/${memberId}/approve`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { groupId }) => [{ type: "ChatGroupDetail", id: groupId }],
    }),
    rejectMember: builder.mutation<void, { groupId: string; memberId: string }>({
      query: ({ groupId, memberId }) => ({
        url: `/chat-groups/${groupId}/members/${memberId}/reject`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { groupId }) => [{ type: "ChatGroupDetail", id: groupId }],
    }),
    removeMember: builder.mutation<void, { groupId: string; memberId: string }>({
      query: ({ groupId, memberId }) => ({
        url: `/chat-groups/${groupId}/members/${memberId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { groupId }) => [{ type: "ChatGroupDetail", id: groupId }],
    }),
    promoteMember: builder.mutation<void, { groupId: string; memberId: string; role: ChatGroupMemberRole }>({
      query: ({ groupId, memberId, role }) => ({
        url: `/chat-groups/${groupId}/members/${memberId}/promote`,
        method: "POST",
        body: { role },
      }),
      invalidatesTags: (_r, _e, { groupId }) => [{ type: "ChatGroupDetail", id: groupId }],
    }),

    // Messages
    listMessages: builder.query<
      ChatMessagePage,
      { groupId: string; cursor?: string; limit?: number }
    >({
      query: ({ groupId, cursor, limit = 50 }) => {
        const p = new URLSearchParams({ limit: String(limit) });
        if (cursor) p.set("cursor", cursor);
        return `/chat-groups/${groupId}/messages?${p}`;
      },
      providesTags: (_r, _e, { groupId }) => [{ type: "ChatMessages", id: groupId }],
    }),
    sendMessage: builder.mutation<
      { id: string },
      {
        groupId: string;
        type: ChatMessageType;
        content?: string;
        replyToId?: string;
        attachments?: Array<{
          fileUrl: string; fileName: string; mimeType?: string; sizeBytes: number; width?: number; height?: number;
        }>;
      }
    >({
      query: ({ groupId, ...body }) => ({
        url: `/chat-groups/${groupId}/messages`,
        method: "POST",
        body,
      }),
    }),
    deleteMessage: builder.mutation<void, { groupId: string; messageId: string }>({
      query: ({ groupId, messageId }) => ({
        url: `/chat-groups/${groupId}/messages/${messageId}`,
        method: "DELETE",
      }),
    }),
    markRead: builder.mutation<void, { groupId: string; lastMessageId: string }>({
      query: ({ groupId, lastMessageId }) => ({
        url: `/chat-groups/${groupId}/messages/read`,
        method: "POST",
        body: { lastMessageId },
      }),
      invalidatesTags: ["ChatGroups"],
    }),
  }),
});

export const {
  useListMyGroupsQuery,
  useDiscoverGroupsQuery,
  useGetGroupDetailQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useJoinGroupMutation,
  useLeaveGroupMutation,
  useApproveMemberMutation,
  useRejectMemberMutation,
  useRemoveMemberMutation,
  usePromoteMemberMutation,
  useListMessagesQuery,
  useSendMessageMutation,
  useDeleteMessageMutation,
  useMarkReadMutation,
} = chatApi;
