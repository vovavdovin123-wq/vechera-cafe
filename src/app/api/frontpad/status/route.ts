import { NextResponse } from "next/server";
import { fetchFrontPadStatus } from "@/lib/frontpad";

/**
 * GET /api/frontpad/status?orderId=… | ?phone=…
 * Статус заказа. Не вызывать в цикле (лимит FrontPad).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId")?.trim() || undefined;
  const clientPhone = url.searchParams.get("phone")?.trim() || undefined;

  if (!orderId && !clientPhone) {
    return NextResponse.json(
      { ok: false, message: "Укажите orderId или phone" },
      { status: 400 },
    );
  }

  const result = await fetchFrontPadStatus({ orderId, clientPhone });
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }
  return NextResponse.json(result);
}
