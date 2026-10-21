import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Redis } from "@upstash/redis";

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
  mine?: boolean; // false = the money isn't mine (undefined counts as mine)
  doneAt: string | null; // ISO date-time
  month: string; // YYYY-MM
  status: Status;
  carried: boolean; // already copied forward
  carriedFrom: string | null;
  postponeTo?: string | null; // YYYY-MM; a skipped item is re-added to that month
  createdAt: string;
}

export interface Budget {
  userId: string;
  month: string; // YYYY-MM
  budget: number;
  savings: number; // amount to put aside for the future
}

interface Data {
  users: User[];
  items: Item[];
  budgets: Budget[];
}

const DIR = path.join(process.cwd(), "data");
const FILE = path.join(DIR, "db.json");

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const KEY = "monthly-list:data";
const redis = REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;

const empty = (): Data => ({ users: [], items: [], budgets: [] });

/** Stored in Upstash Redis when configured (hosting), otherwise in data/db.json (local). */
export async function load(): Promise<Data> {
  if (redis) {
    const d = await redis.get<Data>(KEY);
    return { ...empty(), ...(d ?? {}) };
  }
  try {
    return { ...empty(), ...JSON.parse(fs.readFileSync(FILE, "utf8")) };
  } catch {
    return empty();
  }
}

export async function save(data: Data): Promise<void> {
  if (redis) {
    await redis.set(KEY, data);
    return;
  }
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
