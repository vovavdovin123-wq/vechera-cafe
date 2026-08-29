"use client";

import { FRANCHISE_TAB_LABELS } from "@/lib/franchises";
import { useFranchise } from "@/context/FranchiseContext";
import type { AdminScope } from "@/lib/admin-auth";
import type { FranchiseId } from "@/lib/types";

const LOCATIONS: FranchiseId[] = ["center", "hippodrome"];

export function AdminLocationSwitcher({
  className = "",
  lockedScope = "all",
}: {
  className?: string;
  lockedScope?: AdminScope;
}) {
  const { franchiseId, setFranchiseId } = useFranchise();

  if (lockedScope !== "all") {
    return (
      <div
        className={`inline-flex w-full max-w-full items-center justify-center rounded-full border border-white/20 bg-black/15 px-3 py-2 text-xs font-medium text-white/90 sm:w-auto sm:justify-start ${className}`}
      >
        {FRANCHISE_TAB_LABELS[lockedScope]}
      </div>
    );
  }

  return (
    <div
      className={`flex w-full max-w-full rounded-full border border-white/20 bg-black/15 p-0.5 sm:inline-flex sm:w-auto ${className}`}
      role="group"
      aria-label="Выбор точки"
    >
      {LOCATIONS.map((id) => {
        const active = franchiseId === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => setFranchiseId(id)}
            className={`min-w-0 flex-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition sm:flex-none sm:px-3 sm:py-1 ${
              active
                ? "bg-[var(--orange)] text-ink shadow-sm"
                : "text-white/75 hover:bg-white/10 hover:text-white"
            }`}
          >
            {FRANCHISE_TAB_LABELS[id]}
          </button>
        );
      })}
    </div>
  );
}
