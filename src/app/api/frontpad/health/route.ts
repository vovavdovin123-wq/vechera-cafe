import { NextResponse } from "next/server";
import { frontPadConfigStatus } from "@/lib/frontpad";

/** Диагностика: настроены ли секреты FrontPad по точкам (без раскрытия). */
export async function GET() {
  const status = frontPadConfigStatus();
  return NextResponse.json({
    ok: true,
    configured: status.configured,
    mode: status.configured ? "live" : "stub",
    accounts: {
      center: status.center,
      hippodrome: status.hippodrome,
      dualAccounts: status.dualAccounts,
    },
    hooks: {
      webhook: "/api/frontpad/webhook",
      products: "/api/frontpad/products",
      status: "/api/frontpad/status",
      client: "/api/frontpad/client",
      certificate: "/api/frontpad/certificate",
      stops: "/api/frontpad/stops",
    },
    message: status.dualAccounts
      ? "Два аккаунта FrontPad: центр и ипподром — заказы уходят в нужный"
      : status.configured
        ? "FrontPad настроен (общий или один секрет). Для двух аккаунтов задайте FRONTPAD_SECRET_CENTER и FRONTPAD_SECRET_HIPPODROME"
        : "Нет секретов FrontPad — заказы в stub-режиме",
  });
}
