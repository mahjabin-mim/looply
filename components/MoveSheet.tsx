"use client";
import { useState } from "react";
import type { Item } from "@/lib/db";
import { monthLabel, shiftMonth } from "@/lib/format";
import Sheet from "./Sheet";

/** Pick the month a wishlist item goes into. */
export default function MoveSheet({
  item, current, onClose, onMove,
}: {
  item: Item;
  current: string;
  onClose: () => void;
  onMove: (month: string) => void;
}) {
  const quick = [current, shiftMonth(current, 1), shiftMonth(current, 2)];
  const [choice, setChoice] = useState(current);
  const [custom, setCustom] = useState("");

  return (
    <Sheet title="Move to a month" onClose={onClose} size="sm">
      <form onSubmit={(e) => { e.preventDefault(); onMove(choice); }}>
        <p className="fine" style={{ marginTop: 0 }}>“{item.title}” leaves your wishlist and goes on that month&apos;s list.</p>
        <div className="chips">
          {quick.map((m, i) => (
            <button type="button" key={m} className={`chip ${choice === m && !custom ? "on" : ""}`} onClick={() => { setChoice(m); setCustom(""); }}>
              {i === 0 ? `This month (${monthLabel(m, "short")})` : monthLabel(m)}
            </button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="mv-month">Or pick another month</label>
          <input id="mv-month" type="month" min={current} value={custom} onChange={(e) => { setCustom(e.target.value); if (e.target.value) setChoice(e.target.value); }} />
        </div>
        <div className="actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn">Move to {monthLabel(choice, "short")}</button>
        </div>
      </form>
    </Sheet>
  );
}
