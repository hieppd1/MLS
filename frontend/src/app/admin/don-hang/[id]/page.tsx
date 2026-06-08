"use client";

import { use } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatCurrency, formatDateTime } from "@/lib/i18nFormat";
import {
  useGetAdminOrderDetailQuery,
  useAdminConfirmPaymentMutation,
  useAdminCancelOrderMutation,
  useAdminUpdateOrderStatusMutation,
} from "@/lib/features/admin/adminOrdersApi";
import { useAppSelector } from "@/lib/hooks";
import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

const STATUS_KEY: Record<string, string> = {
  Pending: "st_pending", WaitingPayment: "st_waiting_payment",
  Paid: "st_paid", Processing: "st_processing",
  Completed: "st_completed", Cancelled: "st_cancelled", Failed: "st_failed",
};

const STATUS_BADGE: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700", WaitingPayment: "bg-orange-100 text-orange-700",
  Paid: "bg-blue-100 text-blue-700", Processing: "bg-indigo-100 text-indigo-700",
  Completed: "bg-green-100 text-green-700", Cancelled: "bg-gray-100 text-gray-500",
  Failed: "bg-red-100 text-red-600",
};

const PM_KEY: Record<string, string> = {
  BankTransfer: "pm_bank", VNPay: "pm_vnpay", MoMo: "pm_momo", QRBanking: "pm_qr",
};

function fmt(v: number | null | undefined) {
  return formatCurrency(v ?? 0);
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations("admin_order_detail");
  const { id } = use(params);
  const { data: order, isLoading, isError } = useGetAdminOrderDetailQuery(id);
  const [confirmPayment, { isLoading: isConfirming }] = useAdminConfirmPaymentMutation();
  const [cancelOrder, { isLoading: isCancelling }] = useAdminCancelOrderMutation();
  const [updateStatus, { isLoading: isUpdating }] = useAdminUpdateOrderStatusMutation();
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const tenantSlug = useAppSelector((s) => s.auth.tenantSlug);

  async function downloadInvoice() {
    if (!order) return;
    const res = await fetch(`${API_BASE}/api/v1/admin/orders/${order.id}/invoice/pdf`, {
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        "X-Tenant-Slug": tenantSlug,
      },
    });
    if (!res.ok) { setMsg({ type: "error", text: t("invoice_err") }); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hoa-don-${order.orderCode}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const handleConfirm = async () => {
    try {
      await confirmPayment({ id, note }).unwrap();
      setMsg({ type: "success", text: t("confirm_ok") });
    } catch { setMsg({ type: "error", text: t("confirm_fail") }); }
  };

  const handleCancel = async () => {
    if (!confirm(t("cancel_prompt"))) return;
    try {
      await cancelOrder(id).unwrap();
      setMsg({ type: "success", text: t("cancel_ok") });
    } catch { setMsg({ type: "error", text: t("cancel_fail") }); }
  };

  const handleComplete = async () => {
    try {
      await updateStatus({ id, status: "Completed" }).unwrap();
      setMsg({ type: "success", text: t("complete_ok") });
    } catch { setMsg({ type: "error", text: t("complete_fail") }); }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-400">{t("loading")}</div>;
  if (isError || !order) return <div className="p-8 text-center text-red-500">{t("not_found")}</div>;

  const statusLabel = STATUS_KEY[order.status] ? t(STATUS_KEY[order.status]) : order.status;
  const pmLabel = PM_KEY[order.paymentMethod] ? t(PM_KEY[order.paymentMethod]) : order.paymentMethod;

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/don-hang" className="text-gray-400 hover:text-gray-600 text-sm">{t("back")}</Link>
        <span className="text-gray-300">/</span>
        <span className="font-mono font-semibold text-gray-900">{order.orderCode}</span>
      </div>

      {msg && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">{t("status_order")}</div>
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-600"}`}>
            {statusLabel}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">{t("payment")}</div>
          <div className="font-semibold text-gray-900">{pmLabel}</div>
          <div className={`text-sm mt-1 ${order.paymentStatus === "Paid" ? "text-green-600" : "text-gray-400"}`}>
            {order.paymentStatus === "Paid" ? t("paid") : t("unpaid")}
          </div>
          {order.paidAt && <div className="text-xs text-gray-400 mt-0.5">{formatDateTime(order.paidAt)}</div>}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">{t("order_value")}</div>
          <div className="text-2xl font-bold" style={{ color: "#e5173f" }}>{fmt(order.finalAmount)}</div>
          {order.discountAmount > 0 && <div className="text-xs text-gray-400">{t("discount", { amount: fmt(order.discountAmount) })}</div>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <h3 className="font-semibold text-gray-900 mb-2">{t("customer")}</h3>
        <div className="text-sm text-gray-700">{order.userName ?? "—"}</div>
        <div className="text-sm text-gray-500">{order.userEmail ?? "—"}</div>
        <div className="text-xs text-gray-400 mt-1">ID: {order.userId}</div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 mb-4">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{t("products", { n: order.items.length })}</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-gray-600 font-medium">{t("col_book")}</th>
              <th className="px-4 py-2 text-center text-gray-600 font-medium">{t("col_qty")}</th>
              <th className="px-4 py-2 text-right text-gray-600 font-medium">{t("col_unit")}</th>
              <th className="px-4 py-2 text-right text-gray-600 font-medium">{t("col_total")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{item.bookTitle}</div>
                  <div className="text-xs text-gray-400">{item.bookType}</div>
                </td>
                <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-gray-600">{fmt(item.unitPrice)}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(order.status === "Pending" || order.status === "WaitingPayment") && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3">{t("confirm_section")}</h3>
          <div className="mb-3">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("note_ph")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handleConfirm} disabled={isConfirming}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
              {isConfirming ? t("btn_confirming") : t("btn_confirm")}
            </button>
            <button onClick={handleCancel} disabled={isCancelling}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
              {isCancelling ? t("btn_cancelling") : t("btn_cancel_order")}
            </button>
          </div>
        </div>
      )}

      {order.status === "Paid" && (
        <div className="flex gap-3 flex-wrap">
          <button onClick={handleComplete} disabled={isUpdating}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {isUpdating ? t("btn_updating") : t("btn_complete")}
          </button>
          <a href={`${API_BASE}/api/v1/admin/orders/${order.id}/invoice/pdf`}
            target="_blank" rel="noopener noreferrer"
            onClick={(e) => { e.preventDefault(); downloadInvoice(); }}
            className="rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">
            {t("btn_invoice")}
          </a>
        </div>
      )}

      {order.paymentNote && (
        <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600">
          <span className="font-medium">{t("payment_note")}</span> {order.paymentNote}
        </div>
      )}
    </div>
  );
}
