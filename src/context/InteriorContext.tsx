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
import {
  CACHE_INTERIOR,
  readContentCache,
  writeContentCache,
} from "@/lib/content-cache";
import { debounce, fetchContent, saveContent } from "@/lib/content-sync";
import { DEFAULT_INTERIOR, type InteriorPhoto } from "@/lib/interior-data";
import type { FranchiseId } from "@/lib/types";
import { useFranchise } from "./FranchiseContext";

interface InteriorContextValue {
  photos: InteriorPhoto[];
  addPhoto: (src: string) => void;
  updatePhoto: (id: string, src: string) => void;
  removePhoto: (id: string) => void;
  syncStatus: "idle" | "loading" | "saving" | "error";
  contentReady: boolean;
}

const InteriorContext = createContext<InteriorContextValue | null>(null);

const EMPTY_INTERIOR: Record<FranchiseId, InteriorPhoto[]> = {
  center: [],
  hippodrome: [],
};

function normalizeInterior(
  data: Partial<Record<FranchiseId, InteriorPhoto[]>>,
): Record<FranchiseId, InteriorPhoto[]> {
  return {
    center: data.center ?? DEFAULT_INTERIOR.center,
    hippodrome: data.hippodrome ?? DEFAULT_INTERIOR.hippodrome,
  };
}

export function InteriorProvider({ children }: { children: ReactNode }) {
  const { franchiseId } = useFranchise();
  const [allPhotos, setAllPhotos] =
    useState<Record<FranchiseId, InteriorPhoto[]>>(EMPTY_INTERIOR);
  const [contentReady, setContentReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "loading" | "saving" | "error"
  >("loading");
  const skipSave = useRef(true);

  const persist = useMemo(
    () =>
      debounce(async (data: Record<FranchiseId, InteriorPhoto[]>) => {
        setSyncStatus("saving");
        const result = await saveContent("/api/content/interior", data);
        if (result.ok) {
          writeContentCache(CACHE_INTERIOR, data);
          setSyncStatus("idle");
        } else {
          setSyncStatus("error");
        }
      }, 600),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const cached =
      readContentCache<Record<FranchiseId, InteriorPhoto[]>>(CACHE_INTERIOR);
    if (cached?.center || cached?.hippodrome) {
      setAllPhotos(normalizeInterior(cached));
      setContentReady(true);
    }

    (async () => {
      setSyncStatus("loading");
      const data = await fetchContent<Record<FranchiseId, InteriorPhoto[]>>(
        "/api/content/interior",
      );
      if (cancelled) return;
      if (data) {
        const next = normalizeInterior(data);
        setAllPhotos(next);
        writeContentCache(CACHE_INTERIOR, next);
      } else if (!cached?.center && !cached?.hippodrome) {
        setAllPhotos(DEFAULT_INTERIOR);
      }
      setContentReady(true);
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
    persist(allPhotos);
  }, [allPhotos, hydrated, persist]);

  const addPhoto = useCallback(
    (src: string) => {
      const id = `${franchiseId}-i-${Date.now().toString(36)}`;
      setAllPhotos((prev) => ({
        ...prev,
        [franchiseId]: [...(prev[franchiseId] ?? []), { id, src }],
      }));
    },
    [franchiseId],
  );

  const updatePhoto = useCallback(
    (id: string, src: string) => {
      setAllPhotos((prev) => ({
        ...prev,
        [franchiseId]: (prev[franchiseId] ?? []).map((p) =>
          p.id === id ? { ...p, src } : p,
        ),
      }));
    },
    [franchiseId],
  );

  const removePhoto = useCallback(
    (id: string) => {
      setAllPhotos((prev) => ({
        ...prev,
        [franchiseId]: (prev[franchiseId] ?? []).filter((p) => p.id !== id),
      }));
    },
    [franchiseId],
  );

  const value = useMemo(
    () => ({
      photos: allPhotos[franchiseId] ?? allPhotos.center ?? [],
      addPhoto,
      updatePhoto,
      removePhoto,
      syncStatus,
      contentReady,
    }),
    [
      allPhotos,
      franchiseId,
      addPhoto,
      updatePhoto,
      removePhoto,
      syncStatus,
      contentReady,
    ],
  );

  return (
    <InteriorContext.Provider value={value}>{children}</InteriorContext.Provider>
  );
}

export function useInterior() {
  const ctx = useContext(InteriorContext);
  if (!ctx) throw new Error("useInterior must be used within InteriorProvider");
  return ctx;
}
