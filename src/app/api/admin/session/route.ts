import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, parseSessionToken } from "@/lib/admin-auth";

export async function GET() {
  const jar = await cookies();
  const session = parseSessionToken(jar.get(COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ ok: false });
  }
  return NextResponse.json({
    ok: true,
    login: session.login,
    scope: session.scope,
    franchiseId:
      session.scope === "all" ? null : session.scope,
  });
}
