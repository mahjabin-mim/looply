import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { load } from "@/lib/db";
import { pushConfigured, sendPush } from "@/lib/push";

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!pushConfigured()) return NextResponse.json({ error: "Notifications are not set up on the server" }, { status: 503 });
  const subs = (await load()).push.filter((p) => p.userId === user.id);
  if (!subs.length) return NextResponse.json({ error: "Turn reminders on first" }, { status: 400 });
  const results = await Promise.all(subs.map((s) => sendPush(s, { title: "Looply", body: "Reminders are on. You're all set ✓", url: "/" })));
  return NextResponse.json({ sent: results.filter((r) => r === "ok").length });
}
