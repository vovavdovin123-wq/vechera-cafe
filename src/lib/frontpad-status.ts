/**
 * Коды статусов FrontPad — «Код API» из Справочники → Статусы.
 * У «Вечера»: 1, 3, 4, 12, 10, 11.
 */
export const FRONTPAD_STATUS_LABELS: Record<string, string> = {
  "1": "Принят",
  "3": "Готовится",
  "4": "В пути на адрес",
  "10": "Доставлен",
  "11": "Отменён",
  "12": "Готов",
  "13": "Передан курьеру",
  "14": "В пути на адрес",
  "15": "Уточняем заказ",
};

/** Подписи для самовывоза (коды 4/10/12). */
const PICKUP_OVERRIDES: Partial<Record<string, string>> = {
  "4": "Можно забирать",
  "10": "Получен",
  "12": "Готов к выдаче",
};

/** Текст из get_status FrontPad → подпись для гостя. */
const STATUS_TEXT_ALIASES: Record<string, string> = {
  новый: "Принят",
  "в производстве": "Готовится",
  производстве: "Готовится",
  приготовлен: "Готов",
  готов: "Готов",
  "в пути": "В пути на адрес",
  "передан курьеру": "В пути на адрес",
  выполнен: "Доставлен",
  доставлен: "Доставлен",
  отменён: "Отменён",
  отменен: "Отменён",
  отказ: "Отменён",
};

export const FRONTPAD_DEFAULT_HOOK_STATUSES = [
  "1",
  "3",
  "4",
  "12",
  "10",
  "11",
];

/** Устаревший конфиг на сервере — без кодов «Вечера» 3 и 4. */
const LEGACY_HOOK_STATUSES = new Set(["13", "14", "15"]);

/**
 * Коды hook_status для new_order.
 * none/off = не передавать (только глобальный webhook в FrontPad).
 * Авто-исправляет старый .env с 13–15 вместо 3,4.
 */
export function resolveFrontPadHookStatuses(): {
  codes: string[];
  source: "none" | "env" | "default" | "fixed";
  envRaw?: string;
} {
  const raw = process.env.FRONTPAD_HOOK_STATUSES?.trim();
  if (raw === "none" || raw === "off") {
    return { codes: [], source: "none", envRaw: raw };
  }
  if (!raw) {
    return { codes: [...FRONTPAD_DEFAULT_HOOK_STATUSES], source: "default" };
  }

  const codes = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const hasLegacy = codes.some((c) => LEGACY_HOOK_STATUSES.has(c));
  const missingVechera = !codes.includes("3") || !codes.includes("4");

  if (hasLegacy && missingVechera) {
    console.warn(
      "[FrontPad] FRONTPAD_HOOK_STATUSES устарел, используем 1,3,4,12,10,11:",
      raw,
    );
    return {
      codes: [...FRONTPAD_DEFAULT_HOOK_STATUSES],
      source: "fixed",
      envRaw: raw,
    };
  }

  return { codes, source: "env", envRaw: raw };
}

export const DEFAULT_CUSTOMER_STATUS = "Принят";

function labelsFromEnv(): Record<string, string> {
  const raw = process.env.FRONTPAD_STATUS_LABELS?.trim();
  if (!raw) return {};
  const out: Record<string, string> = {};
  for (const part of raw.split(",")) {
    const [code, ...nameParts] = part.split("=");
    const key = code?.trim();
    const name = nameParts.join("=").trim();
    if (key && name) out[key] = name;
  }
  return out;
}

const ENV_LABELS = labelsFromEnv();

export type StatusFormatOptions = {
  fulfillment?: "delivery" | "pickup";
};

export function formatFrontPadStatus(
  raw?: string | null,
  options?: StatusFormatOptions,
): string {
  if (!raw) return DEFAULT_CUSTOMER_STATUS;
  const key = String(raw).trim();

  if (ENV_LABELS[key]) return ENV_LABELS[key];

  if (/^\d+$/.test(key)) {
    if (options?.fulfillment === "pickup" && PICKUP_OVERRIDES[key]) {
      return PICKUP_OVERRIDES[key]!;
    }
    if (FRONTPAD_STATUS_LABELS[key]) return FRONTPAD_STATUS_LABELS[key];
    return DEFAULT_CUSTOMER_STATUS;
  }

  if (/[а-яА-Я]/.test(key)) {
    const normalized = key.toLowerCase().replace(/\s+/g, " ").trim();
    if (STATUS_TEXT_ALIASES[normalized]) return STATUS_TEXT_ALIASES[normalized];
    return key;
  }

  return DEFAULT_CUSTOMER_STATUS;
}

export function allFrontPadStatusLabels(): Record<string, string> {
  return { ...FRONTPAD_STATUS_LABELS, ...ENV_LABELS };
}
