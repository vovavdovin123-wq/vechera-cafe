import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { DEFAULT_INTERIOR, type InteriorPhoto } from "@/lib/interior-data";
import { INITIAL_MENUS } from "@/lib/menu-data";
import { PROMO_SLIDES, type PromoSlide } from "@/lib/promos";
import type { FranchiseId, MenuItem } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

const MENUS_FILE = path.join(DATA_DIR, "menus.json");
const INTERIOR_FILE = path.join(DATA_DIR, "interior.json");
const PROMOS_FILE = path.join(DATA_DIR, "promos.json");

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

async function readJsonFile<T>(file: string, fallback: T): Promise<T> {
  await ensureDirs();
  try {
    await fs.access(file);
  } catch {
    return fallback;
  }
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile<T>(file: string, data: T): Promise<void> {
  await ensureDirs();
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

export async function persistDataUrl(dataUrl: string, prefix: string): Promise<string> {
  if (!dataUrl.startsWith("data:image/")) return dataUrl;

  const match = dataUrl.match(/^data:image\/([\w+-]+);base64,(.+)$/);
  if (!match) return dataUrl;

  let ext = match[1].toLowerCase();
  if (ext === "jpeg") ext = "jpg";
  if (ext === "svg+xml") ext = "svg";

  const buffer = Buffer.from(match[2], "base64");
  const name = `${prefix}-${Date.now().toString(36)}-${randomBytes(4).toString("hex")}.${ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, name), buffer);
  return `/uploads/${name}`;
}

async function deepPersistImages<T>(value: T, keyPrefix: string): Promise<T> {
  if (typeof value === "string") {
    if (value.startsWith("data:image/")) {
      return (await persistDataUrl(value, keyPrefix)) as T;
    }
    return value;
  }

  if (Array.isArray(value)) {
    const items = await Promise.all(
      value.map((item, index) => deepPersistImages(item, `${keyPrefix}-${index}`)),
    );
    return items as T;
  }

  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = await deepPersistImages(nested, `${keyPrefix}-${key}`);
    }
    return out as T;
  }

  return value;
}

export async function readMenus(): Promise<Record<FranchiseId, MenuItem[]>> {
  return readJsonFile(MENUS_FILE, INITIAL_MENUS);
}

export async function writeMenus(
  data: Record<FranchiseId, MenuItem[]>,
): Promise<Record<FranchiseId, MenuItem[]>> {
  const persisted = await deepPersistImages(data, "menu");
  await writeJsonFile(MENUS_FILE, persisted);
  return persisted;
}

export async function readInterior(): Promise<
  Record<FranchiseId, InteriorPhoto[]>
> {
  return readJsonFile(INTERIOR_FILE, DEFAULT_INTERIOR);
}

export async function writeInterior(
  data: Record<FranchiseId, InteriorPhoto[]>,
): Promise<Record<FranchiseId, InteriorPhoto[]>> {
  const persisted = await deepPersistImages(data, "interior");
  await writeJsonFile(INTERIOR_FILE, persisted);
  return persisted;
}

export async function readPromos(): Promise<PromoSlide[]> {
  return readJsonFile(PROMOS_FILE, PROMO_SLIDES);
}

export async function writePromos(data: PromoSlide[]): Promise<PromoSlide[]> {
  const persisted = await deepPersistImages(data, "promo");
  await writeJsonFile(PROMOS_FILE, persisted);
  return persisted;
}
