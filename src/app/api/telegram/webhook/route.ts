import { NextResponse } from "next/server";
import { handleTelegramUpdate, type TelegramUpdate } from "@/lib/telegram-bot";
import { vecheraDataDir } from "@/lib/data-dir";
import {
  readTelegramSubscribers,
  telegramBotToken,
} from "@/lib/telegram-subscribers";

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
  const subscribers = await readTelegramSubscribers();
  let pollerCount: number | null = null;
  try {
    const res = await fetch("http://127.0.0.1:38745/status", {
      signal: AbortSignal.timeout(2000),
    });
    const data = (await res.json()) as { ok?: boolean; subscriberCount?: number };
    if (data.ok) pollerCount = Number(data.subscriberCount) || 0;
  } catch {
    /* poller down */
  }
  return NextResponse.json({
    ok: true,
    service: "telegram-bot",
    tokenConfigured: Boolean(telegramBotToken()),
    mode: "polling",
    subscriberCount: pollerCount ?? subscribers.length,
    pollerOk: pollerCount !== null,
    dataDir: vecheraDataDir(),
  });
}
