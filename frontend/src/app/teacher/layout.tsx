"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/lib/hooks";

/* ── SVG Icons ────────────────────────────────────────────────────────────── */
const IcoQuiz    = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const IcoBank    = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
const IcoTarget  = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="9" strokeWidth={1.5} /><circle cx="12" cy="12" r="5" strokeWidth={1.5} /><circle cx="12" cy="12" r="1" strokeWidth={1.5} /></svg>;
const IcoZap     = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const IcoCourse  = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const IcoChart   = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const IcoUsers   = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const IcoScript  = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const IcoMedal   = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>;
const IcoClip    = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const IcoBook    = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>;
const IcoGear    = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IcoChevron = ({ down }: { down: boolean }) => (
  <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${down ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

/* ── Nav structure ────────────────────────────────────────────────────────── */
type NavItem  = { label: string; href: string; icon: React.ReactNode };
type NavEntry =
  | { type: "link";  label: string; href: string; icon: React.ReactNode }
  | { type: "group"; label: string; key: string; icon: React.ReactNode; items: NavItem[] };

const NAV_ENTRIES: NavEntry[] = [
  { type: "group", label: "Quiz & Câu hỏi", key: "quiz", icon: <IcoQuiz />, items: [
    { label: "Quản lý Quiz",       href: "/teacher/quizzes",      icon: <IcoQuiz /> },
    { label: "Ngân hàng câu hỏi",  href: "/teacher/questions",    icon: <IcoBank /> },
    { label: "Kiểm tra xếp lớp",   href: "/teacher/placement",    icon: <IcoTarget /> },
    { label: "Realtime Quiz",       href: "/teacher/realtime/new", icon: <IcoZap /> },
  ]},
  { type: "link", label: "Khóa học của tôi", href: "/teacher/courses", icon: <IcoCourse /> },
  { type: "link", label: "Quản lý nhóm chat", href: "/teacher/chat/groups", icon: <IcoUsers /> },
  { type: "group", label: "OPIC", key: "opic", icon: <IcoChart />, items: [
    { label: "Phân tích",   href: "/teacher/opic",          icon: <IcoChart /> },
    { label: "Học viên",    href: "/teacher/opic/students", icon: <IcoUsers /> },
    { label: "Script mẫu",  href: "/teacher/opic/scripts",  icon: <IcoScript /> },
  ]},
  { type: "group", label: "VSTEP", key: "vstep", icon: <IcoMedal />, items: [
    { label: "Tổng quan VSTEP",    href: "/teacher/vstep",          icon: <IcoMedal /> },
    { label: "Phiên thi",          href: "/teacher/vstep/sessions", icon: <IcoClip /> },
    { label: "Đoạn văn / Audio",   href: "/teacher/vstep/passages", icon: <IcoBook /> },
  ]},
  { type: "link", label: "Cấu hình danh mục", href: "/teacher/config", icon: <IcoGear /> },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const router     = useRouter();
  const pathname   = usePathname();
  const isHydrated = useAppSelector((s) => s.auth.isHydrated);
  const user       = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) { router.replace("/login?next=/teacher/quizzes"); return; }
    if (user.role !== "Teacher" && user.role !== "Admin" && user.role !== "SuperAdmin") {
      router.replace("/");
    }
  }, [isHydrated, user, router]);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const initOpenGroups = () => {
    const keys: string[] = [];
    NAV_ENTRIES.forEach((e) => {
      if (e.type === "group" && e.items.some((i) => pathname === i.href || pathname.startsWith(i.href + "/"))) {
        keys.push(e.key);
      }
    });
    // default open quiz group
    if (!keys.length) keys.push("quiz");
    return keys;
  };
  const [openGroups, setOpenGroups] = useState<string[]>(initOpenGroups);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  if (!user || (user.role !== "Teacher" && user.role !== "Admin" && user.role !== "SuperAdmin")) return null;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className={`sticky top-14 h-[calc(100vh-3.5rem)] shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden transition-all duration-200 ${
          sidebarOpen ? "w-60" : "w-14"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex h-14 items-center border-b border-gray-100 px-3 shrink-0">
          {sidebarOpen && (
            <Link href="/teacher/quizzes" className="flex-1 text-sm font-bold text-blue-700 truncate">
              Teacher Portal
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            title={sidebarOpen ? "Thu gọn menu" : "Mở rộng menu"}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0"
          >
            {sidebarOpen ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {NAV_ENTRIES.map((entry) => {
            if (entry.type === "link") {
              const active = pathname === entry.href || pathname.startsWith(entry.href + "/");
              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  title={!sidebarOpen ? entry.label : undefined}
                  className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <span className="shrink-0">{entry.icon}</span>
                  {sidebarOpen && <span className="truncate">{entry.label}</span>}
                </Link>
              );
            }

            const isGroupOpen    = openGroups.includes(entry.key);
            const hasActiveChild = entry.items.some((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
            return (
              <div key={entry.key}>
                <button
                  onClick={() => sidebarOpen && toggleGroup(entry.key)}
                  title={!sidebarOpen ? entry.label : undefined}
                  className={`w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                    hasActiveChild ? "text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <span className="shrink-0">{entry.icon}</span>
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 truncate text-left">{entry.label}</span>
                      <IcoChevron down={isGroupOpen} />
                    </>
                  )}
                </button>
                {sidebarOpen && isGroupOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-100 pl-3">
                    {entry.items.map((item) => {
                      const active = pathname === item.href || pathname.startsWith(item.href + "/");
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                            active ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                        >
                          <span className="shrink-0">{item.icon}</span>
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User info */}
        <div className="shrink-0 border-t border-gray-100 p-2">
          <div className={`flex items-center gap-2.5 rounded-lg bg-gray-50 px-2.5 py-2 ${!sidebarOpen ? "justify-center" : ""}`}>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
              {user.fullName?.[0]?.toUpperCase() ?? "T"}
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{user.fullName}</p>
                <p className="text-xs text-gray-400 truncate">{user.role}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
