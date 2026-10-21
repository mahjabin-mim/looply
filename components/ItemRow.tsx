"use client";
import { motion } from "framer-motion";
import type { Item } from "@/lib/db";

const monthName = (m: string) => new Date(m + "-01T00:00").toLocaleString("en", { month: "short", year: "numeric" });

export default function ItemRow({
  item, onToggle, onSkip, onEdit, onDelete,
}: {
  item: Item;
  onToggle: () => void;
  onSkip: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const done = item.status === "done";
  const skipped = item.status === "skipped";
  return (
    <motion.div
      layout
      className={`glass item ${done ? "done" : ""}`}
      style={{ opacity: skipped ? 0.65 : 1 }}
      initial={{ opacity: 0, x: -30, scale: 0.95 }}
      animate={{ opacity: skipped ? 0.65 : 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      whileHover={{ y: -2 }}
    >
      <button className={`check ${done ? "on" : ""}`} onClick={onToggle} aria-label="toggle done" disabled={skipped}>
        <motion.svg viewBox="0 0 24 24" initial={false} animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }}>
          <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={false} animate={{ pathLength: done ? 1 : 0 }} transition={{ duration: 0.3 }} />
        </motion.svg>
      </button>
      <div className="body">
        <span className="title">{item.title}</span>
        <div className="meta">
          {item.price != null && <span className="price">${item.price.toFixed(2)}</span>}
          {item.doneAt && <span>✓ {new Date(item.doneAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>}
          {item.carriedFrom && <span className="tag">from {monthName(item.carriedFrom)}</span>}
        </div>
      </div>
      <button className="icon" onClick={onSkip} title={skipped ? "Put back on list" : "Not now"}>{skipped ? "↩" : "⏸"}</button>
      <button className="icon" onClick={onEdit} title="Edit">✎</button>
      <button className="icon" onClick={onDelete} title="Delete">✕</button>
    </motion.div>
  );
}
