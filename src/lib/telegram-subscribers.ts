import { promises as fs } from "fs";
import path from "path";

export type TelegramSubscriber = {
  chatId: string;
  name?: string;
  username?: string;
  subscribedAt: string;
};

const FILE = path.join(process.cwd(), "data", "telegram-subscribers.json");
const LOCK_DIR = `${FILE}.lock`;

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function withFileLock<T>(fn: () => Promise<T>): Promise<T> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  for (let i = 0; i < 40; i++) {
    try {
      await fs.mkdir(LOCK_DIR);
      try {
        return await fn();
      } finally {
        await fs.rmdir(LOCK_DIR).catch(() => undefined);
      }
    } catch {
      await sleep(50);
    }
  }
  return fn();
}

async function readListUnlocked(): Promise<TelegramSubscriber[]> {
  try {
    const raw = JSON.parse(await fs.readFile(FILE, "utf8")) as TelegramSubscriber[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

async function writeListUnlocked(list: TelegramSubscriber[]) {
  await fs.writeFile(FILE, `${JSON.stringify(list, null, 2)}\n`, "utf8");
}

export async function readTelegramSubscribers(): Promise<TelegramSubscriber[]> {
  return withFileLock(readListUnlocked);
}

export async function addTelegramSubscriber(input: {
  chatId: string | number;
  name?: string;
  username?: string;
}): Promise<{ added: boolean; subscriber: TelegramSubscriber }> {
  const chatId = String(input.chatId);
  return withFileLock(async () => {
    const list = await readListUnlocked();
    const existing = list.find((s) => s.chatId === chatId);
    if (existing) {
      existing.name = input.name || existing.name;
      existing.username = input.username || existing.username;
      await writeListUnlocked(list);
      return { added: false, subscriber: existing };
    }
    const subscriber: TelegramSubscriber = {
      chatId,
      name: input.name,
      username: input.username,
      subscribedAt: new Date().toISOString(),
    };
    list.push(subscriber);
    await writeListUnlocked(list);
    console.info("[telegram] subscribed", chatId, input.username || input.name || "");
    return { added: true, subscriber };
  });
}

export async function removeTelegramSubscriber(chatId: string | number) {
  const id = String(chatId);
  return withFileLock(async () => {
    const list = await readListUnlocked();
    const next = list.filter((s) => s.chatId !== id);
    await writeListUnlocked(next);
    return next.length < list.length;
  });
}

export function telegramBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
}

export async function telegramSendMessage(chatId: string | number, text: string) {
  const token = telegramBotToken();
  if (!token) return { ok: false, status: 0 };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[telegram] send ${chatId}: ${res.status} ${body}`);
    }
    return { ok: res.ok, status: res.status };
  } catch (err) {
    console.error("[telegram] send failed", chatId, err);
    return { ok: false, status: 0 };
  }
}
