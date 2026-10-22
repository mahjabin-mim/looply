"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useShowApk } from "@/lib/useShowApk";

type Mode = "login" | "signup" | "forgot" | "reset";

export default function AuthForm({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [token, setToken] = useState("");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [google, setGoogle] = useState(false);
  const showApk = useShowApk();

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

  const features = [
    { t: "A list for every month", d: "Tick things off as you buy or do them." },
    { t: "Nothing gets lost", d: "Unfinished items roll into next month on their own." },
    { t: "Know what's left", d: "Budget, savings goal and spending at a glance." },
  ];

  return (
    <div className="auth-shell">
      <motion.aside className="auth-hero" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
        <div className="brand">
          <img src="/icons/icon-192.png" alt="" width={36} height={36} />
          <span>Looply</span>
        </div>
        <h1>Plan the month.<br />Keep what&apos;s left.</h1>
        <ul className="auth-features">
          {features.map((x, i) => (
            <motion.li key={x.t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }}>
              <span className="feat-check"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
              <span><b>{x.t}</b><small>{x.d}</small></span>
            </motion.li>
          ))}
        </ul>
      </motion.aside>

      <motion.form
        onSubmit={submit}
        className="card auth-card"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 20 }}
      >
        <h2>{sub}</h2>
        <p className="fine auth-lead">
          {mode === "login" ? "Log in to see this month's list." : mode === "signup" ? "It takes less than a minute." : mode === "forgot" ? "We'll email you a link to set a new one." : "Pick something you'll remember."}
        </p>
        {mode === "signup" && (
          <motion.div className="field" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
            <label htmlFor="au-name">Name</label>
            <input id="au-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Your name" autoComplete="name" />
          </motion.div>
        )}
        {mode !== "reset" && (
          <div className="field">
            <label htmlFor="au-email">Email</label>
            <input id="au-email" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="you@example.com" autoComplete="email" />
          </div>
        )}
        {mode !== "forgot" && (
          <div className="field">
            <div className="label-row">
              <label htmlFor="au-pw">{mode === "reset" ? "New password" : "Password"}</label>
              {mode === "login" && <button type="button" className="link" onClick={() => go("forgot")}>Forgot password?</button>}
            </div>
            <input id="au-pw" type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="At least 6 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </div>
        )}
        {err && <motion.div className="error" initial={{ x: -8 }} animate={{ x: [0, -8, 8, -4, 0] }}>{err}</motion.div>}
        {msg && <motion.div className="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{msg}</motion.div>}
        <button className="btn btn-block" disabled={busy}>{busy ? "Please wait…" : cta}</button>
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
            {mode === "login" ? "Create an account" : "Log in"}
          </button>
        </div>
        {showApk && (
          <div className="apk">
            <a href="/Looply.apk" download>
              <svg viewBox="0 0 24 24" aria-hidden><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
              Get the Android app
            </a>
          </div>
        )}
      </motion.form>
    </div>
  );
}
