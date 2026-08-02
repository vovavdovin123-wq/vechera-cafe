import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/admin-auth";
import { sendOrderToFrontPad } from "@/lib/frontpad";
import { notifyNewOrder } from "@/lib/notify";
import { appendOrder, deleteOrder, readOrders } from "@/lib/orders-store";
import { applyPendingWebhooks } from "@/lib/webhook-log";
import type { OrderPayload } from "@/lib/types";

export async function GET() {
  const jar = await cookies();
  if (!verifySessionToken(jar.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const items = await readOrders();
  return NextResponse.json({ ok: true, items });
}

export async function DELETE(request: Request) {
  const jar = await cookies();
  if (!verifySessionToken(jar.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, message: "Missing id" }, { status: 400 });
  }

  const deleted = await deleteOrder(id);
  if (!deleted) {
    return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderPayload;

    if (!body?.items?.length || !body.franchiseId || !body.total) {
      return NextResponse.json(
        { ok: false, message: "Пустой или некорректный заказ" },
        { status: 400 },
      );
    }

    const frontpad = await sendOrderToFrontPad(body);
    if (!frontpad.ok) {
      return NextResponse.json(frontpad, { status: 502 });
    }

    await appendOrder(body, {
      orderId: frontpad.orderId,
      mode: frontpad.mode,
      orderNumber: frontpad.orderNumber,
    });
    await applyPendingWebhooks(frontpad.orderId, frontpad.orderNumber);
    await notifyNewOrder(body, frontpad.orderId);

    return NextResponse.json({
      ok: true,
      orderId: frontpad.orderId,
      orderNumber: frontpad.orderNumber,
      mode: frontpad.mode,
      message: frontpad.message,
      warnings: frontpad.warnings,
    });
  } catch (error) {
    console.error("[api/orders]", error);
    return NextResponse.json(
      { ok: false, message: "Ошибка сервера" },
      { status: 500 },
    );
  }
}
