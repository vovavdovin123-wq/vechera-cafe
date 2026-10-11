import { NextResponse } from "next/server";
import {
  addTelegramSubscriber,
  removeTelegramSubscriber,
  telegramBotToken,
  telegramSendMessage,
} from "@/lib/telegram-subscribers";

type TelegramChat = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  type?: string;
};

type TelegramMessage = {
  text?: string;
  chat?: TelegramChat;
  from?: { first_name?: string; last_name?: string; username?: string };
};

type TelegramUpdate = {
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

export async function POST(request: Request) {
  const token = telegramBotToken();
  if (!token) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (secret) {
    const header = request.headers.get("x-telegram-bot-api-secret-token");
    if (header !== secret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const message = update.message || update.edited_message;
  const chat = message?.chat;
  if (!message || !chat?.id) {
    return NextResponse.json({ ok: true });
  }

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
    return NextResponse.json({ ok: true });
  }

  const { added } = await addTelegramSubscriber({
    chatId: chat.id,
    name,
    username,
  });

  await telegramSendMessage(
    chat.id,
    added
      ? "Готово. Теперь сюда будут приходить новые заказы с сайта Вечера."
      : "Вы уже подписаны. Новые заказы с сайта Вечера будут приходить сюда.\n\nЧтобы отключить: /stop",
  );

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "telegram-webhook" });
}
