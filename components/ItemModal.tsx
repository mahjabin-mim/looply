"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import type { Item } from "@/lib/db";

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
    <motion.div className="overlay" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.form
        className="glass modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ title, price, mine, doneAt: when ? new Date(when).toISOString() : null });
        }}
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.94 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
      >
        <h3>Edit item</h3>
        <div className="field"><label>What</label><input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus required /></div>
        <div className="field"><label>Price</label><input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" /></div>
        <div className="field">
          <label>Whose money is this?</label>
          <div className="seg">
            <button type="button" className={mine ? "on" : ""} onClick={() => setMine(true)}>My money</button>
            <button type="button" className={!mine ? "on" : ""} onClick={() => setMine(false)}>Not mine</button>
          </div>
        </div>
        <div className="field"><label>Date & time done</label><input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></div>
        <div className="actions">
          <button type="button" className="ghost" onClick={onClose}>Cancel</button>
          <button className="btn">Save</button>
        </div>
      </motion.form>
    </motion.div>
  );
}
