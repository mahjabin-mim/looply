"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ThemeToggle from "./ThemeToggle";

type User = { name: string; email: string };
type Tab = "list" | "wish" | "summary";

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";

export function Brand() {
  return (
    <div className="brand">
      <img src="/icons/icon-192.png" alt="" width={32} height={32} />
      <span>Looply</span>
    </div>
  );
}

export default function Header({
  user, tab, onTab, onProfile, onLogout,
}: {
  user: User;
  tab: Tab;
  onTab: (t: Tab) => void;
  onProfile: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("pointerdown", away);
    addEventListener("keydown", esc);
    return () => { removeEventListener("pointerdown", away); removeEventListener("keydown", esc); };
  }, [open]);

  return (
    <header className="topbar">
      <Brand />

      <nav className="tabs" aria-label="Sections">
        {(["list", "wish", "summary"] as const).map((t) => (
          <button key={t} className={tab === t ? "on" : ""} onClick={() => onTab(t)} aria-current={tab === t ? "page" : undefined}>
            {tab === t && <motion.span layoutId="tab-pill" className="pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className="lbl">
              {t === "list" ? "My list" : t === "wish" ? "Wishlist" : <><span className="lbl-long">Savings & spending</span><span className="lbl-short">Savings</span></>}
            </span>
          </button>
        ))}
      </nav>

      <div className="top-actions">
        <ThemeToggle />
        <div className="menu-wrap" ref={box}>
          <button className="avatar-btn" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} data-open-menu>
            <span className="avatar">{initials(user.name)}</span>
            <span className="avatar-name">{user.name}</span>
            <svg className="chev" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" /></svg>
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                className="menu"
                role="menu"
                initial={{ opacity: 0, scale: 0.92, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.16 }}
              >
                <div className="menu-head">
                  <b>{user.name}</b>
                  <span>{user.email}</span>
                </div>
                <button role="menuitem" onClick={() => { setOpen(false); onProfile(); }} data-open-profile>
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></svg>
                  Profile & settings
                </button>
                <a role="menuitem" href="/api/export?format=xlsx" onClick={() => setOpen(false)}>
                  <svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
                  Export to Excel
                </a>
                <div className="menu-sep" />
                <button role="menuitem" className="danger-text" onClick={() => { setOpen(false); onLogout(); }}>
                  <svg viewBox="0 0 24 24"><path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l5-5-5-5M15 12H3" /></svg>
                  Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
