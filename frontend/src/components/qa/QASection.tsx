"use client";

import { useState } from "react";
import {
  useGetCommentsQuery,
  useCreateCommentMutation,
  type LessonCommentDto,
} from "../../lib/features/qa/lessonCommentsApi";import CommentThread from "./CommentThread";

interface Props {
  lessonId?: string;
  sessionId?: string;
}

export default function QASection({ lessonId, sessionId }: Props) {
  const [content, setContent] = useState("");
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const { data, isLoading, isFetching } = useGetCommentsQuery(
    { lessonId, sessionId, cursor, limit: 10 },
    { skip: !lessonId && !sessionId }
  );

  const [createComment, { isLoading: isPosting }] = useCreateCommentMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    try {
      await createComment({ lessonId, sessionId, content: trimmed }).unwrap();
      setContent("");
      setCursor(undefined);
    } catch {
      // error handled by RTK Query
    }
  }

  const items = data?.items ?? [];

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        Hỏi &amp; Đáp ({items.length})
      </h2>

      {/* Compose box */}
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Đặt câu hỏi hoặc chia sẻ ghi chú…"
          rows={3}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={isPosting || !content.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isPosting ? "Đang gửi…" : "Gửi câu hỏi"}
          </button>
        </div>
      </form>

      {/* Comments */}
      {isLoading ? (
        <p className="text-sm text-gray-400">Đang tải…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400">
          Chưa có câu hỏi nào. Hãy đặt câu hỏi đầu tiên!
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((comment: LessonCommentDto) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              lessonId={lessonId}
              sessionId={sessionId}
            />
          ))}
        </ul>
      )}

      {/* Load more */}
      {data?.nextCursor && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setCursor(data.nextCursor ?? undefined)}
            disabled={isFetching}
            className="text-sm text-blue-500 hover:text-blue-600 font-medium disabled:opacity-50"
          >
            {isFetching ? "Đang tải…" : "Xem thêm"}
          </button>
        </div>
      )}
    </section>
  );
}
