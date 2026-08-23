import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("public sales routes, consent, accessibility, and hydration stay healthy", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
  await page.goto("/");
  await expect(page.getByRole("dialog", { name: "Your privacy choices" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save choices" })).toBeFocused();
  await page.getByRole("checkbox", { name: /Analytics/i }).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Reject non-essential" })).toBeFocused();
  await expect(page.locator('script[src*="vercel-insights"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Reject non-essential" }).click();
  await expect(page.getByRole("link", { name: /Order Music Arrangement/i }).first()).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
  expect(accessibility.violations).toEqual([]);
  expect(browserErrors.filter((message) => /hydration|did not match|cannot be interpolated|position: static/i.test(message))).toEqual([]);

  const missing = await page.goto("/this-route-must-not-exist");
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /not found/i })).toBeVisible();

  await page.goto("/portfolio?work=arrangement");
  await expect(page.getByRole("heading", { name: /our portfolio/i })).toBeVisible();
  await page.goto("/contact");
  await expect(page.getByRole("heading").first()).toBeVisible();
});

test("homepage stays inside automated web-vital guardrails", async ({ page }) => {
  await page.addInitScript(() => {
    const metrics = { lcp: 0, cls: 0, inp: 0 };
    Object.defineProperty(window, "__fmgVitals", { value: metrics, writable: false });
    new PerformanceObserver((list) => { for (const entry of list.getEntries()) metrics.lcp = Math.max(metrics.lcp, entry.startTime); }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => { for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) if (!entry.hadRecentInput) metrics.cls += entry.value ?? 0; }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => { for (const entry of list.getEntries() as Array<PerformanceEntry & { interactionId?: number; duration: number }>) if (entry.interactionId) metrics.inp = Math.max(metrics.inp, entry.duration); }).observe({ type: "event", buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Reject non-essential" }).click();
  await page.waitForTimeout(1000);
  const metrics = await page.evaluate(() => (window as Window & { __fmgVitals: { lcp: number; cls: number; inp: number } }).__fmgVitals);
  expect(metrics.lcp).toBeLessThan(4000);
  expect(metrics.cls).toBeLessThan(0.15);
  expect(metrics.inp).toBeLessThan(500);
});

test("login, role gates, and arrangement order preserve a safe destination", async ({ page }) => {
  await page.goto("/client/projects?new=1&service=arrangement");
  await expect(page).toHaveURL(/\/login\?next=%2Fclient%2Fprojects%3Fnew%3D1%26service%3Darrangement/);
  await expect(page.getByRole("heading", { name: /welcome back|sign in/i })).toBeVisible();

  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fdashboard/);

  await page.goto("/signup");
  await expect(page.getByRole("checkbox", { name: /terms/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Terms & Conditions" })).toHaveAttribute("href", "/legal/terms");
});
