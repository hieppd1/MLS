"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/i18nFormat";
import {
  useGetAdminShipmentsQuery,
  useAdminSyncShipmentMutation,
  useAdminCancelShipmentMutation,
  SHIPPING_STATUS_CONFIG,
} from "@/lib/features/shipping/shippingApi";
import { AdminPagination } from "@/app/admin/_components/AdminPagination";

const PAGE_SIZE = 20;

function fmtMoney(v: number) {
  return v > 0 ? formatCurrency(v) : "—";
}

export default function AdminShipmentsPage() {
  const t = useTranslations("admin_shipments");
  const STATUS_OPTIONS = [
    { value: "", label: t("all_statuses") },
    { value: "Pending",   label: "⏳ Chờ lấy hàng" },
    { value: "PickedUp",  label: "📦 Đã lấy hàng" },
    { value: "InTransit", label: "🚚 Đang vận chuyển" },
    { value: "Delivered", label: "✅ Đã giao" },
    { value: "Failed",    label: "❌ Giao thất bại" },
    { value: "Returned",  label: "↩️ Hoàn trả" },
    { value: "Cancelled", label: "🚫 Đã huỷ" },
  ];
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("");
  const [msg, setMsg]               = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data, isLoading } = useGetAdminShipmentsQuery({
    page, pageSize: PAGE_SIZE,
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const [syncShipment, { isLoading: isSyncing }] = useAdminSyncShipmentMutation();
  const [cancelShipment] = useAdminCancelShipmentMutation();

  async function handleSync(id: string) {
    try {
      await syncShipment(id).unwrap();
      setMsg({ type: "success", text: t("toast_sync_ok") });
    } catch {
      setMsg({ type: "error", text: t("toast_sync_fail") });
    }
    setTimeout(() => setMsg(null), 3000);
  }

  async function handleCancel(id: string) {
    if (!confirm(t("cancel_confirm"))) return;
    try {
      await cancelShipment(id).unwrap();
      setMsg({ type: "success", text: t("toast_cancel_ok") });
    } catch {
      setMsg({ type: "error", text: t("toast_cancel_fail") });
    }
    setTimeout(() => setMsg(null), 3000);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">🚚 {t("title")}</h1>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t("search_ph")}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-64 focus:outline-none focus:border-blue-400"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">{t("col_order_id")}</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">{t("col_tracking")}</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">{t("col_recipient")}</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">{t("col_status")}</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">{t("col_fee")}</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">{t("col_created")}</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">{t("col_actions")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  {t("empty")}
                </td>
              </tr>
            ) : data?.items.map((s) => {
              const cfg = SHIPPING_STATUS_CONFIG[s.status] ?? { label: s.status, color: "#374151", bg: "#f3f4f6", icon: "•" };
              const canCancel = !["Delivered", "Cancelled", "Returned"].includes(s.status);
              return (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/don-hang/${s.orderId}`}
                      className="font-mono text-xs text-blue-700 hover:underline">
                      {s.orderCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">
                    {s.trackingNumber ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 text-xs">{s.receiverName}</p>
                    <p className="text-gray-400 text-xs">{s.receiverPhone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700 text-xs">
                    {fmtMoney(s.shippingFee)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {formatDate(s.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleSync(s.id)}
                        disabled={isSyncing}
                        className="text-xs px-2.5 py-1 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors">
                        {t("btn_sync")}
                      </button>
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(s.id)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                          {t("btn_cancel")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total > PAGE_SIZE && (
        <div className="mt-5">
          <AdminPagination
            page={page}
            pageSize={PAGE_SIZE}
            totalCount={data.total}
            totalPages={Math.ceil(data.total / PAGE_SIZE)}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
