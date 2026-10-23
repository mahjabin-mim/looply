"use client";
import { useState } from "react";
import type { Item } from "@/lib/db";
import Sheet from "./Sheet";

const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function ItemModal({
  item, onClose, onSave,
}: {
  item: Item;
  onClose: () => void;
  onSave: (patch: { title: string; price: string; mine: boolean; doneAt: string | null }) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [price, setPrice] = useState(item.price?.toString() ?? "");
  const [mine, setMine] = useState(item.mine !== false);
  const [when, setWhen] = useState(toLocal(item.doneAt));

  return (
    <Sheet title="Edit item" onClose={onClose} size="sm">
      <form onSubmit={(e) => { e.preventDefault(); onSave({ title, price, mine, doneAt: when ? new Date(when).toISOString() : null }); }}>
        <div className="field">
          <label htmlFor="ed-title">What</label>
          <input id="ed-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="ed-price">Price</label>
          <div className="money-input">
            <span>৳</span>
            <input id="ed-price" type="number" step="0.01" min="0" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
          </div>
        </div>
        <label className="toggle" style={{ marginBottom: 16 }}>
          <input type="checkbox" checked={!mine} onChange={(e) => setMine(!e.target.checked)} />
          <span className="toggle-ui" aria-hidden />
          <span>Not my money</span>
        </label>
        {item.month !== "someday" && (
          <div className="field">
            <label htmlFor="ed-when">Date & time done</label>
            <input id="ed-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
        )}
        <div className="actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn">Save</button>
        </div>
      </form>
    </Sheet>
  );
}
