import { describe, expect, it } from "vitest";
import type { Budget, Item } from "@/lib/db";
import { effectiveBudget, firstMonth, leftIn, leftoverAt, monthStat, plannedIn, spentIn } from "@/lib/money";

let n = 0;
const item = (month: string, price: number | null, extra: Partial<Item> = {}): Item => ({
  id: `i${++n}`, userId: "u", title: `Item ${n}`, price, doneAt: null, month,
  status: "done", carried: false, carriedFrom: null, createdAt: `2026-01-01T00:00:${String(n).padStart(2, "0")}Z`,
  ...extra,
});
const budget = (month: string, b: number, savings: number): Budget => ({ userId: "u", month, budget: b, savings });

// Aug: budget 30,000, save 8,000, spent 19,400 → left 2,600
// Sep: budget 32,000, save 10,000, spent 19,400 → left 2,600
// Oct (current): budget 34,000, save 10,000, spent 20,300, planned 7,000
const budgets = [budget("2026-08", 30000, 8000), budget("2026-09", 32000, 10000), budget("2026-10", 34000, 10000)];
const items: Item[] = [
  item("2026-08", 12000), item("2026-08", 6200), item("2026-08", 1200),
  item("2026-09", 12000), item("2026-09", 7400), item("2026-09", 3500, { status: "pending", carried: true }),
  item("2026-10", 12000), item("2026-10", 6850), item("2026-10", 1450),
  item("2026-10", 2400, { mine: false }), // not my money: never counts as spent
  item("2026-10", 2000, { status: "pending" }), item("2026-10", 1500, { status: "pending" }),
  item("2026-10", 3500, { status: "pending", carriedFrom: "2026-09" }),
  item("2026-10", 4800, { status: "pending", mine: false }),
  item("2026-10", 5500, { status: "skipped", postponeTo: "2026-12" }),
  item("someday", 35000, { status: "pending" }), // wishlist: belongs to no month
];

describe("effectiveBudget", () => {
  it("uses the month's own budget", () => {
    expect(effectiveBudget(budgets, "2026-09")).toEqual({ budget: 32000, savings: 10000, inherited: false });
  });
  it("inherits the latest earlier budget", () => {
    expect(effectiveBudget(budgets, "2027-02")).toEqual({ budget: 34000, savings: 10000, inherited: true });
  });
  it("is zero before any budget", () => {
    expect(effectiveBudget(budgets, "2026-01")).toEqual({ budget: 0, savings: 0, inherited: false });
  });
});

describe("spent and planned", () => {
  it("counts only my done items as spent", () => {
    expect(spentIn(items, "2026-10")).toBe(20300);
  });
  it("counts only my to-do items as planned", () => {
    expect(plannedIn(items, "2026-10")).toBe(7000);
  });
});

describe("left over", () => {
  it("is budget − spent − saving goal per month", () => {
    expect(leftIn(items, budgets, "2026-08")).toBe(2600);
    expect(leftIn(items, budgets, "2026-09")).toBe(2600);
  });
  it("ignores months that weren't used", () => {
    expect(leftIn(items, budgets, "2026-11")).toBe(0); // inherits a budget but has no items of its own
  });
  it("adds up earlier months", () => {
    expect(leftoverAt(items, budgets, null, "2026-10")).toEqual({ value: 5200, estimate: 5200, manual: false });
    expect(leftoverAt(items, budgets, null, "2026-09").value).toBe(2600);
    expect(leftoverAt(items, budgets, null, "2026-08").value).toBe(0);
  });
  it("starts from the user's own amount and keeps adding later months", () => {
    const mine = { amount: 8000, asOf: "2026-10" };
    expect(leftoverAt(items, budgets, mine, "2026-10")).toEqual({ value: 8000, estimate: 5200, manual: true });
    // November = 8,000 + what October leaves (34,000 − 20,300 − 10,000 = 3,700)
    expect(leftoverAt(items, budgets, mine, "2026-11").value).toBe(11700);
    // months before the user's amount still use the estimate
    expect(leftoverAt(items, budgets, mine, "2026-09")).toMatchObject({ value: 2600, manual: false });
  });
  it("can go negative when a month overspends", () => {
    const over = [budget("2025-12", 28000, 6000)];
    const spent = [item("2025-12", 9000), item("2025-12", 11000), item("2025-12", 3000)];
    expect(leftIn(spent, over, "2025-12")).toBe(-1000);
  });
});

describe("firstMonth", () => {
  it("ignores wishlist items", () => {
    expect(firstMonth(items, budgets)).toBe("2026-08");
    expect(firstMonth([item("someday", 1)], [])).toBe("");
  });
});

describe("monthStat (Savings tab)", () => {
  it("finished month: saved is the goal when leftover covers it", () => {
    expect(monthStat(items, budgets, "2026-10", "2026-09")).toEqual({
      m: "2026-09", budget: 32000, spent: 19400, saved: 10000, goal: 10000, live: false, left: 2600,
    });
  });
  it("current month: saved is what's on track after planned items", () => {
    // 34,000 − 20,300 − 7,000 = 6,700 on track toward the 10,000 goal
    expect(monthStat(items, budgets, "2026-10", "2026-10")).toMatchObject({ saved: 6700, live: true, left: null });
  });
  it("only counts what the leftover covered", () => {
    const b = [budget("2025-12", 28000, 6000)];
    const xs = [item("2025-12", 23000)];
    expect(monthStat(xs, b, "2026-10", "2025-12")).toMatchObject({ saved: 5000, left: -1000 });
  });
  it("months that weren't used save nothing, even with an inherited budget", () => {
    expect(monthStat(items, budgets, "2026-12", "2026-11")).toEqual({
      m: "2026-11", budget: 0, spent: 0, saved: 0, goal: 0, live: false, left: null,
    });
  });
});
