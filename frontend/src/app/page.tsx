"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { safeImgUrl } from "@/lib/utils";
import {
  useGetPublicCoursesQuery,
  useGetPublicCourseQuery,
  useGetSessionQuery,
  type PublicCourseListItem,
} from "@/lib/features/courses/coursesApi";
import { useGetTeacherListQuery } from "@/lib/features/teachers/teachersApi";
import AppShell from "./_components/AppShell";
import { useFormatters } from "@/lib/hooks/useFormatters";
import { useTranslations } from "next-intl";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
function hashNum(id: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffff;
  return min + (h % (max - min));
}
function fmtTime(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
function useLevelLabel() {
  const tll = useTranslations("level_labels");
  return (n: number) =>
    tll.has(String(n)) ? tll(String(n)) : tll("fallback", { n });
}
const AVATAR_COLORS = ["#1565C0", "#7B1FA2", "#C62828", "#2E7D32", "#E65100", "#00695C"];

/* ═══════════════════════════════════════════════════════════════
   SHORT VIDEO ITEM (Col 3 — TikTok/Shorts style)
═══════════════════════════════════════════════════════════════ */
function ShortVideoItem({ course, isActive, onVisible, containerRef }: {
  course: PublicCourseListItem; isActive: boolean; onVisible: (id: string) => void;
  containerRef?: React.RefObject<HTMLElement | null>;
}) {
  const rootRef   = useRef<HTMLDivElement>(null);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const hlsRef    = useRef<{ destroy: () => void } | null>(null);
  const iconTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { fmtNumber } = useFormatters();
  const t = useTranslations("home_feed");
  const levelLabel = useLevelLabel();

  const [liked,        setLiked]       = useState(false);
  const [saved,        setSaved]       = useState(false);
  const [muted,        setMuted]       = useState(true);
  const [playing,      setPlaying]     = useState(false);
  const [progress,     setProgress]    = useState(0);
  const [currentTime,  setCurrentTime] = useState(0);
  const [duration,     setDuration]    = useState(0);
  const [showIcon,     setShowIcon]    = useState(false);
  const [iconPause,    setIconPause]   = useState(false);

  const likes    = hashNum(course.id, 12, 220);
  const comments = hashNum(course.id + "c", 0, 30);
  const views    = hashNum(course.id + "v", 100, 9999);

  /* ── fetch course detail (only when active) ── */
  const { data: courseDetail } = useGetPublicCourseQuery(course.id, { skip: !isActive });

  const firstSessionId = useMemo(() => {
    if (!courseDetail) return null;
    // Prefer free-trial sessions first
    for (const mod of courseDetail.modules) {
      const s = mod.sessions.find((x) => x.isFreeTrial);
      if (s) return s.id;
    }
    return courseDetail.modules[0]?.sessions[0]?.id ?? null;
  }, [courseDetail]);

  /* ── fetch session view (only when we have a session id) ── */
  const { data: sessionView } = useGetSessionQuery(firstSessionId ?? "", { skip: !firstSessionId });

  const videoSrc = useMemo(() => {
    const p = sessionView?.videoAsset?.hlsPath;
    if (!p) return null;
    if (p.startsWith("http")) return p;
    // Backend stores paths relative to media root; served at /media/<path>
    return `${API_BASE}/media/${p}`;
  }, [sessionView]);

  /* ── IntersectionObserver: fire onVisible ── */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.intersectionRatio >= 0.5) onVisible(course.id); },
      { threshold: 0.5, root: containerRef?.current ?? null }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [course.id, onVisible, containerRef]);

  /* ── HLS init ── */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoSrc) return;

    let destroyed = false;
    hlsRef.current?.destroy();
    hlsRef.current = null;

    const init = async () => {
      if (destroyed) return;
      const isHls = videoSrc.includes(".m3u8");
      if (!isHls) {
        // MP4 or other direct video — play natively
        v.src = videoSrc;
        v.muted = true;
        v.load();
        v.play().catch(() => {});
        return;
      }
      const { default: Hls } = await import("hls.js");
      if (destroyed) return;
      if (Hls.isSupported()) {
        const hls = new Hls({ autoStartLoad: true, startLevel: -1 });
        hlsRef.current = hls;
        hls.loadSource(videoSrc);
        hls.attachMedia(v);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          v.muted = true;
          v.play().catch(() => {});
        });
      } else if (v.canPlayType("application/vnd.apple.mpegurl")) {
        v.src = videoSrc;
        v.muted = true;
        v.load();
        v.play().catch(() => {});
      }
    };

    init();
    return () => {
      destroyed = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [videoSrc]);

  /* ── Play / pause based on isActive ── */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) { v.play().catch(() => {}); }
    else          { v.pause(); v.currentTime = 0; setProgress(0); }
  }, [isActive]);

  /* ── Video event listeners ── */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime  = () => { setCurrentTime(v.currentTime); if (v.duration) setProgress(v.currentTime / v.duration); };
    const onMeta  = () => setDuration(v.duration);
    const onPlay  = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener("timeupdate",   onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("play",  onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("timeupdate",   onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("play",  onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, []);

  /* ── Controls ── */
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const willPause = !v.paused;
    willPause ? v.pause() : v.play().catch(() => {});
    setIconPause(willPause);
    setShowIcon(true);
    if (iconTimer.current) clearTimeout(iconTimer.current);
    iconTimer.current = setTimeout(() => setShowIcon(false), 700);
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
  }, []);

  return (
    <div ref={rootRef} style={{ position: "relative", width: "100%", height: "100%", background: "#000", overflow: "hidden" }}>

      {/* ── video ── */}
      <video
        ref={videoRef}
        muted
        playsInline
        loop
        poster={course.thumbnailUrl ?? undefined}
        onClick={togglePlay}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
      />

      {/* ── dark overlay ── */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 45%, rgba(0,0,0,0.35) 100%)",
      }} />

      {/* ── tap icon (play/pause flash) ── */}
      {showIcon && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(0,0,0,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
          animation: "fadeOut 0.7s ease forwards",
        }}>
          {iconPause
            ? <svg width="30" height="30" fill="white" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
            : <svg width="30" height="30" fill="white" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>
          }
        </div>
      )}

      {/* ── top badges ── */}
      <div style={{ position: "absolute", top: 14, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-start", pointerEvents: "none" }}>
        <span style={{ background: "rgba(0,0,0,0.5)", color: "white", fontSize: 11, padding: "3px 8px", borderRadius: 99, backdropFilter: "blur(4px)" }}>
          ▶ {t("views_count", { count: views })}
        </span>
        <span style={{ background: "rgba(21,101,192,0.85)", color: "white", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, backdropFilter: "blur(4px)" }}>
          L{course.level} — {levelLabel(course.level)}
        </span>
      </div>

      {/* ── bottom left: teacher + title + desc + CTA + progress ── */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 76, padding: "0 14px 14px" }}>
        {/* teacher row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: "#1565C0",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 700, fontSize: 13, flexShrink: 0,
            border: "2px solid rgba(255,255,255,0.6)",
          }}>T</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "white", fontWeight: 600, fontSize: 12, lineHeight: 1.2 }}>{t("teacher_name")}</p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>{t("teacher_org")}</p>
          </div>
          <button style={{
            padding: "3px 12px", borderRadius: 99,
            borderTop: "1.5px solid rgba(255,255,255,0.7)",
            borderRight: "1.5px solid rgba(255,255,255,0.7)",
            borderBottom: "1.5px solid rgba(255,255,255,0.7)",
            borderLeft: "1.5px solid rgba(255,255,255,0.7)",
            background: "transparent", color: "white", fontSize: 11, fontWeight: 600, cursor: "pointer",
          }}>{t("follow_btn")}</button>
        </div>
        {/* title */}
        <p style={{
          color: "white", fontWeight: 700, fontSize: 14, lineHeight: 1.4, marginBottom: 4,
          overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>{course.title}</p>
        {/* description */}
        {course.description && (
          <p style={{
            color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.5, marginBottom: 8,
            overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical",
          }}>{course.description}</p>
        )}
        {/* CTA */}
        <Link href={`/courses/${course.id}`} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#FF6B35", color: "white", padding: "7px 18px", borderRadius: 8,
          fontSize: 12, fontWeight: 700, textDecoration: "none",
          boxShadow: "0 4px 12px rgba(255,107,53,0.4)",
        }}>
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>
          {course.isEnrolled ? t("continue_btn") : t("view_course_btn")}
        </Link>

        {/* ── progress bar + time ── */}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>{fmtTime(currentTime)}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>{fmtTime(duration)}</span>
          </div>
          {/* clickable seek bar */}
          <div
            onClick={seek}
            style={{ height: 3, background: "rgba(255,255,255,0.25)", borderRadius: 2, cursor: "pointer", position: "relative" }}
          >
            <div style={{
              position: "absolute", left: 0, top: 0, height: "100%",
              background: "#1565C0", borderRadius: 2,
              width: `${progress * 100}%`, transition: "width 0.25s linear",
            }} />
            {/* scrubber dot */}
            <div style={{
              position: "absolute", top: "50%", transform: "translateY(-50%)",
              left: `calc(${progress * 100}% - 5px)`,
              width: 10, height: 10, borderRadius: "50%", background: "white",
              boxShadow: "0 0 4px rgba(0,0,0,0.5)",
            }} />
          </div>
        </div>

        {/* no video notice */}
        {!videoSrc && isActive && (
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>
            {firstSessionId ? t("loading_video") : t("no_preview")}
          </p>
        )}
      </div>

      {/* ── right side: social + mute + fullscreen ── */}
      <div style={{
        position: "absolute", right: 10, bottom: 60,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
      }}>
        {/* Mute / Unmute */}
        <button onClick={toggleMute} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          background: "none", borderTop: "none", borderRight: "none", borderBottom: "none", borderLeft: "none",
          cursor: "pointer",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: muted ? "rgba(255,255,255,0.15)" : "rgba(21,101,192,0.8)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {muted
              ? <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
              : <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-5.586-9H4a1 1 0 00-1 1v4a1 1 0 001 1h1.586l4.707 4.707C10.923 20.337 12 19.891 12 19V5c0-.891-1.077-1.337-1.707-.707L5.586 9z" /></svg>
            }
          </div>
          <span style={{ fontSize: 10, color: "white" }}>{muted ? t("mute_on") : t("mute_off")}</span>
        </button>

        {/* Like */}
        <button onClick={() => setLiked(!liked)} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          background: "none", borderTop: "none", borderRight: "none", borderBottom: "none", borderLeft: "none", cursor: "pointer",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: liked ? "#FF6B6B" : "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="22" height="22" fill={liked ? "white" : "none"} viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span style={{ fontSize: 10, color: "white" }}>{likes + (liked ? 1 : 0)}</span>
        </button>

        {/* Comment */}
        <button style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          background: "none", borderTop: "none", borderRight: "none", borderBottom: "none", borderLeft: "none", cursor: "pointer",
        }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span style={{ fontSize: 10, color: "white" }}>{comments}</span>
        </button>

        {/* Bookmark */}
        <button onClick={() => setSaved(!saved)} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          background: "none", borderTop: "none", borderRight: "none", borderBottom: "none", borderLeft: "none", cursor: "pointer",
        }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: saved ? "rgba(251,191,36,0.8)" : "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" fill={saved ? "white" : "none"} viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <span style={{ fontSize: 10, color: "white" }}>{saved ? 6 : 5}</span>
        </button>

        {/* Share */}
        <button style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          background: "none", borderTop: "none", borderRight: "none", borderBottom: "none", borderLeft: "none", cursor: "pointer",
        }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <span style={{ fontSize: 10, color: "white" }}>{t("share")}</span>
        </button>

        {/* Playing indicator */}
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: playing ? "rgba(21,101,192,0.7)" : "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }} onClick={togglePlay}>
          {playing
            ? <svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
            : <svg width="18" height="18" fill="white" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>
          }
        </div>
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LESSON ROW (Col 3 table)
═══════════════════════════════════════════════════════════════ */
function LessonRow({ course, index, saved, onSave }: {
  course: PublicCourseListItem; index: number; saved: boolean; onSave: () => void;
}) {
  const price = course.price ?? 0;
  const hasDiscount = course.discountPrice != null && course.discountPrice < price;
  const { fmtCurrency } = useFormatters();
  const t = useTranslations("home_feed");
  const levelLabel = useLevelLabel();
  return (
    <Link href={`/courses/${course.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{ display: "grid", gridTemplateColumns: "48px 1fr 130px 52px", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F3F4F6", background: "transparent", cursor: "pointer" }}
        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#F9FAFB"}
        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
      >
        <span style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center" }}>{index + 1}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingRight: 12 }}>
          <div style={{ width: 80, height: 50, flexShrink: 0, borderRadius: 6, overflow: "hidden", background: "linear-gradient(135deg,#1565C0,#0D47A1)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {safeImgUrl(course.thumbnailUrl)
              ? <img src={safeImgUrl(course.thumbnailUrl)!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <svg width="16" height="16" fill="white" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.4, marginBottom: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{course.title}</p>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 10, background: "#EFF6FF", color: "#1565C0", fontWeight: 700, padding: "1px 8px", borderRadius: 99 }}>{levelLabel(course.level)}</span>
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>{t("chapters_lessons", { modules: course.moduleCount, sessions: course.sessionCount })}</span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          {course.isEnrolled
            ? <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>{t("studying")}</span>
            : price === 0
              ? <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>{t("free")}</span>
              : hasDiscount
                ? <div><span style={{ fontSize: 12, color: "#DC2626", fontWeight: 700, display: "block" }}>{fmtCurrency(course.discountPrice!)}</span><span style={{ fontSize: 10, color: "#9CA3AF", textDecoration: "line-through" }}>{fmtCurrency(price)}</span></div>
                : <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 700 }}>{fmtCurrency(price)}</span>
          }
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button onClick={(e) => { e.preventDefault(); onSave(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <svg width="18" height="18" fill={saved ? "#1565C0" : "none"} viewBox="0 0 24 24" stroke={saved ? "#1565C0" : "#9CA3AF"} strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR COURSE CARD (Col 4)
═══════════════════════════════════════════════════════════════ */
function SidebarCourseCard({ course }: { course: PublicCourseListItem }) {
  const levelLabel = useLevelLabel();
  return (
    <Link href={`/courses/${course.id}`} style={{ display: "block", textDecoration: "none" }}>
      <div style={{ borderRadius: 8, overflow: "hidden", background: "#f9fafb" }}>
        <div style={{ aspectRatio: "16/9", background: "#1565C0", overflow: "hidden", position: "relative" }}>
          {safeImgUrl(course.thumbnailUrl)
            ? <img src={safeImgUrl(course.thumbnailUrl)!} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" fill="white" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>
              </div>
          }
        </div>
        <div style={{ padding: "6px 6px 8px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#111827", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{course.title}</p>
          <p style={{ fontSize: 10, color: "#1565C0", marginTop: 3, fontWeight: 500 }}>{levelLabel(course.level)}</p>
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [activeVideoId,  setActiveVideoId]  = useState<string | null>(null);
  const [sidebarLevel,   setSidebarLevel]   = useState<number | undefined>(undefined);
  const feedScrollRef  = useRef<HTMLDivElement>(null);
  const videoScrollRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("home_feed");

  const { data: feedCourses, isLoading: feedLoading } = useGetPublicCoursesQuery({ page: 1, pageSize: 30 });
  const { data: sidebarCourses } = useGetPublicCoursesQuery({ page: 1, pageSize: 6, level: sidebarLevel });
  const { data: teacherList } = useGetTeacherListQuery({ pageSize: 8 });

  useEffect(() => {
    if (feedCourses?.items.length && !activeVideoId)
      setActiveVideoId(feedCourses.items[0].id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedCourses]);

  const handleVideoVisible = useCallback((id: string) => {
    setActiveVideoId(id);
    // sync feed list scroll
    const feedEl = feedScrollRef.current?.querySelector(`[data-id="${id}"]`) as HTMLElement | null;
    feedEl?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  const scrollToVideo = useCallback((id: string) => {
    setActiveVideoId(id);
    const vidEl = videoScrollRef.current?.querySelector(`[data-vid="${id}"]`) as HTMLElement | null;
    vidEl?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const filteredFeed = feedCourses?.items ?? [];

  return (
    <>
      <style>{`
        @keyframes fadeOut { 0%{opacity:1} 60%{opacity:1} 100%{opacity:0} }
        @keyframes spin { to { transform: rotate(360deg) } }
        .mls-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; }
        .mls-scroll::-webkit-scrollbar { width: 4px; }
        .mls-scroll::-webkit-scrollbar-track { background: transparent; }
        .mls-scroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 99px; }
        .mls-scroll:hover::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); }
        .mls-scroll:hover { scrollbar-color: rgba(0,0,0,0.18) transparent; }
        .mls-scroll-dark { scrollbar-width: thin; scrollbar-color: transparent transparent; }
        .mls-scroll-dark::-webkit-scrollbar { width: 3px; }
        .mls-scroll-dark::-webkit-scrollbar-track { background: transparent; }
        .mls-scroll-dark::-webkit-scrollbar-thumb { background: transparent; border-radius: 99px; }
        .mls-scroll-dark:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.22); }
        .mls-scroll-dark:hover { scrollbar-color: rgba(255,255,255,0.22) transparent; }
        @media (max-width: 767px) {
          .mls-right-sidebar { display: none !important; }
        }
      `}</style>

      <AppShell activeNavId="new">

        {/* ═══ COL 1: LEFT NAV (72px) ════════════════════════════ */}
        {/* ═══ COL 3: SHORT VIDEO FEED (flex-1, snap-scroll) ═════ */}
        <main ref={videoScrollRef} className="mls-scroll-dark" style={{
          flex: 1, minWidth: 0,
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          background: "#000",
        }}>
          {feedLoading ? (
            <div style={{ height: "calc(100vh - 56px)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                border: "3px solid rgba(255,255,255,0.15)",
                borderTop: "3px solid #1565C0",
                animation: "spin 0.8s linear infinite",
              }} />
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{t("loading")}</p>
            </div>
          ) : filteredFeed.map((c) => (
            <div key={c.id} data-vid={c.id} style={{
              width: "100%", height: "calc(100vh - 56px)",
              flexShrink: 0, scrollSnapAlign: "start", position: "relative",
            }}>
              <ShortVideoItem course={c} isActive={activeVideoId === c.id} onVisible={handleVideoVisible} containerRef={videoScrollRef} />
            </div>
          ))}
        </main>

        {/* ═══ COL 4: RIGHT SIDEBAR (270px) ══════════════════════════════════════ */}
        <aside className="mls-scroll mls-right-sidebar" style={{
          width: 270, flexShrink: 0,
          background: "white", borderLeft: "1px solid #e5e7eb",
          display: "flex", flexDirection: "column", overflowY: "auto", zIndex: 10,
        }}>
          {/* Teachers */}
          <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>{t("sidebar_teachers")}</h3>
              <Link href="/giao-vien" style={{ fontSize: 12, fontWeight: 500, color: "#1565C0", textDecoration: "none" }}>{t("sidebar_view_all")}</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              {teacherList && teacherList.length > 0
                ? teacherList.slice(0, 4).map((t, i) => {
                    const initials = t.displayName.split(" ").map((w: string) => w[0]).slice(-2).join("").toUpperCase();
                    const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                    const shortName = t.displayName.split(" ").slice(-2).join(" ");
                    return (
                      <Link key={t.id} href={`/giao-vien/${t.slug}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textDecoration: "none", padding: "4px 2px" }}>
                        {safeImgUrl(t.avatarUrl)
                          ? <img src={safeImgUrl(t.avatarUrl)!} alt={t.displayName} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }} />
                          : <div style={{ width: 48, height: 48, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 14, boxShadow: `0 2px 8px ${color}55` }}>{initials}</div>
                        }
                        <p style={{ fontSize: 10, color: "#374151", lineHeight: 1.2, textAlign: "center", maxWidth: 56, margin: 0 }}>{shortName}</p>
                      </Link>
                    );
                  })
                : Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 2px" }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#e5e7eb" }} />
                      <div style={{ width: 36, height: 8, borderRadius: 4, background: "#e5e7eb", marginTop: 2 }} />
                    </div>
                  ))
              }
            </div>
          </div>
          {/* Promo */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ borderRadius: 10, padding: 14, background: "linear-gradient(135deg,#1565C0 0%,#0D47A1 100%)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -10, top: -10, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
              <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{t("promo_label")}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "white", lineHeight: 1.4, marginBottom: 2 }}>{t("promo_title_l1")}<br/>{t("promo_title_l2")}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 10 }}>{t("promo_subtitle")}</p>
              <Link href="/courses" style={{ display: "inline-block", background: "#FF6B35", color: "white", padding: "5px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600, textDecoration: "none" }}>{t("promo_cta")}</Link>
            </div>
          </div>
          {/* Courses */}
          <div style={{ flex: 1, padding: "12px 16px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>{t("sidebar_courses")}</h3>
              <Link href="/courses" style={{ fontSize: 11, fontWeight: 500, color: "#1565C0", textDecoration: "none" }}>{t("sidebar_view_all")}</Link>
            </div>
            <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 8, marginBottom: 8 }}>
              {([undefined, 1, 2, 3, 4, 5, 6] as (number|undefined)[]).map((l) => (
                <button key={l ?? "all"} onClick={() => setSidebarLevel(l)} style={{
                  flexShrink: 0, padding: "4px 10px", borderRadius: 99,
                  fontSize: 11, fontWeight: 500,
                  borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "none",
                  cursor: "pointer",
                  background: sidebarLevel === l ? "#1565C0" : "#F3F4F6",
                  color: sidebarLevel === l ? "white" : "#6B7280",
                }}>
                  {l === undefined ? t("level_all") : `L${l}`}
                </button>
              ))}
            </div>
            {sidebarCourses?.items.length
              ? <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {sidebarCourses.items.slice(0, 6).map((c) => <SidebarCourseCard key={c.id} course={c} />)}
                </div>
              : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ borderRadius: 8, overflow: "hidden" }}>
                      <div style={{ aspectRatio: "16/9", background: "#E5E7EB" }} />
                      <div style={{ padding: "6px 6px 8px" }}>
                        <div style={{ height: 8, background: "#E5E7EB", borderRadius: 4, marginBottom: 4 }} />
                        <div style={{ height: 8, width: "60%", background: "#F3F4F6", borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </aside>

      </AppShell>
    </>
  );
}