"use client";

import { useParams, useRouter } from "next/navigation";

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">
          ← Quay lại
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Chi tiết Tenant</h1>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-3">
          <code className="rounded bg-purple-100 px-2.5 py-1 text-sm font-mono text-purple-700">
            {params.id}
          </code>
        </div>

        <p className="text-sm text-gray-500">
          Quản lý chi tiết tenant, cấu hình domain và trạng thái sẽ được triển khai trong Phase 4.
        </p>

        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
          SuperAdmin Tenant Management API — Phase 4 roadmap.
        </div>
      </div>
    </div>
  );
}
