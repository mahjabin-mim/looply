import { NextResponse } from "next/server";
import { readJson } from "@/lib/http";
import bcrypt from "bcryptjs";
import { load } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await readJson(req);
  const mail = String(email ?? "").trim().toLowerCase();
  const user = (await load()).users.find((u) => u.email === mail);
  if (user && !user.passwordHash)
    return NextResponse.json({ error: "This account uses Google sign-in. Continue with Google, or use \"Forgot password\" to add a password." }, { status: 401 });
  if (!user || !(await bcrypt.compare(String(password ?? ""), user.passwordHash)))
    return NextResponse.json({ error: "Wrong email or password" }, { status: 401 });
  await createSession(user.id);
  return NextResponse.json({ name: user.name, email: user.email });
}
