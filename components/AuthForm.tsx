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
  const [google, setGoogle] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const t = q.get("reset");
    if (t) { setToken(t); setMode("reset"); }
    const e = q.get("autherror");
    if (e) { setErr(e); history.replaceState(null, "", "/"); }
    fetch("/api/auth/providers").then((r) => r.json()).then((p) => setGoogle(!!p.google)).catch(() => {});
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
      {google && (mode === "login" || mode === "signup") && (
        <>
          <div className="or"><span>or</span></div>
          <a className="gbtn" href="/api/auth/google">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/>
              <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.9-6.1z"/>
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
            </svg>
            Continue with Google
          </a>
        </>
      )}
      <div className="switch">
        {mode === "login" ? "New here?" : mode === "signup" ? "Already have an account?" : "Remembered it?"}
        <button type="button" onClick={() => go(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Sign up" : "Log in"}
        </button>
      </div>
    </motion.form>
  );
}
