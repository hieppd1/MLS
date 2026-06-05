"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import BookCover from "./BookCover";
import { addToCart } from "@/lib/features/cart/cartSlice";
import { useAppDispatch } from "@/lib/hooks";
import type { BookListItem } from "@/lib/features/books/booksApi";
import { useFormatters } from "@/lib/hooks/useFormatters";

const MLS_NAVY = "#0a2540";
const MLS_RED = "#e5173f";

const TYPE_BADGE: Record<string, { key: string; icon: string; cls: string }> = {
  Ebook:    { key: "type_ebook",    icon: "📱", cls: "bg-violet-50 text-violet-700 border border-violet-200" },
  Physical: { key: "type_physical", icon: "📖", cls: "bg-sky-50 text-sky-700 border border-sky-200" },
  Combo:    { key: "type_combo",    icon: "📚", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
};

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className="w-2.5 h-2.5" viewBox="0 0 20 20"
          fill={i <= rounded ? "#f59e0b" : "#e5e7eb"}>
          <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7" />
        </svg>
      ))}
    </span>
  );
}

interface BookCardProps {
  book: BookListItem;
}

export default function BookCard({ book }: BookCardProps) {
  const dispatch = useAppDispatch();
  const { fmtCurrency } = useFormatters();
  const t = useTranslations("book_card");
  const tf = useTranslations("books_filters_extra");
  const [wishlisted, setWishlisted] = useState(false);
  const badge = TYPE_BADGE[book.type] ?? TYPE_BADGE.Ebook;
  const activePrice = book.discountPrice ?? book.price;
  const hasDiscount = book.discountPrice != null && book.discountPrice < book.price;
  const discountPct = hasDiscount ? Math.round((1 - book.discountPrice! / book.price) * 100) : 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    dispatch(addToCart({
      id: book.id,
      title: book.title,
      slug: book.slug,
      coverColor: book.coverColor,
      coverEmoji: book.coverEmoji,
      coverUrl: book.coverUrl,
      type: book.type,
      price: book.price,
      discountPrice: book.discountPrice,
    }));
  }

  return (
    <Link
      href={`/sach/${book.slug}`}
      className="group block bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
    >
      {/* Book cover */}
      <div className="relative cursor-pointer">
        <BookCover
          title={book.title}
          author={book.author}
          coverColor={book.coverColor}
          coverEmoji={book.coverEmoji}
          coverUrl={book.coverUrl}
          className="w-full"
        />

        {/* Discount badge — top left */}
        {hasDiscount && (
          <span
            className="absolute top-2 left-2 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md"
            style={{ backgroundColor: MLS_RED }}
          >
            -{discountPct}%
          </span>
        )}

        {/* Wishlist — top right */}
        <button
          onClick={(e) => { e.preventDefault(); setWishlisted((v) => !v); }}
          className="absolute top-2 right-2 w-6 h-6 bg-white/95 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          aria-label={t("wishlist_aria")}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24"
            fill={wishlisted ? "#e5173f" : "none"}
            stroke={wishlisted ? "#e5173f" : "#9ca3af"}
            strokeWidth={2}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Info — compact */}
      <div className="px-2.5 pt-2 pb-2.5 flex flex-col flex-1">
        {/* Type badge with icon */}
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full w-fit ${badge.cls}`}>
          <span className="text-[10px]">{badge.icon}</span>
          {tf(badge.key)}
        </span>

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-[12px] leading-snug mt-1.5 mb-0.5 line-clamp-2 group-hover:text-blue-700 transition-colors">
          {book.title}
        </h3>

        {/* Author */}
        {book.author && (
          <p className="text-[10px] text-gray-400 truncate mb-1">{book.author}</p>
        )}

        {/* Stars + review count */}
        <div className="flex items-center gap-1 mb-2">
          <Stars rating={book.rating} />
          <span className="text-[10px] text-gray-400">({book.reviewCount})</span>
        </div>

        {/* Price + button */}
        <div className="mt-auto space-y-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="font-black text-sm" style={{ color: MLS_RED }}>
              {activePrice === 0 ? t("free") : fmtCurrency(activePrice)}
            </span>
            {hasDiscount && (
              <span className="text-[10px] text-gray-400 line-through">
                {fmtCurrency(book.price)}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className="w-full text-white text-[11px] font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.98] bg-orange-500 hover:bg-orange-600"
          >
            🛒 {t("add_to_cart")}
          </button>
        </div>
      </div>
    </Link>
  );
}
