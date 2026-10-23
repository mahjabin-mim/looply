import { describe, expect, it } from "vitest";
import { checkPin, makeLock } from "@/lib/applock";

describe("app lock PIN", () => {
  it("accepts the right PIN and rejects others", async () => {
    const lock = await makeLock("2580");
    expect(await checkPin(lock, "2580")).toBe(true);
    expect(await checkPin(lock, "2581")).toBe(false);
    expect(await checkPin(lock, "258")).toBe(false);
  });

  it("remembers the PIN length but never the PIN itself", async () => {
    const lock = await makeLock("123456");
    expect(lock.len).toBe(6);
    expect(JSON.stringify(lock)).not.toContain("123456");
  });

  it("salts every lock differently", async () => {
    const a = await makeLock("1234");
    const b = await makeLock("1234");
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });

  it("keeps the fingerprint id when given", async () => {
    expect((await makeLock("1234", "cred-id")).bio).toBe("cred-id");
  });
});
