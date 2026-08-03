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
import type { Franchise, FranchiseId } from "@/lib/types";
import { FRANCHISES } from "@/lib/franchises";

interface FranchiseContextValue {
  franchiseId: FranchiseId;
  franchise: Franchise;
  setFranchiseId: (id: FranchiseId) => void;
  /** Нужно выбрать точку (показывается при каждом заходе) */
  needsPick: boolean;
}

const FranchiseContext = createContext<FranchiseContextValue | null>(null);
const STORAGE_KEY = "vechera-franchise";

/** Старые id кофеен → родительская точка */
const LEGACY_FRANCHISE: Record<string, FranchiseId> = {
  centerCoffee: "center",
  hippodromeCoffee: "hippodrome",
};

function readStoredFranchise(): { id: FranchiseId | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { id: null };

    if (FRANCHISES[raw as FranchiseId]) {
      return { id: raw as FranchiseId };
    }

    const mapped = LEGACY_FRANCHISE[raw];
    if (mapped && FRANCHISES[mapped]) {
      localStorage.setItem(STORAGE_KEY, mapped);
      return { id: mapped };
    }

    localStorage.removeItem(STORAGE_KEY);
    return { id: null };
  } catch {
    return { id: null };
  }
}

export function FranchiseProvider({ children }: { children: ReactNode }) {
  const [franchiseId, setFranchiseIdState] = useState<FranchiseId>("center");
  /** Окно выбора точки — при каждом заходе на сайт */
  const [needsPick, setNeedsPick] = useState(true);

  useEffect(() => {
    const stored = readStoredFranchise();
    if (stored.id) setFranchiseIdState(stored.id);
  }, []);

  const setFranchiseId = useCallback((id: FranchiseId) => {
    if (!FRANCHISES[id]) return;
    setFranchiseIdState(id);
    setNeedsPick(false);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* private mode / blocked storage */
    }
  }, []);

  const franchise = FRANCHISES[franchiseId] ?? FRANCHISES.center;

  const value = useMemo(
    () => ({
      franchiseId: franchise.id,
      franchise,
      setFranchiseId,
      needsPick,
    }),
    [franchise, setFranchiseId, needsPick],
  );

  return (
    <FranchiseContext.Provider value={value}>
      {children}
    </FranchiseContext.Provider>
  );
}

export function useFranchise() {
  const ctx = useContext(FranchiseContext);
  if (!ctx) throw new Error("useFranchise must be used within FranchiseProvider");
  return ctx;
}
