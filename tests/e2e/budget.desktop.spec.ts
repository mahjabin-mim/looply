import { expect, test } from "@playwright/test";
import { api, newUser, prepare, seedMonths } from "./helpers";

test.beforeEach(async ({ page }) => {
  await prepare(page);
  await newUser(page);
});

const tile = (page: import("@playwright/test").Page, i: number) => page.locator(".tile").nth(i);

test("edit the budget and cash left updates", async ({ page }) => {
  const { now } = await seedMonths(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Budget", exact: true }).click();
  await page.getByLabel("Monthly budget").fill("36000");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator(".hero-num")).toHaveText("৳15,700");
  const { budgets } = await api(page, "/api/items");
  expect(budgets.find((b: { month: string }) => b.month === now)).toMatchObject({ budget: 36000, savings: 10000 });
});

test("the saving-goal tile opens the budget sheet on the savings field", async ({ page }) => {
  await seedMonths(page);
  await page.goto("/");
  await expect(tile(page, 0)).toContainText("৳10,000");
  await tile(page, 0).click();
  await expect(page.getByLabel("Saving for the future")).toBeFocused();
});

test("left over: estimate, your own amount, carried forward, and back to the estimate", async ({ page }) => {
  await seedMonths(page);
  await page.goto("/");
  const left = tile(page, 1);
  await expect(left).toContainText("৳5,200"); // 2,600 + 2,600 from the two earlier months
  await expect(left).toContainText("after savings");

  await left.click();
  await expect(page.locator(".sheet-head h3")).toHaveText("Money left over");
  await page.getByLabel(/^Left over before/).fill("8000");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(left).toContainText("৳8,000");
  await expect(left).toContainText("your amount");

  // next month = 8,000 + this month's leftover (34,000 − 20,300 − 10,000 = 3,700)
  await page.getByRole("button", { name: "Next month" }).click();
  await expect(left).toContainText("৳11,700");
  await page.getByRole("button", { name: "Today" }).click();

  await page.reload();
  await expect(left).toContainText("৳8,000");

  await left.click();
  await page.getByRole("button", { name: "Use estimate" }).click();
  await expect(left).toContainText("৳5,200");
  expect((await api(page, "/api/items")).leftover).toBeNull();
});
