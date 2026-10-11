import { NextResponse } from "next/server";
import { handleTelegramUpdate, type TelegramUpdate } from "@/lib/telegram-bot";
import { telegramBotToken } from "@/lib/telegram-subscribers";

export async function POST(request: Request) {
  try {
    if (!telegramBotToken()) {
      return NextResponse.json({ ok: true });
    }
    const update = (await request.json()) as TelegramUpdate;
    await handleTelegramUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[telegram webhook]", err);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "telegram-bot",
    tokenConfigured: Boolean(telegramBotToken()),
    mode: "polling",
  });
}
