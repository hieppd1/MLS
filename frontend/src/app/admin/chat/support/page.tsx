"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  useInboxQuery,
  useGetConversationQuery,
  useListSupportMessagesQuery,
  useSendSupportMessageMutation,
  useAssignSupportConversationMutation,
  useCloseSupportConversationMutation,
  type SupportConversationStatus,
  type SupportMessage,
} from "@/lib/features/chat/supportChatApi";
import { useSupportChatHub } from "@/components/chat/useSupportChatHub";
import { useAppSelector } from "@/lib/hooks";
import { formatDate } from "@/lib/i18nFormat";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(iso: string, todayLabel: string, yesterdayLabel: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return todayLabel;
  if (d.toDateString() === yesterday.toDateString()) return yesterdayLabel;
  return formatDate(iso);
}

function groupByDate(messages: SupportMessage[], todayLabel: string, yesterdayLabel: string) {
  const groups: { label: string; items: SupportMessage[] }[] = [];
  for (const m of messages) {
    const label = formatDateLabel(m.createdAt, todayLabel, yesterdayLabel);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(m);
    else groups.push({ label, items: [m] });
  }
  return groups;
}

// ─── Avatar ─────────────────────────────────────────────────────────────────

function StudentAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </div>
  );
}

function SupportAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
      </svg>
    </div>
  );
}

// ─── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  const t = useTranslations("admin_chat_support");
  const map: Record<string, string> = {
    Open: "bg-emerald-100 text-emerald-700",
    Closed: "bg-gray-100 text-gray-500",
    Pending: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${map[status ?? ""] ?? "bg-gray-100 text-gray-500"}`}>
      {status === "Open" ? t("st_open") : status === "Closed" ? t("st_closed") : status ?? "—"}
    </span>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function AdminSupportPage() {
  const t = useTranslations("admin_chat_support");
  const isHydrated  = useAppSelector((s) => s.auth.isHydrated);
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const authReady   = isHydrated && !!accessToken;
  const [status, setStatus] = useState<SupportConversationStatus | undefined>("Open");
  const { data: inbox = [], refetch: refetchInbox } = useInboxQuery(
    { status },
    { skip: !authReady, refetchOnMountOrArgChange: true, pollingInterval: 15000 },
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!selected && inbox.length > 0) setSelected(inbox[0].id);
  }, [inbox, selected]);

  const filtered = inbox.filter((c) =>
    search === "" || c.studentId.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-white dark:bg-gray-950">
      {/* ── Sidebar ── */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("inbox")}</h2>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
              {inbox.filter((c) => c.status === "Open").length}
            </span>
          </div>
          {/* search */}
          <div className="relative mb-3">
            <svg className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search_student")}
              className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          {/* tabs */}
          <div className="flex rounded-lg bg-gray-100 p-0.5 text-xs dark:bg-gray-800">
            {(["Open", "Closed"] as SupportConversationStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`flex-1 rounded-md py-1 font-medium transition-colors ${
                  status === s
                    ? "bg-white text-indigo-700 shadow-sm dark:bg-gray-700 dark:text-indigo-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                {s === "Open" ? t("st_open") : t("st_closed")}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation list */}
        <ul className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
          {filtered.length === 0 && (
            <li className="px-4 py-8 text-center text-xs text-gray-400">{t("empty_list")}</li>
          )}
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setSelected(c.id)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                  selected === c.id
                    ? "bg-indigo-50 dark:bg-indigo-950/40"
                    : ""
                }`}
              >
                <StudentAvatar />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-semibold text-gray-800 dark:text-gray-200">
                      Student {c.studentId.slice(0, 8)}
                    </span>
                    <span className="shrink-0 text-[10px] text-gray-400">
                      {c.lastMessageAt
                        ? new Date(c.lastMessageAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                        : ""}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                    {c.lastMessagePreview ?? t("no_messages_yet")}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* ── Main panel ── */}
      <main className="flex min-w-0 flex-1">
        {selected ? (
          <SupportPanel key={selected} convId={selected} onChanged={refetchInbox} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-gray-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-12 w-12 opacity-30">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
            <span className="text-sm">{t("pick_conv")}</span>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Support Panel ───────────────────────────────────────────────────────────

function SupportPanel({ convId, onChanged }: { convId: string; onChanged: () => void }) {
  const tl = useTranslations("admin_chat_support");
  const { data: conv } = useGetConversationQuery(convId);
  const { data: history } = useListSupportMessagesQuery({ id: convId });
  const [send, { isLoading: sending }] = useSendSupportMessageMutation();
  const [assign] = useAssignSupportConversationMutation();
  const [close] = useCloseSupportConversationMutation();

  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (history) setMessages(history);
  }, [history]);

  useSupportChatHub({
    conversationId: convId,
    onMessage: (m) =>
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m])),
  });

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await send({ id: convId, type: "Text", content: trimmed }).unwrap();
      setText("");
    } catch {
      alert(tl("send_failed"));
    }
  };

  const groups = groupByDate(messages, tl("today"), tl("yesterday"));
  const isClosed = conv?.status !== "Open";

  return (
    <div className="flex h-full w-full flex-col bg-gray-50 dark:bg-gray-950">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <StudentAvatar />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Student {conv?.studentId.slice(0, 8)}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <StatusBadge status={conv?.status} />
              <span className="text-[10px] text-gray-400">
                {conv?.supportUserId ? tl("assigned") : tl("unassigned")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conv && !conv.supportUserId && (
            <button
              onClick={async () => { await assign(convId); onChanged(); }}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700"
            >
              {tl("btn_assign")}
            </button>
          )}
          {conv?.status === "Open" && (
            <button
              onClick={async () => { await close(convId); onChanged(); }}
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400"
            >
              {tl("btn_close")}
            </button>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        {groups.map((group) => (
          <div key={group.label}>
            {/* Date divider */}
            <div className="my-4 flex items-center gap-3">
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              <span className="rounded-full bg-gray-100 px-3 py-0.5 text-[11px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                {group.label}
              </span>
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
            </div>

            {/* Messages in this date group */}
            <div className="space-y-4">
              {group.items.map((m) => {
                const isSupport = m.senderRole === "Support";
                return (
                  <div
                    key={m.id}
                    className={`flex items-end gap-2.5 ${isSupport ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar */}
                    {isSupport ? <SupportAvatar /> : <StudentAvatar />}

                    {/* Bubble + meta */}
                    <div className={`flex max-w-[65%] flex-col gap-1 ${isSupport ? "items-end" : "items-start"}`}>
                      {/* Name + time */}
                      <div className={`flex items-center gap-2 text-[11px] text-gray-400 ${isSupport ? "flex-row-reverse" : "flex-row"}`}>
                        <span className="font-medium text-gray-600 dark:text-gray-300">
                          {isSupport ? tl("support_label") : `Student ${m.senderId?.slice(0, 8) ?? conv?.studentId.slice(0, 8)}`}
                        </span>
                        <span>{formatTime(m.createdAt)}</span>
                      </div>

                      {/* Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          isSupport
                            ? "rounded-br-sm bg-indigo-600 text-white"
                            : "rounded-bl-sm bg-white text-gray-900 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            {tl("no_messages")}
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <div className="border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        {isClosed ? (
          <p className="py-1 text-center text-xs text-gray-400">{tl("closed_note")}</p>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
              }}
              rows={1}
              placeholder={tl("reply_ph")}
              className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-indigo-900"
            />
            <button
              onClick={submit}
              disabled={sending || !text.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
