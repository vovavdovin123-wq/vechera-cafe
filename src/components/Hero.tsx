"use client";

import { BrandLogo } from "@/components/BrandLogo";
import { StringLights } from "@/components/StringLights";
import { PAGE } from "@/lib/layout";
import { useFranchise } from "@/context/FranchiseContext";

export function Hero() {
  const { franchise } = useFranchise();

  return (
    <section className={`${PAGE} py-5 sm:py-8 md:py-10`}>
      <div className="square-hero animate-rise relative px-4 pb-10 pt-5 text-white sm:px-8 sm:pb-12 sm:pt-6 md:px-10 md:pb-14 md:pt-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[5] px-1 sm:px-4">
          <StringLights
            bulbs={14}
            variant="wide"
            className="mx-auto w-full max-w-3xl opacity-95"
          />
        </div>
        <div className="relative z-10 flex flex-col items-center pt-8 text-center sm:pt-10 md:pt-11">
          <BrandLogo variant="light" size="lg" href="" />
          <p className="mt-4 max-w-xl text-base font-normal leading-relaxed text-white/90 sm:mt-6 sm:text-xl md:text-2xl">
            Нежные вкусы на открытом воздухе — сэндвичи, вафли и уютная
            атмосфера
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--gold)] sm:text-base md:text-lg">
            {franchise.shortAddress}
          </p>
          <div className="mt-6 flex w-full max-w-md flex-col items-stretch justify-center gap-2.5 sm:mt-8 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center">
            <a href="#menu" className="btn-soft w-full sm:w-auto">
              Наше меню
            </a>
            <a
              href="#location"
              className="inline-flex w-full items-center justify-center rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-[0.9375rem] font-medium text-white transition-[background,border-color] duration-300 hover:border-[var(--gold)] hover:bg-white/18 sm:w-auto"
            >
              Как добраться
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
