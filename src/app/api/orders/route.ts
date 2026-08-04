import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/admin-auth";
import { sendOrderToFrontPad } from "@/lib/frontpad";
import { notifyNewOrder } from "@/lib/notify";
import { appendOrder, deleteOrder, readOrders } from "@/lib/orders-store";
import { resolveOrderFranchise } from "@/lib/order-franchise";
import { applyPendingWebhooks } from "@/lib/webhook-log";
import type { FranchiseId, OrderPayload } from "@/lib/types";

function isFranchiseId(value: unknown): value is FranchiseId {
  return value === "center" || value === "hippodrome";
}

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

    if (!isFranchiseId(body.franchiseId)) {
      return NextResponse.json(
        { ok: false, message: "Некорректная точка заказа" },
        { status: 400 },
      );
    }

    const resolved = resolveOrderFranchise(body.franchiseId, body.items);
    if (!resolved.ok) {
      return NextResponse.json(
        { ok: false, message: resolved.message },
        { status: 400 },
      );
    }

    const order: OrderPayload = {
      ...body,
      franchiseId: resolved.franchiseId,
    };

    const frontpad = await sendOrderToFrontPad(order);
    if (!frontpad.ok) {
      return NextResponse.json(frontpad, { status: 502 });
    }

    await appendOrder(order, {
      orderId: frontpad.orderId,
      mode: frontpad.mode,
      orderNumber: frontpad.orderNumber,
    });
    await applyPendingWebhooks(frontpad.orderId, frontpad.orderNumber);
    await notifyNewOrder(order, frontpad.orderId);

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
