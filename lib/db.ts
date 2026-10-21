import fs from "fs";
import path from "path";
import crypto from "crypto";

export type Status = "pending" | "done" | "skipped";

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string; // empty for Google-only accounts
  googleId?: string;
  resetHash?: string;
  resetExpires?: number;
}

export interface Item {
  id: string;
  userId: string;
  title: string;
  price: number | null;
  doneAt: string | null; // ISO date-time
  month: string; // YYYY-MM
  status: Status;
  carried: boolean; // already copied forward
  carriedFrom: string | null;
  postponeTo?: string | null; // YYYY-MM; a skipped item is re-added to that month
  createdAt: string;
}

interface Data {
  users: User[];
  items: Item[];
}

const DIR = path.join(process.cwd(), "data");
const FILE = path.join(DIR, "db.json");

export function load(): Data {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return { users: [], items: [] };
  }
}

export function save(data: Data) {
  fs.mkdirSync(DIR, { recursive: true });
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, FILE);
}

export const uid = () => crypto.randomUUID();

export const monthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/**
 * Copy items forward into the current month:
 *  - unfinished (pending) items from past months
 *  - "not now" items whose chosen month has arrived
 */
export function rollover(data: Data, userId: string): boolean {
  const current = monthKey();
  let changed = false;
  for (const it of [...data.items]) {
    if (it.userId !== userId || it.carried) continue;
    const due =
      (it.status === "pending" && it.month < current) ||
      (it.status === "skipped" && !!it.postponeTo && it.postponeTo <= current);
    if (!due) continue;
    it.carried = true;
    data.items.push({
      ...it,
      id: uid(),
      month: current,
      status: "pending",
      postponeTo: null,
      doneAt: null,
      carried: false,
      carriedFrom: it.month,
      createdAt: new Date().toISOString(),
    });
    changed = true;
  }
  return changed;
}

export const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
