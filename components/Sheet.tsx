"use client";
import { useEffect, useRef } from "react";
import { motion, useDragControls } from "framer-motion";
import { useMobile } from "@/lib/useMedia";

/** A dialog that slides up as a bottom sheet on phones and pops in centered on larger screens. */
export default function Sheet({
  title, onClose, children, size = "md",
}: {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const mobile = useMobile();
  const drag = useDragControls();
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <motion.div
      className={`overlay ${mobile ? "overlay-bottom" : ""}`}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`sheet sheet-${size} ${mobile ? "sheet-bottom" : ""}`}
        onClick={(e) => e.stopPropagation()}
        initial={mobile ? { y: "100%", opacity: 1, scale: 1 } : { opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={mobile ? { y: "100%", opacity: 1, scale: 1 } : { opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        drag={mobile ? "y" : false}
        dragControls={drag}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 110 || info.velocity.y > 650) onClose();
        }}
      >
        {mobile && (
          <div className="grab-zone" onPointerDown={(e) => drag.start(e)}>
            <div className="grabber" />
          </div>
        )}
        {title && (
          <div className="sheet-head" onPointerDown={(e) => mobile && drag.start(e)}>
            <h3>{title}</h3>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        )}
        <div className="sheet-body">{children}</div>
      </motion.div>
    </motion.div>
  );
}
