import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/admin-auth";
import { fetchFrontPadStops } from "@/lib/frontpad";

/**
 * GET /api/frontpad/stops — артикулы в стоп-листе.
 * Админ: полный ответ. Публично можно позже повесить на кэш меню.
 */
export async function GET() {
  const jar = await cookies();
  if (!verifySessionToken(jar.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const result = await fetchFrontPadStops();
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }
  return NextResponse.json(result);
}
