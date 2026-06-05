"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  useGetSessionCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useToggleLikeMutation,
  useReportCommentMutation,
  type CommentDto,
} from "@/lib/features/comments/commentsApi";
import { useVideoComments } from "@/lib/hooks/useVideoComments";
import { useAppSelector } from "@/lib/hooks";

interface Props {
  sessionId: string;
  /** Current video playback position in seconds */
  currentTimeSec?: number;
  /** Callback to seek the video to a specific second */
  onSeek?: (seconds: number) => void;
  /** Dark or light theme passed from parent */
  isDark?: boolean;
  /** Optional callback to hide/collapse the panel */
  onToggle?: () => void;
}

function formatTime(sec: number): string {
  if (!sec || sec < 0) return "";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function timeAgo(isoDate: string): string {
  const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

function Avatar({ name, src }: { name: string; src?: string | null }) {
  return (
    <img
      src={src || "/default-avatar.svg"}
      alt={name}
      className="w-8 h-8 rounded-full object-cover shrink-0 bg-gray-700"
      onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/default-avatar.svg"; }}
    />
  );
}

interface CommentItemProps {
  comment: CommentDto;
  sessionId: string;
  onReply: (parentId: string, userName: string) => void;
  onSeek?: (seconds: number) => void;
  currentUserId: string | null;
  isNearCurrent?: boolean;
  isNew?: boolean;
  isDark?: boolean;
}

function CommentItem({
  comment,
  sessionId,
  onReply,
  onSeek,
  currentUserId,
  isNearCurrent,
  isNew,
  isDark = true,
}: CommentItemProps) {
  const [toggleLike] = useToggleLikeMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [reportComment] = useReportCommentMutation();
  const [showReplies, setShowReplies] = useState(false);
  const [justNew, setJustNew] = useState(isNew ?? false);

  useEffect(() => {
    if (isNew) {
      const t = setTimeout(() => setJustNew(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isNew]);

  return (
    <div
      className={`flex gap-3 px-3 py-2.5 rounded-lg transition-all duration-500 ${
        justNew
          ? "bg-indigo-500/10 border border-indigo-500/20"
          : isNearCurrent
          ? "bg-yellow-500/5 border border-yellow-500/15"
          : isDark
          ? "border border-transparent hover:bg-white/[0.02]"
          : "border border-transparent hover:bg-gray-100"
      }`}
    >
      <Avatar name={comment.userName} src={comment.userAvatar} />

      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{comment.userName}</span>
          {comment.isPinned && (
            <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full font-medium">
              📌 Ghim
            </span>
          )}
          {comment.timestampSecond > 0 && onSeek ? (
            <button
              onClick={() => onSeek(comment.timestampSecond)}
              title={`Tua đến ${formatTime(comment.timestampSecond)}`}
              className="text-xs bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 hover:text-sky-300 px-2 py-0.5 rounded-full font-mono transition-colors"
            >
              ▶ {formatTime(comment.timestampSecond)}
            </button>
          ) : comment.timestampSecond > 0 ? (
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${isDark ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500"}`}>
              {formatTime(comment.timestampSecond)}
            </span>
          ) : null}
          <span className={`text-xs ml-auto ${isDark ? "text-gray-600" : "text-gray-400"}`}>{timeAgo(comment.createdAt)}</span>
        </div>

        {/* Content */}
        <p className={`text-sm mt-1 leading-relaxed break-words whitespace-pre-wrap ${isDark ? "text-gray-300" : "text-gray-700"}`}>
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => toggleLike({ sessionId, commentId: comment.id })}
            className={`flex items-center gap-1 text-xs transition-colors ${
              comment.userHasLiked ? "text-red-400" : isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <span className="text-base leading-none">{comment.userHasLiked ? "♥" : "♡"}</span>
            {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
          </button>

          <button
            onClick={() => onReply(comment.id, comment.userName)}
            className={`text-xs transition-colors ${isDark ? "text-gray-500 hover:text-sky-400" : "text-gray-400 hover:text-sky-500"}`}
          >
            Trả lời
          </button>

          {comment.replies.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-xs text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1"
            >
              <span className={`inline-block transition-transform ${showReplies ? "rotate-180" : ""}`}>▾</span>
              {showReplies ? "Ẩn" : `${comment.replies.length} trả lời`}
            </button>
          )}

          {currentUserId && currentUserId !== comment.userId && (
            <button
              onClick={() => {
                reportComment({ sessionId, commentId: comment.id });
                alert("Đã báo cáo bình luận");
              }}
              className={`text-xs transition-colors ml-auto ${isDark ? "text-gray-700 hover:text-gray-500" : "text-gray-300 hover:text-gray-500"}`}
            >
              Báo cáo
            </button>
          )}
          {currentUserId === comment.userId && (
            <button
              onClick={() => {
                if (confirm("Xóa bình luận này?")) deleteComment({ sessionId, commentId: comment.id });
              }}
              className="text-xs text-red-800 hover:text-red-500 transition-colors ml-auto"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Replies */}
        {showReplies && comment.replies.length > 0 && (
          <div className={`mt-2 ml-1 border-l-2 pl-3 space-y-0.5 ${isDark ? "border-gray-700/60" : "border-gray-200"}`}>
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                sessionId={sessionId}
                onReply={onReply}
                onSeek={onSeek}
                currentUserId={currentUserId}
                isDark={isDark}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentPanel({ sessionId, currentTimeSec = 0, onSeek, isDark = true, onToggle }: Props) {
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; userName: string } | null>(null);
  const [newCommentIds, setNewCommentIds] = useState<Set<string>>(new Set());
  const [localComments, setLocalComments] = useState<CommentDto[]>([]);
  const [filterNear, setFilterNear] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const userId = useAppSelector((s) => s.auth.user?.id);
  const isAuthenticated = useAppSelector((s) => !!s.auth.accessToken);

  const { data, isFetching } = useGetSessionCommentsQuery({ sessionId });
  const [createComment, { isLoading: creating }] = useCreateCommentMutation();

  const handleCommentAdded = useCallback(
    (comment: CommentDto) => {
      if (comment.userId !== userId) {
        setLocalComments((prev) => [comment, ...prev]);
        setNewCommentIds((prev) => new Set(prev).add(comment.id));
        listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [userId]
  );

  const { isConnected } = useVideoComments({
    sessionId,
    onCommentAdded: handleCommentAdded,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    setLocalComments([]);
  }, [data]);

  const allComments = [...localComments, ...(data?.items ?? [])];
  const displayed = allComments.filter((c) => {
    const timeOk = c.timestampSecond === 0 || currentTimeSec >= c.timestampSecond - 10;
    if (!timeOk) return false;
    if (filterNear && c.timestampSecond > 0) return Math.abs(c.timestampSecond - currentTimeSec) <= 30;
    return true;
  });

  function handleReply(parentId: string, userName: string) {
    setReplyTo({ id: parentId, userName });
    inputRef.current?.focus();
  }

  function stampTime() {
    const stamp = formatTime(currentTimeSec);
    setContent((prev) => (prev ? `${prev} ${stamp}` : stamp));
    inputRef.current?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    await createComment({
      sessionId,
      content: trimmed,
      timestampSecond: currentTimeSec,
      parentCommentId: replyTo?.id ?? null,
    });
    setContent("");
    setReplyTo(null);
  }

  return (
    <div className={`flex flex-col h-full border-l ${isDark ? "bg-[#0f0f0f] border-gray-800" : "bg-white border-gray-200"}`}>
      {/* ── Header ── */}
      <div className={`px-4 h-[46px] border-b flex items-center gap-2 ${isDark ? "border-gray-800" : "border-gray-200"}`}>
        <h3 className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
          Bình luận
          {data?.total != null && (
            <span className={`ml-1.5 font-normal ${isDark ? "text-gray-500" : "text-gray-400"}`}>{data.total}</span>
          )}
        </h3>

        {currentTimeSec > 0 && (
          <button
            onClick={() => setFilterNear(!filterNear)}
            title={filterNear ? "Hiển thị tất cả" : `Lọc bình luận gần ${formatTime(currentTimeSec)}`}
            className={`text-xs px-2 py-1 rounded-full transition-colors border ${
              filterNear
                ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
                : isDark
                ? "text-gray-500 hover:text-gray-300 border-gray-700"
                : "text-gray-500 hover:text-gray-700 border-gray-300"
            }`}
          >
            ⏱ {filterNear ? "Gần đây" : formatTime(currentTimeSec)}
          </button>
        )}

        {/* SignalR status dot */}
        <div
          title={isConnected ? "Đang kết nối realtime" : "Chưa kết nối realtime"}
          className={`ml-auto w-2 h-2 rounded-full transition-colors ${
            isConnected
              ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,.8)]"
              : "bg-gray-600"
          }`}
        />
        {onToggle && (
          <button
            onClick={onToggle}
            title="Ẩn bình luận"
            className={`ml-2 rounded p-1 transition ${
              isDark
                ? "text-gray-500 hover:bg-gray-800 hover:text-white"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Comment list ── */}
      <div ref={listRef} className="flex-1 overflow-y-auto py-1 scroll-smooth">
        {isFetching && displayed.length === 0 && (
          <div className="py-10 flex justify-center">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isFetching && displayed.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-2xl mb-2">💬</p>
            <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              {filterNear ? "Không có bình luận gần đoạn này" : "Chưa có bình luận nào"}
            </p>
            {filterNear && (
              <button onClick={() => setFilterNear(false)} className="mt-2 text-xs text-sky-400 hover:underline">
                Xem tất cả
              </button>
            )}
          </div>
        )}
        {displayed.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            sessionId={sessionId}
            onReply={handleReply}
            onSeek={onSeek}
            currentUserId={userId ?? null}
            isNearCurrent={currentTimeSec > 0 && Math.abs(comment.timestampSecond - currentTimeSec) <= 5}
            isNew={newCommentIds.has(comment.id)}
            isDark={isDark}
          />
        ))}
      </div>

      {/* ── Input area ── */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className={`border-t p-3 space-y-2 ${isDark ? "border-gray-800" : "border-gray-200"}`}>
          {replyTo && (
            <div className="flex items-center gap-2 text-xs text-sky-400 bg-sky-500/10 rounded-lg px-3 py-1.5">
              <span>
                Trả lời <strong className="text-sky-300">{replyTo.userName}</strong>
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-auto text-gray-500 hover:text-white transition-colors text-base leading-none"
                aria-label="Huỷ trả lời"
              >
                ×
              </button>
            </div>
          )}

          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            placeholder={replyTo ? `Trả lời ${replyTo.userName}…` : "Thêm bình luận… (Enter để gửi)"}
            rows={2}
            className={`w-full text-sm rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-sky-500 ${
              isDark
                ? "bg-gray-800/80 text-white placeholder:text-gray-600"
                : "bg-gray-100 text-gray-900 placeholder:text-gray-400 border border-gray-200"
            }`}
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={stampTime}
              title={`Chèn mốc ${formatTime(currentTimeSec)}`}
              className={`text-xs border rounded-lg px-2 py-1 transition-colors flex items-center gap-1 hover:border-sky-500/50 hover:text-sky-400 ${
                isDark ? "text-gray-500 border-gray-700" : "text-gray-500 border-gray-300"
              }`}
            >
              ⏱ {formatTime(currentTimeSec) || "0:00"}
            </button>
            <button
              type="submit"
              disabled={creating || !content.trim()}
              className="ml-auto text-sm bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-xl transition-colors font-medium"
            >
              {creating ? "Đang gửi…" : "Gửi"}
            </button>
          </div>
        </form>
      ) : (
        <div className="border-t border-gray-800 px-4 py-4 text-center text-sm text-gray-500">
          <a href="/auth/login" className="text-sky-400 hover:underline">Đăng nhập</a> để bình luận
        </div>
      )}
    </div>
  );
}

