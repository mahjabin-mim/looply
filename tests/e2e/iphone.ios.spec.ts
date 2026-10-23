import { createHash, randomBytes } from "crypto";
import { expect, test, type Page } from "@playwright/test";
import { newUser, openSettings, prepare, row } from "./helpers";

// Runs in WebKit (Safari's engine) at iPhone size.

const b64url = (b: Buffer) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** Put an app lock on this "device" the same way the app stores it (see lib/applock.ts). */
async function setLock(page: Page, email: string, pin: string, bio?: string) {
  const salt = b64url(randomBytes(16));
  const hash = b64url(createHash("sha256").update(`${salt}:${pin}`).digest());
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [`applock:${email}`, JSON.stringify({ salt, hash, len: pin.length, bio })]);
}

test("home-screen app: icon, full screen, status bar and launch screens", async ({ page }) => {
  await page.goto("/");
  const head = page.locator("head");
  await expect(head.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  await expect(head.locator('meta[name="mobile-web-app-capable"], meta[name="apple-mobile-web-app-capable"]')).not.toHaveCount(0);
  await expect(head.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute("content", "black-translucent");
  const splash = head.locator('link[rel="apple-touch-startup-image"]');
  await expect(splash).toHaveCount(11);
  const href = await splash.first().getAttribute("href");
  const img = await page.request.get(href!);
  expect(img.ok()).toBeTruthy();
  expect(img.headers()["content-type"]).toBe("image/png");
});

test("Safari shows how to add Looply to the home screen, and remembers when dismissed", async ({ page }) => {
  // no prepare(): we want the install banner here
  await page.goto("/");
  const banner = page.locator(".install");
  await expect(banner).toContainText("Install Looply");
  await expect(banner).toContainText("Add to Home Screen");
  await expect(banner.getByRole("button", { name: "Install" })).toHaveCount(0); // iPhone has no install button, only steps
  await banner.getByRole("button", { name: "Dismiss" }).click();
  await expect(banner).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".auth-card")).toBeVisible();
  await expect(banner).toHaveCount(0);
});

test("no Android download on iPhone; install steps live in Settings instead", async ({ page }) => {
  await prepare(page);
  await page.goto("/");
  await expect(page.getByText("Get the Android app")).toHaveCount(0);

  await newUser(page);
  await page.goto("/");
  await openSettings(page);
  const sheet = page.locator(".sheet");
  await expect(sheet).toContainText("Install on iPhone or iPad");
  await expect(sheet).toContainText("Add to Home Screen");
  await expect(sheet).not.toContainText("Android app");
});

test("app lock on iPhone: Face ID waits for a tap, the PIN works", async ({ page }) => {
  await prepare(page);
  const email = await newUser(page);
  await page.goto("/");
  await setLock(page, email, "1234", "fake-credential");
  await page.reload();

  const lock = page.locator(".lock");
  await expect(lock).toBeVisible();
  // Safari only allows Face ID after a tap, so nothing is attempted (and no error shown) on its own
  await expect(page.locator(".lock-msg")).toHaveText("");
  await expect(page.getByRole("button", { name: "Use Face ID / Touch ID" }).first()).toBeVisible();

  // this test browser has no Face ID, so tapping it falls back to the PIN with a clear message
  await page.locator(".lock .chip-btn").click();
  await expect(page.locator(".lock-msg")).toHaveText("Face ID / Touch ID didn't work — use your PIN");

  for (const d of "1234") await page.getByRole("button", { name: d, exact: true }).click();
  await expect(page.locator(".overview")).toBeVisible();
});

test("the phone layout works in Safari: bottom bar, add sheet, wishlist", async ({ page }) => {
  await prepare(page);
  await newUser(page);
  await page.goto("/");
  await expect(page.locator(".bottom-nav")).toBeVisible();
  await page.locator("[data-open-add]").click();
  await page.getByLabel("What do you want to buy or do?").fill("Groceries");
  await page.getByLabel("Price (optional)").fill("850");
  await page.getByRole("button", { name: "Add to list" }).click();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(row(page, "Groceries")).toContainText("৳850");

  await row(page, "Groceries").getByRole("button", { name: "Mark as done" }).click();
  await expect(page.locator(".legend")).toHaveCount(0); // no budget yet → no meter
  await expect(page.locator(".hero-num")).toHaveText("৳850");

  await page.locator(".bottom-nav").getByRole("button", { name: "Wishlist" }).click();
  await expect(page.locator(".mh-title h2", { hasText: "Wishlist" })).toBeVisible();
});
