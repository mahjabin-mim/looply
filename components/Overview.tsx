"use client";
import { motion } from "framer-motion";
import { tk } from "@/lib/format";

type Status = { tone: "good" | "warning" | "critical"; text: string };

const icon = {
  good: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  warning: <><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17.5v.01" /></>,
  critical: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5v.01" /></>,
};

function StatusPill({ s }: { s: Status }) {
  return (
    <span className={`status status-${s.tone}`}>
      <svg viewBox="0 0 24 24">{icon[s.tone]}</svg>
      {s.text}
    </span>
  );
}

const grow = { type: "spring" as const, stiffness: 90, damping: 20 };

/** The money summary for one month: cash left, a budget meter and the saving goal. */
export default function Overview({
  budget, savings, inherited, spent, planned, others, savedSoFar, onEditBudget,
}: {
  budget: number;
  savings: number;
  inherited: boolean;
  spent: number; // my money, done
  planned: number; // my money, still to do
  others: number; // not my money
  savedSoFar: number;
  onEditBudget: () => void;
}) {
  const left = budget - spent;
  const after = left - planned;
  const room = after - savings;

  const scale = Math.max(budget, spent + planned, 1);
  const w = (n: number) => `${(Math.max(0, n) / scale) * 100}%`;
  const saveLine = budget > 0 && savings > 0 && savings < budget ? (budget - savings) / scale : null;
  const budgetLine = budget > 0 && scale > budget ? budget / scale : null;

  let status: Status | null = null;
  if (budget > 0) {
    if (left < 0) status = { tone: "critical", text: `Over budget by ${tk(-left)}` };
    else if (after < 0) status = { tone: "critical", text: `Planned items go ${tk(-after)} over budget` };
    else if (savings > 0 && room < 0) status = { tone: "warning", text: `${tk(-room)} short of your saving goal` };
    else if (savings > 0) status = { tone: "good", text: `Saving goal on track · ${tk(room)} spare` };
    else status = { tone: "good", text: "Within budget" };
  }

  return (
    <motion.section className="card overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="ov-top">
        <div>
          <span className="label">{budget > 0 ? "Cash left" : "Spent"}</span>
          <div className="hero-num">{tk(budget > 0 ? left : spent)}</div>
          <span className="ov-sub">
            {budget > 0 ? (
              <>of {tk(budget)} budget · <b>{tk(after)}</b> after planned</>
            ) : (
              <>{tk(planned)} still planned · set a budget to see what&apos;s left</>
            )}
          </span>
        </div>
        <button className="chip-btn" onClick={onEditBudget}>
          <svg viewBox="0 0 24 24"><path d="M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16v4z" /></svg>
          {budget > 0 ? "Budget" : "Set budget"}
        </button>
      </div>

      {budget > 0 && (
        <>
          <div className="meter" role="img" aria-label={`Spent ${tk(spent)} and planned ${tk(planned)} of a ${tk(budget)} budget`}>
            <div className="meter-bar">
              {spent > 0 && (
                <motion.div className={`seg seg-spent ${left < 0 ? "over" : ""}`} title={`Spent ${tk(spent)}`} initial={{ width: 0 }} animate={{ width: w(spent) }} transition={grow} />
              )}
              {planned > 0 && (
                <motion.div className="seg seg-planned" title={`Planned ${tk(planned)}`} initial={{ width: 0 }} animate={{ width: w(planned) }} transition={grow} />
              )}
              <div className="seg seg-rest" />
            </div>
            {saveLine !== null && <motion.i className="mark" initial={false} animate={{ left: `${saveLine * 100}%` }} transition={grow} title={`Saving line ${tk(budget - savings)}`} />}
            {budgetLine !== null && <motion.i className="mark mark-budget" initial={false} animate={{ left: `${budgetLine * 100}%` }} transition={grow} title={`Budget ${tk(budget)}`} />}
          </div>
          <div className="legend">
            <span><i className="sw sw-spent" />Spent <b>{tk(spent)}</b></span>
            <span><i className="sw sw-planned" />Planned <b>{tk(planned)}</b></span>
            {saveLine !== null && <span><i className="sw-line" />Keep under <b>{tk(budget - savings)}</b> to save {tk(savings)}</span>}
          </div>
        </>
      )}

      {status && <StatusPill s={status} />}
      {inherited && budget + savings > 0 && <p className="fine">Using your budget from an earlier month — tap Budget to change it for this month.</p>}

      <div className="tiles">
        <div className="tile">
          <span className="label">Saving goal</span>
          <b>{savings > 0 ? tk(savings) : "—"}</b>
          <small>{savings > 0 ? (room >= 0 ? "covered ✓" : `${tk(Math.max(0, after))} on track`) : "not set"}</small>
        </div>
        <div className="tile">
          <span className="label">Not mine</span>
          <b>{tk(others)}</b>
          <small>kept separate</small>
        </div>
        <div className="tile">
          <span className="label">Saved so far</span>
          <b>{tk(savedSoFar)}</b>
          <small>past months</small>
        </div>
      </div>
    </motion.section>
  );
}
