import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/admin-auth";
import { fetchFrontPadProducts } from "@/lib/frontpad";
import type { FranchiseId } from "@/lib/types";

/**
 * GET /api/frontpad/products?franchiseId=center|hippodrome
 * Только для админа. FrontPad: не чаще 1 раза в час.
 */
export async function GET(request: Request) {
  const jar = await cookies();
  if (!verifySessionToken(jar.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const raw = new URL(request.url).searchParams.get("franchiseId");
  const franchiseId: FranchiseId | undefined =
    raw === "center" || raw === "hippodrome" ? raw : undefined;

  const result = await fetchFrontPadProducts(franchiseId);
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }
  return NextResponse.json(result);
}
