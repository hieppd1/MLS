"use client";

import { use } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import BookSubNav from "@/components/books/BookSubNav";
import BookCover from "@/components/books/BookCover";
import { useGetOrderByIdQuery, useCancelOrderMutation } from "@/lib/features/orders/ordersApi";
import { useGetShipmentByOrderIdQuery, SHIPPING_STATUS_CONFIG } from "@/lib/features/shipping/shippingApi";
import { useAppSelector } from "@/lib/hooks";
import { selectIsAuthenticated } from "@/lib/features/auth/authSlice";
import { useFormatters } from "@/lib/hooks/useFormatters";
const MLS_NAVY = "#0a2540";
const MLS_RED  = "#e5173f";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  Pending:        { color: "#92400e", bg: "#fef3c7" },
  WaitingPayment: { color: "#1d4ed8", bg: "#dbeafe" },
  Paid:           { color: "#065f46", bg: "#d1fae5" },
  Processing:     { color: "#1d4ed8", bg: "#dbeafe" },
  Completed:      { color: "#065f46", bg: "#d1fae5" },
  Cancelled:      { color: "#991b1b", bg: "#fee2e2" },
  Failed:         { color: "#991b1b", bg: "#fee2e2" },
};
const STATUS_KEY: Record<string, string> = {
  Pending: "status_pending",
  WaitingPayment: "status_waiting_payment",
  Paid: "status_paid",
  Processing: "status_processing",
  Completed: "status_completed",
  Cancelled: "status_cancelled",
  Failed: "status_failed",
};
const PAYMENT_METHOD_KEY: Record<string, string> = {
  BankTransfer: "pm_bank_transfer",
  VNPay: "pm_vnpay",
  MoMo: "pm_momo",
  QRBanking: "pm_qr_banking",
};
const TYPE_KEY: Record<string, string> = {
  Ebook: "type_ebook", Physical: "type_physical", Combo: "type_combo",
};

interface PageProps { params: Promise<{ id: string }> }

export default function DonHangDetailPage({ params }: PageProps) {
  const t = useTranslations("orders_detail");
  const { id } = use(params);
  const isAuth = useAppSelector(selectIsAuthenticated);
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const tenantSlug = useAppSelector((s) => s.auth.tenantSlug);
  const { data: order, isLoading, isError } = useGetOrderByIdQuery(id, { skip: !isAuth });
  const { data: shipment } = useGetShipmentByOrderIdQuery(id, { skip: !isAuth });
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();
  const { fmtCurrency, fmtDate, fmtDateTime } = useFormatters();

  async function downloadInvoice() {
    if (!order) return;
    const res = await fetch(`${API_BASE}/api/v1/orders/${order.id}/invoice/pdf`, {
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        "X-Tenant-Slug": tenantSlug,
      },
    });
    if (!res.ok) { alert(t("invoice_failed")); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hoa-don-${order.orderCode}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!isAuth) {
    return (
      <>
        <BookSubNav />
        <main className="bg-[#f5f6fa] min-h-screen flex items-center justify-center">
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔒</p>
            <p className="text-xl font-semibold text-gray-700 mb-6">{t("please_login")}</p>
            <Link href="/login" className="inline-block px-6 py-3 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: MLS_NAVY }}>{t("login")}</Link>
          </div>
        </main>
      </>
    );
  }

  if (isLoading) return (
    <>
      <BookSubNav />
      <main className="bg-[#f5f6fa] min-h-screen">
        <div className="max-w-3xl mx-auto px-5 py-8">
          <div className="h-96 bg-white rounded-2xl animate-pulse" />
        </div>
      </main>
    </>
  );

  if (isError || !order) return (
    <>
      <BookSubNav />
      <main className="bg-[#f5f6fa] min-h-screen flex items-center justify-center">
        <div className="text-center py-20">
          <p className="text-5xl mb-4">❌</p>
          <p className="text-lg font-semibold text-gray-700 mb-4">{t("not_found")}</p>
          <Link href="/don-hang" className="text-sm text-blue-600 hover:underline">{t("back_to_list_short")}</Link>
        </div>
      </main>
    </>
  );

  const statusColors = STATUS_COLORS[order.status] ?? { color: "#374151", bg: "#f3f4f6" };
  const statusLabel = STATUS_KEY[order.status] ? t(STATUS_KEY[order.status]) : order.status;
  const canCancel = order.status === "Pending" || order.status === "WaitingPayment";
  const shipping  = order.shipping as { name?: string; phone?: string; address?: string; province?: string } | null;

  async function handleCancel() {
    if (!confirm(t("confirm_cancel"))) return;
    try {
      await cancelOrder(order!.id).unwrap();
    } catch {
      alert(t("cancel_failed"));
    }
  }

  return (
    <>
      <BookSubNav />
      <main className="bg-[#f5f6fa] min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-5 py-3 text-sm text-gray-500 flex items-center gap-2">
            <Link href="/don-hang" className="hover:text-gray-800">{t("breadcrumb_orders")}</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">{order.orderCode}</span>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-5 py-8 flex flex-col gap-5">

          {/* ── Header card ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t("order_code")}</p>
                <p className="text-xl font-black" style={{ color: MLS_NAVY }}>{order.orderCode}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {fmtDateTime(order.createdAt)}
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-full text-sm font-semibold"
                style={{ color: statusColors.color, backgroundColor: statusColors.bg }}>
                {statusLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">{t("payment")}</p>
                <p className="text-sm font-semibold">{PAYMENT_METHOD_KEY[order.paymentMethod] ? t(PAYMENT_METHOD_KEY[order.paymentMethod]) : order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">{t("payment_status")}</p>
                <p className="text-sm font-semibold">
                  {order.paymentStatus === "Paid" ? t("paid_short") :
                   order.paymentStatus === "Refunded" ? t("refunded_short") : t("unpaid_short")}
                </p>
              </div>
              {order.paidAt && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">{t("paid_at")}</p>
                  <p className="text-sm font-semibold">
                    {fmtDate(order.paidAt)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Items ────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-bold text-gray-900 mb-4">{t("items_title")}</h2>
            <div className="flex flex-col divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.bookId} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="w-14 h-20 rounded-lg overflow-hidden shrink-0 shadow-sm">
                    <BookCover title={item.bookTitle}
                      coverColor={item.coverColor ?? "#1a3a5c"}
                      coverEmoji={item.coverEmoji ?? "📚"}
                      coverUrl={item.coverUrl}
                      className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.bookSlug ? (
                      <Link href={`/sach/${item.bookSlug}`}
                        className="text-sm font-semibold text-gray-900 hover:text-blue-700 leading-snug">
                        {item.bookTitle}
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{item.bookTitle}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{TYPE_KEY[item.bookType] ? t(TYPE_KEY[item.bookType]) : item.bookType} · x{item.quantity}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t("per_unit", { price: fmtCurrency(item.unitPrice) })}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm" style={{ color: MLS_RED }}>
                      {fmtCurrency(item.totalPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Totals ───────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-bold text-gray-900 mb-4">{t("totals_title")}</h2>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t("subtotal")}</span>
                <span>{fmtCurrency(order.totalAmount)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{t("discount")} {order.voucherCode ? `(${order.voucherCode})` : ""}</span>
                  <span>−{fmtCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-base pt-2 border-t border-gray-100">
                <span>{t("total")}</span>
                <span style={{ color: MLS_RED }}>{fmtCurrency(order.finalAmount)}</span>
              </div>
            </div>
          </div>

          {/* ── Shipping ────────────────────────────────────────────────── */}
          {shipping && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-4">{t("shipping_title")}</h2>
              <p className="text-sm font-semibold text-gray-800">{shipping.name}</p>
              {shipping.phone && <p className="text-sm text-gray-600">{shipping.phone}</p>}
              {shipping.address && <p className="text-sm text-gray-600">{shipping.address}{shipping.province ? `, ${shipping.province}` : ""}</p>}
            </div>
          )}

          {/* ── Shipment status ──────────────────────────────────────────── */}
          {shipment && (() => {
            const cfg = SHIPPING_STATUS_CONFIG[shipment.status] ?? { label: shipment.status, color: "#374151", bg: "#f3f4f6", icon: "📦" };
            return (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <h2 className="text-base font-bold text-gray-900">{t("shipment_title")}</h2>
                  <span className="px-3 py-1 rounded-full text-sm font-semibold"
                    style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 text-sm text-gray-600 mb-4">
                  <p><span className="text-gray-400">{t("shipping_provider")}</span> {shipment.provider}</p>
                  {shipment.trackingNumber && (
                    <p><span className="text-gray-400">{t("tracking_number")}</span>{" "}
                      <span className="font-mono font-bold text-gray-900">{shipment.trackingNumber}</span>
                    </p>
                  )}
                  <p><span className="text-gray-400">{t("shipping_fee")}</span> {shipment.shippingFee > 0 ? fmtCurrency(shipment.shippingFee) : t("free")}</p>
                </div>
                {shipment.trackingNumber && (
                  <Link
                    href={`/don-hang/${id}/tracking`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border-2 hover:bg-blue-50 transition-colors"
                    style={{ color: "#1d4ed8", borderColor: "#bfdbfe" }}>
                    {t("track_shipment")}
                  </Link>
                )}
              </div>
            );
          })()}

          {/* ── Activation Codes ────────────────────────────────────────── */}
          {order.activationCodes && order.activationCodes.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100">
              <h2 className="text-base font-bold text-gray-900 mb-4">{t("activation_title")}</h2>
              <p className="text-xs text-gray-500 mb-4">{t("activation_hint")}</p>
              <div className="space-y-3">
                {order.activationCodes.map((ac) => (
                  <div key={ac.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <div>
                      <p className="font-mono text-base font-bold tracking-widest text-amber-800">{ac.code}</p>
                      {ac.expiresAt && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {t("expires_at", { date: fmtDate(ac.expiresAt) })}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(ac.code)}
                      className="ml-4 text-xs font-semibold text-amber-700 border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-100 cursor-pointer transition-colors"
                    >
                      {t("copy")}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Actions ─────────────────────────────────────────────────── */}
          <div className="flex gap-3 flex-wrap">
            <Link href="/don-hang"
              className="px-5 py-2.5 rounded-xl border-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              style={{ borderColor: "#d1d5db" }}>
              {t("back_to_list")}
            </Link>
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="px-5 py-2.5 rounded-xl border-2 text-sm font-semibold text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50">
                {isCancelling ? t("cancelling") : t("cancel_order")}
              </button>
            )}
            {order.paymentStatus === "Paid" && (
              <button
                onClick={downloadInvoice}
                className="px-5 py-2.5 rounded-xl border-2 text-sm font-semibold hover:bg-blue-50 cursor-pointer"
                style={{ color: "#1d4ed8", borderColor: "#bfdbfe" }}>
                {t("download_invoice")}
              </button>
            )}
            <Link href="/sach"
              className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
              style={{ backgroundColor: MLS_NAVY }}>
              {t("continue_shopping")}
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
