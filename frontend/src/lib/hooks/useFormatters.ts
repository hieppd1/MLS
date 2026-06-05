"use client";
/**
 * useFormatters — locale-aware formatting hook for Client Components.
 * Reads NEXT_LOCALE cookie (set by LanguageSwitcher / login sync).
 */
import { useMemo } from "react";
import Cookies from "js-cookie";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/i18nFormat";

type Formatters = {
  locale: string;
  fmtCurrency: (amount: number) => string;
  fmtNumber: (n: number) => string;
  fmtDate: (v: Date | string | null | undefined) => string;
  fmtDateTime: (v: Date | string | null | undefined) => string;
};

export function useFormatters(): Formatters {
  const locale = Cookies.get("NEXT_LOCALE") ?? "vi";

  return useMemo(
    () => ({
      locale,
      fmtCurrency: (amount) => formatCurrency(amount, locale),
      fmtNumber:   (n)      => formatNumber(n, locale),
      fmtDate:     (v)      => formatDate(v, locale),
      fmtDateTime: (v)      => formatDateTime(v, locale),
    }),
    [locale]
  );
}
