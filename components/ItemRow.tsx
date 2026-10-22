"use client";
import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import type { Item } from "@/lib/db";
import { monthLabel, shortDate, tk } from "@/lib/format";

const BURST = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

function Check({ done, disabled, onClick }: { done: boolean; disabled: boolean; onClick: () => void }) {
  const [burst, setBurst] = useState(0);
  return (
    <button
      className={`check ${done ? "on" : ""}`}
      onClick={(e) => { e.stopPropagation(); if (!done) setBurst((b) => b + 1); onClick(); }}
      disabled={disabled}
      aria-label={done ? "Mark as not done" : "Mark as done"}
      aria-pressed={done}
    >
      <svg viewBox="0 0 24 24">
        <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={false} animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }} transition={{ duration: 0.28 }} />
      </svg>
      <AnimatePresence>
        {burst > 0 && (
          <motion.span key={burst} className="burst" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 0.45, duration: 0.2 }}>
            {BURST.map((a, i) => (
              <motion.i
                key={i}
                initial={{ x: 0, y: 0, scale: 1 }}
                animate={{ x: Math.cos(a) * 22, y: Math.sin(a) * 22, scale: 0.3 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              />
            ))}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export default function ItemRow({
  item, mobile, onToggle, onOpen, onSkip, onEdit, onDelete,
}: {
  item: Item;
  mobile: boolean;
  onToggle: () => void;
  onOpen: () => void; // tap on the row: actions sheet on phones, edit on desktop
  onSkip: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const done = item.status === "done";
  const skipped = item.status === "skipped";
  const mine = item.mine !== false;
  const x = useMotionValue(0);
  const doneHint = useTransform(x, [16, 90], [0, 1]);
  const delHint = useTransform(x, [-90, -16], [1, 0]);
  const dragged = useRef(false);

  return (
    <div className="row-wrap">
      {mobile && (
        <div className="swipe-bg" aria-hidden>
          <motion.span className="sw-done" style={{ opacity: doneHint }}>
            <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            {done ? "Not done" : "Done"}
          </motion.span>
          <motion.span className="sw-del" style={{ opacity: delHint }}>
            Delete
            <svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" /></svg>
          </motion.span>
        </div>
      )}
      <motion.div
        className={`row ${done ? "is-done" : ""} ${skipped ? "is-skipped" : ""}`}
        style={{ x, touchAction: "pan-y" }}
        drag={mobile ? "x" : false}
        dragDirectionLock
        dragSnapToOrigin
        dragElastic={0.5}
        dragConstraints={{ left: 0, right: 0 }}
        onDragStart={() => { dragged.current = true; }}
        onDragEnd={(_, info) => {
          setTimeout(() => { dragged.current = false; }, 50);
          if (info.offset.x > 90 && !skipped) onToggle();
          else if (info.offset.x < -90) onDelete();
        }}
      >
        <Check done={done} disabled={skipped} onClick={onToggle} />
        <button className="row-body" onClick={() => !dragged.current && onOpen()}>
          <span className="row-title">{item.title}</span>
          <span className="row-meta">
            {!mine && item.price != null && <span className="tag tag-notmine">Not mine</span>}
            {done && item.doneAt && <span>Done {shortDate(item.doneAt)}</span>}
            {skipped && <span className="tag tag-later">{item.postponeTo ? `Back in ${monthLabel(item.postponeTo, "short")}` : "Parked"}</span>}
            {item.carriedFrom && <span className="tag tag-carried">From {monthLabel(item.carriedFrom, "short")}</span>}
          </span>
        </button>
        {item.price != null && <span className={`row-price ${mine ? "" : "theirs"}`}>{tk(item.price)}</span>}
        {mobile ? (
          <button className="icon-btn more" onClick={onOpen} aria-label="More actions">
            <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></svg>
          </button>
        ) : (
          <div className="row-actions">
            {!done && (
              <button className="icon-btn" onClick={onSkip} title={skipped ? "Put back on the list" : "Not now — move to a later month"} aria-label={skipped ? "Put back" : "Not now"}>
                {skipped ? (
                  <svg viewBox="0 0 24 24"><path d="M9 14L4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 010 11H11" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                )}
              </button>
            )}
            <button className="icon-btn" onClick={onEdit} title="Edit" aria-label="Edit">
              <svg viewBox="0 0 24 24"><path d="M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></svg>
            </button>
            <button className="icon-btn del" onClick={onDelete} title="Delete" aria-label="Delete">
              <svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" /></svg>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
