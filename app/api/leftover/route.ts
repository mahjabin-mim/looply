import { NextResponse } from "next/server";
import { readJson } from "@/lib/http";
import { currentUser } from "@/lib/auth";
import { load, save } from "@/lib/db";

/** Set the left-over money as of a month (the user's own figure). */
export async function PUT(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await readJson(req);
  const amount = Number(b.amount);
  if (!Number.isFinite(amount)) return NextResponse.json({ error: "Enter an amount" }, { status: 400 });
  if (!/^\d{4}-\d{2}$/.test(b.asOf)) return NextResponse.json({ error: "Bad month" }, { status: 400 });
  const data = await load();
  const user = data.users.find((u) => u.id === me.id)!;
  user.leftover = { amount: Math.round(amount * 100) / 100, asOf: b.asOf };
  await save(data);
  return NextResponse.json(user.leftover);
}

/** Go back to Looply's own calculation. */
export async function DELETE() {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await load();
  delete data.users.find((u) => u.id === me.id)!.leftover;
  await save(data);
  return NextResponse.json({ ok: true });
}
