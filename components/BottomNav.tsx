"use client";
import { motion } from "framer-motion";

type Tab = "list" | "summary";

/** Phone navigation: two tabs with the add button in the middle. */
export default function BottomNav({ tab, onTab, onAdd }: { tab: Tab; onTab: (t: Tab) => void; onAdd: () => void }) {
  return (
    <nav className="bottom-nav" aria-label="Sections">
      <button className={tab === "list" ? "on" : ""} onClick={() => onTab("list")} aria-current={tab === "list" ? "page" : undefined}>
        <svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" /></svg>
        <span>My list</span>
        {tab === "list" && <motion.i layoutId="nav-dot" className="nav-dot" />}
      </button>
      <motion.button className="fab" onClick={onAdd} whileTap={{ scale: 0.88 }} aria-label="Add item" data-open-add>
        <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
      </motion.button>
      <button className={tab === "summary" ? "on" : ""} onClick={() => onTab("summary")} aria-current={tab === "summary" ? "page" : undefined}>
        <svg viewBox="0 0 24 24"><path d="M5 20V11M12 20V5M19 20v-6" /></svg>
        <span>Savings</span>
        {tab === "summary" && <motion.i layoutId="nav-dot" className="nav-dot" />}
      </button>
    </nav>
  );
}
