import { NextResponse } from "next/server";
import { fetchFrontPadStatus } from "@/lib/frontpad";
import { sanitizeCustomerMessage } from "@/lib/customer-messages";
import { formatFrontPadStatus, DEFAULT_CUSTOMER_STATUS } from "@/lib/frontpad-status";
import { findOrderByFrontPadId } from "@/lib/orders-store";

/**
 * GET /api/frontpad/status?orderId=… | ?phone=…
 * Сначала локальный статус (webhook), затем FrontPad get_status.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId")?.trim() || undefined;
  const orderNumber = url.searchParams.get("orderNumber")?.trim() || undefined;
  const clientPhone = url.searchParams.get("phone")?.trim() || undefined;

  if (!orderId && !orderNumber && !clientPhone) {
    return NextResponse.json(
      { ok: false, message: "Укажите orderId, orderNumber или phone" },
      { status: 400 },
    );
  }

  const franchiseParam = url.searchParams.get("franchiseId");
  const franchiseId =
    franchiseParam === "center" || franchiseParam === "hippodrome"
      ? franchiseParam
      : undefined;
  const fulfillmentParam = url.searchParams.get("fulfillment");
  const fulfillmentFromQuery =
    fulfillmentParam === "delivery" || fulfillmentParam === "pickup"
      ? fulfillmentParam
      : undefined;

  const lookupId = orderId || orderNumber;

  if (lookupId) {
    const local = await findOrderByFrontPadId(lookupId);
    const fulfillment = local?.fulfillment ?? fulfillmentFromQuery;
    const fmt = (status: string) =>
      formatFrontPadStatus(status, { fulfillment });

    if (local?.frontpadStatus) {
      return NextResponse.json({
        ok: true,
        status: fmt(local.frontpadStatus),
        source: "webhook",
        updatedAt: local.frontpadStatusAt,
      });
    }
    if (local?.frontpadMode === "stub" || local?.status === "paid_stub") {
      return NextResponse.json({
        ok: true,
        status: DEFAULT_CUSTOMER_STATUS,
        source: "local",
      });
    }
    if (local?.frontpadMode === "live") {
      const fp = await fetchFrontPadStatus({
        orderId: local.orderId,
        clientPhone: clientPhone || local.customerPhone,
        franchiseId: local.franchiseId,
      });
      if (fp.ok && fp.status) {
        return NextResponse.json({
          ok: true,
          status: fmt(fp.status),
          source: fp.code === "invalid_method" ? "local" : "frontpad",
        });
      }
      return NextResponse.json({
        ok: true,
        status: DEFAULT_CUSTOMER_STATUS,
        source: "local",
      });
    }
  }

  const result = await fetchFrontPadStatus({
    orderId,
    clientPhone,
    franchiseId,
  });
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: sanitizeCustomerMessage(
          result.message,
          "Не удалось получить статус заказа",
        ),
      },
      { status: 502 },
    );
  }
  return NextResponse.json({
    ...result,
    status: formatFrontPadStatus(result.status, {
      fulfillment: fulfillmentFromQuery,
    }),
    source: "frontpad",
  });
}
