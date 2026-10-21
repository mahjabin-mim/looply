"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Item } from "@/lib/db";
import AuthForm from "@/components/AuthForm";
import ItemRow from "@/components/ItemRow";
import ItemModal from "@/components/ItemModal";
import PasswordModal from "@/components/PasswordModal";
import ThemeToggle from "@/components/ThemeToggle";

type User = { name: string; email: string } | null;

const shift = (m: string, n: number) => {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const label = (m: string) => new Date(m + "-01T00:00").toLocaleString("en", { month: "long", year: "numeric" });

export default function Home() {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [items, setItems] = useState<Item[]>([]);
  const [current, setCurrent] = useState("");
  const [month, setMonth] = useState("");
  const [dir, setDir] = useState(1);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [editing, setEditing] = useState<Item | null>(null);
  const [pwOpen, setPwOpen] = useState(false);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/items");
    if (r.status === 401) return setUser(null);
    const d = await r.json();
    setItems(d.items);
    setCurrent(d.current);
    setMonth((m) => m || d.current);
  }, []);

  const boot = useCallback(async () => {
    const me = await (await fetch("/api/auth/me")).json();
    setUser(me);
    if (me) refresh();
  }, [refresh]);

  useEffect(() => { boot(); }, [boot]);

  const patch = async (id: string, body: object) => {
    setItems((all) => all.map((i) => (i.id === id ? { ...i, ...body } as Item : i)));
    const r = await fetch(`/api/items/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const u = await r.json();
    setItems((all) => all.map((i) => (i.id === id ? u : i)));
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const r = await fetch("/api/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, price, month }) });
    const it = await r.json();
    setItems((all) => [...all, it]);
    setTitle("");
    setPrice("");
  };

  const remove = async (id: string) => {
    setItems((all) => all.filter((i) => i.id !== id));
    await fetch(`/api/items/${id}`, { method: "DELETE" });
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null); setItems([]); setMonth("");
  };

  const go = (n: number) => { setDir(n); setMonth((m) => shift(m, n)); };

  const list = useMemo(() => items.filter((i) => i.month === month), [items, month]);
  const todo = list.filter((i) => i.status === "pending");
  const done = list.filter((i) => i.status === "done");
  const skipped = list.filter((i) => i.status === "skipped");
  const active = todo.length + done.length;
  const pct = active ? Math.round((done.length / active) * 100) : 0;
  const spent = done.reduce((s, i) => s + (i.price ?? 0), 0);
  const planned = todo.reduce((s, i) => s + (i.price ?? 0), 0);

  if (user === undefined) return null;
  if (!user) return <main><ThemeToggle className="theme-float" /><AuthForm onDone={boot} /></main>;

  const row = (i: Item) => (
    <ItemRow
      key={i.id}
      item={i}
      onToggle={() => patch(i.id, { status: i.status === "done" ? "pending" : "done" })}
      onSkip={() => patch(i.id, { status: i.status === "skipped" ? "pending" : "skipped" })}
      onEdit={() => setEditing(i)}
      onDelete={() => remove(i.id)}
    />
  );

  return (
    <main>
      <motion.div className="topbar" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="grad">Monthly List</h1>
        <div className="who">
          <ThemeToggle />
          <span>Hi, {user.name}</span>
          <button className="ghost" onClick={() => setPwOpen(true)}>Password</button>
          <button className="ghost" onClick={logout}>Log out</button>
        </div>
      </motion.div>

      <div className="glass monthbar">
        <button className="ghost" onClick={() => go(-1)}>←</button>
        <div style={{ textAlign: "center", overflow: "hidden" }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.h2
              key={month}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.18 }}
            >
              {month && label(month)}
            </motion.h2>
          </AnimatePresence>
          {month !== current && current && (
            <button className="ghost" style={{ padding: "2px 10px", fontSize: "0.75rem" }} onClick={() => { setDir(month < current ? 1 : -1); setMonth(current); }}>
              Jump to this month
            </button>
          )}
        </div>
        <button className="ghost" onClick={() => go(1)}>→</button>
      </div>

      <div className="stats">
        <div className="glass stat"><b>{done.length}/{active}</b><span>done</span></div>
        <div className="glass stat"><b>৳{spent.toFixed(2)}</b><span>spent</span></div>
        <div className="glass stat"><b>৳{planned.toFixed(2)}</b><span>still planned</span></div>
      </div>
      <div className="progress">
        <motion.div initial={false} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 90, damping: 18 }} />
      </div>

      <form className="glass addrow" onSubmit={add}>
        <input placeholder="What do you want to do or buy?" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="more" type="number" step="0.01" min="0" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
        <button className="btn">Add</button>
      </form>

      <AnimatePresence mode="wait">
        <motion.div key={month} initial={{ opacity: 0, x: dir * 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {list.length === 0 && <div className="empty">Nothing here yet. Add your first item ✨</div>}
          {todo.length > 0 && <div className="section-title">To do · {todo.length}</div>}
          <AnimatePresence initial={false}>{todo.map(row)}</AnimatePresence>
          {done.length > 0 && <div className="section-title">Done · {done.length}</div>}
          <AnimatePresence initial={false}>{done.map(row)}</AnimatePresence>
          {skipped.length > 0 && <div className="section-title">Not now · {skipped.length}</div>}
          <AnimatePresence initial={false}>{skipped.map(row)}</AnimatePresence>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>{pwOpen && <PasswordModal onClose={() => setPwOpen(false)} />}</AnimatePresence>

      <AnimatePresence>
        {editing && (
          <ItemModal
            key={editing.id}
            item={editing}
            onClose={() => setEditing(null)}
            onSave={(p) => { patch(editing.id, p); setEditing(null); }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
