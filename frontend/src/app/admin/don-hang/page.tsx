"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/i18nFormat";
import {
  useGetAdminOrdersQuery,
  useAdminConfirmPaymentMutation,
  useAdminCancelOrderMutation,
  type AdminOrderListItem,
} from "@/lib/features/admin/adminOrdersApi";
import { AdminPagination } from "@/app/admin/_components/AdminPagination";

const PAGE_SIZE = 20;

const STATUS_BADGE: Record<string, string> = {
  Pending:        "bg-yellow-100 text-yellow-700",
  WaitingPayment: "bg-orange-100 text-orange-700",
  Paid:           "bg-blue-100 text-blue-700",
  Processing:     "bg-indigo-100 text-indigo-700",
  Completed:      "bg-green-100 text-green-700",
  Cancelled:      "bg-gray-100 text-gray-500",
  Failed:         "bg-red-100 text-red-600",
};

function fmt(v: number) {
  return formatCurrency(v);
}

export default function AdminOrdersPage() {
  const t = useTranslations("admin_orders");
  const STATUS_VI: Record<string, string> = {
    Pending: t("status_pending"), WaitingPayment: t("status_waiting_payment"),
    Paid: t("status_paid"), Processing: t("status_processing"),
    Completed: t("status_completed"), Cancelled: t("status_cancelled"), Failed: t("status_failed"),
  };
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<AdminOrderListItem | null>(null);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data, isLoading, isError } = useGetAdminOrdersQuery({
    page, pageSize: PAGE_SIZE,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const [confirmPayment, { isLoading: isConfirming }] = useAdminConfirmPaymentMutation();
  const [cancelOrder] = useAdminCancelOrderMutation();

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    try {
      await confirmPayment({ id: confirmTarget.id, note }).unwrap();
      setMsg({ type: "success", text: t("toast_confirm_ok") });
      setTimeout(() => { setConfirmTarget(null); setMsg(null); }, 1200);
    } catch { setMsg({ type: "error", text: t("toast_confirm_fail") }); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm(t("cancel_confirm"))) return;
    await cancelOrder(id).unwrap().catch(() => {});
  };

  return (
    <div className="p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data ? t("count", { n: data.total }) : t("loading")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t("search_ph")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-64 focus:outline-none focus:border-indigo-500"
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none">
          <option value="">{t("all_statuses")}</option>
          {Object.entries(STATUS_VI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">{t("loading")}</div>
      ) : isError ? (
        <div className="text-center py-20 text-red-500">{t("load_error")}</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("col_code")}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("col_customer")}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("col_status")}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("col_payment")}</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">{t("col_total")}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("col_date")}</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">{t("col_actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.items.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/don-hang/${o.id}`}
                        className="font-mono text-indigo-600 hover:underline font-medium">
                        {o.orderCode}
                      </Link>
                      <div className="text-xs text-gray-400">{t("items_count", { n: o.itemCount })}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 truncate max-w-[160px]">{o.userName ?? "—"}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[160px]">{o.userEmail ?? ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_VI[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${o.paymentStatus === "Paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {o.paymentStatus === "Paid" ? t("paid_badge") : t("unpaid_badge")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(o.finalAmount)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(o.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/admin/don-hang/${o.id}`}
                          className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-100">
                          {t("btn_detail")}
                        </Link>
                        {(o.status === "Pending" || o.status === "WaitingPayment") && (
                          <button onClick={() => { setConfirmTarget(o); setNote(""); setMsg(null); }}
                            className="inline-flex items-center rounded-md border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 transition hover:border-green-400 hover:bg-green-100">
                            {t("btn_confirm_payment")}
                          </button>
                        )}
                        {(o.status === "Pending" || o.status === "WaitingPayment") && (
                          <button onClick={() => handleCancel(o.id)}
                            className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:border-red-300 hover:bg-red-100">
                            {t("btn_cancel")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.items.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">{t("empty")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {data && data.total > PAGE_SIZE && (
            <div className="mt-4">
              <AdminPagination page={page} totalPages={Math.ceil(data.total / PAGE_SIZE)} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      {/* Confirm Payment Modal */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="font-semibold text-gray-900 mb-1">{t("modal_confirm_title")}</h2>
            <p className="text-sm text-gray-500 mb-4">
              Đơn hàng <strong>{confirmTarget.orderCode}</strong> —{" "}
              <strong>{fmt(confirmTarget.finalAmount)}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">{t("field_note")}</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("note_ph")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            {msg && (
              <div className={`mb-4 rounded-lg px-4 py-2 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                {msg.text}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setConfirmTarget(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                {t("btn_cancel")}
              </button>
              <button onClick={handleConfirm} disabled={isConfirming}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                {isConfirming ? t("btn_confirming") : t("btn_confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
