import { NextResponse } from "next/server";
import { readJson } from "@/lib/http";
import bcrypt from "bcryptjs";
import { currentUser } from "@/lib/auth";
import { load, save } from "@/lib/db";

export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { current, password } = await readJson(req);
  if (String(password ?? "").length < 6) return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
  if (me.passwordHash && !(await bcrypt.compare(String(current ?? ""), me.passwordHash))) return NextResponse.json({ error: "Current password is wrong" }, { status: 400 });
  const data = await load();
  const user = data.users.find((u) => u.id === me.id)!;
  user.passwordHash = await bcrypt.hash(password, 10);
  await save(data);
  return NextResponse.json({ ok: true });
}
