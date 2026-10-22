"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Reminders from "./Reminders";
import Sheet from "./Sheet";
import { useShowApk } from "@/lib/useShowApk";

type User = { name: string; email: string };

const post = (url: string, method: string, body: object) =>
  fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export default function ProfileModal({
  user, onClose, onNameChange, onDeleted,
}: {
  user: User;
  onClose: () => void;
  onNameChange: (u: User) => void;
  onDeleted: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const showApk = useShowApk();
  const [delOpen, setDelOpen] = useState(false);
  const [delPw, setDelPw] = useState("");
  const [delErr, setDelErr] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    const r = await post("/api/auth/profile", "PATCH", { name });
    const d = await r.json();
    if (r.ok) { onNameChange(d); setNameMsg({ ok: true, text: "Name updated ✓" }); }
    else setNameMsg({ ok: false, text: d.error || "Something went wrong" });
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setPwMsg({ ok: false, text: "Passwords don't match" });
    const r = await post("/api/auth/change", "POST", { current, password });
    if (r.ok) {
      setPwMsg({ ok: true, text: "Password updated ✓" });
      setCurrent(""); setPassword(""); setConfirm("");
    } else setPwMsg({ ok: false, text: (await r.json()).error || "Something went wrong" });
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDelErr("");
    const r = await post("/api/auth/account", "DELETE", { password: delPw, confirm: delPw });
    if (r.ok) onDeleted();
    else setDelErr((await r.json()).error || "Something went wrong");
  }

  const note = (m: { ok: boolean; text: string } | null) =>
    m && <motion.div className={m.ok ? "ok" : "error"} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>{m.text}</motion.div>;

  return (
    <Sheet title="Profile & settings" onClose={onClose}>
      <section className="set-section">
        <h4>Account</h4>
        <form onSubmit={saveName}>
          <div className="field"><label htmlFor="pf-email">Email</label><input id="pf-email" value={user.email} disabled /></div>
          <div className="field"><label htmlFor="pf-name">Display name</label><input id="pf-name" value={name} maxLength={50} onChange={(e) => { setName(e.target.value); setNameMsg(null); }} required /></div>
          {note(nameMsg)}
          <div className="actions"><button className="btn" disabled={name.trim() === user.name}>Save name</button></div>
        </form>
      </section>

      <section className="set-section">
        <h4>Change password</h4>
        <form onSubmit={savePassword}>
          <div className="field"><label htmlFor="pf-cur">Current password <span className="muted">(leave empty if you signed in with Google)</span></label><input id="pf-cur" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
          <div className="field"><label htmlFor="pf-new">New password</label><input id="pf-new" type="password" required value={password} onChange={(e) => { setPassword(e.target.value); setPwMsg(null); }} placeholder="At least 6 characters" /></div>
          <div className="field"><label htmlFor="pf-conf">Confirm new password</label><input id="pf-conf" type="password" required value={confirm} onChange={(e) => { setConfirm(e.target.value); setPwMsg(null); }} /></div>
          {note(pwMsg)}
          <div className="actions"><button className="btn">Update password</button></div>
        </form>
      </section>

      <section className="set-section">
        <Reminders />
      </section>

      <section className="set-section">
        <h4>Your data</h4>
        <p className="fine">Download everything you&apos;ve added.</p>
        <div className="btn-row">
          <a className="btn-ghost" href="/api/export?format=xlsx">Excel (.xlsx)</a>
          <a className="btn-ghost" href="/api/export?format=csv">CSV</a>
          {showApk && <a className="btn-ghost" href="/Looply.apk" download>Android app (APK)</a>}
        </div>
        {showApk && <p className="fine">The Android app needs Android 7.0 or newer. Open the file and allow installing from this source.</p>}
      </section>

      <section className="set-section danger-zone">
        <h4>Delete account</h4>
        {!delOpen ? (
          <>
            <p className="fine">Permanently removes your account, items and budgets. This can&apos;t be undone.</p>
            <button type="button" className="btn-danger" onClick={() => setDelOpen(true)}>Delete my account…</button>
          </>
        ) : (
          <form onSubmit={deleteAccount}>
            <div className="field">
              <label htmlFor="pf-del">Type your password to confirm <span className="muted">(Google-only accounts: type DELETE)</span></label>
              <input id="pf-del" type="password" required value={delPw} onChange={(e) => { setDelPw(e.target.value); setDelErr(""); }} />
            </div>
            {delErr && <div className="error">{delErr}</div>}
            <div className="actions">
              <button type="button" className="btn-ghost" onClick={() => { setDelOpen(false); setDelPw(""); }}>Cancel</button>
              <button className="btn-danger solid">Delete forever</button>
            </div>
          </form>
        )}
      </section>
    </Sheet>
  );
}
