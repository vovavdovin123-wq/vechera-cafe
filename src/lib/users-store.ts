import { promises as fs } from "fs";
import path from "path";
import { normalizePhone } from "./phone";

export interface StoredUser {
  phone: string;
  name?: string;
  passwordHash?: string;
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

async function writeUsers(list: StoredUser[]) {
  await fs.writeFile(FILE, JSON.stringify(list, null, 2), "utf8");
}

export async function findUserByPhone(
  phone: string,
): Promise<StoredUser | null> {
  const normalized = normalizePhone(phone);
  return (await readUsers()).find((u) => u.phone === normalized) ?? null;
}

export async function registerUser(
  phone: string,
  name: string,
  passwordHash: string,
): Promise<
  { ok: true; user: StoredUser } | { ok: false; message: string }
> {
  const normalized = normalizePhone(phone);
  const trimmedName = name.trim();
  const list = await readUsers();
  const idx = list.findIndex((u) => u.phone === normalized);

  if (idx >= 0 && list[idx].passwordHash) {
    return {
      ok: false,
      message: "Этот номер уже зарегистрирован. Войдите в аккаунт.",
    };
  }

  const entry: StoredUser = {
    phone: normalized,
    name: trimmedName,
    passwordHash,
    updatedAt: new Date().toISOString(),
  };

  if (idx >= 0) {
    list[idx] = { ...list[idx], ...entry };
  } else {
    list.unshift(entry);
  }

  await writeUsers(list);
  return { ok: true, user: entry };
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
    passwordHash: list[idx]?.passwordHash,
    updatedAt: new Date().toISOString(),
  };

  if (idx >= 0) {
    list[idx] = { ...list[idx], ...entry };
  } else {
    list.unshift(entry);
  }

  await writeUsers(list);
  return entry;
}

export async function verifyUserPassword(
  phone: string,
  password: string,
  verify: (password: string, hash: string) => boolean,
): Promise<StoredUser | null> {
  const user = await findUserByPhone(phone);
  if (!user?.passwordHash) return null;
  if (!verify(password, user.passwordHash)) return null;
  return user;
}
