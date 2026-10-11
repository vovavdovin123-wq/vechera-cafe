import type { FeedbackPayload, FranchiseId, OrderPayload } from "./types";
import { FRANCHISES } from "./franchises";
import {
  readTelegramSubscribers,
  telegramBotToken,
  telegramSendMessage,
} from "./telegram-subscribers";

export async function notifyNewOrder(
  order: OrderPayload,
  orderId: string,
  orderNumber?: string,
): Promise<void> {
  const franchise = FRANCHISES[order.franchiseId];
  const title = orderNumber
    ? `Новый заказ №${orderNumber}`
    : `Новый заказ ${orderId}`;
  const lines = [
    `🛒 ${title}`,
    `Точка: ${franchise.shortAddress} (${franchise.address})`,
    `Способ: ${order.fulfillment === "pickup" ? "Самовывоз" : "Доставка"}`,
    `Сумма: ${order.total} ₽`,
    order.customerName ? `Имя: ${order.customerName}` : null,
    order.customerPhone ? `Телефон: ${order.customerPhone}` : null,
    order.address?.street ? `Адрес: ${order.address.street}` : null,
    order.address?.entrance ? `Подъезд: ${order.address.entrance}` : null,
    order.address?.apartment ? `Кв.: ${order.address.apartment}` : null,
    order.comment ? `Комментарий: ${order.comment}` : null,
    "",
    ...order.items.map(
      (i) => `• ${i.name} × ${i.quantity} — ${i.price * i.quantity} ₽`,
    ),
  ].filter(Boolean);

  await dispatchNotification(lines.join("\n"), "order", order.franchiseId);
}

export async function notifyFeedback(
  feedback: FeedbackPayload,
): Promise<void> {
  const franchise = FRANCHISES[feedback.franchiseId];
  const lines = [
    `💬 Анонимная обратная связь`,
    `Франшиза: ${franchise.name}`,
    feedback.name ? `Имя (опц.): ${feedback.name}` : "Анонимно",
    feedback.phone ? `Телефон (опц.): ${feedback.phone}` : null,
    "",
    feedback.message,
  ].filter(Boolean);

  await dispatchNotification(lines.join("\n"), "feedback");
}

function splitChatIds(raw?: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((id) => id.trim())
    .filter(Boolean);
}

async function telegramChatIds(franchiseId?: FranchiseId): Promise<string[]> {
  const ids = new Set<string>();
  for (const id of splitChatIds(process.env.TELEGRAM_CHAT_ID)) ids.add(id);
  for (const id of splitChatIds(process.env.TELEGRAM_CHAT_IDS)) ids.add(id);

  if (franchiseId === "center") {
    for (const id of splitChatIds(process.env.TELEGRAM_CHAT_IDS_CENTER)) {
      ids.add(id);
    }
  }
  if (franchiseId === "hippodrome") {
    for (const id of splitChatIds(process.env.TELEGRAM_CHAT_IDS_HIPPODROME)) {
      ids.add(id);
    }
  }

  const subscribers = await readTelegramSubscribers();
  for (const sub of subscribers) ids.add(sub.chatId);

  return [...ids];
}

async function dispatchNotification(
  text: string,
  kind: "order" | "feedback",
  franchiseId?: FranchiseId,
): Promise<void> {
  const webhook = process.env.NOTIFY_WEBHOOK_URL;
  const chats = await telegramChatIds(franchiseId);

  if (telegramBotToken() && chats.length) {
    await Promise.all(chats.map((chatId) => telegramSendMessage(chatId, text)));
    return;
  }

  if (webhook) {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, text, at: new Date().toISOString() }),
    }).catch((err) => console.error("[notify webhook]", err));
    return;
  }

  console.info(`[notify:${kind} stub]\n${text}`);
}
