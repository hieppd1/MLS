"use client";

import { useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import MessagesSidebar from "@/app/_components/MessagesSidebar";

/* ═══════════════════════════════════════════════════════════════
   LEFT NAV
═══════════════════════════════════════════════════════════════ */
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
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", width: "100%", textAlign: "left", background: selected ? "#EFF6FF" : "transparent", borderTop: "none", borderRight: "none", borderBottom: "1px solid #f3f4f6", borderLeft: selected ? "3px solid #1565C0" : "3px solid transparent", cursor: "pointer" }}>
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
   GROUPS PAGE
═══════════════════════════════════════════════════════════════ */
export default function GroupsPage() {
  const isLoggedIn = useSelector((s: RootState) => !!s.auth?.accessToken);

  const [chatSearch,     setChatSearch]     = useState("");
  const [chatTab,        setChatTab]        = useState<"all" | "unread">("all");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const filteredChats = MOCK_CHATS.filter((c) => {
    if (chatSearch && !c.name.toLowerCase().includes(chatSearch.toLowerCase()) &&
        !c.lastMsg.toLowerCase().includes(chatSearch.toLowerCase())) return false;
    if (chatTab === "unread" && c.unread === 0) return false;
    return true;
  });

  return (
    <>
      <style>{`
        .gr-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; }
        .gr-scroll::-webkit-scrollbar { width: 4px; }
        .gr-scroll::-webkit-scrollbar-track { background: transparent; }
        .gr-scroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 99px; }
        .gr-scroll:hover::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); }
        .gr-scroll:hover { scrollbar-color: rgba(0,0,0,0.18) transparent; }
      `}</style>

      <div style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden", background: "#F3F4F6" }}>

        {/* ═══ COL 1: LEFT NAV ════════════════════════════════════ */}
        <aside className="gr-scroll" style={{ width: 72, flexShrink: 0, background: "white", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8, overflowY: "auto", zIndex: 10 }}>
          {LEFT_NAV.map((item) => {
            const locked = item.requireAuth && !isLoggedIn;
            const active = item.id === "group";
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

        {/* ═══ COL 3: NHÓM CỦA TÔI ════════════════════════════════ */}
        <main className="gr-scroll" style={{ flex: 1, minWidth: 0, background: "#F9FAFB", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "20px 28px", flexShrink: 0 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>Nhóm của tôi</h1>
            <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>Tham gia nhóm học tập cùng giảng viên và bạn học</p>
          </div>

          <div className="gr-scroll" style={{ flex: 1, overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", padding: "0 24px", maxWidth: 440 }}>
              {/* Coming soon illustration */}
              <div style={{ width: 120, height: 120, borderRadius: "50%", background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                <svg width="52" height="52" fill="none" viewBox="0 0 24 24" stroke="#1565C0" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div style={{ display: "inline-block", background: "#EFF6FF", color: "#1565C0", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 99, marginBottom: 14, letterSpacing: "0.05em", textTransform: "uppercase" }}>Sắp ra mắt</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: "0 0 10px" }}>Tính năng nhóm học tập</h2>
              <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, margin: "0 0 28px" }}>
                Tính năng nhóm học đang được phát triển. Sắp tới bạn có thể tạo hoặc tham gia nhóm học tập, thảo luận bài học và tương tác trực tiếp với giảng viên cùng bạn học.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                {["Nhóm học tập", "Thảo luận nhóm", "Lịch học chung", "Chia sẻ tài liệu"].map((feat) => (
                  <div key={feat} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "7px 14px" }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#1565C0" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
