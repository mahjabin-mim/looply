"use client";
import { useEffect, useState } from "react";

const toKey = (b64: string) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

type State = "loading" | "unsupported" | "ios" | "unavailable" | "denied" | "off" | "on";

export default function Reminders() {
  const [state, setState] = useState<State>("loading");
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const ua = navigator.userAgent;
      const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
      if (/iphone|ipad|ipod/i.test(ua) && !standalone) return setState("ios");
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState("unsupported");
      const info = await fetch("/api/push/subscribe").then((r) => r.json()).catch(() => null);
      if (!info?.available) return setState("unavailable");
      setKey(info.publicKey);
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return setState("unavailable"); // service worker only runs on the live (production) site
      if (Notification.permission === "denied") return setState("denied");
      setState((await reg.pushManager.getSubscription()) ? "on" : "off");
    })();
  }, []);

  async function enable() {
    setBusy(true); setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setState("denied"); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(key) });
      const r = await fetch("/api/push/subscribe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      });
      if (!r.ok) throw new Error();
      setState("on");
    } catch { setMsg("Couldn't turn reminders on. Please try again."); }
    finally { setBusy(false); }
  }

  async function disable() {
    setBusy(true); setMsg("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setState("off");
    } finally { setBusy(false); }
  }

  async function test() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/push/test", { method: "POST" });
    const d = await r.json();
    setMsg(r.ok ? (d.sent ? "Test sent — check your notifications." : "Nothing was delivered. Try turning reminders off and on.") : d.error || "Failed");
    setBusy(false);
  }

  const text: Record<State, string> = {
    loading: "Checking…",
    unsupported: "This browser doesn't support notifications.",
    ios: "On iPhone: first tap Share → Add to Home Screen, then open Looply from the home screen and turn reminders on here.",
    unavailable: "Reminders work on the live, installed app (not on a local test copy).",
    denied: "Notifications are blocked. Allow them in your browser or phone settings, then come back.",
    off: "Get a reminder in the last 3 days of the month if items are still pending.",
    on: "Reminders are on for this device.",
  };

  return (
    <div>
      <h4 style={{ margin: "0 0 8px" }}>Reminders</h4>
      <p className="hint" style={{ margin: "0 0 12px" }}>{text[state]}</p>
      {state === "off" && <button className="btn" onClick={enable} disabled={busy}>Turn on reminders</button>}
      {state === "on" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ghost" onClick={test} disabled={busy}>Send test</button>
          <button className="ghost" onClick={disable} disabled={busy}>Turn off</button>
        </div>
      )}
      {msg && <div className={msg.startsWith("Test") ? "ok" : "error"} style={{ marginTop: 10 }}>{msg}</div>}
    </div>
  );
}
