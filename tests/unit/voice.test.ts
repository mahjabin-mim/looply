import { describe, expect, it } from "vitest";
import { parseSpoken } from "@/lib/voice";

describe("parseSpoken (add by voice)", () => {
  const cases: [string, string, string, boolean][] = [
    ["Groceries 500", "Groceries", "500", true],
    ["groceries 500 taka", "Groceries", "500", true],
    ["house rent 12,000", "House rent", "12000", true],
    ["electricity bill for 1450 tk", "Electricity bill", "1450", true],
    ["new phone 35k", "New phone", "35000", true],
    ["laptop 1.5 lakh", "Laptop", "150000", true],
    ["gift 2 thousand", "Gift", "2000", true],
    ["mother's medicine 2400 not mine", "Mother's medicine", "2400", false],
    ["buy milk", "Milk", "", true],
    ["iPhone 15 for 120000 taka", "iPhone 15", "120000", true],
    ["চাল ৫০০ টাকা", "চাল", "500", true],
  ];

  it.each(cases)("%s", (said, title, price, mine) => {
    expect(parseSpoken(said)).toEqual({ title, price, mine });
  });

  it("uses the last number as the price", () => {
    expect(parseSpoken("2 kg rice 900")).toEqual({ title: "2 kg rice", price: "900", mine: true });
  });

  it("returns an empty title for silence", () => {
    expect(parseSpoken("   ")).toEqual({ title: "", price: "", mine: true });
  });
});
