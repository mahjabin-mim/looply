import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// fake Gmail transport so no real email is sent
const sent: Record<string, unknown>[] = [];
let auth: unknown;
vi.mock("nodemailer", () => ({
  default: {
    createTransport: (opts: { auth: unknown }) => {
      auth = opts.auth;
      return { sendMail: async (m: Record<string, unknown>) => { sent.push(m); } };
    },
  },
}));

import { resetEmail, sendMail } from "@/lib/mailer";

const ENV = ["GMAIL_USER", "GMAIL_APP_PASSWORD", "RESEND_API_KEY", "MAIL_FROM"];
beforeEach(() => { sent.length = 0; auth = undefined; ENV.forEach((k) => delete process.env[k]); });
afterEach(() => vi.unstubAllGlobals());

describe("sendMail", () => {
  it("uses Gmail when an address and app password are set (spaces removed)", async () => {
    process.env.GMAIL_USER = "me@gmail.com";
    process.env.GMAIL_APP_PASSWORD = "abcd efgh ijkl mnop";
    expect(await sendMail(resetEmail("you@example.com", "https://x/?reset=t"))).toBe("gmail");
    expect(auth).toEqual({ user: "me@gmail.com", pass: "abcdefghijklmnop" });
    expect(sent[0]).toMatchObject({ from: "Looply <me@gmail.com>", to: "you@example.com", subject: "Reset your Looply password" });
  });

  it("falls back to Resend, then to the server log", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    process.env.RESEND_API_KEY = "re_test";
    expect(await sendMail(resetEmail("you@example.com", "https://x"))).toBe("resend");
    expect(fetchMock).toHaveBeenCalledOnce();

    delete process.env.RESEND_API_KEY;
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    expect(await sendMail(resetEmail("you@example.com", "https://x"))).toBe("log");
    expect(log.mock.calls[0][0]).toContain("you@example.com");
    log.mockRestore();
  });
});

describe("resetEmail", () => {
  it("includes the link in both the HTML and plain-text versions", () => {
    const m = resetEmail("you@example.com", "https://mylooply.vercel.app/?reset=abc");
    expect(m.html).toContain("https://mylooply.vercel.app/?reset=abc");
    expect(m.text).toContain("https://mylooply.vercel.app/?reset=abc");
    expect(m.text).toContain("1 hour");
  });
});
