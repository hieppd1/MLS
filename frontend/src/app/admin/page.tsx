"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminDashboard() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/analytics");
  }, [router]);
  return null;
}
