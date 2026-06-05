"use client";

import Link from "next/link";
import BookSubNav from "@/components/books/BookSubNav";
import { useGetMyOrdersQuery } from "@/lib/features/orders/ordersApi";
import { useAppSelector } from "@/lib/hooks";
import { selectIsAuthenticated } from "@/lib/features/auth/authSlice";
import { useState } from "react";
import { useFormatters } from "@/lib/hooks/useFormatters";
import { useTranslations } from "next-intl";

const MLS_NAVY = "#0a2540";
const MLS_RED  = "#e5173f";



export default function DonHangPage() {
  const isAuth = useAppSelector(selectIsAuthenticated);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetMyOrdersQuery({ page, pageSize: 10 }, { skip: !isAuth });
  const { fmtCurrency, fmtDateTime } = useFormatters();
  const t = useTranslations("orders");

  const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    Pending:        { label: t("status_pending"),         color: "#92400e", bg: "#fef3c7" },
    WaitingPayment: { label: t("status_waiting_payment"), color: "#1d4ed8", bg: "#dbeafe" },
    Paid:           { label: t("status_paid"),            color: "#065f46", bg: "#d1fae5" },
    Processing:     { label: t("status_processing"),      color: "#1d4ed8", bg: "#dbeafe" },
    Completed:      { label: t("status_completed"),       color: "#065f46", bg: "#d1fae5" },
    Cancelled:      { label: t("status_cancelled"),       color: "#991b1b", bg: "#fee2e2" },
    Failed:         { label: t("status_failed"),          color: "#991b1b", bg: "#fee2e2" },
  };

  const PAYMENT_METHOD_LABELS: Record<string, string> = {
    BankTransfer: t("method_bank"),
    VNPay:        t("method_vnpay"),
    MoMo:         t("method_momo"),
    QRBanking:    t("method_qr"),
  };

  if (!isAuth) {
    return (
      <>
        <BookSubNav />
        <main className="bg-[#f5f6fa] min-h-screen flex items-center justify-center">
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔒</p>
            <p className="text-xl font-semibold text-gray-700 mb-6">{t("login_required")}</p>
            <Link href="/login"
              className="inline-block px-6 py-3 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: MLS_NAVY }}>
              {t("login_btn")}
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <BookSubNav />
      <main className="bg-[#f5f6fa] min-h-screen">
        <div className="max-w-4xl mx-auto px-5 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("title")}</h1>

          {isLoading && (
            <div className="space-y-4">
              {[1,2,3].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />
              ))}
            </div>
          )}

          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
              {t("load_error")}
            </div>
          )}

          {!isLoading && !isError && data?.items.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl">
              <p className="text-5xl mb-4">📦</p>
              <p className="text-lg font-semibold text-gray-700 mb-2">{t("empty")}</p>
              <p className="text-gray-400 text-sm mb-6">{t("empty_desc")}</p>
              <Link href="/sach"
                className="inline-block px-6 py-3 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: MLS_NAVY }}>
                {t("explore")}
              </Link>
            </div>
          )}

          {!isLoading && data && data.items.length > 0 && (
            <>
              <div className="flex flex-col gap-4">
                {data.items.map((order) => {
                  const statusCfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: "#374151", bg: "#f3f4f6" };
                  return (
                    <Link key={order.id} href={`/don-hang/${order.id}`}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow block">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-black text-gray-900">{order.orderCode}</p>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                              style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}>
                              {statusCfg.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {t("items_count", { count: order.itemCount })} · {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {fmtDateTime(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-black" style={{ color: MLS_RED }}>
                            {fmtCurrency(order.finalAmount)}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">{t("view_detail")}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {data.total > 10 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
                    {t("prev")}
                  </button>
                  <span className="text-sm text-gray-600">{t("page_of", { page, total: Math.ceil(data.total / 10) })}</span>
                  <button disabled={page >= Math.ceil(data.total / 10)}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
                    {t("next")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
