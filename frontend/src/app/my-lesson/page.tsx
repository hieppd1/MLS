"use client";

import { useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { safeImgUrl } from "@/lib/utils";
import {
  useGetPublicCoursesQuery,
  type PublicCourseListItem,
} from "@/lib/features/courses/coursesApi";
import StreakWidget from "@/components/StreakWidget";
import { useGetMyPlacementResultQuery } from "@/lib/features/quiz/quizApi";
import MessagesSidebar from "@/app/_components/MessagesSidebar";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const LEVEL_LABELS: Record<number, string> = {
  1: "Nhập môn", 2: "Cơ bản", 3: "Sơ trung",
  4: "Trung cấp", 5: "Trung cao", 6: "Nâng cao",
};

const LEFT_NAV = [
  { id: "new",       label: "Bài học mới",       href: "/my-lesson",  requireAuth: false,
    icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
  { id: "enrolled",  label: "Khoá đã kích hoạt", href: "/my-courses", requireAuth: true,
    icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
  { id: "group",     label: "Nhóm của tôi",       href: "/groups",     requireAuth: true,
    icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { id: "following", label: "Đang theo dõi",      href: "/following",  requireAuth: true,
    icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> },
  { id: "saved",     label: "Đã lưu",             href: "/saved",      requireAuth: true,
    icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg> },
  { id: "liked",     label: "Đã thích",           href: "/liked",      requireAuth: true,
    icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
  { id: "friends",   label: "Bạn bè",             href: "/friends",    requireAuth: true,
    icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
];

/* ═══════════════════════════════════════════════════════════════
   MOCK CHAT DATA + ChatItem (Col 2)
═══════════════════════════════════════════════════════════════ */
interface MockChat {
  id: string; name: string; init: string; color: string;
  lastMsg: string; time: string; unread: number; online: boolean;
  type: "message" | "group" | "qa" | "notify";
}

const MOCK_CHATS: MockChat[] = [
  { id: "c1", name: "Thầy Lê Văn Tuấn",       init: "LT", color: "#1565C0",
    lastMsg: "Bạn: Đã tạo hội thoại!",         time: "2 ph",   unread: 0, online: true,  type: "message" },
  { id: "c2", name: "Nhóm Tiếng Anh Cấp 2",   init: "TA", color: "#16A34A",
    lastMsg: "Cô Trang Anh: Bài tập hôm nay về nhà là...", time: "15 ph",  unread: 3, online: false, type: "group" },
  { id: "c3", name: "Thầy Chu Đình Mong",      init: "CM", color: "#DC2626",
    lastMsg: "Hẹn gặp lại buổi học tới nhé",   time: "1 giờ",  unread: 0, online: true,  type: "message" },
  { id: "c4", name: "Hỏi & Đáp: Ngữ pháp",    init: "HĐ", color: "#7C3AED",
    lastMsg: "Bạn hỏi: Cách dùng had been?",   time: "2 giờ",  unread: 1, online: false, type: "qa" },
  { id: "c5", name: "Thầy Phan Khắc Nghệ",    init: "PN", color: "#0891B2",
    lastMsg: "Xem lại bài giảng số 5 nhé em",  time: "3 giờ",  unread: 0, online: false, type: "message" },
  { id: "c6", name: "Nhóm Học Cấp 3 THPT",    init: "N3", color: "#EA580C",
    lastMsg: "Có 2 thành viên mới tham gia",   time: "5 giờ",  unread: 2, online: false, type: "group" },
  { id: "c7", name: "Thông báo khoá học",      init: "TB", color: "#CA8A04",
    lastMsg: "Khoá học nâng cao khai giảng 01/06", time: "1 ngày", unread: 1, online: false, type: "notify" },
  { id: "c8", name: "Nhóm Luyện Nói Online",   init: "LN", color: "#0D9488",
    lastMsg: "Buổi tới: Thứ 3, 20:00",         time: "2 ngày", unread: 0, online: false, type: "group" },
  { id: "c9", name: "Cô Trang Anh",            init: "TA", color: "#DB2777",
    lastMsg: "Cô đã gửi tài liệu mới",         time: "3 ngày", unread: 0, online: false, type: "message" },
];

const CHAT_TYPE_ICON: Record<string, string> = { group: "👥", qa: "❓", notify: "🔔", message: "" };

function ChatItem({ chat, selected, onClick }: { chat: MockChat; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "11px 14px", width: "100%", textAlign: "left",
      background: selected ? "#EFF6FF" : "transparent",
      borderTop: "none", borderRight: "none",
      borderBottom: "1px solid #f3f4f6",
      borderLeft: selected ? "3px solid #1565C0" : "3px solid transparent",
      cursor: "pointer",
    }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%", background: chat.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontSize: 13,
        }}>
          {chat.init}
        </div>
        {chat.online && (
          <div style={{
            position: "absolute", bottom: 1, right: 1,
            width: 11, height: 11, borderRadius: "50%",
            background: "#22C55E", border: "2px solid #fff",
          }} />
        )}
        {CHAT_TYPE_ICON[chat.type] && (
          <div style={{
            position: "absolute", bottom: -2, right: -2, width: 17, height: 17,
            borderRadius: "50%", background: "#fff", border: "1px solid #E5E7EB",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9,
          }}>{CHAT_TYPE_ICON[chat.type]}</div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
          <span style={{
            fontSize: 13, fontWeight: chat.unread > 0 ? 700 : 600, color: "#111827",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140,
          }}>{chat.name}</span>
          <span style={{ fontSize: 10, color: "#9CA3AF", flexShrink: 0, marginLeft: 6 }}>{chat.time}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{
            fontSize: 12, color: chat.unread > 0 ? "#374151" : "#9CA3AF",
            fontWeight: chat.unread > 0 ? 500 : 400,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 172,
          }}>{chat.lastMsg}</span>
          {chat.unread > 0 && (
            <div style={{
              background: "#1565C0", color: "#fff", fontSize: 10, fontWeight: 700,
              minWidth: 18, height: 18, borderRadius: 99,
              display: "flex", alignItems: "center", justifyContent: "center",
              paddingLeft: 4, paddingRight: 4, flexShrink: 0, marginLeft: 4,
            }}>{chat.unread}</div>
          )}
        </div>
      </div>
    </button>
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
  return (
    <Link href={`/courses/${course.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{ display: "grid", gridTemplateColumns: "48px 1fr 130px 52px", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F3F4F6", background: "transparent", cursor: "pointer" }}
        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#F9FAFB"}
        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
      >
        <span style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center" }}>{index + 1}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingRight: 12 }}>
          <div style={{ width: 80, height: 50, flexShrink: 0, borderRadius: 6, overflow: "hidden", background: "linear-gradient(135deg,#1565C0,#0D47A1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {safeImgUrl(course.thumbnailUrl)
              ? <img src={safeImgUrl(course.thumbnailUrl)!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <svg width="16" height="16" fill="white" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.4, marginBottom: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{course.title}</p>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 10, background: "#EFF6FF", color: "#1565C0", fontWeight: 700, padding: "1px 8px", borderRadius: 99 }}>{LEVEL_LABELS[course.level] ?? `Cấp ${course.level}`}</span>
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>{course.moduleCount} chương • {course.sessionCount} bài</span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          {course.isEnrolled
            ? <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>✓ Đang học</span>
            : price === 0
              ? <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>Miễn phí</span>
              : hasDiscount
                ? <div>
                    <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 700, display: "block" }}>{(course.discountPrice!).toLocaleString("vi-VN")}đ</span>
                    <span style={{ fontSize: 10, color: "#9CA3AF", textDecoration: "line-through" }}>{price.toLocaleString("vi-VN")}đ</span>
                  </div>
                : <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 700 }}>{price.toLocaleString("vi-VN")}đ</span>
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
   MY LESSON PAGE
═══════════════════════════════════════════════════════════════ */
export default function MyLessonPage() {
  const isLoggedIn = useSelector((s: RootState) => !!s.auth?.accessToken);
  const isHydrated = useSelector((s: RootState) => s.auth?.isHydrated ?? false);
  const { data: placementResult } = useGetMyPlacementResultQuery(undefined, { skip: !isHydrated || !isLoggedIn });

  // Lesson table state
  const [lessonTab,   setLessonTab]   = useState<"new" | "unread" | "done" | "schedule">("new");
  const [lessonLevel, setLessonLevel] = useState<number | undefined>(undefined);
  const [savedIds,    setSavedIds]    = useState<Set<string>>(new Set());

  const { data: courses, isLoading } = useGetPublicCoursesQuery({ page: 1, pageSize: 50 });

  const filteredLessons = (courses?.items ?? []).filter((c) => {
    if (lessonLevel !== undefined && c.level !== lessonLevel) return false;
    if (lessonTab === "done" && !c.isEnrolled) return false;
    if (lessonTab === "unread" && c.isEnrolled) return false;
    return true;
  });

  const savedCourses = (courses?.items ?? []).filter(c => savedIds.has(c.id));

  return (
    <>
      <style>{`
        .ml-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; }
        .ml-scroll::-webkit-scrollbar { width: 4px; }
        .ml-scroll::-webkit-scrollbar-track { background: transparent; }
        .ml-scroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 99px; }
        .ml-scroll:hover::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); }
        .ml-scroll:hover { scrollbar-color: rgba(0,0,0,0.18) transparent; }
      `}</style>

      <div style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden", background: "#F3F4F6" }}>

        {/* ═══ COL 1: LEFT NAV (72px) ════════════════════════════ */}
        <aside className="ml-scroll" style={{
          width: 72, flexShrink: 0,
          background: "white", borderRight: "1px solid #e5e7eb",
          display: "flex", flexDirection: "column", alignItems: "center",
          paddingTop: 8, overflowY: "auto", zIndex: 10,
        }}>
          {LEFT_NAV.map((item) => {
            const locked  = item.requireAuth && !isLoggedIn;
            const active  = item.id === "new";
            return (
              <Link key={item.id} href={locked ? "/login" : item.href}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 4, padding: "10px 4px", width: "100%", textAlign: "center",
                  textDecoration: "none",
                  color: active ? "#1565C0" : locked ? "#D1D5DB" : "#6B7280",
                  background: active ? "#EFF6FF" : "transparent",
                  borderTop: "none", borderRight: "none", borderBottom: "none",
                  borderLeft: active ? "3px solid #1565C0" : "3px solid transparent",
                }}
                title={item.label}
              >
                {item.icon}
                <span style={{ fontSize: 9, fontWeight: 500, lineHeight: 1.2 }}>{item.label}</span>
              </Link>
            );
          })}
        </aside>

        {/* ═══ COL 2: TIN NHẮN — shared MessagesSidebar ══════════ */}
        <MessagesSidebar />

        {/* ═══ COL 3: BÀI HỌC MỚI — table (flex-1) ══════════════ */}
        <main className="ml-scroll" style={{ flex: 1, minWidth: 0, background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Top tabs */}
          <div style={{ borderBottom: "1px solid #E5E7EB", padding: "0 24px", flexShrink: 0 }}>
            <div style={{ display: "flex" }}>
              {(["new", "unread", "done", "schedule"] as const).map((tab) => {
                const labels = { new: "Bài mới", unread: "Bài chưa học", done: "Bài đã học", schedule: "Lịch phát hành" };
                return (
                  <button key={tab} onClick={() => setLessonTab(tab)} style={{
                    padding: "14px 20px", fontSize: 13,
                    fontWeight: lessonTab === tab ? 700 : 400,
                    color: lessonTab === tab ? "#1565C0" : "#374151",
                    borderTop: "none", borderLeft: "none", borderRight: "none",
                    borderBottom: lessonTab === tab ? "2px solid #1565C0" : "2px solid transparent",
                    background: "transparent", cursor: "pointer", whiteSpace: "nowrap",
                  }}>{labels[tab]}</button>
                );
              })}
            </div>
          </div>

          {/* Level filter chips */}
          <div style={{ padding: "10px 24px", display: "flex", gap: 8, overflowX: "auto", flexShrink: 0, borderBottom: "1px solid #F3F4F6", scrollbarWidth: "none" }}>
            {[
              { label: "All",       value: undefined as number | undefined },
              ...[1,2,3,4,5,6].map(n => ({ label: LEVEL_LABELS[n] ?? `Cấp ${n}`, value: n as number | undefined })),
            ].map((item) => (
              <button key={item.label} onClick={() => setLessonLevel(item.value)} style={{
                flexShrink: 0, padding: "5px 18px", borderRadius: 99, fontSize: 12, fontWeight: 500,
                border: lessonLevel === item.value ? "2px solid #1565C0" : "1px solid #E5E7EB",
                background: lessonLevel === item.value ? "#1565C0" : "#fff",
                color: lessonLevel === item.value ? "#fff" : "#374151",
                cursor: "pointer",
              }}>{item.label}</button>
            ))}
          </div>

          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 130px 52px", padding: "9px 24px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", textAlign: "center" }}>Stt</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>Bài học</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", textAlign: "center" }}>Kết quả</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", textAlign: "center" }}>Lưu</span>
          </div>

          {/* Table body */}
          <div className="ml-scroll" style={{ flex: 1, overflowY: "auto", padding: "0 24px" }}>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "48px 1fr 130px 52px", padding: "12px 0", borderBottom: "1px solid #F3F4F6", alignItems: "center" }}>
                  <div style={{ width: 24, height: 12, background: "#E5E7EB", borderRadius: 4, margin: "0 auto" }} />
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ width: 80, height: 50, background: "#E5E7EB", borderRadius: 6, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 12, background: "#E5E7EB", borderRadius: 4, marginBottom: 6 }} />
                      <div style={{ height: 10, width: "50%", background: "#F3F4F6", borderRadius: 4 }} />
                    </div>
                  </div>
                  <div style={{ height: 12, background: "#F3F4F6", borderRadius: 4, margin: "0 auto", width: 60 }} />
                  <div style={{ width: 18, height: 18, background: "#F3F4F6", borderRadius: 4, margin: "0 auto" }} />
                </div>
              ))
            ) : filteredLessons.length === 0 ? (
              <div style={{ padding: "80px 0", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                <p style={{ color: "#9CA3AF", fontSize: 14 }}>Không có dữ liệu</p>
              </div>
            ) : filteredLessons.map((course, i) => (
              <LessonRow
                key={course.id} course={course} index={i}
                saved={savedIds.has(course.id)}
                onSave={() => setSavedIds(prev => {
                  const next = new Set(prev);
                  next.has(course.id) ? next.delete(course.id) : next.add(course.id);
                  return next;
                })}
              />
            ))}
          </div>
        </main>

        {/* ═══ COL 4: STREAK + BÀI ĐÃ LƯU (270px) ═══════════════ */}
        <aside className="ml-scroll" style={{
          width: 270, flexShrink: 0,
          background: "white", borderLeft: "1px solid #e5e7eb",
          display: "flex", flexDirection: "column", overflowY: "auto", zIndex: 10,
        }}>
          {/* Streak widget */}
          <div style={{ padding: "12px 12px 0" }}>
            <StreakWidget compact />
          </div>

          {/* Placement widget */}
          {isLoggedIn && (
            <div style={{ margin: "12px 12px 0", borderRadius: 12, overflow: "hidden", border: "1px solid #DBEAFE" }}>
              {placementResult ? (
                <div style={{ background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, color: "#1D4ED8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Trình độ của bạn</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#1565C0", marginBottom: 2 }}>
                    Cấp {placementResult.assignedLevel} — {["","Nhập môn","Cơ bản","Sơ trung","Trung cấp","Trung cao","Nâng cao"][placementResult.assignedLevel] ?? ""}
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 10 }}>
                    {new Date(placementResult.testedAt).toLocaleDateString("vi-VN")}
                  </div>
                  {Object.entries(placementResult.skillBreakdown).slice(0, 3).map(([k, v]) => (
                    <div key={k} style={{ marginBottom: 5 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2, fontSize: 11, color: "#374151" }}>
                        <span>{k}</span><span style={{ fontWeight: 600 }}>{(v as number).toFixed(0)}%</span>
                      </div>
                      <div style={{ background: "#BFDBFE", borderRadius: 3, height: 5, overflow: "hidden" }}>
                        <div style={{ width: `${v}%`, height: "100%", background: "#1565C0", borderRadius: 3 }} />
                      </div>
                    </div>
                  ))}
                  <Link href="/placement-test" style={{ display: "block", textAlign: "center", marginTop: 10, fontSize: 12, color: "#1565C0", fontWeight: 600, textDecoration: "none" }}>Làm lại bài kiểm tra →</Link>
                </div>
              ) : (
                <div style={{ background: "#F8FAFC", padding: "14px 16px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 6 }}>🎯 Chưa xếp lớp</div>
                  <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 10, lineHeight: 1.5 }}>Làm bài kiểm tra để nhận lộ trình học phù hợp với trình độ của bạn.</p>
                  <Link href="/placement-test" style={{
                    display: "block", textAlign: "center", padding: "8px 0",
                    borderRadius: 8, background: "#1565C0", color: "#fff",
                    textDecoration: "none", fontSize: 13, fontWeight: 700,
                  }}>Kiểm tra ngay</Link>
                </div>
              )}
            </div>
          )}

          <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>Bài đã lưu</h3>
              <button style={{ fontSize: 12, color: "#1565C0", fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}>Xem tất cả</button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {savedCourses.length === 0 ? (
              <div style={{ padding: "64px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔖</div>
                <p style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6 }}>
                  Không có dữ liệu<br/>
                  <span style={{ fontSize: 12 }}>Bấm icon lưu để thêm bài học</span>
                </p>
              </div>
            ) : savedCourses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`} style={{ display: "block", textDecoration: "none" }}>
                <div
                  style={{ display: "flex", gap: 10, padding: "10px 14px", borderBottom: "1px solid #F3F4F6" }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#F9FAFB"}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                >
                  <div style={{ width: 60, height: 40, borderRadius: 6, overflow: "hidden", background: "linear-gradient(135deg,#1565C0,#0D47A1)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {safeImgUrl(course.thumbnailUrl)
                      ? <img src={safeImgUrl(course.thumbnailUrl)!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <svg width="12" height="12" fill="white" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#111827", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{course.title}</p>
                    <p style={{ fontSize: 11, color: "#1565C0", marginTop: 3, fontWeight: 500 }}>{LEVEL_LABELS[course.level] ?? ""}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </aside>

      </div>
    </>
  );
}
