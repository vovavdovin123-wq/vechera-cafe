/** Локальный кэш контента — чтобы при F5 не мигали дефолтные фото */

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function readContentCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    return safeParse<T>(localStorage.getItem(key));
  } catch {
    return null;
  }
}

export function writeContentCache(key: string, data: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

export const CACHE_MENUS = "vechera-cache-menus";
export const CACHE_INTERIOR = "vechera-cache-interior";
export const CACHE_PROMOS = "vechera-cache-promos";
