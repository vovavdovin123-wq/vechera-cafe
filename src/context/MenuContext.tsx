"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CACHE_MENU_CATEGORIES,
  CACHE_MENUS,
  readContentCache,
  writeContentCache,
} from "@/lib/content-cache";
import { fetchContent, saveContent } from "@/lib/content-sync";
import {
  DEFAULT_DISH_IMAGE,
  INITIAL_MENU_CATEGORIES,
  mergeCategoriesWithItems,
  normalizeMenuCategories,
  suggestCategoryId,
} from "@/lib/menu-categories";
import { CATEGORY_IMAGES, INITIAL_MENUS } from "@/lib/menu-data";
import {
  syncMenuWithFrontPadProducts,
  type FrontPadProductSync,
  type FrontPadSyncMismatch,
} from "@/lib/frontpad-menu-sync";
import type { FranchiseId, MenuCategoryDef, MenuItem } from "@/lib/types";
import { useFranchise } from "./FranchiseContext";

type NewItem = Omit<MenuItem, "id" | "available" | "image"> & {
  available?: boolean;
  image?: string;
};

export type { FrontPadProductSync } from "@/lib/frontpad-menu-sync";

interface MenuContextValue {
  items: MenuItem[];
  allMenus: Record<FranchiseId, MenuItem[]>;
  categories: MenuCategoryDef[];
  allCategories: Record<FranchiseId, MenuCategoryDef[]>;
  addMenuItem: (item: NewItem) => void;
  updateMenuItem: (id: string, patch: Partial<MenuItem>) => void;
  removeMenuItem: (id: string) => void;
  toggleAvailable: (id: string) => void;
  addCategory: (label: string) => { ok: true; id: string } | { ok: false; message: string };
  updateCategory: (id: string, patch: Partial<MenuCategoryDef>) => void;
  removeCategory: (id: string) => { ok: true } | { ok: false; message: string };
  moveCategory: (id: string, direction: "up" | "down") => void;
  applyFrontPadProducts: (products: FrontPadProductSync[]) => {
    updated: number;
    assigned: number;
    skipped: number;
    mismatches: import("@/lib/frontpad-menu-sync").FrontPadSyncMismatch[];
  };
  saveMenus: () => Promise<boolean>;
  isDirty: boolean;
  syncStatus: "idle" | "loading" | "saving" | "error";
  contentReady: boolean;
}

const MenuContext = createContext<MenuContextValue | null>(null);

const EMPTY_MENUS: Record<FranchiseId, MenuItem[]> = {
  center: [],
  hippodrome: [],
};

function dishImageFor(category: string): string {
  return (
    CATEGORY_IMAGES[category as keyof typeof CATEGORY_IMAGES] ??
    DEFAULT_DISH_IMAGE
  );
}

function normalizeMenus(
  data: Partial<Record<string, MenuItem[]>>,
): Record<FranchiseId, MenuItem[]> {
  const legacyCoffee = new Set(["coffee", "tea", "cold"]);

  const fix = (list: MenuItem[], fallback: MenuItem[]) => {
    const mapped = (Array.isArray(list) ? list : []).map((item) => {
      const raw = String(item?.category ?? "");
      const category = legacyCoffee.has(raw) ? "coffeeShop" : raw;
      return {
        ...item,
        name: item?.name ?? "",
        description: item?.description ?? "",
        category,
        image:
          item?.image && String(item.image).trim()
            ? String(item.image).trim()
            : dishImageFor(category),
        available: item?.available ?? true,
      };
    });

    if (!mapped.some((i) => i.category === "coffeeShop")) {
      const coffee = fallback.filter((i) => i.category === "coffeeShop");
      return [...mapped, ...coffee];
    }
    return mapped;
  };

  const mergeCoffeeVenue = (
    cafe: MenuItem[] | undefined,
    coffeeVenue: MenuItem[] | undefined,
    fallback: MenuItem[],
  ) => {
    const base = Array.isArray(cafe) ? cafe : [];
    const fromOldCoffee = Array.isArray(coffeeVenue)
      ? coffeeVenue.map((item) => ({
          ...item,
          category: "coffeeShop",
        }))
      : [];
    const merged =
      fromOldCoffee.length > 0 &&
      !base.some((i) => i.category === "coffeeShop")
        ? [...base, ...fromOldCoffee]
        : base;
    return fix(merged.length ? merged : fallback, fallback);
  };

  return {
    center: mergeCoffeeVenue(
      data.center,
      data.centerCoffee,
      INITIAL_MENUS.center,
    ),
    hippodrome: mergeCoffeeVenue(
      data.hippodrome,
      data.hippodromeCoffee,
      INITIAL_MENUS.hippodrome,
    ),
  };
}

export function MenuProvider({ children }: { children: ReactNode }) {
  const { franchiseId } = useFranchise();
  const [allMenus, setAllMenus] =
    useState<Record<FranchiseId, MenuItem[]>>(EMPTY_MENUS);
  const [allCategories, setAllCategories] = useState<
    Record<FranchiseId, MenuCategoryDef[]>
  >({ center: [], hippodrome: [] });
  const [contentReady, setContentReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "loading" | "saving" | "error"
  >("loading");
  const [savedMenus, setSavedMenus] = useState<Record<
    FranchiseId,
    MenuItem[]
  > | null>(null);
  const [savedCategories, setSavedCategories] = useState<Record<
    FranchiseId,
    MenuCategoryDef[]
  > | null>(null);

  const snapshot = (data: unknown) => JSON.stringify(data);

  const saveMenus = useCallback(async (): Promise<boolean> => {
    setSyncStatus("saving");
    const [menusResult, categoriesResult] = await Promise.all([
      saveContent("/api/content/menus", allMenus),
      saveContent("/api/content/menu-categories", allCategories),
    ]);
    if (menusResult.ok && categoriesResult.ok) {
      writeContentCache(CACHE_MENUS, allMenus);
      writeContentCache(CACHE_MENU_CATEGORIES, allCategories);
      setSavedMenus(allMenus);
      setSavedCategories(allCategories);
      setSyncStatus("idle");
      return true;
    }
    setSyncStatus("error");
    return false;
  }, [allMenus, allCategories]);

  const isDirty = useMemo(() => {
    if (!hydrated || !savedMenus || !savedCategories) return false;
    return (
      snapshot(allMenus) !== snapshot(savedMenus) ||
      snapshot(allCategories) !== snapshot(savedCategories)
    );
  }, [allMenus, allCategories, savedMenus, savedCategories, hydrated]);

  useEffect(() => {
    let cancelled = false;

    const cachedMenus =
      readContentCache<Record<FranchiseId, MenuItem[]>>(CACHE_MENUS);
    const cachedCategories = readContentCache<
      Record<FranchiseId, MenuCategoryDef[]>
    >(CACHE_MENU_CATEGORIES);

    if (cachedMenus?.center || cachedMenus?.hippodrome) {
      const fromCache = normalizeMenus(cachedMenus);
      setAllMenus(fromCache);
      setSavedMenus(fromCache);
      const cats = normalizeMenuCategories(
        cachedCategories ?? undefined,
        fromCache,
      );
      setAllCategories(cats);
      setSavedCategories(cats);
      setContentReady(true);
    }

    (async () => {
      setSyncStatus("loading");
      const [menusData, categoriesData] = await Promise.all([
        fetchContent<Record<FranchiseId, MenuItem[]>>("/api/content/menus"),
        fetchContent<Record<FranchiseId, MenuCategoryDef[]>>(
          "/api/content/menu-categories",
        ),
      ]);
      if (cancelled) return;

      let nextMenus = INITIAL_MENUS;
      if (cachedMenus?.center || cachedMenus?.hippodrome) {
        nextMenus = normalizeMenus(cachedMenus);
      }

      if (menusData) {
        nextMenus = normalizeMenus(menusData);
        setAllMenus(nextMenus);
        writeContentCache(CACHE_MENUS, nextMenus);
        setSavedMenus(nextMenus);
      } else if (!cachedMenus?.center && !cachedMenus?.hippodrome) {
        setAllMenus(INITIAL_MENUS);
        setSavedMenus(INITIAL_MENUS);
        nextMenus = INITIAL_MENUS;
      }

      const nextCategories = normalizeMenuCategories(
        categoriesData ?? cachedCategories ?? INITIAL_MENU_CATEGORIES,
        nextMenus,
      );
      setAllCategories(nextCategories);
      writeContentCache(CACHE_MENU_CATEGORIES, nextCategories);
      setSavedCategories(nextCategories);

      setContentReady(true);
      setHydrated(true);
      setSyncStatus("idle");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const addMenuItem = useCallback(
    (item: NewItem) => {
      const id = `${franchiseId}-${Date.now().toString(36)}`;
      setAllMenus((prev) => ({
        ...prev,
        [franchiseId]: [
          ...(prev[franchiseId] ?? []),
          {
            ...item,
            id,
            available: item.available ?? true,
            image: item.image ?? dishImageFor(item.category),
          },
        ],
      }));
    },
    [franchiseId],
  );

  const updateMenuItem = useCallback(
    (id: string, patch: Partial<MenuItem>) => {
      setAllMenus((prev) => {
        const list = prev[franchiseId] ?? [];
        return {
          ...prev,
          [franchiseId]: list.map((i) =>
            i.id === id ? { ...i, ...patch } : i,
          ),
        };
      });
    },
    [franchiseId],
  );

  const removeMenuItem = useCallback(
    (id: string) => {
      setAllMenus((prev) => ({
        ...prev,
        [franchiseId]: (prev[franchiseId] ?? []).filter((i) => i.id !== id),
      }));
    },
    [franchiseId],
  );

  const toggleAvailable = useCallback(
    (id: string) => {
      setAllMenus((prev) => ({
        ...prev,
        [franchiseId]: (prev[franchiseId] ?? []).map((i) =>
          i.id === id ? { ...i, available: !i.available } : i,
        ),
      }));
    },
    [franchiseId],
  );

  const addCategory = useCallback(
    (label: string) => {
      const trimmed = label.trim();
      if (!trimmed) {
        return { ok: false as const, message: "Введите название категории" };
      }

      const list = allCategories[franchiseId] ?? [];
      const existingIds = new Set(list.map((c) => c.id));
      const id = suggestCategoryId(trimmed, existingIds);

      setAllCategories((prev) => ({
        ...prev,
        [franchiseId]: [...(prev[franchiseId] ?? []), { id, label: trimmed }],
      }));

      return { ok: true as const, id };
    },
    [allCategories, franchiseId],
  );

  const updateCategory = useCallback(
    (id: string, patch: Partial<MenuCategoryDef>) => {
      setAllCategories((prev) => ({
        ...prev,
        [franchiseId]: (prev[franchiseId] ?? []).map((c) =>
          c.id === id ? { ...c, ...patch, id: c.id } : c,
        ),
      }));
    },
    [franchiseId],
  );

  const removeCategory = useCallback(
    (id: string) => {
      const used = (allMenus[franchiseId] ?? []).some((i) => i.category === id);
      if (used) {
        return {
          ok: false as const,
          message: "Сначала перенесите или удалите блюда в этой категории",
        };
      }

      setAllCategories((prev) => ({
        ...prev,
        [franchiseId]: (prev[franchiseId] ?? []).filter((c) => c.id !== id),
      }));
      return { ok: true as const };
    },
    [allMenus, franchiseId],
  );

  const moveCategory = useCallback(
    (id: string, direction: "up" | "down") => {
      setAllCategories((prev) => {
        const list = [...(prev[franchiseId] ?? [])];
        const index = list.findIndex((c) => c.id === id);
        if (index < 0) return prev;
        const target = direction === "up" ? index - 1 : index + 1;
        if (target < 0 || target >= list.length) return prev;
        [list[index], list[target]] = [list[target], list[index]];
        return { ...prev, [franchiseId]: list };
      });
    },
    [franchiseId],
  );

  const applyFrontPadProducts = useCallback(
    (products: FrontPadProductSync[]) => {
      let updated = 0;
      let assigned = 0;
      let skipped = 0;
      let mismatches: FrontPadSyncMismatch[] = [];

      setAllMenus((prev) => {
        const result = syncMenuWithFrontPadProducts(
          prev[franchiseId] ?? [],
          products,
        );
        updated = result.updated;
        assigned = result.assigned;
        skipped = result.skipped;
        mismatches = result.mismatches;
        return { ...prev, [franchiseId]: result.items };
      });

      return { updated, assigned, skipped, mismatches };
    },
    [franchiseId],
  );

  const categories = useMemo(() => {
    const list = allCategories[franchiseId] ?? [];
    return mergeCategoriesWithItems(list, allMenus[franchiseId] ?? []);
  }, [allCategories, allMenus, franchiseId]);

  const value = useMemo(
    () => ({
      items: allMenus[franchiseId] ?? allMenus.center ?? [],
      allMenus,
      categories,
      allCategories,
      addMenuItem,
      updateMenuItem,
      removeMenuItem,
      toggleAvailable,
      addCategory,
      updateCategory,
      removeCategory,
      moveCategory,
      applyFrontPadProducts,
      saveMenus,
      isDirty,
      syncStatus,
      contentReady,
    }),
    [
      allMenus,
      allCategories,
      categories,
      franchiseId,
      addMenuItem,
      updateMenuItem,
      removeMenuItem,
      toggleAvailable,
      addCategory,
      updateCategory,
      removeCategory,
      moveCategory,
      applyFrontPadProducts,
      saveMenus,
      isDirty,
      syncStatus,
      contentReady,
    ],
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu must be used within MenuProvider");
  return ctx;
}
