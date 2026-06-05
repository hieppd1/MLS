"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  useListMessagesQuery,
  useSendMessageMutation,
  useDeleteMessageMutation,
  useMarkReadMutation,
  useGetGroupDetailQuery,
  type ChatMessage,
} from "@/lib/features/chat/chatApi";
import { useGroupChatHub } from "./useGroupChatHub";
import MessageComposer from "./MessageComposer";
import { useAppSelector } from "@/lib/hooks";
import { showToast, showConfirm } from "@/components/ui/Toaster";

interface Props {
  groupId: string;
  onBack?: () => void;
}

export default function ChatRoom({ groupId, onBack }: Props) {
  const { data: detail } = useGetGroupDetailQuery(groupId);
  const { data: page, refetch } = useListMessagesQuery({ groupId, limit: 50 });
  const [send, { isLoading: sending }] = useSendMessageMutation();
  const [deleteMsg] = useDeleteMessageMutation();
  const [markRead] = useMarkReadMutation();
  const me = useAppSelector((s) => s.auth.user?.id ?? null);
  const t = useTranslations("chat");
  const locale = useLocale();
  const localeTag = locale === "vi" ? "vi-VN" : locale === "ko" ? "ko-KR" : "en-US";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (page?.items) setMessages(page.items);
  }, [page]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      markRead({ groupId, lastMessageId: last.id }).catch(() => null);
    }
  }, [messages, groupId, markRead]);

  const { sendTyping, isConnected } = useGroupChatHub({
    groupId,
    onMessageReceived: (msg) =>
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg])),
    onMessageDeleted: ({ id }) =>
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isDeleted: true, content: null } : m))
      ),
    onUserTyping: (userId) => {
      if (userId === me) return;
      setTypingUsers((prev) => new Set(prev).add(userId));
      setTimeout(() => {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }, 3000);
    },
  });

  const onSend = async (
    content: string,
    attachments: ChatMessage["attachments"],
    type: ChatMessage["type"],
  ) => {
    try {
      await send({
        groupId,
        type,
        content: content || undefined,
        attachments: attachments.length
          ? attachments.map((a) => ({
              fileUrl: a.fileUrl,
              fileName: a.fileName,
              mimeType: a.mimeType ?? undefined,
              sizeBytes: a.sizeBytes,
              width: a.width ?? undefined,
              height: a.height ?? undefined,
            }))
          : undefined,
      }).unwrap();
    } catch (err) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? t("send_failed");
      showToast(msg, "error");
    }
  };

  const onDelete = async (messageId: string) => {
    const ok = await showConfirm(t("confirm_delete_msg"));
    if (!ok) return;
    try {
      await deleteMsg({ groupId, messageId }).unwrap();
    } catch {
      showToast(t("delete_msg_failed"), "error");
    }
  };

  if (!detail) {
    return <div className="flex flex-1 items-center justify-center text-gray-500">{t("loading")}</div>;
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden flex-shrink-0 p-1 -ml-1 rounded-full text-gray-500 hover:bg-gray-100"
              aria-label={t("back")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{detail.name}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("room_members", { cur: detail.currentMembers, max: detail.maxMembers, type: detail.type })}
              {isConnected ? ` · ${t("room_online")}` : ` · ${t("room_offline")}`}
            </p>
          </div>
        </div>
        <button onClick={() => refetch()} className="text-xs text-indigo-600 hover:underline">
          {t("reload")}
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {[...messages]
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .map((m, idx, sorted) => {
          const mine = m.senderId === me;
          const prev = sorted[idx - 1];
          const sameSenderAsPrev =
            !!prev && prev.senderId === m.senderId &&
            new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000;
          const showHeader = !sameSenderAsPrev;
          const initials = m.senderId.slice(0, 2).toUpperCase();
          const hue = parseInt(m.senderId.slice(0, 8), 16) % 360;
          const avatarBg = `hsl(${hue}, 60%, 55%)`;
          const time = new Date(m.createdAt).toLocaleTimeString(localeTag, { hour: "2-digit", minute: "2-digit" });
          const atts = m.attachments ?? [];
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar slot (other party only, only on first of sequence) */}
              {!mine && (
                <div className="w-9 flex-shrink-0">
                  {showHeader ? (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: avatarBg }}>
                      {initials}
                    </div>
                  ) : null}
                </div>
              )}
              <div className={`flex max-w-[70%] flex-col ${mine ? "items-end" : "items-start"}`}>
                {showHeader && (
                  <div className={`mb-0.5 flex items-baseline gap-2 px-1 text-[11px] text-gray-500 ${mine ? "flex-row-reverse" : ""}`}>
                    {!mine && <span className="font-semibold text-gray-700 dark:text-gray-200">{t("student_label", { id: initials })}</span>}
                    <span>{time}</span>
                  </div>
                )}
                <div className="group relative">
                  {m.isDeleted ? (
                    <div className={`rounded-2xl px-3 py-2 text-sm italic opacity-60 ${mine ? "bg-indigo-600 text-white" : "bg-white text-gray-900 border border-gray-200 dark:bg-gray-800 dark:text-gray-100"}`}>
                      {t("msg_deleted")}
                    </div>
                  ) : (
                    <>
                      {m.content && (
                        <div className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? "bg-indigo-600 text-white" : "bg-white text-gray-900 border border-gray-200 dark:bg-gray-800 dark:text-gray-100"}`}>
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        </div>
                      )}
                      {atts.length > 0 && (
                        <div className={`mt-1 space-y-1 ${mine ? "flex flex-col items-end" : ""}`}>
                          {atts.map((a) => (
                            <div key={a.id}>
                              {a.mimeType?.startsWith("image/") ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={a.fileUrl}
                                  alt={a.fileName}
                                  className="max-h-64 max-w-[260px] rounded-lg border border-gray-200 object-cover"
                                />
                              ) : (
                                <a
                                  href={a.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`inline-block rounded-lg px-3 py-2 text-xs underline ${mine ? "bg-indigo-700 text-white" : "bg-gray-100 text-gray-800"}`}
                                >
                                  📎 {a.fileName}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {mine && !m.isDeleted && (
                    <button
                      onClick={() => onDelete(m.id)}
                      className="absolute -top-2 right-0 hidden rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] text-white group-hover:block"
                    >×</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {typingUsers.size > 0 && (
          <p className="ml-11 text-xs italic text-gray-500">
            {t("typing", { n: typingUsers.size })}
          </p>
        )}
      </div>

      {/* Composer */}
      <MessageComposer
        onSend={onSend}
        onTyping={() => sendTyping()}
        disabled={sending || detail.myStatus !== "Approved"}
        disabledReason={
          detail.myStatus === "Pending"
            ? t("composer_pending")
            : detail.myStatus !== "Approved"
            ? t("composer_not_member")
            : undefined
        }
      />
    </div>
  );
}
