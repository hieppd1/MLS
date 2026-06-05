"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { useLazyGetOrderByCodeQuery } from "@/lib/features/orders/ordersApi";
import { useTranslations } from "next-intl";

const MLS_NAVY = "#0a2540";
const MLS_RED  = "#e5173f";

type PollState = "polling" | "paid" | "failed" | "timeout";

function VnPayResult({ orderCode }: { orderCode: string }) {
  const t = useTranslations();
  const [pollState, setPollState]   = useState<PollState>("polling");
  const [fetchOrder]                = useLazyGetOrderByCodeQuery();
  const pollCount                   = useRef(0);
  const MAX_POLLS                   = 8;

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const order = await fetchOrder(orderCode, false).unwrap();
        if (order.paymentStatus === "Paid") {
          setPollState("paid");
          clearInterval(timer);
          return;
        }
      } catch {
        // keep polling – order may not be confirmed yet
      }
      pollCount.current += 1;
      if (pollCount.current >= MAX_POLLS) {
        setPollState("timeout");
        clearInterval(timer);
      }
    }, 2000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderCode]);

  if (pollState === "polling") {
    return (
      <div className="max-w-lg mx-auto text-center py-24 px-5">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-t-transparent animate-spin"
             style={{ borderColor: `${MLS_NAVY} transparent ${MLS_NAVY} ${MLS_NAVY}` }} />
        <h1 className="text-xl font-bold text-gray-900 mb-2">{t("result.polling_title")}</h1>
        <p className="text-gray-500 text-sm">{t("result.polling_desc")}</p>
      </div>
    );
  }

  if (pollState === "paid") {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-5">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("payment.success")}</h1>
        <p className="text-gray-500 text-sm mb-6">{t("result.activated_desc")}</p>

        {orderCode && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8 text-left">
            <p className="text-xs text-gray-500 mb-1">{t("payment.order_id")}</p>
            <p className="text-lg font-black tracking-wide" style={{ color: MLS_NAVY }}>{orderCode}</p>
          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left text-sm text-green-800 mb-8">
          <p className="font-semibold mb-1">{t("result.books_activated")}</p>
          <p className="text-xs leading-relaxed">{t("result.go_library_hint")}</p>
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/thu-vien-sach"
            className="px-6 py-3 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: MLS_NAVY }}>
            {t("result.my_library")}
          </Link>
          <Link href="/sach"
            className="px-6 py-3 rounded-xl text-sm font-semibold border-2 text-gray-700"
            style={{ borderColor: "#d1d5db" }}>
            {t("cart.continue_shopping")}
          </Link>
        </div>
      </div>
    );
  }

  // timeout
  return (
    <div className="max-w-lg mx-auto text-center py-16 px-5">
      <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">⏳</span>
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">{t("result.processing_title")}</h1>
      <p className="text-gray-500 text-sm mb-6">{t("result.processing_desc")}</p>
      {orderCode && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 text-left">
          <p className="text-xs text-gray-500 mb-1">{t("payment.order_id")}</p>
          <p className="font-black tracking-wide" style={{ color: MLS_NAVY }}>{orderCode}</p>
        </div>
      )}
      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={() => { pollCount.current = 0; setPollState("polling"); }}
          className="px-6 py-3 rounded-xl text-white text-sm font-semibold"
          style={{ backgroundColor: MLS_RED }}>
          {t("result.check_again")}
        </button>
        <Link href="/don-hang"
          className="px-6 py-3 rounded-xl text-sm font-semibold border-2 text-gray-700"
          style={{ borderColor: MLS_NAVY }}>
          {t("result.view_orders")}
        </Link>
      </div>
    </div>
  );
}

function ResultContent() {
  const t = useTranslations();
  const params    = useSearchParams();
  const orderId   = params.get("orderId");
  const orderCode = params.get("orderCode");
  const method    = params.get("method");
  const failed    = params.get("failed") === "1";

  // VNPay return — enter polling mode
  if (method === "vnpay" && orderCode) {
    return <VnPayResult orderCode={orderCode} />;
  }

  if (failed) {
    return (
      <div className="text-center py-20">
        <p className="text-6xl mb-4">❌</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("result.failed_title")}</h1>
        <p className="text-gray-500 text-sm mb-8">{t("result.failed_desc")}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/gio-hang"
            className="px-6 py-3 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: MLS_RED }}>
            {t("result.back_to_cart")}
          </Link>
          <Link href="/sach"
            className="px-6 py-3 rounded-xl text-sm font-semibold border-2 text-gray-700"
            style={{ borderColor: MLS_NAVY }}>
            {t("cart.continue_shopping")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto text-center py-16 px-5">
      {/* Success icon */}
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">✅</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("result.success_title")}</h1>
      <p className="text-gray-500 text-sm mb-6">{t("result.success_desc")}</p>

      {orderCode && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8 text-left">
          <p className="text-xs text-gray-500 mb-1">{t("payment.order_id")}</p>
          <p className="text-lg font-black tracking-wide" style={{ color: MLS_NAVY }}>{orderCode}</p>
          <p className="text-xs text-gray-400 mt-2">{t("result.save_code_hint")}</p>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-sm text-amber-800 mb-8">
        <p className="font-semibold mb-1">{t("result.payment_guide")}</p>
        <p className="text-xs leading-relaxed">
          Nếu chọn <strong>chuyển khoản ngân hàng</strong>, vui lòng chuyển khoản đến tài khoản:<br />
          <strong>BIDV</strong> — STK: <strong>12345678901</strong><br />
          Nội dung: <strong>{orderCode ?? "MÃ ĐƠN HÀNG"}</strong><br />
          Đơn hàng sẽ được xác nhận trong 1–2 giờ làm việc.
        </p>
      </div>

      <div className="flex gap-3 justify-center flex-wrap">
        {orderId && (
          <Link href={`/don-hang/${orderId}`}
            className="px-6 py-3 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: MLS_NAVY }}>
            {t("result.view_order_detail")}
          </Link>
        )}
        <Link href="/sach"
          className="px-6 py-3 rounded-xl text-sm font-semibold border-2 text-gray-700"
          style={{ borderColor: "#d1d5db" }}>
          {t("cart.continue_shopping")}
        </Link>
      </div>
    </div>
  );
}

export default function KetQuaPage() {
  return (
    <main className="bg-[#f5f6fa] min-h-screen">
      <Suspense fallback={<div className="text-center py-20 text-gray-400">{"..."}</div>}>
        <ResultContent />
      </Suspense>
    </main>
  );
}
