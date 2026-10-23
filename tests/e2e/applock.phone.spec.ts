import { expect, test, type Page } from "@playwright/test";
import { PASSWORD, newUser, openSettings, prepare } from "./helpers";

const locked = (page: Page) => page.locator(".lock");
const app = (page: Page) => page.locator(".overview");

async function turnOnLock(page: Page, pin: string) {
  await openSettings(page);
  await page.getByRole("button", { name: "Turn on app lock" }).click();
  await page.getByLabel("New PIN (4–6 digits)").fill(pin);
  await page.getByLabel("Type it again").fill(pin);
  await page.getByRole("button", { name: "Save PIN" }).click();
  await expect(page.locator(".sheet")).toContainText("App lock is on");
}

/** Pretend the app was in the background for over a minute. */
const awayForAMinute = (page: Page) =>
  page.evaluate(() => {
    const real = Date.now.bind(Date);
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
    Date.now = () => real() + 61_000;
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  });

test.beforeEach(async ({ page }) => {
  await prepare(page);
});

test("PIN lock: locks on open, wrong PIN, right PIN, and again after a minute away", async ({ page }) => {
  await newUser(page);
  await page.goto("/");
  await expect(app(page)).toBeVisible();

  await turnOnLock(page, "1234");
  await page.reload();
  await expect(locked(page)).toBeVisible();
  await expect(app(page)).toHaveCount(0); // nothing of the list shows behind the lock

  await page.keyboard.type("0000");
  await expect(page.locator(".lock-msg")).toHaveText("Wrong PIN · 4 tries left");
  for (const d of "1234") await page.getByRole("button", { name: d, exact: true }).click();
  await expect(app(page)).toBeVisible();

  await awayForAMinute(page);
  await expect(locked(page)).toBeVisible();
  await page.keyboard.type("1234");
  await expect(app(page)).toBeVisible();
});

test("five wrong PINs make you wait", async ({ page }) => {
  await newUser(page);
  await page.goto("/");
  await turnOnLock(page, "1234");
  await page.reload();
  for (let i = 1; i <= 5; i++) {
    await page.keyboard.type("9999");
    // wait for each wrong attempt to register before the next (typing during the shake is ignored)
    if (i < 5) await expect(page.locator(".lock-msg")).toHaveText(`Wrong PIN · ${5 - i} ${5 - i === 1 ? "try" : "tries"} left`);
  }
  await expect(page.locator(".lock-top p").first()).toHaveText(/Too many tries\. Wait \d+s/);
});

test("fingerprint unlock (simulated sensor)", async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  const { authenticatorId } = await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: { protocol: "ctap2", transport: "internal", hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true },
  });
  await newUser(page);
  await page.goto("/");
  await turnOnLock(page, "1234");
  await page.getByRole("button", { name: "Use fingerprint too" }).click();
  await expect(page.locator(".sheet")).toContainText("Unlock with fingerprint is on");

  await page.reload();
  await expect(app(page)).toBeVisible(); // the sensor accepts → straight in

  await cdp.send("WebAuthn.setUserVerified", { authenticatorId, isUserVerified: false });
  await page.reload();
  await expect(locked(page)).toBeVisible();
  // the automatic attempt fails quietly; tapping the fingerprint key explains it
  await expect(page.locator(".lock-msg")).toHaveText("");
  await page.getByRole("button", { name: "Use fingerprint" }).click();
  await expect(page.locator(".lock-msg")).toHaveText("Fingerprint didn't work — use your PIN");
});

test("Forgot PIN logs out and removes the lock; a password log-in never asks for the PIN", async ({ page }) => {
  const email = await newUser(page);
  await page.goto("/");
  await turnOnLock(page, "2580");
  await page.reload();
  await page.getByRole("button", { name: "Forgot PIN? Log out" }).click();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  expect(await page.evaluate((e) => localStorage.getItem(`applock:${e}`), email)).toBeNull();

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(app(page)).toBeVisible();

  await turnOnLock(page, "2580");
  await page.keyboard.press("Escape");
  await page.locator("[data-open-menu]").click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(app(page)).toBeVisible();
  await expect(locked(page)).toHaveCount(0);
});

test("turning the lock off needs the current PIN", async ({ page }) => {
  await newUser(page);
  await page.goto("/");
  await turnOnLock(page, "2580");
  await page.getByRole("button", { name: "Turn off", exact: true }).click();
  await page.getByLabel("Current PIN").fill("1111");
  await page.locator(".sheet").getByRole("button", { name: "Turn off", exact: true }).click();
  await expect(page.locator(".sheet")).toContainText("Current PIN is wrong");
  await page.getByLabel("Current PIN").fill("2580");
  await page.locator(".sheet").getByRole("button", { name: "Turn off", exact: true }).click();
  await expect(page.locator(".sheet")).toContainText("App lock is off");
  await page.reload();
  await expect(app(page)).toBeVisible();
});
