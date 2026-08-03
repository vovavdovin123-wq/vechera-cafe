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
  CACHE_MENUS,
  readContentCache,
  writeContentCache,
} from "@/lib/content-cache";
import { fetchContent, saveContent } from "@/lib/content-sync";
import { CATEGORY_IMAGES, INITIAL_MENUS } from "@/lib/menu-data";
import type { FranchiseId, MenuItem } from "@/lib/types";
import { useFranchise } from "./FranchiseContext";

type NewItem = Omit<MenuItem, "id" | "available" | "image"> & {
  available?: boolean;
  image?: string;
};

export type FrontPadProductSync = {
  article: string;
  name: string;
  price: number;
};

interface MenuContextValue {
  items: MenuItem[];
  allMenus: Record<FranchiseId, MenuItem[]>;
  addMenuItem: (item: NewItem) => void;
  updateMenuItem: (id: string, patch: Partial<MenuItem>) => void;
  removeMenuItem: (id: string) => void;
  toggleAvailable: (id: string) => void;
  /** Обновить name/price у блюд с совпадающим артикулом FrontPad */
  applyFrontPadProducts: (products: FrontPadProductSync[]) => {
    updated: number;
    skipped: number;
  };
  /** Явное сохранение на сервер (админка) */
  saveMenus: () => Promise<boolean>;
  isDirty: boolean;
  syncStatus: "idle" | "loading" | "saving" | "error";
  /** true после первой загрузки с сервера или из кэша */
  contentReady: boolean;
}

const MenuContext = createContext<MenuContextValue | null>(null);

const EMPTY_MENUS: Record<FranchiseId, MenuItem[]> = {
  center: [],
  hippodrome: [],
};

function normalizeMenus(
  data: Partial<Record<string, MenuItem[]>>,
): Record<FranchiseId, MenuItem[]> {
  const legacyCoffee = new Set(["coffee", "tea", "cold"]);

  const fix = (list: MenuItem[], fallback: MenuItem[]) => {
    const mapped = (Array.isArray(list) ? list : []).map((item) => {
      const raw = String(item?.category ?? "");
      const category = (
        legacyCoffee.has(raw) ? "coffeeShop" : item.category
      ) as MenuItem["category"];
      return {
        ...item,
        name: item?.name ?? "",
        description: item?.description ?? "",
        category,
        image:
          item?.image && String(item.image).trim()
            ? String(item.image).trim()
            : CATEGORY_IMAGES[category] || CATEGORY_IMAGES.sandwiches,
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
          category: "coffeeShop" as const,
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
  const [contentReady, setContentReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "loading" | "saving" | "error"
  >("loading");
  const [savedMenus, setSavedMenus] = useState<Record<
    FranchiseId,
    MenuItem[]
  > | null>(null);

  const snapshot = (data: Record<FranchiseId, MenuItem[]>) =>
    JSON.stringify(data);

  const saveMenus = useCallback(async (): Promise<boolean> => {
    setSyncStatus("saving");
    const result = await saveContent("/api/content/menus", allMenus);
    if (result.ok) {
      writeContentCache(CACHE_MENUS, allMenus);
      setSavedMenus(allMenus);
      setSyncStatus("idle");
      return true;
    }
    setSyncStatus("error");
    return false;
  }, [allMenus]);

  const isDirty = useMemo(() => {
    if (!hydrated || !savedMenus) return false;
    return snapshot(allMenus) !== snapshot(savedMenus);
  }, [allMenus, savedMenus, hydrated]);

  useEffect(() => {
    let cancelled = false;

    const cached =
      readContentCache<Record<FranchiseId, MenuItem[]>>(CACHE_MENUS);
    if (cached?.center || cached?.hippodrome) {
      const fromCache = normalizeMenus(cached);
      setAllMenus(fromCache);
      setSavedMenus(fromCache);
      setContentReady(true);
    }

    (async () => {
      setSyncStatus("loading");
      const data = await fetchContent<Record<FranchiseId, MenuItem[]>>(
        "/api/content/menus",
      );
      if (cancelled) return;
      if (data) {
        const next = normalizeMenus(data);
        setAllMenus(next);
        writeContentCache(CACHE_MENUS, next);
        setSavedMenus(next);
      } else if (!cached?.center && !cached?.hippodrome) {
        setAllMenus(INITIAL_MENUS);
        setSavedMenus(INITIAL_MENUS);
      }
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
            image: item.image ?? CATEGORY_IMAGES[item.category],
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

  const applyFrontPadProducts = useCallback(
    (products: FrontPadProductSync[]) => {
      const byArticle = new Map(
        products
          .filter((p) => p.article)
          .map((p) => [String(p.article).trim(), p] as const),
      );

      let updated = 0;
      let skipped = 0;
      let nextMenus: Record<FranchiseId, MenuItem[]> | null = null;

      setAllMenus((prev) => {
        updated = 0;
        skipped = 0;
        const next = { ...prev };
        for (const fid of Object.keys(prev) as FranchiseId[]) {
          next[fid] = (prev[fid] ?? []).map((item) => {
            const art = item.frontpadArticle?.trim();
            if (!art) {
              skipped += 1;
              return item;
            }
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
          });
        }
        nextMenus = next;
        return next;
      });

      // React вызывает updater синхронно — updated/skipped уже заполнены
      void nextMenus;
      return { updated, skipped };
    },
    [],
  );

  const value = useMemo(
    () => ({
      items: allMenus[franchiseId] ?? allMenus.center ?? [],
      allMenus,
      addMenuItem,
      updateMenuItem,
      removeMenuItem,
      toggleAvailable,
      applyFrontPadProducts,
      saveMenus,
      isDirty,
      syncStatus,
      contentReady,
    }),
    [
      allMenus,
      franchiseId,
      addMenuItem,
      updateMenuItem,
      removeMenuItem,
      toggleAvailable,
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
