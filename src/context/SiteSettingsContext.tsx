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
import { readContentCache, writeContentCache } from "@/lib/content-cache";
import { fetchContent, saveContent } from "@/lib/content-sync";
import {
  DEFAULT_SITE_SETTINGS,
  normalizeSiteSettings,
  type SiteSettings,
} from "@/lib/site-settings";

const CACHE_SITE_SETTINGS = "vechera-cache-site-settings-v1";

interface SiteSettingsContextValue {
  settings: SiteSettings;
  updateSettings: (patch: Partial<SiteSettings>) => void;
  saveSettings: () => Promise<boolean>;
  isDirty: boolean;
  syncStatus: "idle" | "loading" | "saving" | "error";
  contentReady: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [dirty, setDirty] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "loading" | "saving" | "error"
  >("loading");

  useEffect(() => {
    let cancelled = false;
    const cached = readContentCache<SiteSettings>(CACHE_SITE_SETTINGS);
    if (cached) {
      const next = normalizeSiteSettings(cached);
      setSettings(next);
      setContentReady(true);
    }

    (async () => {
      setSyncStatus("loading");
      const data = await fetchContent<SiteSettings>("/api/content/site-settings");
      if (cancelled) return;
      if (data) {
        const next = normalizeSiteSettings(data);
        setSettings(next);
        writeContentCache(CACHE_SITE_SETTINGS, next);
      }
      setDirty(false);
      setContentReady(true);
      setSyncStatus("idle");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<SiteSettings>) => {
    setSettings((prev) => normalizeSiteSettings({ ...prev, ...patch }));
    setDirty(true);
  }, []);

  const saveSettings = useCallback(async () => {
    setSyncStatus("saving");
    const result = await saveContent("/api/content/site-settings", settings);
    if (result.ok && result.data) {
      const next = normalizeSiteSettings(result.data);
      setSettings(next);
      writeContentCache(CACHE_SITE_SETTINGS, next);
      setDirty(false);
      setSyncStatus("idle");
      return true;
    }
    setSyncStatus("error");
    return false;
  }, [settings]);

  const isDirty = dirty;

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      saveSettings,
      isDirty,
      syncStatus,
      contentReady,
    }),
    [settings, updateSettings, saveSettings, isDirty, syncStatus, contentReady],
  );

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) {
    throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  }
  return ctx;
}
