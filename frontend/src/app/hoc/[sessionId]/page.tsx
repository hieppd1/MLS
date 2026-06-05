"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * /hoc/[sessionId] — legacy alias. Redirects to /learn/[id].
 */
export default function HocRedirectPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/learn/${sessionId}`);
  }, [sessionId, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
    </div>
  );
}
