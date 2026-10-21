import fs from "fs";
import path from "path";
import crypto from "crypto";

export type Status = "pending" | "done" | "skipped";

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
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

/** Copy unfinished (pending) items from past months into the current month. */
export function rollover(data: Data, userId: string): boolean {
  const current = monthKey();
  let changed = false;
  for (const it of [...data.items]) {
    if (it.userId === userId && it.status === "pending" && !it.carried && it.month < current) {
      it.carried = true;
      data.items.push({
        ...it,
        id: uid(),
        month: current,
        carried: false,
        carriedFrom: it.month,
        createdAt: new Date().toISOString(),
      });
      changed = true;
    }
  }
  return changed;
}

export const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
