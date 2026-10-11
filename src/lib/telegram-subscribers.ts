import { promises as fs } from "fs";
import path from "path";
import { vecheraDataDir } from "./data-dir";

export type TelegramSubscriber = {
  chatId: string;
  name?: string;
  username?: string;
  subscribedAt: string;
};

function subscribersFile() {
  return path.join(vecheraDataDir(), "telegram-subscribers.json");
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function withFileLock<T>(fn: () => Promise<T>): Promise<T> {
  const file = subscribersFile();
  const lockDir = `${file}.lock`;
  await fs.mkdir(path.dirname(file), { recursive: true });
  for (let i = 0; i < 40; i++) {
    try {
      await fs.mkdir(lockDir);
      try {
        return await fn();
      } finally {
        await fs.rmdir(lockDir).catch(() => undefined);
      }
    } catch {
      await sleep(50);
    }
  }
  return fn();
}

async function readListUnlocked(): Promise<TelegramSubscriber[]> {
  try {
    const raw = JSON.parse(
      await fs.readFile(subscribersFile(), "utf8"),
    ) as TelegramSubscriber[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

async function writeListUnlocked(list: TelegramSubscriber[]) {
  await fs.writeFile(
    subscribersFile(),
    `${JSON.stringify(list, null, 2)}\n`,
    "utf8",
  );
}

export async function readTelegramSubscribers(): Promise<TelegramSubscriber[]> {
  const byId = new Map<string, TelegramSubscriber>();
  const files = [
    subscribersFile(),
    path.join(process.cwd(), "data", "telegram-subscribers.json"),
    "/var/www/vechera-cafe/data/telegram-subscribers.json",
  ];
  for (const file of [...new Set(files)]) {
    try {
      const raw = JSON.parse(await fs.readFile(file, "utf8")) as TelegramSubscriber[];
      if (!Array.isArray(raw)) continue;
      for (const sub of raw) {
        if (!sub?.chatId) continue;
        byId.set(String(sub.chatId), { ...sub, chatId: String(sub.chatId) });
      }
    } catch {
      /* missing file */
    }
  }
  return [...byId.values()];
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
