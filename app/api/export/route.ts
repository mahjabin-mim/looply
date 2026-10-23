import { NextResponse } from "next/server";
import writeXlsxFile from "write-excel-file/node";
import { currentUser } from "@/lib/auth";
import { load } from "@/lib/db";

export const dynamic = "force-dynamic";

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const format = new URL(req.url).searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const data = await load();
  const items = data.items
    .filter((i) => i.userId === user.id)
    .sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : a.createdAt.localeCompare(b.createdAt)));
  const budgets = data.budgets.filter((b) => b.userId === user.id).sort((a, b) => a.month.localeCompare(b.month));

  const head = ["Month", "Item", "Price", "Whose money", "Status", "Done at", "Moved to month", "From month"];
  const row = (i: (typeof items)[number]) => [
    i.month === "someday" ? "Wishlist" : i.month, i.title, i.price, i.mine === false ? "Not mine" : "Mine", i.status, i.doneAt ?? "", i.postponeTo ?? "", i.carriedFrom ?? "",
  ];
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const lines = [head, ...items.map(row)].map((r) => r.map(csvCell).join(","));
    // BOM so Excel reads UTF-8 correctly
    return new NextResponse("\ufeff" + lines.join("\r\n"), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="looply-${stamp}.csv"` },
    });
  }

  const bold = { fontWeight: "bold" as const };
  const buf = await writeXlsxFile([
    {
      sheet: "Items",
      data: [
        head.map((h) => ({ value: h, ...bold })),
        ...items.map((i) => [i.month === "someday" ? "Wishlist" : i.month, i.title, i.price, i.mine === false ? "Not mine" : "Mine", i.status, i.doneAt ?? "", i.postponeTo ?? "", i.carriedFrom ?? ""]),
      ],
    },
    {
      sheet: "Budgets",
      data: [
        ["Month", "Budget", "Saving goal"].map((h) => ({ value: h, ...bold })),
        ...budgets.map((b) => [b.month, b.budget, b.savings]),
      ],
    },
  ] as never).toBuffer();
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="looply-${stamp}.xlsx"`,
    },
  });
}
