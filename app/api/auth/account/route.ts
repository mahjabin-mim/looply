import { NextResponse } from "next/server";
import { readJson } from "@/lib/http";
import bcrypt from "bcryptjs";
import { currentUser, destroySession } from "@/lib/auth";
import { load, save } from "@/lib/db";

export async function DELETE(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { password, confirm } = await readJson(req);
  // password accounts confirm with their password, Google-only accounts by typing DELETE
  if (me.passwordHash) {
    if (!(await bcrypt.compare(String(password ?? ""), me.passwordHash)))
      return NextResponse.json({ error: "Password is wrong" }, { status: 400 });
  } else if (confirm !== "DELETE") {
    return NextResponse.json({ error: "Type DELETE to confirm" }, { status: 400 });
  }
  const data = await load();
  data.users = data.users.filter((u) => u.id !== me.id);
  data.items = data.items.filter((i) => i.userId !== me.id);
  data.budgets = data.budgets.filter((b) => b.userId !== me.id);
  data.push = data.push.filter((p) => p.userId !== me.id);
  await save(data);
  destroySession();
  return NextResponse.json({ ok: true });
}
