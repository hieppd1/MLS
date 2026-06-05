"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { setLocale } from "@/i18n/actions";

const LOCALES = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
] as const;

export default function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const t = useTranslations("lang");
  const [isPending, startTransition] = useTransition();

  function handleChange(code: string) {
    startTransition(() => {
      setLocale(code);
    });
  }

  const current = LOCALES.find((l) => l.code === currentLocale) ?? LOCALES[0];

  return (
    <div className="relative group">
      <button
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-white/85 hover:bg-white/15 transition-colors text-sm disabled:opacity-50"
        aria-label={t("label")}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline text-xs font-medium">{current.label}</span>
        <svg className="h-3 w-3 opacity-70" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </button>

      <div className="absolute right-0 top-full mt-1 hidden w-40 rounded-xl border border-gray-200 bg-white shadow-lg group-focus-within:block group-hover:block z-50 overflow-hidden">
        {LOCALES.map((l) => (
          <button
            key={l.code}
            onClick={() => handleChange(l.code)}
            className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
              currentLocale === l.code
                ? "font-semibold text-blue-600 bg-blue-50"
                : "text-gray-700"
            }`}
          >
            <span className="text-base">{l.flag}</span>
            <span>{l.label}</span>
            {currentLocale === l.code && (
              <svg className="ml-auto h-3.5 w-3.5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
