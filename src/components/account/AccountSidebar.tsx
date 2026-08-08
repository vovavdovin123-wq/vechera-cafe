"use client";

import { LogOut, MapPin, Package, UserRound } from "lucide-react";
import type { AccountUser } from "@/context/UserContext";

export type AccountSection = "orders" | "addresses" | "profile";

const NAV: { id: AccountSection; label: string; icon: typeof Package }[] = [
  { id: "orders", label: "Заказы", icon: Package },
  { id: "addresses", label: "Адрес доставки", icon: MapPin },
  { id: "profile", label: "Данные", icon: UserRound },
];

export function AccountSidebar({
  user,
  section,
  onSectionChange,
  onLogout,
}: {
  user: AccountUser;
  section: AccountSection;
  onSectionChange: (section: AccountSection) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="flex h-fit flex-col rounded-3xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] lg:min-h-[420px] lg:w-[280px] lg:shrink-0">
      <div className="flex items-center gap-3 border-b border-[var(--line)]/70 px-5 py-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--gold-soft)] text-[var(--espresso)]">
          <UserRound className="h-5 w-5" />
        </div>
        <p className="min-w-0 truncate text-sm font-semibold text-ink">
          {user.phoneDisplay}
        </p>
      </div>

      <nav className="flex flex-col gap-1 p-3 lg:flex-1">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = section === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSectionChange(id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                active
                  ? "bg-[var(--gold-soft)]/70 text-[var(--espresso)]"
                  : "text-ink-muted hover:bg-[var(--bg)]/60 hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-[var(--line)]/70 p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-ink-muted transition hover:bg-[var(--danger)]/8 hover:text-[var(--danger)]"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Выйти
        </button>
      </div>
    </aside>
  );
}
