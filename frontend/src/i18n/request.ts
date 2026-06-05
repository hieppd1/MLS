import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

export const SUPPORTED_LOCALES = ["vi", "en", "ko"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

async function resolveLocale(): Promise<Locale> {
  // 1. Cookie (user explicitly chose)
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  // 2. Accept-Language header
  const headerStore = await headers();
  const acceptLang = headerStore.get("accept-language") ?? "";
  for (const locale of SUPPORTED_LOCALES) {
    if (acceptLang.toLowerCase().startsWith(locale)) {
      return locale;
    }
  }

  // 3. Default
  return "vi";
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
