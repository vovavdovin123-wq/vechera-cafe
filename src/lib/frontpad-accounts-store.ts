import { readFileSync, promises as fs } from "fs";
import path from "path";
import type { FranchiseId } from "./types";

type AccountEntry = {
  secret: string;
  updatedAt: string;
};

type AccountsFile = Partial<Record<FranchiseId, AccountEntry>>;

const FILE = path.join(process.cwd(), "data", "frontpad-accounts.json");

let syncCache: AccountsFile | null = null;

function loadSync(): AccountsFile {
  if (syncCache) return syncCache;
  try {
    syncCache = JSON.parse(readFileSync(FILE, "utf8")) as AccountsFile;
  } catch {
    syncCache = {};
  }
  return syncCache;
}

export function invalidateFrontPadAccountsCache() {
  syncCache = null;
}

export function readFrontPadSecretSync(
  franchiseId: FranchiseId,
): string | undefined {
  const entry = loadSync()[franchiseId];
  const secret = entry?.secret?.trim();
  return secret || undefined;
}

async function ensureFile() {
  const dir = path.dirname(FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, "{}", "utf8");
    invalidateFrontPadAccountsCache();
  }
}

export type FrontPadAccountPublic = {
  franchiseId: FranchiseId;
  configured: boolean;
  source: "admin" | "env" | "none";
  hint?: string;
  updatedAt?: string;
};

function secretHint(secret: string): string {
  if (secret.length <= 4) return "••••";
  return `••••${secret.slice(-4)}`;
}

function envSecret(franchiseId: FranchiseId): string | undefined {
  const shared = process.env.FRONTPAD_SECRET?.trim();
  if (franchiseId === "center") {
    return process.env.FRONTPAD_SECRET_CENTER?.trim() || shared || undefined;
  }
  return process.env.FRONTPAD_SECRET_HIPPODROME?.trim() || shared || undefined;
}

export function resolveFrontPadSecret(
  franchiseId: FranchiseId,
): { secret?: string; source: "admin" | "env" | "none" } {
  const fromAdmin = readFrontPadSecretSync(franchiseId);
  if (fromAdmin) return { secret: fromAdmin, source: "admin" };
  const fromEnv = envSecret(franchiseId);
  if (fromEnv) return { secret: fromEnv, source: "env" };
  return { source: "none" };
}

export async function readFrontPadAccountsPublic(): Promise<
  FrontPadAccountPublic[]
> {
  await ensureFile();
  const file = loadSync();
  const ids: FranchiseId[] = ["center", "hippodrome"];

  return ids.map((franchiseId) => {
    const admin = file[franchiseId];
    const resolved = resolveFrontPadSecret(franchiseId);
    return {
      franchiseId,
      configured: Boolean(resolved.secret),
      source: resolved.source,
      hint: resolved.secret ? secretHint(resolved.secret) : undefined,
      updatedAt: admin?.updatedAt,
    };
  });
}

export async function saveFrontPadSecret(
  franchiseId: FranchiseId,
  secret: string,
): Promise<void> {
  await ensureFile();
  let file: AccountsFile = {};
  try {
    file = JSON.parse(await fs.readFile(FILE, "utf8")) as AccountsFile;
  } catch {
    file = {};
  }

  const trimmed = secret.trim();
  if (trimmed) {
    file[franchiseId] = {
      secret: trimmed,
      updatedAt: new Date().toISOString(),
    };
  } else {
    delete file[franchiseId];
  }

  await fs.writeFile(FILE, JSON.stringify(file, null, 2), "utf8");
  invalidateFrontPadAccountsCache();
}
