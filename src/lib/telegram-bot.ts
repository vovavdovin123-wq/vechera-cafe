import {
  addTelegramSubscriber,
  removeTelegramSubscriber,
  telegramSendMessage,
} from "./telegram-subscribers";

type TelegramChat = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TelegramMessage = {
  text?: string;
  chat?: TelegramChat;
  from?: { first_name?: string; last_name?: string; username?: string };
};

export type TelegramUpdate = {
  update_id?: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
};

function displayName(chat?: TelegramChat, from?: TelegramMessage["from"]) {
  const parts = [
    from?.first_name || chat?.first_name,
    from?.last_name || chat?.last_name,
  ].filter(Boolean);
  return parts.join(" ").trim() || undefined;
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const message = update.message || update.edited_message;
  const chat = message?.chat;
  if (!message || !chat?.id) return;

  const text = (message.text || "").trim();
  const command = text.split(/\s+/)[0].split("@")[0].toLowerCase();
  const name = displayName(chat, message.from);
  const username = message.from?.username || chat.username;

  if (command === "/stop") {
    await removeTelegramSubscriber(chat.id);
    await telegramSendMessage(
      chat.id,
      "Подписка отключена. Напишите /start, если снова нужны уведомления о заказах.",
    );
    return;
  }

  const { added } = await addTelegramSubscriber({
    chatId: chat.id,
    name,
    username,
  });

  await telegramSendMessage(
    chat.id,
    added
      ? "Готово. Теперь сюда будут приходить новые заказы с сайта Вечера.\n\nЧтобы отключить: /stop"
      : "Вы уже подписаны. Новые заказы с сайта Вечера будут приходить сюда.\n\nЧтобы отключить: /stop",
  );
}
