"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function PasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const r = await fetch("/api/auth/change", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current, password }) });
    if (r.ok) { setDone(true); setTimeout(onClose, 1200); }
    else setErr((await r.json()).error || "Something went wrong");
  }

  return (
    <motion.div className="overlay" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.form
        className="glass modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.94 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
      >
        <h3>Change password</h3>
        <div className="field"><label>Current password <span style={{ opacity: 0.7 }}>(leave empty if you signed in with Google)</span></label><input type="password" autoFocus value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
        <div className="field"><label>New password</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" /></div>
        {err && <div className="error">{err}</div>}
        {done && <div className="ok">Password updated ✓</div>}
        <div className="actions">
          <button type="button" className="ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={done}>Update</button>
        </div>
      </motion.form>
    </motion.div>
  );
}
