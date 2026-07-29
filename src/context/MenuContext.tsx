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
  data: Record<FranchiseId, MenuItem[]>,
): Record<FranchiseId, MenuItem[]> {
  const fix = (list: MenuItem[]) =>
    list.map((item) => ({
      ...item,
      image:
        item.image ||
        CATEGORY_IMAGES[item.category] ||
        CATEGORY_IMAGES.sandwiches,
    }));
  return {
    center: fix(data.center ?? INITIAL_MENUS.center),
    hippodrome: fix(data.hippodrome ?? INITIAL_MENUS.hippodrome),
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
        if (result.ok && result.data) {
          skipSave.current = true;
          setAllMenus(normalizeMenus(result.data));
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
      setAllMenus((prev) => ({
        ...prev,
        [franchiseId]: prev[franchiseId].map((i) =>
          i.id === id ? { ...i, ...patch } : i,
        ),
      }));
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
      items: allMenus[franchiseId],
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
