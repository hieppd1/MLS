"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Redirects old lesson player URLs to the session player. */
export default function LessonPlayerRedirect() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/courses/sessions/${lessonId}`);
  }, [lessonId, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Redirecting…</p>
    </div>
  );
}