import { NextResponse } from "next/server";
import { load, save } from "@/lib/db";
import { pushConfigured, sendPush } from "@/lib/push";

export const dynamic = "force-dynamic";

/** Calendar date and days left in the month, in the user's own time zone. */
function localMonth(tz: string) {
  let now = new Date();
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  } catch {
    parts = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  }
  const g = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const [y, m, d] = [g("year"), g("month"), g("day")];
  const last = new Date(y, m, 0).getDate();
  return { month: `${y}-${String(m).padStart(2, "0")}`, daysLeft: last - d };
}

/** Run once a day. Reminds users in the last 3 days of their month if items are still pending. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!pushConfigured()) return NextResponse.json({ skipped: "push not configured" });

  const data = await load();
  let sent = 0;
  const dead = new Set<string>();

  for (const sub of data.push) {
    const { month, daysLeft } = localMonth(sub.tz);
    if (daysLeft > 2) continue;
    const pending = data.items.filter((i) => i.userId === sub.userId && i.month === month && i.status === "pending").length;
    if (!pending) continue;
    const when = daysLeft === 0 ? "today" : daysLeft === 1 ? "tomorrow" : "in 2 days";
    const r = await sendPush(sub, {
      title: "Looply",
      body: `The month ends ${when} and ${pending} item${pending === 1 ? " is" : "s are"} still pending. They'll carry over to next month.`,
      url: "/",
    });
    if (r === "ok") sent++;
    if (r === "gone") dead.add(sub.endpoint);
  }

  if (dead.size) {
    data.push = data.push.filter((p) => !dead.has(p.endpoint));
    await save(data);
  }
  return NextResponse.json({ sent, removed: dead.size });
}
