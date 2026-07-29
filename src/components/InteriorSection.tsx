"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { useInterior } from "@/context/InteriorContext";
import { PAGE } from "@/lib/layout";

export function InteriorSection() {
  const { photos } = useInterior();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const programmaticRef = useRef(false);
  const userDraggingRef = useRef(false);
  const normalizeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [canScroll, setCanScroll] = useState(false);

  const visiblePhotos = useMemo(
    () => photos.filter((p) => Boolean(p.src?.trim())),
    [photos],
  );
  const loop = visiblePhotos.length > 1;
  const track = useMemo(
    () => (loop ? [...visiblePhotos, ...visiblePhotos] : visiblePhotos),
    [visiblePhotos, loop],
  );

  const getHalf = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return 0;
    return el.scrollWidth / 2;
  }, []);

  const normalizeScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || !loop) return;
    const half = getHalf();
    if (half <= 0) return;

    let next = el.scrollLeft;
    if (next >= half - 2) next -= half;
    else if (next <= 2) next += half;

    if (Math.abs(next - el.scrollLeft) < 1) return;

    programmaticRef.current = true;
    el.style.scrollBehavior = "auto";
    el.scrollLeft = next;
    el.style.scrollBehavior = "";
    programmaticRef.current = false;
  }, [loop, getHalf]);

  const scheduleNormalize = useCallback(() => {
    clearTimeout(normalizeTimerRef.current);
    normalizeTimerRef.current = setTimeout(() => {
      if (!userDraggingRef.current) normalizeScroll();
    }, 80);
  }, [normalizeScroll]);

  function updateScrollState() {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScroll(loop || el.scrollWidth > el.clientWidth + 4);
  }

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [visiblePhotos, loop]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    function onScroll() {
      updateScrollState();
      if (programmaticRef.current) return;
      if (!userDraggingRef.current) scheduleNormalize();
    }

    function onPointerDown() {
      userDraggingRef.current = true;
    }

    function onPointerUp() {
      userDraggingRef.current = false;
      scheduleNormalize();
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("resize", updateScrollState);
      clearTimeout(normalizeTimerRef.current);
    };
  }, [visiblePhotos, loop, scheduleNormalize]);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;

    const amount = Math.max(el.clientWidth * 0.75, 320);
    el.scrollBy({
      left: dir * amount,
      behavior: "smooth",
    });
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
              onClick={() => scrollByDir(-1)}
              className="rounded-full border border-[var(--line)] bg-[var(--white)] p-2 text-[var(--brown)] transition-[border-color,background] duration-300 hover:border-[var(--orange)] hover:bg-[var(--orange-soft)]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Листать вправо"
              onClick={() => scrollByDir(1)}
              className="rounded-full border border-[var(--line)] bg-[var(--white)] p-2 text-[var(--brown)] transition-[border-color,background] duration-300 hover:border-[var(--orange)] hover:bg-[var(--orange-soft)]"
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
            className="interior-track flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {track.map((photo, index) => (
              <div
                key={`${photo.id}-${index}`}
                className="relative h-[220px] w-[min(78vw,340px)] shrink-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--cream-dark)] shadow-[var(--shadow-soft)] sm:h-[300px] sm:w-[min(62vw,480px)] lg:h-[360px] lg:w-[520px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt=""
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
