"use client";
import { useState } from "react";
import Sheet from "./Sheet";
import { monthLabel, tk } from "@/lib/format";

/** Edit the money left over from earlier months (after savings). */
export default function LeftoverSheet({
  month, value, estimate, manual, onClose, onSave, onReset,
}: {
  month: string;
  value: number;
  estimate: number; // Looply's own figure: budget − spent − saving goal, summed over earlier months
  manual: boolean;
  onClose: () => void;
  onSave: (amount: number) => void;
  onReset: () => void;
}) {
  const [v, setV] = useState(String(Math.round(value * 100) / 100));
  const n = Number(v);
  const valid = v.trim() !== "" && Number.isFinite(n);

  return (
    <Sheet title="Money left over" onClose={onClose} size="sm">
      <form onSubmit={(e) => { e.preventDefault(); if (valid) onSave(n); }}>
        <p className="fine" style={{ marginTop: 0 }}>
          What&apos;s left from the months before {monthLabel(month)}, after your savings. Change it if your real cash is different — later months will keep adding to your number.
        </p>
        <div className="field" style={{ marginTop: 14 }}>
          <label htmlFor="lo-amount">Left over before {monthLabel(month)}</label>
          <div className="money-input">
            <span>৳</span>
            <input id="lo-amount" type="number" step="0.01" inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} autoFocus />
          </div>
          <p className="fine">Looply&apos;s estimate: <b>{tk(estimate)}</b> (budget − spent − saving goal, for each earlier month)</p>
        </div>
        <div className="actions">
          {manual && <button type="button" className="btn-ghost" onClick={onReset} style={{ marginRight: "auto" }}>Use estimate</button>}
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={!valid}>Save</button>
        </div>
      </form>
    </Sheet>
  );
}
