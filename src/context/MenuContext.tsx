"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { debounce, fetchContent, saveContent } from "@/lib/content-sync";
import { CATEGORY_IMAGES, INITIAL_MENUS } from "@/lib/menu-data";
import type { FranchiseId, MenuItem } from "@/lib/types";
import { useFranchise } from "./FranchiseContext";

type NewItem = Omit<MenuItem, "id" | "available" | "image"> & {
  available?: boolean;
  image?: string;
};

interface MenuContextValue {
  items: MenuItem[];
  allMenus: Record<FranchiseId, MenuItem[]>;
  addMenuItem: (item: NewItem) => void;
  updateMenuItem: (id: string, patch: Partial<MenuItem>) => void;
  removeMenuItem: (id: string) => void;
  toggleAvailable: (id: string) => void;
  syncStatus: "idle" | "loading" | "saving" | "error";
}

const MenuContext = createContext<MenuContextValue | null>(null);

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
    useState<Record<FranchiseId, MenuItem[]>>(INITIAL_MENUS);
  const [hydrated, setHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "loading" | "saving" | "error"
  >("loading");
  const skipSave = useRef(true);

  const persist = useMemo(
    () =>
      debounce(async (data: Record<FranchiseId, MenuItem[]>) => {
        setSyncStatus("saving");
        const result = await saveContent("/api/content/menus", data);
        if (result.ok) {
          // Не перезаписываем локальное меню ответом сервера —
          // иначе гонка откатывает только что сменённое фото.
          setSyncStatus("idle");
        } else {
          setSyncStatus("error");
        }
      }, 600),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSyncStatus("loading");
      const data = await fetchContent<Record<FranchiseId, MenuItem[]>>(
        "/api/content/menus",
      );
      if (cancelled) return;
      if (data) setAllMenus(normalizeMenus(data));
      setHydrated(true);
      setSyncStatus("idle");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    persist(allMenus);
  }, [allMenus, hydrated, persist]);

  const addMenuItem = useCallback(
    (item: NewItem) => {
      const id = `${franchiseId}-${Date.now().toString(36)}`;
      setAllMenus((prev) => ({
        ...prev,
        [franchiseId]: [
          ...prev[franchiseId],
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
        [franchiseId]: prev[franchiseId].filter((i) => i.id !== id),
      }));
    },
    [franchiseId],
  );

  const toggleAvailable = useCallback(
    (id: string) => {
      setAllMenus((prev) => ({
        ...prev,
        [franchiseId]: prev[franchiseId].map((i) =>
          i.id === id ? { ...i, available: !i.available } : i,
        ),
      }));
    },
    [franchiseId],
  );

  const value = useMemo(
    () => ({
      items: allMenus[franchiseId] ?? allMenus.center ?? [],
      allMenus,
      addMenuItem,
      updateMenuItem,
      removeMenuItem,
      toggleAvailable,
      syncStatus,
    }),
    [
      allMenus,
      franchiseId,
      addMenuItem,
      updateMenuItem,
      removeMenuItem,
      toggleAvailable,
      syncStatus,
    ],
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu must be used within MenuProvider");
  return ctx;
}
