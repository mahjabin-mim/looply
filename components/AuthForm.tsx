"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Mode = "login" | "signup" | "forgot" | "reset";

export default function AuthForm({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [token, setToken] = useState("");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(location.search).get("reset");
    if (t) { setToken(t); setMode("reset"); }
  }, []);

  const go = (m: Mode) => { setMode(m); setErr(""); setMsg(""); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setMsg("");
    const body = mode === "reset" ? { token, password: f.password } : f;
    const r = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (!r.ok) return setErr((await r.json()).error || "Something went wrong");
    if (mode === "forgot") return setMsg("If that email has an account, a reset link is on its way.");
    if (mode === "reset") history.replaceState(null, "", "/");
    onDone();
  }

  const sub = { login: "Welcome back", signup: "Create your account", forgot: "Reset your password", reset: "Choose a new password" }[mode];
  const cta = { login: "Log in", signup: "Sign up", forgot: "Send reset link", reset: "Set new password" }[mode];

  return (
    <motion.form
      onSubmit={submit}
      className="glass auth"
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 140, damping: 16 }}
    >
      <h1 className="grad">Monthly List</h1>
      <p className="sub">{sub}</p>
      {mode === "signup" && (
        <motion.div className="field" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <label>Name</label>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Your name" />
        </motion.div>
      )}
      {mode !== "reset" && (
        <div className="field">
          <label>Email</label>
          <input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="you@example.com" />
        </div>
      )}
      {mode !== "forgot" && (
        <div className="field">
          <label>{mode === "reset" ? "New password" : "Password"}</label>
          <input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="At least 6 characters" />
        </div>
      )}
      {mode === "login" && (
        <div style={{ textAlign: "right", marginTop: -6, marginBottom: 12 }}>
          <button type="button" className="link" onClick={() => go("forgot")}>Forgot password?</button>
        </div>
      )}
      {err && <motion.div className="error" initial={{ x: -8 }} animate={{ x: [0, -8, 8, -4, 0] }}>{err}</motion.div>}
      {msg && <motion.div className="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{msg}</motion.div>}
      <button className="btn" style={{ width: "100%" }} disabled={busy}>{busy ? "..." : cta}</button>
      <div className="switch">
        {mode === "login" ? "New here?" : mode === "signup" ? "Already have an account?" : "Remembered it?"}
        <button type="button" onClick={() => go(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Sign up" : "Log in"}
        </button>
      </div>
    </motion.form>
  );
}
