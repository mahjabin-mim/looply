import { expect, request as pwRequest, test } from "@playwright/test";
import { addItem, currentMonth, newUser } from "./helpers";

test("export as CSV and Excel, including wishlist rows", async ({ page, baseURL }) => {
  await newUser(page);
  const now = await currentMonth(page);
  await addItem(page, now, 'Tea, "green"', 25, { mine: false });
  await addItem(page, "someday", "New phone", 35000);

  const csv = await page.request.get("/api/export?format=csv");
  expect(csv.headers()["content-type"]).toContain("text/csv");
  const text = await csv.text();
  expect(text.charCodeAt(0)).toBe(0xfeff); // BOM so Excel reads ৳ and Bangla correctly
  expect(text).toContain("Month,Item,Price,Whose money,Status");
  expect(text).toContain(`${now},"Tea, ""green""",25,Not mine,pending`);
  expect(text).toContain("Wishlist,New phone,35000,Mine,pending");

  const xlsx = await page.request.get("/api/export?format=xlsx");
  expect(xlsx.headers()["content-type"]).toContain("spreadsheetml");
  expect((await xlsx.body()).subarray(0, 2).toString()).toBe("PK"); // .xlsx is a zip file

  const anon = await pwRequest.newContext({ baseURL });
  expect((await anon.get("/api/export")).status()).toBe(401);
  await anon.dispose();
});

test("other people's items can't be read or changed", async ({ page, browser }) => {
  await newUser(page);
  const mine = await addItem(page, await currentMonth(page), "Private item", 100);

  const other = await browser.newPage();
  await newUser(other, "Someone else");
  const theirs = await (await other.request.get("/api/items")).json();
  expect(theirs.items.find((i: { id: string }) => i.id === mine.id)).toBeUndefined();
  expect((await other.request.patch(`/api/items/${mine.id}`, { data: { title: "hacked" } })).status()).toBe(404);
  await other.close();
});

test("delete account removes everything", async ({ page }) => {
  await newUser(page);
  await addItem(page, await currentMonth(page), "Something", 10);
  expect((await page.request.delete("/api/auth/account", { data: { password: "wrong" } })).status()).toBe(400);
  expect((await page.request.delete("/api/auth/account", { data: { password: "secret123" } })).ok()).toBeTruthy();
  expect((await page.request.get("/api/items")).status()).toBe(401);
});
