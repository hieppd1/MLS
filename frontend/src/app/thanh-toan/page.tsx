"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BookCover from "@/components/books/BookCover";
import BookSubNav from "@/components/books/BookSubNav";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { selectCartItems, selectCartTotal, clearCart } from "@/lib/features/cart/cartSlice";
import { useCreateCheckoutMutation } from "@/lib/features/orders/ordersApi";
import { useFormatters } from "@/lib/hooks/useFormatters";
import { useCalculateFeeMutation } from "@/lib/features/shipping/shippingApi";
import { useTranslations } from "next-intl";

const MLS_NAVY = "#0a2540";
const MLS_RED  = "#e5173f";

const PAYMENT_METHODS = [
  { id: "BankTransfer", label: "Chuyển khoản ngân hàng", icon: "🏦", desc: "Thanh toán sau khi nhận hướng dẫn" },
  { id: "VNPay",        label: "VNPay",                   icon: "💳", desc: "Thẻ ATM, Visa, MasterCard, QR" },
  { id: "MoMo",         label: "Ví MoMo",                 icon: "📱", desc: "Ví điện tử MoMo" },
];

const TYPE_LABELS: Record<string, string> = {
  Ebook: "E-book", Physical: "Sách in", Combo: "Combo",
};

export default function ThanhToanPage() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const t = useTranslations();
  const items    = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartTotal);
  const { fmtCurrency } = useFormatters();

  const hasPhysical = items.some((i) => i.type === "Physical" || i.type === "Combo");
  const [shippingFee, setShippingFee] = useState(hasPhysical ? 30000 : 0);
  const total = subtotal + shippingFee;

  const [paymentMethod, setPaymentMethod] = useState("BankTransfer");
  const [form, setForm] = useState({
    name: "", phone: "", address: "", province: "", district: "", ward: "", notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feeLoading, setFeeLoading] = useState(false);

  const [createCheckout, { isLoading }] = useCreateCheckoutMutation();
  const [calculateFee] = useCalculateFeeMutation();

  // Auto-calculate fee when province + district filled
  useEffect(() => {
    if (!hasPhysical || !form.province.trim() || !form.district.trim()) return;
    let cancelled = false;
    setFeeLoading(true);
    calculateFee({
      receiverProvinceCode: form.province.trim(),
      receiverDistrictCode: form.district.trim(),
      weight: 500,
    }).unwrap().then((res) => {
      if (!cancelled && res.success) setShippingFee(res.fee);
    }).catch(() => {}).finally(() => { if (!cancelled) setFeeLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.province, form.district, hasPhysical]);

  // Redirect if cart empty
  if (items.length === 0) {
    return (
      <>
        <BookSubNav />
        <main className="bg-[#f5f6fa] min-h-screen flex items-center justify-center">
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🛒</p>
            <p className="text-xl font-semibold text-gray-700 mb-3">{t("cart.empty")}</p>
            <Link href="/sach" className="inline-block px-6 py-3 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: MLS_NAVY }}>
              {t("cart.continue_shopping")}
            </Link>
          </div>
        </main>
      </>
    );
  }

  function validate(): boolean {
    if (!hasPhysical) return true;
    const e: Record<string, string> = {};
    if (!form.name.trim())    e.name    = t("payment.err_name");
    if (!form.phone.trim())   e.phone   = t("payment.err_phone");
    if (!form.address.trim()) e.address = t("payment.err_address");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      const result = await createCheckout({
        items: items.map((i) => ({
          bookId:     i.itemType === "Course" ? null : i.id,
          title:      i.title,
          type:       i.type,
          unitPrice:  i.discountPrice ?? i.price,
          quantity:   i.quantity,
          slug:       i.slug,
          coverColor: i.coverColor,
          coverEmoji: i.coverEmoji,
          coverUrl:   i.coverUrl,
          itemType:   i.itemType ?? "Book",
          courseId:   i.courseId ?? null,
        })),
        paymentMethod,
        shippingName:    hasPhysical ? form.name    : undefined,
        shippingPhone:   hasPhysical ? form.phone   : undefined,
        shippingAddress: hasPhysical ? form.address : undefined,
        shippingProvince: hasPhysical ? form.province : undefined,
        shippingDistrict: hasPhysical ? form.district : undefined,
        shippingWard:    hasPhysical ? form.ward    : undefined,
        notes:           form.notes || undefined,
      }).unwrap();

      dispatch(clearCart());

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        router.push(`/thanh-toan/ket-qua?orderId=${result.orderId}&orderCode=${result.orderCode}`);
      }
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? t("errors.server_error");
      alert(msg);
    }
  }

  return (
    <>
      <BookSubNav />
      <main className="bg-[#f5f6fa] min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-5 py-3 text-sm text-gray-500 flex items-center gap-2">
            <Link href="/sach" className="hover:text-gray-800">{t("payment.store_breadcrumb")}</Link>
            <span>/</span>
            <Link href="/gio-hang" className="hover:text-gray-800">{t("cart.title")}</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">{t("payment.title")}</span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-5 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("payment.confirm_order")}</h1>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

              {/* ── LEFT: Shipping + Payment ───────────────────────────────── */}
              <div className="lg:col-span-3 flex flex-col gap-5">

                {/* Shipping (only for physical books) */}
                {hasPhysical && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-gray-900 mb-4">{t("payment.shipping_info")}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { key: "name",    label: t("payment.label_name"), full: true },
                        { key: "phone",   label: t("payment.label_phone") },
                        { key: "address", label: t("payment.label_address"), full: true },
                        { key: "province", label: t("payment.label_province") },
                        { key: "district", label: t("payment.label_district") },
                        { key: "ward",    label: t("payment.label_ward") },
                      ].map(({ key, label, full }) => (
                        <div key={key} className={full ? "sm:col-span-2" : ""}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                          <input
                            type="text"
                            value={form[key as keyof typeof form]}
                            onChange={(e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setErrors((prev) => ({ ...prev, [key]: "" })); }}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-gray-50"
                          />
                          {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
                        </div>
                      ))}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">{t("payment.label_notes")}</label>
                        <textarea
                          value={form.notes}
                          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                          rows={2}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment method */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-base font-bold text-gray-900 mb-4">{t("payment.method_title")}</h2>
                  <div className="flex flex-col gap-3">
                    {PAYMENT_METHODS.map((pm) => (
                      <label key={pm.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === pm.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <input type="radio" name="paymentMethod" value={pm.id}
                          checked={paymentMethod === pm.id}
                          onChange={() => setPaymentMethod(pm.id)}
                          className="hidden" />
                        <span className="text-2xl">{pm.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{pm.label}</p>
                          <p className="text-xs text-gray-500">{pm.desc}</p>
                        </div>
                        {paymentMethod === pm.id && (
                          <span className="ml-auto text-blue-600 text-lg">✓</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── RIGHT: Order summary ───────────────────────────────────── */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
                  <h2 className="text-base font-bold text-gray-900 mb-4">{t("payment.order_count", { count: items.length })}</h2>

                  <div className="flex flex-col gap-3 mb-5">
                    {items.map((item) => {
                      const price = item.discountPrice ?? item.price;
                      return (
                        <div key={item.id} className="flex gap-3 items-center">
                          <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 shadow-sm">
                            <BookCover title={item.title} coverColor={item.coverColor}
                              coverEmoji={item.coverEmoji} coverUrl={item.coverUrl}
                              className="w-full h-full" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">{item.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{TYPE_LABELS[item.type] ?? item.type} · x{item.quantity}</p>
                          </div>
                          <p className="text-sm font-bold shrink-0" style={{ color: MLS_RED }}>
                            {fmtCurrency(price * item.quantity)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{t("cart.subtotal")}</span>
                      <span>{fmtCurrency(subtotal)}</span>
                    </div>
                    {hasPhysical && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{t("cart.shipping")}</span>
                        <span>
                          {feeLoading
                            ? <span className="inline-block w-16 h-4 bg-gray-200 rounded animate-pulse" />
                            : shippingFee > 0 ? fmtCurrency(shippingFee) : t("cart.free_shipping")}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100 mt-1">
                      <span>{t("cart.total")}</span>
                      <span style={{ color: MLS_RED }}>{fmtCurrency(total)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-5 py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: MLS_RED }}>
                    {isLoading ? t("payment.processing") : t("payment.place_order")}
                  </button>

                  <p className="text-xs text-center text-gray-400 mt-3">
                    {t("payment.terms_note")} <span className="underline cursor-pointer">{t("payment.terms_link")}</span>
                  </p>
                </div>
              </div>

            </div>
          </form>
        </div>
      </main>
    </>
  );
}
