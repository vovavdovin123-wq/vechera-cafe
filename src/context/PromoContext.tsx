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
  syncStatus: "idle" | "loading" | "saving" | "error";
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
  const [slides, setSlides] = useState<PromoSlide[]>(PROMO_SLIDES);
  const [hydrated, setHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "loading" | "saving" | "error"
  >("loading");
  const skipSave = useRef(true);

  const persist = useMemo(
    () =>
      debounce(async (data: PromoSlide[]) => {
        setSyncStatus("saving");
        const result = await saveContent("/api/content/promos", data);
        if (result.ok && result.data) {
          skipSave.current = true;
          setSlides(result.data.map((s) => normalizeSlide(s)));
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
      const data = await fetchContent<PromoSlide[]>("/api/content/promos");
      if (cancelled) return;
      if (data?.length) {
        setSlides(data.map((s) => normalizeSlide(s)));
      }
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
    persist(slides);
  }, [slides, hydrated, persist]);

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

  const value = useMemo(
    () => ({
      slides,
      addSlide,
      updateSlide,
      removeSlide,
      syncStatus,
    }),
    [slides, addSlide, updateSlide, removeSlide, syncStatus],
  );

  return <PromoContext.Provider value={value}>{children}</PromoContext.Provider>;
}

export function usePromos() {
  const ctx = useContext(PromoContext);
  if (!ctx) throw new Error("usePromos must be used within PromoProvider");
  return ctx;
}
