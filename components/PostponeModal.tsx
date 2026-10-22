"use client";
import { useState } from "react";
import type { Item } from "@/lib/db";
import { monthLabel, shiftMonth } from "@/lib/format";
import Sheet from "./Sheet";

export default function PostponeModal({
  item, current, onClose, onConfirm,
}: {
  item: Item;
  current: string;
  onClose: () => void;
  onConfirm: (postponeTo: string | null) => void;
}) {
  const next = shiftMonth(current, 1);
  const [choice, setChoice] = useState<string | null>(next); // null = just park it
  const [custom, setCustom] = useState("");
  const quick = [next, shiftMonth(current, 2), shiftMonth(current, 3)];
  const pick = (m: string | null) => { setChoice(m); setCustom(""); };

  return (
    <Sheet title="Not now" onClose={onClose} size="sm">
      <form onSubmit={(e) => { e.preventDefault(); onConfirm(choice); }}>
        <p className="fine" style={{ marginTop: 0 }}>“{item.title}” will come back on its own in the month you pick.</p>
        <div className="chips">
          {quick.map((m) => (
            <button type="button" key={m} className={`chip ${choice === m && !custom ? "on" : ""}`} onClick={() => pick(m)}>
              {monthLabel(m)}
            </button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="pp-month">Or pick another month</label>
          <input id="pp-month" type="month" min={next} value={custom} onChange={(e) => { setCustom(e.target.value); setChoice(e.target.value || null); }} />
        </div>
        <button type="button" className={`chip chip-wide ${choice === null ? "on" : ""}`} onClick={() => pick(null)}>
          No month — just park it
        </button>
        <div className="actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn">{choice ? `Move to ${monthLabel(choice, "short")}` : "Park it"}</button>
        </div>
      </form>
    </Sheet>
  );
}
