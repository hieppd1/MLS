"use client";

import { useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { useTranslations } from "next-intl";
import type { RootState } from "@/lib/store";
import { safeImgUrl } from "@/lib/utils";
import AppShell from "@/app/_components/AppShell";
import {
  useGetTeacherListQuery,
  useFollowTeacherMutation,
  useUnfollowTeacherMutation,
  type TeacherProfileDto,
} from "@/lib/features/teachers/teachersApi";
import { useFormatters } from "@/lib/hooks/useFormatters";

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
   TEACHER FOLLOW CARD
═══════════════════════════════════════════════════════════════ */
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#1565C0,#0D47A1)",
  "linear-gradient(135deg,#16A34A,#14532D)",
  "linear-gradient(135deg,#7C3AED,#4C1D95)",
  "linear-gradient(135deg,#DC2626,#7F1D1D)",
  "linear-gradient(135deg,#0891B2,#164E63)",
  "linear-gradient(135deg,#EA580C,#7C2D12)",
  "linear-gradient(135deg,#CA8A04,#713F12)",
  "linear-gradient(135deg,#0D9488,#134E4A)",
];

function TeacherFollowCard({ teacher, onUnfollow }: { teacher: TeacherProfileDto; onUnfollow: () => void }) {
  const gradIdx = teacher.displayName.charCodeAt(0) % AVATAR_GRADIENTS.length;
  const initials = teacher.displayName.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();
  const { fmtNumber } = useFormatters();
  const t = useTranslations("following_page");

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 3, background: "#1565C0" }} />
      <div style={{ padding: "20px 18px 18px", flex: 1 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          {/* Avatar */}
          <Link href={`/giao-vien/${teacher.slug}`} style={{ textDecoration: "none", flexShrink: 0 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", background: AVATAR_GRADIENTS[gradIdx], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "2px solid #E5E7EB" }}>
              {safeImgUrl(teacher.avatarUrl)
                ? <img src={safeImgUrl(teacher.avatarUrl)!} alt={teacher.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>{initials}</span>
              }
            </div>
          </Link>
          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <Link href={`/giao-vien/${teacher.slug}`} style={{ textDecoration: "none" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{teacher.displayName}</span>
              </Link>
              {teacher.isVerified && (
                <svg width="14" height="14" fill="#1565C0" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
            </div>
            {teacher.headline && (
              <p style={{ fontSize: 12, color: "#6B7280", margin: "3px 0 0", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{teacher.headline}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 0, marginTop: 14, borderTop: "1px solid #F3F4F6", paddingTop: 12 }}>
          {[
            { label: t("stat_courses"), value: teacher.courseCount },
            { label: t("stat_students"),  value: fmtNumber(teacher.totalStudents) },
            { label: t("stat_followers"), value: fmtNumber(teacher.followerCount) },
          ].map((stat, i) => (
            <div key={stat.label} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid #F3F4F6" : "none" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1565C0" }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: "#9CA3AF" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <Link href={`/giao-vien/${teacher.slug}`} style={{ flex: 1, background: "#EFF6FF", color: "#1565C0", border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, textDecoration: "none", textAlign: "center", cursor: "pointer" }}>
            {t("view_profile")}
          </Link>
          <button onClick={onUnfollow} style={{ flex: 1, background: "#fff", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
            {t("unfollow_btn")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FOLLOWING PAGE
═══════════════════════════════════════════════════════════════ */
export default function FollowingPage() {
  const isLoggedIn = useSelector((s: RootState) => !!s.auth?.accessToken);
  const t = useTranslations("following_page");

  const [search, setSearch] = useState("");

  const { data: teachers, isLoading } = useGetTeacherListQuery({ page: 1, pageSize: 50 });
  const [unfollowTeacher] = useUnfollowTeacherMutation();

  const followedTeachers = (teachers ?? []).filter(t => t.isFollowing);
  const filteredTeachers = followedTeachers.filter(t =>
    !search || t.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{`
        .fw-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; }
        .fw-scroll::-webkit-scrollbar { width: 4px; }
        .fw-scroll::-webkit-scrollbar-track { background: transparent; }
        .fw-scroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 99px; }
        .fw-scroll:hover::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); }
        .fw-scroll:hover { scrollbar-color: rgba(0,0,0,0.18) transparent; }
      `}</style>

      <AppShell activeNavId="following">

        {/* ═══ COL 1: LEFT NAV ════════════════════════════════════ */}


        {/* ═══ COL 2: TIN NHẮN — shared MessagesSidebar ══════════ */}


        {/* ═══ COL 3: ĐANG THEO DÕI ════════════════════════════════ */}
        <main className="fw-scroll" style={{ flex: 1, minWidth: 0, background: "#F9FAFB", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "20px 28px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>{t("title")}</h1>
                <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>
                  {isLoading ? t("loading") : t("count", { count: followedTeachers.length })}
                </p>
              </div>
              <div style={{ position: "relative" }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" /></svg>
                <input type="text" placeholder={t("search_placeholder")} value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9, border: "1px solid #E5E7EB", borderRadius: 20, fontSize: 13, outline: "none", width: 220, background: "#F9FAFB" }} />
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="fw-scroll" style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            {isLoading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: 18 }}>
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#E5E7EB" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 14, background: "#E5E7EB", borderRadius: 4, marginBottom: 8 }} />
                        <div style={{ height: 10, width: "70%", background: "#F3F4F6", borderRadius: 4 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !isLoggedIn ? (
              <div style={{ padding: "80px 0", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 8 }}>{t("not_logged_in_title")}</p>
                <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>{t("not_logged_in_hint")}</p>
                <Link href="/login" style={{ background: "#1565C0", color: "#fff", padding: "10px 24px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>{t("login_button")}</Link>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div style={{ padding: "80px 0", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍🏫</div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                  {search ? t("not_found_title") : t("empty_title")}
                </p>
                <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>
                  {search ? t("not_found_hint") : t("empty_hint")}
                </p>
                {!search && (
                  <Link href="/giao-vien" style={{ background: "#1565C0", color: "#fff", padding: "10px 24px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>{t("discover_button")}</Link>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                {filteredTeachers.map(t => (
                  <TeacherFollowCard
                    key={t.id}
                    teacher={t}
                    onUnfollow={() => unfollowTeacher(t.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </AppShell>
    </>
  );
}
