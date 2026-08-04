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
  /** sessionStorage прочитан */
  ready: boolean;
}

const FranchiseContext = createContext<FranchiseContextValue | null>(null);
const STORAGE_KEY = "vechera-franchise";
const FRANCHISE_CHANGE = "vechera-franchise-change";

/** Если sessionStorage недоступен — держим выбор в памяти на время вкладки */
let memoryFranchiseId: FranchiseId | null = null;

function franchiseStorage(): Storage | null {
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

function notifyFranchiseChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(FRANCHISE_CHANGE));
  }
}

/** Синхронная проверка — не ждём React state после выбора на /pick */
export function hasStoredFranchise(): boolean {
  if (memoryFranchiseId) return true;
  const storage = franchiseStorage();
  if (!storage) return false;
  try {
    const raw = storage.getItem(STORAGE_KEY);
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
  if (memoryFranchiseId && FRANCHISES[memoryFranchiseId]) {
    return { id: memoryFranchiseId };
  }

  const storage = franchiseStorage();
  if (!storage) return { id: null };

  try {
    // Старое localStorage больше не используем — выбор только на сессию
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }

    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { id: null };

    if (FRANCHISES[raw as FranchiseId]) {
      return { id: raw as FranchiseId };
    }

    const mapped = LEGACY_FRANCHISE[raw];
    if (mapped && FRANCHISES[mapped]) {
      storage.setItem(STORAGE_KEY, mapped);
      return { id: mapped };
    }

    storage.removeItem(STORAGE_KEY);
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
      memoryFranchiseId = stored.id;
      setFranchiseIdState(stored.id);
      setNeedsPick(false);
    } else {
      setNeedsPick(true);
    }
    setReady(true);
  }, []);

  const setFranchiseId = useCallback((id: FranchiseId) => {
    if (!FRANCHISES[id]) return;
    memoryFranchiseId = id;
    setFranchiseIdState(id);
    setNeedsPick(false);
    try {
      franchiseStorage()?.setItem(STORAGE_KEY, id);
    } catch {
      /* private mode / blocked storage */
    }
    notifyFranchiseChange();
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
