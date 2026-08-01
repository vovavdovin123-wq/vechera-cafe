"use client";

import { Clock, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useFranchise } from "@/context/FranchiseContext";
import { PAGE } from "@/lib/layout";

export function Footer() {
  const { franchise } = useFranchise();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-6 bg-[var(--espresso)] text-white sm:mt-8 pb-[env(safe-area-inset-bottom)]">
      <div
        className={`${PAGE} flex flex-col gap-5 py-7 text-base text-white/80 sm:flex-row sm:items-center sm:justify-between sm:py-8 sm:text-lg`}
      >
        <div className="flex flex-col gap-3">
          <BrandLogo variant="light" href="" size="sm" />
          <p className="text-sm text-white/55 sm:text-base">
            {year} · Вечера
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-5">
          <span className="inline-flex items-center gap-2 text-sm sm:text-base">
            <MapPin className="h-4 w-4 shrink-0 text-[var(--gold)]" />
            {franchise.shortAddress}
          </span>
          <span className="inline-flex items-center gap-2 text-sm sm:text-base">
            <Clock className="h-4 w-4 shrink-0 text-[var(--gold)]" />
            {franchise.hours}
          </span>
        </div>
      </div>
    </footer>
  );
}
