import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { load, save, uid } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { googleConfigured, redirectUri } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const origin = process.env.APP_URL || new URL(req.url).origin;
  const fail = (m: string) => {
    const res = NextResponse.redirect(`${origin}/?autherror=${encodeURIComponent(m)}`);
    res.cookies.delete("g_state");
    return res;
  };
  if (!googleConfigured()) return fail("Google sign-in is not set up");

  const q = new URL(req.url).searchParams;
  if (q.get("error")) return fail("Google sign-in was cancelled");
  const code = q.get("code");
  const expected = cookies().get("g_state")?.value;
  if (!code || !expected || q.get("state") !== expected) return fail("Sign-in expired, please try again");

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri(req),
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return fail("Google sign-in failed");
    const { access_token } = await tokenRes.json();
    const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${access_token}` } });
    if (!infoRes.ok) return fail("Google sign-in failed");
    const info = await infoRes.json();
    const email = String(info.email ?? "").toLowerCase();
    if (!email || !info.email_verified) return fail("Your Google email is not verified");

    const data = await load();
    let user = data.users.find((u) => u.googleId === info.sub) ?? data.users.find((u) => u.email === email);
    if (user) {
      if (!user.googleId) { user.googleId = info.sub; await save(data); } // link to existing email account
    } else {
      user = { id: uid(), email, name: info.name || email.split("@")[0], passwordHash: "", googleId: info.sub };
      data.users.push(user);
      await save(data);
    }
    await createSession(user.id);
    const res = NextResponse.redirect(`${origin}/`);
    res.cookies.delete("g_state");
    return res;
  } catch {
    return fail("Google sign-in failed");
  }
}
