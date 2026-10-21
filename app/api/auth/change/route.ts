import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { currentUser } from "@/lib/auth";
import { load, save } from "@/lib/db";

export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { current, password } = await req.json();
  if (String(password ?? "").length < 6) return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
  if (!(await bcrypt.compare(String(current ?? ""), me.passwordHash))) return NextResponse.json({ error: "Current password is wrong" }, { status: 400 });
  const data = load();
  const user = data.users.find((u) => u.id === me.id)!;
  user.passwordHash = await bcrypt.hash(password, 10);
  save(data);
  return NextResponse.json({ ok: true });
}
