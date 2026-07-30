import { NextResponse } from "next/server";
import { fetchFrontPadClient } from "@/lib/frontpad";

/**
 * GET /api/frontpad/client?phone=…
 * Карточка клиента (автозаполнение адреса/скидки). Без циклов.
 */
export async function GET(request: Request) {
  const phone = new URL(request.url).searchParams.get("phone")?.trim();
  if (!phone || phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json(
      { ok: false, message: "Укажите корректный phone" },
      { status: 400 },
    );
  }

  const result = await fetchFrontPadClient(phone);
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }
  return NextResponse.json(result);
}
