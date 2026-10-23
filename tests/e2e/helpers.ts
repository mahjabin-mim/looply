import { expect, type Locator, type Page } from "@playwright/test";
import { monthLabel, shiftMonth } from "../../lib/format";

export { shiftMonth, monthLabel as monthLabelOf };
export const PASSWORD = "secret123";

/** Hide the "install app" banner so it never covers what a test clicks. */
export async function prepare(page: Page) {
  await page.addInitScript(() => { try { localStorage.setItem("install-dismissed", "1"); } catch {} });
}

/** Sign up a brand-new user through the API; the page's browser is logged in afterwards. */
export async function newUser(page: Page, name = "Mim") {
  const email = `t${Date.now()}${Math.random().toString(36).slice(2, 7)}@looply.test`;
  const r = await page.request.post("/api/auth/signup", { data: { email, password: PASSWORD, name } });
  expect(r.ok(), `signup → ${r.status()}`).toBeTruthy();
  return email;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function api<T = any>(page: Page, path: string, method = "GET", data?: unknown): Promise<T> {
  const r = await page.request.fetch(path, { method, data });
  expect(r.ok(), `${method} ${path} → ${r.status()}`).toBeTruthy();
  return r.json();
}

export const currentMonth = async (page: Page): Promise<string> => (await api(page, "/api/items")).current;
export const findItem = async (page: Page, title: string) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (await api(page, "/api/items")).items.filter((i: any) => i.title === title);

export async function addItem(page: Page, month: string, title: string, price: number | null, opts: { status?: string; mine?: boolean } = {}) {
  const it = await api(page, "/api/items", "POST", { month, title, price, mine: opts.mine !== false });
  return opts.status ? api(page, `/api/items/${it.id}`, "PATCH", { status: opts.status }) : it;
}

export const setBudget = (page: Page, month: string, budget: number, savings: number) =>
  api(page, "/api/budget", "PUT", { month, budget, savings });

/**
 * Two finished months and the current one:
 *   m2  budget 30,000  save  8,000  spent 19,400  → left over 2,600
 *   m1  budget 32,000  save 10,000  spent 19,400  → left over 2,600
 *   now budget 34,000  save 10,000  spent 20,300, planned 7,000 (plus 4,800 that isn't mine)
 */
export async function seedMonths(page: Page) {
  const now = await currentMonth(page);
  const m1 = shiftMonth(now, -1), m2 = shiftMonth(now, -2);
  await setBudget(page, m2, 30000, 8000);
  await setBudget(page, m1, 32000, 10000);
  await setBudget(page, now, 34000, 10000);
  const done: [string, string, number][] = [
    [m2, "House rent", 12000], [m2, "Groceries", 6200], [m2, "Internet bill", 1200],
    [m1, "House rent", 12000], [m1, "Groceries", 7400],
    [now, "House rent", 12000], [now, "Groceries", 6850], [now, "Electricity bill", 1450],
  ];
  for (const [m, t, p] of done) await addItem(page, m, t, p, { status: "done" });
  await addItem(page, now, "Gym membership", 2000);
  await addItem(page, now, "Birthday gift", 1500);
  await addItem(page, now, "New headphones", 3500);
  await addItem(page, now, "Office laptop repair", 4800, { mine: false });
  return { now, m1, m2 };
}

/** The list row whose title is exactly `title`. */
export const row = (page: Page, title: string): Locator =>
  page.locator(".row").filter({ has: page.locator(".row-title").getByText(title, { exact: true }) });

/** Which list section ("To do", "Done", "Not now") a title sits in. */
export const sectionOf = (page: Page, title: string) =>
  page.evaluate((t) => {
    let sec: string | null = null;
    for (const el of document.querySelectorAll(".sec-head, .row-title")) {
      if (el.classList.contains("sec-head")) sec = el.querySelector("span")?.textContent ?? null;
      else if (el.textContent === t) return sec;
    }
    return null;
  }, title);

/** Replace the browser's speech recognition with a fake that "hears" window.__say. */
export async function mockSpeech(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__say = "";
    w.__sayError = null;
    class FakeRecognition {
      onresult: ((e: unknown) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        setTimeout(() => {
          if (w.__sayError) { this.onerror?.({ error: w.__sayError }); this.onend?.(); return; }
          const res = [[{ transcript: w.__say }]] as unknown as { isFinal: boolean }[];
          res[0].isFinal = true;
          this.onresult?.({ results: res });
          this.onend?.();
        }, 200);
      }
      stop() { this.onend?.(); }
      abort() {}
    }
    w.SpeechRecognition = FakeRecognition;
    w.webkitSpeechRecognition = FakeRecognition;
  });
}

export const say = (page: Page, phrase: string, error: string | null = null) =>
  page.evaluate(([p, e]) => { const w = window as unknown as Record<string, unknown>; w.__say = p; w.__sayError = e; }, [phrase, error] as const);

/** Open a top-level section: header tabs on desktop, bottom bar on phones. */
export async function openTab(page: Page, name: "My list" | "Wishlist" | "Savings") {
  const phone = await page.locator(".bottom-nav").isVisible();
  const scope = phone ? page.locator(".bottom-nav") : page.locator(".tabs");
  await scope.getByRole("button", { name: new RegExp(`^${name}`) }).click();
  // the old tab animates out first; wait until only the new one is on screen
  const ready = { "My list": ".overview", Wishlist: ".mh-title h2:text-is('Wishlist')", Savings: ".segmented" }[name];
  await expect(page.locator(ready)).toBeVisible();
  await expect(page.locator(".month-head")).toHaveCount(1);
}

/** The month heading, e.g. "October 2026" (ignores one that's still animating out). */
export const monthHeading = (page: Page, label: string) => page.locator(".mh-title h2", { hasText: label });

/** A real finger swipe (touch events), dx pixels to the right (negative = left). */
export async function swipe(page: Page, target: Locator, dx: number) {
  const box = (await target.boundingBox())!;
  const x = box.x + box.width / 2 - dx / 2, y = box.y + box.height / 2;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let i = 1; i <= 12; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + (dx * i) / 12, y }] });
    await page.waitForTimeout(16);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

export async function openSettings(page: Page) {
  await page.locator("[data-open-menu]").click();
  await page.locator("[data-open-profile]").click();
  await expect(page.locator(".sheet-head h3")).toHaveText("Profile & settings");
}
