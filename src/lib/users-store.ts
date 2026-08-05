import { promises as fs } from "fs";
import path from "path";
import { normalizePhone } from "./phone";

export interface StoredUser {
  phone: string;
  name?: string;
  updatedAt: string;
}

const FILE = path.join(process.cwd(), "data", "users.json");

async function ensureFile() {
  const dir = path.dirname(FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, "[]", "utf8");
  }
}

export async function readUsers(): Promise<StoredUser[]> {
  await ensureFile();
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as StoredUser[];
  } catch {
    return [];
  }
}

export async function upsertUser(
  phone: string,
  name?: string,
): Promise<StoredUser> {
  const normalized = normalizePhone(phone);
  const list = await readUsers();
  const idx = list.findIndex((u) => u.phone === normalized);
  const entry: StoredUser = {
    phone: normalized,
    name: name?.trim() || list[idx]?.name,
    updatedAt: new Date().toISOString(),
  };

  if (idx >= 0) {
    list[idx] = { ...list[idx], ...entry };
  } else {
    list.unshift(entry);
  }

  await fs.writeFile(FILE, JSON.stringify(list, null, 2), "utf8");
  return entry;
}

export async function findUserByPhone(
  phone: string,
): Promise<StoredUser | null> {
  const normalized = normalizePhone(phone);
  return (await readUsers()).find((u) => u.phone === normalized) ?? null;
}
