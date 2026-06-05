"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface Bookmark { id: string; time: number }
interface Note { id: string; time: number; text: string }

export interface HlsPlayerControls {
  pause: () => void;
  play: () => void;
}

interface HlsPlayerProps {
  src: string;
  lessonId?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
  startTime?: number;
  seekRef?: React.MutableRefObject<((t: number) => void) | null>;
  controlRef?: React.MutableRefObject<HlsPlayerControls | null>;
  maxHeight?: string;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

interface QualityLevel { height: number; index: number }

function fmt(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function HlsPlayer({ src, lessonId, onTimeUpdate, onEnded, startTime, seekRef, controlRef, maxHeight }: HlsPlayerProps) {
  const t = useTranslations("video_player");
  const tc = useTranslations("common");
  const speedLabel = (s: number): string => (s === 1 ? t("speed_normal") : `${s}×`);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef  = useRef<HTMLDivElement>(null);
  const hideTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimer    = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragging     = useRef(false);

  const [playing,       setPlaying]       = useState(false);
  const [current,       setCurrent]       = useState(0);
  const [duration,      setDuration]      = useState(0);
  const [vol,           setVol]           = useState(1);
  const [muted,         setMuted]         = useState(false);
  const [speed,         setSpeed]         = useState(1);
  const [fullscreen,    setFullscreen]    = useState(false);
  const [ctrlVisible,   setCtrlVisible]   = useState(true);
  const [hovering,      setHovering]      = useState(false);
  const [speedOpen,     setSpeedOpen]     = useState(false);
  const [buffPct,       setBuffPct]       = useState(0);

  const [bookmarks,     setBookmarks]     = useState<Bookmark[]>([]);
  const [notes,         setNotes]         = useState<Note[]>([]);
  const [noteOpen,      setNoteOpen]      = useState(false);
  const [noteText,      setNoteText]      = useState("");
  const [noteTs,        setNoteTs]        = useState(0);
  const [notePanelOpen, setNotePanelOpen] = useState(false);
  const [resumeTime,    setResumeTime]    = useState<number | null>(null);

  /* Quality selector state */
  const hlsRef        = useRef<import("hls.js").default | null>(null);
  const [qualityLevels,  setQualityLevels]  = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = auto
  const [qualityOpen,    setQualityOpen]    = useState(false);

  /* PiP state */
  const [pip, setPip] = useState(false);

  const pKey = lessonId ? `vp-p-${lessonId}` : null;
  const bKey = lessonId ? `vp-b-${lessonId}` : null;
  const nKey = lessonId ? `vp-n-${lessonId}` : null;

  /* ── HLS / native init ─────────────────────────────────────────── */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;
    let hls: import("hls.js").default | null = null;
    async function init() {
      const isHls = src.includes(".m3u8") || src.includes("/hls/");
      if (!isHls) { v!.src = src; return; }
      const Hls = (await import("hls.js")).default;
      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: true, maxBufferLength: 30, maxMaxBufferLength: 60 });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(v!);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const levels: QualityLevel[] = hls!.levels.map((l, i) => ({ height: l.height, index: i }));
          setQualityLevels(levels);
          setCurrentQuality(-1);
        });
        hls.on(Hls.Events.LEVEL_SWITCHED, (_e: unknown, data: { level: number }) => {
          if (hls!.autoLevelEnabled) setCurrentQuality(-1);
          else setCurrentQuality(data.level);
        });
      } else {
        v!.src = src;
      }
    }
    init();
    return () => { hls?.destroy(); hlsRef.current = null; };
  }, [src]);

  /* ── PiP change listener ────────────────────────────────────────── */
  useEffect(() => {
    const h = () => setPip(!!document.pictureInPictureElement);
    document.addEventListener("enterpictureinpicture", h);
    document.addEventListener("leavepictureinpicture", h);
    return () => {
      document.removeEventListener("enterpictureinpicture", h);
      document.removeEventListener("leavepictureinpicture", h);
    };
  }, []);

  /* ── Load bookmarks / notes ────────────────────────────────────── */
  useEffect(() => {
    try { if (bKey) setBookmarks(JSON.parse(localStorage.getItem(bKey) ?? "[]")); } catch {}
    try { if (nKey) setNotes(JSON.parse(localStorage.getItem(nKey) ?? "[]")); } catch {}
  }, [bKey, nKey]);

  /* ── Expose seekTo via seekRef ─────────────────────────────────── */
  useEffect(() => {
    if (seekRef) {
      seekRef.current = (t: number) => {
        if (videoRef.current) videoRef.current.currentTime = t;
      };
    }
  }, [seekRef]);

  /* ── Expose pause/play via controlRef ──────────────────────────── */
  useEffect(() => {
    if (controlRef) {
      controlRef.current = {
        pause: () => videoRef.current?.pause(),
        play:  () => videoRef.current?.play(),
      };
    }
    return () => { if (controlRef) controlRef.current = null; };
  }, [controlRef]);

  /* ── Resume position ───────────────────────────────────────────── */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => {
      // External startTime overrides localStorage resume
      if (startTime && startTime > 5) {
        v!.currentTime = startTime;
        return;
      }
      if (!pKey) return;
      const t = parseFloat(localStorage.getItem(pKey!) ?? "0");
      if (t > 5 && t < v!.duration - 5) setResumeTime(t);
    };
    v.addEventListener("loadedmetadata", onMeta);
    return () => v.removeEventListener("loadedmetadata", onMeta);
  }, [pKey, startTime]);

  /* ── Auto-save every 10s ───────────────────────────────────────── */
  useEffect(() => {
    if (!pKey) return;
    saveTimer.current = setInterval(() => {
      const t = videoRef.current?.currentTime ?? 0;
      if (t > 0) localStorage.setItem(pKey, String(t));
    }, 10000);
    return () => { if (saveTimer.current) clearInterval(saveTimer.current); };
  }, [pKey]);

  /* ── Video events ──────────────────────────────────────────────── */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay  = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTU    = () => {
      setCurrent(v.currentTime);
      if (v.buffered.length) setBuffPct((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
      onTimeUpdate?.(v.currentTime);
    };
    const onDC  = () => setDuration(v.duration);
    const onVC  = () => { setVol(v.volume); setMuted(v.muted); };
    const onEnd = () => onEnded?.();
    v.addEventListener("play",           onPlay);
    v.addEventListener("pause",          onPause);
    v.addEventListener("timeupdate",     onTU);
    v.addEventListener("durationchange", onDC);
    v.addEventListener("volumechange",   onVC);
    v.addEventListener("ended",          onEnd);
    return () => {
      v.removeEventListener("play",           onPlay);
      v.removeEventListener("pause",          onPause);
      v.removeEventListener("timeupdate",     onTU);
      v.removeEventListener("durationchange", onDC);
      v.removeEventListener("volumechange",   onVC);
      v.removeEventListener("ended",          onEnd);
    };
  }, [onTimeUpdate, onEnded]);

  /* ── Fullscreen change ─────────────────────────────────────────── */
  useEffect(() => {
    const h = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  /* ── Keyboard shortcuts ────────────────────────────────────────── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const v = videoRef.current;
      if (!v) return;
      if (e.code === "Space")      { e.preventDefault(); v.paused ? v.play() : v.pause(); }
      if (e.code === "ArrowLeft")  { e.preventDefault(); v.currentTime = Math.max(0, v.currentTime - 5); }
      if (e.code === "ArrowRight") { e.preventDefault(); v.currentTime = Math.min(v.duration, v.currentTime + 5); }
      if (e.code === "KeyF")       { e.preventDefault(); toggleFS(); }
      if (e.code === "KeyM")       { e.preventDefault(); v.muted = !v.muted; }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Controls auto-hide ────────────────────────────────────────── */
  function showCtrl() {
    setCtrlVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) setCtrlVisible(false);
    }, 3000);
  }

  /* ── Actions ───────────────────────────────────────────────────── */
  function toggleFS() {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }

  function togglePip() {
    const v = videoRef.current;
    if (!v) return;
    if (document.pictureInPictureElement) document.exitPictureInPicture();
    else if (document.pictureInPictureEnabled) v.requestPictureInPicture();
  }

  function setQuality(levelIndex: number) {
    const hls = hlsRef.current;
    if (!hls) return;
    if (levelIndex === -1) {
      hls.currentLevel = -1; // auto
    } else {
      hls.currentLevel = levelIndex;
    }
    setCurrentQuality(levelIndex);
    setQualityOpen(false);
  }

  function qualityLabel(idx: number): string {
    if (idx === -1) return t("auto");
    const level = qualityLevels.find((l) => l.index === idx);
    if (!level) return "Auto";
    if (level.height >= 1080) return "1080p HD";
    if (level.height >= 720)  return "720p HD";
    return `${level.height}p`;
  }

  const displayQualityBtn = qualityLevels.length > 0
    ? (currentQuality === -1 ? "Auto" : qualityLabel(currentQuality))
    : null;

  function seekByPct(pct: number) {
    const v = videoRef.current;
    if (!v || !duration) return;
    v.currentTime = Math.max(0, Math.min(duration, pct * duration));
  }

  function pctFromEvent(e: React.PointerEvent): number {
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  }

  function onProgressDown(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    seekByPct(pctFromEvent(e));
  }
  function onProgressMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    seekByPct(pctFromEvent(e));
  }
  function onProgressUp(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }

  function addBookmark() {
    const v = videoRef.current;
    if (!v || !bKey) return;
    const bk: Bookmark = { id: Date.now().toString(), time: v.currentTime };
    const updated = [...bookmarks, bk].sort((a, b) => a.time - b.time);
    setBookmarks(updated);
    localStorage.setItem(bKey, JSON.stringify(updated));
  }
  function removeBookmark(id: string) {
    if (!bKey) return;
    const updated = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updated);
    localStorage.setItem(bKey, JSON.stringify(updated));
  }

  function openNote() {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setNoteTs(v.currentTime);
    setNoteText("");
    setNoteOpen(true);
  }
  function saveNote() {
    if (!nKey || !noteText.trim()) { setNoteOpen(false); return; }
    const n: Note = { id: Date.now().toString(), time: noteTs, text: noteText.trim() };
    const updated = [...notes, n].sort((a, b) => a.time - b.time);
    setNotes(updated);
    localStorage.setItem(nKey, JSON.stringify(updated));
    setNoteOpen(false);
    setNotePanelOpen(true);
  }
  function removeNote(id: string) {
    if (!nKey) return;
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    localStorage.setItem(nKey, JSON.stringify(updated));
  }

  const progPct  = duration > 0 ? (current / duration) * 100 : 0;
  const ctrlShow = ctrlVisible || !playing;

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="relative w-full bg-black focus:outline-none"
      style={{ aspectRatio: "16/9", ...(maxHeight ? { maxHeight } : {}) }}
      onMouseMove={showCtrl}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); if (playing) setCtrlVisible(false); }}
    >
      {/* Video element — no native controls, right-click disabled */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full"
        onClick={() => { const v = videoRef.current; if (v) v.paused ? v.play() : v.pause(); }}
        onContextMenu={(e) => e.preventDefault()}
        playsInline
      />

      {/* ── Resume banner ──────────────────────────────────────────── */}
      {resumeTime !== null && (
        <div className="absolute top-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-gray-900/90 px-4 py-2.5 text-sm text-white shadow-xl backdrop-blur-sm">
          <span>{t("resume_prefix")}<strong>{fmt(resumeTime)}</strong>{t("resume_suffix")}</span>
          <button
            onClick={() => {
              const v = videoRef.current;
              if (v) { v.currentTime = resumeTime!; v.play(); }
              setResumeTime(null);
            }}
            className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold hover:bg-indigo-700 transition"
          >
            {t("resume")}
          </button>
          <button onClick={() => setResumeTime(null)} className="text-xs text-gray-400 hover:text-white transition">
            {t("skip")}
          </button>
        </div>
      )}

      {/* ── Center play button (paused) ────────────────────────────── */}
      {!playing && (
        <button
          onClick={() => videoRef.current?.play()}
          className="absolute inset-0 z-10 flex items-center justify-center focus:outline-none"
          tabIndex={-1}
          aria-label={t("play")}
        >
          <div className="rounded-full bg-black/50 p-5 backdrop-blur-sm transition hover:bg-black/70">
            <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}

      {/* ── Note input modal ────────────────────────────────────────── */}
      {noteOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="w-80 rounded-2xl bg-gray-800 p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">{t("note_at", { time: fmt(noteTs) })}</span>
              <button onClick={() => setNoteOpen(false)} className="rounded p-0.5 text-gray-400 hover:text-white transition">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <textarea
              autoFocus
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveNote(); } }}
              placeholder={t("note_placeholder")}
              rows={3}
              className="w-full resize-none rounded-xl bg-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setNoteOpen(false)} className="rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:text-white transition">{tc("cancel")}</button>
              <button onClick={saveNote} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition">{t("save_note")}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notes panel (above controls) ────────────────────────────── */}
      {notePanelOpen && notes.length > 0 && (
        <div className="absolute bottom-14 left-0 right-0 z-20 max-h-52 overflow-y-auto bg-gray-900/95 backdrop-blur-sm">
          <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-gray-900 px-4 py-2">
            <span className="text-xs font-semibold text-white">{t("notes_count", { count: notes.length })}</span>
            <button onClick={() => setNotePanelOpen(false)} className="text-gray-400 hover:text-white transition">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {notes.map((n) => (
            <NoteRow
              key={n.id}
              note={n}
              onSeek={(t) => { const v = videoRef.current; if (v) { v.currentTime = t; v.play(); } setNotePanelOpen(false); }}
              onRemove={removeNote}
            />
          ))}
        </div>
      )}

      {/* ── Controls overlay ────────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 transition-opacity duration-200"
        style={{
          opacity: ctrlShow ? 1 : 0,
          pointerEvents: ctrlShow ? "auto" : "none",
          background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.25) 65%, transparent 100%)",
        }}
        onMouseEnter={() => { if (hideTimer.current) clearTimeout(hideTimer.current); setCtrlVisible(true); }}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="relative mx-3 mb-2 mt-8 cursor-pointer"
          style={{ height: hovering ? "6px" : "4px", transition: "height 0.12s ease" }}
          onPointerDown={onProgressDown}
          onPointerMove={onProgressMove}
          onPointerUp={onProgressUp}
        >
          <div className="absolute inset-0 rounded-full bg-white/20" />
          <div className="absolute inset-y-0 left-0 rounded-full bg-white/35" style={{ width: `${buffPct}%` }} />
          <div className="absolute inset-y-0 left-0 rounded-full bg-indigo-500" style={{ width: `${progPct}%` }} />
          {/* Seek thumb */}
          <div
            className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow-md transition-opacity duration-150"
            style={{ left: `calc(${progPct}% - 7px)`, opacity: hovering ? 1 : 0 }}
          />
          {/* Bookmark markers */}
          {duration > 0 && bookmarks.map((bk) => (
            <button
              key={bk.id}
              title={t("bookmark_hint", { time: fmt(bk.time) })}
              onClick={(e) => { e.stopPropagation(); const v = videoRef.current; if (v) v.currentTime = bk.time; }}
              onDoubleClick={(e) => { e.stopPropagation(); removeBookmark(bk.id); }}
              className="absolute top-1/2 h-3.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-yellow-400 hover:scale-150 transition-transform"
              style={{ left: `${(bk.time / duration) * 100}%` }}
            />
          ))}
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-0.5 px-2 pb-2.5 text-white">
          {/* Play/Pause */}
          <IconBtn label={playing ? t("pause") : t("play")} onClick={() => { const v = videoRef.current; if (v) v.paused ? v.play() : v.pause(); }}>
            {playing
              ? <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              : <path d="M8 5v14l11-7z" />}
          </IconBtn>

          {/* Volume */}
          <IconBtn label={muted ? t("unmute") : t("mute")} onClick={() => { const v = videoRef.current; if (v) v.muted = !v.muted; }}>
            {muted || vol === 0
              ? <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              : vol < 0.5
                ? <path d="M18.5 12A4.5 4.5 0 0016 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                : <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />}
          </IconBtn>
          <input
            type="range" min="0" max="1" step="0.05"
            value={muted ? 0 : vol}
            onChange={(e) => {
              const v = videoRef.current; if (!v) return;
              const val = parseFloat(e.target.value);
              v.volume = val; v.muted = val === 0;
            }}
            className="w-16 accent-indigo-500 cursor-pointer"
          />

          {/* Time display */}
          <span className="ml-2 text-xs tabular-nums text-gray-300 select-none whitespace-nowrap">
            {fmt(current)} / {fmt(duration)}
          </span>

          <div className="flex-1" />

          {/* -10s */}
          <IconBtn label={t("back_10s")} onClick={() => { const v = videoRef.current; if (v) v.currentTime = Math.max(0, v.currentTime - 10); }}>
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
          </IconBtn>

          {/* +10s */}
          <IconBtn label={t("forward_10s")} onClick={() => { const v = videoRef.current; if (v) v.currentTime = Math.min(v.duration, v.currentTime + 10); }}>
            <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
          </IconBtn>

          {/* Speed selector */}
          <div className="relative">
            <button
              onClick={() => { setSpeedOpen((o) => !o); setQualityOpen(false); }}
              className="rounded bg-white/10 px-2 py-0.5 text-xs font-semibold tabular-nums hover:bg-white/20 transition"
            >
              {speed === 1 ? "1×" : `${speed}×`}
            </button>
            {speedOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-36 overflow-hidden rounded-xl bg-gray-800 shadow-2xl ring-1 ring-white/10">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      const v = videoRef.current; if (v) v.playbackRate = s;
                      setSpeed(s); setSpeedOpen(false); setQualityOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2 text-xs transition hover:bg-gray-700 ${speed === s ? "text-blue-400 font-bold" : "text-white"}`}
                  >
                    <span>{speedLabel(s)}</span>
                    {speed === s && (
                      <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bookmark */}
          {lessonId && (
            <IconBtn label={t("bookmark")} onClick={addBookmark}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" stroke="currentColor" fill="none" />
            </IconBtn>
          )}

          {/* Note */}
          {lessonId && (
            <IconBtn label={t("note")} onClick={openNote}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke="currentColor" fill="none" />
            </IconBtn>
          )}

          {/* Notes panel toggle */}
          {notes.length > 0 && (
            <button
              onClick={() => setNotePanelOpen((o) => !o)}
              className="flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-xs hover:bg-white/20 transition"
              title={t("view_notes")}
            >
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              {notes.length}
            </button>
          )}

          {/* Quality selector */}
          {displayQualityBtn && (
            <div className="relative">
              <button
                onClick={() => { setQualityOpen((o) => !o); setSpeedOpen(false); }}
                className="rounded bg-white/10 px-2 py-0.5 text-xs font-semibold hover:bg-white/20 transition"
                title={t("video_quality")}
              >
                {displayQualityBtn}
              </button>
              {qualityOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-40 overflow-hidden rounded-xl bg-gray-800 shadow-2xl ring-1 ring-white/10">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-white/10">{t("video_quality")}</div>
                  {/* Auto */}
                  <button
                    onClick={() => setQuality(-1)}
                    className={`flex w-full items-center justify-between px-4 py-2 text-xs transition hover:bg-gray-700 ${currentQuality === -1 ? "text-blue-400 font-bold" : "text-white"}`}
                  >
                    <span>{t("auto")}</span>
                    {currentQuality === -1 && (
                      <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  {/* Quality levels (highest first) */}
                  {[...qualityLevels].sort((a, b) => b.height - a.height).map((ql) => (
                    <button
                      key={ql.index}
                      onClick={() => setQuality(ql.index)}
                      className={`flex w-full items-center justify-between px-4 py-2 text-xs transition hover:bg-gray-700 ${currentQuality === ql.index ? "text-blue-400 font-bold" : "text-white"}`}
                    >
                      <span>{ql.height >= 1080 ? "1080p HD" : ql.height >= 720 ? "720p HD" : `${ql.height}p`}</span>
                      {currentQuality === ql.index && (
                        <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Picture-in-Picture */}
          {typeof document !== "undefined" && (document as Document & { pictureInPictureEnabled?: boolean }).pictureInPictureEnabled && (
            <IconBtn label={pip ? t("exit_pip") : t("pip")} onClick={togglePip}>
              {pip
                ? <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-10-7h9v6h-9z" />
                : <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" />}
            </IconBtn>
          )}

          {/* Fullscreen */}
          <IconBtn label={fullscreen ? t("exit_fullscreen") : t("fullscreen")} onClick={toggleFS}>
            {fullscreen
              ? <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              : <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />}
          </IconBtn>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────────────── */
function IconBtn({ children, onClick, label }: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded p-1.5 text-white transition-colors hover:text-indigo-300"
    >
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        {children}
      </svg>
    </button>
  );
}

function NoteRow({ note, onSeek, onRemove }: {
  note: Note;
  onSeek: (t: number) => void;
  onRemove: (id: string) => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="flex items-start gap-3 border-b border-white/5 px-4 py-2.5 transition hover:bg-white/5"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <button
        onClick={() => onSeek(note.time)}
        className="mt-0.5 shrink-0 rounded-md bg-indigo-600/30 px-1.5 py-0.5 font-mono text-xs text-indigo-300 hover:bg-indigo-600/50 transition"
      >
        {fmt(note.time)}
      </button>
      <p className="flex-1 text-xs leading-relaxed text-gray-200">{note.text}</p>
      <button
        onClick={() => onRemove(note.id)}
        style={{ opacity: hov ? 1 : 0 }}
        className="shrink-0 text-gray-500 transition hover:text-red-400"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
