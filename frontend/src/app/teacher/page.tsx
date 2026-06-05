"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TeacherPortalHome() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/teacher/courses");
  }, [router]);
  return null;
}
