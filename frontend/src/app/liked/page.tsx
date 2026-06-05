"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { safeImgUrl } from "@/lib/utils";
import {
  useGetPublicCoursesQuery,
  type PublicCourseListItem,
} from "@/lib/features/courses/coursesApi";
import AppShell from "../_components/AppShell";
import { useFormatters } from "@/lib/hooks/useFormatters";

const LS_KEY = "mls_liked_course_ids";

function LikedCourseCard({ course, onUnlike }: { course: PublicCourseListItem; onUnlike: () => void }) {
  const tlp = useTranslations("liked_page");
  const tll = useTranslations("level_labels");
  const lvl = tll.has(String(course.level)) ? tll(String(course.level)) : tll("fallback", { n: course.level });
  const price = course.price ?? 0;
  const { fmtCurrency } = useFormatters();
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden", position: "relative" }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "none"}
    >
      <button onClick={onUnlike} title={tlp("unlike_title")} style={{ position: "absolute", top: 8, right: 8, zIndex: 2, background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
        <svg width="16" height="16" fill="#DC2626" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
      </button>
      <Link href={`/courses/${course.id}`} style={{ textDecoration: "none", display: "block" }}>
        <div style={{ width: "100%", aspectRatio: "16/9", background: "linear-gradient(135deg,#1565C0,#0D47A1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {safeImgUrl(course.thumbnailUrl)
            ? <img src={safeImgUrl(course.thumbnailUrl)!} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <svg width="28" height="28" fill="white" opacity={0.6} viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>
          }
        </div>
        <div style={{ padding: "12px 14px 14px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 6px", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{course.title}</p>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 10, background: "#EFF6FF", color: "#1565C0", fontWeight: 600, padding: "2px 8px", borderRadius: 99 }}>{lvl}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>
            {price === 0 || course.isFree
              ? <span style={{ color: "#16A34A" }}>{tlp("free")}</span>
              : course.discountPrice != null
                ? <span style={{ color: "#DC2626" }}>{fmtCurrency(course.discountPrice)}</span>
                : <span style={{ color: "#DC2626" }}>{fmtCurrency(price)}</span>
            }
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function LikedPage() {
  const t = useTranslations("liked_page");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setLikedIds(new Set(JSON.parse(raw) as string[]));
    } catch { /* ignore */ }
    setMounted(true);
  }, []);

  const { data, isLoading } = useGetPublicCoursesQuery({ page: 1, pageSize: 100 });

  const likedCourses = (data?.items ?? []).filter(c => likedIds.has(c.id));

  const unlike = (id: string) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      try { localStorage.setItem(LS_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  return (
    <AppShell activeNavId="liked">
      <main style={{ flex: 1, minWidth: 0, background: "#F9FAFB", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "20px 28px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>{t("title")}</h1>
              <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>
                {mounted ? t("count", { count: likedCourses.length }) : t("loading")}
              </p>
            </div>
            {likedCourses.length > 0 && (
              <button onClick={() => { setLikedIds(new Set()); try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ } }} style={{ fontSize: 12, color: "#6B7280", background: "none", border: "1px solid #E5E7EB", borderRadius: 8, padding: "7px 14px", cursor: "pointer" }}>
                {t("clear_all")}
              </button>
            )}
          </div>
        </div>

        <div className="mls-shell-scroll" style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {!mounted || isLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
                  <div style={{ width: "100%", aspectRatio: "16/9", background: "#E5E7EB" }} />
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ height: 13, background: "#E5E7EB", borderRadius: 4, marginBottom: 6 }} />
                    <div style={{ height: 10, width: "50%", background: "#F3F4F6", borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : likedCourses.length === 0 ? (
            <div style={{ padding: "80px 0", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>❤️</div>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 8 }}>{t("empty_title")}</p>
              <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>{t("empty_hint")}</p>
              <Link href="/" style={{ background: "#1565C0", color: "#fff", padding: "10px 24px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>{t("discover_button")}</Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {likedCourses.map(c => <LikedCourseCard key={c.id} course={c} onUnlike={() => unlike(c.id)} />)}
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
