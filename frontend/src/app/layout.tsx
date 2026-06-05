import type { Metadata } from "next";
import { Geist, Geist_Mono, Be_Vietnam_Pro, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import Providers from "@/components/layout/Providers";
import Header from "@/components/layout/Header";
import SupportChatWidget from "@/components/chat/SupportChatWidget";
import Toaster from "@/components/ui/Toaster";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

// IV-3 / IV-4 — hreflang alternates + og:locale per locale
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mls.vn";

const OG_LOCALE: Record<string, string> = {
  vi: "vi_VN",
  en: "en_US",
  ko: "ko_KR",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const ogLocale = OG_LOCALE[locale] ?? "vi_VN";
  const alternateOgLocales = Object.values(OG_LOCALE).filter((l) => l !== ogLocale);
  // Because locale is cookie-based (not URL-based), all hreflang URLs point to the same path.
  const pathname = (await headers()).get("x-pathname") ?? "/";
  const canonical = `${SITE_URL}${pathname}`;

  return {
    title: "MLS — Nền tảng học tiếng Việt",
    description: "Multi-tenant Vietnamese language learning platform",
    alternates: {
      canonical,
      languages: {
        vi: canonical,
        en: canonical,
        ko: canonical,
        "x-default": canonical,
      },
    },
    openGraph: {
      locale: ogLocale,
      alternateLocale: alternateOgLocales,
      siteName: "MLS Learning Platform",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${beVietnamPro.variable} ${notoSansKR.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>
            <Header />
            <main className="flex-1">{children}</main>
            <SupportChatWidget />
            <Toaster />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

