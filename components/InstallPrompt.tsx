"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const KEY = "install-dismissed";

export default function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [show, setShow] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const mobile = /android|iphone|ipad|ipod/i.test(ua);
    const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
    let dismissed = false;
    try { dismissed = localStorage.getItem(KEY) === "1"; } catch {}
    if (!mobile || standalone || dismissed) return;

    const isIos = /iphone|ipad|ipod/i.test(ua);
    setIos(isIos);
    if (isIos) setShow(true); // iOS has no install event; show manual steps

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
      setShow(true);
    };
    const onInstalled = () => setShow(false);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    setHelp(false);
    try { localStorage.setItem(KEY, "1"); } catch {}
  };

  const install = async () => {
    if (event) {
      await event.prompt();
      const { outcome } = await event.userChoice;
      setEvent(null);
      if (outcome === "accepted") setShow(false);
    } else setHelp(true);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="install glass"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
        >
          <img src="/icons/icon-192.png" alt="" width={44} height={44} />
          <div className="txt">
            <b>Install Looply</b>
            {help || (ios && !event) ? (
              <span>Tap <b>Share</b> <span aria-hidden>⎙</span> then <b>Add to Home Screen</b></span>
            ) : (
              <span>Add it to your home screen like an app</span>
            )}
          </div>
          {!(ios && !event) && <button className="btn" onClick={install}>Install</button>}
          <button className="icon" onClick={dismiss} aria-label="Dismiss">✕</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
