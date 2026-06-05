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

const LS_KEY = "mls_saved_course_ids";

function SavedCourseRow({ course, onRemove }: { course: PublicCourseListItem; onRemove: () => void }) {
  const tsp = useTranslations("saved_page");
  const tll = useTranslations("level_labels");
  const lvl = tll.has(String(course.level)) ? tll(String(course.level)) : tll("fallback", { n: course.level });
  const price = course.price ?? 0;
  const { fmtCurrency } = useFormatters();
  return (
    <div style={{ display: "flex", gap: 14, padding: "14px 24px", borderBottom: "1px solid #F3F4F6", alignItems: "center" }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#F9FAFB"}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
    >
      <Link href={`/courses/${course.id}`} style={{ textDecoration: "none", display: "flex", gap: 14, flex: 1, alignItems: "center" }}>
        <div style={{ width: 88, height: 56, borderRadius: 8, overflow: "hidden", background: "linear-gradient(135deg,#1565C0,#0D47A1)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {safeImgUrl(course.thumbnailUrl)
            ? <img src={safeImgUrl(course.thumbnailUrl)!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <svg width="18" height="18" fill="white" opacity={0.6} viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 4px", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{course.title}</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, background: "#EFF6FF", color: "#1565C0", fontWeight: 600, padding: "2px 8px", borderRadius: 99 }}>{lvl}</span>
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>{tsp("chapters_lessons", { modules: course.moduleCount, sessions: course.sessionCount })}</span>
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: "right", minWidth: 80 }}>
          {price === 0 || course.isFree
            ? <span style={{ fontSize: 13, color: "#16A34A", fontWeight: 700 }}>{tsp("free")}</span>
            : course.discountPrice != null
              ? <div><span style={{ fontSize: 13, color: "#DC2626", fontWeight: 700, display: "block" }}>{fmtCurrency(course.discountPrice)}</span><span style={{ fontSize: 11, color: "#9CA3AF", textDecoration: "line-through" }}>{fmtCurrency(price)}</span></div>
              : <span style={{ fontSize: 13, color: "#DC2626", fontWeight: 700 }}>{fmtCurrency(price)}</span>
          }
        </div>
      </Link>
      <button onClick={onRemove} title={tsp("remove_title")} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, flexShrink: 0, color: "#9CA3AF" }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#DC2626"}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF"}
      >
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

export default function SavedPage() {
  const t = useTranslations("saved_page");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setSavedIds(new Set(JSON.parse(raw) as string[]));
    } catch { /* ignore */ }
    setMounted(true);
  }, []);

  const { data, isLoading } = useGetPublicCoursesQuery({ page: 1, pageSize: 100 });

  const savedCourses = (data?.items ?? []).filter(c => savedIds.has(c.id));

  const removeSaved = (id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      try { localStorage.setItem(LS_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  return (
    <AppShell activeNavId="saved">
      <main style={{ flex: 1, minWidth: 0, background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ borderBottom: "1px solid #E5E7EB", padding: "20px 28px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>{t("title")}</h1>
              <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>
                {mounted ? t("count", { count: savedCourses.length }) : t("loading")}
              </p>
            </div>
            {savedCourses.length > 0 && (
              <button onClick={() => { setSavedIds(new Set()); try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ } }} style={{ fontSize: 12, color: "#6B7280", background: "none", border: "1px solid #E5E7EB", borderRadius: 8, padding: "7px 14px", cursor: "pointer" }}>
                {t("clear_all")}
              </button>
            )}
          </div>
        </div>

        <div className="mls-shell-scroll" style={{ flex: 1, overflowY: "auto" }}>
          {!mounted || isLoading ? (
            <div style={{ padding: "0 24px" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid #F3F4F6", alignItems: "center" }}>
                  <div style={{ width: 88, height: 56, borderRadius: 8, background: "#E5E7EB", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, background: "#E5E7EB", borderRadius: 4, marginBottom: 6 }} />
                    <div style={{ height: 10, width: "50%", background: "#F3F4F6", borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : savedCourses.length === 0 ? (
            <div style={{ padding: "80px 0", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔖</div>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 8 }}>{t("empty_title")}</p>
              <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>
                {t("empty_hint")}
              </p>
              <Link href="/" style={{ background: "#1565C0", color: "#fff", padding: "10px 24px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>{t("discover_button")}</Link>
            </div>
          ) : (
            savedCourses.map(c => <SavedCourseRow key={c.id} course={c} onRemove={() => removeSaved(c.id)} />)
          )}
        </div>
      </main>
    </AppShell>
  );
}
