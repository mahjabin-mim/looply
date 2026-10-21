import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { load, save, rollover, uid, monthKey, Item } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = load();
  if (rollover(data, user.id)) save(data);
  return NextResponse.json({
    current: monthKey(),
    items: data.items.filter((i) => i.userId === user.id),
  });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  const title = String(b.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
  const item: Item = {
    id: uid(),
    userId: user.id,
    title,
    price: b.price === "" || b.price == null ? null : Number(b.price),
    doneAt: b.doneAt || null,
    month: /^\d{4}-\d{2}$/.test(b.month) ? b.month : monthKey(),
    status: "pending",
    carried: false,
    carriedFrom: null,
    createdAt: new Date().toISOString(),
  };
  const data = load();
  data.items.push(item);
  save(data);
  return NextResponse.json(item);
}
