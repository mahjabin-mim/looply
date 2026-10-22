"use client";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type NewItem = { title: string; price: string; mine: boolean };

/** Add-item form: one row on desktop, stacked inside the add sheet on phones. */
export default function Composer({
  onAdd, variant = "inline",
}: {
  onAdd: (v: NewItem) => Promise<void>;
  variant?: "inline" | "sheet";
}) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [mine, setMine] = useState(true);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState<string[]>([]);
  const titleRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      await onAdd({ title: t, price, mine });
      setTitle(""); setPrice(""); setMine(true);
      setAdded((a) => [t, ...a].slice(0, 3));
      titleRef.current?.focus();
    } finally { setBusy(false); }
  }

  const notMine = (
    <label className="toggle">
      <input type="checkbox" checked={!mine} onChange={(e) => setMine(!e.target.checked)} />
      <span className="toggle-ui" aria-hidden />
      <span>Not my money</span>
    </label>
  );

  if (variant === "sheet") {
    return (
      <form className="composer-sheet" onSubmit={submit}>
        <div className="field">
          <label htmlFor="new-title">What do you want to buy or do?</label>
          <input id="new-title" ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Groceries, pay rent…" autoFocus enterKeyHint="next" />
        </div>
        <div className="field">
          <label htmlFor="new-price">Price (optional)</label>
          <div className="money-input">
            <span>৳</span>
            <input id="new-price" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value)} enterKeyHint="done" />
          </div>
        </div>
        {notMine}
        <AnimatePresence>
          {added.length > 0 && (
            <motion.p className="fine added" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              Added: {added.join(", ")}
            </motion.p>
          )}
        </AnimatePresence>
        <button className="btn btn-block" disabled={!title.trim() || busy}>Add to list</button>
      </form>
    );
  }

  return (
    <form className="card composer" onSubmit={submit}>
      <div className="composer-title">
        <svg viewBox="0 0 24 24" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
        <input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add something to buy or do…" aria-label="New item" />
      </div>
      <div className="money-input composer-price">
        <span>৳</span>
        <input type="number" min="0" step="0.01" inputMode="decimal" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} aria-label="Price" />
      </div>
      {notMine}
      <button className="btn" disabled={!title.trim() || busy}>Add</button>
    </form>
  );
}
