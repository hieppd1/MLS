"use client";
/**
 * /khoa-hoc/[id] - legacy alias. Redirects to /courses/[id].
 */
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function KhoaHocRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => {
    if (id) router.replace(`/courses/${id}`);
  }, [id, router]);
  return null;
}