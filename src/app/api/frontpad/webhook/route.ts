import { NextResponse } from "next/server";
import { updateOrderByFrontPadId } from "@/lib/orders-store";

/**
 * Webhook статусов FrontPad.
 * В заказе передаётся hook_url + hook_status[] — FrontPad шлёт POST JSON:
 * { action, order_id, status, datetime }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: string;
      order_id?: string | number;
      status?: string | number;
      datetime?: string;
    };

    if (!body.order_id) {
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
      console.warn("[FrontPad webhook] unknown order", body.order_id);
      return NextResponse.json({ ok: true, matched: false });
    }

    return NextResponse.json({ ok: true, matched: true });
  } catch (error) {
    console.error("[api/frontpad/webhook]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
