import { promises as fs } from "fs";
import path from "path";
import { vecheraDataDir } from "./data-dir";

export type TelegramOutboxItem = {
  text: string;
  kind: "order" | "feedback";
  franchiseId?: string;
  at: string;
};

function outboxFile() {
  return path.join(vecheraDataDir(), "telegram-outbox.jsonl");
}

export async function appendTelegramOutbox(item: Omit<TelegramOutboxItem, "at">) {
  const file = outboxFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const line = `${JSON.stringify({ ...item, at: new Date().toISOString() })}\n`;
  await fs.appendFile(file, line, "utf8");
}
