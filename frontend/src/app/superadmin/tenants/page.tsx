"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/i18nFormat";

interface Tenant {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  status: string;
  contactEmail: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  Active: { label: "Hoạt động", className: "bg-green-100 text-green-700" },
  Trial: { label: "Dùng thử", className: "bg-blue-100 text-blue-700" },
  Suspended: { label: "Tạm khóa", className: "bg-red-100 text-red-700" },
  Inactive: { label: "Vô hiệu", className: "bg-gray-100 text-gray-600" },
};

export default function SuperAdminTenantsPage() {
  // Note: Tenant management API will be added in Phase 4 (SuperAdmin module).
  // This page shows a placeholder with mock data structure.
  const [tenants] = useState<Tenant[]>([
    {
      id: "demo",
      slug: "demo",
      name: "Demo Tenant",
      domain: null,
      status: "Trial",
      contactEmail: "admin@demo.com",
      createdAt: new Date().toISOString(),
    },
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="mt-1 text-sm text-gray-500">{tenants.length} tenants</p>
        </div>
        <Link
          href="/superadmin/tenants/new"
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
        >
          Thêm Tenant
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Tên</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Slug</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Domain</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Trạng thái</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Ngày tạo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{tenant.name}</div>
                  {tenant.contactEmail && (
                    <div className="text-xs text-gray-500">{tenant.contactEmail}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{tenant.slug}</code>
                </td>
                <td className="px-4 py-3 text-gray-500">{tenant.domain ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_LABELS[tenant.status]?.className ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABELS[tenant.status]?.label ?? tenant.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {formatDate(tenant.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/superadmin/tenants/${tenant.id}`}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Xem
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
        Tenant management API (create/update/delete) sẽ được triển khai trong Phase 4.
        Hiện tại, tenants được tạo thủ công qua database seeder.
      </div>
    </div>
  );
}
