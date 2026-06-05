/**
 * i18nFormat.ts — Locale-aware formatting utilities (IV-1 & IV-2)
 *
 * Currency strategy (all amounts stored as VND):
 *   vi → 1.500.000đ   (Vietnamese Dong, no conversion)
 *   en → ₫1,500,000   (display in VND, international notation)
 *   ko → ₫1,500,000   (display in VND)
 *
 * Date strategy:
 *   vi → DD/MM/YYYY   (28/05/2026)
 *   en → MM/DD/YYYY   (05/28/2026)
 *   ko → YYYY.MM.DD   (2026.05.28)
 */

// ── Currency (VND, locale-aware display) ─────────────────────────────────────

const CURRENCY_LOCALE: Record<string, string> = {
  vi: "vi-VN",
  en: "en-US",
  ko: "ko-KR",
};

/**
 * Format VND amount according to locale.
 * vi → "1.500.000₫"   en/ko → "₫1,500,000"
 */
export function formatCurrency(amount: number, locale = "vi"): string {
  const uiLocale = CURRENCY_LOCALE[locale] ?? "vi-VN";
  try {
    return new Intl.NumberFormat(uiLocale, {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Fallback
    return amount.toLocaleString("vi-VN") + "₫";
  }
}

/**
 * Format a plain number (student count, etc.) with locale-appropriate separators.
 */
export function formatNumber(n: number, locale = "vi"): string {
  const uiLocale = CURRENCY_LOCALE[locale] ?? "vi-VN";
  return new Intl.NumberFormat(uiLocale).format(n);
}

// ── Date ──────────────────────────────────────────────────────────────────────

const DATE_OPTIONS: Record<string, Intl.DateTimeFormatOptions> = {
  vi: { day: "2-digit", month: "2-digit", year: "numeric" }, // DD/MM/YYYY
  en: { month: "2-digit", day: "2-digit", year: "numeric" }, // MM/DD/YYYY
  ko: { year: "numeric", month: "2-digit", day: "2-digit" }, // YYYY.MM.DD
};

const DATE_LOCALE: Record<string, string> = {
  vi: "vi-VN",
  en: "en-US",
  ko: "ko-KR",
};

/**
 * Format a Date or ISO string as short date per locale.
 * vi → "28/05/2026"   en → "05/28/2026"   ko → "2026. 05. 28."
 */
export function formatDate(
  value: Date | string | null | undefined,
  locale = "vi"
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "—";
  const uiLocale = DATE_LOCALE[locale] ?? "vi-VN";
  const opts = DATE_OPTIONS[locale] ?? DATE_OPTIONS.vi;
  return new Intl.DateTimeFormat(uiLocale, opts).format(date);
}

/**
 * Format a Date or ISO string as datetime per locale.
 */
export function formatDateTime(
  value: Date | string | null | undefined,
  locale = "vi"
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "—";
  const uiLocale = DATE_LOCALE[locale] ?? "vi-VN";
  return new Intl.DateTimeFormat(uiLocale, {
    ...DATE_OPTIONS[locale],
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
