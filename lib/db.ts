import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Redis } from "@upstash/redis";
import { neon } from "@neondatabase/serverless";

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

export interface PushSub {
  userId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  tz: string; // IANA time zone, so reminders follow the user's own calendar
}

export interface Data {
  users: User[];
  items: Item[];
  budgets: Budget[];
  push: PushSub[];
}

const DIR = path.join(process.cwd(), "data");
const FILE = path.join(DIR, "db.json");

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const KEY = "monthly-list:data";
const redis = REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;

const SQL_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = !redis && SQL_URL ? neon(SQL_URL) : null;
let ready: Promise<unknown> | null = null;
const ensureTable = () =>
  (ready ??= sql!`CREATE TABLE IF NOT EXISTS app_data (key text PRIMARY KEY, value jsonb NOT NULL)`);

const empty = (): Data => ({ users: [], items: [], budgets: [], push: [] });

/** Stored in Upstash Redis or Postgres (Neon) when configured (hosting), otherwise in data/db.json (local). */
export async function load(): Promise<Data> {
  if (redis) {
    const d = await redis.get<Data>(KEY);
    return { ...empty(), ...(d ?? {}) };
  }
  if (sql) {
    await ensureTable();
    const rows = await sql`SELECT value FROM app_data WHERE key = ${KEY}`;
    return { ...empty(), ...((rows[0]?.value as Data | undefined) ?? {}) };
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
  if (sql) {
    await ensureTable();
    await sql`INSERT INTO app_data (key, value) VALUES (${KEY}, ${JSON.stringify(data)}::jsonb)
              ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
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
