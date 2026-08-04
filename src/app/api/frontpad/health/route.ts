import { NextResponse } from "next/server";
import { frontPadConfigStatus } from "@/lib/frontpad";
import { resolveFrontPadHookStatuses } from "@/lib/frontpad-status";
import { readWebhookLog } from "@/lib/webhook-log";

const DEFAULT_HOOK_URL = "https://vechera-cafe.ru/api/frontpad/webhook";

/** Диагностика: настроены ли секреты FrontPad по точкам (без раскрытия). */
export async function GET() {
  const status = frontPadConfigStatus();
  const hookUrl = process.env.FRONTPAD_HOOK_URL?.trim() || DEFAULT_HOOK_URL;
  const hook = resolveFrontPadHookStatuses();
  const recentWebhooks = await readWebhookLog(10);
  const seenStatuses = [...new Set(recentWebhooks.map((e) => e.status).filter(Boolean))];

  return NextResponse.json({
    ok: true,
    configured: status.configured,
    mode: status.configured ? "live" : "stub",
    accounts: {
      center: status.center,
      hippodrome: status.hippodrome,
      dualAccounts: status.dualAccounts,
      secretsMatch: status.secretsMatch,
    },
    webhook: {
      url: hookUrl,
      envRaw: hook.envRaw ?? null,
      effectiveStatuses: hook.codes,
      source: hook.source,
      recent: recentWebhooks,
      seenStatusCodes: seenStatuses,
      hint:
        hook.source === "fixed"
          ? "На сервере устаревший FRONTPAD_HOOK_STATUSES — код авто-исправляет на 1,3,4,12,10,11. Обновите .env и сделайте новый заказ."
          : hook.codes.length > 0 &&
              !hook.codes.includes("3") &&
              !hook.codes.includes("4")
            ? "В hook_status нет кодов 3 и 4 — статусы «Готовится» и «В пути» не придут."
            : null,
    },
    hooks: {
      webhook: "/api/frontpad/webhook",
      products: "/api/frontpad/products",
      status: "/api/frontpad/status",
      client: "/api/frontpad/client",
      certificate: "/api/frontpad/certificate",
      stops: "/api/frontpad/stops",
    },
    message: status.secretsMatch
      ? "ОШИБКА: один и тот же секрет FrontPad у центра и ипподрома — заказы попадут в один аккаунт"
      : status.dualAccounts
        ? "Два аккаунта FrontPad: центр и ипподром — заказы уходят строго в свой аккаунт"
        : status.configured
          ? "Настроен только один аккаунт FrontPad — заказы второй точки будут отклонены"
          : "Нет секретов FrontPad — заказы в stub-режиме",
  });
}
