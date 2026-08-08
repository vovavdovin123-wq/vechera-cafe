"use client";

import Link from "next/link";
import { MapPin, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useFranchise } from "@/context/FranchiseContext";
import { PAGE } from "@/lib/layout";

const DISMISS_KEY = "vechera-location-banner-dismiss";

export function LocationBanner() {
  const { franchise, ready, needsPick } = useFranchise();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!ready || needsPick || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={`${PAGE} pt-3 sm:pt-4`}>
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--gold)]/35 bg-[var(--gold-soft)]/50 px-4 py-3 shadow-[var(--shadow-soft)]">
        <MapPin className="h-5 w-5 shrink-0 text-[var(--espresso)]" />
        <p className="min-w-0 flex-1 text-sm text-ink">
          Заказываете из{" "}
          <span className="font-semibold">{franchise.shortAddress}</span>
          {" · "}
          <Link
            href="/pick"
            className="font-medium text-[var(--espresso)] underline underline-offset-2 hover:text-[var(--espresso-soft)]"
          >
            сменить точку
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-full p-1 text-ink-muted transition hover:bg-white/60 hover:text-ink"
          aria-label="Скрыть"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
