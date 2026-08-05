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

export type AccountUser = {
  phone: string;
  phoneDisplay: string;
  name?: string;
};

interface UserContextValue {
  user: AccountUser | null;
  ready: boolean;
  login: (phone: string, name?: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/account/session");
      const data = (await res.json()) as {
        ok: boolean;
        user?: AccountUser | null;
      };
      setUser(data.ok && data.user ? data.user : null);
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (phone: string, name?: string) => {
      try {
        const res = await fetch("/api/account/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, name }),
        });
        const data = (await res.json()) as {
          ok: boolean;
          message?: string;
          user?: { phone: string; name?: string };
        };
        if (!res.ok || !data.ok) {
          return { ok: false, message: data.message || "Не удалось войти" };
        }
        await refresh();
        return { ok: true };
      } catch {
        return { ok: false, message: "Сеть недоступна" };
      }
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/account/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, logout, refresh }),
    [user, ready, login, logout, refresh],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
