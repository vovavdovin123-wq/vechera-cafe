import { NextResponse } from "next/server";
import { updateOrderByFrontPadId } from "@/lib/orders-store";
import { appendWebhookLog } from "@/lib/webhook-log";

type WebhookPayload = {
  action?: string;
  order_id?: string | number;
  order_number?: string | number;
  status?: string | number;
  datetime?: string;
};

async function parseWebhookPayload(request: Request): Promise<WebhookPayload> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as WebhookPayload;
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData();
    return {
      action: String(form.get("action") ?? ""),
      order_id: form.get("order_id")?.toString(),
      order_number: form.get("order_number")?.toString(),
      status: form.get("status")?.toString(),
      datetime: form.get("datetime")?.toString(),
    };
  }

  const raw = await request.text();
  if (!raw.trim()) return {};

  try {
    return JSON.parse(raw) as WebhookPayload;
  } catch {
    const params = new URLSearchParams(raw);
    return {
      action: params.get("action") ?? undefined,
      order_id: params.get("order_id") ?? undefined,
      status: params.get("status") ?? undefined,
      datetime: params.get("datetime") ?? undefined,
    };
  }
}

/**
 * Webhook статусов FrontPad.
 * FrontPad шлёт POST при смене статуса: action=change_status, order_id, status, datetime.
 */
export async function POST(request: Request) {
  try {
    const body = await parseWebhookPayload(request);

    if (!body.order_id && !body.order_number) {
      console.info("[FrontPad webhook] ping / validation", body);
      await appendWebhookLog({ matched: false, raw: body as Record<string, unknown> });
      return NextResponse.json({ ok: true, ping: true });
    }

    const lookupId = String(body.order_id || body.order_number);
    const updated = await updateOrderByFrontPadId(lookupId, {
      frontpadStatus: body.status !== undefined ? String(body.status) : undefined,
      frontpadStatusAt: body.datetime || new Date().toISOString(),
    });

    await appendWebhookLog({
      orderId: lookupId,
      status: body.status !== undefined ? String(body.status) : undefined,
      action: body.action,
      matched: Boolean(updated),
      raw: body as Record<string, unknown>,
    });

    if (!updated) {
      console.warn("[FrontPad webhook] unknown order", lookupId, body);
      return NextResponse.json({ ok: true, matched: false });
    }

    console.info("[FrontPad webhook] updated", {
      orderId: body.order_id,
      status: body.status,
    });

    return NextResponse.json({ ok: true, matched: true });
  } catch (error) {
    console.error("[api/frontpad/webhook]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

/** FrontPad проверяет URL методом GET при настройке. */
export async function GET() {
  return NextResponse.json({ ok: true, service: "vechera-frontpad-webhook" });
}
