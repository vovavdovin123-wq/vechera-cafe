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
  /** true — точка не выбрана, нужна страница /pick */
  needsPick: boolean;
  /** localStorage прочитан */
  ready: boolean;
}

const FranchiseContext = createContext<FranchiseContextValue | null>(null);
const STORAGE_KEY = "vechera-franchise";

/** Синхронная проверка — не ждём React state после выбора на /pick */
export function hasStoredFranchise(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "center" || raw === "hippodrome") return true;
    if (raw === "centerCoffee" || raw === "hippodromeCoffee") return true;
    return false;
  } catch {
    return false;
  }
}

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
  const [needsPick, setNeedsPick] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredFranchise();
    if (stored.id) {
      setFranchiseIdState(stored.id);
      setNeedsPick(false);
    } else {
      setNeedsPick(true);
    }
    setReady(true);
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
      ready,
    }),
    [franchise, setFranchiseId, needsPick, ready],
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
