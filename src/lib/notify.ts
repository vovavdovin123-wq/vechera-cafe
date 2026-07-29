import type { FeedbackPayload, OrderPayload } from "./types";
import { FRANCHISES } from "./franchises";

/**
 * Order / feedback notifications stub.
 * Later: wire Telegram bot, email, or dashboard webhook via env vars.
 */
export async function notifyNewOrder(
  order: OrderPayload,
  orderId: string,
): Promise<void> {
  const franchise = FRANCHISES[order.franchiseId];
  const lines = [
    `🛒 Новый заказ ${orderId}`,
    `Точка: ${franchise.address}`,
    `Способ: ${order.fulfillment === "pickup" ? "Самовывоз" : "Доставка"}`,
    `Сумма: ${order.total} ₽`,
    order.customerName ? `Имя: ${order.customerName}` : null,
    order.customerPhone ? `Телефон: ${order.customerPhone}` : null,
    order.address?.street ? `Адрес: ${order.address.street}` : null,
    order.address?.apartment ? `Кв.: ${order.address.apartment}` : null,
    order.comment ? `Комментарий: ${order.comment}` : null,
    "",
    ...order.items.map(
      (i) => `• ${i.name} × ${i.quantity} — ${i.price * i.quantity} ₽`,
    ),
  ].filter(Boolean);

  await dispatchNotification(lines.join("\n"), "order");
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

async function dispatchNotification(
  text: string,
  kind: "order" | "feedback",
): Promise<void> {
  const webhook = process.env.NOTIFY_WEBHOOK_URL;
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChat = process.env.TELEGRAM_CHAT_ID;

  if (telegramToken && telegramChat) {
    await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramChat,
        text,
      }),
    }).catch((err) => console.error("[notify telegram]", err));
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
