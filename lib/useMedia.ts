"use client";
import { useEffect, useState } from "react";

export function useMedia(query: string) {
  // read synchronously on the client so the first render already uses the right layout
  const [match, setMatch] = useState(() => typeof window !== "undefined" && matchMedia(query).matches);
  useEffect(() => {
    const mq = matchMedia(query);
    setMatch(mq.matches);
    const on = () => setMatch(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

/** Phone-sized layout: bottom nav, bottom sheets, swipe gestures. */
export const useMobile = () => useMedia("(max-width: 640px)");
