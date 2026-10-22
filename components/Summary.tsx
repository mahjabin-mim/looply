"use client";
import { motion } from "framer-motion";
import type { Item, Budget } from "@/lib/db";
import { monthLabel, shiftMonth, tk } from "@/lib/format";
import SpendChart, { type MonthPoint } from "./SpendChart";

type Eff = (m: string) => { budget: number; savings: number };

export default function Summary({
  items, budgets, current, effective,
}: {
  items: Item[];
  budgets: Budget[];
  current: string;
  effective: Eff;
}) {
  const mine = (i: Item) => i.mine !== false;
  const sum = (xs: Item[]) => xs.reduce((s, i) => s + (i.price ?? 0), 0);

  const starts = [...items.map((i) => i.month), ...budgets.map((b) => b.month)].filter((m) => m <= current);
  const first = starts.length ? starts.reduce((a, b) => (a < b ? a : b)) : current;

  const rows: (MonthPoint & { others: number })[] = [];
  for (let m = first; m <= current; m = shiftMonth(m, 1)) {
    const mi = items.filter((i) => i.month === m);
    const e = effective(m);
    const spent = sum(mi.filter((i) => i.status === "done" && mine(i)));
    const planned = sum(mi.filter((i) => i.status === "pending" && mine(i)));
    const others = sum(mi.filter((i) => i.status !== "skipped" && !mine(i) && i.price != null));
    // finished months: what the leftover cash covered; this month: what is on track so far
    const left = m < current ? e.budget - spent : e.budget - spent - planned;
    const saved = Math.min(e.savings, Math.max(0, left));
    rows.push({ m, budget: e.budget, spent, others, saved, goal: e.savings, live: m === current });
  }

  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const totalOthers = rows.reduce((s, r) => s + r.others, 0);
  const savedDone = rows.filter((r) => !r.live).reduce((s, r) => s + r.saved, 0);
  const savedNow = rows.find((r) => r.live)?.saved ?? 0;
  const chartData = rows.slice(-6);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <section className="month-head">
        <div className="mh-text">
          <span className="eyebrow">All months</span>
          <div className="mh-title"><h2>Savings & spending</h2></div>
          <span className="mh-sub">{monthLabel(first, "short")} – {monthLabel(current, "short")}</span>
        </div>
      </section>

      <div className="kpis">
        <div className="card kpi">
          <span className="label">Total saved</span>
          <b>{tk(savedDone)}</b>
          <small>{savedNow > 0 ? `+ ${tk(savedNow)} on track this month` : "from finished months"}</small>
        </div>
        <div className="card kpi">
          <span className="label">Total spent (mine)</span>
          <b>{tk(totalSpent)}</b>
          <small>done items, all months</small>
        </div>
        <div className="card kpi">
          <span className="label">Not my money</span>
          <b>{tk(totalOthers)}</b>
          <small>tracked separately</small>
        </div>
      </div>

      {chartData.length >= 2 && (
        <section className="card chart-card">
          <h3 className="card-title">Spending by month</h3>
          <SpendChart data={chartData} />
        </section>
      )}

      <section className="card month-table">
        <h3 className="card-title">Month by month</h3>
        <div className="mt-head" aria-hidden>
          <span>Month</span><span>Budget</span><span>Spent</span><span>Saved</span><span>Not mine</span>
        </div>
        {[...rows].reverse().map((r, idx) => {
          const used = r.budget > 0 ? Math.min(1, r.spent / r.budget) : 0;
          return (
            <motion.div key={r.m} className="mt-row" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.035 }}>
              <span className="mt-month">
                {monthLabel(r.m, "short")}
                {r.live && <em>now</em>}
              </span>
              <span data-l="Budget">{r.budget ? tk(r.budget) : "—"}</span>
              <span data-l="Spent">
                {tk(r.spent)}
                {r.budget > 0 && <i className="mini-meter"><motion.i initial={{ width: 0 }} animate={{ width: `${used * 100}%` }} className={r.spent > r.budget ? "over" : ""} /></i>}
              </span>
              <span data-l={r.live ? "On track" : "Saved"}>{r.goal ? tk(r.saved) : "—"}</span>
              <span data-l="Not mine">{r.others ? tk(r.others) : "—"}</span>
            </motion.div>
          );
        })}
      </section>
    </motion.div>
  );
}
