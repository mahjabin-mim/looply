"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { type LockConfig, MAX_TRIES, bioVerify, checkPin, setWaitUntil, waitUntil } from "@/lib/applock";
import { bioName, isApple } from "@/lib/platform";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "bio", "0", "del"] as const;

export default function LockScreen({
  name, config, onUnlock, onForgot,
}: {
  name: string;
  config: LockConfig;
  onUnlock: () => void;
  onForgot: () => void;
}) {
  const [pin, setPin] = useState("");
  // refs, so fast typing never reads a stale PIN between renders
  const pinRef = useRef("");
  const triesRef = useRef(0);
  const [msg, setMsg] = useState("");
  const [now, setNow] = useState(Date.now());
  const shake = useAnimationControls();
  const triedBio = useRef(false);
  const busy = useRef(false);
  const waiting = waitUntil() > now;

  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [waiting]);

  const [apple, setApple] = useState(false);
  useEffect(() => setApple(isApple()), []);

  // quiet: an automatic attempt that the phone declines shouldn't show an error
  const bio = useCallback(async (quiet = false) => {
    if (!config.bio) return;
    if (await bioVerify(config.bio)) onUnlock();
    else if (!quiet) setMsg(`${bioName()[0].toUpperCase()}${bioName().slice(1)} didn't work — use your PIN`);
  }, [config.bio, onUnlock]);

  // Android can ask for the fingerprint straight away; iPhone/iPad only allow Face ID after a tap
  useEffect(() => {
    if (config.bio && !triedBio.current && !isApple()) { triedBio.current = true; bio(true); }
  }, [config.bio, bio]);

  const press = useCallback(async (k: string) => {
    if (busy.current || waitUntil() > Date.now()) return;
    if (k === "bio") return bio();
    if (k === "del") { pinRef.current = pinRef.current.slice(0, -1); setPin(pinRef.current); return; }
    const next = (pinRef.current + k).slice(0, config.len);
    pinRef.current = next;
    setPin(next);
    setMsg("");
    if (next.length < config.len) return;
    busy.current = true;
    if (await checkPin(config, next)) {
      setWaitUntil(0);
      onUnlock();
    } else {
      const t = ++triesRef.current;
      await shake.start({ x: [0, -14, 14, -9, 9, -4, 0], transition: { duration: 0.42 } });
      pinRef.current = "";
      setPin("");
      if (t >= MAX_TRIES) { setWaitUntil(Date.now() + 30_000); triesRef.current = 0; setNow(Date.now()); setMsg(""); }
      else setMsg(`Wrong PIN · ${MAX_TRIES - t} ${MAX_TRIES - t === 1 ? "try" : "tries"} left`);
    }
    busy.current = false;
  }, [config, bio, onUnlock, shake]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("del");
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [press]);

  const secs = Math.max(0, Math.ceil((waitUntil() - now) / 1000));

  return (
    <motion.div className="lock" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.25 }}>
      <div className="lock-top">
        <img src="/icons/icon-192.png" alt="" width={56} height={56} />
        <h2>Hi, {name.split(/\s+/)[0]}</h2>
        <p>{waiting ? `Too many tries. Wait ${secs}s` : "Enter your PIN to open Looply"}</p>
        <motion.div className="pin-dots" animate={shake} aria-label={`${pin.length} of ${config.len} digits entered`}>
          {Array.from({ length: config.len }, (_, i) => (
            <motion.i key={i} className={i < pin.length ? "on" : ""} animate={{ scale: i === pin.length - 1 ? [1, 1.35, 1] : 1 }} transition={{ duration: 0.18 }} />
          ))}
        </motion.div>
        <p className="lock-msg" aria-live="polite">{msg}</p>
      </div>

      <div className="keypad">
        {KEYS.map((k) =>
          k === "bio" ? (
            config.bio ? (
              <button key={k} className="key key-icon" onClick={() => press("bio")} aria-label={`Use ${apple ? "Face ID / Touch ID" : "fingerprint"}`}>
                {apple ? (
                  <svg viewBox="0 0 24 24"><path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2M9 9.5v1M15 9.5v1M12 9.5v4h-1M9.5 16a3.5 3.5 0 005 0" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24"><path d="M7.5 4.5A9 9 0 0121 12M3.5 9A9 9 0 003 12c0 2 .4 3.8 1 5.2M12 7a5 5 0 015 5c0 3-.6 5.5-1.6 7.6M7.4 9.6A5 5 0 007 12c0 2.6-.4 4.6-1.3 6.4M12 11v1.5c0 3.3-.8 6-2 8" /></svg>
                )}
              </button>
            ) : <span key={k} />
          ) : k === "del" ? (
            <button key={k} className="key key-icon" onClick={() => press("del")} aria-label="Delete digit">
              <svg viewBox="0 0 24 24"><path d="M9 5h11v14H9l-6-7z" /><path d="M12.5 9.5l5 5M17.5 9.5l-5 5" /></svg>
            </button>
          ) : (
            <motion.button key={k} className="key" whileTap={{ scale: 0.88 }} onClick={() => press(k)} disabled={waiting}>{k}</motion.button>
          ),
        )}
      </div>

      {config.bio && apple && (
        <button className="chip-btn" onClick={() => press("bio")}>Use Face ID / Touch ID</button>
      )}
      <button className="link lock-forgot" onClick={onForgot}>Forgot PIN? Log out</button>
    </motion.div>
  );
}
