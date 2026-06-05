"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  useOpenMineMutation,
  useListSupportMessagesQuery,
  useSendSupportMessageMutation,
  supportChatApi,
} from "@/lib/features/chat/supportChatApi";
import { useSupportChatHub } from "./useSupportChatHub";
import { showToast } from "@/components/ui/Toaster";

const COMMON_EMOJIS = ["😀", "😂", "😍", "👍", "❤️", "🎉", "🙏", "👏", "🤔", "👀", "💯", "🔥", "✅", "😊", "😎", "🤝"];

export default function SupportChatWidget() {
  const t = useTranslations("chat");
  const locale = useLocale();
  const localeTag = locale === "vi" ? "vi-VN" : locale === "ko" ? "ko-KR" : "en-US";
  const user        = useAppSelector((s) => s.auth.user);
  const isHydrated  = useAppSelector((s) => s.auth.isHydrated);
  const isStudent   = user && !["Admin", "SuperAdmin", "Support"].includes(user.role ?? "");
  const dispatch    = useAppDispatch();

  const [open, setOpen]         = useState(false);
  const [text, setText]         = useState("");
  const [convId, setConvId]     = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [initing, setIniting]   = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef    = useRef<HTMLDivElement>(null);

  const [openMine]          = useOpenMineMutation();
  const [send, sendState]   = useSendSupportMessageMutation();
  const { data: msgs = [] } = useListSupportMessagesQuery(
    { id: convId ?? "", limit: 100 },
    { skip: !convId, pollingInterval: open && convId ? 5000 : 0 },
  );

  useSupportChatHub({
    conversationId: convId,
    enabled: open && !!convId,
    onMessage: () => {
      if (convId) {
        dispatch(supportChatApi.util.invalidateTags([{ type: "SupportMsgs", id: convId }]));
      }
    },
  });

  const initConv = useMemo(() => async () => {
    setIniting(true);
    setInitError(null);
    try {
      const c = await openMine().unwrap();
      setConvId(c.id);
    } catch (err) {
      const msg = (err as { status?: number; data?: { message?: string } })?.data?.message
        ?? t("support_init_error", { status: (err as { status?: number })?.status ?? "?" });
      console.error("[SupportChatWidget] openMine failed:", err);
      setInitError(msg);
    } finally {
      setIniting(false);
    }
  }, [openMine]);

  useEffect(() => {
    if (!open || !isHydrated || !isStudent || convId || initing || initError) return;
    void initConv();
  }, [open, isHydrated, isStudent, convId, initing, initError, initConv]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs.length, open]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content) return;
    if (!convId) {
      if (!initing) void initConv();
      return;
    }
    try {
      await send({ id: convId, type: "Text", content }).unwrap();
      setText("");
      setShowEmoji(false);
    } catch (e) {
      showToast(
        (e as { data?: { message?: string } })?.data?.message ?? t("send_text_failed"),
        "error",
      );
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !convId) return;
    // TODO backend file upload endpoint; for now placeholder name only
    try {
      await send({
        id: convId, type: "File",
        content: file.name, fileName: file.name,
        mimeType: file.type, sizeBytes: file.size,
        fileUrl: `pending://${file.name}`,
      }).unwrap();
    } catch {
      showToast(t("send_file_failed"), "error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const sortedMsgs = useMemo(
    () => [...msgs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [msgs],
  );

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [sortedMsgs.length]);

  if (!isHydrated || !isStudent) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label={t("support_open")}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#1565C0] text-white shadow-lg hover:bg-[#0d4a91] flex items-center justify-center"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[560px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1565C0] text-white">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <div>
            <p className="text-sm font-bold leading-tight">{t("support_title")}</p>
            <p className="text-[11px] opacity-90">{t("support_subtitle")}</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="text-white/90 hover:text-white text-xl leading-none" aria-label={t("support_close")}>×</button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 bg-gray-50 space-y-2">
        {initing && !convId && (
          <p className="text-xs text-gray-500 text-center mt-4">{t("support_init")}</p>
        )}
        {initError && (
          <div className="mx-auto max-w-[90%] rounded-lg border border-red-200 bg-red-50 p-3 text-center">
            <p className="text-xs text-red-700 mb-2">{initError}</p>
            <button
              onClick={() => void initConv()}
              className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >{t("support_retry")}</button>
          </div>
        )}
        {convId && sortedMsgs.length === 0 && !initError && (
          <p className="text-xs text-gray-500 text-center mt-4">{t("support_empty")}</p>
        )}
        {sortedMsgs.map((m, idx) => {
          const mine = m.senderId === user?.id;
          const prev = sortedMsgs[idx - 1];
          const sameSenderAsPrev =
            !!prev && prev.senderId === m.senderId &&
            new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000;
          const showHeader = !sameSenderAsPrev;
          const time = new Date(m.createdAt).toLocaleTimeString(localeTag, { hour: "2-digit", minute: "2-digit" });
          const senderName = mine ? t("sender_you") : t("support_title");
          const initials = mine ? "B" : "HT";
          const avatarBg = mine ? "#1565C0" : "#F59E0B";

          if (mine) {
            return (
              <div key={m.id} className="flex flex-col items-end">
                {showHeader && (
                  <span className="mb-0.5 mr-1 text-[10px] text-gray-400">{time}</span>
                )}
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[#1565C0] px-3 py-2 text-sm text-white">
                  {m.type === "File" ? (
                    <span>📎 {m.fileName ?? m.content}</span>
                  ) : (
                    <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span>
                  )}
                </div>
              </div>
            );
          }
          return (
            <div key={m.id} className="flex gap-2">
              <div className="w-8 flex-shrink-0">
                {showHeader ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ background: avatarBg }}>
                    {initials}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col items-start max-w-[80%]">
                {showHeader && (
                  <div className="mb-0.5 flex items-baseline gap-2 text-[11px]">
                    <span className="font-semibold text-gray-800">{senderName}</span>
                    <span className="text-gray-400">{time}</span>
                  </div>
                )}
                <div className="rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900">
                  {m.type === "File" ? (
                    <span>📎 {m.fileName ?? m.content}</span>
                  ) : (
                    <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Emoji popup */}
      {showEmoji && (
        <div className="px-3 py-2 bg-white border-t border-gray-100 grid grid-cols-8 gap-1">
          {COMMON_EMOJIS.map((e) => (
            <button key={e} type="button" onClick={() => setText(text + e)} className="text-xl hover:bg-gray-100 rounded">
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-gray-200 p-2 bg-white">
        <input ref={fileInputRef} type="file" hidden onChange={handleFile} />
        <div className="flex items-end gap-1">
          <button
            type="button" onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-[#1565C0] rounded" title={t("attach_file")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
          <button
            type="button" onClick={() => setShowEmoji(!showEmoji)}
            className={`p-2 rounded ${showEmoji ? "text-[#1565C0]" : "text-gray-500 hover:text-[#1565C0]"}`}
            title={t("emoji")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t("composer_placeholder")}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1565C0] max-h-24"
          />
          <button
            onClick={handleSend} disabled={sendState.isLoading || !text.trim() || initing}
            className="p-2 rounded-lg bg-[#1565C0] text-white hover:bg-[#0d4a91] disabled:bg-gray-300"
            title={convId ? t("send_btn") : t("connecting")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
