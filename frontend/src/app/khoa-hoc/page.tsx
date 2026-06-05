"use client";
// /khoa-hoc - legacy alias. Redirects to /courses.
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function KhoaHocRedirectPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/courses"); }, [router]);
  return null;
}