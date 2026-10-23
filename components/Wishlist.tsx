"use client";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import type { Item } from "@/lib/db";
import { tk } from "@/lib/format";
import Composer, { type NewItem } from "./Composer";
import ItemRow from "./ItemRow";

/** Things wanted someday, with no month yet. */
export default function Wishlist({
  items, mobile, leftover, onAdd, onBuy, onMove, onOpen, onEdit, onDelete, onAddSheet,
}: {
  items: Item[];
  mobile: boolean;
  leftover: number; // money left over from earlier months — what a wish could come out of
  onAdd: (v: NewItem) => Promise<void>;
  onBuy: (i: Item) => void;
  onMove: (i: Item) => void;
  onOpen: (i: Item) => void;
  onEdit: (i: Item) => void;
  onDelete: (i: Item) => void;
  onAddSheet: () => void;
}) {
  const list = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const total = list.reduce((s, i) => s + (i.price ?? 0), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <section className="month-head">
        <div className="mh-text">
          <span className="eyebrow">Someday</span>
          <div className="mh-title"><h2>Wishlist</h2></div>
          <span className="mh-sub">
            {list.length ? `${list.length} ${list.length === 1 ? "thing" : "things"}${total ? ` · ${tk(total)} in all` : ""}` : "Nothing here yet"}
          </span>
        </div>
      </section>

      {leftover > 0 && list.length > 0 && (
        <div className="card wish-hint">
          <svg viewBox="0 0 24 24" aria-hidden><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" /></svg>
          <span>You have <b>{tk(leftover)}</b> left over from earlier months. Wishes that fit are marked.</span>
        </div>
      )}

      {!mobile && <Composer onAdd={onAdd} placeholder="Add a wish…" />}

      <div className="list">
        {list.length === 0 && (
          <div className="empty">
            <div className="empty-art" aria-hidden>
              <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" /></svg>
            </div>
            <b>Your wishlist is empty</b>
            <p>Save things you want later — a new phone, a trip — and move them into a month when you&apos;re ready.</p>
            {mobile && <button className="btn" onClick={onAddSheet}>Add a wish</button>}
          </div>
        )}
        <LayoutGroup>
          <AnimatePresence initial={false} mode="popLayout">
            {list.map((item) => (
              <motion.div
                key={item.id}
                layout
                className="slot"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.18 } }}
                transition={{ type: "spring", stiffness: 500, damping: 42 }}
              >
                <ItemRow
                  item={item}
                  mobile={mobile}
                  wish
                  fits={leftover > 0 && item.price != null && item.price <= leftover}
                  onToggle={() => onBuy(item)}
                  onOpen={() => onOpen(item)}
                  onSkip={() => onMove(item)}
                  onEdit={() => onEdit(item)}
                  onDelete={() => onDelete(item)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </LayoutGroup>
        {mobile && list.length > 0 && <p className="swipe-hint">Swipe right when you buy it · left to delete</p>}
      </div>
    </motion.div>
  );
}
