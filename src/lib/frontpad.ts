import {
  FRONTPAD_DEFAULT_HOOK_STATUSES,
} from "@/lib/frontpad-status";
import type { FranchiseId, OrderPayload } from "./types";

/**
 * FrontPad API — POST form-urlencoded на
 * https://app.frontpad.ru/api/index.php?МЕТОД
 *
 * Два аккаунта FrontPad (центр / ипподром) → два секрета в .env.
 * Fallback: один общий FRONTPAD_SECRET на обе точки.
 */

const FRONTPAD_BASE = "https://app.frontpad.ru/api/index.php";
const SEND_PRICES = process.env.FRONTPAD_SEND_PRICES === "1";

/** Секрет для точки. Центр и ипподром — разные аккаунты FP. */
export function secretFor(franchiseId?: FranchiseId): string | undefined {
  const shared = process.env.FRONTPAD_SECRET?.trim();
  if (franchiseId === "hippodrome") {
    return (
      process.env.FRONTPAD_SECRET_HIPPODROME?.trim() ||
      shared ||
      undefined
    );
  }
  if (franchiseId === "center") {
    return (
      process.env.FRONTPAD_SECRET_CENTER?.trim() || shared || undefined
    );
  }
  return (
    process.env.FRONTPAD_SECRET_CENTER?.trim() ||
    process.env.FRONTPAD_SECRET_HIPPODROME?.trim() ||
    shared ||
    undefined
  );
}

export function isFrontPadConfigured(): boolean {
  return Boolean(
    process.env.FRONTPAD_SECRET_CENTER?.trim() ||
      process.env.FRONTPAD_SECRET_HIPPODROME?.trim() ||
      process.env.FRONTPAD_SECRET?.trim(),
  );
}

export function frontPadConfigStatus() {
  const center = Boolean(
    process.env.FRONTPAD_SECRET_CENTER?.trim() ||
      process.env.FRONTPAD_SECRET?.trim(),
  );
  const hippodrome = Boolean(
    process.env.FRONTPAD_SECRET_HIPPODROME?.trim() ||
      process.env.FRONTPAD_SECRET?.trim(),
  );
  return {
    configured: center || hippodrome,
    center,
    hippodrome,
    dualAccounts: Boolean(
      process.env.FRONTPAD_SECRET_CENTER?.trim() &&
        process.env.FRONTPAD_SECRET_HIPPODROME?.trim(),
    ),
  };
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
  secret?: string,
): Promise<{ ok: true; raw: FrontPadApiResponse } | { ok: false; message: string; raw?: unknown; code?: string }> {
  const key = secret?.trim();
  if (!key) {
    return {
      ok: false,
      message:
        "Секрет FrontPad для этой точки не задан (FRONTPAD_SECRET_CENTER / _HIPPODROME)",
    };
  }

  const form = new URLSearchParams({ secret: key, ...fields });
  const url = `${FRONTPAD_BASE}?${method}`;

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

/**
 * Тело как в примерах FrontPad/PHP: product[0]=…&product_kol[0]=…
 * Скобки в ключах НЕ кодируем — иначе PHP иногда читает только первый элемент.
 */
function buildPhpFormBody(
  scalars: Record<string, string>,
  arrays: Record<string, Array<string | number>>,
): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(scalars)) {
    if (value === "") continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }
  for (const [key, values] of Object.entries(arrays)) {
    values.forEach((value, index) => {
      parts.push(`${key}[${index}]=${encodeURIComponent(String(value))}`);
    });
  }
  return parts.join("&");
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "").slice(0, 50);
}

function describeProductWarnings(
  warnings: unknown,
  articles: string[],
): string | undefined {
  if (!warnings || typeof warnings !== "object") return undefined;
  const w = warnings as Record<string, unknown>;
  const badKeys = w.invalid_product_keys;
  if (!badKeys || typeof badKeys !== "object") return undefined;

  const indexes = Object.values(badKeys as Record<string, string>).map((v) =>
    Number(v),
  );
  const missing = indexes
    .map((i) => articles[i])
    .filter((a): a is string => Boolean(a));

  if (!missing.length) {
    return "Часть позиций не принята FrontPad (проверьте артикулы).";
  }
  return `В FrontPad нет товаров с артикулами: ${missing.join(", ")}. Создайте их в программе с теми же номерами.`;
}

export async function sendOrderToFrontPad(
  order: OrderPayload,
): Promise<FrontPadResult> {
  const stubId = `VC-${Date.now().toString(36).toUpperCase()}`;
  const secret = secretFor(order.franchiseId);

  if (!secret) {
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
        "Заказ принят (заглушка). Добавьте FRONTPAD_SECRET_CENTER и FRONTPAD_SECRET_HIPPODROME в .env.",
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

  // Склеиваем одинаковые артикулы (кол-во суммируем) — так надёжнее для FrontPad
  const merged = new Map<
    string,
    { article: string; quantity: number; price: number }
  >();
  for (const item of order.items) {
    const article = item.frontpadArticle!.trim();
    const prev = merged.get(article);
    if (prev) {
      prev.quantity += item.quantity;
    } else {
      merged.set(article, {
        article,
        quantity: item.quantity,
        price: item.price,
      });
    }
  }
  const lines = [...merged.values()];
  const productArticles = lines.map((l) => l.article);
  const productQty = lines.map((l) => l.quantity);
  const productPrice = lines.map((l) => l.price);

  const scalars: Record<string, string> = {
    secret,
  };

  const mods = order.items
    .map((item, index) =>
      item.frontpadModParentIndex !== undefined
        ? { index, parent: item.frontpadModParentIndex }
        : null,
    )
    .filter(Boolean) as Array<{ index: number; parent: number }>;

  if (order.customerName) scalars.name = order.customerName.slice(0, 50);
  if (order.customerPhone) {
    scalars.phone = normalizePhone(order.customerPhone);
  }
  if (order.customerEmail) scalars.mail = order.customerEmail.slice(0, 50);

  const descr = buildDescr(order);
  if (descr) scalars.descr = descr;

  if (order.fulfillment === "delivery" && order.address?.street) {
    const { street, home } = splitAddress(order.address.street);
    if (street) scalars.street = street;
    if (home) scalars.home = home;
    if (order.address.entrance) {
      scalars.pod = order.address.entrance.slice(0, 2);
    }
    if (order.address.floor) scalars.et = order.address.floor.slice(0, 2);
    if (order.address.apartment) {
      scalars.apart = order.address.apartment.slice(0, 50);
    }
  }

  if (order.salePercent && order.salePercent >= 1 && order.salePercent <= 100) {
    scalars.sale = String(Math.floor(order.salePercent));
  } else if (order.saleAmount && order.saleAmount > 0) {
    scalars.sale_amount = String(Math.floor(order.saleAmount));
  }

  if (order.score && order.score > 0) {
    scalars.score = String(Math.floor(order.score));
  }
  if (order.card) scalars.card = order.card.replace(/\D/g, "").slice(0, 16);
  if (order.certificate) scalars.certificate = order.certificate.slice(0, 50);
  if (order.person) scalars.person = String(order.person).slice(0, 2);
  if (order.pay) scalars.pay = order.pay.slice(0, 50);
  if (order.datetime) scalars.datetime = order.datetime;

  const affiliate = affiliateFor(order.franchiseId);
  const point = pointFor(order.franchiseId);
  if (affiliate) scalars.affiliate = affiliate;
  if (point) scalars.point = point;

  const channel = process.env.FRONTPAD_CHANNEL?.trim();
  if (channel) scalars.channel = channel;

  const tags = process.env.FRONTPAD_TAGS?.split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const hookStatusesFromEnv = process.env.FRONTPAD_HOOK_STATUSES?.split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const hookStatuses = hookStatusesFromEnv?.length
    ? hookStatusesFromEnv
    : FRONTPAD_DEFAULT_HOOK_STATUSES;

  const hookUrl = process.env.FRONTPAD_HOOK_URL?.trim();
  if (hookUrl) scalars.hook_url = hookUrl;

  let body = buildPhpFormBody(scalars, {
    product: productArticles,
    product_kol: productQty,
    ...(SEND_PRICES ? { product_price: productPrice } : {}),
    ...(tags?.length ? { tags: tags.slice(0, 10) } : {}),
    ...(hookStatuses.length ? { hook_status: hookStatuses.slice(0, 10) } : {}),
  });

  if (mods.length && lines.length === order.items.length) {
    for (const m of mods) {
      body += `&product_mod[${m.index}]=${encodeURIComponent(String(m.parent))}`;
    }
  }

  console.info("[FrontPad new_order]", {
    products: productArticles,
    qty: productQty,
    franchise: order.franchiseId,
    account:
      order.franchiseId === "hippodrome" ? "hippodrome" : "center",
  });

  try {
    const res = await fetch(`${FRONTPAD_BASE}?new_order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body,
      cache: "no-store",
    });

    const raw = (await res.json().catch(() => null)) as FrontPadApiResponse | null;

    if (!raw || raw.result !== "success") {
      const code = String(raw?.error || "unknown");
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

    const warnText = describeProductWarnings(raw.warnings, productArticles);
    const baseMsg = orderNumber
      ? `Заказ №${orderNumber} отправлен в FrontPad`
      : "Заказ отправлен в FrontPad";

    return {
      ok: true,
      orderId,
      orderNumber,
      mode: "live",
      message: warnText ? `${baseMsg}. ${warnText}` : baseMsg,
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
  franchiseId?: FranchiseId;
}): Promise<{
  ok: boolean;
  status?: string;
  message?: string;
  raw?: unknown;
  code?: string;
}> {
  const orderId = params.orderId?.trim();
  const phone = params.clientPhone?.trim();

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

  const secretsToTry = [
    secretFor(params.franchiseId),
    secretFor("center"),
    secretFor("hippodrome"),
  ].filter((s, i, arr): s is string => Boolean(s) && arr.indexOf(s) === i);

  if (!secretsToTry.length) {
    return { ok: false, message: "Нет секрета FrontPad" };
  }

  let lastFail: { ok: false; message: string; raw?: unknown; code?: string } | null =
    null;

  for (const secret of secretsToTry) {
    const res = await postFrontPad("get_status", fields, secret);
    if (res.ok) {
      return {
        ok: true,
        status: res.raw.status !== undefined ? String(res.raw.status) : "1",
        raw: res.raw,
      };
    }
    lastFail = res;

    if (orderId && phone && res.code !== "requests_limit") {
      const byPhone = await postFrontPad(
        "get_status",
        { client_phone: normalizePhone(phone) },
        secret,
      );
      if (byPhone.ok) {
        return {
          ok: true,
          status:
            byPhone.raw.status !== undefined
              ? String(byPhone.raw.status)
              : "1",
          raw: byPhone.raw,
        };
      }
    }

    if (res.code === "invalid_method") {
      return {
        ok: true,
        code: "invalid_method",
        status: "Принят",
        message:
          "Заказ в FrontPad. Статус обновится при смене в программе.",
      };
    }
  }

  return lastFail || { ok: false, message: "Не удалось получить статус" };
}

/** Карточка клиента по телефону (имя, адрес, скидка, баллы). Без циклов. */
export async function fetchFrontPadClient(
  clientPhone: string,
  franchiseId?: FranchiseId,
): Promise<{
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
  const res = await postFrontPad(
    "get_client",
    { client_phone: normalizePhone(clientPhone) },
    secretFor(franchiseId),
  );
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
export async function fetchFrontPadCertificate(
  certificate: string,
  franchiseId?: FranchiseId,
): Promise<{
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
  const res = await postFrontPad(
    "get_certificate",
    { certificate: certificate.trim() },
    secretFor(franchiseId),
  );
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
export async function fetchFrontPadProducts(
  franchiseId?: FranchiseId,
): Promise<{
  ok: boolean;
  products: FrontPadProduct[];
  message?: string;
  raw?: unknown;
}> {
  const res = await postFrontPad("get_products", {}, secretFor(franchiseId));
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
export async function fetchFrontPadStops(
  franchiseId?: FranchiseId,
): Promise<{
  ok: boolean;
  articles: string[];
  message?: string;
}> {
  const secret = secretFor(franchiseId);
  if (!secret) {
    return { ok: false, articles: [], message: "Нет секрета FrontPad для точки" };
  }

  try {
    const form = new URLSearchParams({ secret });
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
