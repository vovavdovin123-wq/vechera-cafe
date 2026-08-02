import { NextResponse } from "next/server";
import { updateOrderByFrontPadId } from "@/lib/orders-store";

type WebhookPayload = {
  action?: string;
  order_id?: string | number;
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

    if (!body.order_id) {
      console.warn("[FrontPad webhook] missing order_id", body);
      return NextResponse.json(
        { ok: false, message: "Missing order_id" },
        { status: 400 },
      );
    }

    const updated = await updateOrderByFrontPadId(String(body.order_id), {
      frontpadStatus: body.status !== undefined ? String(body.status) : undefined,
      frontpadStatusAt: body.datetime || new Date().toISOString(),
    });

    if (!updated) {
      console.warn("[FrontPad webhook] unknown order", body.order_id, body);
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

/** FrontPad иногда проверяет URL методом GET при настройке. */
export async function GET() {
  return NextResponse.json({ ok: true, service: "vechera-frontpad-webhook" });
}
