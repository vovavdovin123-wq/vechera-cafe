import type { MenuItem } from "./types";

export interface FrontPadProductSync {
  article: string;
  name: string;
  price: number;
}

/** Нормализация названия для сопоставления сайт ↔ FrontPad */
export function normalizeMenuName(name: string): string {
  return String(name)
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[«»"'(),.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findProductByName(
  itemName: string,
  byName: Map<string, FrontPadProductSync>,
): FrontPadProductSync | undefined {
  const direct = byName.get(normalizeMenuName(itemName));
  if (direct) return direct;

  const base = normalizeMenuName(itemName).replace(/\s+[мб]\s*$/u, "");
  if (base) {
    const sized = byName.get(`${base} м`) ?? byName.get(`${base} б`);
    if (sized) return sized;
    for (const [key, product] of byName) {
      if (key === base || key.startsWith(`${base} `) || base.startsWith(`${key} `)) {
        return product;
      }
    }
  }

  return undefined;
}

export function syncMenuWithFrontPadProducts(
  items: MenuItem[],
  products: FrontPadProductSync[],
): {
  items: MenuItem[];
  updated: number;
  assigned: number;
  skipped: number;
} {
  const byArticle = new Map(
    products
      .filter((p) => p.article)
      .map((p) => [String(p.article).trim(), p] as const),
  );
  const byName = new Map<string, FrontPadProductSync>();
  for (const product of products) {
    if (!product.name) continue;
    byName.set(normalizeMenuName(product.name), product);
  }

  let updated = 0;
  let assigned = 0;
  let skipped = 0;

  const next = items.map((item) => {
    const art = item.frontpadArticle?.trim();
    if (art) {
      const fp = byArticle.get(art);
      if (!fp) {
        skipped += 1;
        return item;
      }
      updated += 1;
      return {
        ...item,
        name: fp.name?.trim() ? fp.name.trim() : item.name,
        price: fp.price > 0 ? Math.round(fp.price) : item.price,
      };
    }

    const fp = findProductByName(item.name, byName);
    if (!fp?.article) {
      skipped += 1;
      return item;
    }

    assigned += 1;
    return {
      ...item,
      frontpadArticle: String(fp.article).trim(),
      name: fp.name?.trim() ? fp.name.trim() : item.name,
      price: fp.price > 0 ? Math.round(fp.price) : item.price,
    };
  });

  return { items: next, updated, assigned, skipped };
}
