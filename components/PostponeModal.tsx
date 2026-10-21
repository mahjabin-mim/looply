"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import type { Item } from "@/lib/db";

const shift = (m: string, n: number) => {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const label = (m: string) => new Date(m + "-01T00:00").toLocaleString("en", { month: "long", year: "numeric" });

export default function PostponeModal({
  item, current, onClose, onConfirm,
}: {
  item: Item;
  current: string;
  onClose: () => void;
  onConfirm: (postponeTo: string | null) => void;
}) {
  const next = shift(current, 1);
  const [choice, setChoice] = useState<string | null>(next); // null = just park it
  const [custom, setCustom] = useState("");
  const quick = [next, shift(current, 2), shift(current, 3)];

  const pick = (m: string | null) => { setChoice(m); setCustom(""); };

  return (
    <motion.div className="overlay" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.form
        className="glass modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); onConfirm(choice); }}
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.94 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
      >
        <h3>Not now</h3>
        <p className="hint">“{item.title}” will be added to the month you choose, automatically.</p>

        <div className="chips">
          {quick.map((m) => (
            <button type="button" key={m} className={`chip ${choice === m && !custom ? "on" : ""}`} onClick={() => pick(m)}>
              {label(m)}
            </button>
          ))}
        </div>

        <div className="field">
          <label>Or pick another month</label>
          <input type="month" min={next} value={custom} onChange={(e) => { setCustom(e.target.value); setChoice(e.target.value || null); }} />
        </div>

        <button type="button" className={`chip wide ${choice === null ? "on" : ""}`} onClick={() => pick(null)}>
          No month — just park it
        </button>

        <div className="actions">
          <button type="button" className="ghost" onClick={onClose}>Cancel</button>
          <button className="btn">{choice ? `Move to ${label(choice)}` : "Park it"}</button>
        </div>
      </motion.form>
    </motion.div>
  );
}
