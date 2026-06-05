"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const TABS = [
  { key: "shop",       href: "/sach" },
  { key: "library",    href: "/thu-vien-sach" },
  { key: "activation", href: "/kich-hoat" },
  { key: "orders",     href: "/don-hang" },
] as const;

/** Secondary navigation bar shown under the main MLS header when inside the /sach section. */
export default function BookSubNav() {
  const pathname = usePathname();
  const t = useTranslations("books_tabs");

  // Active tab: exact match for /sach, prefix match for others
  function isActive(href: string) {
    if (href === "/sach") return pathname === "/sach" || (pathname.startsWith("/sach/") && !TABS.slice(1).some(t => pathname.startsWith(t.href)));
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="bg-white border-b border-gray-200 sticky top-14 z-40">
      <div className="max-w-7xl mx-auto px-5">
        <nav className="flex h-10 gap-6 items-stretch">
          {TABS.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center text-sm font-medium border-b-2 transition-colors px-1 -mb-px ${
                  active
                    ? "border-[#e5173f] text-[#e5173f]"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {t(tab.key)}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
