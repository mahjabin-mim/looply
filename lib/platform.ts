"use client";
// Small device checks for the few places iPhone/iPad behave differently.

/** iPhone, iPad (including iPadOS, which reports itself as a Mac with touch) or iPod. */
export function isApple() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}

/** Running as an installed app (home screen / Android app) rather than in a browser tab. */
export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.startsWith("android-app://")
  );
}

/** What the phone calls its fingerprint/face unlock. */
export const bioName = () => (isApple() ? "Face ID / Touch ID" : "fingerprint");
