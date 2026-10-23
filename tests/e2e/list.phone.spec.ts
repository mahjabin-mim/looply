import { expect, test, type Page } from "@playwright/test";
import { findItem, newUser, prepare, row, sectionOf, swipe } from "./helpers";

test.beforeEach(async ({ page }) => {
  await prepare(page);
  await newUser(page);
});

async function addViaSheet(page: Page, title: string, price = "") {
  await page.getByLabel("What do you want to buy or do?").fill(title);
  if (price) await page.getByLabel("Price (optional)").fill(price);
  await page.getByRole("button", { name: "Add to list" }).click();
}

test("phone layout: bottom bar, + opens an add sheet that stays open", async ({ page }) => {
  await page.goto("/");
  const nav = page.locator(".bottom-nav");
  await expect(nav).toBeVisible();
  await expect(page.locator(".composer")).toHaveCount(0); // the desktop add row is hidden on phones
  for (const label of ["My list", "Wishlist", "Savings", "Settings"]) await expect(nav.getByRole("button", { name: label })).toBeVisible();

  await page.locator("[data-open-add]").click();
  await expect(page.locator(".sheet-head h3")).toHaveText(/^Add to /);
  await addViaSheet(page, "Milk", "120");
  await addViaSheet(page, "Bread", "60");
  await expect(page.locator(".composer-sheet .added")).toContainText("Bread, Milk");
  await page.getByRole("button", { name: "Close" }).click();
  await expect(row(page, "Milk")).toBeVisible();
  await expect(row(page, "Bread")).toBeVisible();
});

test("swipe right ticks an item off", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-open-add]").click();
  await addViaSheet(page, "Pay internet", "1200");
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.locator(".overlay")).toHaveCount(0); // sheet fully gone before the finger lands

  await swipe(page, row(page, "Pay internet"), 180);

  await expect.poll(() => sectionOf(page, "Pay internet")).toBe("Done");
  await expect.poll(async () => (await findItem(page, "Pay internet"))[0].status).toBe("done");
});

test("the ⋯ menu offers every action and deletes", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-open-add]").click();
  await addViaSheet(page, "Old item");
  await page.getByRole("button", { name: "Close" }).click();

  await row(page, "Old item").getByRole("button", { name: "More actions" }).click();
  const actions = page.locator(".action-list button");
  await expect(actions).toHaveText([/Mark as done/, /Edit details/, /Move to wishlist/, /Not now/, /Delete/]);
  await actions.filter({ hasText: "Delete" }).click();
  await expect(row(page, "Old item")).toHaveCount(0);
  await expect.poll(async () => (await findItem(page, "Old item")).length, { timeout: 9000 }).toBe(0);
});
