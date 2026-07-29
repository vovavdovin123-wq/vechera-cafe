"use client";

import { useFranchise } from "@/context/FranchiseContext";
import type { FranchiseId } from "@/lib/types";

const LOCATIONS: { id: FranchiseId; label: string }[] = [
  { id: "center", label: "Центр" },
  { id: "hippodrome", label: "Ипподром" },
];

export function AdminLocationSwitcher({ className = "" }: { className?: string }) {
  const { franchiseId, setFranchiseId } = useFranchise();

  return (
    <div
      className={`inline-flex rounded-full border border-white/20 bg-black/15 p-0.5 ${className}`}
      role="group"
      aria-label="Выбор точки"
    >
      {LOCATIONS.map((loc) => {
        const active = franchiseId === loc.id;
        return (
          <button
            key={loc.id}
            type="button"
            aria-pressed={active}
            onClick={() => setFranchiseId(loc.id)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              active
                ? "bg-[var(--orange)] text-ink shadow-sm"
                : "text-white/75 hover:bg-white/10 hover:text-white"
            }`}
          >
            {loc.label}
          </button>
        );
      })}
    </div>
  );
}
