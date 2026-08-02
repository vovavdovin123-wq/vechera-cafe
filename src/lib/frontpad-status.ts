/**
 * Коды статусов FrontPad (справочник API).
 * @see https://app.frontpad.ru — Настройки → API → статусы заказов
 */
export const FRONTPAD_STATUS_LABELS: Record<string, string> = {
  "1": "Новый",
  "10": "Выполнен",
  "11": "Отменён",
  "12": "Приготовлен",
  "13": "Передан курьеру",
  "14": "В пути",
  "15": "Корректировка",
};

/** Статусы, при которых FrontPad шлёт webhook (если не задано в .env). */
export const FRONTPAD_DEFAULT_HOOK_STATUSES = [
  "1",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
];

export function formatFrontPadStatus(raw?: string | null): string {
  if (!raw) return "Принят";
  const key = String(raw).trim();
  if (FRONTPAD_STATUS_LABELS[key]) return FRONTPAD_STATUS_LABELS[key];
  // get_status иногда возвращает текст («В производстве»)
  if (/[а-яА-Я]/.test(key)) return key;
  return `Статус ${key}`;
}
