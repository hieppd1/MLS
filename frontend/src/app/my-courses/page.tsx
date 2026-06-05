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
   MOCK CHAT DATA
═══════════════════════════════════════════════════════════════ */
interface MockChat {
  id: string; name: string; init: string; color: string;
  lastMsg: string; time: string; unread: number; online: boolean;
  type: "message" | "group" | "qa" | "notify";
}
const MOCK_CHATS: MockChat[] = [
  { id: "c1", name: "Thầy Lê Văn Tuấn",       init: "LT", color: "#1565C0", lastMsg: "Bạn: Đã tạo hội thoại!",                     time: "2 ph",   unread: 0, online: true,  type: "message" },
  { id: "c2", name: "Nhóm Tiếng Anh Cấp 2",   init: "TA", color: "#16A34A", lastMsg: "Cô Trang Anh: Bài tập hôm nay về nhà là...", time: "15 ph",  unread: 3, online: false, type: "group" },
  { id: "c3", name: "Thầy Chu Đình Mong",      init: "CM", color: "#DC2626", lastMsg: "Hẹn gặp lại buổi học tới nhé",              time: "1 giờ",  unread: 0, online: true,  type: "message" },
  { id: "c4", name: "Hỏi & Đáp: Ngữ pháp",    init: "HĐ", color: "#7C3AED", lastMsg: "Bạn hỏi: Cách dùng had been?",             time: "2 giờ",  unread: 1, online: false, type: "qa" },
  { id: "c5", name: "Thầy Phan Khắc Nghệ",    init: "PN", color: "#0891B2", lastMsg: "Xem lại bài giảng số 5 nhé em",             time: "3 giờ",  unread: 0, online: false, type: "message" },
  { id: "c6", name: "Nhóm Học Cấp 3 THPT",    init: "N3", color: "#EA580C", lastMsg: "Có 2 thành viên mới tham gia",              time: "5 giờ",  unread: 2, online: false, type: "group" },
  { id: "c7", name: "Thông báo khoá học",      init: "TB", color: "#CA8A04", lastMsg: "Khoá học nâng cao khai giảng 01/06",       time: "1 ngày", unread: 1, online: false, type: "notify" },
  { id: "c8", name: "Nhóm Luyện Nói Online",   init: "LN", color: "#0D9488", lastMsg: "Buổi tới: Thứ 3, 20:00",                  time: "2 ngày", unread: 0, online: false, type: "group" },
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
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: chat.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>{chat.init}</div>
        {chat.online && <div style={{ position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: "50%", background: "#22C55E", border: "2px solid #fff" }} />}
        {CHAT_TYPE_ICON[chat.type] && <div style={{ position: "absolute", bottom: -2, right: -2, width: 17, height: 17, borderRadius: "50%", background: "#fff", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>{CHAT_TYPE_ICON[chat.type]}</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: chat.unread > 0 ? 700 : 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{chat.name}</span>
          <span style={{ fontSize: 10, color: "#9CA3AF", flexShrink: 0, marginLeft: 6 }}>{chat.time}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: chat.unread > 0 ? "#374151" : "#9CA3AF", fontWeight: chat.unread > 0 ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 172 }}>{chat.lastMsg}</span>
          {chat.unread > 0 && <div style={{ background: "#1565C0", color: "#fff", fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", paddingLeft: 4, paddingRight: 4, flexShrink: 0, marginLeft: 4 }}>{chat.unread}</div>}
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COURSE CARD
═══════════════════════════════════════════════════════════════ */
function CourseCard({ course }: { course: PublicCourseListItem }) {
  const lvl = LEVEL_LABELS[course.level] ?? `Cấp ${course.level}`;
  return (
    <Link href={`/courses/${course.id}`} style={{ textDecoration: "none" }}>
      <div style={{
        background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB",
        overflow: "hidden", cursor: "pointer",
        transition: "box-shadow 0.15s, transform 0.15s",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
      >
        {/* Thumbnail */}
        <div style={{ width: "100%", aspectRatio: "16/9", background: "linear-gradient(135deg,#1565C0,#0D47A1)", position: "relative", overflow: "hidden" }}>
          {safeImgUrl(course.thumbnailUrl)
            ? <img src={safeImgUrl(course.thumbnailUrl)!} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="28" height="28" fill="white" opacity={0.6} viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>
              </div>
          }
          <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.55)", borderRadius: 6, padding: "2px 8px" }}>
            <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{lvl}</span>
          </div>
          <div style={{ position: "absolute", top: 8, right: 8, background: "#16A34A", borderRadius: 99, padding: "2px 8px", display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>Đang học</span>
          </div>
        </div>
        {/* Body */}
        <div style={{ padding: "12px 14px 14px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.4, marginBottom: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{course.title}</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#6B7280" }}>{course.moduleCount} chương</span>
            <span style={{ fontSize: 11, color: "#D1D5DB" }}>•</span>
            <span style={{ fontSize: 11, color: "#6B7280" }}>{course.sessionCount} bài học</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ height: 6, background: "#E5E7EB", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: "35%", background: "linear-gradient(90deg,#1565C0,#42A5F5)", borderRadius: 99 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: "#9CA3AF" }}>Tiến độ</span>
              <span style={{ fontSize: 10, color: "#1565C0", fontWeight: 600 }}>35%</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MY COURSES PAGE
═══════════════════════════════════════════════════════════════ */
export default function MyCoursesPage() {
  const isLoggedIn = useSelector((s: RootState) => !!s.auth?.accessToken);

  const [chatSearch,     setChatSearch]     = useState("");
  const [chatTab,        setChatTab]        = useState<"all" | "unread">("all");
  const [showChatFilter, setShowChatFilter] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [search,         setSearch]         = useState("");

  const { data, isLoading } = useGetPublicCoursesQuery({ page: 1, pageSize: 100 });

  const enrolledCourses = (data?.items ?? []).filter(c => c.isEnrolled);
  const filteredCourses = enrolledCourses.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredChats = MOCK_CHATS.filter((c) => {
    if (chatSearch && !c.name.toLowerCase().includes(chatSearch.toLowerCase()) &&
        !c.lastMsg.toLowerCase().includes(chatSearch.toLowerCase())) return false;
    if (chatTab === "unread" && c.unread === 0) return false;
    return true;
  });

  return (
    <>
      <style>{`
        .mc-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; }
        .mc-scroll::-webkit-scrollbar { width: 4px; }
        .mc-scroll::-webkit-scrollbar-track { background: transparent; }
        .mc-scroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 99px; }
        .mc-scroll:hover::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); }
        .mc-scroll:hover { scrollbar-color: rgba(0,0,0,0.18) transparent; }
      `}</style>

      <div style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden", background: "#F3F4F6" }}>

        {/* ═══ COL 1: LEFT NAV ════════════════════════════════════ */}
        <aside className="mc-scroll" style={{ width: 72, flexShrink: 0, background: "white", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8, overflowY: "auto", zIndex: 10 }}>
          {LEFT_NAV.map((item) => {
            const locked = item.requireAuth && !isLoggedIn;
            const active = item.id === "enrolled";
            return (
              <Link key={item.id} href={locked ? "/login" : item.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 4px", width: "100%", textAlign: "center", textDecoration: "none", color: active ? "#1565C0" : locked ? "#D1D5DB" : "#6B7280", background: active ? "#EFF6FF" : "transparent", borderTop: "none", borderRight: "none", borderBottom: "none", borderLeft: active ? "3px solid #1565C0" : "3px solid transparent" }} title={item.label}>
                {item.icon}
                <span style={{ fontSize: 9, fontWeight: 500, lineHeight: 1.2 }}>{item.label}</span>
              </Link>
            );
          })}
        </aside>

        {/* ═══ COL 2: TIN NHẮN — shared MessagesSidebar ══════════ */}
        <MessagesSidebar />

        {/* ═══ COL 3: KHOÁ ĐÃ KÍCH HOẠT ══════════════════════════ */}
        <main className="mc-scroll" style={{ flex: 1, minWidth: 0, background: "#F9FAFB", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "20px 28px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>Khoá đã kích hoạt</h1>
                <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>
                  {isLoading ? "Đang tải..." : `${enrolledCourses.length} khoá học đang theo học`}
                </p>
              </div>
              <div style={{ position: "relative" }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" /></svg>
                <input type="text" placeholder="Tìm khoá học..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9, border: "1px solid #E5E7EB", borderRadius: 20, fontSize: 13, outline: "none", width: 220, background: "#F9FAFB" }} />
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="mc-scroll" style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            {isLoading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
                    <div style={{ width: "100%", aspectRatio: "16/9", background: "#E5E7EB" }} />
                    <div style={{ padding: "12px 14px 14px" }}>
                      <div style={{ height: 13, background: "#E5E7EB", borderRadius: 4, marginBottom: 6 }} />
                      <div style={{ height: 11, width: "60%", background: "#F3F4F6", borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : !isLoggedIn ? (
              <div style={{ padding: "80px 0", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Vui lòng đăng nhập</p>
                <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>Đăng nhập để xem khoá học đã kích hoạt</p>
                <Link href="/login" style={{ background: "#1565C0", color: "#fff", padding: "10px 24px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Đăng nhập</Link>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div style={{ padding: "80px 0", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                  {search ? "Không tìm thấy khoá học" : "Chưa có khoá học nào"}
                </p>
                <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>
                  {search ? "Thử tìm với từ khoá khác" : "Hãy khám phá và kích hoạt khoá học đầu tiên của bạn"}
                </p>
                {!search && (
                  <Link href="/" style={{ background: "#1565C0", color: "#fff", padding: "10px 24px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Khám phá khoá học</Link>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                {filteredCourses.map(c => <CourseCard key={c.id} course={c} />)}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
