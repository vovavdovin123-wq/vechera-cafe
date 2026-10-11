import { promises as fs } from "fs";
import path from "path";
import { handleTelegramUpdate, type TelegramUpdate } from "./telegram-bot";
import { telegramBotToken } from "./telegram-subscribers";

const OFFSET_FILE = path.join(process.cwd(), "data", "telegram-offset.json");
const LOCK_FILE = path.join(process.cwd(), "data", "telegram-poll.lock");
const STALE_MS = 45_000;

let started = false;

async function readOffset() {
  try {
    const raw = JSON.parse(await fs.readFile(OFFSET_FILE, "utf8")) as {
      offset?: number;
    };
    return Number(raw.offset) || 0;
  } catch {
    return 0;
  }
}

async function writeOffset(offset: number) {
  await fs.mkdir(path.dirname(OFFSET_FILE), { recursive: true });
  await fs.writeFile(OFFSET_FILE, `${JSON.stringify({ offset })}\n`, "utf8");
}

async function writeLock() {
  await fs.mkdir(path.dirname(LOCK_FILE), { recursive: true });
  await fs.writeFile(
    LOCK_FILE,
    JSON.stringify({ pid: process.pid, at: Date.now() }),
    "utf8",
  );
}

function parseLock(raw: string): { pid: number; at: number } | null {
  try {
    const json = JSON.parse(raw) as { pid?: number; at?: number };
    if (json.pid) return { pid: json.pid, at: Number(json.at) || 0 };
  } catch {
    const pid = Number(raw.trim());
    if (pid) return { pid, at: 0 };
  }
  return null;
}

function pidAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function acquireLock() {
  await fs.mkdir(path.dirname(LOCK_FILE), { recursive: true });
  try {
    const raw = await fs.readFile(LOCK_FILE, "utf8");
    const lock = parseLock(raw);
    if (lock && lock.pid !== process.pid && pidAlive(lock.pid)) {
      if (lock.at && Date.now() - lock.at < STALE_MS) return false;
    }
  } catch {
    /* no lock yet */
  }
  await writeLock();
  return true;
}

async function telegramApi(method: string, body?: Record<string, unknown>) {
  const token = telegramBotToken();
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
    signal: AbortSignal.timeout(35000),
  });
  return (await res.json()) as {
    ok: boolean;
    result?: unknown;
    description?: string;
  };
}

async function loop() {
  let offset = await readOffset();
  await telegramApi("deleteWebhook", { drop_pending_updates: false });
  console.info("[telegram poller] webhook off, polling started");

  while (true) {
    try {
      await writeLock();
      const data = await telegramApi("getUpdates", {
        offset,
        timeout: 25,
        allowed_updates: ["message", "edited_message", "my_chat_member"],
      });
      if (!data.ok || !Array.isArray(data.result)) {
        console.error("[telegram poller]", data.description || "getUpdates failed");
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      const updates = data.result as TelegramUpdate[];
      for (const update of updates) {
        try {
          await handleTelegramUpdate(update);
        } catch (err) {
          console.error("[telegram poller] handle", err);
        }
        const next = Number(update.update_id) + 1;
        if (next > offset) offset = next;
      }
      if (updates.length) await writeOffset(offset);
    } catch (err) {
      console.error("[telegram poller] loop", err);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

export async function startTelegramPoller() {
  if (started) return;
  if (
    process.env.TELEGRAM_STANDALONE_POLLER === "1" ||
    process.env.NODE_ENV === "production"
  ) {
    return;
  }
  if (!telegramBotToken()) {
    console.warn("[telegram poller] TELEGRAM_BOT_TOKEN is empty");
    return;
  }
  if (!(await acquireLock())) {
    console.info("[telegram poller] skipped (another process is polling)");
    return;
  }
  started = true;
  void loop();
}
