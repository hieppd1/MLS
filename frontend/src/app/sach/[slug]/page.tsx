"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BookCover from "@/components/books/BookCover";
import BookSubNav from "@/components/books/BookSubNav";
import { useGetBookBySlugQuery } from "@/lib/features/books/booksApi";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { addToCart, selectCartItems } from "@/lib/features/cart/cartSlice";
import {
  useGetBookReviewsQuery,
  useGetMyBookReviewQuery,
  useCreateBookReviewMutation,
  useUpdateBookReviewMutation,
  useDeleteBookReviewMutation,
} from "@/lib/features/books/bookReviewsApi";
import { useFormatters } from "@/lib/hooks/useFormatters";
import { useTranslations } from "next-intl";

const MLS_NAVY = "#0a2540";
const MLS_RED = "#e5173f";

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  Ebook:    { label: "Ebook",   cls: "bg-violet-50 text-violet-700 border border-violet-200" },
  Physical: { label: "Sách in", cls: "bg-sky-50 text-sky-700 border border-sky-200" },
  Combo:    { label: "Combo",   cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
};

function Stars({ rating }: { rating: number }) {
  const r = Math.round(rating);
  return (
    <span className="inline-flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className="w-3.5 h-3.5" viewBox="0 0 20 20" fill={i <= r ? "#f59e0b" : "#e5e7eb"}>
          <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7" />
        </svg>
      ))}
    </span>
  );
}

export default function BookDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [activeTab, setActiveTab] = useState<"desc" | "toc" | "res" | "rev">("desc");
  const [qty, setQty] = useState(1);
  const [saved, setSaved] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: "", title: "" });
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);

  const { data: book, isLoading, isError } = useGetBookBySlugQuery(slug, { skip: !slug });
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const inCart = book ? cartItems.some((i) => i.id === book.id) : false;
  const user = useAppSelector((s) => s.auth.user);

  // Reviews data
  const { data: reviewsData } = useGetBookReviewsQuery(
    { bookId: book?.id ?? "", pageSize: 20 },
    { skip: !book?.id || activeTab !== "rev" }
  );
  const { data: myReview } = useGetMyBookReviewQuery(book?.id ?? "", {
    skip: !book?.id || !user || activeTab !== "rev",
  });
  const [createReview, { isLoading: isCreatingReview }] = useCreateBookReviewMutation();
  const [updateReview, { isLoading: isUpdatingReview }] = useUpdateBookReviewMutation();
  const [deleteReview] = useDeleteBookReviewMutation();

  const { fmtCurrency, fmtDate } = useFormatters();
  const t = useTranslations("sach");
  const td = useTranslations("book_detail_extra");

  if (isLoading) return (
    <>
      <BookSubNav />
      <main className="bg-[#f5f6fa] min-h-screen">
        <div className="max-w-6xl mx-auto px-5 py-8">
          <div className="animate-pulse bg-white rounded-2xl h-96" />
        </div>
      </main>
    </>
  );

  if (isError || !book) return (
    <>
      <BookSubNav />
      <main className="bg-[#f5f6fa] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">📚</p>
          <p className="text-gray-600 font-medium">{t("not_found")}</p>
          <Link href="/sach" className="mt-4 inline-block text-[#e5173f] hover:underline text-sm">{td("back_to_shop_link")}</Link>
        </div>
      </main>
    </>
  );

  const badge = TYPE_BADGE[book.type] ?? TYPE_BADGE.Ebook;
  const activePrice = book.discountPrice ?? book.price;
  const hasDiscount = book.discountPrice != null && book.discountPrice < book.price;
  const discountPct = hasDiscount ? Math.round((1 - book.discountPrice! / book.price) * 100) : 0;
  const savings = hasDiscount ? book.price - book.discountPrice! : 0;

  function handleAddToCart() {
    for (let i = 0; i < qty; i++) {
      dispatch(addToCart({
        id: book!.id, title: book!.title, slug: book!.slug,
        coverColor: book!.coverColor, coverEmoji: book!.coverEmoji, coverUrl: book!.coverUrl,
        type: book!.type, price: book!.price, discountPrice: book!.discountPrice,
      }));
    }
  }

  const tabs: { id: "desc" | "toc" | "res" | "rev"; label: string }[] = [
    { id: "desc", label: t("tab_description") },
    { id: "toc",  label: t("tab_toc") },
    { id: "res",  label: td("tab_resources") },
    { id: "rev",  label: t("tab_reviews", { count: book.reviewCount }) },
  ];

  return (
    <>
      <BookSubNav />
      <main className="bg-[#f5f6fa] min-h-screen">
        {/* Breadcrumb bar */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-5 py-2.5 flex items-center gap-2 text-xs text-gray-400">
            <Link href="/sach" className="flex items-center gap-1 font-semibold hover:opacity-70 transition-opacity" style={{ color: MLS_NAVY }}>
              {td("breadcrumb_back")}
            </Link>
            <span className="text-gray-300">›</span>
            <span className="truncate max-w-xs text-gray-600">{book.title}</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-5 py-7">
          {/* ── Product block ──────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5 shadow-sm">
            <div className="grid lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">

              {/* LEFT: Cover + actions + specs */}
              <div className="lg:col-span-2 p-7 flex flex-col items-center bg-gray-50">
                <div className="w-full max-w-[220px] mb-5">
                  <BookCover
                    title={book.title}
                    author={book.author}
                    coverColor={book.coverColor}
                    coverEmoji={book.coverEmoji}
                    coverUrl={book.coverUrl}
                    className="w-full shadow-xl"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 w-full max-w-[220px] mb-6">
                  <button className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 py-2 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-colors">
                    👁 {td("preview")}
                  </button>
                  <button
                    onClick={() => setSaved((s) => !s)}
                    className={`flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold py-2 rounded-xl border transition-colors ${saved ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-gray-200 text-gray-600 hover:border-red-200"}`}
                  >
                    {saved ? t("saved") : t("wishlist")}
                  </button>
                  <button className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors text-gray-500 text-sm">
                    ↗
                  </button>
                </div>

                {/* Quick specs */}
                <div className="w-full max-w-[220px] rounded-xl border border-gray-100 overflow-hidden text-xs divide-y divide-gray-100">
                  {([
                    book.pageCount  ? [td("spec_pages"),     td("pages_unit", { n: book.pageCount })]  : null,
                    book.publisher  ? [td("spec_publisher"), book.publisher]             : null,
                    book.isbn       ? [td("spec_isbn"),      book.isbn]                 : null,
                  ] as ([string, string] | null)[]).filter(Boolean).map((row, i) => (
                    <div key={i} className="flex justify-between px-3 py-2 bg-white">
                      <span className="text-gray-400">{row![0]}</span>
                      <span className="font-semibold text-gray-700">{row![1]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: Info */}
              <div className="lg:col-span-3 p-7">
                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${badge.cls}`}>
                    {book.type === "Physical" ? t("type_print") : book.type === "Combo" ? t("type_combo") : t("type_ebook")}
                  </span>
                  {book.isFeatured && (
                    <span className="text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
                      {td("best_value")}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-xl font-black text-gray-900 leading-snug mb-2">{book.title}</h1>

                {/* Author + pages */}
                <p className="text-sm text-gray-500 mb-4">
                  {t("author_label")}{" "}
                  <span className="font-semibold" style={{ color: "#4f46e5" }}>{book.author ?? "—"}</span>
                  {book.pageCount && <> · {td("pages_unit", { n: book.pageCount })}</>}
                </p>

                {/* Rating row */}
                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-amber-500">{book.rating.toFixed(1)}</span>
                    <Stars rating={book.rating} />
                    <span className="text-xs text-gray-400">{t("rating_count", { count: book.reviewCount })}</span>
                  </div>
                  <span className="ml-auto text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    {t("stock_badge", { count: Math.max(1, 20 - book.purchaseCount % 20) })}
                  </span>
                </div>

                {/* Price box */}
                <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 mb-5">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="text-3xl font-black text-red-600">
                      {activePrice === 0 ? t("free") : fmtCurrency(activePrice)}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-gray-400 line-through">{fmtCurrency(book.price)}</span>
                    )}
                  </div>
                  {hasDiscount && (
                    <div className="flex items-center gap-2">
                      <span
                        className="text-white text-[10px] font-black px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: MLS_RED }}
                      >
                        -{discountPct}%
                      </span>
                      <span className="text-sm font-semibold text-red-600">
                        {t("save_amount", { amount: fmtCurrency(savings) })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quantity */}
                {book.type !== "Ebook" && (
                  <div className="flex items-center gap-4 mb-5">
                    <span className="text-sm font-semibold text-gray-700">{t("quantity")}</span>
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-lg font-bold transition-colors"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                      <button
                        onClick={() => setQty((q) => q + 1)}
                        className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-lg font-bold transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* CTA buttons */}
                {book.isOwned ? (
                  <button
                    className="w-full py-3.5 rounded-xl font-bold text-white text-sm mb-4"
                    style={{ backgroundColor: MLS_NAVY }}
                  >
                    {t("read_now")}
                  </button>
                ) : (
                  <div className="space-y-2.5 mb-5">
                    <Link
                      href="/gio-hang"
                      onClick={() => !inCart && handleAddToCart()}
                      className="w-full py-3.5 rounded-xl font-black text-white text-sm text-center flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: MLS_RED }}
                    >
                      {t("buy_now")}
                    </Link>
                    <button
                      onClick={handleAddToCart}
                      disabled={inCart}
                      className="w-full py-3.5 rounded-xl font-black text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 bg-orange-500 hover:bg-orange-600"
                    >
                      {inCart ? t("added_to_cart") : t("add_to_cart")}
                    </button>
                  </div>
                )}

                {/* Trust badges */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  {[
                    ["🚚", td("trust_shipping")],
                    ["🔄", td("trust_return")],
                    ["🔒", td("trust_secure")],
                    ["✅", td("trust_authentic")],
                  ].map(([icon, label]) => (
                    <div key={label} className="flex items-center gap-2">
                      <span>{icon}</span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Tabs section ──────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors -mb-px ${activeTab === tab.id ? "" : "border-transparent text-gray-400 hover:text-gray-700"}`}
                  style={activeTab === tab.id ? { borderBottomColor: MLS_NAVY, color: MLS_NAVY } : {}}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === "desc" && (
                <div>
                  <p className="text-gray-600 text-sm leading-7 mb-5">
                    {book.description ?? book.shortDescription ?? td("no_description")}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { icon: "🎓", label: td("desc_audience_label"),  value: td("desc_audience_value") },
                      { icon: "🕐", label: td("desc_time_label"),      value: book.type === "Ebook" ? td("desc_time_ebook") : td("desc_time_physical") },
                      { icon: "🌐", label: td("desc_language_label"),  value: td("desc_language_value") },
                      { icon: "🏆", label: td("desc_goal_label"),      value: td("desc_goal_value") },
                    ].map((s) => (
                      <div key={s.label} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3.5">
                        <span className="text-xl mt-0.5">{s.icon}</span>
                        <div>
                          <p className="text-[11px] text-gray-400 mb-0.5">{s.label}</p>
                          <p className="text-xs font-semibold text-gray-800">{s.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "toc" && (
                <p className="text-sm text-gray-400 italic">{td("toc_placeholder")}</p>
              )}

              {activeTab === "res" && (
                <p className="text-sm text-gray-400 italic">{td("resources_placeholder")}</p>
              )}

              {activeTab === "rev" && (
                <div>
                  {/* Summary */}
                  {reviewsData && (
                    <div className="flex gap-6 bg-gray-50 rounded-2xl p-5 mb-6">
                      <div className="text-center shrink-0">
                        <p className="text-5xl font-black text-amber-500 leading-none mb-2">
                          {reviewsData.summary.averageRating.toFixed(1)}
                        </p>
                        <Stars rating={reviewsData.summary.averageRating} />
                        <p className="text-[11px] text-gray-400 mt-1.5">{t("rating_count", { count: reviewsData.summary.totalReviews })}</p>
                      </div>
                      <div className="flex-1 space-y-2 my-auto">
                        {[5, 4, 3, 2, 1].map((s) => {
                          const key = `star${s}` as "star5" | "star4" | "star3" | "star2" | "star1";
                          const cnt = reviewsData.summary[key];
                          const pct = reviewsData.summary.totalReviews > 0
                            ? Math.round((cnt / reviewsData.summary.totalReviews) * 100) : 0;
                          return (
                            <div key={s} className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 w-4 text-right">{s}</span>
                              <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 20 20" fill="#f59e0b">
                                <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7"/>
                              </svg>
                              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[10px] text-gray-400 w-7">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Write / Edit review */}
                  {user && book && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        {myReview ? td("your_review") : t("write_review")}
                      </h3>
                      {myReview ? (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Stars rating={myReview.rating} />
                            <span className="text-sm font-semibold text-gray-700">{myReview.rating}/5</span>
                            {myReview.isVerifiedPurchase && (
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{td("purchased_badge")}</span>
                            )}
                          </div>
                          {myReview.title && <p className="font-medium text-sm text-gray-900 mb-1">{myReview.title}</p>}
                          <p className="text-sm text-gray-600 mb-3">{myReview.content}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setReviewForm({ rating: myReview.rating, content: myReview.content, title: myReview.title ?? "" });
                              }}
                              className="text-xs text-indigo-600 hover:underline"
                            >
                              {td("edit_review")}
                            </button>
                            <button
                              onClick={async () => {
                                await deleteReview({ bookId: book.id, reviewId: myReview.id }).unwrap().catch(() => {});
                              }}
                              className="text-xs text-red-500 hover:underline"
                            >
                              {td("delete_review")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Star selector */}
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map((s) => (
                              <button key={s} onClick={() => setReviewForm(f => ({ ...f, rating: s }))}>
                                <svg className="w-6 h-6 transition-colors" viewBox="0 0 20 20"
                                  fill={s <= reviewForm.rating ? "#f59e0b" : "#d1d5db"}>
                                  <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7"/>
                                </svg>
                              </button>
                            ))}
                            <span className="text-sm text-gray-500 ml-2">{reviewForm.rating}/5</span>
                          </div>
                          <input
                            value={reviewForm.title}
                            onChange={(e) => setReviewForm(f => ({ ...f, title: e.target.value }))}
                            placeholder={td("review_title_placeholder")}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                          />
                          <textarea
                            rows={3}
                            value={reviewForm.content}
                            onChange={(e) => setReviewForm(f => ({ ...f, content: e.target.value }))}
                            placeholder={td("review_content_placeholder")}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none"
                          />
                          {reviewMsg && <p className="text-sm text-red-500">{reviewMsg}</p>}
                          <button
                            disabled={isCreatingReview || !reviewForm.content.trim()}
                            onClick={async () => {
                              setReviewMsg(null);
                              try {
                                await createReview({
                                  bookId: book.id,
                                  rating: reviewForm.rating,
                                  content: reviewForm.content,
                                  title: reviewForm.title || undefined,
                                }).unwrap();
                                setReviewForm({ rating: 5, content: "", title: "" });
                              } catch (e: unknown) {
                                const err = e as { data?: { message?: string } };
                                setReviewMsg(err?.data?.message ?? td("review_submit_failed"));
                              }
                            }}
                            className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            style={{ backgroundColor: "#4f46e5" }}
                          >
                            {isCreatingReview ? td("submitting") : td("submit_review")}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Review list */}
                  {reviewsData && reviewsData.reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviewsData.reviews.map((r) => (
                        <div key={r.id} className="bg-gray-50 rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                                {r.userName?.charAt(0).toUpperCase() ?? "?"}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{r.userName}</p>
                                <div className="flex items-center gap-1.5">
                                  <Stars rating={r.rating} />
                                  {r.isVerifiedPurchase && (
                                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-px rounded-full">{td("purchased_badge")}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] text-gray-400">
                              {fmtDate(r.createdAt)}
                            </span>
                          </div>
                          {r.title && <p className="font-semibold text-sm text-gray-900 mb-1">{r.title}</p>}
                          <p className="text-sm text-gray-600 leading-relaxed">{r.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic text-center py-6">
                      {user ? td("no_reviews_user") : td("no_reviews")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

