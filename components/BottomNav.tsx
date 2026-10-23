"use client";
import { motion } from "framer-motion";

type Tab = "list" | "wish" | "summary";

const icons: Record<Tab | "me", JSX.Element> = {
  list: <svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" /></svg>,
  wish: <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" /></svg>,
  summary: <svg viewBox="0 0 24 24"><path d="M5 20V11M12 20V5M19 20v-6" /></svg>,
  me: <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></svg>,
};

/** Phone navigation: tabs either side of the add button. */
export default function BottomNav({
  tab, onTab, onAdd, onProfile,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  onAdd: () => void;
  onProfile: () => void;
}) {
  const item = (t: Tab, label: string) => (
    <button className={tab === t ? "on" : ""} onClick={() => onTab(t)} aria-current={tab === t ? "page" : undefined}>
      {icons[t]}
      <span>{label}</span>
      {tab === t && <motion.i layoutId="nav-dot" className="nav-dot" />}
    </button>
  );
  return (
    <nav className="bottom-nav" aria-label="Sections">
      {item("list", "My list")}
      {item("wish", "Wishlist")}
      <motion.button className="fab" onClick={onAdd} whileTap={{ scale: 0.88 }} aria-label={tab === "wish" ? "Add a wish" : "Add item"} data-open-add>
        <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
      </motion.button>
      {item("summary", "Savings")}
      <button onClick={onProfile}>
        {icons.me}
        <span>Settings</span>
      </button>
    </nav>
  );
}
