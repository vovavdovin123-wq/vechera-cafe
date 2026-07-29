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
}

const FranchiseContext = createContext<FranchiseContextValue | null>(null);
const STORAGE_KEY = "vechera-franchise";

export function FranchiseProvider({ children }: { children: ReactNode }) {
  const [franchiseId, setFranchiseIdState] = useState<FranchiseId>("center");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as FranchiseId | null;
    if (saved && FRANCHISES[saved]) setFranchiseIdState(saved);
    setReady(true);
  }, []);

  const setFranchiseId = useCallback((id: FranchiseId) => {
    setFranchiseIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const value = useMemo(
    () => ({
      franchiseId,
      franchise: FRANCHISES[franchiseId],
      setFranchiseId,
    }),
    [franchiseId, setFranchiseId],
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
