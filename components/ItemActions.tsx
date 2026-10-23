"use client";
import Sheet from "./Sheet";
import type { Item } from "@/lib/db";
import { tk } from "@/lib/format";

/** Phone action sheet for one item. */
export default function ItemActions({
  item, wish = false, onClose, onToggle, onEdit, onSkip, onDelete, onWish,
}: {
  item: Item;
  wish?: boolean; // wishlist item: Bought it / Move to a month
  onWish?: () => void; // month item: move to the wishlist
  onClose: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onSkip: () => void;
  onDelete: () => void;
}) {
  const done = item.status === "done";
  const skipped = item.status === "skipped";
  const run = (fn: () => void) => () => { onClose(); fn(); };

  return (
    <Sheet title={item.title} onClose={onClose} size="sm">
      {item.price != null && <p className="fine" style={{ marginTop: 0 }}>{tk(item.price)}{item.mine === false ? " · not my money" : ""}</p>}
      <div className="action-list">
        {wish && (
          <>
            <button onClick={run(onToggle)}>
              <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              Bought it — add to this month as done
            </button>
            <button onClick={run(onSkip)}>
              <svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></svg>
              Move to a month…
            </button>
          </>
        )}
        {!wish && !skipped && (
          <button onClick={run(onToggle)}>
            <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            {done ? "Mark as not done" : "Mark as done"}
          </button>
        )}
        <button onClick={run(onEdit)}>
          <svg viewBox="0 0 24 24"><path d="M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></svg>
          Edit details
        </button>
        {!wish && !done && onWish && (
          <button onClick={run(onWish)}>
            <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" /></svg>
            Move to wishlist
          </button>
        )}
        {!wish && !done && (
          <button onClick={run(onSkip)}>
            {skipped ? (
              <svg viewBox="0 0 24 24"><path d="M9 14L4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 010 11H11" /></svg>
            ) : (
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            )}
            {skipped ? "Put back on the list" : "Not now — move to a later month"}
          </button>
        )}
        <button className="danger-text" onClick={run(onDelete)}>
          <svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" /></svg>
          Delete
        </button>
      </div>
    </Sheet>
  );
}
