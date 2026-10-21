import { NextResponse } from "next/server";
import crypto from "crypto";
import { googleConfigured, redirectUri } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const origin = process.env.APP_URL || new URL(req.url).origin;
  if (!googleConfigured()) return NextResponse.redirect(`${origin}/?autherror=${encodeURIComponent("Google sign-in is not set up")}`);
  const state = crypto.randomBytes(16).toString("hex");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(req),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();
  const res = NextResponse.redirect(url);
  res.cookies.set("g_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
  return res;
}
