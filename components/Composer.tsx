"use client";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { parseSpoken, useVoice } from "@/lib/voice";

export type NewItem = { title: string; price: string; mine: boolean };

/** Add-item form: one row on desktop, stacked inside the add sheet on phones. */
export default function Composer({
  onAdd, variant = "inline", placeholder = "Add something to buy or do…",
}: {
  onAdd: (v: NewItem) => Promise<void>;
  variant?: "inline" | "sheet";
  placeholder?: string;
}) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [mine, setMine] = useState(true);
  const [added, setAdded] = useState<string[]>([]);
  const titleRef = useRef<HTMLInputElement>(null);
  const voice = useVoice((text) => {
    const s = parseSpoken(text);
    setTitle(s.title);
    if (s.price) setPrice(s.price);
    if (!s.mine) setMine(false);
  });

  const mic = voice.supported && (
    <button
      type="button"
      className={`mic ${voice.listening ? "on" : ""}`}
      onClick={() => (voice.listening ? voice.stop() : voice.start())}
      aria-label={voice.listening ? "Stop listening" : "Add by voice"}
      title={voice.listening ? "Listening… tap to stop" : "Add by voice — say “Groceries 500”"}
      data-mic
    >
      {voice.listening && <motion.span className="mic-ring" initial={{ scale: 0.8, opacity: 0.7 }} animate={{ scale: 1.9, opacity: 0 }} transition={{ repeat: Infinity, duration: 1.1 }} />}
      <svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" /></svg>
    </button>
  );
  const voiceNote = (
    <AnimatePresence>
      {(voice.listening || voice.error) && (
        <motion.p className={`fine voice-note ${voice.error ? "err" : ""}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
          {voice.error || "Listening… say something like “Groceries 500”"}
        </motion.p>
      )}
    </AnimatePresence>
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    const sent = { title: t, price, mine };
    // clear straight away so the next item can be typed while this one saves
    setTitle(""); setPrice(""); setMine(true);
    titleRef.current?.focus();
    try {
      await onAdd(sent);
      setAdded((a) => [t, ...a].slice(0, 3));
    } catch {
      // put it back if saving failed (unless something new was typed meanwhile)
      setTitle((cur) => cur || sent.title);
      setPrice((cur) => cur || sent.price);
      setMine(sent.mine);
    }
  }

  const notMine = (
    <label className="toggle" title="Not my money">
      <input type="checkbox" checked={!mine} onChange={(e) => setMine(!e.target.checked)} />
      <span className="toggle-ui" aria-hidden />
      <span>{variant === "sheet" ? "Not my money" : "Not mine"}</span>
    </label>
  );

  if (variant === "sheet") {
    return (
      <form className="composer-sheet" onSubmit={submit}>
        <div className="field">
          <label htmlFor="new-title">What do you want to buy or do?</label>
          <div className="with-mic">
            <input id="new-title" ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Groceries, pay rent…" autoFocus enterKeyHint="next" />
            {mic}
          </div>
          {voiceNote}
        </div>
        <div className="field">
          <label htmlFor="new-price">Price (optional)</label>
          <div className="money-input">
            <span>৳</span>
            <input id="new-price" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value)} enterKeyHint="done" />
          </div>
        </div>
        {notMine}
        <AnimatePresence>
          {added.length > 0 && (
            <motion.p className="fine added" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              Added: {added.join(", ")}
            </motion.p>
          )}
        </AnimatePresence>
        <button className="btn btn-block" disabled={!title.trim()}>Add to list</button>
      </form>
    );
  }

  return (
    <form className="card composer" onSubmit={submit}>
      <div className="composer-title">
        <svg viewBox="0 0 24 24" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
        <input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={voice.listening ? "Listening…" : placeholder} aria-label="New item" />
        {mic}
      </div>
      <div className="money-input composer-price">
        <span>৳</span>
        <input type="number" min="0" step="0.01" inputMode="decimal" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} aria-label="Price" />
      </div>
      {notMine}
      <button className="btn" disabled={!title.trim()}>Add</button>
      {voice.error && <p className="fine voice-note err composer-err">{voice.error}</p>}
    </form>
  );
}
