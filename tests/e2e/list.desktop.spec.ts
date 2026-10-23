import { expect, test } from "@playwright/test";
import { findItem, monthHeading, monthLabelOf, newUser, prepare, row, sectionOf, seedMonths } from "./helpers";

test.beforeEach(async ({ page }) => {
  await prepare(page);
  await newUser(page);
});

test("add an item, tick it off, and it moves to Done", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("New item").fill("Groceries");
  await page.getByLabel("Price").fill("850");
  await page.getByRole("button", { name: "Add", exact: true }).click();

  await expect(row(page, "Groceries")).toBeVisible();
  expect(await sectionOf(page, "Groceries")).toBe("To do");
  expect((await findItem(page, "Groceries"))[0]).toMatchObject({ price: 850, status: "pending" });

  await row(page, "Groceries").getByRole("button", { name: "Mark as done" }).click();
  await expect.poll(() => sectionOf(page, "Groceries")).toBe("Done");
  await expect.poll(async () => (await findItem(page, "Groceries"))[0].status).toBe("done");
});

test("delete can be undone within 5 seconds", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("New item").fill("Call the plumber");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  const r = row(page, "Call the plumber");

  await r.hover();
  await r.getByRole("button", { name: "Delete" }).click();
  await expect(r).toHaveCount(0);
  await page.locator(".toast").getByRole("button", { name: "Undo" }).click();
  await expect(r).toBeVisible();
  await page.waitForTimeout(5500);
  expect(await findItem(page, "Call the plumber")).toHaveLength(1);

  await r.hover();
  await r.getByRole("button", { name: "Delete" }).click();
  await expect.poll(async () => (await findItem(page, "Call the plumber")).length, { timeout: 9000 }).toBe(0);
});

test("the overview shows cash left, planned and the saving goal", async ({ page }) => {
  await seedMonths(page);
  await page.goto("/");
  await expect(page.locator(".hero-num")).toHaveText("৳13,700"); // 34,000 − 20,300
  await expect(page.locator(".ov-sub")).toContainText("৳6,700 after planned"); // − 7,000 planned
  await expect(page.locator(".status")).toHaveText("৳3,300 short of your saving goal");
  // "not mine" money is kept out of spending
  await expect(page.locator(".legend")).toContainText("Spent ৳20,300");
});

test("move between months and back to today", async ({ page }) => {
  const { now, m1 } = await seedMonths(page);
  await page.goto("/");
  await expect(monthHeading(page, monthLabelOf(now))).toBeVisible();
  await page.getByRole("button", { name: "Previous month" }).click();
  await expect(monthHeading(page, monthLabelOf(m1))).toBeVisible();
  await expect(row(page, "Groceries")).toBeVisible();
  await page.getByRole("button", { name: "Today" }).click();
  await expect(monthHeading(page, monthLabelOf(now))).toBeVisible();
  await expect(page.getByRole("button", { name: "Today" })).toHaveCount(0);
});

test("clicking an item opens Edit, and Escape closes it", async ({ page }) => {
  await seedMonths(page);
  await page.goto("/");
  await row(page, "Gym membership").locator(".row-body").click();
  await expect(page.locator(".sheet-head h3")).toHaveText("Edit item");
  await page.locator(".sheet").getByLabel("Price").fill("2500");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(row(page, "Gym membership")).toContainText("৳2,500");
  expect((await findItem(page, "Gym membership"))[0].price).toBe(2500);

  await row(page, "Gym membership").locator(".row-body").click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".sheet")).toHaveCount(0);
});

test("unfinished items from last month carry over", async ({ page }) => {
  const { now, m1 } = await seedMonths(page);
  // add straight to last month, then reload: it should appear in this month too
  await page.request.post("/api/items", { data: { month: m1, title: "Winter jacket", price: 5500 } });
  await page.goto("/");
  await expect(row(page, "Winter jacket")).toBeVisible();
  await expect(row(page, "Winter jacket")).toContainText(`From ${monthLabelOf(m1, "short")}`);
  const copies = await findItem(page, "Winter jacket");
  expect(copies.map((i: { month: string }) => i.month).sort()).toEqual([m1, now].sort());
});
