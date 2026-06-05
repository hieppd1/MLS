"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * /courses/sessions/[sessionId] — legacy alias. Redirects to /learn/[id].
 */
export default function CourseSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  useEffect(() => {
    if (sessionId) {
      router.replace(`/learn/${sessionId}`);
    }
  }, [sessionId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <span className="text-sm text-gray-400">Đang tải bài học...</span>
      </div>
    </div>
  );
}
