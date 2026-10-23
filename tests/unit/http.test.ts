import { describe, expect, it } from "vitest";
import { readJson } from "@/lib/http";

const req = (body?: string) => new Request("http://x/", { method: "POST", body, headers: { "Content-Type": "application/json" } });

describe("readJson (request bodies)", () => {
  it("reads a normal JSON body", async () => {
    expect(await readJson(req('{"title":"Milk","price":120}'))).toEqual({ title: "Milk", price: 120 });
  });
  it("treats an empty or cut-off body as {} instead of crashing", async () => {
    expect(await readJson(req(""))).toEqual({});
    expect(await readJson(req('{"title":'))).toEqual({});
  });
  it("ignores bodies that aren't objects", async () => {
    expect(await readJson(req("null"))).toEqual({});
    expect(await readJson(req("42"))).toEqual({});
  });
});
