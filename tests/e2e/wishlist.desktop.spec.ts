import { expect, test, type Page } from "@playwright/test";
import { findItem, monthLabelOf, newUser, openTab, prepare, row, seedMonths, shiftMonth } from "./helpers";

test.beforeEach(async ({ page }) => {
  await prepare(page);
  await newUser(page);
});

async function addWish(page: Page, title: string, price: string) {
  await page.getByLabel("New item").fill(title);
  await page.getByLabel("Price").fill(price);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(row(page, title)).toBeVisible();
}

test("wishes are saved without a month and marked when they fit the left-over", async ({ page }) => {
  await seedMonths(page); // ৳5,200 left over from earlier months
  await page.goto("/");
  await openTab(page, "Wishlist");
  await expect(page.locator(".list")).toContainText("Your wishlist is empty");

  await addWish(page, "New phone", "35000");
  await addWish(page, "Headphones", "3000");
  expect((await findItem(page, "New phone"))[0].month).toBe("someday");
  await expect(page.locator(".mh-sub")).toContainText("2 things · ৳38,000 in all");
  await expect(page.locator(".wish-hint")).toContainText("৳5,200");
  await expect(row(page, "Headphones").locator(".tag-fits")).toBeVisible();
  await expect(row(page, "New phone").locator(".tag-fits")).toHaveCount(0);
});

test("move a wish into a month, or mark it bought", async ({ page }) => {
  const { now } = await seedMonths(page);
  const next = shiftMonth(now, 1);
  await page.goto("/");
  await openTab(page, "Wishlist");
  await addWish(page, "New phone", "35000");
  await addWish(page, "Headphones", "3000");

  await row(page, "New phone").hover();
  await row(page, "New phone").getByRole("button", { name: "Move to a month" }).click();
  await page.locator(".sheet .chip").filter({ hasText: monthLabelOf(next) }).click();
  await page.getByRole("button", { name: `Move to ${monthLabelOf(next, "short")}` }).click();
  await expect(row(page, "New phone")).toHaveCount(0);
  expect((await findItem(page, "New phone"))[0].month).toBe(next);

  await row(page, "Headphones").getByRole("button", { name: "Bought it" }).click();
  await expect(row(page, "Headphones")).toHaveCount(0);
  const [h] = await findItem(page, "Headphones");
  expect(h).toMatchObject({ month: now, status: "done" });
  expect(h.doneAt).toBeTruthy();

  await openTab(page, "My list");
  await expect(page.locator(".legend")).toContainText("Spent ৳23,300"); // 20,300 + 3,000
});

test("Not now → Move to my wishlist, and wishes never carry into a month", async ({ page }) => {
  await seedMonths(page);
  await page.goto("/");
  await row(page, "Gym membership").hover();
  await row(page, "Gym membership").getByRole("button", { name: "Not now" }).click();
  await page.getByRole("button", { name: "Move to my wishlist" }).click();
  await page.getByRole("button", { name: "Move to wishlist" }).click();
  await expect(row(page, "Gym membership")).toHaveCount(0);

  await page.reload();
  const copies = await findItem(page, "Gym membership");
  expect(copies).toHaveLength(1);
  expect(copies[0]).toMatchObject({ month: "someday", status: "pending" });
  await openTab(page, "Wishlist");
  await expect(row(page, "Gym membership")).toBeVisible();
});
