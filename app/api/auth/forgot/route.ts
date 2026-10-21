import { NextResponse } from "next/server";
import crypto from "crypto";
import { load, save, sha } from "@/lib/db";


async function sendMail(to: string, link: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // No email service configured: print the link so it works in local dev.
    console.log(`\n[password reset] ${to}\n${link}\n`);
    return;
  }
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || "Looply <onboarding@resend.dev>",
      to,
      subject: "Reset your Looply password",
      html: `<p>Click to reset your password (valid for 1 hour):</p><p><a href="${link}">${link}</a></p>`,
    }),
  });
}

export async function POST(req: Request) {
  const { email } = await req.json();
  const mail = String(email ?? "").trim().toLowerCase();
  const data = await load();
  const user = data.users.find((u) => u.email === mail);
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    user.resetHash = sha(token);
    user.resetExpires = Date.now() + 60 * 60 * 1000;
    await save(data);
    await sendMail(user.email, `${new URL(req.url).origin}/?reset=${token}`);
  }
  // Same answer either way so emails can't be probed.
  return NextResponse.json({ ok: true });
}
