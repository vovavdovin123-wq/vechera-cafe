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
  CACHE_PROMOS,
  readContentCache,
  writeContentCache,
} from "@/lib/content-cache";
import { fetchContent, saveContent } from "@/lib/content-sync";
import {
  DEFAULT_OVERLAY_STRENGTH,
  DEFAULT_OVERLAY_TINT,
  type PromoOverlayTint,
} from "@/lib/promo-overlay";
import { PROMO_SLIDES, type PromoSlide } from "@/lib/promos";

interface PromoContextValue {
  slides: PromoSlide[];
  addSlide: (slide: Omit<PromoSlide, "id">) => void;
  updateSlide: (id: string, patch: Partial<PromoSlide>) => void;
  removeSlide: (id: string) => void;
  savePromos: () => Promise<boolean>;
  isDirty: boolean;
  syncStatus: "idle" | "loading" | "saving" | "error";
  contentReady: boolean;
}

const PromoContext = createContext<PromoContextValue | null>(null);

function normalizeSlide(raw: Partial<PromoSlide> & { id: string }): PromoSlide {
  const tint = raw.overlayTint as PromoOverlayTint | undefined;
  const validTint =
    tint === "green" ||
    tint === "orange" ||
    tint === "brown" ||
    tint === "none"
      ? tint
      : DEFAULT_OVERLAY_TINT;

  return {
    id: raw.id,
    title: raw.title ?? "",
    subtitle: raw.subtitle ?? "",
    badge: raw.badge ?? "Акция",
    image: raw.image ?? "",
    overlayTint: validTint,
    overlayStrength:
      typeof raw.overlayStrength === "number"
        ? Math.max(0, Math.min(100, raw.overlayStrength))
        : DEFAULT_OVERLAY_STRENGTH,
  };
}

export function PromoProvider({ children }: { children: ReactNode }) {
  const [slides, setSlides] = useState<PromoSlide[]>([]);
  const [savedSlides, setSavedSlides] = useState<PromoSlide[]>([]);
  const [contentReady, setContentReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "loading" | "saving" | "error"
  >("loading");

  useEffect(() => {
    let cancelled = false;

    const cached = readContentCache<PromoSlide[]>(CACHE_PROMOS);
    if (cached?.length) {
      const next = cached.map((s) => normalizeSlide(s));
      setSlides(next);
      setSavedSlides(next);
      setContentReady(true);
    }

    (async () => {
      setSyncStatus("loading");
      const data = await fetchContent<PromoSlide[]>("/api/content/promos");
      if (cancelled) return;
      if (data?.length) {
        const next = data.map((s) => normalizeSlide(s));
        setSlides(next);
        setSavedSlides(next);
        writeContentCache(CACHE_PROMOS, next);
      } else if (!cached?.length) {
        setSlides(PROMO_SLIDES);
        setSavedSlides(PROMO_SLIDES);
      }
      setContentReady(true);
      setSyncStatus("idle");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addSlide = useCallback((slide: Omit<PromoSlide, "id">) => {
    const id = `promo-${Date.now().toString(36)}`;
    setSlides((prev) => [...prev, normalizeSlide({ ...slide, id })]);
  }, []);

  const updateSlide = useCallback((id: string, patch: Partial<PromoSlide>) => {
    setSlides((prev) =>
      prev.map((slide) =>
        slide.id === id ? normalizeSlide({ ...slide, ...patch, id }) : slide,
      ),
    );
  }, []);

  const removeSlide = useCallback((id: string) => {
    setSlides((prev) => prev.filter((slide) => slide.id !== id));
  }, []);

  const savePromos = useCallback(async () => {
    setSyncStatus("saving");
    const result = await saveContent("/api/content/promos", slides);
    if (result.ok) {
      const next = result.data?.length
        ? result.data.map((s) => normalizeSlide(s))
        : slides;
      setSlides(next);
      setSavedSlides(next);
      writeContentCache(CACHE_PROMOS, next);
      setSyncStatus("idle");
      return true;
    }
    setSyncStatus("error");
    return false;
  }, [slides]);

  const isDirty = useMemo(
    () => JSON.stringify(slides) !== JSON.stringify(savedSlides),
    [slides, savedSlides],
  );

  const value = useMemo(
    () => ({
      slides,
      addSlide,
      updateSlide,
      removeSlide,
      savePromos,
      isDirty,
      syncStatus,
      contentReady,
    }),
    [
      slides,
      addSlide,
      updateSlide,
      removeSlide,
      savePromos,
      isDirty,
      syncStatus,
      contentReady,
    ],
  );

  return <PromoContext.Provider value={value}>{children}</PromoContext.Provider>;
}

export function usePromos() {
  const ctx = useContext(PromoContext);
  if (!ctx) throw new Error("usePromos must be used within PromoProvider");
  return ctx;
}
