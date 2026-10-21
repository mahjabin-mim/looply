"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function AuthForm({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    setBusy(false);
    if (r.ok) onDone();
    else setErr((await r.json()).error || "Something went wrong");
  }

  return (
    <motion.form
      onSubmit={submit}
      className="glass auth"
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 140, damping: 16 }}
    >
      <h1 className="grad">Monthly List</h1>
      <p className="sub">{mode === "login" ? "Welcome back" : "Create your account"}</p>
      {mode === "signup" && (
        <motion.div className="field" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <label>Name</label>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Your name" />
        </motion.div>
      )}
      <div className="field">
        <label>Email</label>
        <input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="you@example.com" />
      </div>
      <div className="field">
        <label>Password</label>
        <input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="At least 6 characters" />
      </div>
      {err && <motion.div className="error" initial={{ x: -8 }} animate={{ x: [0, -8, 8, -4, 0] }}>{err}</motion.div>}
      <button className="btn" style={{ width: "100%" }} disabled={busy}>
        {busy ? "..." : mode === "login" ? "Log in" : "Sign up"}
      </button>
      <div className="switch">
        {mode === "login" ? "New here?" : "Already have an account?"}
        <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }}>
          {mode === "login" ? "Sign up" : "Log in"}
        </button>
      </div>
    </motion.form>
  );
}
