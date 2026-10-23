"use client";
import { useState } from "react";
import Sheet from "./Sheet";
import { monthLabel } from "@/lib/format";

export default function BudgetSheet({
  month, budget, savings, inherited, focus = "budget", onClose, onSave,
}: {
  month: string;
  budget: number;
  savings: number;
  inherited: boolean;
  focus?: "budget" | "savings";
  onClose: () => void;
  onSave: (v: { budget: number; savings: number }) => void;
}) {
  const [b, setB] = useState(budget ? String(budget) : "");
  const [s, setS] = useState(savings ? String(savings) : "");
  const num = (v: string) => (v.trim() === "" ? 0 : Math.max(0, Number(v)) || 0);

  return (
    <Sheet title={`Budget for ${monthLabel(month)}`} onClose={onClose} size="sm">
      <form onSubmit={(e) => { e.preventDefault(); onSave({ budget: num(b), savings: num(s) }); }}>
        {inherited && <p className="fine" style={{ marginTop: 0 }}>These numbers come from an earlier month. Saving makes them this month&apos;s own.</p>}
        <div className="field">
          <label htmlFor="bud">Monthly budget</label>
          <div className="money-input">
            <span>৳</span>
            <input id="bud" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0" value={b} onChange={(e) => setB(e.target.value)} autoFocus={focus === "budget"} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="sav">Saving for the future</label>
          <div className="money-input">
            <span>৳</span>
            <input id="sav" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0" value={s} onChange={(e) => setS(e.target.value)} autoFocus={focus === "savings"} />
          </div>
          <p className="fine">Looply shows whether what&apos;s left after spending covers this amount.</p>
        </div>
        <div className="actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn">Save</button>
        </div>
      </form>
    </Sheet>
  );
}
