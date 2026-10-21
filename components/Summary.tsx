"use client";
import { motion } from "framer-motion";
import type { Item, Budget } from "@/lib/db";

const tk = (n: number) => `${n < 0 ? "-" : ""}৳${Math.abs(n).toFixed(2)}`;
const label = (m: string) => new Date(m + "-01T00:00").toLocaleString("en", { month: "short", year: "numeric" });
const next = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

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

  const rows = [];
  for (let m = first; m <= current; m = next(m)) {
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
  rows.reverse();

  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const totalOthers = rows.reduce((s, r) => s + r.others, 0);
  const savedDone = rows.filter((r) => !r.live).reduce((s, r) => s + r.saved, 0);
  const savedNow = rows.find((r) => r.live)?.saved ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="big-stats">
        <div className="glass big"><span>Total saved</span><b className="pos">{tk(savedDone)}</b><small>finished months{savedNow > 0 ? ` · +${tk(savedNow)} on track this month` : ""}</small></div>
        <div className="glass big"><span>Total spent (mine)</span><b>{tk(totalSpent)}</b><small>all months, done items</small></div>
        <div className="glass big"><span>Not mine</span><b className="muted">{tk(totalOthers)}</b><small>tracked separately</small></div>
      </div>

      <div className="section-title">Month by month</div>
      {rows.map((r, idx) => (
        <motion.div key={r.m} className="glass sumrow" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}>
          <div className="sm-month">{label(r.m)}{r.live && <em>this month</em>}</div>
          <div className="sm-cells">
            <div><span>Budget</span><b>{r.budget ? tk(r.budget) : "—"}</b></div>
            <div><span>Spent</span><b>{tk(r.spent)}</b></div>
            <div><span>{r.live ? "On track to save" : "Saved"}</span><b className={r.saved > 0 ? "pos" : ""}>{r.goal ? tk(r.saved) : "—"}</b></div>
            {r.others > 0 && <div><span>Not mine</span><b className="muted">{tk(r.others)}</b></div>}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
