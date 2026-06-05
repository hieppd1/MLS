"use client";
/**
 * /session/[id] — legacy alias. Redirects to /learn/[id].
 */
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function SessionRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => {
    if (id) router.replace(`/learn/${id}`);
  }, [id, router]);
  return null;
}