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
import { formatPhoneDisplay } from "@/lib/phone";
import { syncUserToCheckout } from "@/lib/sync-user-checkout";

export type AccountUser = {
  phone: string;
  phoneDisplay: string;
  name?: string;
};

interface UserContextValue {
  user: AccountUser | null;
  ready: boolean;
  login: (
    phone: string,
    password: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  register: (
    name: string,
    phone: string,
    password: string,
    passwordConfirm: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (name: string) => Promise<{ ok: boolean; message?: string }>;
}

const UserContext = createContext<UserContextValue | null>(null);

function applyUser(data: AccountUser | null) {
  if (data) syncUserToCheckout(data);
}

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
      const next = data.ok && data.user ? data.user : null;
      setUser(next);
      applyUser(next);
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
    async (phone: string, password: string) => {
      try {
        const res = await fetch("/api/account/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, password }),
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

  const register = useCallback(
    async (
      name: string,
      phone: string,
      password: string,
      passwordConfirm: string,
    ) => {
      try {
        const res = await fetch("/api/account/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, password, passwordConfirm }),
        });
        const data = (await res.json()) as {
          ok: boolean;
          message?: string;
        };
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            message: data.message || "Не удалось зарегистрироваться",
          };
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

  const updateProfile = useCallback(
    async (name: string) => {
      try {
        const res = await fetch("/api/account/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        const data = (await res.json()) as {
          ok: boolean;
          message?: string;
          user?: { phone: string; name?: string };
        };
        if (!res.ok || !data.ok) {
          return {
            ok: false,
            message: data.message || "Не удалось сохранить",
          };
        }
        await refresh();
        if (data.user) {
          syncUserToCheckout({
            phone: data.user.phone,
            phoneDisplay: formatPhoneDisplay(data.user.phone),
            name: data.user.name,
          });
        }
        return { ok: true };
      } catch {
        return { ok: false, message: "Сеть недоступна" };
      }
    },
    [refresh],
  );

  const value = useMemo(
    () => ({ user, ready, login, register, logout, refresh, updateProfile }),
    [user, ready, login, register, logout, refresh, updateProfile],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
