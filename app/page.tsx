"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "framer-motion";
import type { Item, Budget } from "@/lib/db";
import { monthLabel, shiftMonth, tk } from "@/lib/format";
import { useMobile } from "@/lib/useMedia";
import AuthForm from "@/components/AuthForm";
import Header from "@/components/Header";
import MonthHeader from "@/components/MonthHeader";
import Overview from "@/components/Overview";
import Composer, { type NewItem } from "@/components/Composer";
import ItemRow from "@/components/ItemRow";
import ItemActions from "@/components/ItemActions";
import ItemModal from "@/components/ItemModal";
import PostponeModal from "@/components/PostponeModal";
import BudgetSheet from "@/components/BudgetSheet";
import LeftoverSheet from "@/components/LeftoverSheet";
import Summary from "@/components/Summary";
import ProfileModal from "@/components/ProfileModal";
import BottomNav from "@/components/BottomNav";
import Sheet from "@/components/Sheet";
import ThemeToggle from "@/components/ThemeToggle";
import { Toasts, useToasts } from "@/components/Toasts";
import LockScreen from "@/components/LockScreen";
import { AWAY_MS, getLock, saveLock, setWaitUntil } from "@/lib/applock";

type User = { name: string; email: string } | null;
type Section = "todo" | "done" | "skipped";
type Entry =
  | { kind: "head"; id: Section; title: string; count: number; total?: string }
  | { kind: "item"; item: Item };

const json = { "Content-Type": "application/json" };

export default function Home() {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [items, setItems] = useState<Item[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [current, setCurrent] = useState("");
  const [month, setMonth] = useState("");
  const [dir, setDir] = useState(1);
  const [tab, setTab] = useState<"list" | "summary">("list");
  const [editing, setEditing] = useState<Item | null>(null);
  const [postponing, setPostponing] = useState<Item | null>(null);
  const [actionsFor, setActionsFor] = useState<Item | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState<false | "budget" | "savings">(false);
  const [leftoverOpen, setLeftoverOpen] = useState(false);
  const [leftoverSet, setLeftoverSet] = useState<{ amount: number; asOf: string } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Section[]>([]);
  const [locked, setLocked] = useState(false);
  const mobile = useMobile();
  const { toasts, push, dismiss } = useToasts();
  const pendingDeletes = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const refresh = useCallback(async () => {
    const r = await fetch("/api/items");
    if (r.status === 401) return setUser(null);
    const d = await r.json();
    setItems(d.items);
    setBudgets(d.budgets ?? []);
    setLeftoverSet(d.leftover ?? null);
    setCurrent(d.current);
    setMonth((m) => m || d.current);
  }, []);

  // lockIt: an existing session opening the app asks for the PIN; a fresh log-in doesn't
  const boot = useCallback(async (lockIt = true) => {
    const me = await (await fetch("/api/auth/me")).json();
    if (me && lockIt && getLock(me.email)) setLocked(true);
    setUser(me);
    if (me) refresh();
  }, [refresh]);

  useEffect(() => { boot(); }, [boot]);

  // lock again when the app comes back after a minute away
  useEffect(() => {
    if (!user) return;
    let hiddenAt = 0;
    const onVis = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > AWAY_MS && getLock(user.email)) setLocked(true);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [user]);

  useEffect(() => {
    try { setCollapsed(JSON.parse(localStorage.getItem("collapsed") || "[]")); } catch {}
    // a delete still waiting for its undo window is sent when the page closes
    const flush = () => {
      pendingDeletes.current.forEach((t, id) => { clearTimeout(t); fetch(`/api/items/${id}`, { method: "DELETE", keepalive: true }); });
      pendingDeletes.current.clear();
    };
    addEventListener("pagehide", flush);
    return () => removeEventListener("pagehide", flush);
  }, []);

  useEffect(() => { document.body.classList.toggle("has-nav", !!user && mobile); }, [user, mobile]);

  const patch = async (id: string, body: object) => {
    setItems((all) => all.map((i) => (i.id === id ? { ...i, ...body } as Item : i)));
    const r = await fetch(`/api/items/${id}`, { method: "PATCH", headers: json, body: JSON.stringify(body) });
    const u = await r.json();
    setItems((all) => all.map((i) => (i.id === id ? u : i)));
  };

  const toggle = (item: Item) => {
    const toDone = item.status !== "done";
    patch(item.id, { status: toDone ? "done" : "pending" });
    const left = items.filter((i) => i.month === item.month && i.status === "pending" && i.id !== item.id).length;
    if (toDone && left === 0) push(`Everything on your ${monthLabel(item.month).split(" ")[0]} list is done 🎉`);
  };

  const add = async ({ title, price, mine }: NewItem) => {
    const r = await fetch("/api/items", { method: "POST", headers: json, body: JSON.stringify({ title, price, mine, month }) });
    const it = await r.json();
    setItems((all) => [...all, it]);
  };

  const remove = (item: Item) => {
    setItems((all) => all.filter((i) => i.id !== item.id));
    const t = setTimeout(() => {
      pendingDeletes.current.delete(item.id);
      fetch(`/api/items/${item.id}`, { method: "DELETE" });
    }, 5000);
    pendingDeletes.current.set(item.id, t);
    push(`Deleted “${item.title}”`, {
      label: "Undo",
      run: () => {
        clearTimeout(t);
        pendingDeletes.current.delete(item.id);
        setItems((all) => (all.some((i) => i.id === item.id) ? all : [...all, item].sort((a, b) => a.createdAt.localeCompare(b.createdAt))));
      },
    }, 5000);
  };

  const skip = (item: Item) => {
    if (item.status === "skipped") {
      patch(item.id, { status: "pending" });
      push(`“${item.title}” is back on the list`);
    } else setPostponing(item);
  };

  const saveBudget = async (v: { budget: number; savings: number }) => {
    setBudgetOpen(false);
    const r = await fetch("/api/budget", { method: "PUT", headers: json, body: JSON.stringify({ month, ...v }) });
    const row: Budget = await r.json();
    setBudgets((all) => [...all.filter((x) => x.month !== row.month), row]);
    push(`Budget saved for ${monthLabel(month)}`);
  };

  const saveLeftover = async (amount: number) => {
    setLeftoverOpen(false);
    const r = await fetch("/api/leftover", { method: "PUT", headers: json, body: JSON.stringify({ amount, asOf: month }) });
    if (r.ok) { setLeftoverSet(await r.json()); push("Left-over amount saved"); }
  };

  const resetLeftover = async () => {
    setLeftoverOpen(false);
    await fetch("/api/leftover", { method: "DELETE" });
    setLeftoverSet(null);
    push("Back to Looply's estimate");
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null); setItems([]); setBudgets([]); setMonth(""); setTab("list");
  };

  const go = (n: number) => { setDir(n); setMonth((m) => shiftMonth(m, n)); };

  const toggleSection = (s: Section) => {
    setCollapsed((c) => {
      const next = c.includes(s) ? c.filter((x) => x !== s) : [...c, s];
      try { localStorage.setItem("collapsed", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // A month without its own budget reuses the latest earlier month's numbers.
  const effective = (m: string) => {
    const own = budgets.find((x) => x.month === m);
    if (own) return { budget: own.budget, savings: own.savings, inherited: false };
    const prev = budgets.filter((x) => x.month < m).sort((a, b) => (a.month < b.month ? 1 : -1))[0];
    return { budget: prev?.budget ?? 0, savings: prev?.savings ?? 0, inherited: !!prev };
  };

  const list = useMemo(() => items.filter((i) => i.month === month), [items, month]);
  const todo = list.filter((i) => i.status === "pending");
  const done = list.filter((i) => i.status === "done");
  const skipped = list.filter((i) => i.status === "skipped");
  const isMine = (i: Item) => i.mine !== false;
  const sum = (xs: Item[]) => xs.reduce((s, i) => s + (i.price ?? 0), 0);
  const spent = sum(done.filter(isMine));
  const planned = sum(todo.filter(isMine));

  // Money left over from earlier months: budget − spent − saving goal for each month the user tracked.
  // If the user typed their own figure for some month, count from that figure onwards instead.
  const leftIn = (m: string) => {
    const e = effective(m);
    const tracked = budgets.some((b) => b.month === m) || items.some((i) => i.month === m);
    if (!e.budget || !tracked) return 0;
    return e.budget - sum(items.filter((i) => i.month === m && i.status === "done" && isMine(i))) - e.savings;
  };
  const leftBetween = (from: string, to: string) => {
    let t = 0;
    for (let m = from; m < to; m = shiftMonth(m, 1)) t += leftIn(m);
    return t;
  };
  const firstMonth = [...budgets.map((b) => b.month), ...items.map((i) => i.month)].reduce((a, b) => (a && a < b ? a : b), "");
  const leftoverEstimate = firstMonth && month ? leftBetween(firstMonth, month) : 0;
  const leftoverManual = !!leftoverSet && !!month && month >= leftoverSet.asOf;
  const leftover = leftoverManual ? leftoverSet!.amount + leftBetween(leftoverSet!.asOf, month) : leftoverEstimate;

  // One flat list (headers + rows) so a ticked item glides into its new section.
  const entries: Entry[] = [];
  const section = (id: Section, title: string, rows: Item[], total?: string) => {
    if (!rows.length) return;
    entries.push({ kind: "head", id, title, count: rows.length, total });
    if (!collapsed.includes(id)) rows.forEach((item) => entries.push({ kind: "item", item }));
  };
  section("todo", "To do", todo, planned ? `${tk(planned)} planned` : undefined);
  section("done", "Done", done, spent ? `${tk(spent)} spent` : undefined);
  section("skipped", "Not now", skipped);

  if (user === undefined) {
    return (
      <div className="splash">
        <motion.img src="/icons/icon-192.png" alt="" width={56} height={56} animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} />
      </div>
    );
  }
  if (!user) {
    return (
      <MotionConfig reducedMotion="user">
        <main className="auth-main">
          <ThemeToggle className="theme-float" />
          <AuthForm onDone={() => boot(false)} />
        </main>
      </MotionConfig>
    );
  }

  if (locked) {
    const cfg = getLock(user.email);
    if (cfg) {
      return (
        <MotionConfig reducedMotion="user">
          <main className="auth-main">
            <LockScreen
              name={user.name}
              config={cfg}
              onUnlock={() => setLocked(false)}
              onForgot={async () => { saveLock(user.email, null); setWaitUntil(0); setLocked(false); await logout(); }}
            />
          </main>
        </MotionConfig>
      );
    }
  }

  const eff = effective(month);
  const monthName = month ? monthLabel(month).split(" ")[0] : "";

  return (
    <MotionConfig reducedMotion="user">
      <main className="app">
        <Header user={user} tab={tab} onTab={setTab} onProfile={() => setProfileOpen(true)} onLogout={logout} />

        <AnimatePresence mode="wait" initial={false}>
          {tab === "summary" ? (
            <motion.div key="summary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <Summary items={items} budgets={budgets} current={current} effective={effective} />
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <MonthHeader
                month={month} current={current} dir={dir} name={user.name}
                done={done.length} total={todo.length + done.length}
                onPrev={() => go(-1)} onNext={() => go(1)}
                onToday={() => { setDir(month < current ? 1 : -1); setMonth(current); }}
              />

              <Overview
                budget={eff.budget} savings={eff.savings} inherited={eff.inherited}
                spent={spent} planned={planned}
                leftover={leftover} leftoverManual={leftoverManual}
                onEditBudget={() => setBudgetOpen("budget")}
                onEditSavings={() => setBudgetOpen("savings")}
                onEditLeftover={() => setLeftoverOpen(true)}
              />

              {!mobile && <Composer onAdd={add} />}

              <AnimatePresence mode="wait" initial={false} custom={dir}>
                <motion.div
                  key={month}
                  className="list"
                  initial={{ opacity: 0, x: dir * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir * -24 }}
                  transition={{ duration: 0.2 }}
                >
                  {list.length === 0 && (
                    <div className="empty">
                      <div className="empty-art" aria-hidden>
                        <svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" /></svg>
                      </div>
                      <b>Your {monthName} list is empty</b>
                      <p>Add things you plan to buy or do. Anything unfinished moves to next month on its own.</p>
                      {mobile && <button className="btn" onClick={() => setAddOpen(true)}>Add your first item</button>}
                    </div>
                  )}
                  <LayoutGroup>
                    <AnimatePresence initial={false} mode="popLayout">
                      {entries.map((e) =>
                        e.kind === "head" ? (
                          <motion.div key={`h-${e.id}`} layout="position" className="sec-head" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <button onClick={() => toggleSection(e.id)} aria-expanded={!collapsed.includes(e.id)}>
                              <motion.svg viewBox="0 0 24 24" animate={{ rotate: collapsed.includes(e.id) ? -90 : 0 }}><path d="M7 10l5 5 5-5" /></motion.svg>
                              <span>{e.title}</span>
                              <span className="count">{e.count}</span>
                            </button>
                            {e.total && <span className="sec-total">{e.total}</span>}
                          </motion.div>
                        ) : (
                          <motion.div
                            key={e.item.id}
                            layout
                            className="slot"
                            initial={{ opacity: 0, y: 12, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.18 } }}
                            transition={{ type: "spring", stiffness: 500, damping: 42 }}
                          >
                            <ItemRow
                              item={e.item}
                              mobile={mobile}
                              onToggle={() => toggle(e.item)}
                              onOpen={() => (mobile ? setActionsFor(e.item) : setEditing(e.item))}
                              onSkip={() => skip(e.item)}
                              onEdit={() => setEditing(e.item)}
                              onDelete={() => remove(e.item)}
                            />
                          </motion.div>
                        ),
                      )}
                    </AnimatePresence>
                  </LayoutGroup>
                  {mobile && list.length > 0 && <p className="swipe-hint">Swipe right to tick off · left to delete</p>}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {mobile && <BottomNav tab={tab} onTab={setTab} onAdd={() => { setTab("list"); setAddOpen(true); }} />}

        <AnimatePresence>
          {addOpen && (
            <Sheet key="add" title={`Add to ${monthName}`} onClose={() => setAddOpen(false)} size="sm">
              <Composer variant="sheet" onAdd={add} />
            </Sheet>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {actionsFor && (
            <ItemActions
              key="actions"
              item={actionsFor}
              onClose={() => setActionsFor(null)}
              onToggle={() => toggle(actionsFor)}
              onEdit={() => setEditing(actionsFor)}
              onSkip={() => skip(actionsFor)}
              onDelete={() => remove(actionsFor)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {budgetOpen && (
            <BudgetSheet key="budget" month={month} budget={eff.budget} savings={eff.savings} inherited={eff.inherited} focus={budgetOpen} onClose={() => setBudgetOpen(false)} onSave={saveBudget} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {leftoverOpen && (
            <LeftoverSheet
              key="leftover"
              month={month}
              value={leftover}
              estimate={leftoverEstimate}
              manual={leftoverManual}
              onClose={() => setLeftoverOpen(false)}
              onSave={saveLeftover}
              onReset={resetLeftover}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {postponing && (
            <PostponeModal
              key="postpone"
              item={postponing}
              current={current}
              onClose={() => setPostponing(null)}
              onConfirm={(m) => {
                patch(postponing.id, { status: "skipped", postponeTo: m });
                push(m ? `“${postponing.title}” moved to ${monthLabel(m)}` : `“${postponing.title}” parked`);
                setPostponing(null);
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {editing && (
            <ItemModal key="edit" item={editing} onClose={() => setEditing(null)} onSave={(p) => { patch(editing.id, p); setEditing(null); }} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {profileOpen && (
            <ProfileModal
              key="profile"
              user={user}
              onClose={() => setProfileOpen(false)}
              onNameChange={setUser}
              onDeleted={() => { setProfileOpen(false); setUser(null); setItems([]); setBudgets([]); setMonth(""); }}
            />
          )}
        </AnimatePresence>

        <Toasts toasts={toasts} dismiss={dismiss} />
      </main>
    </MotionConfig>
  );
}
