/**
 * Коды статусов FrontPad — «Код API» из Справочники → Статусы.
 * У «Вечера»: 1, 3, 4, 12, 10, 11 (см. скрин в настройках FP).
 */
export const FRONTPAD_STATUS_LABELS: Record<string, string> = {
  "1": "Новый",
  "3": "В производстве",
  "4": "В пути",
  "10": "Выполнен",
  "11": "Отменён",
  "12": "Приготовлен",
  // Другие аккаунты FP — на случай fallback
  "13": "Передан курьеру",
  "14": "В пути",
  "15": "Корректировка",
};

/** Webhook для всех статусов «Вечера» (если не задано в .env). */
export const FRONTPAD_DEFAULT_HOOK_STATUSES = [
  "1",
  "3",
  "4",
  "12",
  "10",
  "11",
];

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

export function formatFrontPadStatus(raw?: string | null): string {
  if (!raw) return "Принят";
  const key = String(raw).trim();
  if (ENV_LABELS[key]) return ENV_LABELS[key];
  if (FRONTPAD_STATUS_LABELS[key]) return FRONTPAD_STATUS_LABELS[key];
  // get_status иногда возвращает текст («В производстве»)
  if (/[а-яА-Я]/.test(key)) return key;
  return `Статус ${key}`;
}

export function allFrontPadStatusLabels(): Record<string, string> {
  return { ...FRONTPAD_STATUS_LABELS, ...ENV_LABELS };
}
