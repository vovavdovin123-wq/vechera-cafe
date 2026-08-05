import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  parseUserSessionToken,
  USER_COOKIE_NAME,
} from "@/lib/user-auth";
import { findOrdersByPhone } from "@/lib/orders-store";

export async function GET() {
  const jar = await cookies();
  const session = parseUserSessionToken(jar.get(USER_COOKIE_NAME)?.value);

  if (!session) {
    return NextResponse.json({ ok: false, message: "Войдите в кабинет" }, { status: 401 });
  }

  const items = await findOrdersByPhone(session.phone);

  return NextResponse.json({
    ok: true,
    items: items.map((order) => ({
      id: order.id,
      orderId: order.orderId,
      orderNumber: order.frontpadOrderNumber,
      franchiseId: order.franchiseId,
      total: order.total,
      createdAt: order.createdAt,
      fulfillment: order.fulfillment,
      frontpadStatus: order.frontpadStatus,
      items: order.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
    })),
  });
}
