import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/admin-auth";
import { fetchFrontPadStops } from "@/lib/frontpad";
import type { FranchiseId } from "@/lib/types";

/**
 * GET /api/frontpad/stops?franchiseId=center|hippodrome
 */
export async function GET(request: Request) {
  const jar = await cookies();
  if (!verifySessionToken(jar.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const raw = new URL(request.url).searchParams.get("franchiseId");
  const franchiseId: FranchiseId | undefined =
    raw === "center" || raw === "hippodrome" ? raw : undefined;

  const result = await fetchFrontPadStops(franchiseId);
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }
  return NextResponse.json(result);
}
