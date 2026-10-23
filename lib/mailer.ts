import nodemailer from "nodemailer";

export type Mail = { to: string; subject: string; html: string; text: string };

/**
 * Send an email through whichever service is configured:
 *  1. Gmail (GMAIL_USER + GMAIL_APP_PASSWORD — an app password from myaccount.google.com/apppasswords)
 *  2. Resend (RESEND_API_KEY)
 *  3. otherwise the message is only written to the server log (local development)
 */
export async function sendMail(m: Mail): Promise<"gmail" | "resend" | "log"> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, ""); // Google shows it in groups of four
  if (user && pass) {
    const transport = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
    await transport.sendMail({ from: process.env.MAIL_FROM || `Looply <${user}>`, to: m.to, subject: m.subject, html: m.html, text: m.text });
    return "gmail";
  }
  const key = process.env.RESEND_API_KEY;
  if (key) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM || "Looply <onboarding@resend.dev>", to: m.to, subject: m.subject, html: m.html, text: m.text }),
    });
    if (!r.ok) throw new Error(`Resend ${r.status}`);
    return "resend";
  }
  console.log(`\n[email to ${m.to}] ${m.subject}\n${m.text}\n`);
  return "log";
}

/** The password-reset email. */
export function resetEmail(to: string, link: string): Mail {
  return {
    to,
    subject: "Reset your Looply password",
    text: `Someone asked to reset the password for your Looply account.\n\nSet a new password here (the link works once, for 1 hour):\n${link}\n\nIf it wasn't you, you can ignore this email — your password stays the same.`,
    html: `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#15162b">
  <h2 style="margin:0 0 12px;font-size:20px">Reset your Looply password</h2>
  <p style="margin:0 0 20px;line-height:1.5">Someone asked to reset the password for your Looply account. Tap the button to choose a new one. The link works once, for 1 hour.</p>
  <p style="margin:0 0 24px"><a href="${link}" style="display:inline-block;background:#6a58f0;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:12px">Set a new password</a></p>
  <p style="margin:0 0 8px;font-size:13px;color:#6b6d85">Or copy this link: <br><a href="${link}" style="color:#6a58f0;word-break:break-all">${link}</a></p>
  <p style="margin:16px 0 0;font-size:13px;color:#6b6d85">If it wasn't you, ignore this email — your password stays the same.</p>
</div>`,
  };
}
