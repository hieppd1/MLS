"use client";

import { useEffect, useRef, useState } from "react";
import BookCover from "./BookCover";

const MLS_RED = "#e5173f";

interface Slide {
  id: string;
  tag: string;
  badge: string;
  title: string;
  subtitle: string;
  bg: [string, string];
  subColor: string;
  book: { title: string; author: string; coverColor: string; coverEmoji: string; coverUrl?: string | null };
  ctaLabel: string;
  ctaHref: string;
}

const DEFAULT_SLIDES: Slide[] = [
  {
    id: "s1",
    tag: "Bán chạy #1",
    badge: "Tiết kiệm 26%",
    title: "IELTS Complete\nPreparation Kit",
    subtitle: "Bộ tài liệu hoàn chỉnh 4 kỹ năng — cam kết đạt band mục tiêu.",
    bg: ["#1e3a8a", "#312e81"],
    subColor: "rgba(199,210,254,0.9)",
    book: { title: "IELTS Complete Preparation Kit", author: "Nguyễn Thị Mai", coverColor: "#312e81", coverEmoji: "🏆" },
    ctaLabel: "Mua ngay",
    ctaHref: "/sach",
  },
  {
    id: "s2",
    tag: "Ưu đãi hôm nay",
    badge: "Giảm 19%",
    title: "TOEIC 600+\nVocabulary Mastery",
    subtitle: "600+ từ vựng thiết yếu theo chủ đề, kèm video bài giảng & flashcard.",
    bg: ["#0f766e", "#0369a1"],
    subColor: "rgba(167,243,208,0.9)",
    book: { title: "TOEIC 600+ Vocabulary", author: "Nguyễn Minh Anh", coverColor: "#0369a1", coverEmoji: "📘" },
    ctaLabel: "Xem ngay",
    ctaHref: "/sach?type=Ebook",
  },
  {
    id: "s3",
    tag: "Mới nhất 2025",
    badge: "Combo 3-in-1",
    title: "Complete English\nGrammar Guide",
    subtitle: "Trọn bộ ngữ pháp — sách in, ebook và 500+ bài tập tương tác.",
    bg: ["#92400e", "#b45309"],
    subColor: "rgba(253,230,138,0.9)",
    book: { title: "Complete English Grammar", author: "Lê Văn Dũng", coverColor: "#1a6b3d", coverEmoji: "📙" },
    ctaLabel: "Khám phá",
    ctaHref: "/sach?type=Combo",
  },
  {
    id: "s4",
    tag: "Giảm sâu 27%",
    badge: "Tải ngay",
    title: "IELTS Writing\nBand 7+ Strategy",
    subtitle: "Template, từ vựng học thuật và 50+ bài mẫu phân tích theo từng tiêu chí.",
    bg: ["#4c1d95", "#6d28d9"],
    subColor: "rgba(221,214,254,0.9)",
    book: { title: "IELTS Writing Band 7+", author: "TS. Nguyễn Hoài Thu", coverColor: "#6d28d9", coverEmoji: "✍️" },
    ctaLabel: "Mua ngay",
    ctaHref: "/sach?type=Ebook",
  },
];

interface HeroBannerProps {
  slides?: Slide[];
}

export default function HeroBanner({ slides = DEFAULT_SLIDES }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startAutoplay() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 4500);
  }

  useEffect(() => {
    startAutoplay();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  function goTo(idx: number) {
    setCurrent(idx);
    startAutoplay();
  }

  const slide = slides[current];

  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: 260,
        background: `linear-gradient(120deg, ${slide.bg[0]} 0%, ${slide.bg[1]} 100%)`,
        transition: "background 0.6s ease",
      }}
    >
      {/* Decorative circles */}
      <div
        className="absolute right-0 top-0 w-80 h-80 rounded-full opacity-10 -translate-y-1/3 translate-x-1/4 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)" }}
      />
      <div
        className="absolute left-1/2 bottom-0 w-64 h-64 rounded-full opacity-10 translate-y-1/2 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)" }}
      />

      <div className="max-w-7xl mx-auto px-8 w-full h-full flex items-center gap-8 relative z-10">
        {/* Text */}
        <div className="flex-1 min-w-0">
          {/* Tag + badge */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest"
              style={{ backgroundColor: MLS_RED }}
            >
              {slide.tag}
            </span>
            <span
              className="text-white/90 text-[10px] font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              {slide.badge}
            </span>
          </div>

          {/* Headline */}
          <h2
            className="text-2xl md:text-3xl font-black leading-tight mb-3 text-white whitespace-pre-line"
          >
            {slide.title}
          </h2>

          <p className="text-sm leading-relaxed mb-5 max-w-xs" style={{ color: slide.subColor }}>
            {slide.subtitle}
          </p>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <a
              href={slide.ctaHref}
              className="text-xs font-black px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg text-white"
              style={{ backgroundColor: MLS_RED }}
            >
              {slide.ctaLabel} →
            </a>
            <a
              href={slide.ctaHref}
              className="text-xs font-semibold px-4 py-2.5 rounded-xl border text-white/85 hover:bg-white/10 transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.3)" }}
            >
              Tìm hiểu thêm
            </a>
          </div>
        </div>

        {/* Book cover on right */}
        <div className="hidden sm:flex items-center justify-center shrink-0" style={{ width: 108 }}>
          <div className="w-full rounded-xl overflow-hidden shadow-2xl">
            <BookCover
              title={slide.book.title}
              author={slide.book.author}
              coverColor={slide.book.coverColor}
              coverEmoji={slide.book.coverEmoji}
              coverUrl={slide.book.coverUrl}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="transition-all rounded-full"
            style={{
              width: i === current ? 24 : 7,
              height: 7,
              backgroundColor: i === current ? "#fff" : "rgba(255,255,255,0.35)",
            }}
          />
        ))}
      </div>

      {/* Arrow buttons */}
      <button
        onClick={() => goTo((current - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors z-10"
      >
        ‹
      </button>
      <button
        onClick={() => goTo((current + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors z-10"
      >
        ›
      </button>
    </div>
  );
}


