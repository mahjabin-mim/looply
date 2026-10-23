import { expect, test } from "@playwright/test";
import { monthLabelOf, newUser, openTab, prepare, seedMonths } from "./helpers";
import { tk } from "../../lib/format";

test.beforeEach(async ({ page }) => {
  await prepare(page);
  await newUser(page);
});

test("Year view: totals, 12-month chart, biggest months and buys", async ({ page }) => {
  const { now, m1, m2 } = await seedMonths(page);
  const year = now.slice(0, 4);
  const inYear = (m: string) => m.startsWith(year);
  // what each seeded month contributes (see seedMonths)
  const spent = { [m2]: 19400, [m1]: 19400, [now]: 20300 };
  const saved = { [m2]: 8000, [m1]: 10000, [now]: 6700 }; // now = on track after planned items
  const left = { [m2]: 2600, [m1]: 2600 };
  const done = { [m2]: 3, [m1]: 2, [now]: 3 };
  const total = (o: Record<string, number>) => Object.entries(o).filter(([m]) => inYear(m)).reduce((s, [, v]) => s + v, 0);

  await page.goto("/");
  await openTab(page, "Savings");
  await expect(page.locator(".segmented [aria-selected=true]")).toHaveText("Year");
  await expect(page.locator(".mh-title h2", { hasText: year })).toBeVisible();

  const kpi = page.locator(".kpi");
  await expect(kpi.nth(0)).toContainText(tk(total(spent)));
  await expect(kpi.nth(1)).toContainText(tk(total(saved)));
  if (total(left)) await expect(kpi.nth(2)).toContainText(tk(total(left)));
  await expect(kpi.nth(3)).toContainText(String(total(done)));

  await expect(page.locator(".chart .xlabel")).toHaveCount(12);
  await expect(page.locator(".rank-card").first().locator(".rank").first()).toContainText(monthLabelOf(now));
  await expect(page.locator(".rank-card").last().locator(".rank").first()).toContainText("House rent");
  await expect(page.locator(".rank-card").last().locator(".rank").first()).toContainText("৳12,000");

  // the previous-year arrow only works when there is an earlier year to show
  const prev = page.getByRole("button", { name: "Previous year" });
  if ([m1, m2].every(inYear)) await expect(prev).toBeDisabled();
  else await expect(prev).toBeEnabled();
  await expect(page.getByRole("button", { name: "Next year" })).toBeDisabled();
});

test("All time: total saved and spent across every month", async ({ page }) => {
  await seedMonths(page);
  await page.goto("/");
  await openTab(page, "Savings");
  await page.getByRole("tab", { name: "All time" }).click();
  await expect(page.locator(".kpi").nth(0)).toContainText("৳18,000"); // 8,000 + 10,000 from finished months
  await expect(page.locator(".kpi").nth(0)).toContainText("৳6,700 on track this month");
  await expect(page.locator(".kpi").nth(1)).toContainText("৳59,100");
  await expect(page.locator(".mt-row")).toHaveCount(3);
});

test("hovering a month on the chart shows its numbers", async ({ page }) => {
  const { m1 } = await seedMonths(page);
  await page.goto("/");
  await openTab(page, "Savings");
  await page.getByRole("tab", { name: "All time" }).click();
  await page.locator(".chart .hit").nth(1).hover();
  const tip = page.locator(".tooltip");
  await expect(tip).toContainText(monthLabelOf(m1));
  await expect(tip).toContainText("৳19,400");
  await expect(tip).toContainText("৳32,000");
});
