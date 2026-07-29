import type { FranchiseId, OrderPayload } from "./types";

/**
 * FrontPad API — документация: POST form на
 * https://app.frontpad.ru/api/index.php?МЕТОД
 *
 * Обязательно: secret, product[], product_kol[]
 * Метод new_order — только после действия клиента.
 * Лимит: ≤30 запросов/мин, ≤2/сек (get_products — 1/час).
 */

const FRONTPAD_SECRET = process.env.FRONTPAD_SECRET?.trim();
const FRONTPAD_BASE = "https://app.frontpad.ru/api/index.php";
const SEND_PRICES = process.env.FRONTPAD_SEND_PRICES === "1";

export interface FrontPadResult {
  ok: boolean;
  orderId: string;
  orderNumber?: string;
  mode: "live" | "stub";
  message: string;
  warnings?: unknown;
  raw?: unknown;
}

type FrontPadApiResponse = {
  result?: string;
  error?: string;
  order_id?: string | number;
  order_number?: string | number;
  warnings?: unknown;
  description?: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid_secret: "Неверный секрет FrontPad",
  requests_limit: "Превышен лимит запросов к FrontPad",
  api_off: "API FrontPad выключен в настройках программы",
  invalid_plant: "На текущем тарифе FrontPad API недоступен",
  cash_close: "Смена в FrontPad закрыта — откройте смену",
  invalid_product_keys: "Неверные артикулы товаров (проверьте артикулы в меню)",
  invalid_certificate: "Неверный сертификат",
  invalid_client_phone: "Клиент с таким телефоном не найден",
};

function affiliateFor(franchiseId: FranchiseId): string | undefined {
  if (franchiseId === "center" || franchiseId === "centerCoffee") {
    const coffee =
      franchiseId === "centerCoffee"
        ? process.env.FRONTPAD_AFFILIATE_CENTER_COFFEE?.trim()
        : undefined;
    return (
      coffee || process.env.FRONTPAD_AFFILIATE_CENTER?.trim() || undefined
    );
  }
  const coffee =
    franchiseId === "hippodromeCoffee"
      ? process.env.FRONTPAD_AFFILIATE_HIPPODROME_COFFEE?.trim()
      : undefined;
  return (
    coffee || process.env.FRONTPAD_AFFILIATE_HIPPODROME?.trim() || undefined
  );
}

function pointFor(franchiseId: FranchiseId): string | undefined {
  if (franchiseId === "center" || franchiseId === "centerCoffee") {
    const coffee =
      franchiseId === "centerCoffee"
        ? process.env.FRONTPAD_POINT_CENTER_COFFEE?.trim()
        : undefined;
    return coffee || process.env.FRONTPAD_POINT_CENTER?.trim() || undefined;
  }
  const coffee =
    franchiseId === "hippodromeCoffee"
      ? process.env.FRONTPAD_POINT_HIPPODROME_COFFEE?.trim()
      : undefined;
  return coffee || process.env.FRONTPAD_POINT_HIPPODROME?.trim() || undefined;
}

/** Разбор «улица дом» → street + home для FrontPad */
export function splitAddress(input: string): { street: string; home: string } {
  const raw = input.trim();
  if (!raw) return { street: "", home: "" };
  const m = raw.match(/^(.+?)[\s,]+(\d+[а-яА-Яa-zA-Z/\-]*)\s*$/u);
  if (m) {
    return {
      street: m[1].replace(/[,\s]+$/g, "").trim().slice(0, 50),
      home: m[2].trim().slice(0, 50),
    };
  }
  return { street: raw.slice(0, 50), home: "" };
}

function buildDescr(order: OrderPayload): string {
  const parts: string[] = [];
  if (order.fulfillment === "pickup") parts.push("Самовывоз");
  if (order.fulfillment === "delivery") parts.push("Доставка");
  if (order.comment) parts.push(order.comment);
  if (order.address?.note) parts.push(order.address.note);
  return parts.join(". ").slice(0, 100);
}

function appendArray(
  form: URLSearchParams,
  key: string,
  values: Array<string | number>,
) {
  values.forEach((value, index) => {
    form.append(`${key}[${index}]`, String(value));
  });
}

export async function sendOrderToFrontPad(
  order: OrderPayload,
): Promise<FrontPadResult> {
  const stubId = `VC-${Date.now().toString(36).toUpperCase()}`;

  if (!FRONTPAD_SECRET) {
    console.info("[FrontPad stub] order accepted", {
      orderId: stubId,
      franchise: order.franchiseId,
      total: order.total,
      items: order.items,
    });
    return {
      ok: true,
      orderId: stubId,
      mode: "stub",
      message:
        "Заказ принят (заглушка). Добавьте FRONTPAD_SECRET в .env для боевой отправки.",
    };
  }

  const articles = order.items.map((item) => item.frontpadArticle?.trim() || "");
  if (articles.some((a) => !a)) {
    return {
      ok: false,
      orderId: stubId,
      mode: "live",
      message:
        "У части блюд нет артикула FrontPad. Укажите цифровой артикул в админке (Меню).",
    };
  }

  const form = new URLSearchParams();
  form.set("secret", FRONTPAD_SECRET);

  appendArray(form, "product", articles);
  appendArray(
    form,
    "product_kol",
    order.items.map((item) => item.quantity),
  );

  if (SEND_PRICES) {
    appendArray(
      form,
      "product_price",
      order.items.map((item) => item.price),
    );
  }

  if (order.customerName) form.set("name", order.customerName.slice(0, 50));
  if (order.customerPhone) {
    form.set("phone", order.customerPhone.replace(/[^\d+]/g, "").slice(0, 50));
  }

  const descr = buildDescr(order);
  if (descr) form.set("descr", descr);

  if (order.fulfillment === "delivery" && order.address?.street) {
    const { street, home } = splitAddress(order.address.street);
    if (street) form.set("street", street);
    if (home) form.set("home", home);
    if (order.address.entrance) {
      form.set("pod", order.address.entrance.slice(0, 2));
    }
    if (order.address.floor) form.set("et", order.address.floor.slice(0, 2));
    if (order.address.apartment) {
      form.set("apart", order.address.apartment.slice(0, 50));
    }
  }

  const affiliate = affiliateFor(order.franchiseId);
  const point = pointFor(order.franchiseId);
  if (affiliate) form.set("affiliate", affiliate);
  if (point) form.set("point", point);

  const channel = process.env.FRONTPAD_CHANNEL?.trim();
  if (channel) form.set("channel", channel);

  const tags = process.env.FRONTPAD_TAGS?.split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (tags?.length) appendArray(form, "tags", tags.slice(0, 10));

  const hookStatuses = process.env.FRONTPAD_HOOK_STATUSES?.split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (hookStatuses?.length) {
    appendArray(form, "hook_status", hookStatuses.slice(0, 5));
  }

  const hookUrl = process.env.FRONTPAD_HOOK_URL?.trim();
  if (hookUrl) form.set("hook_url", hookUrl);

  try {
    const res = await fetch(`${FRONTPAD_BASE}?new_order`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: form.toString(),
      cache: "no-store",
    });

    const raw = (await res.json().catch(() => null)) as FrontPadApiResponse | null;

    if (!raw || raw.result !== "success") {
      const code = raw?.error || "unknown";
      return {
        ok: false,
        orderId: stubId,
        mode: "live",
        message: ERROR_MESSAGES[code] || `Ошибка FrontPad: ${code}`,
        raw,
      };
    }

    const orderId = String(raw.order_id ?? stubId);
    const orderNumber =
      raw.order_number !== undefined ? String(raw.order_number) : undefined;

    return {
      ok: true,
      orderId,
      orderNumber,
      mode: "live",
      message: orderNumber
        ? `Заказ №${orderNumber} отправлен в FrontPad`
        : "Заказ отправлен в FrontPad",
      warnings: raw.warnings,
      raw,
    };
  } catch (error) {
    console.error("[FrontPad]", error);
    return {
      ok: false,
      orderId: stubId,
      mode: "live",
      message: "Не удалось связаться с FrontPad",
    };
  }
}

/** Получение стоп-листа (артикулы недоступных товаров). Не чаще разумного интервала. */
export async function fetchFrontPadStops(): Promise<{
  ok: boolean;
  articles: string[];
  message?: string;
}> {
  if (!FRONTPAD_SECRET) {
    return { ok: false, articles: [], message: "Нет FRONTPAD_SECRET" };
  }

  try {
    const form = new URLSearchParams({ secret: FRONTPAD_SECRET });
    const res = await fetch(`${FRONTPAD_BASE}?get_stops`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: form.toString(),
      cache: "no-store",
    });
    const raw = (await res.json().catch(() => null)) as FrontPadApiResponse & {
      product_id?: Record<string, string>;
      error?: string;
    } | null;

    if (!raw || raw.result !== "success") {
      return {
        ok: false,
        articles: [],
        message: ERROR_MESSAGES[raw?.error || ""] || "Ошибка get_stops",
      };
    }

    if (raw.error === "no_stops" || !raw.product_id) {
      return { ok: true, articles: [] };
    }

    return { ok: true, articles: Object.values(raw.product_id) };
  } catch (error) {
    console.error("[FrontPad get_stops]", error);
    return { ok: false, articles: [], message: "Сеть FrontPad недоступна" };
  }
}
