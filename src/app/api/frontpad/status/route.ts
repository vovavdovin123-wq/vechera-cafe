import { NextResponse } from "next/server";
import { fetchFrontPadStatus } from "@/lib/frontpad";
import { findOrderByFrontPadId } from "@/lib/orders-store";

const STATUS_HINTS: Record<string, string> = {
  "1": "Новый",
  "2": "В производстве",
  "3": "В пути",
  "4": "Выполнен",
  "5": "Отменён",
};

/**
 * GET /api/frontpad/status?orderId=… | ?phone=…
 * Сначала локальный статус (webhook), затем FrontPad get_status.
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

  if (orderId) {
    const local = await findOrderByFrontPadId(orderId);
    if (local?.frontpadStatus) {
      const raw = String(local.frontpadStatus);
      const label = STATUS_HINTS[raw] || raw;
      return NextResponse.json({
        ok: true,
        status: label,
        source: "webhook",
        updatedAt: local.frontpadStatusAt,
      });
    }
    if (local?.frontpadMode === "stub" || local?.status === "paid_stub") {
      return NextResponse.json({
        ok: true,
        status: "Принят",
        source: "local",
      });
    }
    if (local && !local.frontpadStatus) {
      // Live-заказ ещё без webhook — попробуем FrontPad, иначе «Принят»
      const fp = await fetchFrontPadStatus({
        orderId,
        clientPhone: clientPhone || local.customerPhone,
      });
      if (fp.ok && fp.status) {
        return NextResponse.json({
          ok: true,
          status: fp.status,
          source: "frontpad",
          message: fp.message,
        });
      }
      return NextResponse.json({
        ok: true,
        status: "Принят",
        source: "local",
        message: fp.message,
      });
    }
  }

  const result = await fetchFrontPadStatus({ orderId, clientPhone });
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }
  return NextResponse.json({ ...result, source: "frontpad" });
}
