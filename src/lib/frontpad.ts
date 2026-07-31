import type { FranchiseId, OrderPayload } from "./types";

/**
 * FrontPad API — POST form-urlencoded на
 * https://app.frontpad.ru/api/index.php?МЕТОД
 *
 * Методы: new_order | get_status | get_client | get_certificate | get_products | get_stops
 * Лимиты: ≤30 запросов/мин, ≤2/сек; get_products — не чаще 1 раза в час.
 * Документация: https://github.com/n0rn/frontpad
 */

const FRONTPAD_SECRET = process.env.FRONTPAD_SECRET?.trim();
const FRONTPAD_BASE = "https://app.frontpad.ru/api/index.php";
const SEND_PRICES = process.env.FRONTPAD_SEND_PRICES === "1";

export function isFrontPadConfigured(): boolean {
  return Boolean(FRONTPAD_SECRET);
}

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
  status?: string;
  name?: string;
  street?: string;
  home?: string;
  pod?: string;
  et?: string;
  apart?: string;
  mail?: string;
  descr?: string;
  card?: string;
  sale?: string | number;
  score?: string | number;
  amount?: string | number;
  product_id?: string | Record<string, string>;
  price?: string | number | Record<string, string>;
};

export const ERROR_MESSAGES: Record<string, string> = {
  invalid_secret: "Неверный секрет FrontPad",
  requests_limit: "Превышен лимит запросов к FrontPad",
  api_off: "API FrontPad выключен в настройках программы",
  invalid_plant: "На текущем тарифе FrontPad API недоступен",
  cash_close: "Смена в FrontPad закрыта — откройте смену",
  invalid_product_keys: "Неверные артикулы товаров (проверьте артикулы в меню)",
  invalid_certificate: "Неверный сертификат",
  invalid_client_phone: "Клиент с таким телефоном не найден",
  invalid_order_id: "Заказ не найден в FrontPad",
  invalid_products: "В FrontPad нет товаров с артикулами для выгрузки",
  invalid_method: "Метод статуса FrontPad недоступен",
  no_stops: "Стоп-лист пуст",
};

async function postFrontPad(
  method: string,
  fields: Record<string, string>,
): Promise<{ ok: true; raw: FrontPadApiResponse } | { ok: false; message: string; raw?: unknown; code?: string }> {
  if (!FRONTPAD_SECRET) {
    return { ok: false, message: "FRONTPAD_SECRET не задан в .env" };
  }

  const form = new URLSearchParams({ secret: FRONTPAD_SECRET, ...fields });
  const url = `https://app.frontpad.ru/api/index.php?${method}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: form.toString(),
      cache: "no-store",
    });

    const raw = (await res.json().catch(() => null)) as FrontPadApiResponse | null;
    if (!raw || raw.result !== "success") {
      // FrontPad иногда кладёт код в error, иногда в status
      const code = String(
        raw?.error ||
          (raw?.result === "error" ? raw?.status : "") ||
          "unknown",
      );
      return {
        ok: false,
        code,
        message: ERROR_MESSAGES[code] || `Ошибка FrontPad: ${code}`,
        raw,
      };
    }

    return { ok: true, raw };
  } catch (error) {
    console.error(`[FrontPad ${method}]`, error);
    return { ok: false, message: "Не удалось связаться с FrontPad" };
  }
}

function affiliateFor(franchiseId: FranchiseId): string | undefined {
  if (franchiseId === "center") {
    return process.env.FRONTPAD_AFFILIATE_CENTER?.trim() || undefined;
  }
  return process.env.FRONTPAD_AFFILIATE_HIPPODROME?.trim() || undefined;
}

function pointFor(franchiseId: FranchiseId): string | undefined {
  if (franchiseId === "center") {
    return process.env.FRONTPAD_POINT_CENTER?.trim() || undefined;
  }
  return process.env.FRONTPAD_POINT_HIPPODROME?.trim() || undefined;
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
  if (order.address?.doorCode) parts.push(`Домофон: ${order.address.doorCode}`);
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

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "").slice(0, 50);
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

  // Модификаторы: product_mod[i] = индекс родителя в product[]
  const mods = order.items
    .map((item, index) =>
      item.frontpadModParentIndex !== undefined
        ? { index, parent: item.frontpadModParentIndex }
        : null,
    )
    .filter(Boolean) as Array<{ index: number; parent: number }>;
  if (mods.length) {
    // FrontPad ждёт product_mod как параллельный массив ключей родителя —
    // заполняем только позиции модификаторов (остальные не отправляем через sparse append)
    for (const m of mods) {
      form.append(`product_mod[${m.index}]`, String(m.parent));
    }
  }

  if (order.customerName) form.set("name", order.customerName.slice(0, 50));
  if (order.customerPhone) {
    form.set("phone", normalizePhone(order.customerPhone));
  }
  if (order.customerEmail) form.set("mail", order.customerEmail.slice(0, 50));

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

  if (order.salePercent && order.salePercent >= 1 && order.salePercent <= 100) {
    form.set("sale", String(Math.floor(order.salePercent)));
  } else if (order.saleAmount && order.saleAmount > 0) {
    form.set("sale_amount", String(Math.floor(order.saleAmount)));
  }

  if (order.score && order.score > 0) form.set("score", String(Math.floor(order.score)));
  if (order.card) form.set("card", order.card.replace(/\D/g, "").slice(0, 16));
  if (order.certificate) form.set("certificate", order.certificate.slice(0, 50));
  if (order.person) form.set("person", String(order.person).slice(0, 2));
  if (order.pay) form.set("pay", order.pay.slice(0, 50));
  if (order.datetime) form.set("datetime", order.datetime);

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
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
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

/** Статус заказа по order_id или телефону (только за сегодня). Без циклов. */
export async function fetchFrontPadStatus(params: {
  orderId?: string;
  clientPhone?: string;
}): Promise<{
  ok: boolean;
  status?: string;
  message?: string;
  raw?: unknown;
  code?: string;
}> {
  const orderId = params.orderId?.trim();
  const phone = params.clientPhone?.trim();

  // Stub / нечисловой id — в FrontPad не существует
  if (orderId && (/^VC-/i.test(orderId) || !/^\d+$/.test(orderId))) {
    return {
      ok: true,
      status: "Принят",
      message: "Локальный заказ (без live-id FrontPad)",
    };
  }

  const fields: Record<string, string> = {};
  if (orderId) fields.order_id = orderId;
  else if (phone) fields.client_phone = normalizePhone(phone);
  else return { ok: false, message: "Нужен orderId или clientPhone" };

  const res = await postFrontPad("get_status", fields);
  if (!res.ok) {
    // Запасной вариант: по телефону, если id не сработал
    if (orderId && phone && res.code !== "requests_limit") {
      const byPhone = await postFrontPad("get_status", {
        client_phone: normalizePhone(phone),
      });
      if (byPhone.ok) {
        return {
          ok: true,
          status:
            byPhone.raw.status !== undefined
              ? String(byPhone.raw.status)
              : "Принят",
          raw: byPhone.raw,
        };
      }
    }

    if (res.code === "invalid_method") {
      return {
        ok: true,
        status: "Принят в FrontPad",
        message:
          "Автостатус временно недоступен. Обновления приходят по webhook или смотрите в программе FrontPad.",
      };
    }

    return res;
  }

  return {
    ok: true,
    status: res.raw.status !== undefined ? String(res.raw.status) : "Принят",
    raw: res.raw,
  };
}

/** Карточка клиента по телефону (имя, адрес, скидка, баллы). Без циклов. */
export async function fetchFrontPadClient(clientPhone: string): Promise<{
  ok: boolean;
  client?: {
    name?: string;
    street?: string;
    home?: string;
    pod?: string;
    et?: string;
    apart?: string;
    mail?: string;
    descr?: string;
    card?: string;
    sale?: string;
    score?: string;
  };
  message?: string;
  raw?: unknown;
}> {
  const res = await postFrontPad("get_client", {
    client_phone: normalizePhone(clientPhone),
  });
  if (!res.ok) return res;

  const r = res.raw;
  return {
    ok: true,
    client: {
      name: r.name,
      street: r.street,
      home: r.home,
      pod: r.pod,
      et: r.et,
      apart: r.apart,
      mail: r.mail,
      descr: r.descr,
      card: r.card,
      sale: r.sale !== undefined ? String(r.sale) : undefined,
      score: r.score !== undefined ? String(r.score) : undefined,
    },
    raw: r,
  };
}

/** Проверка сертификата (товар / % / сумма). Без циклов. */
export async function fetchFrontPadCertificate(certificate: string): Promise<{
  ok: boolean;
  kind?: "product" | "sale" | "amount";
  productId?: string;
  name?: string;
  price?: string;
  sale?: string;
  amount?: string;
  message?: string;
  raw?: unknown;
}> {
  const res = await postFrontPad("get_certificate", {
    certificate: certificate.trim(),
  });
  if (!res.ok) return res;

  const r = res.raw;
  if (r.product_id && typeof r.product_id === "string") {
    return {
      ok: true,
      kind: "product",
      productId: r.product_id,
      name: r.name,
      price: r.price !== undefined ? String(r.price) : undefined,
      raw: r,
    };
  }
  if (r.sale !== undefined) {
    return { ok: true, kind: "sale", sale: String(r.sale), raw: r };
  }
  if (r.amount !== undefined) {
    return { ok: true, kind: "amount", amount: String(r.amount), raw: r };
  }
  return { ok: true, raw: r };
}

export interface FrontPadProduct {
  article: string;
  name: string;
  price: number;
}

/**
 * Список товаров с артикулами из FrontPad.
 * Не чаще 1 раза в час (лимит FrontPad).
 */
export async function fetchFrontPadProducts(): Promise<{
  ok: boolean;
  products: FrontPadProduct[];
  message?: string;
  raw?: unknown;
}> {
  const res = await postFrontPad("get_products", {});
  if (!res.ok) {
    return { ok: false, products: [], message: res.message, raw: res.raw };
  }

  const ids = res.raw.product_id;
  const names = res.raw.name as Record<string, string> | undefined;
  const prices = res.raw.price as Record<string, string> | undefined;

  if (!ids || typeof ids !== "object") {
    return { ok: true, products: [], raw: res.raw };
  }

  const products: FrontPadProduct[] = Object.keys(ids).map((key) => ({
    article: String((ids as Record<string, string>)[key]),
    name: names?.[key] ?? "",
    price: Number(prices?.[key] ?? 0) || 0,
  }));

  return { ok: true, products, raw: res.raw };
}

/** Стоп-лист: артикулы недоступных товаров. */
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
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: form.toString(),
      cache: "no-store",
    });
    const raw = (await res.json().catch(() => null)) as FrontPadApiResponse & {
      product_id?: Record<string, string>;
      error?: string;
    } | null;

    if (!raw) {
      return { ok: false, articles: [], message: "Пустой ответ get_stops" };
    }

    // Пустой стоп-лист FrontPad иногда отдаёт как error: no_stops
    if (raw.error === "no_stops") {
      return { ok: true, articles: [] };
    }

    if (raw.result !== "success") {
      return {
        ok: false,
        articles: [],
        message: ERROR_MESSAGES[raw.error || ""] || "Ошибка get_stops",
      };
    }

    if (!raw.product_id) return { ok: true, articles: [] };
    return { ok: true, articles: Object.values(raw.product_id) };
  } catch (error) {
    console.error("[FrontPad get_stops]", error);
    return { ok: false, articles: [], message: "Сеть FrontPad недоступна" };
  }
}
