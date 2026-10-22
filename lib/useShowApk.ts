"use client";
import { useEffect, useState } from "react";

/** The APK link is for people in a normal browser: hide it inside the installed app and on iPhone. */
export function useShowApk() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const inApp =
      matchMedia("(display-mode: standalone)").matches ||
      matchMedia("(display-mode: fullscreen)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.startsWith("android-app://");
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setShow(!inApp && !ios);
  }, []);
  return show;
}
