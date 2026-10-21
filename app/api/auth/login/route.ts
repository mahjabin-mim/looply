import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { load } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const mail = String(email ?? "").trim().toLowerCase();
  const user = load().users.find((u) => u.email === mail);
  if (!user || !(await bcrypt.compare(String(password ?? ""), user.passwordHash)))
    return NextResponse.json({ error: "Wrong email or password" }, { status: 401 });
  await createSession(user.id);
  return NextResponse.json({ name: user.name, email: user.email });
}
