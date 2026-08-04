import type { FranchiseId, MenuCategoryDef, MenuItem } from "./types";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "./menu-data";

export const DEFAULT_DISH_IMAGE = "/menu/dish.png";

export const DEFAULT_CATEGORY_DEFS: MenuCategoryDef[] = CATEGORY_ORDER.map(
  (id) => ({
    id,
    label: CATEGORY_LABELS[id as keyof typeof CATEGORY_LABELS] ?? id,
  }),
);

export const INITIAL_MENU_CATEGORIES: Record<FranchiseId, MenuCategoryDef[]> = {
  center: DEFAULT_CATEGORY_DEFS,
  hippodrome: [
    { id: "fried", label: "Фритюр" },
    { id: "sandwiches", label: "Сэндвичи" },
    { id: "hotDogs", label: "Хот-доги" },
    { id: "burgers", label: "Бургеры" },
    { id: "salads", label: "Салаты" },
    { id: "sauces", label: "Соусы" },
    { id: "waffles", label: "Десерты" },
    { id: "coffeeShop", label: "Напитки" },
  ],
};

const LABEL_TO_ID: Record<string, string> = {
  "хот-доги": "hotDogs",
  "хот доги": "hotDogs",
  "hot-dogs": "hotDogs",
  лимонады: "lemonades",
  напитки: "drinks",
  кофе: "coffee",
  чай: "tea",
};

export function suggestCategoryId(label: string, existing: Set<string>): string {
  const normalized = label.trim().toLowerCase();
  let base =
    LABEL_TO_ID[normalized] ??
    normalized
      .replace(/[«»"']/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/gi, "")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32);

  if (!base || base.length < 2) {
    base = `cat-${Date.now().toString(36).slice(-5)}`;
  }

  let candidate = base;
  let n = 2;
  while (existing.has(candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}

export function categoryLabel(
  categories: MenuCategoryDef[],
  categoryId: string,
): string {
  return (
    categories.find((c) => c.id === categoryId)?.label ??
    categoryId
  );
}

/** Объединяет сохранённые категории с категориями из блюд (без потери порядка). */
export function mergeCategoriesWithItems(
  stored: MenuCategoryDef[] | undefined,
  items: MenuItem[],
): MenuCategoryDef[] {
  const base = Array.isArray(stored) ? [...stored] : [];
  const seen = new Set(base.map((c) => c.id));

  for (const item of items) {
    const id = String(item.category ?? "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    base.push({ id, label: id });
  }

  return base;
}

export function normalizeMenuCategories(
  data: Partial<Record<string, MenuCategoryDef[]>> | undefined,
  menus: Record<FranchiseId, MenuItem[]>,
): Record<FranchiseId, MenuCategoryDef[]> {
  return {
    center: mergeCategoriesWithItems(
      data?.center ?? INITIAL_MENU_CATEGORIES.center,
      menus.center ?? [],
    ),
    hippodrome: mergeCategoriesWithItems(
      data?.hippodrome ?? INITIAL_MENU_CATEGORIES.hippodrome,
      menus.hippodrome ?? [],
    ),
  };
}
