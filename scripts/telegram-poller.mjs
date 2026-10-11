#!/usr/bin/env node
/**
 * Отдельный процесс: отвечает на /start любому аккаунту и пишет подписчиков.
 * На сервере: pm2 start scripts/telegram-poller.mjs --name vechera-telegram
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data");
const SUBS_FILE = path.join(DATA, "telegram-subscribers.json");
const OFFSET_FILE = path.join(DATA, "telegram-offset.json");

function loadEnv() {
  const file = path.join(ROOT, ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const TOKEN = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
if (!TOKEN) {
  console.error("[telegram-poller] TELEGRAM_BOT_TOKEN is empty");
  process.exit(1);
}

const API = `https://api.telegram.org/bot${TOKEN}`;

function ensureData() {
  mkdirSync(DATA, { recursive: true });
}

function readSubs() {
  ensureData();
  try {
    const raw = JSON.parse(readFileSync(SUBS_FILE, "utf8"));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeSubs(list) {
  ensureData();
  writeFileSync(SUBS_FILE, `${JSON.stringify(list, null, 2)}\n`, "utf8");
}

function readOffset() {
  try {
    return Number(JSON.parse(readFileSync(OFFSET_FILE, "utf8")).offset) || 0;
  } catch {
    return 0;
  }
}

function writeOffset(offset) {
  ensureData();
  writeFileSync(OFFSET_FILE, `${JSON.stringify({ offset })}\n`, "utf8");
}

function addSub(chatId, name, username) {
  const id = String(chatId);
  const list = readSubs();
  const existing = list.find((s) => s.chatId === id);
  if (existing) {
    existing.name = name || existing.name;
    existing.username = username || existing.username;
    writeSubs(list);
    return false;
  }
  list.push({
    chatId: id,
    name,
    username,
    subscribedAt: new Date().toISOString(),
  });
  writeSubs(list);
  console.info("[telegram-poller] subscribed", id, username || name || "");
  return true;
}

function removeSub(chatId) {
  const id = String(chatId);
  writeSubs(readSubs().filter((s) => s.chatId !== id));
}

async function api(method, body) {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
    signal: AbortSignal.timeout(35000),
  });
  return res.json();
}

async function send(chatId, text) {
  const data = await api("sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  });
  if (!data.ok) {
    console.error("[telegram-poller] send fail", chatId, data.description);
  }
}

function displayName(chat, from) {
  const parts = [
    from?.first_name || chat?.first_name,
    from?.last_name || chat?.last_name,
  ].filter(Boolean);
  return parts.join(" ").trim() || undefined;
}

async function subscribeAndHello(chat, from, silentIfExists = false) {
  const added = addSub(
    chat.id,
    displayName(chat, from),
    from?.username || chat.username,
  );
  if (silentIfExists && !added) return;
  await send(
    chat.id,
    added
      ? "Готово. Теперь сюда будут приходить новые заказы с сайта Вечера.\n\nЧтобы отключить: /stop"
      : "Вы уже подписаны. Новые заказы с сайта Вечера будут приходить сюда.\n\nЧтобы отключить: /stop",
  );
}

async function handleUpdate(update) {
  const member = update.my_chat_member;
  if (member?.chat?.id) {
    const status = member.new_chat_member?.status;
    if (status === "kicked" || status === "left") {
      removeSub(member.chat.id);
      return;
    }
  }

  const message = update.message || update.edited_message;
  if (message?.chat?.id) {
    const text = (message.text || "").trim();
    const command = text.split(/\s+/)[0].split("@")[0].toLowerCase();
    if (command === "/stop") {
      removeSub(message.chat.id);
      await send(
        message.chat.id,
        "Подписка отключена. Напишите /start, если снова нужны уведомления о заказах.",
      );
      return;
    }
    await subscribeAndHello(message.chat, message.from);
    return;
  }

  if (member?.chat?.id) {
    const status = member.new_chat_member?.status;
    if (status === "member" || status === "restricted") {
      await subscribeAndHello(member.chat, member.from);
    }
  }
}

async function loop() {
  await api("deleteWebhook", { drop_pending_updates: false });
  let offset = readOffset();
  console.info("[telegram-poller] started, offset", offset);

  while (true) {
    try {
      const data = await api("getUpdates", {
        offset,
        timeout: 25,
        allowed_updates: ["message", "edited_message", "my_chat_member"],
      });
      if (!data.ok || !Array.isArray(data.result)) {
        console.error("[telegram-poller]", data.description || "getUpdates failed");
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      for (const update of data.result) {
        try {
          await handleUpdate(update);
        } catch (err) {
          console.error("[telegram-poller] handle", err);
        }
        const next = Number(update.update_id) + 1;
        if (next > offset) offset = next;
      }
      if (data.result.length) writeOffset(offset);
    } catch (err) {
      console.error("[telegram-poller] loop", err);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

loop().catch((err) => {
  console.error("[telegram-poller] fatal", err);
  process.exit(1);
});
