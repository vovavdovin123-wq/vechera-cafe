import type { MenuItem } from "./types";

export interface FrontPadProductSync {
  article: string;
  name: string;
  price: number;
}

export interface FrontPadSyncMismatch {
  itemId: string;
  itemName: string;
  article: string;
  frontpadName: string;
}

/** Единый ключ названия для сопоставления сайт ↔ FrontPad */
export function normalizeMenuName(name: string): string {
  let s = String(name)
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[«»"'(),.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const sizeMatch = s.match(/\s+([мб])\s*$/u);
  const size = sizeMatch ? sizeMatch[1] : "";
  s = s.replace(/\s+[мб]\s*$/u, "").trim();

  return size ? `${s} ${size}` : s;
}

function buildNameIndex(
  products: FrontPadProductSync[],
): Map<string, FrontPadProductSync> {
  const byName = new Map<string, FrontPadProductSync>();
  for (const product of products) {
    if (!product.name) continue;
    const key = normalizeMenuName(product.name);
    if (!byName.has(key)) {
      byName.set(key, product);
    }
  }
  return byName;
}

function namesMatch(siteName: string, frontpadName: string): boolean {
  return normalizeMenuName(siteName) === normalizeMenuName(frontpadName);
}

export function syncMenuWithFrontPadProducts(
  items: MenuItem[],
  products: FrontPadProductSync[],
): {
  items: MenuItem[];
  updated: number;
  assigned: number;
  skipped: number;
  mismatches: FrontPadSyncMismatch[];
} {
  const byArticle = new Map(
    products
      .filter((p) => p.article)
      .map((p) => [String(p.article).trim(), p] as const),
  );
  const byName = buildNameIndex(products);

  let updated = 0;
  let assigned = 0;
  let skipped = 0;
  const mismatches: FrontPadSyncMismatch[] = [];

  const next = items.map((item) => {
    const art = item.frontpadArticle?.trim();

    if (art) {
      const fp = byArticle.get(art);
      if (!fp) {
        skipped += 1;
        return item;
      }

      if (!namesMatch(item.name, fp.name)) {
        mismatches.push({
          itemId: item.id,
          itemName: item.name,
          article: art,
          frontpadName: fp.name,
        });
        skipped += 1;
        return item;
      }

      updated += 1;
      return {
        ...item,
        price: fp.price > 0 ? Math.round(fp.price) : item.price,
      };
    }

    const fp = byName.get(normalizeMenuName(item.name));
    if (!fp?.article) {
      skipped += 1;
      return item;
    }

    assigned += 1;
    return {
      ...item,
      frontpadArticle: String(fp.article).trim(),
      price: fp.price > 0 ? Math.round(fp.price) : item.price,
    };
  });

  return { items: next, updated, assigned, skipped, mismatches };
}

/** Применить таблицу артикулов: id блюда или точное название → артикул FrontPad */
export function applyArticleMap(
  items: MenuItem[],
  map: Record<string, string>,
): { items: MenuItem[]; applied: number; unknown: string[] } {
  const byId = new Map<string, string>();
  const byName = new Map<string, string>();

  for (const [key, rawArticle] of Object.entries(map)) {
    const article = String(rawArticle ?? "").trim();
    if (!article) continue;
    if (key.includes("-")) {
      byId.set(key, article);
    }
    byName.set(normalizeMenuName(key), article);
  }

  let applied = 0;
  const unknown: string[] = [];

  const next = items.map((item) => {
    const fromId = byId.get(item.id);
    const fromName = byName.get(normalizeMenuName(item.name));
    const article = fromId ?? fromName;
    if (!article) return item;
    applied += 1;
    return { ...item, frontpadArticle: article };
  });

  for (const key of Object.keys(map)) {
    if (key.includes("-")) {
      if (!items.some((i) => i.id === key)) unknown.push(key);
    } else if (!items.some((i) => normalizeMenuName(i.name) === normalizeMenuName(key))) {
      unknown.push(key);
    }
  }

  return { items: next, applied, unknown };
}
