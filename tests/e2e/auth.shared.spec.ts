import { expect, test } from "@playwright/test";
import { PASSWORD, prepare } from "./helpers";

const inApp = (page: import("@playwright/test").Page) => expect(page.locator(".overview")).toBeVisible();

test.beforeEach(({ page }) => prepare(page));

test("sign up, log out and log back in", async ({ page }) => {
  const email = `t${Date.now()}@looply.test`;
  await page.goto("/");
  await page.getByRole("button", { name: "Create an account" }).click();
  await page.getByLabel("Name").fill("Mim");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign up" }).click();
  await inApp(page);
  await expect(page.locator(".eyebrow")).toContainText("Mim");

  await page.locator("[data-open-menu]").click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await inApp(page);
});

test("a wrong password is rejected", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email").fill("nobody@looply.test");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.locator(".auth-card .error")).toHaveText("Wrong email or password");
});

test("sign-up needs a real email and a 6+ character password", async ({ page }) => {
  const r1 = await page.request.post("/api/auth/signup", { data: { email: "not-an-email", password: PASSWORD } });
  expect(r1.status()).toBe(400);
  const r2 = await page.request.post("/api/auth/signup", { data: { email: `t${Date.now()}@looply.test`, password: "123" } });
  expect(r2.status()).toBe(400);
});
