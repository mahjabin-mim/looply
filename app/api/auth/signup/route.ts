import { NextResponse } from "next/server";
import { readJson } from "@/lib/http";
import bcrypt from "bcryptjs";
import { load, save, uid } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { name, email, password } = await readJson(req);
  const mail = String(email ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(mail)) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  if (String(password ?? "").length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  const data = await load();
  if (data.users.some((u) => u.email === mail)) return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  const user = { id: uid(), email: mail, name: String(name ?? "").trim() || mail.split("@")[0], passwordHash: await bcrypt.hash(password, 10) };
  data.users.push(user);
  await save(data);
  await createSession(user.id);
  return NextResponse.json({ name: user.name, email: user.email });
}
