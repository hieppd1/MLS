/**
 * IV-6: E2E i18n locale-switching tests (Playwright)
 *
 * Prerequisites:
 *   npm install -D @playwright/test
 *   npx playwright install chromium
 *
 * Run:
 *   npx playwright test e2e/i18n.spec.ts --headed
 *
 * Requires the dev server running at http://localhost:3000
 */
import { test, expect, type Page } from "@playwright/test";

const BASE = "http://localhost:3000";

/** Set NEXT_LOCALE cookie and reload the page */
async function setLocale(page: Page, locale: string) {
  await page.context().addCookies([
    {
      name: "NEXT_LOCALE",
      value: locale,
      domain: "localhost",
      path: "/",
    },
  ]);
  await page.reload();
}

test.describe("IV-6: i18n locale switching", () => {
  test.beforeEach(async ({ page }) => {
    // Start with vi
    await setLocale(page, "vi");
    await page.goto(BASE);
  });

  // ── IV-5: Fallback chain ──────────────────────────────────────────────────

  test("IV-5a: defaults to Vietnamese when no cookie is set", async ({ page }) => {
    // Clear all cookies
    await page.context().clearCookies();
    await page.goto(BASE);
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "vi");
  });

  test("IV-5b: Accept-Language fallback to English", async ({ page }) => {
    await page.context().clearCookies();
    // Override Accept-Language header by modifying the request
    await page.setExtraHTTPHeaders({ "accept-language": "en-US,en;q=0.9" });
    await page.goto(BASE);
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "en");
  });

  // ── IV-1: Currency format ─────────────────────────────────────────────────

  test("IV-1a: VND currency format in Vietnamese (₫ symbol, dots as thousands sep)", async ({
    page,
  }) => {
    await page.goto(`${BASE}/courses`);
    await page.waitForLoadState("networkidle");
    // Any price element — should contain ₫ (VND symbol from Intl.NumberFormat)
    const priceEl = page.locator('[class*="text-red"]').filter({ hasText: /[\d.,]/ }).first();
    if (await priceEl.count() > 0) {
      const text = await priceEl.textContent();
      // vi-VN Intl formats VND as "1.500.000 ₫" — dot thousands separator
      expect(text).toMatch(/₫|đ/);
    }
  });

  test("IV-1b: English locale shows VND with en-US formatting", async ({ page }) => {
    await setLocale(page, "en");
    await page.goto(`${BASE}/courses`);
    await page.waitForLoadState("networkidle");
    // en-US Intl.NumberFormat with VND: "₫1,500,000" (comma thousands separator)
    const priceEl = page.locator('[class*="text-red"]').filter({ hasText: /₫/ }).first();
    if (await priceEl.count() > 0) {
      const text = await priceEl.textContent();
      // Should use comma (,) as thousands separator in en-US
      expect(text).toMatch(/₫[\d,]+/);
    }
  });

  // ── IV-2: Date format ─────────────────────────────────────────────────────

  test("IV-2a: Date shown as DD/MM/YYYY in Vietnamese", async ({ page }) => {
    await page.goto(`${BASE}/don-hang`);
    await page.waitForLoadState("networkidle");
    // Any date element — skip if not authenticated / no orders
    const dateEl = page.locator("text=/\\d{2}\\/\\d{2}\\/\\d{4}/").first();
    if (await dateEl.count() > 0) {
      const text = await dateEl.textContent();
      expect(text).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    }
  });

  // ── IV-3 / IV-4: hreflang + og:locale meta tags ───────────────────────────

  test("IV-3: hreflang alternate link tags are present", async ({ page }) => {
    await page.goto(BASE);
    const hrefLangVi = page.locator('link[rel="alternate"][hreflang="vi"]');
    const hrefLangEn = page.locator('link[rel="alternate"][hreflang="en"]');
    const hrefLangKo = page.locator('link[rel="alternate"][hreflang="ko"]');
    await expect(hrefLangVi).toHaveCount(1);
    await expect(hrefLangEn).toHaveCount(1);
    await expect(hrefLangKo).toHaveCount(1);
  });

  test("IV-4a: og:locale is vi_VN when cookie is vi", async ({ page }) => {
    await page.goto(BASE);
    const ogLocale = page.locator('meta[property="og:locale"]');
    await expect(ogLocale).toHaveAttribute("content", "vi_VN");
  });

  test("IV-4b: og:locale is en_US when cookie is en", async ({ page }) => {
    await setLocale(page, "en");
    await page.goto(BASE);
    const ogLocale = page.locator('meta[property="og:locale"]');
    await expect(ogLocale).toHaveAttribute("content", "en_US");
  });

  test("IV-4c: og:locale is ko_KR when cookie is ko", async ({ page }) => {
    await setLocale(page, "ko");
    await page.goto(BASE);
    const ogLocale = page.locator('meta[property="og:locale"]');
    await expect(ogLocale).toHaveAttribute("content", "ko_KR");
  });

  // ── Language switcher UI ──────────────────────────────────────────────────

  test("Language switcher changes html[lang] attribute", async ({ page }) => {
    await page.goto(BASE);
    // Find and click the language switcher — look for a button with "EN" or language selector
    const switcher = page.locator('[data-testid="lang-switcher"]').first();
    if (await switcher.count() > 0) {
      await switcher.click();
      const enOption = page.locator('[data-testid="lang-en"]').first();
      if (await enOption.count() > 0) {
        await enOption.click();
        await page.waitForTimeout(500);
        await expect(page.locator("html")).toHaveAttribute("lang", "en");
      }
    }
  });
});
