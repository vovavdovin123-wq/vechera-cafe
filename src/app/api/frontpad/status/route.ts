import { NextResponse } from "next/server";
import { fetchFrontPadStatus } from "@/lib/frontpad";
import { formatFrontPadStatus } from "@/lib/frontpad-status";
import { findOrderByFrontPadId } from "@/lib/orders-store";

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
      return NextResponse.json({
        ok: true,
        status: formatFrontPadStatus(local.frontpadStatus),
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
    if (local?.frontpadMode === "live") {
      const fp = await fetchFrontPadStatus({
        orderId,
        clientPhone: clientPhone || local.customerPhone,
        franchiseId: local.franchiseId,
      });
      if (fp.ok && fp.status) {
        return NextResponse.json({
          ok: true,
          status: formatFrontPadStatus(fp.status),
          source: fp.code === "invalid_method" ? "local" : "frontpad",
          message: fp.message,
        });
      }
      return NextResponse.json({
        ok: true,
        status: "Новый",
        source: "local",
        message:
          "Заказ принят. Статус обновится автоматически при смене в FrontPad.",
      });
    }
  }

  const franchiseParam = url.searchParams.get("franchiseId");
  const franchiseId =
    franchiseParam === "center" || franchiseParam === "hippodrome"
      ? franchiseParam
      : undefined;

  const result = await fetchFrontPadStatus({
    orderId,
    clientPhone,
    franchiseId,
  });
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }
  return NextResponse.json({
    ...result,
    status: formatFrontPadStatus(result.status),
    source: "frontpad",
  });
}
