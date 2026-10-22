import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { load, save } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    available: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
    publicKey: process.env.VAPID_PUBLIC_KEY ?? null,
  });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { subscription, tz } = await req.json();
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth)
    return NextResponse.json({ error: "Bad subscription" }, { status: 400 });
  const data = await load();
  data.push = data.push.filter((p) => p.endpoint !== subscription.endpoint);
  data.push.push({
    userId: user.id,
    endpoint: subscription.endpoint,
    keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    tz: typeof tz === "string" && tz ? tz : "UTC",
  });
  await save(data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { endpoint } = await req.json();
  const data = await load();
  data.push = data.push.filter((p) => !(p.userId === user.id && p.endpoint === endpoint));
  await save(data);
  return NextResponse.json({ ok: true });
}
