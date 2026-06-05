"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Lessons have been merged into Sessions. Redirect to the session page. */
export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/teacher/sessions/${id}`);
  }, [id, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Redirecting to session editor&hellip;</p>
    </div>
  );
}
