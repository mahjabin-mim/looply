import { expect, test } from "@playwright/test";
import { findItem, newUser, openTab, prepare, row } from "./helpers";

test.beforeEach(async ({ page }) => {
  await prepare(page);
  await newUser(page);
});

test("on a phone, + on the Wishlist adds a wish and ⋯ offers Bought it", async ({ page }) => {
  await page.goto("/");
  await openTab(page, "Wishlist");
  await page.locator("[data-open-add]").click();
  await expect(page.locator(".sheet-head h3")).toHaveText("Add to wishlist");
  await page.getByLabel("What do you want to buy or do?").fill("Trip to Cox's Bazar");
  await page.getByLabel("Price (optional)").fill("15000");
  await page.getByRole("button", { name: "Add to list" }).click();
  await page.getByRole("button", { name: "Close" }).click();

  expect((await findItem(page, "Trip to Cox's Bazar"))[0].month).toBe("someday");
  await row(page, "Trip to Cox's Bazar").getByRole("button", { name: "More actions" }).click();
  await expect(page.locator(".action-list button")).toHaveText([/Bought it/, /Move to a month/, /Edit details/, /Delete/]);
});
