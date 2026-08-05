import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearUserSessionCookieOptions } from "@/lib/user-auth";

export async function POST() {
  const jar = await cookies();
  jar.set(clearUserSessionCookieOptions());
  return NextResponse.json({ ok: true });
}
