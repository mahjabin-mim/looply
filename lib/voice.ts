"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type Spoken = { title: string; price: string; mine: boolean };

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const toLatin = (s: string) => s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

/**
 * Turn what was said into an item: "Groceries 500 taka" → { title: "Groceries", price: "500" }.
 * Understands 12k / 12 thousand / 1.5 lakh, Bangla digits, and "not mine".
 */
export function parseSpoken(raw: string): Spoken {
  let text = toLatin(raw).trim();
  let mine = true;
  if (/\bnot (mine|my money)\b/i.test(text) || /আমার না/.test(text)) {
    mine = false;
    text = text.replace(/\bnot (mine|my money)\b/gi, "").replace(/আমার না/g, "");
  }

  let price = "";
  const re = /(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|lakh|lac|hajar|হাজার|লাখ)?\b/gi;
  let last: RegExpExecArray | null = null;
  for (let m = re.exec(text); m; m = re.exec(text)) last = m;
  if (last) {
    let n = parseFloat(last[1].replace(/,/g, ""));
    const unit = (last[2] || "").toLowerCase();
    if (unit === "k" || unit === "thousand" || unit === "hajar" || unit === "হাজার") n *= 1000;
    if (unit === "lakh" || unit === "lac" || unit === "লাখ") n *= 100000;
    if (Number.isFinite(n)) price = String(Math.round(n * 100) / 100);
    text = text.slice(0, last.index) + text.slice(last.index + last[0].length);
  }

  const title = text
    .replace(/\b(taka|tk|takas|rupees?|bdt|for|at|cost(s|ing)?|price|add|buy)\b/gi, " ")
    .replace(/টাকা|৳/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[,.\-–\s]+|[,.\-–\s]+$/g, "");
  // capitalise "groceries" but leave words like "iPhone" alone
  return { title: /^[a-z][a-z]/.test(title) ? title[0].toUpperCase() + title.slice(1) : title, price, mine };
}

type Rec = {
  lang: string; interimResults: boolean; continuous: boolean; maxAlternatives: number;
  start: () => void; stop: () => void; abort: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

const Recognition = () =>
  typeof window === "undefined"
    ? null
    : ((window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => Rec }).webkitSpeechRecognition ??
      null);

/** Microphone → text, using the browser's speech recognition (Chrome, Android, Safari). */
export function useVoice(onText: (text: string, final: boolean) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const rec = useRef<Rec | null>(null);
  const cb = useRef(onText);
  cb.current = onText;

  useEffect(() => { setSupported(!!Recognition()); }, []);
  useEffect(() => () => rec.current?.abort(), []);

  const start = useCallback(() => {
    const R = Recognition();
    if (!R) return;
    setError("");
    const r = new R();
    r.lang = navigator.language || "en-US";
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      const res = Array.from(e.results);
      const text = res.map((x) => x[0].transcript).join(" ");
      cb.current(text, res.every((x) => x.isFinal));
    };
    r.onerror = (e) => {
      setError(
        e.error === "not-allowed" || e.error === "service-not-allowed" ? "Allow the microphone to add by voice"
          : e.error === "no-speech" ? "Didn't hear anything — try again"
          : e.error === "network" ? "Voice needs an internet connection"
          : e.error === "aborted" ? "" : "Couldn't understand — try again",
      );
    };
    r.onend = () => setListening(false);
    rec.current = r;
    setListening(true);
    try { r.start(); } catch { setListening(false); }
  }, []);

  const stop = useCallback(() => rec.current?.stop(), []);

  return { supported, listening, error, start, stop };
}
