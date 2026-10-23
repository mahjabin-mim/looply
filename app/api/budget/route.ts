import { NextResponse } from "next/server";
import { readJson } from "@/lib/http";
import { currentUser } from "@/lib/auth";
import { load, save } from "@/lib/db";

export async function PUT(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await readJson(req);
  if (!/^\d{4}-\d{2}$/.test(b.month)) return NextResponse.json({ error: "Bad month" }, { status: 400 });
  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };
  const data = await load();
  let row = data.budgets.find((x) => x.userId === user.id && x.month === b.month);
  if (!row) {
    row = { userId: user.id, month: b.month, budget: 0, savings: 0 };
    data.budgets.push(row);
  }
  if ("budget" in b) row.budget = num(b.budget);
  if ("savings" in b) row.savings = num(b.savings);
  await save(data);
  return NextResponse.json(row);
}
