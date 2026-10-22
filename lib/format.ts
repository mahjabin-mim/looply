// Shared formatting for money, months and dates.

const whole = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const cents = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** ৳20,300 — decimals only when the amount has them; lakh grouping (1,00,000) as used in Bangladesh. */
export const tk = (n: number) => {
  const a = Math.abs(n);
  const s = Math.round(a * 100) % 100 === 0 ? whole.format(a) : cents.format(a);
  return `${n < 0 ? "−" : ""}৳${s}`;
};

/** Compact amount for axis ticks: ৳0, ৳10K, ৳1.2L */
export const tkShort = (n: number) => {
  if (n >= 100000) return `৳${+(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `৳${+(n / 1000).toFixed(1)}K`;
  return `৳${whole.format(n)}`;
};

export const shiftMonth = (m: string, n: number) => {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const monthLabel = (m: string, style: "long" | "short" = "long") =>
  new Date(m + "-01T00:00").toLocaleString("en", { month: style, year: "numeric" });

export const monthOnly = (m: string) => new Date(m + "-01T00:00").toLocaleString("en", { month: "short" });

export const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" });

export const greeting = () => {
  const h = new Date().getHours();
  return h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};
