"use client";

import { Clock, ExternalLink, MapPin } from "lucide-react";
import { CleanMap } from "@/components/CleanMap";
import { useFranchise } from "@/context/FranchiseContext";
import { PAGE } from "@/lib/layout";

export function LocationSection() {
  const { franchise } = useFranchise();

  return (
    <section id="location" className={`${PAGE} py-8 sm:py-12 md:py-14`}>
      <div className="mb-6 sm:mb-8">
        <h2 className="inline-flex flex-wrap items-center gap-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
          <MapPin className="h-7 w-7 shrink-0 text-[var(--gold)] sm:h-8 sm:w-8" />
          Где мы
        </h2>
        <div className="mt-3 flex flex-col gap-2 text-sm text-ink-muted sm:flex-row sm:flex-wrap sm:gap-4 sm:text-base">
          <span className="inline-flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-[var(--gold)]" />
            {franchise.hours}
          </span>
          <a
            href={franchise.mapLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-[var(--espresso-soft)] hover:text-[var(--espresso)] hover:underline"
          >
            Открыть в Яндекс Картах
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] shadow-[var(--shadow-soft)]">
        <CleanMap
          key={franchise.id}
          coords={franchise.coords}
          title={`Карта — ${franchise.shortAddress}`}
          className="h-[240px] w-full sm:h-[320px] md:h-[380px]"
          zoom={16}
        />
      </div>
    </section>
  );
}
