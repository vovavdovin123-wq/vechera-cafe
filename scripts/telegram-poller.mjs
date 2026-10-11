#!/usr/bin/env node
/**
 * Отдельный процесс: отвечает на /start любому аккаунту и пишет подписчиков.
 * На сервере: pm2 start scripts/telegram-poller.mjs --name vechera-telegram
 */
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  renameSync,
  unlinkSync,
} from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data");
const SUBS_FILE = path.join(DATA, "telegram-subscribers.json");
const OFFSET_FILE = path.join(DATA, "telegram-offset.json");
const OUTBOX_FILE = path.join(DATA, "telegram-outbox.jsonl");
const OUTBOX_WORK = path.join(DATA, "telegram-outbox.work.jsonl");

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
const NOTIFY_PORT = Number(process.env.TELEGRAM_NOTIFY_PORT || 38745);
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

function splitIds(raw) {
  if (!raw || !String(raw).trim()) return [];
  return String(raw)
    .split(/[,;\s]+/)
    .map((id) => id.trim())
    .filter(Boolean);
}

function recipientIds(franchiseId) {
  const ids = new Set();
  for (const id of splitIds(process.env.TELEGRAM_CHAT_ID)) ids.add(id);
  for (const id of splitIds(process.env.TELEGRAM_CHAT_IDS)) ids.add(id);
  if (franchiseId === "center") {
    for (const id of splitIds(process.env.TELEGRAM_CHAT_IDS_CENTER)) ids.add(id);
  }
  if (franchiseId === "hippodrome") {
    for (const id of splitIds(process.env.TELEGRAM_CHAT_IDS_HIPPODROME)) {
      ids.add(id);
    }
  }
  for (const sub of readSubs()) ids.add(String(sub.chatId));
  return [...ids];
}

let draining = false;

async function broadcast(text, franchiseId) {
  const chats = recipientIds(franchiseId);
  console.info("[telegram-poller] broadcast to", chats.length, "chats");
  for (const chatId of chats) {
    await send(chatId, text);
  }
  return chats.length;
}

function readHttpBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function startNotifyServer() {
  const server = http.createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const url = req.url || "/";
      if (req.method === "GET" && (url === "/" || url === "/status")) {
        const subs = readSubs();
        res.end(
          JSON.stringify({
            ok: true,
            subscriberCount: subs.length,
            subscribers: subs.map((s) => ({
              chatId: s.chatId,
              name: s.name,
              username: s.username,
            })),
          }),
        );
        return;
      }
      if (req.method === "POST" && url === "/notify") {
        const item = JSON.parse((await readHttpBody(req)) || "{}");
        if (!item.text) {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: "empty text" }));
          return;
        }
        const count = await broadcast(item.text, item.franchiseId);
        res.end(JSON.stringify({ ok: true, count }));
        return;
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ ok: false }));
    } catch (err) {
      console.error("[telegram-poller] http", err);
      res.statusCode = 500;
      res.end(JSON.stringify({ ok: false, error: String(err) }));
    }
  });
  server.listen(NOTIFY_PORT, "127.0.0.1", () => {
    console.info(`[telegram-poller] notify http://127.0.0.1:${NOTIFY_PORT}`);
  });
}

async function drainOutbox() {
  if (draining) return;
  draining = true;
  try {
    ensureData();
    const pending = [];
    if (existsSync(OUTBOX_WORK)) pending.push(OUTBOX_WORK);
    if (existsSync(OUTBOX_FILE)) {
      const tmp = `${OUTBOX_FILE}.${process.pid}.${Date.now()}`;
      renameSync(OUTBOX_FILE, tmp);
      pending.push(tmp);
    }
    if (!pending.length) return;

    for (const file of pending) {
      const raw = readFileSync(file, "utf8");
      const lines = raw.split(/\r?\n/).filter((l) => l.trim());
      for (const line of lines) {
        let item;
        try {
          item = JSON.parse(line);
        } catch {
          continue;
        }
        const chats = recipientIds(item.franchiseId);
        console.info(
          "[telegram-poller] notify",
          item.kind,
          "to",
          chats.length,
          "chats",
        );
        for (const chatId of chats) {
          await send(chatId, item.text);
        }
      }
      unlinkSync(file);
    }
  } catch (err) {
    console.error("[telegram-poller] outbox", err);
  } finally {
    draining = false;
  }
}

async function loop() {
  startNotifyServer();
  await api("deleteWebhook", { drop_pending_updates: false });
  let offset = readOffset();
  console.info("[telegram-poller] started, offset", offset, "subs", readSubs().length);
  setInterval(() => {
    drainOutbox().catch((err) => console.error("[telegram-poller] drain", err));
  }, 1000);

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
