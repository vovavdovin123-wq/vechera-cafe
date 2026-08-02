import { promises as fs } from "fs";
import path from "path";

export type WebhookLogEntry = {
  at: string;
  orderId?: string;
  status?: string;
  action?: string;
  matched: boolean;
  raw: Record<string, unknown>;
};

const FILE = path.join(process.cwd(), "data", "webhook-log.json");
const MAX = 40;

async function ensureFile() {
  const dir = path.dirname(FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, "[]", "utf8");
  }
}

export async function appendWebhookLog(entry: Omit<WebhookLogEntry, "at">) {
  await ensureFile();
  let list: WebhookLogEntry[] = [];
  try {
    list = JSON.parse(await fs.readFile(FILE, "utf8")) as WebhookLogEntry[];
  } catch {
    list = [];
  }
  list.unshift({ ...entry, at: new Date().toISOString() });
  await fs.writeFile(FILE, JSON.stringify(list.slice(0, MAX), null, 2), "utf8");
}

export async function readWebhookLog(limit = 10): Promise<WebhookLogEntry[]> {
  await ensureFile();
  try {
    const list = JSON.parse(await fs.readFile(FILE, "utf8")) as WebhookLogEntry[];
    return list.slice(0, limit);
  } catch {
    return [];
  }
}
