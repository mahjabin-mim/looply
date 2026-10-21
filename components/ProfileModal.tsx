"use client";
import { useState } from "react";
import { motion } from "framer-motion";

type User = { name: string; email: string };

const post = (url: string, method: string, body: object) =>
  fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export default function ProfileModal({
  user, onClose, onNameChange,
}: {
  user: User;
  onClose: () => void;
  onNameChange: (u: User) => void;
}) {
  const [name, setName] = useState(user.name);
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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

  const note = (m: { ok: boolean; text: string } | null) =>
    m && <motion.div className={m.ok ? "ok" : "error"} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>{m.text}</motion.div>;

  return (
    <motion.div className="overlay" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="glass modal"
        style={{ maxHeight: "92vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.94 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
      >
        <h3>Your profile</h3>

        <form onSubmit={saveName}>
          <div className="field"><label>Email</label><input value={user.email} disabled /></div>
          <div className="field"><label>Display name</label><input value={name} maxLength={50} onChange={(e) => { setName(e.target.value); setNameMsg(null); }} required /></div>
          {note(nameMsg)}
          <div className="actions" style={{ marginTop: 6 }}><button className="btn" disabled={name.trim() === user.name}>Save name</button></div>
        </form>

        <hr className="sep" />

        <form onSubmit={savePassword}>
          <h4 style={{ margin: "0 0 12px" }}>Change password</h4>
          <div className="field"><label>Current password <span style={{ opacity: 0.7 }}>(leave empty if you signed in with Google)</span></label><input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
          <div className="field"><label>New password</label><input type="password" required value={password} onChange={(e) => { setPassword(e.target.value); setPwMsg(null); }} placeholder="At least 6 characters" /></div>
          <div className="field"><label>Confirm new password</label><input type="password" required value={confirm} onChange={(e) => { setConfirm(e.target.value); setPwMsg(null); }} /></div>
          {note(pwMsg)}
          <div className="actions" style={{ marginTop: 6 }}>
            <button type="button" className="ghost" onClick={onClose}>Close</button>
            <button className="btn">Update password</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
