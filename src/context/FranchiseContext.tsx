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
  /** Первый визит — нужно выбрать точку */
  needsPick: boolean;
}

const FranchiseContext = createContext<FranchiseContextValue | null>(null);
const STORAGE_KEY = "vechera-franchise";

/** Старые id кофеен → родительская точка */
const LEGACY_FRANCHISE: Record<string, FranchiseId> = {
  centerCoffee: "center",
  hippodromeCoffee: "hippodrome",
};

function readStoredFranchise(): {
  id: FranchiseId | null;
  needsPick: boolean;
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { id: null, needsPick: true };

    if (FRANCHISES[raw as FranchiseId]) {
      return { id: raw as FranchiseId, needsPick: false };
    }

    const mapped = LEGACY_FRANCHISE[raw];
    if (mapped && FRANCHISES[mapped]) {
      localStorage.setItem(STORAGE_KEY, mapped);
      return { id: mapped, needsPick: false };
    }

    localStorage.removeItem(STORAGE_KEY);
    return { id: null, needsPick: true };
  } catch {
    return { id: null, needsPick: true };
  }
}

export function FranchiseProvider({ children }: { children: ReactNode }) {
  const [franchiseId, setFranchiseIdState] = useState<FranchiseId>("center");
  const [needsPick, setNeedsPick] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredFranchise();
    if (stored.id) setFranchiseIdState(stored.id);
    setNeedsPick(stored.needsPick);
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
    }),
    [franchise, setFranchiseId, needsPick],
  );

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-muted">
        Загрузка…
      </div>
    );
  }

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
