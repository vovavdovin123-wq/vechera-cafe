import { promises as fs } from "fs";
import path from "path";
import type { FeedbackPayload } from "./types";

export interface StoredFeedback extends FeedbackPayload {
  id: string;
  createdAt: string;
}

const FILE = path.join(process.cwd(), "data", "feedback.json");

async function ensureFile() {
  const dir = path.dirname(FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, "[]", "utf8");
  }
}

export async function readFeedback(): Promise<StoredFeedback[]> {
  await ensureFile();
  const raw = await fs.readFile(FILE, "utf8");
  try {
    return JSON.parse(raw) as StoredFeedback[];
  } catch {
    return [];
  }
}

export async function appendFeedback(
  payload: FeedbackPayload,
): Promise<StoredFeedback> {
  const list = await readFeedback();
  const entry: StoredFeedback = {
    ...payload,
    id: `fb-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  };
  list.unshift(entry);
  await fs.writeFile(FILE, JSON.stringify(list, null, 2), "utf8");
  return entry;
}

export async function deleteFeedback(id: string): Promise<boolean> {
  const list = await readFeedback();
  const next = list.filter((item) => item.id !== id);
  if (next.length === list.length) return false;
  await fs.writeFile(FILE, JSON.stringify(next, null, 2), "utf8");
  return true;
}
