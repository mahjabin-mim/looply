"use client";
import { AnimatePresence, motion } from "framer-motion";
import { greeting, monthLabel } from "@/lib/format";

function Ring({ done, total }: { done: number; total: number }) {
  const pct = total ? done / total : 0;
  return (
    <div className="ring" title={`${done} of ${total} done`} aria-label={`${done} of ${total} done`}>
      <svg viewBox="0 0 44 44">
        <circle className="ring-track" cx="22" cy="22" r="18" />
        <motion.circle
          className="ring-fill"
          cx="22" cy="22" r="18"
          initial={false}
          animate={{ pathLength: pct }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
          style={{ rotate: -90, transformOrigin: "50% 50%" }}
        />
      </svg>
      <span>{Math.round(pct * 100)}%</span>
    </div>
  );
}

export default function MonthHeader({
  month, current, dir, name, done, total, onPrev, onNext, onToday,
}: {
  month: string;
  current: string;
  dir: number;
  name: string;
  done: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const first = name.split(/\s+/)[0];
  return (
    <section className="month-head">
      <div className="mh-text">
        <span className="eyebrow">{greeting()}, {first}</span>
        <div className="mh-title">
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            {month && (
              <motion.h2
                key={month}
                initial={{ opacity: 0, x: dir * 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -28 }}
                transition={{ duration: 0.22 }}
              >
                {monthLabel(month)}
              </motion.h2>
            )}
          </AnimatePresence>
        </div>
        <span className="mh-sub">
          {total ? `${done} of ${total} done` : "Nothing planned yet"}
          {month === current ? " · this month" : month < current ? " · past month" : " · upcoming"}
        </span>
      </div>
      <div className="mh-right">
        <Ring done={done} total={total} />
        <div className="mh-nav">
          <button className="icon-btn" onClick={onPrev} aria-label="Previous month">
            <svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <AnimatePresence initial={false}>
            {month !== current && current && (
              <motion.button
                className="today"
                onClick={onToday}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
              >
                Today
              </motion.button>
            )}
          </AnimatePresence>
          <button className="icon-btn" onClick={onNext} aria-label="Next month">
            <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
      </div>
    </section>
  );
}
