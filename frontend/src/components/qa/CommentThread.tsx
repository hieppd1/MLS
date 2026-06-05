"use client";

import { useState } from "react";
import { useAppSelector } from "../../lib/hooks";
import {
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useToggleUpvoteMutation,
  useTogglePinMutation,
  type LessonCommentDto,
} from "../../lib/features/qa/lessonCommentsApi";
import { formatDateTime } from "@/lib/i18nFormat";

interface Props {
  comment: LessonCommentDto;
  lessonId?: string;
  sessionId?: string;
}

export default function CommentThread({ comment, lessonId, sessionId }: Props) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const currentRole = useAppSelector((s) => s.auth.user?.role);
  const isTeacherOrAdmin =
    currentRole === "Teacher" || currentRole === "Admin" || currentRole === "SuperAdmin";

  const [createComment, { isLoading: isReplying }] = useCreateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [toggleUpvote] = useToggleUpvoteMutation();
  const [togglePin] = useTogglePinMutation();

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = replyContent.trim();
    if (!trimmed) return;
    try {
      await createComment({
        lessonId,
        sessionId,
        parentId: comment.id,
        content: trimmed,
      }).unwrap();
      setReplyContent("");
      setReplyOpen(false);
    } catch {
      // noop
    }
  }

  if (comment.isDeleted) {
    return (
      <li className="text-sm text-gray-400 italic">[Bình luận đã bị xóa]</li>
    );
  }

  return (
    <li className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 text-sm font-bold">
          {comment.authorName?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
              {comment.authorName}
            </span>
            {comment.isPinned && (
              <span className="text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 px-1.5 py-0.5 rounded font-medium">
                📌 Đã ghim
              </span>
            )}
            <span className="text-xs text-gray-400 ml-auto">
              {formatDateTime(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <button
              onClick={() => toggleUpvote(comment.id)}
              className={`flex items-center gap-1 hover:text-blue-500 transition-colors ${
                comment.isUpvotedByMe ? "text-blue-500 font-medium" : ""
              }`}
            >
              👍 {comment.upvoteCount > 0 ? comment.upvoteCount : "Hữu ích"}
            </button>

            {!comment.parentId && (
              <button
                onClick={() => setReplyOpen((v) => !v)}
                className="hover:text-blue-500 transition-colors"
              >
                💬 Trả lời
              </button>
            )}

            {isTeacherOrAdmin && !comment.parentId && (
              <button
                onClick={() => togglePin(comment.id)}
                className={`hover:text-yellow-500 transition-colors ${
                  comment.isPinned ? "text-yellow-500" : ""
                }`}
              >
                📌 {comment.isPinned ? "Bỏ ghim" : "Ghim"}
              </button>
            )}

            {(currentUserId === comment.authorId || isTeacherOrAdmin) && (
              <button
                onClick={() => deleteComment(comment.id)}
                className="hover:text-red-500 transition-colors ml-auto"
              >
                🗑️ Xóa
              </button>
            )}
          </div>

          {/* Reply form */}
          {replyOpen && (
            <form onSubmit={handleReply} className="mt-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Viết câu trả lời…"
                rows={2}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex gap-2 mt-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setReplyOpen(false);
                    setReplyContent("");
                  }}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded-lg border border-gray-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isReplying || !replyContent.trim()}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {isReplying ? "Đang gửi…" : "Gửi"}
                </button>
              </div>
            </form>
          )}

          {/* Replies */}
          {comment.replies.length > 0 && (
            <ul className="mt-3 pl-4 border-l-2 border-gray-100 dark:border-gray-600 space-y-3">
              {comment.replies.map((reply) => (
                <li key={reply.id} className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 text-xs font-bold">
                    {reply.authorName?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {reply.authorName}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {formatDateTime(reply.createdAt)}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 whitespace-pre-wrap">
                      {reply.isDeleted
                        ? "[Bình luận đã bị xóa]"
                        : reply.content}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <button
                        onClick={() => toggleUpvote(reply.id)}
                        className={`flex items-center gap-1 hover:text-blue-500 transition-colors ${
                          reply.isUpvotedByMe ? "text-blue-500" : ""
                        }`}
                      >
                        👍 {reply.upvoteCount > 0 ? reply.upvoteCount : ""}
                      </button>
                      {(currentUserId === reply.authorId || isTeacherOrAdmin) && (
                        <button
                          onClick={() => deleteComment(reply.id)}
                          className="hover:text-red-500 transition-colors ml-auto"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}
