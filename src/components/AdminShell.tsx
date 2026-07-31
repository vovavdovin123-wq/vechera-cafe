"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Loader2, LogOut } from "lucide-react";
import { AdminLocationSwitcher } from "@/components/AdminLocationSwitcher";
import { AdminNav, type AdminTab } from "@/components/AdminNav";
import { AdminOrderAlerts } from "@/components/AdminOrderAlerts";
import { AdminSyncIndicator } from "@/components/AdminSyncIndicator";
import { BrandLogo } from "@/components/BrandLogo";
import { PAGE } from "@/lib/layout";

const AdminAuthContext = createContext<"loading" | "guest" | "ok">("loading");

export function AdminShell({
  active,
  title,
  subtitle,
  showLocation = false,
  showLocationSwitcher = true,
  children,
}: {
  active: AdminTab;
  title: string;
  subtitle: string;
  showLocation?: boolean;
  showLocationSwitcher?: boolean;
  children: ReactNode;
}) {
  const [auth, setAuth] = useState<"loading" | "guest" | "ok">("loading");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((d: { ok: boolean }) => setAuth(d.ok ? "ok" : "guest"))
      .catch(() => setAuth("guest"));
  }, []);

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setAuthError(data.message || "Ошибка входа");
        return;
      }
      setAuth("ok");
      setPassword("");
    } catch {
      setAuthError("Сеть недоступна");
    } finally {
      setAuthLoading(false);
    }
  }

  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuth("guest");
  }

  if (auth === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-muted">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  if (auth === "guest") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4 py-8">
        <form
          onSubmit={onLogin}
          className="w-full max-w-sm rounded-[22px] border border-line bg-surface p-5 shadow-[var(--shadow)] sm:p-6"
        >
          <BrandLogo href="/" size="sm" />
          <p className="mt-4 text-lg font-semibold text-ink">Вход в админ панель</p>
          <p className="mt-1 text-sm text-ink-muted">/admin</p>
          <input
            required
            autoComplete="username"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="Логин"
            className="mt-5 w-full rounded-2xl border border-line bg-bg/40 px-4 py-2.5 text-base outline-none focus:border-accent sm:text-sm"
          />
          <input
            required
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="mt-2 w-full rounded-2xl border border-line bg-bg/40 px-4 py-2.5 text-base outline-none focus:border-accent sm:text-sm"
          />
          {authError && (
            <p className="mt-2 text-xs text-danger">{authError}</p>
          )}
          <button
            type="submit"
            disabled={authLoading}
            className="btn-soft mt-4 w-full disabled:opacity-50"
          >
            {authLoading ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              "Войти"
            )}
          </button>
          <Link
            href="/"
            className="mt-3 block text-center text-sm text-ink-muted transition hover:text-ink"
          >
            На сайт
          </Link>
        </form>
      </div>
    );
  }

  return (
    <AdminAuthContext.Provider value={auth}>
      <AdminOrderAlerts />
      <div className="min-h-screen min-h-[100dvh]">
        <header className="admin-top sticky top-0 z-40 border-b border-white/10 bg-[color-mix(in_srgb,var(--espresso)_92%,black)] text-white shadow-[var(--shadow-soft)] backdrop-blur-md pt-[env(safe-area-inset-top)]">
          <div className={`${PAGE} py-3 sm:py-3.5`}>
            <div className="flex items-start justify-between gap-2 sm:items-center sm:gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <BrandLogo variant="light" href="/admin" size="sm" />
                  <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:hidden">
                    <Link
                      href="/"
                      className="rounded-full border border-white/25 px-2.5 py-1.5 text-xs text-white/90 transition hover:border-[var(--gold)] hover:bg-white/10"
                    >
                      Сайт
                    </Link>
                    <button
                      type="button"
                      onClick={onLogout}
                      className="inline-flex items-center gap-1 rounded-full border border-white/25 px-2.5 py-1.5 text-xs text-white/90 transition hover:border-[var(--gold)] hover:bg-white/10"
                      aria-label="Выйти"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <AdminNav active={active} />
              </div>
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                {showLocationSwitcher && (
                  <AdminLocationSwitcher className="hidden lg:inline-flex" />
                )}
                <Link
                  href="/"
                  className="rounded-full border border-white/25 px-3 py-1.5 text-sm text-white/90 transition hover:border-[var(--gold)] hover:bg-white/10"
                >
                  Сайт
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1.5 text-sm text-white/90 transition hover:border-[var(--gold)] hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline">Выйти</span>
                </button>
              </div>
            </div>
            {showLocationSwitcher && (
              <AdminLocationSwitcher className="mt-2.5 lg:hidden" />
            )}
          </div>
        </header>

        <main className={`${PAGE} py-5 sm:py-8`}>
          <h1 className="font-display text-xl font-normal uppercase tracking-wide text-[var(--espresso)] sm:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
          )}
          <AdminSyncIndicator />
          {showLocation && (
            <p className="admin-location-hint mt-3 max-w-full break-words">
              Редактируете меню и интерьер для выбранной точки выше
            </p>
          )}
          <div className="min-w-0">{children}</div>
        </main>
      </div>
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
