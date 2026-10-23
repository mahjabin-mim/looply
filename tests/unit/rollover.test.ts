import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rollover, type Data, type Item } from "@/lib/db";

const base = (month: string, extra: Partial<Item> = {}): Item => ({
  id: Math.random().toString(36).slice(2), userId: "u", title: `${month} item`, price: 100, doneAt: null, month,
  status: "pending", carried: false, carriedFrom: null, createdAt: "2026-01-01T00:00:00Z", ...extra,
});
const data = (items: Item[]): Data => ({ users: [], items, budgets: [], push: [] });
const inOctober = (d: Data) => d.items.filter((i) => i.month === "2026-10");

describe("rollover (carry unfinished items into this month)", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 9, 15)); }); // 15 Oct 2026
  afterEach(() => vi.useRealTimers());

  it("copies a pending item from a past month and marks the original", () => {
    const d = data([base("2026-09", { title: "Headphones" })]);
    expect(rollover(d, "u")).toBe(true);
    const [copy] = inOctober(d);
    expect(copy).toMatchObject({ title: "Headphones", status: "pending", carriedFrom: "2026-09", carried: false });
    expect(d.items[0].carried).toBe(true);
  });

  it("does not copy the same item twice", () => {
    const d = data([base("2026-09")]);
    rollover(d, "u");
    expect(rollover(d, "u")).toBe(false);
    expect(inOctober(d)).toHaveLength(1);
  });

  it("leaves done items, this month's items and other users alone", () => {
    const d = data([base("2026-09", { status: "done" }), base("2026-10"), base("2026-09", { userId: "someone else" })]);
    expect(rollover(d, "u")).toBe(false);
    expect(d.items).toHaveLength(3);
  });

  it("brings back a 'Not now' item when its month arrives", () => {
    const d = data([base("2026-08", { status: "skipped", postponeTo: "2026-10", title: "Jacket" })]);
    rollover(d, "u");
    expect(inOctober(d)[0]).toMatchObject({ title: "Jacket", status: "pending", postponeTo: null });
  });

  it("keeps a 'Not now' item waiting for a future month, or parked with no month", () => {
    const d = data([
      base("2026-09", { status: "skipped", postponeTo: "2026-12" }),
      base("2026-09", { status: "skipped", postponeTo: null }),
    ]);
    expect(rollover(d, "u")).toBe(false);
  });

  it("never moves wishlist items", () => {
    const d = data([base("someday", { title: "New phone" })]);
    expect(rollover(d, "u")).toBe(false);
    expect(d.items).toHaveLength(1);
  });
});
