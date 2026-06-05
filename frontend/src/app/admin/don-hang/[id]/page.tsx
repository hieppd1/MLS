"use client";

import { use } from "react";
import Link from "next/link";
import {
  useGetAdminOrderDetailQuery,
  useAdminConfirmPaymentMutation,
  useAdminCancelOrderMutation,
  useAdminUpdateOrderStatusMutation,
} from "@/lib/features/admin/adminOrdersApi";
import { useAppSelector } from "@/lib/hooks";
import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

const STATUS_VI: Record<string, string> = {
  Pending: "Chờ xử lý", WaitingPayment: "Chờ thanh toán",
  Paid: "Đã thanh toán", Processing: "Đang xử lý",
  Completed: "Hoàn thành", Cancelled: "Đã huỷ", Failed: "Thất bại",
};

const STATUS_BADGE: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700", WaitingPayment: "bg-orange-100 text-orange-700",
  Paid: "bg-blue-100 text-blue-700", Processing: "bg-indigo-100 text-indigo-700",
  Completed: "bg-green-100 text-green-700", Cancelled: "bg-gray-100 text-gray-500",
  Failed: "bg-red-100 text-red-600",
};

const PM_VI: Record<string, string> = {
  BankTransfer: "Chuyển khoản", VNPay: "VNPay", MoMo: "MoMo", QRBanking: "QR",
};

function fmt(v: number | null | undefined) {
  return (v ?? 0).toLocaleString("vi-VN") + "đ";
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
    if (!res.ok) { setMsg({ type: "error", text: "Không thể tải hoá đơn." }); return; }
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
      setMsg({ type: "success", text: "Đã xác nhận thanh toán!" });
    } catch { setMsg({ type: "error", text: "Xác nhận thất bại." }); }
  };

  const handleCancel = async () => {
    if (!confirm("Huỷ đơn hàng này?")) return;
    try {
      await cancelOrder(id).unwrap();
      setMsg({ type: "success", text: "Đã huỷ đơn hàng." });
    } catch { setMsg({ type: "error", text: "Huỷ thất bại." }); }
  };

  const handleComplete = async () => {
    try {
      await updateStatus({ id, status: "Completed" }).unwrap();
      setMsg({ type: "success", text: "Đã chuyển sang Hoàn thành." });
    } catch { setMsg({ type: "error", text: "Cập nhật thất bại." }); }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-400">Đang tải...</div>;
  if (isError || !order) return <div className="p-8 text-center text-red-500">Không tìm thấy đơn hàng.</div>;

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/don-hang" className="text-gray-400 hover:text-gray-600 text-sm">← Đơn hàng</Link>
        <span className="text-gray-300">/</span>
        <span className="font-mono font-semibold text-gray-900">{order.orderCode}</span>
      </div>

      {msg && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">Trạng thái đơn</div>
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-600"}`}>
            {STATUS_VI[order.status] ?? order.status}
          </span>
        </div>
        {/* Payment */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">Thanh toán</div>
          <div className="font-semibold text-gray-900">{PM_VI[order.paymentMethod] ?? order.paymentMethod}</div>
          <div className={`text-sm mt-1 ${order.paymentStatus === "Paid" ? "text-green-600" : "text-gray-400"}`}>
            {order.paymentStatus === "Paid" ? "✓ Đã thanh toán" : "Chưa thanh toán"}
          </div>
          {order.paidAt && <div className="text-xs text-gray-400 mt-0.5">{new Date(order.paidAt).toLocaleString("vi-VN")}</div>}
        </div>
        {/* Amount */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">Giá trị đơn</div>
          <div className="text-2xl font-bold" style={{ color: "#e5173f" }}>{fmt(order.finalAmount)}</div>
          {order.discountAmount > 0 && <div className="text-xs text-gray-400">Giảm {fmt(order.discountAmount)}</div>}
        </div>
      </div>

      {/* Customer */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <h3 className="font-semibold text-gray-900 mb-2">Khách hàng</h3>
        <div className="text-sm text-gray-700">{order.userName ?? "—"}</div>
        <div className="text-sm text-gray-500">{order.userEmail ?? "—"}</div>
        <div className="text-xs text-gray-400 mt-1">ID: {order.userId}</div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Sản phẩm ({order.items.length})</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-gray-600 font-medium">Sách</th>
              <th className="px-4 py-2 text-center text-gray-600 font-medium">SL</th>
              <th className="px-4 py-2 text-right text-gray-600 font-medium">Đơn giá</th>
              <th className="px-4 py-2 text-right text-gray-600 font-medium">Thành tiền</th>
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

      {/* Actions */}
      {(order.status === "Pending" || order.status === "WaitingPayment") && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3">Xác nhận thanh toán</h3>
          <div className="mb-3">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú xác nhận (VD: Đã nhận CK 11:35)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handleConfirm} disabled={isConfirming}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
              {isConfirming ? "Đang xác nhận..." : "✓ Xác nhận đã thanh toán"}
            </button>
            <button onClick={handleCancel} disabled={isCancelling}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
              {isCancelling ? "Đang huỷ..." : "Huỷ đơn hàng"}
            </button>
          </div>
        </div>
      )}

      {order.status === "Paid" && (
        <div className="flex gap-3 flex-wrap">
          <button onClick={handleComplete} disabled={isUpdating}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {isUpdating ? "Đang cập nhật..." : "✓ Đánh dấu Hoàn thành"}
          </button>
          <a href={`${API_BASE}/api/v1/admin/orders/${order.id}/invoice/pdf`}
            target="_blank" rel="noopener noreferrer"
            onClick={(e) => { e.preventDefault(); downloadInvoice(); }}
            className="rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">
            📄 Tải hoá đơn PDF
          </a>
        </div>
      )}

      {order.paymentNote && (
        <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600">
          <span className="font-medium">Ghi chú TT:</span> {order.paymentNote}
        </div>
      )}
    </div>
  );
}
