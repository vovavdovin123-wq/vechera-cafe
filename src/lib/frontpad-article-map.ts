import { readFileSync } from "fs";
import path from "path";
import type { FranchiseId } from "./types";

export type FrontPadArticleMap = Partial<
  Record<FranchiseId, Record<string, string>>
>;

const FILE = path.join(process.cwd(), "data", "frontpad-article-map.json");

let cache: FrontPadArticleMap | null = null;

export function invalidateArticleMapCache() {
  cache = null;
}

export function readArticleMapSync(): FrontPadArticleMap {
  if (cache) return cache;
  try {
    cache = JSON.parse(readFileSync(FILE, "utf8")) as FrontPadArticleMap;
  } catch {
    cache = {};
  }
  return cache;
}

/** Артикул для заказа: приоритет у карты (id блюда), затем из меню */
export function resolveFrontPadArticle(
  franchiseId: FranchiseId,
  itemId: string,
  menuArticle?: string,
): string | undefined {
  const fromMap = readArticleMapSync()[franchiseId]?.[itemId]?.trim();
  if (fromMap) return fromMap;
  const fromMenu = menuArticle?.trim();
  return fromMenu || undefined;
}
