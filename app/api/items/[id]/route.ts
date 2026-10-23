import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { load, save } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  const data = await load();
  const it = data.items.find((i) => i.id === params.id && i.userId === user.id);
  if (!it) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (typeof b.title === "string" && b.title.trim()) it.title = b.title.trim();
  if ("price" in b) it.price = b.price === "" || b.price == null ? null : Number(b.price);
  if (typeof b.mine === "boolean") it.mine = b.mine;
  if ("doneAt" in b) it.doneAt = b.doneAt || null;
  // move between the wishlist and a month
  if (/^\d{4}-\d{2}$/.test(b.month) || b.month === "someday") { it.month = b.month; it.carried = false; }
  if (["pending", "done", "skipped"].includes(b.status)) {
    it.status = b.status;
    if (b.status === "done" && !it.doneAt && !("doneAt" in b)) it.doneAt = new Date().toISOString();
    if (b.status !== "done" && !("doneAt" in b)) it.doneAt = null;
    // a month only makes sense for a "not now" item
    it.postponeTo = b.status === "skipped" && /^\d{4}-\d{2}$/.test(b.postponeTo) ? b.postponeTo : null;
  }
  await save(data);
  return NextResponse.json(it);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await load();
  data.items = data.items.filter((i) => !(i.id === params.id && i.userId === user.id));
  await save(data);
  return NextResponse.json({ ok: true });
}
