"use client";

import Link from "next/link";
import BookCover from "@/components/books/BookCover";
import BookSubNav from "@/components/books/BookSubNav";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useTranslations } from "next-intl";
import { selectCartItems, selectCartTotal, removeFromCart, updateQuantity } from "@/lib/features/cart/cartSlice";
import { useFormatters } from "@/lib/hooks/useFormatters";

const MLS_NAVY = "#0a2540";
const MLS_RED = "#e5173f";

const TYPE_LABELS: Record<string, string> = {
  Ebook:    "E-book",
  Physical: "Sách in",
  Combo:    "Combo",
};

export default function GioHangPage() {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const total = useAppSelector(selectCartTotal);
  const { fmtCurrency } = useFormatters();

  const subtotal = total;
  const shipping = items.some((i) => i.type === "Physical" || i.type === "Combo") ? 30000 : 0;
  const grand = subtotal + shipping;

  if (items.length === 0) {
    return (
      <>
        <BookSubNav />
        <main className="bg-[#f5f6fa] min-h-screen flex items-center justify-center">
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🛒</p>
            <p className="text-xl font-semibold text-gray-700 mb-2">{t("cart.empty")}</p>
            <p className="text-gray-400 text-sm mb-6">{t("cart.empty_desc")}</p>
            <Link
              href="/sach"
              className="inline-block px-6 py-3 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: MLS_NAVY }}
            >{t("cart.continue_shopping")}
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
        <div className="max-w-7xl mx-auto px-5 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("cart.title_with_count", { count: items.length })}</h1>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Items list */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              {items.map((item) => {
                const activePrice = item.discountPrice ?? item.price;
                const hasDiscount = item.discountPrice != null;

                return (
                  <div key={item.id} className="bg-white rounded-xl p-4 flex gap-4 shadow-sm border border-gray-100">
                    {/* Book cover thumbnail */}
                    <Link href={`/sach/${item.slug}`} className="shrink-0 w-16 rounded-lg overflow-hidden shadow" style={{ height: 84 }}>
                      <BookCover
                        title={item.title}
                        coverColor={item.coverColor}
                        coverEmoji={item.coverEmoji}
                        coverUrl={item.coverUrl}
                        className="w-full h-full"
                      />
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/sach/${item.slug}`} className="text-sm font-semibold text-gray-900 hover:text-[#0a2540] line-clamp-2 leading-snug">
                        {item.title}
                      </Link>
                      <p className="text-xs text-gray-400 mt-1">{TYPE_LABELS[item.type] ?? item.type}</p>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity (only for physical books) */}
                        {item.type === "Physical" || item.type === "Combo" ? (
                          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                            <button
                              onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))}
                              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-lg leading-none"
                            >−</button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <button
                              onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-lg leading-none"
                            >+</button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">x1</span>
                        )}

                        {/* Price */}
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold" style={{ color: MLS_RED }}>
                            {fmtCurrency(activePrice * item.quantity)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-gray-400 line-through">{fmtCurrency(item.price * item.quantity)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => dispatch(removeFromCart(item.id))}
                      className="shrink-0 text-gray-300 hover:text-red-400 transition-colors self-start mt-1"
                      aria-label={t("cart.remove")}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}

              <Link href="/sach" className="text-sm text-[#0a2540] hover:underline mt-2">
                ← {t("cart.continue_shopping")}
              </Link>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 sticky top-24">
                <h2 className="text-base font-bold text-gray-900 mb-4">{t("cart.order_summary")}</h2>

                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{t("cart.subtotal")}</span>
                    <span>{fmtCurrency(subtotal)}</span>
                  </div>
                  {shipping > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>{t("cart.shipping")}</span>
                      <span>{fmtCurrency(shipping)}</span>
                    </div>
                  )}
                  {shipping === 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{t("cart.shipping")}</span>
                      <span className="font-medium">{t("cart.free_shipping")}</span>
                    </div>
                  )}

                  <hr className="border-gray-100 my-1" />

                  <div className="flex justify-between font-bold text-base text-gray-900">
                    <span>{t("cart.total")}</span>
                    <span style={{ color: MLS_RED }}>{fmtCurrency(grand)}</span>
                  </div>
                </div>

                <Link
                  href="/thanh-toan"
                  className="mt-5 block w-full py-3 text-center text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: MLS_RED }}
                >
                  {t("cart.checkout_btn")}
                </Link>

                <p className="text-[11px] text-gray-400 text-center mt-3">{t("cart.safe_payment")}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
