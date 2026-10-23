"use client";
import { useEffect, useState } from "react";
import { bioAvailable, bioRegister, checkPin, getLock, makeLock, saveLock, type LockConfig } from "@/lib/applock";
import { bioName } from "@/lib/platform";

type Mode = null | "set" | "change" | "off";
const digits = (v: string) => v.replace(/\D/g, "").slice(0, 6);

/** App lock settings for this device: PIN, optional fingerprint. */
export default function AppLockSettings({ email, name }: { email: string; name: string }) {
  const [cfg, setCfg] = useState<LockConfig | null>(null);
  const [canBio, setCanBio] = useState(false);
  const [bio, setBio] = useState("fingerprint");
  const [mode, setMode] = useState<Mode>(null);
  const [cur, setCur] = useState("");
  const [pin, setPin] = useState("");
  const [again, setAgain] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const secure = typeof window !== "undefined" && window.isSecureContext;

  useEffect(() => {
    setCfg(getLock(email));
    bioAvailable().then(setCanBio);
    setBio(bioName());
  }, [email]);

  const reset = (m: Mode = null) => { setMode(m); setCur(""); setPin(""); setAgain(""); setMsg(null); };
  const store = (c: LockConfig | null) => { saveLock(email, c); setCfg(c); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode !== "set" && (!cfg || !(await checkPin(cfg, cur)))) return setMsg({ ok: false, text: "Current PIN is wrong" });
    if (mode === "off") {
      store(null);
      reset();
      return setMsg({ ok: true, text: "App lock is off on this device" });
    }
    if (pin.length < 4) return setMsg({ ok: false, text: "Use 4 to 6 digits" });
    if (pin !== again) return setMsg({ ok: false, text: "PINs don't match" });
    store(await makeLock(pin, cfg?.bio));
    reset();
    setMsg({ ok: true, text: mode === "set" ? "App lock is on ✓" : "PIN changed ✓" });
  }

  async function addBio() {
    if (!cfg) return;
    try {
      const id = await bioRegister(email, name);
      store({ ...cfg, bio: id });
      setMsg({ ok: true, text: `Unlock with ${bio} is on ✓` });
    } catch {
      setMsg({ ok: false, text: `Couldn't set up ${bio}. You can still use your PIN.` });
    }
  }

  const pinInput = (id: string, label: string, v: string, set: (s: string) => void, autoFocus = false) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="password" inputMode="numeric" pattern="[0-9]*" autoComplete="off" maxLength={6} value={v}
        onChange={(e) => { set(digits(e.target.value)); setMsg(null); }} autoFocus={autoFocus} className="pin-input" />
    </div>
  );

  return (
    <div>
      <h4>App lock</h4>
      {!secure ? (
        <p className="fine">App lock needs a secure (https) connection. Open Looply from its normal address to set it up.</p>
      ) : mode ? (
        <form onSubmit={submit}>
          {mode !== "set" && pinInput("al-cur", "Current PIN", cur, setCur, true)}
          {mode !== "off" && (
            <>
              {pinInput("al-new", "New PIN (4–6 digits)", pin, setPin, mode === "set")}
              {pinInput("al-again", "Type it again", again, setAgain)}
            </>
          )}
          {msg && <div className={msg.ok ? "ok" : "error"}>{msg.text}</div>}
          <div className="actions">
            <button type="button" className="btn-ghost" onClick={() => reset()}>Cancel</button>
            <button className={mode === "off" ? "btn-danger solid" : "btn"}>{mode === "off" ? "Turn off" : "Save PIN"}</button>
          </div>
        </form>
      ) : cfg ? (
        <>
          <p className="fine">On for this device. Looply asks for your PIN{cfg.bio ? ` or ${bio}` : ""} when it opens and after a minute away.</p>
          <div className="btn-row">
            <button className="btn-ghost" onClick={() => reset("change")}>Change PIN</button>
            {canBio && !cfg.bio && <button className="btn-ghost" onClick={addBio}>Use {bio} too</button>}
            {cfg.bio && <button className="btn-ghost" onClick={() => { store({ ...cfg, bio: undefined }); setMsg({ ok: true, text: `${bio} unlock removed` }); }}>Remove {bio}</button>}
            <button className="btn-ghost" onClick={() => reset("off")}>Turn off</button>
          </div>
          {msg && <div className={msg.ok ? "ok" : "error"} style={{ marginTop: 10 }}>{msg.text}</div>}
        </>
      ) : (
        <>
          <p className="fine">Keep Looply private on a shared phone. It only locks this device — your other devices aren&apos;t affected.</p>
          <div className="btn-row">
            <button className="btn" onClick={() => reset("set")}>Turn on app lock</button>
          </div>
          {msg && <div className={msg.ok ? "ok" : "error"} style={{ marginTop: 10 }}>{msg.text}</div>}
        </>
      )}
    </div>
  );
}
