"use client";

import { useRouter } from "next/navigation";

export default function NewTenantPage() {
  const router = useRouter();

  return (
    <div className="max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">
          ← Quay lại
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Thêm Tenant mới</h1>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Tên tổ chức</label>
          <input
            type="text"
            placeholder="VD: Trường THPT XYZ"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Slug</label>
          <input
            type="text"
            placeholder="VD: thpt-xyz"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          />
          <p className="mt-1 text-xs text-gray-400">Chỉ chứa chữ thường, số và dấu gạch ngang.</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Email liên hệ</label>
          <input
            type="email"
            placeholder="admin@thpt-xyz.edu.vn"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          />
        </div>

        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
          Tính năng tạo Tenant sẽ được triển khai trong Phase 4 (SuperAdmin API module).
        </div>

        <button
          disabled
          className="w-full rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white opacity-40 cursor-not-allowed"
        >
          Tạo Tenant (Coming soon)
        </button>
      </div>
    </div>
  );
}
