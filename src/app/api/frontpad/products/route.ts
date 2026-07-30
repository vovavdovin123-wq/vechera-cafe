import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/admin-auth";
import { fetchFrontPadProducts } from "@/lib/frontpad";

/**
 * GET /api/frontpad/products — выгрузка товаров из FrontPad.
 * Только для админа. FrontPad: не чаще 1 раза в час.
 */
export async function GET() {
  const jar = await cookies();
  if (!verifySessionToken(jar.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const result = await fetchFrontPadProducts();
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }
  return NextResponse.json(result);
}
