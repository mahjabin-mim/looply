"use client";
// App lock lives on this device only (a shared phone shouldn't lock the user's laptop).
// It's a privacy screen: it keeps the app hidden until the PIN or fingerprint is given.

export type LockConfig = {
  salt: string;
  hash: string; // SHA-256 of salt + PIN
  len: number; // PIN length, so the keypad can check as soon as it's complete
  bio?: string; // fingerprint/face credential id (base64url), when turned on
};

const key = (email: string) => `applock:${email.toLowerCase()}`;
const WAIT = "applock-wait";
export const AWAY_MS = 60_000; // lock again after a minute away
export const MAX_TRIES = 5;

const b64 = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

export function getLock(email: string): LockConfig | null {
  try { return JSON.parse(localStorage.getItem(key(email)) || "null"); } catch { return null; }
}

export function saveLock(email: string, cfg: LockConfig | null) {
  try {
    if (cfg) localStorage.setItem(key(email), JSON.stringify(cfg));
    else localStorage.removeItem(key(email));
  } catch {}
}

async function digest(salt: string, pin: string) {
  return b64(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + ":" + pin)));
}

export async function makeLock(pin: string, bio?: string): Promise<LockConfig> {
  const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
  return { salt, hash: await digest(salt, pin), len: pin.length, bio };
}

export async function checkPin(cfg: LockConfig, pin: string) {
  return (await digest(cfg.salt, pin)) === cfg.hash;
}

/** Wrong-PIN cool-down that survives a reload. */
export const waitUntil = () => { try { return Number(localStorage.getItem(WAIT) || 0); } catch { return 0; } };
export const setWaitUntil = (t: number) => { try { t ? localStorage.setItem(WAIT, String(t)) : localStorage.removeItem(WAIT); } catch {} };

export async function bioAvailable() {
  try {
    return !!window.PublicKeyCredential && (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
  } catch { return false; }
}

/** Register this phone's fingerprint/face unlock; returns the credential id. */
export async function bioRegister(email: string, name: string) {
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: "Looply", id: location.hostname },
      user: { id: crypto.getRandomValues(new Uint8Array(16)), name: email, displayName: name || email },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "discouraged" },
      attestation: "none",
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error("cancelled");
  return b64(cred.rawId);
}

/** Ask the phone to confirm the fingerprint/face; resolves true when it does. */
export async function bioVerify(id: string) {
  try {
    const res = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: location.hostname,
        allowCredentials: [{ type: "public-key", id: unb64(id), transports: ["internal"] }],
        userVerification: "required",
        timeout: 60_000,
      },
    });
    return !!res;
  } catch { return false; }
}
