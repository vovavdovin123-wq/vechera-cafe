import { NextResponse } from "next/server";
import { fetchFrontPadCertificate } from "@/lib/frontpad";

/**
 * GET /api/frontpad/certificate?code=…
 * Проверка сертификата. Без циклов.
 */
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim();
  if (!code) {
    return NextResponse.json(
      { ok: false, message: "Укажите code" },
      { status: 400 },
    );
  }

  const result = await fetchFrontPadCertificate(code);
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }
  return NextResponse.json(result);
}
