import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { load, save } from "@/lib/db";

export async function PATCH(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const name = String((await req.json()).name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name can't be empty" }, { status: 400 });
  if (name.length > 50) return NextResponse.json({ error: "Name is too long (max 50)" }, { status: 400 });
  const data = await load();
  data.users.find((u) => u.id === me.id)!.name = name;
  await save(data);
  return NextResponse.json({ name, email: me.email });
}
