"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/lib/hooks";
import { useTranslations } from "next-intl";

/* ── Icon helpers ──────────────────────────────────────────────────── */
const IcoDashboard = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const IcoCourse  = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const IcoApprove = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IcoBook    = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>;
const IcoOrder   = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const IcoVoucher = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
const IcoSettings= () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IcoBanner  = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const IcoLevels  = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>;
const IcoUsers   = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const IcoRoles   = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const IcoAdmin   = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const IcoRevenue = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3v18h18M7 14l4-4 4 4 5-5" /></svg>;
const IcoChevron = ({ down }: { down: boolean }) => (
  <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${down ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

/* ── Nav structure ─────────────────────────────────────────────────── */
type NavItem  = { label: string; href: string; icon: React.ReactNode };
type NavEntry =
  | { type: "link";  label: string; href: string; icon: React.ReactNode }
  | { type: "group"; label: string; key: string; icon: React.ReactNode; items: NavItem[] };

function getNavEntries(t: (key: string) => string): NavEntry[] {
  return [
    { type: "link",  label: t("nav_dashboard"),     href: "/admin/analytics",         icon: <IcoDashboard /> },
    { type: "group", label: t("nav_courses_group"), key: "courses",                   icon: <IcoCourse />,
      items: [
        { label: t("nav_courses"),   href: "/admin/courses",           icon: <IcoCourse /> },
        { label: t("nav_approvals"), href: "/admin/content/approvals", icon: <IcoApprove /> },
      ]},
    { type: "link",  label: t("nav_books_group"),  href: "/admin/sach",             icon: <IcoBook /> },
    { type: "link",  label: t("nav_orders"),        href: "/admin/don-hang",         icon: <IcoOrder /> },
    { type: "link",  label: t("nav_shipments"),     href: "/admin/van-don",          icon: <IcoOrder /> },
    { type: "link",  label: t("nav_vouchers"),      href: "/admin/vouchers",         icon: <IcoVoucher /> },
    { type: "group", label: t("nav_system_group"),  key: "config",                   icon: <IcoSettings />,
      items: [
        { label: t("nav_banners"), href: "/admin/settings/banners", icon: <IcoBanner /> },
        { label: t("nav_levels"),  href: "/admin/levels",           icon: <IcoLevels /> },
      ]},
    { type: "group", label: t("nav_chat_group"),    key: "chat",                     icon: <IcoUsers />,
      items: [
        { label: t("nav_chat_groups"),   href: "/admin/chat/groups",  icon: <IcoUsers /> },
        { label: t("nav_chat_config"),   href: "/admin/chat/config",  icon: <IcoSettings /> },
        { label: t("nav_support_inbox"), href: "/admin/chat/support", icon: <IcoUsers /> },
      ]},
    { type: "group", label: t("nav_system_admin"),  key: "sysadmin",                 icon: <IcoAdmin />,
      items: [
        { label: t("nav_users"), href: "/admin/users", icon: <IcoUsers /> },
        { label: t("nav_roles"), href: "/admin/roles", icon: <IcoRoles /> },
      ]},
  ];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppSelector((s) => s.auth.user);
  const isHydrated = useAppSelector((s) => s.auth.isHydrated);
  const t = useTranslations("admin_portal");
  const NAV_ENTRIES = getNavEntries(t);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user || !["Admin", "SuperAdmin"].includes(user.role)) {
      router.replace("/login");
    }
  }, [isHydrated, user, router]);

  const [open, setOpen] = useState(true);

  // Auto-open groups whose child is active
  const initOpenGroups = () => {
    const keys: string[] = [];
    NAV_ENTRIES.forEach((e) => {
      if (e.type === "group" && e.items.some((i) => pathname === i.href || pathname.startsWith(i.href))) {
        keys.push(e.key);
      }
    });
    return keys;
  };
  const [openGroups, setOpenGroups] = useState<string[]>(initOpenGroups);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  if (!isHydrated || !user) return null;
  if (!["Admin", "SuperAdmin"].includes(user.role)) return null;

  return (
    <div className="flex bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`sticky top-14 h-[calc(100vh-3.5rem)] shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden transition-all duration-200 ${
          open ? "w-60" : "w-14"
        }`}
      >
        {/* Sidebar header: logo + toggle */}
        <div className="flex h-14 items-center border-b border-gray-100 px-3 shrink-0">
          {open && (
            <Link href="/admin" className="flex-1 text-sm font-bold text-indigo-600 truncate">
              MLS Admin
            </Link>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            title={open ? "Thu gọn menu" : "Mở rộng menu"}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0"
          >
            {open ? (
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

        {/* Nav: scrollable */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {NAV_ENTRIES.map((entry) => {
            if (entry.type === "link") {
              const active = pathname === entry.href || (entry.href !== "/admin" && pathname.startsWith(entry.href));
              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  title={!open ? entry.label : undefined}
                  className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <span className="shrink-0">{entry.icon}</span>
                  {open && <span className="truncate">{entry.label}</span>}
                </Link>
              );
            }

            // Group
            const isGroupOpen = openGroups.includes(entry.key);
            const hasActiveChild = entry.items.some((i) => pathname === i.href || pathname.startsWith(i.href));
            return (
              <div key={entry.key}>
                <button
                  onClick={() => open && toggleGroup(entry.key)}
                  title={!open ? entry.label : undefined}
                  className={`w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                    hasActiveChild ? "text-indigo-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <span className="shrink-0">{entry.icon}</span>
                  {open && (
                    <>
                      <span className="flex-1 truncate text-left">{entry.label}</span>
                      <IcoChevron down={isGroupOpen} />
                    </>
                  )}
                </button>
                {open && isGroupOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-100 pl-3">
                    {entry.items.map((item) => {
                      const active = pathname === item.href || pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                            active ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
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

          {user.role === "SuperAdmin" && (
            <>
              <div className="pt-4 pb-1">
                {open ? (
                  <p className="px-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Super Admin
                  </p>
                ) : (
                  <div className="border-t border-gray-100 my-1" />
                )}
              </div>
              <Link
                href="/superadmin/tenants"
                title={!open ? "Tenants" : undefined}
                className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith("/superadmin")
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="shrink-0"><IcoAdmin /></span>
                {open && <span className="truncate">Tenants</span>}
              </Link>
            </>
          )}
        </nav>

        {/* User info: fixed at bottom */}
        <div className="shrink-0 border-t border-gray-100 p-2">
          <div className={`flex items-center gap-2.5 rounded-lg bg-gray-50 px-2.5 py-2 ${!open ? "justify-center" : ""}`}>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
              {user.fullName?.[0]?.toUpperCase() ?? "U"}
            </div>
            {open && (
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{user.fullName}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
