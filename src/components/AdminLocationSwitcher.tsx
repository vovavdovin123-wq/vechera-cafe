"use client";

import { FRANCHISE_TAB_LABELS } from "@/lib/franchises";
import { useFranchise } from "@/context/FranchiseContext";
import type { FranchiseId } from "@/lib/types";

const LOCATIONS: FranchiseId[] = [
  "center",
  "centerCoffee",
  "hippodrome",
  "hippodromeCoffee",
];

export function AdminLocationSwitcher({ className = "" }: { className?: string }) {
  const { franchiseId, setFranchiseId } = useFranchise();

  return (
    <div
      className={`inline-flex max-w-full flex-wrap rounded-full border border-white/20 bg-black/15 p-0.5 ${className}`}
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
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
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
