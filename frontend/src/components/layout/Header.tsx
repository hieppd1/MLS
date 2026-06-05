"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { clearCredentials } from "@/lib/features/auth/authSlice";
import { useLogoutMutation } from "@/lib/features/auth/authApi";
import { selectCartCount } from "@/lib/features/cart/cartSlice";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import Cookies from "js-cookie";

const NAV_LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/courses", label: "Khoá học" },
  { href: "/sach", label: "Sách" },
  { href: "/thi-online", label: "Thi online" },
  { href: "/nhom", label: "Nhóm" },
];

function SearchIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const locale = useLocale();
  const [logout] = useLogoutMutation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setDropdownOpen(false);
    const refreshToken = Cookies.get("refreshToken") ?? "";
    try {
      await logout({ refreshToken }).unwrap();
    } catch {
      // swallow — clear locally regardless
    }
    Cookies.remove("refreshToken");
    dispatch(clearCredentials());
    router.push("/login");
  }

  const cartCount = useAppSelector(selectCartCount);

  const initials = user?.fullName
    ? user.fullName.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-50 h-14" style={{ background: "var(--brand-blue)" }}>
      <div className="mx-auto flex h-full max-w-7xl items-center gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="mr-2 text-xl font-bold tracking-tight text-white shrink-0">
          MLS
        </Link>

        {/* Nav links — desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/20 text-white"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search bar — desktop */}
        <div className="hidden lg:flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 w-56 focus-within:bg-white/25 transition-colors">
          <SearchIcon />
          <input
            type="search"
            placeholder="Tìm khoá học..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/60 outline-none"
          />
        </div>

        {/* Cart icon */}
        <Link
          href="/gio-hang"
          className="relative flex items-center justify-center h-9 w-9 rounded-full bg-white/20 text-white hover:bg-white/35 transition-colors shadow-sm"
          aria-label="Giỏ hàng"
        >
          <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white px-1 shadow">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </Link>

        {/* Language switcher */}
        <LanguageSwitcher currentLocale={locale} />

        {/* Right actions */}
        {user ? (
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/85 hover:bg-white/15 hover:text-white transition-colors"
              aria-label="Thông báo"
            >
              <BellIcon />
              {/* unread badge placeholder */}
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-[var(--brand-blue)]" />
            </button>

            {/* Avatar dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-full pl-1 pr-2 py-1 text-white hover:bg-white/15 transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                  {initials}
                </span>
                <span className="hidden md:block text-sm font-medium max-w-[100px] truncate">
                  {user.fullName}
                </span>
                <ChevronDown />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-gray-100 bg-white py-1.5 shadow-lg">
                  <div className="border-b border-gray-100 px-4 py-2.5">
                    <p className="truncate text-sm font-semibold text-gray-900">{user.fullName}</p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Trang cá nhân
                  </Link>
                  <Link
                    href="/my-courses"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Khoá học của tôi
                  </Link>
                  {/* OPIC — hiện với mọi người dùng đã đăng nhập */}
                  <Link
                    href="/opic/survey"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Luyện OPIC
                  </Link>
                  {/* Portal — chỉ hiện với Teacher / Admin */}
                  {["Teacher", "Admin", "SuperAdmin"].includes(user.role) && (
                    <Link
                      href="/teacher/quizzes"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-50"
                    >
                      <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                      Portal Giáo viên
                    </Link>
                  )}
                  <Link
                    href="/settings/sessions"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Cài đặt
                  </Link>
                  {["Admin", "SuperAdmin"].includes(user.role) && (
                    <Link
                      href="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Admin Panel
                    </Link>
                  )}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-4 py-1.5 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white transition-colors"
              style={{ background: "var(--brand-accent)" }}
            >
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
