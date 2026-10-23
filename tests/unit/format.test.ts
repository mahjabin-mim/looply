import { describe, expect, it } from "vitest";
import { monthLabel, shiftMonth, tk, tkShort } from "@/lib/format";

describe("tk (taka amounts)", () => {
  it("adds the taka sign and thousands separators", () => {
    expect(tk(20300)).toBe("৳20,300");
  });
  it("uses lakh grouping as in Bangladesh", () => {
    expect(tk(150000)).toBe("৳1,50,000");
    expect(tk(12345678)).toBe("৳1,23,45,678");
  });
  it("shows paisa only when there are some", () => {
    expect(tk(12.5)).toBe("৳12.50");
    expect(tk(99)).toBe("৳99");
  });
  it("puts a minus sign before negative amounts", () => {
    expect(tk(-1000)).toBe("−৳1,000");
  });
  it("handles zero", () => {
    expect(tk(0)).toBe("৳0");
  });
});

describe("tkShort (chart axis)", () => {
  it("compacts thousands and lakhs", () => {
    expect(tkShort(0)).toBe("৳0");
    expect(tkShort(500)).toBe("৳500");
    expect(tkShort(10000)).toBe("৳10K");
    expect(tkShort(20300)).toBe("৳20.3K");
    expect(tkShort(120000)).toBe("৳1.2L");
  });
});

describe("months", () => {
  it("moves forward and back across year ends", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-10", 0)).toBe("2026-10");
    expect(shiftMonth("2026-10", 14)).toBe("2027-12");
  });
  it("labels months", () => {
    expect(monthLabel("2026-10")).toBe("October 2026");
    expect(monthLabel("2026-10", "short")).toBe("Oct 2026");
  });
});
