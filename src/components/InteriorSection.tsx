"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { useInterior } from "@/context/InteriorContext";
import { PAGE } from "@/lib/layout";

export function InteriorSection() {
  const { photos, contentReady } = useInterior();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const visiblePhotos = useMemo(
    () => photos.filter((p) => Boolean(p.src?.trim())),
    [photos],
  );

  function updateScrollState() {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const overflow = max > 4;
    setCanScroll(overflow);
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft >= max - 4);
  }

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    updateScrollState();

    const onScroll = () => updateScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [visiblePhotos]);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.72, 300);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  if (!contentReady) {
    return (
      <section className={`${PAGE} py-10 sm:py-12`} aria-busy>
        <div className="h-48 animate-pulse rounded-2xl bg-[var(--bg-deep)]/60" />
      </section>
    );
  }

  return (
    <section id="interior" className={`${PAGE} py-8 sm:py-12 md:py-14`}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6 sm:gap-4">
        <div>
          <p className="brand-section-label inline-flex items-center gap-2 text-sm">
            <Images className="h-4 w-4" />
            Интерьер
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
            Атмосфера
          </h2>
        </div>

        {canScroll && (
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Листать влево"
              disabled={atStart}
              onClick={() => scrollByDir(-1)}
              className="rounded-full border border-[var(--line)] bg-[var(--white)] p-2 text-[var(--brown)] transition-[border-color,background,opacity] duration-300 hover:border-[var(--orange)] hover:bg-[var(--orange-soft)] disabled:opacity-35"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Листать вправо"
              disabled={atEnd}
              onClick={() => scrollByDir(1)}
              className="rounded-full border border-[var(--line)] bg-[var(--white)] p-2 text-[var(--brown)] transition-[border-color,background,opacity] duration-300 hover:border-[var(--orange)] hover:bg-[var(--orange-soft)] disabled:opacity-35"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {visiblePhotos.length === 0 ? (
        <p className="text-ink-muted">Фото интерьера пока не добавлены.</p>
      ) : (
        <div className="interior-viewport relative -mx-4 sm:-mx-5 md:-mx-6 lg:-mx-8">
          <div
            ref={scrollerRef}
            className="interior-track flex gap-4 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {visiblePhotos.map((photo) => (
              <div
                key={photo.id}
                className="interior-card shrink-0"
              >
                <div className="interior-card-media relative h-[220px] w-[min(78vw,340px)] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--cream-dark)] sm:h-[300px] sm:w-[min(62vw,480px)] lg:h-[360px] lg:w-[520px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.src}
                    alt=""
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
