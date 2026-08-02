/** Человекочитаемые статусы FrontPad (коды из webhook / get_status). */
export const FRONTPAD_STATUS_LABELS: Record<string, string> = {
  "1": "Новый",
  "2": "Готовится",
  "3": "В пути",
  "4": "Выполнен",
  "5": "Отменён",
};

export function formatFrontPadStatus(raw?: string | null): string {
  if (!raw) return "Принят";
  const key = String(raw).trim();
  return FRONTPAD_STATUS_LABELS[key] ?? key;
}
