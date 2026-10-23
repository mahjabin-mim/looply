import { NextResponse } from "next/server";
import { readJson } from "@/lib/http";
import bcrypt from "bcryptjs";
import { load, save, sha } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { token, password } = await readJson(req);
  if (String(password ?? "").length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  const data = await load();
  const h = sha(String(token ?? ""));
  const user = data.users.find((u) => u.resetHash === h && (u.resetExpires ?? 0) > Date.now());
  if (!user) return NextResponse.json({ error: "This reset link is invalid or expired" }, { status: 400 });
  user.passwordHash = await bcrypt.hash(password, 10);
  delete user.resetHash;
  delete user.resetExpires;
  await save(data);
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
