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
          {item.price != null && <span className={`price ${item.mine === false ? "theirs" : ""}`}>৳{item.price.toFixed(2)}</span>}
          {item.price != null && item.mine === false && <span className="tag notmine">Not mine</span>}
          {item.doneAt && <span>✓ {new Date(item.doneAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>}
          {skipped && item.postponeTo && <span className="tag later">→ {monthName(item.postponeTo)}</span>}
          {item.carriedFrom && <span className="tag">from {monthName(item.carriedFrom)}</span>}
        </div>
      </div>
      <button className={`snooze ${skipped ? "back" : ""}`} onClick={onSkip} title={skipped ? "Put back on the list" : "Not now — skip this for later"}>
        {skipped ? (
          <svg viewBox="0 0 24 24"><path d="M9 14L4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 010 11H11" /></svg>
        ) : (
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
        )}
        <span>{skipped ? "Put back" : "Not now"}</span>
      </button>
      <button className="icon" onClick={onEdit} title="Edit" aria-label="Edit">
        <svg viewBox="0 0 24 24"><path d="M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></svg>
      </button>
      <button className="icon" onClick={onDelete} title="Delete" aria-label="Delete">
        <svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" /></svg>
      </button>
    </motion.div>
  );
}
