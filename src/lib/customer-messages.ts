/** Сообщения для гостя — без упоминания FrontPad, .env, артикулов и т.п. */

const DEV_MARKERS =
  /frontpad|FRONTPAD|артикул|\.env|админк|webhook|секрет|stub|frontpad-article|get_status|new_order/i;

export function sanitizeCustomerMessage(
  raw: string | undefined,
  fallback: string,
): string {
  if (!raw?.trim()) return fallback;
  const msg = raw.trim();
  if (!DEV_MARKERS.test(msg)) return msg;

  if (/артикул|invalid_product|товар/i.test(msg)) {
    return "Некоторые блюда сейчас недоступны для заказа. Обновите корзину или выберите другие позиции.";
  }
  if (/смена|cash_close/i.test(msg)) {
    return "Сейчас не принимаем онлайн-заказы. Попробуйте позже или позвоните в кафе.";
  }
  if (/лимит|requests_limit/i.test(msg)) {
    return "Сервис временно перегружен. Попробуйте через минуту.";
  }
  if (/не найден|invalid_order|invalid_client/i.test(msg)) {
    return "Заказ обрабатывается. Статус обновится автоматически.";
  }
  if (/секрет|не настроен|заглушк|api_off|invalid_plant/i.test(msg)) {
    return "Не удалось принять заказ онлайн. Позвоните в кафе — мы поможем оформить заказ.";
  }
  if (/связ|сеть|недоступ/i.test(msg)) {
    return "Не удалось отправить заказ. Проверьте интернет и попробуйте ещё раз.";
  }

  return fallback;
}

export function sanitizeOrderSuccessMessage(
  raw: string | undefined,
  orderNumber?: string,
): string {
  if (orderNumber) return `Заказ №${orderNumber} принят`;
  if (raw && !DEV_MARKERS.test(raw) && /принят/i.test(raw)) return raw;
  return "Заказ принят";
}
