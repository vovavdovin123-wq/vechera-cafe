import { NextResponse } from "next/server";
import { isFrontPadConfigured } from "@/lib/frontpad";

/** Диагностика: настроен ли FrontPad (без раскрытия секрета). */
export async function GET() {
  const configured = isFrontPadConfigured();
  return NextResponse.json({
    ok: true,
    configured,
    mode: configured ? "live" : "stub",
    hooks: {
      webhook: "/api/frontpad/webhook",
      products: "/api/frontpad/products",
      status: "/api/frontpad/status",
      client: "/api/frontpad/client",
      certificate: "/api/frontpad/certificate",
      stops: "/api/frontpad/stops",
    },
    message: configured
      ? "FrontPad secret задан — заказы уходят в live"
      : "Нет FRONTPAD_SECRET — заказы в stub-режиме",
  });
}
