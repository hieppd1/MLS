"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { useTranslations } from "next-intl";
import type { RootState } from "@/lib/store";
import MessagesSidebar from "@/app/_components/MessagesSidebar";

/* ───────────────────────────────────────────────────────────────
   LEFT NAV (Col 1)
─────────────────────────────────────────────────────────────── */
const LEFT_NAV = [
  {
    id: "new", labelKey: "nav_new", href: "/my-lesson", requireAuth: false,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: "enrolled", labelKey: "nav_enrolled", href: "/my-courses", requireAuth: true,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: "group", labelKey: "nav_group", href: "/nhom", requireAuth: true,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "following", labelKey: "nav_following", href: "/following", requireAuth: true,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
  {
    id: "saved", labelKey: "nav_saved", href: "/saved", requireAuth: true,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
  },
  {
    id: "liked", labelKey: "nav_liked", href: "/liked", requireAuth: true,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    id: "friends", labelKey: "nav_friends", href: "/friends", requireAuth: true,
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

/* ───────────────────────────────────────────────────────────────
   PROPS
─────────────────────────────────────────────────────────────── */
interface AppShellProps {
  /** The content that fills col 3 + (optionally) col 4 merged */
  children: React.ReactNode;
  /** Highlight this nav item */
  activeNavId?: string;
}

/* ───────────────────────────────────────────────────────────────
   APP SHELL  (Col 1 + Col 2 + children)
─────────────────────────────────────────────────────────────── */
export default function AppShell({ children, activeNavId }: AppShellProps) {
  const t = useTranslations("app_shell");
  const isLoggedIn = useSelector((s: RootState) => !!s.auth?.accessToken);
  const [activeNav, setActiveNav] = useState(activeNavId ?? "new");
  const [col2Visible, setCol2Visible] = useState(true);

  return (
    <>
      <style>{`
        .mls-shell-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; }
        .mls-shell-scroll::-webkit-scrollbar { width: 4px; }
        .mls-shell-scroll::-webkit-scrollbar-track { background: transparent; }
        .mls-shell-scroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 99px; }
        .mls-shell-scroll:hover::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); }
        .mls-shell-scroll:hover { scrollbar-color: rgba(0,0,0,0.18) transparent; }
        .mls-shell-nav-item {
          display: flex; flex-direction: column; align-items: center;
          gap: 4px; padding: 10px 4px; width: 100%; text-align: center;
          text-decoration: none; line-height: 1.2;
          border-left: 3px solid transparent;
          color: #6B7280; background: transparent;
        }
        .mls-shell-nav-item.is-active { color: #1565C0; background: #EFF6FF; border-left-color: #1565C0; }
        .mls-shell-nav-item.is-locked { color: #D1D5DB; }
        .mls-shell-nav-item span { font-size: 9px; font-weight: 500; }
        .mls-mobile-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0;
          height: 56px; background: #fff; border-top: 1px solid #e5e7eb;
          z-index: 200; align-items: center; justify-content: space-around; padding: 0 4px; }
        @media (max-width: 767px) {
          .mls-col1 { display: none !important; }
          .mls-col2 { display: none !important; }
          .mls-mobile-nav { display: flex !important; }
          .mls-shell-body { height: calc(100vh - 56px - 56px) !important; }
        }
      `}</style>

      <div className="mls-shell-body" style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden" }}>

        {/* COL 1: Left nav (72px) */}
        <aside
          className="mls-shell-scroll mls-col1"
          style={{
            width: 72, flexShrink: 0,
            background: "white", borderRight: "1px solid #e5e7eb",
            display: "flex", flexDirection: "column", alignItems: "center",
            paddingTop: 8, overflowY: "auto", zIndex: 10,
          }}
        >
          {LEFT_NAV.map((item) => {
            const locked = item.requireAuth && !isLoggedIn;
            const active = activeNav === item.id;
            const label = t(item.labelKey as 'nav_new');
            const cls = [
              "mls-shell-nav-item",
              active ? "is-active" : "",
              locked ? "is-locked" : "",
            ].filter(Boolean).join(" ");
            return (
              <Link
                key={item.id}
                href={locked ? "/login" : item.href}
                onClick={() => !locked && setActiveNav(item.id)}
                className={cls}
                title={label}
              >
                {item.icon}
                <span>{label}</span>
              </Link>
            );
          })}


        </aside>

        {/* COL 2: Messages — shared MessagesSidebar */}
        {col2Visible ? (
          <div className="mls-col2" style={{ display: "flex" }}>
            <Suspense fallback={null}>
              <MessagesSidebar onToggle={() => setCol2Visible(false)} />
            </Suspense>
          </div>
        ) : (
          <div
            className="mls-col2"
            style={{
              width: 28, flexShrink: 0, background: "white",
              borderRight: "1px solid #e5e7eb", display: "flex",
              flexDirection: "column", alignItems: "center",
              paddingTop: 10, zIndex: 10,
            }}
          >
            <button
              onClick={() => setCol2Visible(true)}
              title={t("show_messages")}
              style={{
                width: 22, height: 22, borderRadius: "50%", border: "1px solid #E5E7EB",
                background: "#F9FAFB", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#6B7280",
              }}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" strokeLinecap="round" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9l3 3-3 3" />
              </svg>
            </button>
          </div>
        )}

        {/* MAIN CONTENT (col 3+4, or just col 3) — provided by caller */}
        {children}

      </div>

      {/* MOBILE BOTTOM NAV (hidden on desktop) */}
      <nav className="mls-mobile-nav">
        {[
          { href: "/",              icon: "📚", label: t("mb_learn") },
          { href: "/courses",       icon: "🎓", label: t("mb_courses") },
          { href: "/placement-test",icon: "✏️", label: t("mb_placement") },
          { href: "/giao-vien",     icon: "👨‍🏫", label: t("mb_teachers") },
          { href: "/profile",       icon: "👤", label: t("mb_me") },
        ].map(({ href, icon, label }) => (
          <a key={href} href={href} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            textDecoration: "none", flex: 1, padding: "6px 0",
            color: activeNav === href.slice(1) || (href === "/" && activeNav === "new") ? "#1565C0" : "#6B7280",
          }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
            <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
