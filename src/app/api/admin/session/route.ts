import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/admin-auth";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  const ok = verifySessionToken(token);
  return NextResponse.json({ ok });
}
