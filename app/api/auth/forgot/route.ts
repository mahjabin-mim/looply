import { NextResponse } from "next/server";
import { readJson } from "@/lib/http";
import crypto from "crypto";
import { load, save, sha } from "@/lib/db";
import { resetEmail, sendMail } from "@/lib/mailer";

export async function POST(req: Request) {
  const { email } = await readJson(req);
  const mail = String(email ?? "").trim().toLowerCase();
  const data = await load();
  const user = data.users.find((u) => u.email === mail);
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    user.resetHash = sha(token);
    user.resetExpires = Date.now() + 60 * 60 * 1000;
    await save(data);
    const origin = process.env.APP_URL || new URL(req.url).origin;
    try {
      await sendMail(resetEmail(user.email, `${origin}/?reset=${token}`));
    } catch (e) {
      // don't reveal anything to the caller; the error is in the server log
      console.error("[password reset] email failed:", e);
    }
  }
  // Same answer either way so emails can't be probed.
  return NextResponse.json({ ok: true });
}
