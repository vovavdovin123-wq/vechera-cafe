"use client";

import { useEffect } from "react";
import { Clock, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useFranchise } from "@/context/FranchiseContext";
import { FRANCHISE_LIST, FRANCHISE_TAB_LABELS } from "@/lib/franchises";
import type { FranchiseId } from "@/lib/types";

export function FranchiseWelcomeGate() {
  const { needsPick, setFranchiseId } = useFranchise();

  useEffect(() => {
    if (!needsPick) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [needsPick]);

  if (!needsPick) return null;

  function pick(id: FranchiseId) {
    setFranchiseId(id);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="franchise-pick-title"
    >
      <div
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--espresso-deep)_92%,black)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, color-mix(in srgb, var(--gold) 28%, transparent), transparent 55%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex w-full max-w-lg flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] animate-rise sm:px-0 sm:pb-0 sm:pt-0">
        <div className="mb-8 text-center sm:mb-10">
          <div className="flex justify-center">
            <BrandLogo variant="light" size="md" href={null} />
          </div>
          <h1
            id="franchise-pick-title"
            className="mt-6 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          >
            Куда заказать?
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-white/70">
            Выберите точку — меню, адрес и доставка зависят от неё
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {FRANCHISE_LIST.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => pick(f.id)}
              className="group flex w-full flex-col gap-3 rounded-2xl border border-white/15 bg-white/10 px-5 py-5 text-left transition-[background,border-color,transform] duration-300 hover:border-[var(--gold)] hover:bg-white/15 active:scale-[0.98] sm:px-6 sm:py-6"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
                  {FRANCHISE_TAB_LABELS[f.id]}
                </span>
                <span className="shrink-0 rounded-full bg-[var(--gold)] px-3.5 py-1.5 text-sm font-semibold text-[var(--espresso)] transition group-hover:bg-[var(--gold-dark)]">
                  Выбрать
                </span>
              </div>
              <span className="flex items-start gap-2 text-sm leading-snug text-white/75">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
                {f.address}
              </span>
              <span className="flex items-center gap-2 text-sm text-white/60">
                <Clock className="h-4 w-4 shrink-0 text-[var(--gold)]" />
                {f.hours}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
