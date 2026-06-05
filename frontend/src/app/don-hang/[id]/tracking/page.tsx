"use client";

import { use } from "react";
import Link from "next/link";
import BookSubNav from "@/components/books/BookSubNav";
import { useGetShipmentByOrderIdQuery, SHIPPING_STATUS_CONFIG } from "@/lib/features/shipping/shippingApi";
import { useAppSelector } from "@/lib/hooks";
import { selectIsAuthenticated } from "@/lib/features/auth/authSlice";
import { useFormatters } from "@/lib/hooks/useFormatters";

const TIMELINE_STATUSES = [
  "Pending",
  "PickedUp",
  "InTransit",
  "Delivered",
];

interface PageProps { params: Promise<{ id: string }> }

export default function ShipmentTrackingPage({ params }: PageProps) {
  const { id } = use(params);
  const isAuth = useAppSelector(selectIsAuthenticated);
  const { data: shipment, isLoading, isError } = useGetShipmentByOrderIdQuery(id, { skip: !isAuth });
  const { fmtDateTime } = useFormatters();

  if (!isAuth) return (
    <>
      <BookSubNav />
      <main className="bg-[#f5f6fa] min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Vui lòng đăng nhập để xem vận đơn.</p>
      </main>
    </>
  );

  if (isLoading) return (
    <>
      <BookSubNav />
      <main className="bg-[#f5f6fa] min-h-screen">
        <div className="max-w-xl mx-auto px-5 py-8">
          <div className="h-64 bg-white rounded-2xl animate-pulse" />
        </div>
      </main>
    </>
  );

  if (isError || !shipment) return (
    <>
      <BookSubNav />
      <main className="bg-[#f5f6fa] min-h-screen flex items-center justify-center">
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-lg font-semibold text-gray-700 mb-4">Không tìm thấy thông tin vận chuyển</p>
          <Link href={`/don-hang/${id}`} className="text-sm text-blue-600 hover:underline">← Về đơn hàng</Link>
        </div>
      </main>
    </>
  );

  const currentStatus = shipment.status;
  const currentIdx = TIMELINE_STATUSES.indexOf(currentStatus);
  const isTerminal = ["Delivered", "Cancelled", "Failed", "Returned"].includes(currentStatus);

  return (
    <>
      <BookSubNav />
      <main className="bg-[#f5f6fa] min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-xl mx-auto px-5 py-3 text-sm text-gray-500 flex items-center gap-2">
            <Link href="/don-hang" className="hover:text-gray-800">Đơn hàng</Link>
            <span>/</span>
            <Link href={`/don-hang/${id}`} className="hover:text-gray-800">Chi tiết</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">Theo dõi vận đơn</span>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-5 py-8 flex flex-col gap-5">

          {/* ── Shipment Info ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
              <div>
                <p className="text-xs text-gray-500 mb-1">Mã vận đơn</p>
                <p className="font-mono text-lg font-black text-gray-900">
                  {shipment.trackingNumber ?? "Chưa có mã vận đơn"}
                </p>
              </div>
              {(() => {
                const cfg = SHIPPING_STATUS_CONFIG[currentStatus] ?? { label: currentStatus, color: "#374151", bg: "#f3f4f6", icon: "📦" };
                return (
                  <span className="px-3 py-1.5 rounded-full text-sm font-semibold"
                    style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                    {cfg.icon} {cfg.label}
                  </span>
                );
              })()}
            </div>

            <div className="text-sm text-gray-600 flex flex-col gap-1">
              <p><span className="text-gray-400">Đơn vị VC:</span> {shipment.provider}</p>
              <p><span className="text-gray-400">Người nhận:</span> {shipment.receiverName} — {shipment.receiverPhone}</p>
              <p><span className="text-gray-400">Địa chỉ:</span> {shipment.receiverAddress}</p>
            </div>
          </div>

          {/* ── Progress timeline (main flow) ────────────────────────── */}
          {!["Cancelled", "Failed", "Returned"].includes(currentStatus) && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-700 mb-5">Tiến trình giao hàng</h2>
              <div className="relative flex flex-col gap-0">
                {TIMELINE_STATUSES.map((s, idx) => {
                  const done   = currentIdx > idx;
                  const active = currentIdx === idx;
                  const future = currentIdx < idx && !isTerminal;
                  const cfg = SHIPPING_STATUS_CONFIG[s] ?? { label: s, color: "#374151", bg: "#f3f4f6", icon: "•" };

                  return (
                    <div key={s} className="flex items-start gap-4 relative pb-6 last:pb-0">
                      {/* vertical connector */}
                      {idx < TIMELINE_STATUSES.length - 1 && (
                        <div className={`absolute left-5 top-10 bottom-0 w-0.5 ${done ? "bg-green-400" : "bg-gray-200"}`} />
                      )}
                      {/* dot */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 text-base
                        ${done ? "bg-green-400 text-white"
                          : active ? "ring-2 ring-offset-2 text-white" : "bg-gray-100 text-gray-300"}
                      `}
                        style={active ? ({ backgroundColor: cfg.bg, color: cfg.color } as React.CSSProperties) : {}}>
                        {done ? "✓" : cfg.icon}
                      </div>
                      <div className="pt-2">
                        <p className={`text-sm font-semibold ${future ? "text-gray-300" : done ? "text-green-700" : active ? "text-gray-900" : "text-gray-400"}`}>
                          {cfg.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── History log ──────────────────────────────────────────── */}
          {shipment.history && shipment.history.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-700 mb-4">Lịch sử cập nhật</h2>
              <div className="flex flex-col gap-3">
                {[...shipment.history].reverse().map((ev, i) => {
                  const cfg = SHIPPING_STATUS_CONFIG[ev.status] ?? { label: ev.status, color: "#374151", bg: "#f3f4f6", icon: "•" };
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: cfg.color }}>{cfg.label}</p>
                        {ev.description && <p className="text-xs text-gray-500 mt-0.5">{ev.description}</p>}
                        {ev.occurredAt && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {fmtDateTime(ev.occurredAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <Link href={`/don-hang/${id}`}
              className="px-5 py-2.5 rounded-xl border-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              style={{ borderColor: "#d1d5db" }}>
              ← Về đơn hàng
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
