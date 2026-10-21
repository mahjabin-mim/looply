import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await currentUser();
  return NextResponse.json(u ? { name: u.name, email: u.email } : null);
}
