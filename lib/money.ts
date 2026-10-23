// Money maths shared by the screens (and covered by tests/unit/money.test.ts).
import type { Item, Budget } from "./db";
import { shiftMonth } from "./format";

export type Leftover = { amount: number; asOf: string } | null;

const isMonth = (m: string) => /^\d{4}-\d{2}$/.test(m);
export const isMine = (i: Item) => i.mine !== false;
export const sumPrice = (xs: Item[]) => xs.reduce((s, i) => s + (i.price ?? 0), 0);

/** A month without its own budget reuses the latest earlier month's numbers. */
export function effectiveBudget(budgets: Budget[], m: string) {
  const own = budgets.find((x) => x.month === m);
  if (own) return { budget: own.budget, savings: own.savings, inherited: false };
  const prev = budgets.filter((x) => x.month < m).sort((a, b) => (a.month < b.month ? 1 : -1))[0];
  return { budget: prev?.budget ?? 0, savings: prev?.savings ?? 0, inherited: !!prev };
}

/** My money spent in a month (done items, not marked "not mine"). */
export const spentIn = (items: Item[], m: string) =>
  sumPrice(items.filter((i) => i.month === m && i.status === "done" && isMine(i)));

/** My money still planned in a month (to-do items). */
export const plannedIn = (items: Item[], m: string) =>
  sumPrice(items.filter((i) => i.month === m && i.status === "pending" && isMine(i)));

/** A month counts once it was used: it has items or its own budget. */
export const isTracked = (items: Item[], budgets: Budget[], m: string) =>
  items.some((i) => i.month === m) || budgets.some((b) => b.month === m);

/** What one month left over: budget − spent − saving goal (0 for months not used or without a budget). */
export function leftIn(items: Item[], budgets: Budget[], m: string) {
  const e = effectiveBudget(budgets, m);
  if (!e.budget || !isTracked(items, budgets, m)) return 0;
  return e.budget - spentIn(items, m) - e.savings;
}

/** Sum of leftIn for months from `from` up to (not including) `to`. */
export function leftBetween(items: Item[], budgets: Budget[], from: string, to: string) {
  let t = 0;
  for (let m = from; m < to; m = shiftMonth(m, 1)) t += leftIn(items, budgets, m);
  return t;
}

/** The first month that has any data. */
export const firstMonth = (items: Item[], budgets: Budget[]) =>
  [...budgets.map((b) => b.month), ...items.map((i) => i.month)].filter(isMonth).sort()[0] ?? "";

/**
 * Money left over from the months before `m`, after savings.
 * When the user typed their own figure (as of some month), count from that figure onwards instead.
 */
export function leftoverAt(items: Item[], budgets: Budget[], setting: Leftover, m: string) {
  const first = firstMonth(items, budgets);
  const estimate = first && m ? leftBetween(items, budgets, first, m) : 0;
  const manual = !!setting && !!m && m >= setting.asOf;
  const value = manual ? setting!.amount + leftBetween(items, budgets, setting!.asOf, m) : estimate;
  return { value, estimate, manual };
}

export type MonthStat = {
  m: string; budget: number; spent: number; saved: number; goal: number; live: boolean;
  left: number | null; // budget − spent − goal, finished months only
};

/** One month's numbers for the Savings tab. */
export function monthStat(items: Item[], budgets: Budget[], current: string, m: string): MonthStat {
  // a month counts only if it was used; gaps don't inherit savings
  if (!(isTracked(items, budgets, m) || m === current)) return { m, budget: 0, spent: 0, saved: 0, goal: 0, live: false, left: null };
  const e = effectiveBudget(budgets, m);
  const spent = spentIn(items, m);
  // finished months: what the leftover cash covered; this month: what is on track so far
  const room = m < current ? e.budget - spent : e.budget - spent - plannedIn(items, m);
  const saved = Math.min(e.savings, Math.max(0, room));
  const left = m < current && e.budget > 0 ? e.budget - spent - e.savings : null;
  return { m, budget: e.budget, spent, saved, goal: e.savings, live: m === current, left };
}
