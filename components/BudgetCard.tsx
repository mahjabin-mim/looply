"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const tk = (n: number) => `${n < 0 ? "-" : ""}৳${Math.abs(n).toFixed(2)}`;

export default function BudgetCard({
  budget, savings, inherited, spent, planned, savedSoFar, onSave,
}: {
  budget: number;
  savings: number;
  inherited: boolean; // values copied from an earlier month, not set for this one
  spent: number; // my money, done
  planned: number; // my money, still to do
  savedSoFar: number;
  onSave: (v: { budget?: number; savings?: number }) => void;
}) {
  const [b, setB] = useState(String(budget || ""));
  const [s, setS] = useState(String(savings || ""));
  useEffect(() => { setB(String(budget || "")); setS(String(savings || "")); }, [budget, savings]);

  const left = budget - spent; // cash available right now
  const after = budget - spent - planned; // cash after everything planned
  const room = after - savings; // what is left once the saving goal is set aside
  const pct = savings > 0 ? Math.min(100, Math.max(0, (after / savings) * 100)) : 0;

  const commit = (k: "budget" | "savings", v: string, cur: number) => {
    const n = Number(v);
    if (v !== "" && !Number.isFinite(n)) return;
    if ((v === "" ? 0 : n) !== cur || inherited) onSave({ [k]: v === "" ? 0 : n });
  };

  return (
    <motion.div className="glass money" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="money-inputs">
        <div>
          <label>Budget this month</label>
          <input type="number" min="0" step="0.01" inputMode="decimal" placeholder="৳ 0.00" value={b}
            onChange={(e) => setB(e.target.value)} onBlur={() => commit("budget", b, budget)}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
        </div>
        <div>
          <label>Saving for future</label>
          <input type="number" min="0" step="0.01" inputMode="decimal" placeholder="৳ 0.00" value={s}
            onChange={(e) => setS(e.target.value)} onBlur={() => commit("savings", s, savings)}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
        </div>
      </div>
      {inherited && budget + savings > 0 && <div className="hint" style={{ margin: "8px 0 0" }}>Copied from an earlier month — edit to change it for this month.</div>}

      {budget > 0 && (
        <div className="money-grid">
          <div><span>Cash left now</span><b className={left < 0 ? "neg" : ""}>{tk(left)}</b></div>
          <div><span>Left after planned</span><b className={after < 0 ? "neg" : ""}>{tk(after)}</b></div>
        </div>
      )}

      {savings > 0 && (
        <div className="save">
          <div className="save-head">
            <span>Saving goal {tk(savings)}</span>
            <b className={room < 0 ? "neg" : "pos"}>{room >= 0 ? `✓ covered, ${tk(room)} spare` : `short by ${tk(-room)}`}</b>
          </div>
          <div className="progress" style={{ margin: "6px 0 0", height: 6 }}>
            <motion.div initial={false} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 90, damping: 18 }} />
          </div>
        </div>
      )}
      <div className="saved-so-far">Saved in past months: <b>{tk(savedSoFar)}</b></div>
    </motion.div>
  );
}
