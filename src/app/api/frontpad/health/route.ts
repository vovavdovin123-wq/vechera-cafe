import { NextResponse } from "next/server";
import { FRONTPAD_DEFAULT_HOOK_STATUSES } from "@/lib/frontpad-status";
import { frontPadConfigStatus } from "@/lib/frontpad";
import { readWebhookLog } from "@/lib/webhook-log";

const DEFAULT_HOOK_URL = "https://vechera-cafe.ru/api/frontpad/webhook";

/** Диагностика: настроены ли секреты FrontPad по точкам (без раскрытия). */
export async function GET() {
  const status = frontPadConfigStatus();
  const hookUrl = process.env.FRONTPAD_HOOK_URL?.trim() || DEFAULT_HOOK_URL;
  const hookStatuses =
    process.env.FRONTPAD_HOOK_STATUSES?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) || FRONTPAD_DEFAULT_HOOK_STATUSES;
  const recentWebhooks = await readWebhookLog(5);

  return NextResponse.json({
    ok: true,
    configured: status.configured,
    mode: status.configured ? "live" : "stub",
    accounts: {
      center: status.center,
      hippodrome: status.hippodrome,
      dualAccounts: status.dualAccounts,
    },
    webhook: {
      url: hookUrl,
      statuses: hookStatuses,
      recent: recentWebhooks,
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
