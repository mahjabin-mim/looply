"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Item, Budget } from "@/lib/db";
import { monthLabel, shiftMonth, tk } from "@/lib/format";
import SpendChart from "./SpendChart";
import { monthStat, type MonthStat } from "@/lib/money";

type Stat = MonthStat & { future?: boolean; label?: boolean };

export default function Summary({
  items, budgets, current,
}: {
  items: Item[];
  budgets: Budget[];
  current: string;
}) {
  const [view, setView] = useState<"year" | "all">("year");
  const [year, setYear] = useState(Number(current.slice(0, 4)) || new Date().getFullYear());

  const stat = (m: string): Stat => monthStat(items, budgets, current, m);

  const starts = [...items.map((i) => i.month), ...budgets.map((b) => b.month)].filter((m) => m <= current);
  const first = starts.length ? starts.reduce((a, b) => (a < b ? a : b)) : current;
  const firstYear = Number(first.slice(0, 4));
  const thisYear = Number(current.slice(0, 4));

  const seg = (
    <div className="segmented" role="tablist">
      {(["year", "all"] as const).map((v) => (
        <button key={v} role="tab" aria-selected={view === v} className={view === v ? "on" : ""} onClick={() => setView(v)}>
          {view === v && <motion.span layoutId="seg-pill" className="pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
          <span className="lbl">{v === "year" ? "Year" : "All time"}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div>
      {seg}
      <AnimatePresence mode="wait" initial={false}>
        {view === "year" ? (
          <motion.div key={`y${year}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            <YearView
              year={year} firstYear={firstYear} thisYear={thisYear} current={current}
              stat={stat} items={items.filter((i) => i.month.startsWith(`${year}-`))}
              onYear={setYear}
            />
          </motion.div>
        ) : (
          <motion.div key="all" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            <AllTime first={first} current={current} stat={stat} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AllTime({ first, current, stat }: { first: string; current: string; stat: (m: string) => Stat }) {
  const rows: Stat[] = [];
  for (let m = first; m <= current; m = shiftMonth(m, 1)) rows.push(stat(m));
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const savedDone = rows.filter((r) => !r.live).reduce((s, r) => s + r.saved, 0);
  const savedNow = rows.find((r) => r.live)?.saved ?? 0;
  const chartData = rows.slice(-6).map((r) => ({ ...r, label: r.live }));

  return (
    <>
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
      </div>

      {chartData.length >= 2 && (
        <section className="card chart-card">
          <h3 className="card-title">Spending by month</h3>
          <SpendChart data={chartData} />
        </section>
      )}

      <MonthTable rows={[...rows].reverse()} />
    </>
  );
}

function MonthTable({ rows }: { rows: Stat[] }) {
  return (
    <section className="card month-table">
      <h3 className="card-title">Month by month</h3>
      <div className="mt-head" aria-hidden>
        <span>Month</span><span>Budget</span><span>Spent</span><span>Saved</span>
      </div>
      {rows.map((r, idx) => {
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
          </motion.div>
        );
      })}
    </section>
  );
}

function YearView({
  year, firstYear, thisYear, current, stat, items, onYear,
}: {
  year: number;
  firstYear: number;
  thisYear: number;
  current: string;
  stat: (m: string) => Stat;
  items: Item[]; // this year's items
  onYear: (y: number) => void;
}) {
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const stats = months.map((m) => (m > current ? { ...stat(m), spent: 0, budget: 0, saved: 0, goal: 0, left: null, future: true } : stat(m)));
  const past = stats.filter((s) => !s.future);

  const spent = past.reduce((s, r) => s + r.spent, 0);
  const saved = past.reduce((s, r) => s + r.saved, 0);
  const savedLive = past.find((r) => r.live)?.saved ?? 0;
  const lefts = past.filter((r) => r.left !== null);
  const left = lefts.reduce((s, r) => s + (r.left ?? 0), 0);
  const doneCount = items.filter((i) => i.status === "done").length;

  // the chart labels this month's column, or the biggest month in a past year
  const peak = past.reduce((a, r) => (r.spent > (a?.spent ?? 0) ? r : a), null as Stat | null);
  const hasLive = past.some((r) => r.live);
  const chart = stats.map((s) => ({ ...s, label: hasLive ? s.live : s.m === peak?.m }));

  const topMonths = [...past].filter((r) => r.spent > 0).sort((a, b) => b.spent - a.spent).slice(0, 3);
  const maxMonth = topMonths[0]?.spent ?? 1;
  const topItems = items
    .filter((i) => i.status === "done" && i.mine !== false && (i.price ?? 0) > 0)
    .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    .slice(0, 5);
  const empty = spent === 0 && doneCount === 0 && past.every((r) => !r.budget);

  return (
    <>
      <section className="month-head">
        <div className="mh-text">
          <span className="eyebrow">Year in review</span>
          <div className="mh-title"><h2>{year}</h2></div>
          <span className="mh-sub">{year === thisYear ? `January – ${monthLabel(current).split(" ")[0]} so far` : "Full year"}</span>
        </div>
        <div className="mh-nav">
          <button className="icon-btn" onClick={() => onYear(year - 1)} disabled={year <= firstYear} aria-label="Previous year">
            <svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <button className="icon-btn" onClick={() => onYear(year + 1)} disabled={year >= thisYear} aria-label="Next year">
            <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
      </section>

      {empty ? (
        <div className="card empty">
          <b>Nothing tracked in {year}</b>
          <p>Add items and a budget, and your year will build up here month by month.</p>
        </div>
      ) : (
        <>
          <div className="kpis kpis-4">
            <div className="card kpi">
              <span className="label">Spent (mine)</span>
              <b>{tk(spent)}</b>
              <small>done items in {year}</small>
            </div>
            <div className="card kpi">
              <span className="label">Saved</span>
              <b>{tk(saved)}</b>
              <small>{savedLive > 0 ? `incl. ${tk(savedLive)} this month` : "toward your goals"}</small>
            </div>
            <div className="card kpi">
              <span className="label">Left over</span>
              <b>{lefts.length ? tk(left) : "—"}</b>
              <small>{lefts.length ? "after savings" : "no finished months yet"}</small>
            </div>
            <div className="card kpi">
              <span className="label">Items done</span>
              <b>{doneCount}</b>
              <small>ticked off in {year}</small>
            </div>
          </div>

          <section className="card chart-card">
            <h3 className="card-title">Spending in {year}</h3>
            <SpendChart data={chart} />
          </section>

          <div className="year-lists">
            <section className="card rank-card">
              <h3 className="card-title">Biggest months</h3>
              {topMonths.length === 0 && <p className="fine">No spending yet.</p>}
              {topMonths.map((r, i) => (
                <motion.div key={r.m} className="rank" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <span className="rank-n">{i + 1}</span>
                  <span className="rank-main">
                    <b>{monthLabel(r.m)}</b>
                    <i className="mini-meter wide"><motion.i initial={{ width: 0 }} animate={{ width: `${(r.spent / maxMonth) * 100}%` }} /></i>
                  </span>
                  <span className="rank-val">{tk(r.spent)}</span>
                </motion.div>
              ))}
            </section>

            <section className="card rank-card">
              <h3 className="card-title">Biggest buys</h3>
              {topItems.length === 0 && <p className="fine">Nothing bought with your money yet.</p>}
              {topItems.map((it, i) => (
                <motion.div key={it.id} className="rank" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <span className="rank-n">{i + 1}</span>
                  <span className="rank-main">
                    <b>{it.title}</b>
                    <small>{monthLabel(it.month)}</small>
                  </span>
                  <span className="rank-val">{tk(it.price ?? 0)}</span>
                </motion.div>
              ))}
            </section>
          </div>
        </>
      )}
    </>
  );
}
