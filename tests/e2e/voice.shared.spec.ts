import { expect, test } from "@playwright/test";
import { findItem, mockSpeech, newUser, openTab, prepare, row, say } from "./helpers";

// Browsers in tests can't hear, so speech recognition is replaced with a fake that "hears" a set phrase.
test.beforeEach(async ({ page }) => {
  await prepare(page);
  await mockSpeech(page);
  await newUser(page);
});

test("saying an item fills in the name, price and not-mine", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) await page.locator("[data-open-add]").click();
  const form = page.locator(isMobile ? ".composer-sheet" : ".composer");
  await say(page, "groceries 500 taka not mine");
  await form.locator("[data-mic]").click();

  const title = isMobile ? page.getByLabel("What do you want to buy or do?") : page.getByLabel("New item");
  const price = isMobile ? page.getByLabel("Price (optional)") : page.getByLabel("Price");
  await expect(title).toHaveValue("Groceries");
  await expect(price).toHaveValue("500");
  await expect(form.locator(".toggle input")).toBeChecked();
});

test("voice works for wishes too (1.5 lakh → ৳1,50,000)", async ({ page, isMobile }) => {
  await page.goto("/");
  await openTab(page, "Wishlist");
  if (isMobile) await page.locator("[data-open-add]").click();
  const form = page.locator(isMobile ? ".composer-sheet" : ".composer");
  await say(page, "new laptop 1.5 lakh");
  await form.locator("[data-mic]").click();
  await expect(form.locator("input").first()).toHaveValue("New laptop");
  await form.getByRole("button", { name: isMobile ? "Add to list" : "Add", exact: true }).click();
  if (isMobile) await page.getByRole("button", { name: "Close" }).click();

  await expect(row(page, "New laptop")).toContainText("৳1,50,000");
  expect((await findItem(page, "New laptop"))[0]).toMatchObject({ month: "someday", price: 150000 });
});

test("a blocked microphone is explained", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) await page.locator("[data-open-add]").click();
  const form = page.locator(isMobile ? ".composer-sheet" : ".composer");
  await say(page, "", "not-allowed");
  await form.locator("[data-mic]").click();
  await expect(form).toContainText("Allow the microphone to add by voice");
});
