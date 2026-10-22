"use client";
import { useEffect, useRef, useState } from "react";
import { monthLabel, monthOnly, tk, tkShort } from "@/lib/format";

export type MonthPoint = { m: string; spent: number; budget: number; saved: number; goal: number; live: boolean };

const niceStep = (raw: number) => {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
};

/** Column chart: my spending per month, with each month's budget as a tick. */
export default function SpendChart({ data }: { data: MonthPoint[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(260, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const PLOT = 180, TOP = 22, AXIS = 26, LEFT = 46, RIGHT = 6;
  const H = TOP + PLOT + AXIS;
  const plotW = width - LEFT - RIGHT;
  const peak = Math.max(1, ...data.map((d) => Math.max(d.spent, d.budget)));
  const step = niceStep(peak / 4);
  const top = Math.ceil(peak / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const y = (v: number) => TOP + PLOT - (v / top) * PLOT;
  const band = plotW / data.length;
  const barW = Math.min(24, band * 0.46);

  const bar = (cx: number, v: number) => {
    const h = (v / top) * PLOT;
    if (h <= 0) return "";
    const r = Math.min(4, h, barW / 2);
    const x0 = cx - barW / 2, x1 = cx + barW / 2, yb = TOP + PLOT, yt = yb - h;
    return `M${x0},${yb}L${x0},${yt + r}Q${x0},${yt} ${x0 + r},${yt}L${x1 - r},${yt}Q${x1},${yt} ${x1},${yt + r}L${x1},${yb}Z`;
  };

  const a = active !== null ? data[active] : null;
  const ax = active !== null ? LEFT + band * (active + 0.5) : 0;

  return (
    <div className="chart" ref={box}>
      <div className="chart-legend">
        <span><i className="sw sw-spent" />Spent (my money)</span>
        <span><i className="sw-tick" />Budget</span>
      </div>
      <svg width={width} height={H} role="img" aria-label="My spending per month compared with the budget">
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid" x1={LEFT} x2={width - RIGHT} y1={y(t)} y2={y(t)} />
            <text className="tick" x={LEFT - 8} y={y(t)} dy="0.32em" textAnchor="end">{tkShort(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = LEFT + band * (i + 0.5);
          const over = d.budget > 0 && d.spent > d.budget;
          // value sits on the bar's cap; it only hops above the budget tick when the tick would cross it
          const tickY = d.budget > 0 ? y(d.budget) : Infinity;
          const capY = tickY <= y(d.spent) && tickY > y(d.spent) - 20 ? tickY - 7 : y(d.spent) - 7;
          return (
            <g key={d.m} className={active === i ? "col on" : "col"}>
              <path className="bar" d={bar(cx, d.spent)} />
              {d.budget > 0 && <line className="budget-tick" x1={cx - barW * 0.85} x2={cx + barW * 0.85} y1={y(d.budget)} y2={y(d.budget)} />}
              {d.live && d.spent > 0 && <text className="cap" x={cx} y={capY} textAnchor="middle">{tkShort(d.spent)}</text>}
              <text className={`xlabel ${d.live ? "live" : ""}`} x={cx} y={TOP + PLOT + 18} textAnchor="middle">{monthOnly(d.m)}</text>
              <rect
                className="hit"
                x={LEFT + band * i} y={TOP} width={band} height={PLOT + AXIS}
                tabIndex={0}
                aria-label={`${monthLabel(d.m)}: spent ${tk(d.spent)}${d.budget ? `, budget ${tk(d.budget)}` : ""}${over ? ", over budget" : ""}`}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              />
            </g>
          );
        })}
        <line className="baseline" x1={LEFT} x2={width - RIGHT} y1={TOP + PLOT} y2={TOP + PLOT} />
      </svg>
      {a && (
        <div
          className="tooltip"
          style={ax + barW / 2 + 190 < width
            ? { left: ax + barW / 2 + 12, top: TOP + 10 }
            : { left: ax - barW / 2 - 12, top: TOP + 10, transform: "translateX(-100%)" }}
        >
          <span className="tt-month">{monthLabel(a.m)}</span>
          <div className="tt-row"><i className="tt-key tt-spent" /><b>{tk(a.spent)}</b><span>spent</span></div>
          {a.budget > 0 && <div className="tt-row"><i className="tt-key tt-budget" /><b>{tk(a.budget)}</b><span>budget</span></div>}
          {a.goal > 0 && <div className="tt-row"><i className="tt-key" /><b>{tk(a.saved)}</b><span>{a.live ? "on track to save" : "saved"}</span></div>}
          {a.budget > 0 && a.spent > a.budget && <div className="tt-warn">Over budget by {tk(a.spent - a.budget)}</div>}
        </div>
      )}
    </div>
  );
}
