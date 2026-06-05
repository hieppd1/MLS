"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LessonRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => { router.replace(`/courses/sessions/${id}`); }, [id, router]);
  return <div className="flex items-center justify-center min-h-screen"><p>Redirecting...</p></div>;
}